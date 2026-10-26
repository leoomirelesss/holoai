import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { authCookieOptions, recoveryCookie } from "@/lib/auth/config";
import { safeNext } from "@/lib/auth/navigation";

/** TokenHash templates support confirming in another browser without a PKCE verifier. */
export async function GET(request: NextRequest) {
  const hash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type");
  let target = "/auth/login?notice=invalid-link";
  if (hash && hash.length <= 4096 && (type === "email" || type === "signup" || type === "recovery")) {
    try {
      const client = await createClient(true);
      const { error } = await client.auth.verifyOtp({ token_hash: hash, type });
      if (!error) {
        const { data, error: identityError } = await client.auth.getUser();
        if (!identityError && data.user?.email_confirmed_at) {
          if (type === "recovery") {
            (await cookies()).set(recoveryCookie, data.user.id, { ...authCookieOptions(), maxAge: 900 });
            target = "/auth/update-password";
          } else target = safeNext(request.nextUrl.searchParams.get("next"));
        }
      }
    } catch { /* No raw token or provider error in the redirect/log. */ }
  }
  return new NextResponse(null, { status: 303, headers: { Location: target, "Cache-Control": "private, no-store, max-age=0", "Referrer-Policy": "no-referrer" } });
}
