import type { Metadata } from "next";
import "@menu-bites/ui/styles/globals.css";
import { cn } from "@menu-bites/ui/lib/utils";
import LocalThemeWrapper from "./LocalThemeWrapper";

export const metadata: Metadata = {
  title: "Menu Bites | Panel Local",
  description: "Gestión de Restaurante",
};

/**
 * Layout raíz para el Panel Local.
 * Envolvemos con LocalThemeWrapper para permitir la sincronización de marca y
 * la previsualización en vivo dentro del Laboratorio de Diseño.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="dark">
      <body className={cn("font-sans antialiased min-h-screen bg-background text-foreground transition-colors duration-300")}>
        <LocalThemeWrapper>
          {children}
        </LocalThemeWrapper>
      </body>
    </html>
  );
}
