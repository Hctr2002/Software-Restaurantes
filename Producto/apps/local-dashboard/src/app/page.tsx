"use client";

import React, { useState, useEffect } from "react";
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter,
  Input,
  Button
} from "@menu-bites/ui";
import { supabase } from "@menu-bites/auth";
import { useAuthStore } from "@menu-bites/store";

const ROLE_URLS: Record<string, string | undefined> = {
  SUPER_ADMIN: process.env.NEXT_PUBLIC_AUTH_URL,
  COCINA:      process.env.NEXT_PUBLIC_KITCHEN_URL,
  CAJERO:      process.env.NEXT_PUBLIC_CASHIER_URL,
  GARZON:      process.env.NEXT_PUBLIC_WAITER_URL,
};

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setUser } = useAuthStore();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setError(error.status === 400 ? "Credenciales inválidas, intente nuevamente" : error.message);
        return;
      }

      if (data.user) {
        const rawRole = data.user.app_metadata?.role;
        const role = (Array.isArray(rawRole) ? rawRole[0] : rawRole) as "ADMIN" | "GARZON" | "COCINA" | "CAJERO" | "SUPER_ADMIN" | "CLIENTE";
        const restaurantId = data.user.app_metadata?.restaurant_id as string;
        
        setUser({
          id: data.user.id,
          email: data.user.email!,
          role,
          restaurantId,
        });

        if (String(role).toUpperCase() === 'ADMIN') {
          const { data: rest } = await supabase
            .from('restaurants')
            .select('slug')
            .eq('id', restaurantId)
            .single();
          window.location.replace(rest?.slug ? `/${rest.slug}/dashboard` : '/');
        } else {
          const target = ROLE_URLS[role];
          if (target) window.location.replace(target);
        }
      }
    } catch {
      setError("Error de conexión, intente más tarde");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden bg-background">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20 scale-105"
        style={{ backgroundImage: "url('/login_background.png')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-background" />

      <main className="relative z-10 w-full max-w-md">
        <Card className="bg-card border-border shadow-2xl">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-4xl tracking-tighter text-foreground">
              Menu <span className="text-primary">Bites</span>
            </CardTitle>
            <CardDescription className="text-foreground/60">Panel de Administración del Local</CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/20 z-10" />
                  <Input
                    type="email"
                    placeholder="admin@mirestaurante.com"
                    required
                    className="pl-10 bg-background border-border"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/20 z-10 transition-colors group-focus-within:text-primary" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    required
                    className="pl-10 pr-10 bg-background border-border"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/20 hover:text-foreground transition-colors z-10"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-destructive text-xs text-center font-bold bg-destructive/10 p-3 rounded-xl border border-destructive/20 animate-in fade-in zoom-in duration-300">
                  {error}
                </p>
              )}

              <Button type="submit" disabled={isLoading} variant="premium" className="w-full">
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Entrar al Panel
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4 pt-0">
            <Link
              href="/forgot-password"
              className="text-[10px] text-foreground/40 hover:text-primary transition-colors uppercase tracking-widest font-black"
            >
              ¿Olvidaste tus credenciales?
            </Link>
            <div className="flex items-center justify-center space-x-2 opacity-30">
              <span className="w-1 h-1 bg-primary rounded-full" />
              <span className="text-[8px] text-foreground uppercase tracking-tighter font-bold">
                Gastro Analytics 360 v1.0.4
              </span>
              <span className="w-1 h-1 bg-primary rounded-full" />
            </div>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}
