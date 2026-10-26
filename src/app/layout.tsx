import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tu primera marca · Linde",
  description: "Prepara el borrador de tu marca en Linde. Empieza con tu web o introduce los datos manualmente.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body>{children}</body></html>;
}
