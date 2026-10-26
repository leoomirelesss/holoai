import Link from "next/link";
import type { ReactNode } from "react";

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="auth-shell">
      <a href="#main-content" className="skip-link">Saltar al contenido</a>
      <header className="app-header"><Link href="/" className="wordmark" aria-label="Linde, borrador local">Linde<span className="wordmark-dot" aria-hidden="true" /></Link><span className="text-small text-text-muted">Tu espacio creativo</span></header>
      <main id="main-content" tabIndex={-1} className="auth-main"><div className="auth-content">{children}<p className="auth-local-link"><Link href="/">Continuar con un borrador local</Link></p></div></main>
      <footer className="app-footer"><span>Linde · Crea con criterio.</span><span>Acceso con correo y contraseña</span></footer>
    </div>
  );
}
