"use client";

import React from "react";
import { User, KeyRound, Save, ShieldCheck } from "lucide-react";
import { Input, Button } from "@menu-bites/ui";
import { motion } from "framer-motion";

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
 * Implementa una estética Glassmorphism con feedback visual de foco y hover.
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
    <section className="relative group">
      {/* Resplandor de fondo decorativo */}
      <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-accent/20 rounded-[2.5rem] blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
      
      <div className="relative bg-card border border-border rounded-[2.5rem] overflow-hidden shadow-2xl">
        {/* Cabecera de la Sección */}
        <div className="p-8 border-b border-border bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-2xl text-primary">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-foreground uppercase tracking-tight">Identidad</h2>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Gestión de Credenciales</p>
            </div>
          </div>
        </div>

        {/* Formulario de Datos */}
        <form 
          onSubmit={(e) => { e.preventDefault(); onSave(); }} 
          className="p-8 space-y-8"
        >
          <div className="space-y-3">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2 px-1">
              <User className="w-3.5 h-3.5 text-primary" /> Nombre Administrativo
            </label>
            <Input
              placeholder="e.g. Hector (Admin)"
              className="bg-muted/30 border-border focus:border-primary/50 focus:bg-muted/50 transition-all rounded-2xl h-14 px-6 text-sm font-bold placeholder:text-muted-foreground/30"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2 px-1">
              <KeyRound className="w-3.5 h-3.5 text-primary" /> Nueva Contraseña
            </label>
            <Input
              type="password"
              placeholder="••••••••"
              className="bg-muted/30 border-border focus:border-primary/50 focus:bg-muted/50 transition-all rounded-2xl h-14 px-6 text-sm font-bold placeholder:text-muted-foreground/30"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <p className="text-[10px] text-muted-foreground/60 px-1 italic font-medium flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-primary/40"></span>
              Dejar vacío para mantener la actual
            </p>
          </div>

          <div className="pt-4">
            <Button 
              type="submit" 
              disabled={loading} 
              className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed group/btn"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></div>
                  <span>Sincronizando...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <Save className="w-4 h-4 transition-transform group-hover/btn:-rotate-12" />
                  <span>Actualizar Perfil</span>
                </div>
              )}
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
}
