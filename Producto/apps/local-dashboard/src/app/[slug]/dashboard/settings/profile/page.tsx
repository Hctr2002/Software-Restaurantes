"use client";

import React from "react";
import LocalShell from "../../_components/LocalShell";
import { motion } from "framer-motion";
import { useProfile } from "@/hooks/useProfile";
import ProfileForm from "./_components/ProfileForm";

/**
 * ProfileSettingsPage - Configuración de cuenta del usuario local
 * 
 * Permite cambiar el nombre público y la contraseña de acceso.
 * Utiliza el hook useProfile para la gestión del estado y persistencia.
 */
export default function ProfileSettingsPage() {
  const {
    name,
    setName,
    password,
    setPassword,
    loading,
    message,
    handleSave,
  } = useProfile();

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

        {/* Formulario Modularizado */}
        <ProfileForm 
          name={name}
          setName={setName}
          password={password}
          setPassword={setPassword}
          loading={loading}
          onSave={handleSave}
        />
      </div>
    </LocalShell>
  );
}
