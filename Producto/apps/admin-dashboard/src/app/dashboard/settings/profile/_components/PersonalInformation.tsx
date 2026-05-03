"use client";

import React from "react";
import { User, KeyRound, Save } from "lucide-react";
import { Input, Button } from "@menu-bites/ui";

/**
 * Propiedades del formulario de Información Personal
 */
interface PersonalInformationProps {
  name: string;
  setName: (name: string) => void;
  password: string;
  setPassword: (password: string) => void;
  onSave: () => void;
  loading: boolean;
}

/**
 * PersonalInformation
 * 
 * Gestiona los datos básicos de identidad del administrador.
 * Permite actualizar el nombre visible y establecer una nueva contraseña de acceso.
 */
export default function PersonalInformation({
  name,
  setName,
  password,
  setPassword,
  onSave,
  loading
}: PersonalInformationProps) {
  return (
    <section className="glass-premium rounded-[2.5rem] overflow-hidden shadow-2xl">
      {/* Cabecera de la Sección */}
      <div className="p-8 border-b border-white/5">
        <h2 className="text-lg font-black text-white uppercase italic tracking-tight">Información Personal</h2>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Asegura y personaliza tu identidad</p>
      </div>

      {/* Formulario de Datos */}
      <form 
        onSubmit={(e) => { e.preventDefault(); onSave(); }} 
        className="p-8 space-y-6"
      >
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
            <User className="w-3.5 h-3.5" /> Nombre a Mostrar
          </label>
          <Input
            placeholder="e.g. Hector (Admin)"
            className="bg-white/5 border-white/10 rounded-2xl h-12 px-6 text-sm font-bold"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
            <KeyRound className="w-3.5 h-3.5" /> Nueva Contraseña
          </label>
          <Input
            type="password"
            placeholder="••••••••"
            className="bg-white/5 border-white/10 rounded-2xl h-12 px-6 text-sm font-bold"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <p className="text-[10px] text-slate-600 px-1 italic">Déjalo vacío si no deseas cambiarla</p>
        </div>

        <div className="pt-4">
          <Button 
            type="submit" 
            disabled={loading} 
            className="w-full h-12 bg-primary hover:bg-primary/80 text-white font-black uppercase italic tracking-widest rounded-2xl shadow-xl shadow-primary/20 transition-all active:scale-95"
          >
            {loading ? "Guardando..." : <><Save className="w-4 h-4 mr-2" /> Guardar Cambios</>}
          </Button>
        </div>
      </form>
    </section>
  );
}
