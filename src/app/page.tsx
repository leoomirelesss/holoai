import { AppShell } from "@/components/layout/app-shell";
import { BrandStart } from "@/features/onboarding/brand-start";

export default function HomePage() {
  return <AppShell onboarding><BrandStart /></AppShell>;
}
