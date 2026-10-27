import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { createClient } from "@supabase/supabase-js";
import { randomBytes, randomUUID } from "node:crypto";
import { mkdir } from "node:fs/promises";

export async function dnaChecks(stack, origin, connection, record) {
  if (origin !== "http://127.0.0.1:3100" || connection.url !== "http://127.0.0.1:55321") throw new Error("Local endpoints required");
  async function check(name, fn) { let ok = false; try { ok = await fn() !== false; } catch { /* no raw browser/Auth errors */ } record(name, ok); if (!ok) throw new Error("D04 assertion failed"); }
  const users = [];
  for (let i = 0; i < 2; i++) {
    const sdk = createClient(connection.url, connection.key, { auth: { persistSession: false, autoRefreshToken: false } });
    const credentials = { email: `linde-dna-${randomUUID()}@example.invalid`, password: `Local!9a${randomBytes(24).toString("base64url")}` };
    await check(`dna-local-auth-${i}`, async () => { const r = await sdk.auth.signUp(credentials); users.push({ ...credentials, id: r.data.user?.id }); return !r.error && Boolean(r.data.user?.id); });
  }
  async function fixtureFetch(route, options = {}) {
    try { return await route.fetch({ ...options, timeout: 15000 }); }
    catch { return null; } // Never let request logs/headers escape on fixture failures.
  }
  const browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {}) });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, serviceWorkers: "block", permissions: ["clipboard-read", "clipboard-write"] });
  const page = await context.newPage(); page.setDefaultTimeout(60000);
  let dismiss = false; page.on("dialog", async d => { try { if (dismiss) await d.dismiss(); else await d.accept(); } catch { /* closed */ } });
  const runtimeErrors = []; page.on("pageerror", () => runtimeErrors.push(true));
  const calls = []; page.on("request", req => { const u = new URL(req.url()); if (u.pathname.startsWith("/api/v1/")) calls.push({ path: u.pathname, method: req.method(), etag: req.headers()["if-match"] }); });
  const call = (path, method = "GET", body, etag) => page.evaluate(async args => {
    const r = await fetch(`/api/v1${args.path}`, { method: args.method, headers: { "Content-Type": "application/json", ...(args.etag ? { "If-Match": args.etag } : {}) }, ...(args.body ? { body: JSON.stringify(args.body) } : {}) });
    return { status: r.status, data: (await r.json()).data, etag: r.headers.get("etag") };
  }, { path, method, body, etag });
  async function login(user) { await page.goto(`${origin}/auth/login?next=%2Fapp`); await page.getByLabel("Correo electrónico").fill(user.email); await page.getByLabel("Contraseña", { exact: true }).fill(user.password); await page.getByRole("button", { name: "Entrar", exact: true }).click(); await page.waitForURL(`${origin}/app`); }
  const saveButton = () => page.getByRole("button", { name: "Guardar borrador", exact: true });
  async function saved() { await page.getByRole("status").filter({ hasText: /Perfil guardado\. Revisión/ }).waitFor(); }
  async function screenshot(name) { await page.evaluate(() => document.fonts.ready); await page.screenshot({ path: `replica/clone-screens/${name}`, fullPage: true }); }
  const audit = async () => (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze()).violations.length === 0 && await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
  let id, workspaceId, url;
  try {
    await mkdir("replica/clone-screens", { recursive: true });
    await check("dna-real-owner-login", () => login(users[0]));
    await check("dna-d02-real-create-and-confirmed-link", async () => {
      await page.getByRole("button", { name: "Comenzar manualmente", exact: true }).click();
      await page.getByLabel("Nombre de tu marca").fill("Marca local de diseño"); await page.getByLabel("¿Qué ofrece tu empresa?").fill("Una identidad propia para proyectos creativos.");
      await page.getByRole("button", { name: "Crear mi marca", exact: true }).click();
      const link = page.getByRole("link", { name: "Revisar Brand DNA", exact: true }); await link.waitFor(); url = await link.getAttribute("href"); id = url.split("/")[3];
      const r = await call(`/brands/${id}`); workspaceId = r.data.brand.workspace_id;
      return r.status === 200 && r.data.current_revision.profile_document.identity.description === "Una identidad propia para proyectos creativos.";
    });
    await check("dna-loading-skeleton-accessibility", async () => {
      let release; const gate = new Promise(resolve => { release = resolve; });
      const match = /\/api\/v1\/brands\/[0-9a-f-]+\?history=1&limit=20$/;
      await page.route(match, async route => { await gate; await route.continue().catch(() => {}); });
      let ok;
      try { await page.getByRole("link", { name: "Revisar Brand DNA", exact: true }).click(); await page.getByRole("status", { name: "Cargando Brand DNA" }).waitFor(); ok = await audit() && await page.getByLabel("Nombre del perfil de marca").count() === 0; await screenshot("D04-loading-desktop.png"); }
      finally { release(); await page.unroute(match); }
      await page.getByLabel("Nombre del perfil de marca").waitFor(); return ok;
    });
    await check("dna-real-revision-and-authorized-navigation", async () => { const r = await call(`/brands/${id}`); return r.data.current_revision.revision_number === 2 && await page.getByRole("navigation", { name: "Navegación principal" }).first().getByRole("link", { name: "Brand DNA" }).getAttribute("href") === url; });
    await check("dna-five-required-fields-before-approval", async () => { const before = calls.length; await page.getByRole("button", { name: "Aprobar perfil", exact: true }).click(); await page.getByText("Completa este campo para aprobar el perfil.").first().waitFor(); return calls.slice(before).every(c => c.method === "GET") && await page.getByLabel("Idioma del contenido").evaluate(el => el === document.activeElement); });
    await check("dna-incomplete-validation-accessibility", async () => { const ok = await audit(); await screenshot("D04-incomplete-desktop.png"); return ok; });
    await page.getByLabel("Nombre del perfil de marca").fill("Perfil creativo de validación");
    await page.getByLabel("Sitio web (opcional)", { exact: true }).fill("https://example.invalid/perfil");
    await page.getByLabel("Idioma del contenido").fill("es-MX"); await page.getByLabel("Tono de comunicación").fill("Cercano, claro y preciso."); await page.getByLabel("Público objetivo").fill("Equipos que desarrollan proyectos creativos propios.");
    await page.getByRole("button", { name: "Añadir color", exact: true }).click(); await page.getByLabel("Color HEX 1").fill("#255D49");
    await page.getByLabel("Familia tipográfica (opcional)").fill("Inter");
    await page.getByRole("button", { name: "Añadir competidor", exact: true }).click(); await page.getByLabel("Nombre del competidor 1").fill("Empresa local de referencia"); await page.getByLabel("URL del competidor 1 (opcional)").fill("https://competidor.example.invalid");
    await check("dna-no-approval-of-unsaved-local-data", () => page.getByRole("button", { name: "Aprobar perfil", exact: true }).isDisabled());
    await check("dna-save-with-real-etag-and-no-duplicate-submit", async () => {
      const before = await call(`/brands/${id}`); const count = calls.length;
      await page.getByLabel("Nombre del perfil de marca").evaluate(el => { el.form.requestSubmit(); el.form.requestSubmit(); }); await saved();
      const writes = calls.slice(count).filter(c => c.method === "PATCH");
      const fresh = await call(`/brands/${id}?history=1`);
      return writes.length === 1 && writes[0].etag === before.etag && fresh.data.current_revision.revision_number === 3 && fresh.data.current_revision.profile_document.visual.colors[0] === "#255D49" && fresh.data.history.items.length === 3;
    });
    await check("dna-saved-desktop-axe-and-screenshot", async () => { const ok = await audit(); await screenshot("D04-draft-desktop.png"); return ok; });
    await check("dna-saved-mobile-axe-and-screenshot", async () => { await page.setViewportSize({ width: 390, height: 844 }); const ok = await audit(); await screenshot("D04-draft-mobile.png"); return ok; });
    await check("dna-320px-and-enlarged-text-reflow", async () => {
      await page.setViewportSize({ width: 320, height: 844 });
      const style = await page.addStyleTag({ content: "html { font-size: 200%; }" });
      const ok = await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
      await style.evaluate(node => node.remove()); await page.setViewportSize({ width: 390, height: 844 }); return ok;
    });
    await check("dna-d02-historical-receipt-retains-confirmed-detail-link", async () => {
      await page.getByRole("link", { name: "Volver a configurar marca", exact: true }).click();
      await page.getByRole("button", { name: "Comprobar guardado", exact: true }).click();
      await page.getByRole("alert").filter({ hasText: "han cambiado" }).waitFor();
      const link = page.getByRole("link", { name: "Revisar Brand DNA", exact: true });
      const known = await link.getAttribute("href") === url;
      await link.click(); await page.getByLabel("Nombre del perfil de marca").waitFor(); return known;
    });
    await check("dna-real-approval-preserves-revision-count", async () => { await page.getByRole("button", { name: "Aprobar perfil", exact: true }).click(); await page.getByRole("status").filter({ hasText: "Revisión 3 aprobada." }).waitFor(); const r = await call(`/brands/${id}?history=1`); return r.data.current_revision.approval_status === "approved" && r.data.history.items.length === 3 && await page.getByRole("button", { name: "Aprobar perfil", exact: true }).isDisabled(); });
    await check("dna-approved-mobile-axe", async () => { const ok = await audit(); await screenshot("D04-approved-mobile.png"); return ok; });
    await check("dna-unsaved-edits-reload-and-restore", async () => { await page.getByLabel("Tono de comunicación").fill("Una nueva voz editorial propia."); await page.reload(); await page.getByLabel("Tono de comunicación").waitFor(); return await page.getByLabel("Tono de comunicación").inputValue() === "Una nueva voz editorial propia." && await page.getByText("Tienes cambios locales sin guardar.", { exact: true }).count() === 1; });
    await check("dna-leave-cancel-keeps-editor", async () => { dismiss = true; await page.getByRole("link", { name: "Volver a configurar marca" }).click(); dismiss = false; return page.url() === `${origin}${url}` && await page.getByLabel("Tono de comunicación").inputValue() === "Una nueva voz editorial propia."; });
    await check("dna-edit-after-approval-retains-approved-snapshot", async () => { await saveButton().click(); await saved(); const r = await call(`/brands/${id}?history=1`); return r.data.current_revision.revision_number === 4 && r.data.current_revision.approval_status === "draft" && r.data.approved_revision.revision_number === 3 && r.data.approved_revision.profile_document.voice.tone === "Cercano, claro y preciso." && r.data.history.items.length === 4; });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await check("dna-new-draft-and-approved-desktop-axe", async () => { const ok = await audit(); await screenshot("D04-approved-and-draft-desktop.png"); return ok; });
    await check("dna-real-concurrent-save-409-keeps-local-data", async () => {
      await page.getByLabel("Descripción", { exact: true }).fill("Mi edición local que todavía no se ha guardado.");
      const r = await call(`/brands/${id}`); const other = await call(`/brands/${id}/profile`, "PATCH", { profile_document: { voice: { tone: "Cambio concurrente desde otra sesión autorizada." } } }, r.etag);
      await saveButton().click(); await page.getByRole("alert").filter({ hasText: "409" }).waitFor();
      return other.status === 200 && await page.getByLabel("Descripción", { exact: true }).inputValue() === "Mi edición local que todavía no se ha guardado." && await saveButton().isDisabled();
    });
    await check("dna-consult-current-version-does-not-merge", async () => { await page.getByRole("button", { name: "Consultar versión actual", exact: true }).click(); await page.getByRole("heading", { name: "Versión del servidor · revisión 5" }).waitFor(); await page.getByText("Consultar contenido de la versión actual", { exact: true }).click(); return await page.getByText("Cambio concurrente desde otra sesión autorizada.", { exact: true }).count() >= 1 && await page.getByLabel("Descripción", { exact: true }).inputValue() === "Mi edición local que todavía no se ha guardado."; });
    await check("dna-conflict-backup-download-and-copy", async () => { await page.getByRole("button", { name: "Copiar mis cambios (JSON)", exact: true }).click(); await page.getByText("Cambios copiados como JSON.", { exact: true }).waitFor(); const copied = await page.evaluate(() => navigator.clipboard.readText()); const download = page.waitForEvent("download"); await page.getByRole("button", { name: "Descargar mis cambios", exact: true }).click(); return copied.includes("Mi edición local") && (await download).suggestedFilename() === "linde-brand-dna-edicion-local.json"; });
    await check("dna-conflict-desktop-axe", async () => { const ok = await audit(); await screenshot("D04-conflict-desktop.png"); return ok; });
    await check("dna-explicit-reload-requires-confirmation", async () => { dismiss = true; await page.getByRole("button", { name: "Cargar versión del servidor", exact: true }).click(); dismiss = false; const kept = await page.getByLabel("Descripción", { exact: true }).inputValue() === "Mi edición local que todavía no se ha guardado."; await page.getByRole("button", { name: "Cargar versión del servidor", exact: true }).click(); await page.getByRole("status").filter({ hasText: "Versión del servidor cargada." }).waitFor(); return kept && await page.getByLabel("Tono de comunicación").inputValue() === "Cambio concurrente desde otra sesión autorizada."; });
    let patchCount = 0;
    await page.route("**/api/v1/brands/*/profile", async route => { patchCount++; await fixtureFetch(route); await route.abort("failed").catch(() => {}); });
    await check("dna-lost-save-response-blocks-retry", async () => { await page.getByLabel("Descripción", { exact: true }).fill("Guardado real con una respuesta de red perdida."); await saveButton().click(); await page.getByText("Escritura por comprobar", { exact: true }).waitFor(); return await saveButton().isDisabled(); });
    await check("dna-uncertain-write-accessibility", audit);
    await page.unroute("**/api/v1/brands/*/profile");
    await check("dna-lost-save-reload-confirms-without-duplicate-revision", async () => { await page.reload(); await page.getByRole("status").filter({ hasText: "Guardado confirmado tras consultar la revisión actual." }).waitFor(); const r = await call(`/brands/${id}?history=1`); return patchCount === 1 && r.data.current_revision.revision_number === 6 && r.data.history.items.length === 6; });
    let approvals = 0;
    await page.route("**/api/v1/brands/*/profile/approve", async route => { approvals++; await fixtureFetch(route); await route.abort("failed").catch(() => {}); });
    await check("dna-lost-approval-response-blocks-retry", async () => { await page.getByRole("button", { name: "Aprobar perfil", exact: true }).click(); await page.getByText("Escritura por comprobar", { exact: true }).waitFor(); return await page.getByRole("button", { name: "Aprobar perfil", exact: true }).isDisabled(); });
    await page.unroute("**/api/v1/brands/*/profile/approve");
    await check("dna-approval-reconciles-read-without-resubmission", async () => { await page.getByRole("button", { name: "Consultar versión actual", exact: true }).click(); await page.getByRole("status").filter({ hasText: "Aprobación confirmada tras consultar la revisión actual." }).waitFor(); return approvals === 1; });
    await check("dna-offline-preserves-edits", async () => { await page.getByLabel("Descripción", { exact: true }).fill("Edición conservada al perder conexión y sesión."); await context.setOffline(true); await saveButton().click(); await page.getByRole("alert").filter({ hasText: "No pudimos conectar" }).waitFor(); await context.setOffline(false); return await page.getByLabel("Descripción", { exact: true }).inputValue() === "Edición conservada al perder conexión y sesión."; });
    await check("dna-offline-error-accessibility", audit);
    await check("dna-session-expiry-cannot-write", async () => { const before = calls.filter(c => c.method === "PATCH").length; await context.clearCookies(); await saveButton().click(); await page.waitForURL(/\/auth\/login/); return calls.filter(c => c.method === "PATCH").length === before; });
    await login(users[0]);
    await check("dna-same-account-recovers-after-login", async () => { await page.goto(`${origin}${url}`); await page.getByLabel("Descripción", { exact: true }).waitFor(); return await page.getByLabel("Descripción", { exact: true }).inputValue() === "Edición conservada al perder conexión y sesión."; });
    await page.getByRole("button", { name: "Cerrar sesión", exact: true }).click(); await page.waitForURL(/\/auth\/login/);
    await check("dna-real-second-user-login", () => login(users[1]));
    let otherId;
    await check("dna-second-workspace-and-brand-local-only", async () => { const w = await page.evaluate(async key => { const r = await fetch("/api/v1/workspaces", { method: "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": key }, body: JSON.stringify({ name: "Segundo espacio local" }) }); return { status: r.status, data: (await r.json()).data }; }, randomUUID()); const b = await call(`/workspaces/${w.data.workspace.id}/brands`, "POST", { name: "Segunda marca aislada" }); otherId = b.data.brand_id; return w.status === 200 && b.status === 201 && w.data.workspace.id !== workspaceId; });
    await check("dna-cross-workspace-api-hidden", async () => (await call(`/brands/${id}`)).status === 404);
    await check("dna-direct-unauthorized-route-is-404", async () => { const r = await page.goto(`${origin}${url}`); return r.status() === 404 && await page.getByText("Perfil creativo de validación", { exact: true }).count() === 0; });
    await check("dna-denied-route-accessibility", audit);
    await check("dna-own-authorized-direct-url", async () => { await page.goto(`${origin}/app/brands/${otherId}/dna`); await page.getByLabel("Nombre del perfil de marca").waitFor(); return await page.getByLabel("Nombre del perfil de marca").inputValue() === "Segunda marca aislada"; });
    await stack.sql(`insert into public.memberships(workspace_id,user_id,role,status) values ('${workspaceId}','${users[1].id}','member','active');`);
    await check("dna-member-context-is-brand-membership-not-owned-workspace", async () => { await page.goto(`${origin}${url}`); await page.getByLabel("Descripción", { exact: true }).waitFor(); return await page.getByRole("button", { name: "Aprobar perfil", exact: true }).count() === 0 && await page.getByText("Solo el propietario puede aprobar este perfil. Puedes guardar borradores.", { exact: true }).count() === 1; });
    await check("dna-other-account-local-edits-not-exposed", async () => await page.getByLabel("Descripción", { exact: true }).inputValue() === "Guardado real con una respuesta de red perdida.");
    await check("dna-member-can-save-draft-not-approve", async () => { await page.getByLabel("Descripción", { exact: true }).fill("Revisión aportada por un miembro autorizado local."); await saveButton().click(); await saved(); const r = await call(`/brands/${id}?history=1`); const denied = await call(`/brands/${id}/profile/approve`, "POST", { revision_id: r.data.current_revision.id }, r.etag); return denied.status === 403 && r.data.current_revision.approval_status === "draft" && r.data.approved_revision.revision_number === 6 && r.data.history.items.length === 7; });
    await check("dna-member-mobile-accessibility", async () => { await page.setViewportSize({ width: 390, height: 844 }); const ok = await audit(); await screenshot("D04-member-mobile.png"); return ok; });
    await stack.sql(`update public.memberships set status='revoked' where workspace_id='${workspaceId}' and user_id='${users[1].id}';`);
    await check("dna-revoked-membership-blocks-api-and-route", async () => { const r = await call(`/brands/${id}`); const denied = await page.goto(`${origin}${url}`); return r.status === 404 && denied.status() === 404; });
    const anon = await browser.newContext(); const anonPage = await anon.newPage();
    await check("dna-anonymous-route-is-protected", async () => { await anonPage.goto(`${origin}${url}`); return new URL(anonPage.url()).pathname === "/auth/login"; }); await anon.close();
    await check("dna-history-immutable-approved-snapshots", async () => await stack.sql(`select count(*) from public.brand_revisions where brand_id='${id}' and approval_status='approved';`) === "2");
    await check("dna-no-browser-runtime-errors", () => runtimeErrors.length === 0);
  } finally { await context.close(); await browser.close(); }
}
