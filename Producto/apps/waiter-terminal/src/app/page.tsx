"use client";

import React from "react";
import { useAuthStore } from "@menu-bites/store";
import { useTables, signOut } from "@menu-bites/auth";
import { TableGrid, TableCard, Button } from "@menu-bites/ui";
import { useRouter } from "next/navigation";
import { LayoutDashboard, LogOut, User } from "lucide-react";

export default function WaiterDashboard() {
  const { user, logout: clearAuth } = useAuthStore();
  const { tables, loading } = useTables(user?.restaurantId);
  const [isSigningOut, setIsSigningOut] = React.useState(false);
  const router = useRouter();

  const handleSignOut = async () => {
    const loginUrl = process.env.NEXT_PUBLIC_AUTH_URL || "http://localhost:3000";

    setIsSigningOut(true);
    try {
      await signOut();
    } finally {
      clearAuth();
      router.refresh();
      window.location.href = loginUrl;
      setIsSigningOut(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white pb-20">
      {/* Header Premium */}
      <header className="glass sticky top-0 z-50 p-4 flex justify-between items-center border-b border-white/5">
        <div className="flex items-center space-x-3">
          <div className="bg-primary/20 p-2 rounded-xl">
            <LayoutDashboard className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-none">Terminal de Garzón</h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mt-1">
              Restaurante ID: {user?.restaurantId?.slice(0, 8)}...
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold">{user?.email}</p>
            <p className="text-[10px] text-primary uppercase font-black">{user?.role}</p>
          </div>
          <Button 
            variant="outline"
            size="icon"
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="rounded-xl bg-white/5 border-white/5 hover:bg-destructive/20 hover:text-destructive hover:border-destructive/20 transition-all"
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 px-4 space-y-8">
        <div className="flex flex-col space-y-2">
          <h2 className="text-3xl font-black tracking-tighter">Selección de Mesa</h2>
          <p className="text-muted-foreground text-sm font-medium">
            Selecciona una mesa libre para comenzar a tomar el pedido.
          </p>
        </div>

        <TableGrid>
          {tables.map((table) => (
            <TableCard
              key={table.id}
              number={table.number}
              status={table.status}
              label={table.label}
              onClick={() => router.push(`/tables/${table.id}/menu`)}
            />
          ))}
        </TableGrid>

        {tables.length === 0 && !loading && (
          <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
            <User className="w-12 h-12 mx-auto text-muted-foreground opacity-20 mb-4" />
            <p className="text-muted-foreground font-medium">No hay mesas configuradas aún.</p>
          </div>
        )}
      </main>

      {/* Bottom Navigation for Mobile Quick Access */}
      <nav className="fixed bottom-0 inset-x-0 glass border-t border-white/5 p-4 flex justify-around items-center sm:hidden">
         {/* Could add quick menu links here */}
         <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">
           Menú Bites Mobile Terminal
         </span>
      </nav>
    </div>
  );
}
