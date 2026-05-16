import type { Metadata } from "next";
import { cn } from "@menu-bites/ui/lib/utils";
import "@menu-bites/ui/styles/globals.css";
import CashierThemeWrapper from "./CashierThemeWrapper";

export const metadata: Metadata = {
  title: "Menu Bites | Caja",
  description: "Terminal de Cajero",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="dark">
      <body className={cn("font-sans antialiased bg-background text-foreground min-h-screen")}>
        <CashierThemeWrapper>{children}</CashierThemeWrapper>
      </body>
    </html>
  );
}
