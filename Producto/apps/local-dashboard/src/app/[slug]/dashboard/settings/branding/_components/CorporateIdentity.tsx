"use client";

import React from "react";
import { motion } from "framer-motion";
import { Card, Input } from "@menu-bites/ui";
import { Info } from "lucide-react";

interface CorporateIdentityProps {
  currentTheme: any;
  setCurrentTheme: (theme: any) => void;
  slug: string;
}

/**
 * CorporateIdentity
 * 
 * Gestiona el logo y muestra información del slug del local.
 */
export default function CorporateIdentity({ currentTheme, setCurrentTheme, slug }: CorporateIdentityProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }} 
      animate={{ opacity: 1, x: 0 }} 
      exit={{ opacity: 0, x: 20 }}
      className="space-y-8"
    >
      <Card className="p-8 bg-white/5 border-white/5 rounded-[2.5rem] shadow-2xl space-y-10">
        <div>
          <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">Identidad Corporativa</h3>
          <p className="text-xs text-foreground/40 font-medium">Configuración base de tu local</p>
        </div>
        
        <div className="space-y-8">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-foreground/40 uppercase tracking-widest px-1">URL del Logo</label>
            <Input 
              value={currentTheme.logoUrl || ""} 
              onChange={(e) => setCurrentTheme({...currentTheme, logoUrl: e.target.value})}
              placeholder="https://tu-sitio.com/logo.png"
              className="bg-white/5 border-white/10 rounded-2xl h-14 px-6 text-sm font-bold"
            />
          </div>
          
          <div className="p-8 rounded-[2.5rem] border border-white/10 bg-white/5 flex items-center justify-between group">
            <div>
              <p className="text-[10px] font-black text-foreground/30 uppercase tracking-[0.2em] mb-1">Slug de Acceso</p>
              <code className="text-xl font-black text-primary tracking-tighter italic">/{slug}</code>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
               <Info className="w-5 h-5 text-primary" />
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
