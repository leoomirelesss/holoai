import { createHash } from "node:crypto";
import { AppShell } from "@/components/layout/app-shell";
import { BrandStart } from "@/features/onboarding/brand-start";
import { requireUser } from "@/lib/auth/session";
import { Notice } from "@/components/ui/surface";

export const dynamic = "force-dynamic";

export default async function PrivateOnboarding({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser();
  const onboardingScope = createHash("sha256").update(user.id).digest("hex");
  const params = await searchParams;
  return <AppShell onboarding authenticated>
    {params.notice === "logout-failed" && <div className="account-notice"><Notice tone="warning" title="No pudimos cerrar la sesión"><p>Vuelve a intentarlo. No se ha confirmado el cierre de tus sesiones.</p></Notice></div>}
    <BrandStart key={onboardingScope} persistenceScope={onboardingScope} />
  </AppShell>;
}
