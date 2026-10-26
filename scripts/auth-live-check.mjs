// Isolated from Playwright reporters: credentials and browser failures never leave this process.
for (const method of ["log", "warn", "error", "info", "debug"]) console[method] = () => {};
const checks = {};
let stage = "environment";
let browser;
let page;
let signedIn = false;
let success = false;
function check(name, condition) {
  checks[name] = Boolean(condition);
  if (!condition) throw new Error("Check failed");
}
try {
  const { chromium } = await import("@playwright/test");
  const { createServerClient } = await import("@supabase/ssr");
  check("credentials_present", Boolean(process.env.LINDE_TEST_EMAIL && process.env.LINDE_TEST_PASSWORD));
  check("project_matches", new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname === "wjjtqmtsysufqdxwknqx.supabase.co");
  const browserEnv = Object.fromEntries(["PATH", "HOME", "TMPDIR", "DISPLAY", "XDG_RUNTIME_DIR", "LANG", "FONTCONFIG_PATH"].filter((key) => process.env[key]).map((key) => [key, process.env[key]]));
  browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH, env: browserEnv });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  page = await context.newPage();
  page.setDefaultTimeout(25000);
  const origin = "http://127.0.0.1:3000";
  const draft = () => page.evaluate(() => sessionStorage.getItem("linde.brand-start.v1"));
  const verified = async () => {
    const cookies = await context.cookies(origin);
    const client = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
      cookies: { getAll: () => cookies.map(({ name, value }) => ({ name, value })), setAll: () => {} },
      global: { fetch: (url, options) => fetch(url, { ...options, signal: AbortSignal.timeout(20000) }) },
    });
    return client.auth.getUser();
  };
  stage = "public-draft";
  await page.goto(origin);
  await page.getByLabel("Dirección de tu empresa").fill("https://example.com/linde-auth-lifecycle");
  await page.getByRole("button", { name: "Guardar dirección", exact: true }).click();
  await page.getByRole("heading", { name: "Borrador en esta pestaña" }).waitFor();
  const before = await draft();
  check("draft_created", Boolean(before));
  stage = "initial-private-denial";
  await page.goto(`${origin}/app`);
  check("unauthenticated_access_blocked", new URL(page.url()).pathname === "/auth/login");
  stage = "ui-login";
  await page.getByLabel("Correo electrónico").fill(process.env.LINDE_TEST_EMAIL);
  await page.getByLabel("Contraseña", { exact: true }).fill(process.env.LINDE_TEST_PASSWORD);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await page.waitForURL(`${origin}/app`);
  signedIn = true;
  await page.getByRole("button", { name: "Cerrar sesión", exact: true }).waitFor();
  check("ui_login_succeeded", true);
  stage = "supabase-session";
  const first = await verified();
  check("supabase_user_verified", !first.error && Boolean(first.data.user?.email_confirmed_at) && first.data.user?.email === process.env.LINDE_TEST_EMAIL);
  const userId = first.data.user.id;
  const authCookies = (await context.cookies(origin)).filter(({ name }) => name.startsWith("sb-") && name.includes("auth-token"));
  check("auth_cookies_httponly", authCookies.length > 0 && authCookies.every(({ httpOnly }) => httpOnly));
  check("private_app_accessible", new URL(page.url()).pathname === "/app");
  stage = "reload";
  const reloaded = await page.reload();
  check("session_survives_reload", reloaded.status() === 200 && new URL(page.url()).pathname === "/app");
  await page.getByRole("button", { name: "Cerrar sesión", exact: true }).waitFor();
  const second = await verified();
  check("same_user_after_reload", !second.error && second.data.user?.id === userId);
  check("draft_unchanged_after_reload", await draft() === before);
  stage = "logout";
  await page.getByRole("button", { name: "Cerrar sesión", exact: true }).click();
  await page.waitForURL(/\/auth\/login\?notice=signed-out$/);
  signedIn = false;
  check("ui_logout_succeeded", true);
  const after = await verified();
  check("session_absent_after_logout", !after.data.user && after.error?.name === "AuthSessionMissingError");
  stage = "post-logout-denial";
  await page.goto(`${origin}/app`);
  check("private_access_blocked_after_logout", new URL(page.url()).pathname === "/auth/login");
  stage = "draft-retention";
  await page.goto(origin);
  await page.getByRole("heading", { name: "Borrador en esta pestaña" }).waitFor();
  check("local_draft_unchanged", await draft() === before);
  stage = "done";
  success = true;
} catch {
  // Deliberately discard exceptions: browser call logs can contain input values.
  if (stage === "ui-login" && page) {
    checks.login_path_is_app = new URL(page.url()).pathname === "/app";
    checks.login_path_is_login = new URL(page.url()).pathname === "/auth/login";
    checks.login_generic_error = await page.getByText("No pudimos completar la solicitud.", { exact: false }).isVisible().catch(() => false);
    checks.login_origin_error = await page.getByText("Recarga la página antes de volver a intentarlo.", { exact: true }).isVisible().catch(() => false);
    checks.login_rate_limited = await page.getByText("Hay demasiados intentos recientes.", { exact: false }).isVisible().catch(() => false);
  }
} finally {
  if (page && (signedIn || new URL(page.url()).pathname === "/app")) {
    try {
      await page.goto("http://127.0.0.1:3000/app");
      await page.getByRole("button", { name: "Cerrar sesión", exact: true }).click();
      await page.waitForURL(/\/auth\/login\?notice=signed-out$/);
      checks.cleanup_logout = true;
    } catch { checks.cleanup_logout = false; }
  }
  await browser?.close().catch(() => {});
}
process.stdout.write(JSON.stringify({ success, stage, checks }));
