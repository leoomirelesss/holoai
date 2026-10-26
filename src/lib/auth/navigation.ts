/** Intentionally closed allowlist: no external, encoded, nested or future routes. */
export function safeNext(value: unknown): string {
  const destinations = new Set(["/app"]);
  return typeof value === "string" && destinations.has(value) ? value : "/app";
}

export const authNotices: Record<string, string> = {
  "session-required": "Inicia sesión para acceder a tu espacio. Si tu sesión terminó, tus borradores de esta pestaña siguen aquí.",
  "session-unavailable": "No pudimos comprobar tu sesión. Inténtalo de nuevo; no se ha concedido acceso a datos privados.",
  "invalid-link": "El enlace no es válido, ya se utilizó o ha caducado. Solicita un correo nuevo y utiliza el enlace más reciente.",
  "recovery-required": "Abre un enlace de recuperación válido para elegir una contraseña nueva.",
  "password-updated": "Contraseña actualizada. Vuelve a iniciar sesión con tu contraseña nueva.",
  "signed-out": "Sesión cerrada. Tus borradores de esta pestaña no se han eliminado.",
  "verified": "Correo confirmado. Ya puedes acceder a tu espacio.",
};
