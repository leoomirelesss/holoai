import { test } from "@playwright/test";
import { spawn } from "node:child_process";
import { writeFile } from "node:fs/promises";

test("real account: UI sign-in, verified session, reload, logout and draft retention", async () => {
  test.setTimeout(180000);
  test.skip(!process.env.LINDE_TEST_EMAIL || !process.env.LINDE_TEST_PASSWORD, "Secure test credentials are not configured");
  // No browser fixture or raw errors in the reporter; the child never produces artifacts.
  const raw = await new Promise<string>((resolve) => {
    const child = spawn(process.execPath, ["scripts/auth-live-check.mjs"], {
      env: { ...process.env, NODE_USE_ENV_PROXY: "1" },
      stdio: ["ignore", "pipe", "ignore"],
      timeout: 160000,
    });
    let output = "";
    child.stdout.on("data", (chunk) => { if (output.length < 10000) output += chunk; });
    child.on("error", () => resolve("{}"));
    child.on("close", () => resolve(output));
  });
  const stages = ["environment", "public-draft", "initial-private-denial", "ui-login", "supabase-session", "reload", "logout", "post-logout-denial", "draft-retention", "done"];
  const names = ["credentials_present", "project_matches", "draft_created", "unauthenticated_access_blocked", "ui_login_succeeded", "supabase_user_verified", "auth_cookies_httponly", "private_app_accessible", "session_survives_reload", "same_user_after_reload", "draft_unchanged_after_reload", "ui_logout_succeeded", "session_absent_after_logout", "private_access_blocked_after_logout", "local_draft_unchanged", "cleanup_logout", "login_path_is_app", "login_path_is_login", "login_generic_error", "login_origin_error", "login_rate_limited"];
  let parsed;
  try { parsed = JSON.parse(raw); } catch { parsed = {}; }
  const evidence = {
    success: parsed.success === true,
    stage: stages.includes(parsed.stage) ? parsed.stage : "child-failed",
    checks: Object.fromEntries(names.filter((name) => typeof parsed.checks?.[name] === "boolean").map((name) => [name, parsed.checks[name] === true])),
  };
  await writeFile("replica/auth-live-validation.json", `${JSON.stringify(evidence, null, 2)}\n`);
  if (!evidence.success) throw new Error(`Real authentication validation did not complete: ${evidence.stage}. See sanitized evidence.`);
});
