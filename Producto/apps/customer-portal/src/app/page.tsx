"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Simulate a redirect as if a QR was scanned: restaurant 'demo-bistro' table '12'
    const timer = setTimeout(() => {
      router.push("/demo-bistro/12");
    }, 1500);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-navy-dark flex flex-col items-center justify-center p-6 text-center">
      <div className="w-24 h-24 border-4 border-sage border-t-transparent rounded-full animate-spin mb-8"></div>
      <h1 className="text-2xl font-bold text-sand mb-2">Menu Bites</h1>
      <p className="text-sage opacity-70 animate-pulse">Sincronizando con tu mesa...</p>
      
      <div className="mt-12 glass-panel p-8 rounded-3xl max-w-sm">
        <div className="w-48 h-48 bg-sand/10 rounded-2xl flex items-center justify-center mb-6 mx-auto border-2 border-dashed border-sand/20">
          <span className="text-sand/30 text-sm italic">Simulando Escaneo QR</span>
        </div>
        <p className="text-sm text-sand/60">
          Esta página simula la llegada del cliente tras escanear el código QR en la mesa del restaurante.
        </p>
      </div>
    </div>
  );
}
