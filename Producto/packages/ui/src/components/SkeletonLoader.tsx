/**
 * SkeletonLoader — Componente de carga esqueleto para estados de carga.
 * Renderiza un rectángulo pulsante que simula el contenido en carga.
 */

import React from "react";
import { cn } from "../lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-foreground/5",
        className
      )}
      {...props}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-card/40 border border-white/5 rounded-[2rem] p-6 space-y-4">
      <Skeleton className="w-16 h-16 rounded-[1.5rem]" />
      <div className="space-y-2">
        <Skeleton className="h-6 w-12 mx-auto" />
        <Skeleton className="h-3 w-20 mx-auto" />
      </div>
    </div>
  );
}

export function OrderCardSkeleton() {
  return (
    <div className="bg-card/40 border border-white/5 rounded-[2.5rem] p-7 space-y-6">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-4">
          <Skeleton className="w-12 h-12 rounded-2xl" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
        <Skeleton className="h-6 w-20 rounded-lg" />
      </div>
      <div className="space-y-3 bg-white/5 rounded-3xl p-5">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <div className="flex gap-4">
        <Skeleton className="h-16 flex-1 rounded-[1.5rem]" />
        <Skeleton className="h-16 flex-1 rounded-[1.5rem]" />
      </div>
    </div>
  );
}
