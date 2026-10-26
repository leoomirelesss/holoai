import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AuthLayout } from "@/components/layout/auth-layout";
import { AuthForm } from "@/features/auth/auth-form";
import { recoveryCookie } from "@/lib/auth/config";
import { requireUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "Contraseña nueva · Linde" };

export default async function UpdatePassword() {
  const user = await requireUser();
  if ((await cookies()).get(recoveryCookie)?.value !== user.id) redirect("/auth/recover?notice=recovery-required");
  return <AuthLayout><AuthForm mode="update" configured /></AuthLayout>;
}
