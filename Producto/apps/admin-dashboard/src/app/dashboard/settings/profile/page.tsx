"use client";

import React, { useState } from "react";
import { useAuthStore } from "@menu-bites/store";
import DashboardShell from "../../_components/DashboardShell";

// Importación de sub-componentes modularizados
import PersonalInformation from "./_components/PersonalInformation";
import AestheticSettings from "./_components/AestheticSettings";

/**
 * ProfileSettingsPage - Orquestador de Perfil y Estética
 * 
 * Gestiona el estado global de la configuración del usuario administrador.
 * Coordina la actualización de metadatos de identidad y temas visuales en Supabase.
 */
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
   * Dispara un evento global para previsualizar el tema sin guardar en BD.
   */
  const handlePreview = (newTheme: any) => {
    setTheme(newTheme);
    window.dispatchEvent(new CustomEvent("admin-theme-preview", { detail: newTheme }));
  };

  /**
   * Persiste los cambios de perfil y estilo en la base de datos de Supabase.
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

      // Obtenemos los datos actualizados del usuario usando el cliente de Supabase
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
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Error desconocido" });
    } finally {
      setLoading(false);
    }
  };

  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  return (
    <DashboardShell title="Configuración" subtitle="Configuración de Perfil">
      <div className="max-w-5xl space-y-8">
        {/* Sistema de Notificaciones Local */}
        {message && (
          <div className={`p-4 rounded-[1.5rem] border text-sm font-bold animate-in fade-in slide-in-from-top-2 ${
              message.type === "error"
                ? "border-red-500/30 bg-red-500/10 text-red-500"
                : "border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
            }`}>
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
          {/* Bloque 1: Identidad del Administrador */}
          <PersonalInformation 
            name={name}
            setName={setName}
            password={password}
            setPassword={setPassword}
            onSave={handleSave}
            loading={loading}
          />

          {/* Bloque 2: Personalización Visual (Solo SUPER_ADMIN) */}
          {isSuperAdmin && (
            <AestheticSettings 
              theme={theme}
              onPreview={handlePreview}
              onSave={handleSave}
              loading={loading}
            />
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
