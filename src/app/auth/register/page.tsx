import { AuthPage, type AuthSearch } from "@/features/auth/auth-page";
export const metadata = { title: "Crear cuenta · Linde" };
export const dynamic = "force-dynamic";
export default function Register({ searchParams }: { searchParams: AuthSearch }) { return <AuthPage mode="register" searchParams={searchParams} />; }
