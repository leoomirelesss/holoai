import "server-only";

export function getAuthConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("AUTH_CONFIGURATION_MISSING");
  const parsed = new URL(url);
  const localHttp = parsed.protocol === "http:" && ["127.0.0.1", "localhost", "[::1]"].includes(parsed.hostname);
  if ((parsed.protocol !== "https:" && !localHttp) || parsed.username || parsed.password || key.startsWith("sb_secret_")) {
    throw new Error("AUTH_CONFIGURATION_INVALID");
  }
  // Legacy JWTs must be anon, never service_role. Publishable keys are opaque.
  if (key.startsWith("eyJ")) {
    try {
      const role = JSON.parse(Buffer.from(key.split(".")[1] ?? "", "base64url").toString()).role;
      if (role !== "anon") throw new Error();
    } catch { throw new Error("AUTH_CONFIGURATION_INVALID"); }
  }
  return { url: parsed.origin, key };
}

export function authConfigured() {
  try { getAuthConfig(); return true; } catch { return false; }
}

/** Only operator-controlled environment values, never Host/X-Forwarded-Host. */
export function getSiteOrigin() {
  const candidate = process.env.SITE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  const url = new URL(candidate);
  const loopback = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  if ((url.protocol !== "https:" && !(loopback && url.protocol === "http:")) || url.username || url.password || url.pathname !== "/" || url.search || url.hash) {
    throw new Error("SITE_URL_INVALID");
  }
  return url.origin;
}

export function trustedOrigin(origin: string | null) {
  if (!origin) return false;
  const canonical = new URL(getSiteOrigin());
  if (origin === canonical.origin) return true;
  if (canonical.protocol !== "http:" || !["localhost", "127.0.0.1"].includes(canonical.hostname)) return false;
  return ["localhost", "127.0.0.1"].some((host) => origin === `http://${host}:${canonical.port || "80"}`);
}

export function authCookieOptions() {
  return { httpOnly: true, secure: new URL(getSiteOrigin()).protocol === "https:", sameSite: "lax" as const, path: "/" };
}

export const recoveryCookie = "linde-recovery-user";
