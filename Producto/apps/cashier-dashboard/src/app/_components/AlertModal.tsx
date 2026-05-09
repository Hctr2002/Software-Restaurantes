"use client";

import { AlertTriangle, Loader2, X } from "lucide-react";
import { Button } from "@menu-bites/ui";

interface Props {
  tableNum: string;
  alertMsg: string;
  sendingAlert: boolean;
  alertSent: boolean;
  onTableNumChange: (v: string) => void;
  onMsgChange: (v: string) => void;
  onSend: () => void;
  onClose: () => void;
}

export function AlertModal({
  tableNum, alertMsg, sendingAlert, alertSent,
  onTableNumChange, onMsgChange, onSend, onClose,
}: Props) {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-xl z-[60] flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-card border border-border/10 rounded-[2.5rem] p-8 shadow-2xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-500/10 rounded-xl flex items-center justify-center border border-yellow-500/20">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
            </div>
            <h2 className="text-lg font-black tracking-tight text-foreground">Alerta al Admin</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar modal"
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="cashier_table_num" className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1.5 block">
              N° de Mesa (opcional)
            </label>
            <input
              id="cashier_table_num"
              type="number"
              placeholder="Ej. 3"
              value={tableNum}
              onChange={(e) => onTableNumChange(e.target.value)}
              className="w-full px-5 py-4 rounded-2xl bg-input border border-border/10 text-foreground text-sm font-bold focus:outline-none focus:ring-2 focus:ring-yellow-500/50 transition-all"
            />
          </div>
          <div>
            <label htmlFor="cashier_alert_msg" className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1.5 block">
              Mensaje de Emergencia
            </label>
            <textarea
              id="cashier_alert_msg"
              rows={3}
              placeholder="Explica el problema aquí..."
              value={alertMsg}
              onChange={(e) => onMsgChange(e.target.value)}
              className="w-full px-5 py-4 rounded-2xl bg-input border border-border/10 text-foreground text-sm font-bold focus:outline-none focus:ring-2 focus:ring-yellow-500/50 transition-all resize-none"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 h-14 rounded-2xl border-white/5 font-black uppercase text-[10px] tracking-widest"
          >
            Cerrar
          </Button>
          <Button
            onClick={() => {
              onSend();
            }}
            disabled={!alertMsg?.trim() || sendingAlert || alertSent}
            className="flex-1 h-14 bg-yellow-500 hover:bg-yellow-400 text-black font-black uppercase text-[10px] tracking-widest shadow-lg shadow-yellow-500/10"
          >
            {alertSent ? "✓ Enviado" : sendingAlert ? <Loader2 className="w-4 h-4 animate-spin" /> : "Enviar Alerta"}
          </Button>
        </div>
      </div>
    </div>
  );
}
