"use client";
import { useEffect } from "react";
export function useLeaveGuard(unsaved: boolean) {
  useEffect(() => {
    if (!unsaved) return;
    const ask = () => window.confirm("Tienes cambios sin guardar o una escritura por comprobar. ¿Quieres salir? La copia de esta pestaña se conserva; puedes descargarla antes de continuar.");
    const unload = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    const click = (event: MouseEvent) => {
      const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!link || event.defaultPrevented) return;
      const destination = new URL((link as HTMLAnchorElement).href, location.href);
      if (destination.pathname === location.pathname && destination.search === location.search && destination.origin === location.origin) return;
      if (!ask()) { event.preventDefault(); event.stopImmediatePropagation(); }
    };
    const submit = (event: SubmitEvent) => { if (event.target instanceof HTMLFormElement && event.target.getAttribute("action") === "/auth/logout" && !ask()) { event.preventDefault(); event.stopImmediatePropagation(); } };
    let restoring = false;
    const pop = (event: PopStateEvent) => {
      if (restoring) { restoring = false; return; }
      if (!ask()) { event.stopImmediatePropagation(); restoring = true; history.forward(); }
    };
    window.addEventListener("beforeunload", unload);
    window.addEventListener("popstate", pop, true);
    document.addEventListener("click", click, true);
    document.addEventListener("submit", submit, true);
    return () => { window.removeEventListener("beforeunload", unload); window.removeEventListener("popstate", pop, true); document.removeEventListener("click", click, true); document.removeEventListener("submit", submit, true); };
  }, [unsaved]);
}
