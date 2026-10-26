import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdir } from "node:fs/promises";

for (const screen of [
  { path: "login", heading: "Tu espacio te espera.", file: "login" },
  { path: "register", heading: "Empieza con tu cuenta.", file: "register" },
  { path: "recover", heading: "Recupera el acceso.", file: "recover" },
  { path: "verify", heading: "Confirma tu correo.", file: "verify" },
]) {
  test(`D01 ${screen.path}: real page, responsive and accessible`, async ({ page }, info) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const response = await page.goto(`/auth/${screen.path}`);
    expect(response?.headers()["cache-control"]).toContain("no-store");
    await expect(page.getByRole("heading", { level: 1, name: screen.heading })).toBeVisible();
    await expect(page.getByLabel("Correo electrónico")).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze()).violations).toEqual([]);
    await mkdir("replica/clone-screens/auth", { recursive: true });
    await page.screenshot({ path: `replica/clone-screens/auth/D01-${screen.file}-${info.project.name}.png`, fullPage: true });
    expect(errors).toEqual([]);
  });
}

test("server validates registration and password recovery without sending email", async ({ page }) => {
  await page.goto("/auth/register");
  await page.getByRole("button", { name: "Crear cuenta", exact: true }).click();
  await expect(page.getByLabel("Correo electrónico")).toBeFocused();
  await expect(page.getByText("Introduce un correo electrónico válido.")).toBeVisible();
  await page.getByLabel("Correo electrónico").fill("linde-validation@example.invalid");
  await page.getByLabel("Contraseña", { exact: true }).fill("corta");
  await page.getByRole("button", { name: "Crear cuenta", exact: true }).click();
  await expect(page.getByLabel("Contraseña", { exact: true })).toBeFocused();
  await expect(page.getByText("Usa al menos 8 caracteres. Puedes pegar una contraseña de tu gestor.", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Correo electrónico")).toHaveValue("linde-validation@example.invalid");
  await page.goto("/auth/recover");
  await page.getByRole("button", { name: "Enviar enlace de recuperación" }).click();
  await expect(page.getByText("Introduce un correo electrónico válido.")).toBeVisible();
});

test("password visibility, autofill and keyboard remain usable", async ({ page }) => {
  await page.goto("/auth/login");
  const password = page.getByLabel("Contraseña", { exact: true });
  await expect(password).toHaveAttribute("autocomplete", "current-password");
  await password.fill("solo-una-prueba-local");
  await page.getByRole("button", { name: "Mostrar contraseña", exact: true }).click();
  await expect(password).toHaveAttribute("type", "text");
  await expect(password).toHaveValue("solo-una-prueba-local");
  await page.getByRole("button", { name: "Ocultar contraseña", exact: true }).press("Enter");
  await expect(password).toHaveAttribute("type", "password");
  await page.getByLabel("Correo electrónico").focus();
  await page.keyboard.press("Tab");
  await expect(password).toBeFocused();
});

test("real Supabase sign-in refusal is shown safely and never grants a session", async ({ page }, info) => {
  // Negative integration only: reserved domain, no account creation or email.
  await page.goto("/auth/login");
  await page.getByLabel("Correo electrónico").fill("linde-auth-negative-check@example.invalid");
  await page.getByLabel("Contraseña", { exact: true }).fill("intento-negativo-no-es-una-cuenta");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  const feedback = page.getByRole("alert").filter({ hasText: "No pudimos completar la solicitud" });
  await expect(feedback).toBeVisible({ timeout: 20000 });
  await expect(feedback).toBeFocused();
  await expect(page.getByLabel("Correo electrónico")).toHaveValue("linde-auth-negative-check@example.invalid");
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze()).violations).toEqual([]);
  await mkdir("replica/clone-screens/auth", { recursive: true });
  await page.screenshot({ path: `replica/clone-screens/auth/D01-login-error-${info.project.name}.png`, fullPage: true });
  await page.goto("/app");
  await expect(page).toHaveURL(/\/auth\/login\?/);
});

test("private page denies absent and forged sessions, never an HTML-only guard", async ({ page, context, request }) => {
  const direct = await request.get("/app", { maxRedirects: 0 });
  expect(direct.status()).toBe(307);
  const loginURL = new URL(direct.headers().location!);
  expect(loginURL.pathname).toBe("/auth/login");
  expect(loginURL.origin).toBe("http://127.0.0.1:3000");
  expect(loginURL.searchParams.get("next")).toBe("/app");
  const forgedHost = await request.get("/app", { headers: { host: "untrusted.example.invalid" }, maxRedirects: 0 });
  expect(forgedHost.status()).toBe(307);
  expect(["localhost", "127.0.0.1"]).toContain(new URL(forgedHost.headers().location!).hostname);
  expect(direct.headers()["cache-control"]).toContain("no-store");
  await context.addCookies([{ name: "sb-wjjtqmtsysufqdxwknqx-auth-token", value: "base64-e30", url: "http://127.0.0.1:3000" }]);
  await page.goto("/app");
  await expect(page).toHaveURL(/\/auth\/login\?/);
  await expect(page.getByRole("heading", { name: "Tu marca empieza aquí." })).toHaveCount(0);
  await page.goto("/auth/update-password");
  await expect(page).toHaveURL(/\/auth\/login\?/);
  await expect(page.getByRole("button", { name: "Guardar contraseña" })).toHaveCount(0);
});

test("callback, token errors and next values cannot redirect outside the app", async ({ page, request }) => {
  for (const path of [
    "/auth/callback?next=https://example.invalid",
    "/auth/callback?code=invalid&next=//example.invalid&flow=recovery",
    "/auth/confirm?token_hash=invalid&type=unsupported&next=https://example.invalid",
  ]) {
    const response = await request.get(path, { maxRedirects: 0 });
    expect(response.status()).toBe(303);
    expect(response.headers().location).toBe("/auth/login?notice=invalid-link");
    expect(response.headers()["referrer-policy"]).toBe("no-referrer");
    expect(response.headers()["cache-control"]).toContain("no-store");
  }
  await page.goto("/auth/login?next=https://example.invalid&notice=invalid-link");
  await expect(page.locator('input[name="next"]')).toHaveValue("/app");
  await expect(page.getByRole("status").filter({ hasText: "El enlace no es válido" })).toBeVisible();
});

test("logout is POST-only with Origin protection and keeps the local draft", async ({ page, request }) => {
  expect((await request.get("/auth/logout")).status()).toBe(405);
  const forbidden = await request.post("/auth/logout", { headers: { origin: "https://example.invalid" } });
  expect(forbidden.status()).toBe(403);
  const opaque = await request.post("/auth/logout", { headers: { origin: "null" } });
  expect(opaque.status()).toBe(403);
  await page.goto("/");
  await page.getByLabel("Dirección de tu empresa").fill("https://example.com/mi-borrador");
  await page.getByRole("button", { name: "Guardar dirección" }).click();
  const before = await page.evaluate(() => sessionStorage.getItem("linde.brand-start.v1"));
  await page.getByRole("link", { name: "Entrar", exact: true }).click();
  await page.getByRole("link", { name: "¿Has olvidado tu contraseña?" }).click();
  await page.getByRole("link", { name: "Continuar con un borrador local" }).click();
  expect(await page.evaluate(() => sessionStorage.getItem("linde.brand-start.v1"))).toBe(before);
  await expect(page.getByRole("heading", { name: "Borrador en esta pestaña" })).toBeVisible();
  const result = await page.evaluate(async () => (await fetch("/auth/logout", { method: "POST" })).status);
  expect(result).toBe(200);
  expect(await page.evaluate(() => sessionStorage.getItem("linde.brand-start.v1"))).toBe(before);
});

test("D01 reflows at 320px with enlarged text and reduced motion", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/auth/register");
  await page.addStyleTag({ content: "html { font-size: 200%; }" });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(page.getByRole("button", { name: "Crear cuenta", exact: true })).toBeVisible();
});
