"use client";

import React, { useState } from "react";
import { useAuthStore } from "@menu-bites/store";
import { useTables, signOut, sendAlert, AlertType } from "@menu-bites/auth";
import { TableGrid, TableCard, Button } from "@menu-bites/ui";
import { useRouter } from "next/navigation";
import { LayoutDashboard, LogOut, User, AlertTriangle, X, Loader2 } from "lucide-react";

const ALERT_OPTIONS: { type: AlertType; label: string; color: string }[] = [
  { type: "TABLE_ISSUE",  label: "Problema en Mesa", color: "border-red-500/40 text-red-400 hover:bg-red-500/10" },
  { type: "BILL_REQUEST", label: "Pedir Cuenta",      color: "border-yellow-500/40 text-yellow-400 hover:bg-yellow-500/10" },
  { type: "HELP_REQUEST", label: "Necesito Ayuda",    color: "border-blue-500/40 text-blue-400 hover:bg-blue-500/10" },
  { type: "GENERAL",      label: "Mensaje General",   color: "border-slate-500/40 text-slate-400 hover:bg-slate-500/10" },
];

export default function WaiterDashboard() {
  const { user, logout: clearAuth } = useAuthStore();
  const { tables, loading }         = useTables(user?.restaurantId);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [alertModal, setAlertModal]     = useState(false);
  const [alertType, setAlertType]       = useState<AlertType>("HELP_REQUEST");
  const [alertMsg, setAlertMsg]         = useState("");
  const [tableNum, setTableNum]         = useState("");
  const [sendingAlert, setSendingAlert] = useState(false);
  const [alertSent, setAlertSent]       = useState(false);
  const router = useRouter();

  const handleSignOut = async () => {
    const loginUrl = process.env.NEXT_PUBLIC_AUTH_URL;
    setIsSigningOut(true);
    try {
      await signOut();
    } finally {
      clearAuth();
      router.refresh();
      window.location.href = loginUrl;
    }
  };

  const handleSendAlert = async () => {
    if (!alertMsg.trim() || !user?.restaurantId) return;
    setSendingAlert(true);
    const { error } = await sendAlert({
      restaurantId: user.restaurantId,
      userId:       user.id,
      userEmail:    user.email,
      type:         alertType,
      message:      alertMsg.trim(),
      tableNumber:  tableNum ? parseInt(tableNum) : undefined,
    });
    setSendingAlert(false);
    if (!error) {
      setAlertSent(true);
      setTimeout(() => {
        setAlertSent(false);
        setAlertModal(false);
        setAlertMsg("");
        setTableNum("");
        setAlertType("HELP_REQUEST");
      }, 1500);
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
      <header className="glass sticky top-0 z-50 p-4 flex justify-between items-center border-b border-white/5">
        <div className="flex items-center space-x-3">
          <div className="bg-primary/20 p-2 rounded-xl">
            <LayoutDashboard className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-none">Terminal de Garzón</h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mt-1">
              {user?.restaurantId?.slice(0, 8)}...
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold">{user?.email}</p>
            <p className="text-[10px] text-primary uppercase font-black">{user?.role}</p>
          </div>

          {/* Botón de alerta */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => setAlertModal(true)}
            className="rounded-xl bg-yellow-500/10 border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20"
            title="Enviar alerta al administrador"
          >
            <AlertTriangle className="w-5 h-5" />
          </Button>

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

      <nav className="fixed bottom-0 inset-x-0 glass border-t border-white/5 p-4 flex justify-around items-center sm:hidden">
        <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">
          Menú Bites Mobile Terminal
        </span>
      </nav>

      {/* Modal de alerta */}
      {alertModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-400" /> Enviar Alerta
              </h2>
              <button onClick={() => setAlertModal(false)} className="p-1 rounded text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tipo de alerta */}
            <div className="grid grid-cols-2 gap-2">
              {ALERT_OPTIONS.map((opt) => (
                <button
                  key={opt.type}
                  onClick={() => setAlertType(opt.type)}
                  className={`px-3 py-2 rounded-lg border text-xs font-semibold transition-colors ${opt.color} ${alertType === opt.type ? "ring-2 ring-current" : ""}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">N° de Mesa (opcional)</label>
                <input
                  type="number"
                  min={1}
                  placeholder="Ej. 5"
                  value={tableNum}
                  onChange={(e) => setTableNum(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Mensaje *</label>
                <textarea
                  rows={3}
                  placeholder="Describe la situación..."
                  value={alertMsg}
                  onChange={(e) => setAlertMsg(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setAlertModal(false)} className="flex-1">Cancelar</Button>
              <Button
                onClick={handleSendAlert}
                disabled={!alertMsg.trim() || sendingAlert || alertSent}
                className="flex-1 bg-yellow-600 hover:bg-yellow-500 text-black font-bold gap-2"
              >
                {alertSent ? "✓ Enviado" : sendingAlert ? <Loader2 className="w-4 h-4 animate-spin" /> : "Enviar"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
