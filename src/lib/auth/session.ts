import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/** Authoritative server check; proxy is only the first layer. Never getSession. */
export async function verifiedUser() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();
    return error || !data.user?.email_confirmed_at ? null : data.user;
  } catch { return null; }
}

export async function requireUser() {
  const user = await verifiedUser();
  if (!user) redirect("/auth/login?notice=session-required&next=%2Fapp");
  return user;
}
