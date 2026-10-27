import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { createClient } from "@supabase/supabase-js";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { mkdir } from "node:fs/promises";

/** Only disposable users/records. No traces, raw reports, auth screenshots or logs. */
export async function onboardingChecks(stack, origin, connection, record) {
  if (origin !== "http://127.0.0.1:3100" || connection.url !== "http://127.0.0.1:55321") throw new Error("Local endpoints required");
  async function check(name, fn) {
    let passed = false;
    try { passed = (await fn()) !== false; } catch { /* never serialize browser/Auth errors */ }
    record(name, passed);
    if (!passed) throw new Error("Local UI assertion failed");
  }
  const users = [];
  for (let i = 0; i < 2; i++) {
    const sdk = createClient(connection.url, connection.key, { auth: { persistSession: false, autoRefreshToken: false } });
    const credentials = { email: `linde-onboarding-${randomUUID()}@example.invalid`, password: `Local!9a${randomBytes(24).toString("base64url")}` };
    await check(`local-auth-user-${i}`, async () => { const result = await sdk.auth.signUp(credentials); users.push({ ...credentials, id: result.data.user?.id }); return !result.error && Boolean(result.data.user?.id); });
  }
  const browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {}) });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, serviceWorkers: "block" });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  const failures = [];
  page.on("pageerror", () => failures.push(true));
  const traffic = [];
  page.on("request", req => { const url = new URL(req.url()); if (url.origin === origin && url.pathname.startsWith("/api/v1/")) traffic.push({ path: url.pathname, method: req.method() }); });
  let activeUser = users[0];
  const ledgerKey = () => `linde.manual-onboarding.v1.${createHash("sha256").update(activeUser.id).digest("hex")}`;
  const ledger = () => page.evaluate(key => JSON.parse(localStorage.getItem(key) || "null"), ledgerKey());
  const savedDraft = () => page.evaluate(() => Object.keys(sessionStorage).filter(k => k.startsWith("linde.brand-start.v1.")).map(k => sessionStorage.getItem(k)));
  const call = (path, method = "GET", body, headers) => page.evaluate(async ({ path, method, body, headers }) => {
    const res = await fetch(`/api/v1${path}`, { method, headers: { "Content-Type": "application/json", ...headers }, ...(body ? { body: JSON.stringify(body) } : {}) });
    return { status: res.status, body: await res.json(), etag: res.headers.get("etag") };
  }, { path, method, body, headers });
  async function login(user) {
    activeUser = user;
    await page.goto(`${origin}/auth/login?next=%2Fapp`);
    await page.getByLabel("Correo electrónico").fill(user.email);
    await page.getByLabel("Contraseña", { exact: true }).fill(user.password);
    await page.getByRole("button", { name: "Entrar", exact: true }).click();
    await page.waitForURL(`${origin}/app`);
    await page.getByRole("button", { name: "Cerrar sesión", exact: true }).waitFor();
  }
  async function manual(name = "Marca local de validación", description = "Una descripción propia para comprobar la persistencia local.") {
    if (await page.getByRole("button", { name: "Comenzar manualmente", exact: true }).count()) await page.getByRole("button", { name: "Comenzar manualmente", exact: true }).click();
    await page.getByLabel("Nombre de tu marca").fill(name);
    await page.getByLabel("¿Qué ofrece tu empresa?").fill(description);
  }
  async function complete() { await page.getByText("Marca y descripción guardadas. Se conserva el borrador local.", { exact: true }).waitFor(); }
  async function resetAttempt() {
    await page.evaluate(key => localStorage.removeItem(key), ledgerKey());
    await page.reload(); await manual();
  }
  async function screenshot(file) {
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: `replica/clone-screens/${file}`, fullPage: true });
  }
  try {
    await mkdir("replica/clone-screens", { recursive: true });
    await check("public-url-draft-only", async () => {
      await page.goto(origin);
      await page.getByLabel("Dirección de tu empresa").fill("https://example.invalid/mi-empresa");
      await page.getByRole("button", { name: "Guardar dirección" }).click();
      await page.getByText(/Borrador guardado solo en esta pestaña/).waitFor();
      return traffic.length === 0;
    });
    const publicDraft = await page.evaluate(() => sessionStorage.getItem("linde.brand-start.v1"));
    await check("real-ui-login-owner-a", () => login(users[0]));
    await manual();
    await check("private-empty-required-and-focus", async () => {
      await page.getByLabel("Nombre de tu marca").fill("");
      await page.getByRole("button", { name: "Crear mi marca", exact: true }).click();
      return await page.getByLabel("Nombre de tu marca").evaluate(el => el === document.activeElement && el.getAttribute("aria-invalid") === "true");
    });
    await manual();
    await check("private-storage-failure-no-api", async () => {
      await page.evaluate(() => { window.originalSetItem = Storage.prototype.setItem; Storage.prototype.setItem = function(key, value) { if (key.startsWith("linde.manual-onboarding")) throw new Error("Test storage failure"); return window.originalSetItem.call(this, key, value); }; });
      const before = traffic.length;
      await page.getByRole("button", { name: "Crear mi marca", exact: true }).click();
      await page.getByRole("alert").filter({ hasText: "No pudimos conservar" }).waitFor();
      await page.evaluate(() => { Storage.prototype.setItem = window.originalSetItem; });
      return traffic.length === before && (await savedDraft()).length === 1;
    });
    await check("private-desktop-empty-accessibility", async () => {
      const audit = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
      await screenshot("D02-persistent-desktop.png");
      return audit.violations.length === 0 && await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
    });
    await check("manual-double-submit-and-two-tabs-one-brand", async () => {
      const tab = await context.newPage(); await tab.goto(`${origin}/app`);
      await tab.getByRole("button", { name: "Comenzar manualmente", exact: true }).click();
      await tab.getByLabel("Nombre de tu marca").fill("Marca local de validación");
      await tab.getByLabel("¿Qué ofrece tu empresa?").fill("Una descripción propia para comprobar la persistencia local.");
      await Promise.all([
        page.getByLabel("Nombre de tu marca").evaluate(el => { el.form.requestSubmit(); el.form.requestSubmit(); }),
        tab.getByLabel("Nombre de tu marca").evaluate(el => el.form.requestSubmit()),
      ]);
      await page.getByText("Guardado confirmado", { exact: true }).waitFor();
      if (await page.getByRole("alert").filter({ hasText: "otra pestaña" }).count()) {
        await page.getByRole("button", { name: "Comprobar guardado", exact: true }).click();
      }
      await complete(); await tab.close();
      const value = await stack.sql(`select (select count(*) from public.workspaces where owner_user_id='${users[0].id}') || ':' || (select count(*) from public.brands b join public.workspaces w on w.id=b.workspace_id where w.owner_user_id='${users[0].id}') || ':' || (select count(*) from public.brand_revisions r join public.workspaces w on w.id=r.workspace_id where w.owner_user_id='${users[0].id}');`);
      return value === "1:1:2";
    });
    const a = await ledger();
    await check("description-confirmed-via-real-api", async () => { const result = await call(`/brands/${a.brandId}`); return result.status === 200 && result.body.data.current_revision.profile_document.identity.description === a.description && a.stage === "complete"; });
    await check("private-reload-restores-receipt-and-draft", async () => { await page.reload(); await complete(); return (await savedDraft()).some(raw => JSON.parse(raw).description === a.description); });
    await check("confirmed-retry-is-read-only", async () => { const before = traffic.length; await page.getByRole("button", { name: "Comprobar guardado", exact: true }).click(); await complete(); await page.waitForFunction(() => !document.querySelector("form.brand-form")?.getAttribute("aria-busy")); return traffic.slice(before).every(c => c.method === "GET"); });
    await check("same-account-second-tab-no-duplicate", async () => { const tab = await context.newPage(); await tab.goto(`${origin}/app`); await tab.getByText("Marca y descripción guardadas. Se conserva el borrador local.", { exact: true }).waitFor(); await tab.close(); return Number(await stack.sql(`select count(*) from public.brands where workspace_id='${a.workspaceId}';`)) === 1; });
    await check("private-success-desktop-accessibility", async () => { const audit = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze(); await screenshot("D02-persistent-success-desktop.png"); return audit.violations.length === 0; });
    await check("private-success-mobile-accessibility-reflow", async () => { await page.setViewportSize({ width: 390, height: 844 }); const audit = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze(); await screenshot("D02-persistent-success-mobile.png"); return audit.violations.length === 0 && await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth); });
    const staleTab = await context.newPage(); await staleTab.goto(`${origin}/app`);
    await staleTab.getByText("Guardado confirmado", { exact: true }).waitFor();
    await check("logout-keeps-both-drafts-and-ledger", async () => { await page.getByRole("button", { name: "Cerrar sesión", exact: true }).click(); await page.waitForURL(/\/auth\/login/); return await page.evaluate(() => Boolean(sessionStorage.getItem("linde.brand-start.v1"))) && (await savedDraft()).length === 1 && (await ledger()).brandId === a.brandId; });
    await check("real-ui-login-owner-b", () => login(users[1]));
    await check("stale-tab-discards-intent-after-account-change", async () => {
      let calls = 0; staleTab.on("request", request => { if (new URL(request.url()).pathname.startsWith("/api/v1/")) calls++; });
      await staleTab.getByRole("button", { name: "Comprobar guardado", exact: true }).click();
      await staleTab.getByRole("button", { name: "Comenzar manualmente", exact: true }).waitFor();
      const isolated = calls === 0 && await staleTab.getByText(a.brandId, { exact: false }).count() === 0;
      await staleTab.close(); return isolated;
    });
    await check("account-switch-does-not-render-other-user-data", async () => { await manual("Segunda marca local", "Datos propios de la segunda cuenta local."); return await page.getByText(a.brandId, { exact: false }).count() === 0 && await page.getByRole("heading", { name: "Borrador en esta pestaña" }).count() === 0; });
    await check("cross-user-brand-api-is-404", async () => (await call(`/brands/${a.brandId}`)).status === 404);
    await check("existing-workspace-local-fixture", async () => (await call("/workspaces", "POST", { name: "Espacio local existente" }, { "Idempotency-Key": randomUUID() })).status === 200);
    await check("offline-keeps-draft-and-recovery-record", async () => { await context.setOffline(true); await page.getByRole("button", { name: "Crear mi marca", exact: true }).click(); await page.getByRole("alert").filter({ hasText: "No hay conexión" }).waitFor(); await context.setOffline(false); return (await savedDraft()).length === 2 && (await ledger()) === null; });
    let patchCount = 0;
    await page.route("**/api/v1/brands/*/profile", async route => { patchCount++; await route.fetch(); await route.abort("failed"); });
    const beforeResume = traffic.length;
    await check("lost-patch-response-retains-confirmed-brand-id", async () => { await page.getByRole("button", { name: "Crear mi marca", exact: true }).click(); await page.getByRole("alert").filter({ hasText: "No hay conexión" }).waitFor(); return await page.getByText(/ID de marca confirmado:/).count() === 1; });
    await page.unroute("**/api/v1/brands/*/profile");
    await check("existing-workspace-was-not-created-again", () => !traffic.slice(beforeResume).some(c => c.path === "/api/v1/workspaces" && c.method === "POST"));
    await check("lost-patch-reload-reconciles-without-duplicate", async () => { await page.reload(); const before = traffic.length; await page.getByRole("button", { name: "Comprobar y continuar", exact: true }).click(); await complete(); return patchCount === 1 && traffic.slice(before).every(c => c.method === "GET"); });
    await check("expired-session-preserves-operation", async () => { await context.clearCookies(); await page.getByRole("button", { name: "Comprobar guardado", exact: true }).click(); await page.waitForURL(/\/auth\/login/); return (await savedDraft()).length === 2 && (await ledger()).stage === "complete"; });
    await login(users[1]); await complete();
    await resetAttempt();
    await page.route("**/api/v1/brands/*/profile", async route => {
      const body = route.request().postDataJSON(); body.profile_document.identity.description = "Cambio concurrente de la misma cuenta local.";
      await route.fetch({ postData: JSON.stringify(body) }); await route.continue();
    });
    await check("real-conflict-keeps-local-description", async () => { await page.getByRole("button", { name: "Crear mi marca", exact: true }).click(); await page.getByRole("alert").filter({ hasText: "han cambiado" }).waitFor(); return await page.getByLabel("¿Qué ofrece tu empresa?").inputValue() === "Una descripción propia para comprobar la persistencia local."; });
    await page.unroute("**/api/v1/brands/*/profile");
    await check("conflict-retry-never-overwrites-newer-revision", async () => { const before = traffic.length; await page.getByRole("button", { name: "Comprobar y continuar", exact: true }).click(); await page.getByRole("alert").filter({ hasText: "han cambiado" }).waitFor(); return traffic.slice(before).every(c => c.method === "GET"); });
    await resetAttempt();
    let creates = 0;
    await page.route("**/api/v1/workspaces/*/brands", async route => { creates++; await route.fetch(); await route.abort("failed"); });
    await check("lost-create-response-is-uncertain", async () => { await page.getByRole("button", { name: "Crear mi marca", exact: true }).click(); await page.getByRole("alert").filter({ hasText: "No sabemos si la marca" }).waitFor(); return await page.getByRole("button", { name: "Comprobar y continuar", exact: true }).isDisabled(); });
    await page.unroute("**/api/v1/workspaces/*/brands");
    await check("uncertain-create-survives-reload-without-retry", async () => { await page.reload(); await page.getByRole("alert").filter({ hasText: "No sabemos si la marca" }).waitFor(); return creates === 1 && await page.getByRole("button", { name: "Comprobar y continuar", exact: true }).isDisabled(); });
    await check("uncertain-mobile-accessibility", async () => { const audit = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze(); await screenshot("D02-persistent-uncertain-mobile.png"); return audit.violations.length === 0 && await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth); });
    await check("public-draft-and-public-behavior-unchanged", async () => { await page.goto(origin); return await page.evaluate(() => sessionStorage.getItem("linde.brand-start.v1")) === publicDraft && await page.getByRole("button", { name: "Crear mi marca", exact: true }).count() === 0; });
    await check("no-browser-runtime-errors", () => failures.length === 0);
  } finally { await context.close(); await browser.close(); }
}
