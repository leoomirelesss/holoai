import { AuthPage, type AuthSearch } from "@/features/auth/auth-page";
export const metadata = { title: "Recuperar acceso · Linde" };
export const dynamic = "force-dynamic";
export default function Recover({ searchParams }: { searchParams: AuthSearch }) { return <AuthPage mode="recover" searchParams={searchParams} />; }
