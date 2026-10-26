"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { authCookieOptions, getSiteOrigin, recoveryCookie, trustedOrigin } from "@/lib/auth/config";
import { safeNext } from "@/lib/auth/navigation";
import type { AuthState } from "./types";

function emailInput(form: FormData) {
  const value = form.get("email");
  return typeof value === "string" ? value.trim() : "";
}

function passwordInput(form: FormData) {
  const value = form.get("password");
  return typeof value === "string" ? value : "";
}

function validate(form: FormData, password: "none" | "login" | "new") {
  const email = emailInput(form);
  const secret = passwordInput(form);
  const errors: NonNullable<AuthState["errors"]> = {};
  if (password !== "new" || form.has("email")) {
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Introduce un correo electrónico válido.";
  }
  if (password !== "none" && (!secret || secret.length > 128)) errors.password = "Introduce una contraseña de hasta 128 caracteres.";
  if (password === "new" && secret.length < 8) errors.password = "Usa al menos 8 caracteres. Puedes pegar una contraseña de tu gestor.";
  return { email, secret, errors };
}

async function validActionOrigin() {
  try { return trustedOrigin((await headers()).get("origin")); } catch { return false; }
}

function failure(code?: string): AuthState {
  if (code === "over_request_rate_limit" || code === "over_email_send_rate_limit") {
    return { status: "error", message: "Hay demasiados intentos recientes. Espera unos minutos antes de volver a intentarlo." };
  }
  if (code === "weak_password") return { status: "error", errors: { password: "La contraseña no cumple los requisitos del proyecto. Prueba una más larga y evita contraseñas conocidas." } };
  return { status: "error", message: "No pudimos completar la solicitud. Comprueba tus datos y vuelve a intentarlo. Si ibas a entrar, revisa también que hayas confirmado el correo." };
}

export async function signIn(_previous: AuthState, form: FormData): Promise<AuthState> {
  if (!await validActionOrigin()) return { status: "error", message: "Recarga la página antes de volver a intentarlo." };
  const { email, secret, errors } = validate(form, "login");
  if (Object.keys(errors).length) return { status: "error", errors, email };
  try {
    const supabase = await createClient(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password: secret });
    if (error) return { ...failure(error.code), email };
    const { data, error: verificationError } = await supabase.auth.getUser();
    if (verificationError || !data.user?.email_confirmed_at) {
      await supabase.auth.signOut({ scope: "local" });
      return { ...failure(), email };
    }
  } catch { return { ...failure(), email }; }
  redirect(safeNext(form.get("next")));
}

export async function signUp(_previous: AuthState, form: FormData): Promise<AuthState> {
  if (!await validActionOrigin()) return failure();
  const { email, secret, errors } = validate(form, "new");
  if (Object.keys(errors).length) return { status: "error", errors, email };
  try {
    const supabase = await createClient(true);
    const { data, error } = await supabase.auth.signUp({ email, password: secret, options: { emailRedirectTo: `${getSiteOrigin()}/auth/callback` } });
    if (error) return { ...failure(error.code), email };
    // With confirmation enabled there is no session. Do not claim an email was delivered.
    if (data.session) await supabase.auth.signOut({ scope: "local" });
    return { status: "sent", email, message: "Si el registro puede completarse con este correo, recibirás un enlace para confirmarlo. Revisa también la carpeta de spam." };
  } catch { return { ...failure(), email }; }
}

export async function sendRecovery(_previous: AuthState, form: FormData): Promise<AuthState> {
  if (!await validActionOrigin()) return failure();
  const { email, errors } = validate(form, "none");
  if (Object.keys(errors).length) return { status: "error", errors, email };
  try {
    const supabase = await createClient(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${getSiteOrigin()}/auth/callback?flow=recovery` });
    if (error) return { ...failure(error.code), email };
    return { status: "sent", email, message: "Si existe una cuenta con este correo, recibirás un enlace para recuperar el acceso. Utiliza el enlace más reciente." };
  } catch { return { ...failure(), email }; }
}

export async function resendVerification(_previous: AuthState, form: FormData): Promise<AuthState> {
  if (!await validActionOrigin()) return failure();
  const { email, errors } = validate(form, "none");
  if (Object.keys(errors).length) return { status: "error", errors, email };
  try {
    const supabase = await createClient(true);
    const { error } = await supabase.auth.resend({ type: "signup", email, options: { emailRedirectTo: `${getSiteOrigin()}/auth/callback` } });
    if (error) return { ...failure(error.code), email };
    return { status: "sent", email, message: "Si esta cuenta necesita confirmación, recibirás un enlace nuevo. Revisa también la carpeta de spam." };
  } catch { return { ...failure(), email }; }
}

export async function updatePassword(_previous: AuthState, form: FormData): Promise<AuthState> {
  if (!await validActionOrigin()) return failure();
  const { secret, errors } = validate(form, "new");
  if (Object.keys(errors).length) return { status: "error", errors };
  let updated = false;
  try {
    const supabase = await createClient(true);
    const { data, error } = await supabase.auth.getUser();
    const store = await cookies();
    // This cookie only maintains recovery UX. The verified Auth user authorizes the operation.
    if (error || !data.user?.email_confirmed_at || store.get(recoveryCookie)?.value !== data.user.id) {
      return { status: "error", message: "La sesión de recuperación terminó. Solicita un enlace nuevo para continuar." };
    }
    const { error: updateError } = await supabase.auth.updateUser({ password: secret });
    if (updateError) return failure(updateError.code);
    updated = true;
    store.set(recoveryCookie, "", { ...authCookieOptions(), maxAge: 0 });
    const { error: logoutError } = await supabase.auth.signOut({ scope: "global" });
    if (logoutError) return { status: "updated", message: "Tu contraseña se ha actualizado. No pudimos cerrar todas las sesiones; utiliza Cerrar sesión antes de volver a entrar." };
  } catch {
    return updated ? { status: "updated", message: "Tu contraseña se ha actualizado. No pudimos confirmar el cierre de sesión; utiliza Cerrar sesión antes de volver a entrar." } : failure();
  }
  redirect("/auth/login?notice=password-updated");
}
