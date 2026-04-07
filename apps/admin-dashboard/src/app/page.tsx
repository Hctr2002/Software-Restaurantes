"use client";

import React, { useState } from "react";
import { useAuthStore } from "@menu-bites/store";
import { supabase } from "@menu-bites/auth";
import { User, Lock, ArrowRight, Loader2 } from "lucide-react";
import { cn } from "@menu-bites/ui/src/lib/utils";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setUser } = useAuthStore();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.status === 400) {
          setError("Credenciales inválidas, reintente en 5 minutos");
        } else {
          setError(error.message);
        }
        return;
      }

      if (data.user) {
        setUser({
          id: data.user.id,
          email: data.user.email!,
          role: data.user.app_metadata.role,
          restaurantId: data.user.app_metadata.restaurant_id,
        });
        // Redirect logic would go here
      }
    } catch (err) {
      setError("Error de conexión, intente más tarde");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
      {/* Premium Background Layer */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40 scale-105 transition-transform duration-1000"
        style={{ backgroundImage: "url('/login_background.png')" }} // User should copy the generated image here
      />
      
      <div className="absolute inset-0 bg-gradient-to-br from-background/20 via-background/40 to-background/60" />

      <main className="relative z-10 w-full max-w-md">
        <div className="glass p-8 rounded-3xl shadow-2xl space-y-8 border-white/5">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold tracking-tight text-white">
              Menu <span className="text-primary italic">Bites</span>
            </h1>
            <p className="text-muted-foreground text-sm uppercase tracking-widest font-medium">
              Enterprise Dashboard
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="email"
                  placeholder="admin@menubites.com"
                  required
                  className="w-full bg-white/5 border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-primary outline-none transition-all"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="password"
                  placeholder="••••••••"
                  required
                  className="w-full bg-white/5 border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-primary outline-none transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <p className="text-destructive text-sm text-center bg-destructive/10 p-3 rounded-lg border border-destructive/20 animate-in fade-in zoom-in duration-300">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full group relative flex items-center justify-center py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Entrar al Sistema
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <footer className="pt-4 text-center space-y-4 border-t border-white/5">
            <button className="text-xs text-muted-foreground hover:text-white transition-colors uppercase tracking-wider">
              ¿Olvidaste tus credenciales?
            </button>
            <div className="flex items-center justify-center space-x-2">
              <span className="w-1 h-1 bg-primary rounded-full" />
              <span className="text-[10px] text-muted-foreground/50 uppercase tracking-tighter">
                Gastro Analytics 360 v1.0.4
              </span>
              <span className="w-1 h-1 bg-primary rounded-full" />
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}
