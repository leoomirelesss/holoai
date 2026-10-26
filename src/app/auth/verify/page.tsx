import { AuthPage, type AuthSearch } from "@/features/auth/auth-page";
export const metadata = { title: "Confirmar correo · Linde" };
export const dynamic = "force-dynamic";
export default function Verify({ searchParams }: { searchParams: AuthSearch }) { return <AuthPage mode="verify" searchParams={searchParams} />; }
