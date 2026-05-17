"use client";

import { useState } from "react";
import { AlertTriangle, Loader2, X } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@menu-bites/ui";
import { sendAlert } from "@menu-bites/auth";

interface Props {
  restaurantId: string | undefined;
  userId: string | undefined;
  userEmail: string | undefined;
  onClose: () => void;
}

export function StockAlertModal({ restaurantId, userId, userEmail, onClose }: Props) {
  const [alertItem, setAlertItem] = useState("");
  const [alertMsg, setAlertMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!alertMsg.trim() || !restaurantId) return;
    setSending(true);
    const { error } = await sendAlert({
      restaurantId,
      userId: userId ?? "",
      userEmail: userEmail ?? "",
      type: "STOCK_SHORTAGE",
      message: alertMsg.trim(),
      menuItemName: alertItem.trim() || undefined,
    });
    setSending(false);
    if (!error) {
      setSent(true);
      setTimeout(() => { setSent(false); onClose(); }, 1500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60" onClick={onClose} />
      <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="w-full max-w-lg bg-card rounded-[3rem] p-10 space-y-8 relative shadow-2xl border border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-500/10 rounded-2xl">
              <AlertTriangle className="w-6 h-6 text-yellow-500" />
            </div>
            <h2 className="text-xl font-black text-foreground tracking-tighter uppercase italic">Reportar Quiebre</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-muted/30 border border-border hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Producto Afectado</label>
            <input
              type="text"
              placeholder="Ej. Salmón Ahumado..."
              value={alertItem}
              onChange={(e) => setAlertItem(e.target.value)}
              className="w-full px-6 py-4 rounded-2xl bg-muted/30 border border-border text-foreground font-bold placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-yellow-500/50"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Mensaje Detallado</label>
            <textarea
              rows={3}
              placeholder="Indica el motivo o cantidad restante..."
              value={alertMsg}
              onChange={(e) => setAlertMsg(e.target.value)}
              className="w-full px-6 py-4 rounded-2xl bg-muted/30 border border-border text-foreground font-bold placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-yellow-500/50 resize-none"
            />
          </div>
        </div>

        <div className="flex gap-4">
          <Button variant="outline" onClick={onClose} className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-[10px]">
            Cancelar
          </Button>
          <Button
            onClick={handleSend}
            disabled={!alertMsg.trim() || sending || sent}
            className="flex-1 h-14 rounded-2xl bg-yellow-500 hover:bg-yellow-400 text-black font-black uppercase tracking-widest text-[10px] gap-2 shadow-xl shadow-yellow-500/20"
          >
            {sent ? "Enviado" : sending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Enviar Alerta"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
