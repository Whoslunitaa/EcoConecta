import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "EcoConecta - Villas de San Pablo",
  description: "Gestión comunitaria de residuos y economía circular",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
