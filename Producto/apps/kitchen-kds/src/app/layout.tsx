import type { Metadata } from "next";
import { cn } from "@menu-bites/ui/lib/utils";
import "@menu-bites/ui/styles/globals.css";

export const metadata: Metadata = {
  title: "Menu Bites | Kitchen KDS",
  description: "Kitchen Display System",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="dark">
      <body className={cn("antialiased bg-background text-foreground min-h-screen")}>
        {children}
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
