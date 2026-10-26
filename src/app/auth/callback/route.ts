import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { authCookieOptions, recoveryCookie } from "@/lib/auth/config";
import { safeNext } from "@/lib/auth/navigation";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  let target = "/auth/login?notice=invalid-link";
  if (code && code.length <= 4096 && !request.nextUrl.searchParams.has("error")) {
    try {
      const client = await createClient(true);
      const { error } = await client.auth.exchangeCodeForSession(code);
      if (!error) {
        const { data, error: identityError } = await client.auth.getUser();
        if (!identityError && data.user?.email_confirmed_at) {
          if (request.nextUrl.searchParams.get("flow") === "recovery") {
            (await cookies()).set(recoveryCookie, data.user.id, { ...authCookieOptions(), maxAge: 900 });
            target = "/auth/update-password";
          } else target = safeNext(request.nextUrl.searchParams.get("next"));
        }
      }
    } catch { /* Invalid, expired, wrong-browser or unavailable: fail closed. */ }
  }
  return new NextResponse(null, { status: 303, headers: { Location: target, "Cache-Control": "private, no-store, max-age=0", "Referrer-Policy": "no-referrer" } });
}
