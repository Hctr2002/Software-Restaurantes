/**
 * ProfileForm — Formulario de configuración de perfil del usuario ADMIN.
 * Permite actualizar nombre a mostrar y contraseña; dejar campos vacíos los omite del payload.
 */
"use client";

import React from "react";
import { Button, Input } from "@menu-bites/ui";
import { Save, User, KeyRound, Loader2, ShieldCheck } from "lucide-react";

interface ProfileFormProps {
  name: string;
  setName: (name: string) => void;
  password: string;
  setPassword: (pass: string) => void;
  onSave: (e: React.FormEvent) => void;
  loading: boolean;
}

export default function ProfileForm({
  name,
  setName,
  password,
  setPassword,
  onSave,
  loading
}: ProfileFormProps) {
  return (
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

      <form onSubmit={onSave} className="p-8 space-y-8">
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
  );
}
