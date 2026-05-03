"use client";

import React from "react";

type BadgeVariant = "success" | "danger" | "warning" | "neutral" | "info";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export function Badge({ children, variant = "neutral", className = "" }: BadgeProps) {
  const baseClasses = "px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider inline-flex items-center justify-center";
  
  const variants = {
    success: "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20",
    danger: "bg-red-500/10 text-red-500 border border-red-500/20",
    warning: "bg-amber-500/10 text-amber-500 border border-amber-500/20",
    info: "bg-primary/10 text-primary border border-primary/20",
    neutral: "bg-white/5 text-foreground/40 border border-white/10",
  };

  return (
    <span className={`${baseClasses} ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}
