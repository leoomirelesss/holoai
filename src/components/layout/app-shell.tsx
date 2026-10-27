"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

function Navigation({ onNavigate, href = "/", dnaHref, dnaActive = false }: { onNavigate?: () => void; href?: string; dnaHref?: string; dnaActive?: boolean }) {
  return (
    <nav aria-label="Navegación principal" className="navigation">
      <Link href={href} aria-current={dnaActive && dnaHref ? undefined : "page"} className={dnaActive && dnaHref ? "nav-context" : "nav-current"} onClick={onNavigate}>Configurar marca <Icon name="chevron" /></Link>
      {dnaHref && <Link href={dnaHref} aria-current={dnaActive ? "page" : undefined} className="nav-current" onClick={onNavigate}>Brand DNA <Icon name="chevron" /></Link>}
      <p className="nav-label">Siguientes etapas</p>
      <ul className="nav-planned">
        {["Crear anuncio", ...(dnaHref ? [] : ["Brand DNA"]), "Productos", "Biblioteca"].map((label) => (
          <li key={label}><span>{label}</span><span className="text-caption text-text-muted">No disponible</span></li>
        ))}
      </ul>
      <p className="nav-explanation">Estamos preparando estas secciones. Por ahora puedes empezar el borrador de tu marca.</p>
    </nav>
  );
}

/** Onboarding stays outside the workspace sidebar, per the approved design. */
export function AppShell({ children, onboarding = false, authenticated = false, dnaHref, dnaActive = false }: { children: ReactNode; onboarding?: boolean; authenticated?: boolean; dnaHref?: string; dnaActive?: boolean }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  function containDialogFocus(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key !== "Tab") return;
    const controls = event.currentTarget.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex="0"]');
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  }

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (menuOpen && !dialog.open) dialog.showModal();
    if (!menuOpen && dialog.open) dialog.close();
    if (!menuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, [menuOpen]);

  return (
    <div className={`app-shell ${onboarding ? "app-shell--onboarding" : "app-shell--workspace"}`}>
      <a href="#main-content" className="skip-link">Saltar al contenido</a>
      {!onboarding && <aside className="workspace-sidebar"><Link href={authenticated ? "/app" : "/"} className="wordmark">Linde</Link><Navigation dnaHref={dnaHref} dnaActive={dnaActive} href={authenticated ? "/app" : "/"} /></aside>}
      <div className="app-body">
        <header className="app-header">
          <Link href={authenticated ? "/app" : "/"} aria-label="Linde, inicio" className="wordmark">Linde<span className="wordmark-dot" aria-hidden="true" /></Link>
          <span className="header-context">Tu primera marca</span>
          <div className="header-actions">
            {authenticated ? <form method="post" action="/auth/logout"><Button variant="ghost" type="submit">Cerrar sesión</Button></form> : <Link href="/auth/login" className="button button--ghost">Entrar</Link>}
            <Button variant="ghost" className="menu-trigger" aria-haspopup="dialog" aria-expanded={menuOpen} aria-controls="navigation-dialog" onClick={() => setMenuOpen(true)}><Icon name="menu" /><span>Navegación</span></Button>
          </div>
        </header>
        <main id="main-content" tabIndex={-1}>{children}</main>
        <footer className="app-footer"><span>Linde · Un espacio para tu próxima idea.</span><span>Base frontend · Sin análisis automático</span></footer>
      </div>
      <dialog ref={dialogRef} id="navigation-dialog" aria-labelledby="navigation-title" aria-describedby="navigation-description" className="navigation-dialog" onKeyDown={containDialogFocus} onCancel={() => setMenuOpen(false)} onClose={() => setMenuOpen(false)}>
        <div className="dialog-heading"><h2 id="navigation-title">Tu espacio Linde</h2><Button variant="ghost" className="icon-button" aria-label="Cerrar navegación" onClick={() => setMenuOpen(false)}><Icon name="close" /></Button></div>
        <p id="navigation-description" className="dialog-description">Empieza por la información de tu marca.</p>
        <Navigation dnaHref={dnaHref} dnaActive={dnaActive} href={authenticated ? "/app" : "/"} onNavigate={() => setMenuOpen(false)} />
      </dialog>
    </div>
  );
}
