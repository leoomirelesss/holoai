import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { authCookieOptions, getAuthConfig, getSiteOrigin, trustedOrigin } from "@/lib/auth/config";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  response.headers.set("Pragma", "no-cache");
  // Callback/confirmation/logout handlers own their cookie writes. Refreshing
  // the previous session here could overwrite the new or removed cookies.
  const authPath = request.nextUrl.pathname;
  if (["/auth/callback", "/auth/confirm", "/auth/logout"].includes(authPath) ||
      (authPath.startsWith("/auth/") && request.method !== "GET" && request.method !== "HEAD")) {
    return response;
  }
  const protectedPath = request.nextUrl.pathname === "/app" || request.nextUrl.pathname.startsWith("/app/");
  function loginRedirect(notice: string) {
    // Next's proxy requires an absolute Location. Only an explicitly trusted
    // canonical origin (or its local loopback equivalent) may supply that origin.
    // Next normalizes loopback nextUrl hosts to localhost. Preserve the incoming
    // host only after exact allowlist validation, so sessionStorage stays on-origin.
    let origin = getSiteOrigin();
    const incoming = `${request.nextUrl.protocol}//${request.headers.get("host") ?? ""}`;
    if (trustedOrigin(incoming)) origin = incoming;
    const destination = new URL("/auth/login", origin);
    destination.searchParams.set("notice", notice);
    destination.searchParams.set("next", "/app");
    const redirect = NextResponse.redirect(destination);
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    ["Cache-Control", "Pragma", "Expires"].forEach((header) => {
      const value = response.headers.get(header);
      if (value) redirect.headers.set(header, value);
    });
    return redirect;
  }
  try {
    const { url, key } = getAuthConfig();
    const supabase = createServerClient(url, key, {
      cookieOptions: authCookieOptions(),
      global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }) },
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(values, headers) {
          values.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          values.forEach(({ name, value, options }) => response.cookies.set(name, value, { ...options, ...authCookieOptions() }));
          Object.entries(headers ?? {}).forEach(([name, value]) => response.headers.set(name, value));
          response.headers.set("Cache-Control", "private, no-store, max-age=0");
          response.headers.set("Pragma", "no-cache");
        },
      },
    });
    // Do not place other work between creating the client and verifying claims.
    const { data, error } = await supabase.auth.getClaims();
    if (protectedPath && (error || !data?.claims.sub)) return loginRedirect("session-required");
  } catch {
    if (protectedPath) return loginRedirect("session-unavailable");
  }
  return response;
}

export const config = { matcher: ["/app/:path*", "/auth/:path*"] };
