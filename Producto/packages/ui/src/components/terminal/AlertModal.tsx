"use client";

import React from "react";
import { AlertTriangle, Loader2, X } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "../ui/button";

// Note: This matches AlertType from @menu-bites/auth
type AlertType = 'TABLE_ISSUE' | 'BILL_REQUEST' | 'STOCK_SHORTAGE' | 'HELP_REQUEST' | 'GENERAL';

const ALERT_OPTIONS: { type: AlertType; label: string }[] = [
  { type: "TABLE_ISSUE",  label: "Problema en Mesa" },
  { type: "BILL_REQUEST", label: "Pedir Cuenta" },
  { type: "HELP_REQUEST", label: "Necesito Ayuda" },
  { type: "GENERAL",      label: "Mensaje General" },
];

interface AlertModalProps {
  alertType: AlertType;
  setAlertType: (type: AlertType) => void;
  alertMsg: string;
  setAlertMsg: (msg: string) => void;
  tableNum: string;
  setTableNum: (num: string) => void;
  sendingAlert: boolean;
  alertSent: boolean;
  onSend: () => void;
  onClose: () => void;
}

export function AlertModal({
  alertType, setAlertType,
  alertMsg, setAlertMsg,
  tableNum, setTableNum,
  sendingAlert, alertSent,
  onSend, onClose
}: AlertModalProps) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-background/80 backdrop-blur-xl"
        onClick={onClose}
      />
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative w-full max-w-lg bg-card border border-white/10 rounded-[3rem] p-10 shadow-2xl space-y-8"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-yellow-500/10 rounded-[1.5rem] flex items-center justify-center border border-yellow-500/20">
              <AlertTriangle className="w-7 h-7 text-yellow-500" />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tighter leading-none">Canal de Emergencia</h2>
              <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-1.5 opacity-60">
                Notificación directa al administrador
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 rounded-2xl text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {ALERT_OPTIONS.map((opt) => (
            <button
              key={opt.type}
              onClick={() => setAlertType(opt.type)}
              className={`px-5 py-4 rounded-[1.5rem] border text-[10px] font-black uppercase tracking-widest transition-all text-center ${
                alertType === opt.type
                  ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
                  : "bg-white/5 border-white/5 text-muted-foreground hover:text-foreground hover:bg-white/10"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="space-y-6">
          <div>
            <label htmlFor="alert_table" className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 ml-1 block opacity-70">
              N° de Mesa Afectada
            </label>
            <input
              id="alert_table"
              type="number"
              placeholder="Ej. 5"
              value={tableNum}
              onChange={(e) => setTableNum(e.target.value)}
              className="w-full bg-background border border-white/5 rounded-[1.5rem] p-5 focus:outline-none focus:border-yellow-500/50 transition-all font-bold text-sm"
            />
          </div>
          <div>
            <label htmlFor="alert_msg" className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 ml-1 block opacity-70">
              Descripción del Problema
            </label>
            <textarea
              id="alert_msg"
              rows={3}
              placeholder="Escribe los detalles aquí..."
              value={alertMsg}
              onChange={(e) => setAlertMsg(e.target.value)}
              className="w-full bg-background border border-white/5 rounded-[1.5rem] p-5 focus:outline-none focus:border-yellow-500/50 transition-all font-bold text-sm resize-none"
            />
          </div>
        </div>

        <div className="flex gap-4 pt-2">
          <Button variant="outline" onClick={onClose} className="flex-1 h-16 rounded-[1.5rem] border-white/5 font-black uppercase text-[10px] tracking-[0.2em]">
            Cancelar
          </Button>
          <Button
            onClick={onSend}
            disabled={!alertMsg.trim() || sendingAlert || alertSent}
            className="flex-1 h-16 bg-yellow-500 hover:bg-yellow-400 text-black font-black uppercase text-[10px] tracking-[0.2em] shadow-xl shadow-yellow-500/20"
          >
            {alertSent ? "Enviado" : sendingAlert ? <Loader2 className="w-5 h-5 animate-spin" /> : "Emitir Alerta"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
