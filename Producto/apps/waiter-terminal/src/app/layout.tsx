import type { Metadata } from "next";
import { cn } from "@menu-bites/ui/lib/utils";
import "@menu-bites/ui/styles/globals.css";

export const metadata: Metadata = {
  title: "Menu Bites | Waiter Terminal",
  description: "Mobile Ordering Terminal for Waiters",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="dark">
      <body className={cn("antialiased bg-slate-900 min-h-screen")}>
        {children}
      </body>
    </html>
  );
}
