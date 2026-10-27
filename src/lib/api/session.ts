import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { authCookieOptions, getAuthConfig } from "@/lib/auth/config";
import type { Database } from "@/lib/data/database.types";
import { ApiError, unavailable } from "./errors";

export async function apiSession() {
  let client;
  try {
    const { url, key } = getAuthConfig();
    const store = await cookies();
    client = createServerClient<Database>(url, key, {
      cookieOptions: authCookieOptions(),
      cookies: {
        getAll: () => store.getAll(),
        setAll: (values) => values.forEach(({ name, value, options }) => store.set(name, value, { ...options, ...authCookieOptions() })),
      },
      global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store", signal: init?.signal ? AbortSignal.any([init.signal, AbortSignal.timeout(5000)]) : AbortSignal.timeout(5000) }) },
    });
  } catch { throw unavailable(); }
  let result;
  try { result = await client.auth.getUser(); } catch { throw unavailable(); }
  if (result.error) {
    if (result.error.name === "AuthRetryableFetchError" || result.error.status === undefined || result.error.status >= 500) throw unavailable();
    throw new ApiError(401, "AUTH_REQUIRED", "Inicia sesión para continuar.");
  }
  if (!result.data.user) throw new ApiError(401, "AUTH_REQUIRED", "Inicia sesión para continuar.");
  if (!result.data.user.email_confirmed_at) throw new ApiError(403, "EMAIL_VERIFICATION_REQUIRED", "Confirma tu correo para continuar.");
  return { client, user: result.data.user };
}
export type ApiSession = Awaited<ReturnType<typeof apiSession>>;
