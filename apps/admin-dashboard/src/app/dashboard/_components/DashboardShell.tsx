"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@menu-bites/store";
import { signOut } from "@menu-bites/auth";
import { Button } from "@menu-bites/ui";
import { LayoutDashboard, Store, Users, LogOut } from "lucide-react";

type DashboardShellProps = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
};

export default function DashboardShell({ title, subtitle, children }: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout: clearAuth } = useAuthStore();
  const [isSigningOut, setIsSigningOut] = React.useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
    } finally {
      clearAuth();
      router.replace("/");
      router.refresh();
      setIsSigningOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-primary/30">
      <aside className="fixed left-0 top-0 h-full w-64 bg-black/40 border-r border-white/5 backdrop-blur-3xl z-50 hidden lg:block">
        <div className="p-8">
          <h2 className="text-2xl font-black tracking-tighter uppercase italic">
            Menu <span className="text-primary">Bites</span>
          </h2>
          <p className="text-[8px] text-muted-foreground uppercase tracking-widest font-bold mt-1">
            Super Admin Console
          </p>
        </div>

        <nav className="mt-8 px-4 space-y-2">
          <NavItem href="/dashboard" icon={<LayoutDashboard className="w-5 h-5" />} label="Resumen" active={pathname === "/dashboard"} />
          <NavItem href="/dashboard/restaurants" icon={<Store className="w-5 h-5" />} label="Restaurantes" active={pathname.startsWith("/dashboard/restaurants")} />
          <NavItem href="/dashboard/users" icon={<Users className="w-5 h-5" />} label="Usuarios" active={pathname.startsWith("/dashboard/users")} />
        </nav>

        <div className="absolute bottom-8 left-0 w-full px-6">
          <Button
            variant="outline"
            className="w-full border-white/5 bg-white/5 hover:bg-destructive/20 hover:text-destructive hover:border-destructive/20 transition-all rounded-2xl"
            onClick={handleSignOut}
            disabled={isSigningOut}
          >
            <LogOut className="w-4 h-4 mr-2" />
            {isSigningOut ? "Cerrando..." : "Cerrar Sesion"}
          </Button>
        </div>
      </aside>

      <main className="lg:pl-64 min-h-screen">
        <header className="h-20 border-b border-white/5 flex items-center justify-between px-8 bg-black/20 backdrop-blur-xl sticky top-0 z-40">
          <h1 className="text-xl font-bold tracking-tight">
            {title} <span className="text-muted-foreground font-normal">/ {subtitle}</span>
          </h1>

          <div className="flex items-center space-x-4">
            <div className="h-10 w-48 bg-white/5 rounded-2xl border border-white/5 flex items-center px-3 space-x-3">
              <div className="w-6 h-6 bg-primary/20 rounded-md flex items-center justify-center">
                <LayoutDashboard className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-white leading-none">Super Admin</p>
                <p className="text-[8px] text-muted-foreground uppercase font-black truncate max-w-[100px]">{user?.email}</p>
              </div>
            </div>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto space-y-8">{children}</div>
      </main>
    </div>
  );
}

function NavItem({
  href,
  icon,
  label,
  active,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl transition-all ${
        active
          ? "bg-primary/10 text-primary border border-primary/20"
          : "text-muted-foreground hover:bg-white/5 hover:text-white"
      }`}
    >
      {icon}
      <span className="text-sm font-bold tracking-tight">{label}</span>
    </Link>
  );
}
