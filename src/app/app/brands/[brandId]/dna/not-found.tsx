import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
export default function ProfileNotFound() {
  return <AppShell authenticated onboarding><div className="onboarding-page"><div className="page-intro"><span className="eyebrow">BRAND DNA</span><h1>Perfil no disponible.</h1><p className="intro-description">No podemos mostrar este perfil. Comprueba que utilizas la cuenta autorizada y vuelve a tu espacio.</p></div><Link href="/app" className="button button--secondary">Volver a mi espacio</Link></div></AppShell>;
}
