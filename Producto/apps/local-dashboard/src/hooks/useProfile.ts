/**
 * useProfile — Hook para actualizar el perfil del usuario ADMIN autenticado.
 * Persiste nombre y contraseña via PUT /api/local/profile.
 */
"use client";

import { useState } from "react";

/**
 * Provee estado de formulario, mensaje de respuesta y handler de guardado.
 * Solo envía los campos que fueron modificados (nombre o contraseña).
 */
export function useProfile() {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!name.trim() && !password.trim()) {
      setMessage({ type: "error", text: "No hay cambios para guardar." });
      return false;
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
      return true;
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Error desconocido" });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    name,
    setName,
    password,
    setPassword,
    loading,
    message,
    setMessage,
    handleSave,
  };
}
