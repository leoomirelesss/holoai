import { redirect } from "next/navigation";
import { AuthLayout } from "@/components/layout/auth-layout";
import { authConfigured } from "@/lib/auth/config";
import { authNotices, safeNext } from "@/lib/auth/navigation";
import { verifiedUser } from "@/lib/auth/session";
import { AuthForm } from "./auth-form";
import type { AuthMode } from "./types";

export type AuthSearch = Promise<Record<string, string | string[] | undefined>>;

export async function AuthPage({ mode, searchParams }: { mode: AuthMode; searchParams: AuthSearch }) {
  const params = await searchParams;
  if ((mode === "login" || mode === "register") && await verifiedUser()) redirect("/app");
  const notice = typeof params.notice === "string" && Object.hasOwn(authNotices, params.notice) ? authNotices[params.notice] : undefined;
  return <AuthLayout><AuthForm mode={mode} next={safeNext(params.next)} configured={authConfigured()} notice={notice} /></AuthLayout>;
}
