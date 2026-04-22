"use client";

import React from "react";

type BadgeVariant = "success" | "danger" | "warning" | "neutral" | "info";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
}

export function Badge({ children, variant = "neutral" }: BadgeProps) {
  const baseClasses = "px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider inline-flex items-center justify-center";
  
  const variants = {
    success: "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20",
    danger: "bg-red-500/10 text-red-500 border border-red-500/20",
    warning: "bg-amber-500/10 text-amber-500 border border-amber-500/20",
    info: "bg-blue-500/10 text-blue-500 border border-blue-500/20",
    neutral: "bg-slate-500/10 text-slate-400 border border-slate-500/20",
  };

  return (
    <span className={`${baseClasses} ${variants[variant]}`}>
      {children}
    </span>
  );
}
