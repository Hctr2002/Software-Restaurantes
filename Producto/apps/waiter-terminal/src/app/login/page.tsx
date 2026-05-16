"use client";

import React, { useState } from "react";
import { useAuthStore } from "@menu-bites/store";
import { supabase } from "@menu-bites/auth";
import { Lock, ArrowRight, Loader2, Mail, Eye, EyeOff } from "lucide-react";
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent } from "@menu-bites/ui";

const REQUIRED_ROLE = "GARZON";

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

      if (!data.user) return;

      const role = data.user.app_metadata.role as string;
      const restaurantId = data.user.app_metadata.restaurant_id as string | undefined;

      if (role !== REQUIRED_ROLE) {
        await supabase.auth.signOut();
        setError(`Esta app es exclusiva para Garzones. Tu rol es: ${role}`);
        return;
      }

      setUser({
        id: data.user.id,
        email: data.user.email!,
        role,
        restaurantId: restaurantId ?? "",
      });

      window.location.replace("/");
    } catch {
      setError("Error de conexión, intente más tarde");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden bg-background">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-background" />
      <main className="relative z-10 w-full max-w-md">
        <Card className="border-border bg-card shadow-2xl">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-4xl tracking-tighter">
              Menu <span className="text-primary">Bites</span>
            </CardTitle>
            <CardDescription>Terminal de Garzón</CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/50 z-10" />
                  <Input
                    type="email"
                    placeholder="garzon@menubites.com"
                    required
                    className="pl-10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/50 z-10" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    required
                    className="pl-10 pr-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/30 hover:text-white transition-colors z-10"
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
                    Entrar al Terminal
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
