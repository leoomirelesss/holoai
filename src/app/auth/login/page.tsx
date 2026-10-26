import { AuthPage, type AuthSearch } from "@/features/auth/auth-page";
export const metadata = { title: "Entrar · Linde" };
export const dynamic = "force-dynamic";
export default function Login({ searchParams }: { searchParams: AuthSearch }) { return <AuthPage mode="login" searchParams={searchParams} />; }
