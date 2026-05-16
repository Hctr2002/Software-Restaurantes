import type { Metadata } from "next";
import { cn } from "@menu-bites/ui/lib/utils";
import "@menu-bites/ui/styles/globals.css";
import WaiterThemeWrapper from "./WaiterThemeWrapper";

export const metadata: Metadata = {
  title: "Menu Bites | Waiter Terminal",
  description: "Mobile Ordering Terminal for Waiters",
};

/**
 * Layout raíz para la Terminal de Garzón.
 * Envolvemos con WaiterThemeWrapper para garantizar que la tipografía y los colores
 * de marca se hereden correctamente en todas las subpáginas (mesas, menú, etc.).
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="dark">
      <body className={cn("font-sans antialiased bg-background text-foreground min-h-screen")}>
        <WaiterThemeWrapper>
          {children}
        </WaiterThemeWrapper>
      </body>
    </html>
  );
}
