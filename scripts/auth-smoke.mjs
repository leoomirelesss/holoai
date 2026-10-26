import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (!url || !key) throw new Error("Missing Auth connection variables (values are never printed).");
const settingsResponse = await fetch(`${url.replace(/\/$/, "")}/auth/v1/settings`, { headers: { apikey: key }, signal: AbortSignal.timeout(15000) });
if (!settingsResponse.ok) throw new Error(`Auth settings HTTP ${settingsResponse.status}`);
const settings = await settingsResponse.json();
console.log(JSON.stringify({ settings_http: settingsResponse.status, email_enabled: settings.external?.email, registration_enabled: !settings.disable_signup, confirmation_required: !settings.mailer_autoconfirm }));
const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
// Reserved, non-deliverable domain. No sign-up, recovery, email or account mutation.
const { data, error } = await client.auth.signInWithPassword({ email: "linde-auth-negative-check@example.invalid", password: randomUUID() });
if (data.session || error?.code !== "invalid_credentials") throw new Error(`Unexpected negative login result: ${error?.code ?? "no_error"}`);
console.log(JSON.stringify({ invalid_login_rejected: true, status: error.status, code: error.code, positive_login: "not_tested_no_credentials", email_delivery: "not_tested" }));
