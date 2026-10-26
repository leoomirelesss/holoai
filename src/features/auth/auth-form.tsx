"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { resendVerification, sendRecovery, signIn, signUp, updatePassword } from "./actions";
import { initialAuthState, type AuthMode } from "./types";

const actions = { login: signIn, register: signUp, recover: sendRecovery, verify: resendVerification, update: updatePassword };
const content: Record<AuthMode, { title: string; description: string; button: string; pending: string }> = {
  login: { title: "Tu espacio te espera.", description: "Entra para continuar con la información de tu marca.", button: "Entrar", pending: "Entrando…" },
  register: { title: "Empieza con tu cuenta.", description: "Crea tu acceso a Linde. Te pediremos confirmar el correo antes de entrar.", button: "Crear cuenta", pending: "Creando cuenta…" },
  recover: { title: "Recupera el acceso.", description: "Te ayudaremos a elegir una contraseña nueva mediante un enlace de recuperación.", button: "Enviar enlace de recuperación", pending: "Solicitando enlace…" },
  verify: { title: "Confirma tu correo.", description: "Solicita un enlace nuevo si el anterior ha caducado o no lo encuentras.", button: "Reenviar confirmación", pending: "Solicitando confirmación…" },
  update: { title: "Una contraseña nueva.", description: "Elige una contraseña para volver a entrar en tu cuenta.", button: "Guardar contraseña", pending: "Guardando contraseña…" },
};

export function AuthForm({ mode, next = "/app", notice, configured }: { mode: AuthMode; next?: string; notice?: string; configured: boolean }) {
  const [state, action, pending] = useActionState(actions[mode], initialAuthState);
  const [resendState, resendAction, resendPending] = useActionState(resendVerification, initialAuthState);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const registered = mode === "register" && state.status === "sent";
  const effectiveMode = registered ? "verify" : mode;
  const activeState = registered && resendState.status !== "idle" ? resendState : state;
  const activePending = registered ? resendPending : pending;
  const labels = content[effectiveMode];
  const hasPassword = effectiveMode === "login" || effectiveMode === "register" || effectiveMode === "update";

  useEffect(() => {
    if (activeState.status === "error") {
      if (activeState.errors?.email) emailRef.current?.focus();
      else if (activeState.errors?.password) passwordRef.current?.focus();
      else errorRef.current?.focus();
    } else if (activeState.status === "sent" || activeState.status === "updated") titleRef.current?.focus();
  }, [activeState]);

  return (
    <section className="card auth-card" aria-labelledby="auth-title">
      <div className="section-symbol"><Icon name={effectiveMode === "recover" || effectiveMode === "update" ? "edit" : "check"} /></div>
      <h1 id="auth-title" ref={titleRef} tabIndex={-1}>{registered ? "Revisa tu correo." : labels.title}</h1>
      <p className="auth-description">{registered ? "El siguiente paso es confirmar tu dirección de correo." : labels.description}</p>
      {notice && <p className="auth-notice notice notice--info" role="status">{notice}</p>}
      {!configured && <p className="auth-notice notice notice--warning">El acceso no está disponible en este entorno. Puedes continuar con tu borrador local sin iniciar sesión.</p>}
      {activeState.status === "error" && activeState.message && <div ref={errorRef} tabIndex={-1} className="auth-notice notice notice--warning" role="alert">{activeState.message}</div>}
      {(activeState.status === "sent" || activeState.status === "updated") && <p className="auth-notice notice notice--info" role="status">{activeState.message}</p>}

      {activeState.status !== "updated" ? (
        <form action={registered ? resendAction : action} noValidate aria-busy={activePending} className="auth-form">
          <input type="hidden" name="next" value={next} />
          {effectiveMode !== "update" && <Field id="auth-email" ref={emailRef} name="email" label="Correo electrónico" type="email" inputMode="email" autoComplete="email" maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} error={activeState.errors?.email} required readOnly={activePending} />}
          {hasPassword && (
            <div className="password-group">
              <Field id="auth-password" ref={passwordRef} name="password" label={effectiveMode === "update" ? "Contraseña nueva" : "Contraseña"} type={showPassword ? "text" : "password"} autoComplete={effectiveMode === "login" ? "current-password" : "new-password"} maxLength={128} minLength={effectiveMode === "login" ? undefined : 8} error={activeState.errors?.password} hint={effectiveMode === "login" ? undefined : "Al menos 8 caracteres. Puedes usar y pegar una contraseña de tu gestor."} required readOnly={activePending} />
              <Button variant="ghost" className="password-toggle" aria-controls="auth-password" aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)}>{showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}</Button>
            </div>
          )}
          <Button type="submit" className="auth-submit" disabled={activePending || !configured}>{activePending ? labels.pending : labels.button}{!activePending && <Icon name="arrow" />}</Button>
        </form>
      ) : <form method="post" action="/auth/logout" className="auth-form"><Button type="submit">Cerrar sesión</Button></form>}

      <div className="auth-links">
        {mode === "login" && <><Link href="/auth/recover">¿Has olvidado tu contraseña?</Link><Link href="/auth/verify">Reenviar confirmación de correo</Link><p>¿Primera vez en Linde? <Link href="/auth/register">Crea tu cuenta</Link></p></>}
        {mode !== "login" && <Link href="/auth/login">Volver a iniciar sesión</Link>}
      </div>
    </section>
  );
}
