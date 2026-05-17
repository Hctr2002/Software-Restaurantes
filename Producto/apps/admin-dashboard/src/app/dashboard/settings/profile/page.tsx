"use client";
/**
 * @file ProfileSettingsPage.tsx
 * @description Orquestador de configuración de identidad para administradores.
 * @version 2.2.0
 * 
 * Este módulo centraliza la gestión del perfil del usuario (Super-Admin).
 * Implementa:
 * - Persistencia asíncrona con Supabase Auth.
 * - Feedback visual Pro-Max con estados de carga reactivos.
 * - Estética Glassmorphism con desenfoques y transparencias semánticas.
 */

import { useState } from "react";
import { useAuthStore, type UserIdentity } from "@menu-bites/store";
import DashboardShell from "../../_components/DashboardShell";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, CheckCircle2 } from "lucide-react";

// Importación de sub-componentes modularizados
import PersonalInformation from "./_components/PersonalInformation";

export default function ProfileSettingsPage() {
  const { user, setUser } = useAuthStore();

  // Estados Locales de Perfil
  const [name, setName] = useState(user?.user_metadata?.name || "");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  /**
   * handleSave: Persiste los cambios de perfil en la base de datos.
   */
  const handleSave = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, password }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "No se pudo actualizar el perfil.");

      const { supabase: supabaseClient } = await import("@menu-bites/auth");
      const { data: { user: updatedUser } } = await supabaseClient.auth.getUser(); 
      
      if (updatedUser && user) {
        setUser({
          ...user,
          user_metadata: updatedUser.user_metadata,
        } satisfies UserIdentity);
      }

      setMessage({ type: "success", text: "Perfil actualizado correctamente. Los cambios ahora son persistentes." });
      setPassword(""); 
      
      // Auto-ocultar mensaje después de 5 segundos
      setTimeout(() => setMessage(null), 5000);
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Error desconocido" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardShell title="Sistema" subtitle="Configuración">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl space-y-10"
      >
        {/* Sistema de Notificaciones Premium */}
        <AnimatePresence mode="wait">
          {message && (
            <motion.div 
              initial={{ opacity: 0, height: 0, scale: 0.95 }}
              animate={{ opacity: 1, height: "auto", scale: 1 }}
              exit={{ opacity: 0, height: 0, scale: 0.95 }}
              className={`relative overflow-hidden p-5 rounded-[2rem] border flex items-center gap-4 shadow-lg ${
                message.type === "error"
                  ? "border-destructive/30 bg-destructive/10 text-destructive"
                  : "border-success/30 bg-success/10 text-success"
              }`}
            >
              <div className={`p-2 rounded-xl ${message.type === "error" ? "bg-destructive/10" : "bg-success/10"}`}>
                {message.type === "error" ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
              </div>
              <p className="text-sm font-bold tracking-tight">{message.text}</p>

              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 5 }}
                className={`absolute bottom-0 left-0 h-0.5 w-full origin-left ${message.type === "error" ? "bg-destructive/40" : "bg-success/40"}`}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="max-w-2xl">
          {/* Bloque 1: Identidad del Administrador */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <PersonalInformation 
              name={name}
              setName={setName}
              password={password}
              setPassword={setPassword}
              onSave={handleSave}
              loading={loading}
            />
          </motion.div>
        </div>
      </motion.div>
    </DashboardShell>
  );
}
