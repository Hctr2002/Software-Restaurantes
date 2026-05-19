import type { Metadata } from "next";
import "@menu-bites/ui/styles/globals.css";
import { cn } from "@menu-bites/ui/lib/utils";
import AdminThemeWrapper from "./AdminThemeWrapper";

export const metadata: Metadata = {
  title: "Menu Bites | Admin Dashboard",
  description: "Enterprise Gastronomic Management System",
};

/**
 * Layout raíz para el Panel de Administración.
 * Se integra el AdminThemeWrapper para que todos los componentes hijos hereden
 * el branding dinámico y permitan la previsualización en vivo del laboratorio.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="dark">
      <body className={cn("font-sans antialiased min-h-screen wow-gradient")}>
        <AdminThemeWrapper>
          {children}
        </AdminThemeWrapper>
      </body>
    </html>
  );
}
