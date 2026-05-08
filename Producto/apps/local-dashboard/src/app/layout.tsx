import type { Metadata } from "next";
import "@menu-bites/ui/styles/globals.css";
import { cn } from "@menu-bites/ui/lib/utils";

export const metadata: Metadata = {
  title: "Menu Bites | Panel Local",
  description: "Gestión de Restaurante",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="dark">
      <body className={cn("font-sans antialiased min-h-screen wow-gradient")}>
        {children}
      </body>
    </html>
  );
}
