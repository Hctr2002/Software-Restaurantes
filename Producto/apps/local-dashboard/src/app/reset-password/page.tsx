/**
 * ResetPasswordPage — Formulario para definir una nueva contraseña tras recuperación.
 * Valida que ambas contraseñas coincidan y llama a updateUserPassword de Supabase.
 * Redirige automáticamente al login tras 3 segundos en caso de éxito.
 */
"use client";

import React, { useState } from "react";
import { updateUserPassword } from "@menu-bites/auth";
import { Lock, Loader2, CheckCircle2, ArrowRight } from "lucide-react";
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent } from "@menu-bites/ui";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setIsLoading(true);
    setError(null);

    const { error } = await updateUserPassword(password);

    if (error) {
      setError(error.message);
    } else {
      setIsSuccess(true);
      setTimeout(() => router.push("/"), 3000);
    }
    setIsLoading(false);
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden bg-background">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20 scale-105"
        style={{ backgroundImage: "url('/login_background.png')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-background" />

      <main className="relative z-10 w-full max-w-md">
        <Card className="border-border bg-card shadow-2xl">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-2xl tracking-tighter text-foreground">
              Nueva <span className="text-primary">Contraseña</span>
            </CardTitle>
            <CardDescription className="text-foreground/60">Define tu nueva clave de acceso</CardDescription>
          </CardHeader>

          <CardContent>
            {isSuccess ? (
              <div className="text-center space-y-6 py-4 animate-in fade-in zoom-in">
                <div className="mx-auto w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center border border-primary/20">
                  <CheckCircle2 className="w-8 h-8 text-primary" />
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-bold text-foreground uppercase tracking-widest">¡Contraseña Actualizada!</p>
                  <p className="text-xs text-foreground/40">Redirigiendo a la pantalla de acceso...</p>
                </div>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/">Ir al Login ahora</Link>
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/20 z-10" />
                    <Input
                      type="password"
                      placeholder="Nueva contraseña"
                      required
                      className="pl-10 bg-foreground/5 border-foreground/10"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/20 z-10" />
                    <Input
                      type="password"
                      placeholder="Confirmar contraseña"
                      required
                      className="pl-10 bg-foreground/5 border-foreground/10"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>

                {error && (
                  <p className="text-destructive text-xs text-center font-bold bg-destructive/10 p-3 rounded-xl border border-destructive/20">
                    {error}
                  </p>
                )}

                <Button type="submit" disabled={isLoading} variant="premium" className="w-full">
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>Actualizar Contraseña <ArrowRight className="ml-2 w-5 h-5" /></>
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
