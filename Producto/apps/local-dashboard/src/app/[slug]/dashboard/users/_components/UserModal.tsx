"use client";

import React, { useState } from "react";
import { Modal, Button, Input } from "@menu-bites/ui";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { LOCAL_ROLES, LocalUserRecord } from "@/app/[slug]/dashboard/_components/localShared";

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingUser: LocalUserRecord | null;
  form: any;
  setForm: (form: any) => void;
  onSave: () => Promise<void>;
  saving: boolean;
}

export function UserModal({
  isOpen,
  onClose,
  editingUser,
  form,
  setForm,
  onSave,
  saving,
}: UserModalProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setError(null);
    try {
      await onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingUser ? "Editar Usuario" : "Nuevo Usuario"}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} className="text-foreground/50 hover:bg-foreground/5 hover:text-foreground rounded-xl font-bold uppercase tracking-widest text-[10px]">
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving} className="bg-primary hover:bg-primary/80 text-primary-foreground rounded-xl font-bold uppercase tracking-widest text-[10px] px-6 shadow-lg shadow-primary/20 transition-all">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editingUser ? "Guardar cambios" : "Crear Usuario"}
          </Button>
        </>
      }
    >
      <div className="space-y-8 py-4">
        {error && (
          <div className="p-3 rounded-xl bg-destructive/10 text-destructive text-[10px] font-bold uppercase tracking-widest border border-destructive/20">
            {error}
          </div>
        )}
        
        <div className="space-y-3">
          <label className="text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em] px-1">
            Correo electrónico <span className="text-destructive">*</span>
          </label>
          <Input
            type="email"
            placeholder="usuario@restaurante.com"
            className="bg-foreground/5 border-foreground/10 h-12 rounded-2xl focus-visible:ring-primary text-foreground font-medium"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>

        <div className="space-y-3">
          <label className="text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em] px-1">
            Contraseña {editingUser ? "(dejar en blanco para no cambiar)" : <span className="text-destructive">*</span>}
          </label>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder={editingUser ? "••••••••" : "Mínimo 6 caracteres"}
              className="bg-foreground/5 border-foreground/10 h-12 rounded-2xl focus-visible:ring-primary text-foreground font-medium pr-10"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/20 hover:text-primary transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em] px-1">Rol</label>
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            className="w-full h-12 rounded-2xl border border-foreground/10 bg-foreground/5 px-4 text-sm text-foreground font-bold focus:outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer"
          >
            {LOCAL_ROLES.map((r) => (
              <option key={r} value={r} className="bg-background">{r}</option>
            ))}
          </select>
          <p className="text-[9px] text-foreground/20 font-bold uppercase tracking-wider px-1">
            El usuario quedará asociado automáticamente a este restaurante.
          </p>
        </div>
      </div>
    </Modal>
  );
}
