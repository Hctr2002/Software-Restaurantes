import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@menu-bites/ui/styles/globals.css";
import { cn } from "@menu-bites/ui/lib/utils";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Menu Bites | Admin Dashboard",
  description: "Enterprise Gastronomic Management System",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="dark">
      <body className={cn(inter.className, "antialiased min-h-screen wow-gradient")}>
        {children}
      </body>
    </html>
  );
}
