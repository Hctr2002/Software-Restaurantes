"use client";

import React, { useState } from "react";
import LocalShell from "../../_components/LocalShell";
import { Button, Input } from "@menu-bites/ui";
import { Save, User, KeyRound } from "lucide-react";

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
      <div className="max-w-2xl">
        {message && (
          <div className={`p-4 rounded-md border text-sm font-medium mb-6 ${
            message.type === "error"
              ? "border-red-500/30 bg-red-500/10 text-red-500"
              : "border-green-500/30 bg-green-500/10 text-green-500"
          }`}>
            {message.text}
          </div>
        )}

        <div className="bg-slate-900/30 border border-slate-800 rounded-lg overflow-hidden">
          <div className="p-6 border-b border-slate-800">
            <h2 className="text-lg font-semibold text-slate-200">Información Personal</h2>
            <p className="text-sm text-slate-500 mt-1">Actualiza tus datos personales y asegura tu cuenta.</p>
          </div>

          <form onSubmit={handleSave} className="p-6 space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <User className="w-3.5 h-3.5" /> Nombre a Mostrar
              </label>
              <Input
                placeholder="Ej. Juan (Admin Local)"
                className="bg-slate-950 border-slate-800"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <p className="text-[11px] text-slate-500">Tu nombre a mostrar en el panel.</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <KeyRound className="w-3.5 h-3.5" /> Nueva Contraseña
              </label>
              <Input
                type="password"
                placeholder="••••••••"
                className="bg-slate-950 border-slate-800"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <p className="text-[11px] text-slate-500">Déjalo en blanco si no deseas cambiar tu contraseña.</p>
            </div>

            <div className="pt-4 flex justify-end">
              <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px]">
                {loading ? "Guardando..." : <><Save className="w-4 h-4 mr-2" /> Guardar Cambios</>}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </LocalShell>
  );
}
