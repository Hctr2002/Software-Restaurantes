import type { Metadata } from "next";
import { cn } from "@menu-bites/ui/lib/utils";
import "@menu-bites/ui/styles/globals.css";

export const metadata: Metadata = {
  title: "Menu Bites | Bar Dashboard",
  description: "Bar Display System",
};

import BarThemeWrapper from "./BarThemeWrapper";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="dark">
      <body className={cn("font-sans antialiased bg-background text-foreground min-h-screen")}>
        <BarThemeWrapper>
          {children}
        </BarThemeWrapper>
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
