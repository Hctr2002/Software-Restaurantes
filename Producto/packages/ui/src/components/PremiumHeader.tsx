"use client";

import React from "react";
import { cn } from "../lib/utils";
import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

interface PremiumHeaderProps {
  title: string;
  accentTitle?: string;
  statusLabel?: string;
  statusSubLabel?: string;
  icon: LucideIcon;
  stats?: React.ReactNode;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  variant?: "default" | "compact";
  isSolid?: boolean;
  className?: string;
}

export const PremiumHeader = ({
  title,
  accentTitle,
  statusLabel = "Live System",
  statusSubLabel,
  icon: Icon,
  stats,
  actions,
  children,
  className,
  variant = "default",
  isSolid = false
}: PremiumHeaderProps) => {
  const isCompact = variant === "compact";

  return (
    <motion.header 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={cn(
        isSolid ? "bg-card" : "glass-premium transition-all duration-500",
        "relative overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.3)]",
        "before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/5 before:to-transparent before:pointer-events-none",
        isCompact ? "rounded-[2rem] p-4 gap-4" : "rounded-[2.5rem] p-6 gap-6",
        "flex flex-row justify-between items-center",
        className
      )}
      style={isSolid ? { backgroundColor: 'hsl(var(--card))', opacity: 1 } : undefined}
    >
      <div className="flex items-center space-x-4 lg:space-x-6 w-full lg:w-auto">
        <div 
          className={cn(
            "flex items-center justify-center shadow-2xl shadow-primary/30 shrink-0 transition-all duration-500 hover:scale-110",
            "relative overflow-hidden",
            isCompact ? "w-12 h-12 rounded-2xl" : "w-14 h-14 sm:w-20 sm:h-20 rounded-[2rem] sm:rounded-[2.5rem]"
          )}
          style={{ backgroundColor: 'hsl(var(--primary))' }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
          <Icon className={cn("text-primary-foreground relative z-10", isCompact ? "w-6 h-6" : "w-7 h-7 sm:w-10 h-10")} />
        </div>
        <div className="flex-1 min-w-0">
          <h1 
            className={cn(
              "font-black tracking-tighter uppercase italic leading-tight truncate",
              isCompact ? "text-lg sm:text-xl" : "text-xl sm:text-3xl"
            )}
            style={{ fontFamily: "var(--font-title)" }}
          >
            {title} {accentTitle && <span className="text-primary">{accentTitle}</span>}
          </h1>
          <div className="flex items-center space-x-3 text-[9px] sm:text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em] sm:tracking-[0.3em] mt-0.5">
            <span className="flex items-center gap-1.5 text-emerald-500">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              {statusLabel}
            </span>
            {statusSubLabel && (
              <>
                <span className="opacity-30">•</span>
                <span className="truncate">{statusSubLabel}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-row items-center gap-3 lg:gap-6 justify-end">
        {stats && (
          <div className="hidden sm:flex items-center divide-x divide-white/5 px-4 py-2.5 glass rounded-[1.5rem] border border-white/5 shadow-xl">
            {stats}
          </div>
        )}
        
        <div className="flex items-center gap-2 shrink-0">
          {actions}
          {children}
        </div>
      </div>
    </motion.header>
  );
}
