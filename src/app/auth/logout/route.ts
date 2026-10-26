import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { authCookieOptions, recoveryCookie, trustedOrigin } from "@/lib/auth/config";

export async function POST(request: NextRequest) {
  if (!trustedOrigin(request.headers.get("origin"))) return new NextResponse("Solicitud no permitida.", { status: 403 });
  let target = "/auth/login?notice=signed-out";
  try {
    const client = await createClient(true);
    const { error } = await client.auth.signOut({ scope: "global" });
    if (error && error.name !== "AuthSessionMissingError") target = "/app?notice=logout-failed";
    else (await cookies()).set(recoveryCookie, "", { ...authCookieOptions(), maxAge: 0 });
  } catch { target = "/app?notice=logout-failed"; }
  return new NextResponse(null, { status: 303, headers: { Location: target, "Cache-Control": "private, no-store, max-age=0" } });
}
