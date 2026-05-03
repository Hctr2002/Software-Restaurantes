"use client";

import React, { useState } from "react";
import LocalShell from "../../_components/LocalShell";
import { Button, Input } from "@menu-bites/ui";
import { Save, User, KeyRound, Loader2, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

export default function ProfileSettingsPage() {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() && !password.trim()) {
      setMessage({ type: "error", text: "No hay cambios para guardar." });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const payload: Record<string, string> = {};
      if (name.trim()) payload.name = name;
      if (password.trim()) payload.password = password;

      const res = await fetch("/api/local/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "No se pudo actualizar el perfil.");

      setMessage({ type: "success", text: "Perfil actualizado correctamente." });
      setPassword("");
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Error desconocido" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <LocalShell title="Cuenta" subtitle="Configuración de Perfil">
      <div className="max-w-2xl mx-auto lg:mx-0">
        {message && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-5 rounded-[1.5rem] border text-[10px] font-black uppercase tracking-widest mb-8 ${
            message.type === "error"
              ? "border-destructive/30 bg-destructive/10 text-destructive"
              : "border-primary/30 bg-primary/10 text-primary"
          }`}>
            {message.text}
          </motion.div>
        )}

        <div className="glass rounded-[2.5rem] border-white/5 overflow-hidden">
          <div className="p-8 border-b border-white/5 flex items-center gap-4 bg-white/5">
            <div className="p-3 rounded-2xl bg-primary/10 text-primary">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-foreground uppercase italic tracking-tight leading-none">Seguridad del Usuario</h2>
              <p className="text-[10px] font-bold text-foreground/30 uppercase tracking-widest mt-1">Gestiona tu identidad y acceso al panel.</p>
            </div>
          </div>

          <form onSubmit={handleSave} className="p-8 space-y-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em] px-1 flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-primary" /> Nombre a Mostrar
              </label>
              <Input
                placeholder="Ej. Juan (Admin Local)"
                className="bg-white/5 border-white/10 h-12 rounded-2xl focus-visible:ring-primary text-foreground font-medium"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <p className="text-[9px] font-bold text-foreground/20 uppercase tracking-widest px-1">Tu nombre a mostrar en el panel administrativo.</p>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em] px-1 flex items-center gap-2">
                <KeyRound className="w-3.5 h-3.5 text-primary" /> Nueva Contraseña
              </label>
              <Input
                type="password"
                placeholder="••••••••"
                className="bg-white/5 border-white/10 h-12 rounded-2xl focus-visible:ring-primary text-foreground font-medium"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <p className="text-[9px] font-bold text-foreground/20 uppercase tracking-widest px-1">Déjalo en blanco si no deseas cambiar tu contraseña actual.</p>
            </div>

            <div className="pt-4 flex justify-end">
              <Button 
                type="submit" 
                disabled={loading} 
                className="bg-primary hover:bg-primary/80 text-primary-foreground font-black uppercase tracking-widest text-[10px] h-12 px-8 rounded-2xl shadow-lg shadow-primary/20 transition-all active:scale-95"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4 mr-2" /> Guardar Cambios</>}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </LocalShell>
  );
}
