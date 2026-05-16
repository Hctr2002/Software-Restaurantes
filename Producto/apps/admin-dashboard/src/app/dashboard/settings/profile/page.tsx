"use client";
/**
 * @file ProfileSettingsPage.tsx
 * @description Orquestador de configuración de identidad y estética para administradores.
 * @version 2.1.0
 * 
 * Este módulo centraliza la gestión del perfil del usuario y la personalización visual
 * del panel (Laboratorio Cromático). Implementa:
 * - Persistencia asíncrona con Supabase Auth.
 * - Feedback visual Pro-Max con estados de carga reactivos.
 * - Estética Glassmorphism con desenfoques y transparencias semánticas.
 */

import { useState } from "react";
import { useAuthStore } from "@menu-bites/store";
import DashboardShell from "../../_components/DashboardShell";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, CheckCircle2 } from "lucide-react";

// Importación de sub-componentes modularizados
import PersonalInformation from "./_components/PersonalInformation";
import AestheticSettings from "./_components/AestheticSettings";

export default function ProfileSettingsPage() {
  // Casting a any para acceder a user_metadata de Supabase Auth
  const { user, setUser } = useAuthStore() as any;

  // Estados Locales de Perfil
  const [name, setName] = useState(user?.user_metadata?.name || "");
  const [password, setPassword] = useState("");
  
  // Estados Locales de Estética (Valores por defecto robustos)
  const defaultTheme = {
    primaryColor: "#3b82f6",
    backgroundColor: "#020617",
    textColor: "#f8fafc",
    accentColor: "#6366f1",
    cardBackground: "#0f172a",
    secondaryColor: "#1e293b"
  };

  const [theme, setTheme] = useState<any>({
    ...defaultTheme,
    ...(user?.user_metadata?.theme || {})
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  /**
   * handlePreview: Dispara un evento global para previsualizar el tema sin guardar en BD.
   */
  const handlePreview = (newTheme: any) => {
    setTheme(newTheme);
    window.dispatchEvent(new CustomEvent("admin-theme-preview", { detail: newTheme }));
  };

  /**
   * handleSave: Persiste los cambios de perfil y estilo en la base de datos.
   */
  const handleSave = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, password, theme }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "No se pudo actualizar el perfil.");

      const { supabase: supabaseClient } = await import("@menu-bites/auth");
      const { data: { user: updatedUser } } = await supabaseClient.auth.getUser(); 
      
      if (updatedUser) {
        setUser({
          ...user,
          user_metadata: updatedUser.user_metadata
        });
      }

      setMessage({ type: "success", text: "Perfil y estilo actualizados correctamente. Los cambios ahora son persistentes." });
      setPassword(""); 
      
      // Auto-ocultar mensaje después de 5 segundos
      setTimeout(() => setMessage(null), 5000);
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Error desconocido" });
    } finally {
      setLoading(false);
    }
  };

  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  return (
    <DashboardShell title="Configuración" subtitle="Personaliza tu experiencia administrativa">
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

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Bloque 1: Identidad del Administrador */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-5"
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

          {/* Bloque 2: Personalización Visual (Solo SUPER_ADMIN) */}
          <AnimatePresence>
            {isSuperAdmin && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="lg:col-span-7"
              >
                <AestheticSettings 
                  theme={theme}
                  onPreview={handlePreview}
                  onSave={handleSave}
                  loading={loading}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </DashboardShell>
  );
}
