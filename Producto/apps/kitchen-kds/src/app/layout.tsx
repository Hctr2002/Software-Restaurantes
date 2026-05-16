import type { Metadata } from "next";
import { cn } from "@menu-bites/ui/lib/utils";
import "@menu-bites/ui/styles/globals.css";
import KitchenThemeWrapper from "./KitchenThemeWrapper";

export const metadata: Metadata = {
  title: "Menu Bites | Kitchen KDS",
  description: "Kitchen Display System",
};

/**
 * Layout raíz para la aplicación de Cocina (KDS).
 * Envolvemos el contenido con KitchenThemeWrapper para asegurar que los colores
 * y tipografías se sincronicen con la marca del restaurante en tiempo real.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="dark">
      <body className={cn("font-sans antialiased bg-background text-foreground min-h-screen")}>
        <KitchenThemeWrapper>
          {children}
        </KitchenThemeWrapper>
        {/* W6.1: registro del service worker para modo offline */}
        <script dangerouslySetInnerHTML={{ __html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
              navigator.serviceWorker.register('/sw.js').catch(() => {});
            });
          }
        `}} />
      </body>
    </html>
  );
}
