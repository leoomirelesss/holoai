import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { authCookieOptions, getAuthConfig } from "@/lib/auth/config";

/** Per-request client. Auth is server-only, so cookies can remain HttpOnly. */
export async function createClient(writable = false) {
  const { url, key } = getAuthConfig();
  const store = await cookies();
  return createServerClient(url, key, {
    cookieOptions: authCookieOptions(),
    global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }) },
    cookies: {
      getAll: () => store.getAll(),
      setAll(values) {
        if (writable) {
          values.forEach(({ name, value, options }) => store.set(name, value, { ...options, ...authCookieOptions() }));
        } else {
          // Server Components cannot write. The proxy refreshes before rendering.
          try { values.forEach(({ name, value, options }) => store.set(name, value, { ...options, ...authCookieOptions() })); } catch { /* Read-only RSC context. */ }
        }
      },
    },
  });
}
