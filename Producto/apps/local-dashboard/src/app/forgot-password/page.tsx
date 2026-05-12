"use client";

import React, { useState } from "react";
import { resetPasswordForEmail } from "@menu-bites/auth";
import { Mail, ArrowLeft, Loader2, Send } from "lucide-react";
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@menu-bites/ui";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setMessage(null);

    const { error } = await resetPasswordForEmail(email, `${window.location.origin}/reset-password`);

    if (error) {
      setError(error.message);
    } else {
      setMessage("Se ha enviado un correo con las instrucciones para restablecer tu contraseña.");
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
        <Card className="border-foreground/5 backdrop-blur-2xl">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-2xl tracking-tighter text-foreground">
              Recuperar <span className="text-primary">Acceso</span>
            </CardTitle>
            <CardDescription className="text-foreground/60">Ingresa tu correo para recibir un enlace de recuperación</CardDescription>
          </CardHeader>

          <CardContent>
            {message ? (
              <div className="text-center space-y-6 py-4">
                <div className="mx-auto w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center border border-primary/20">
                  <Send className="w-8 h-8 text-primary" />
                </div>
                <p className="text-sm font-medium text-foreground">{message}</p>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/">Volver al Login</Link>
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/20 z-10" />
                  <Input
                    type="email"
                    placeholder="tu@correo.com"
                    required
                    className="pl-10 bg-foreground/5 border-foreground/10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
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
                    <>Enviar Enlace <Send className="ml-2 w-5 h-5" /></>
                  )}
                </Button>
              </form>
            )}
          </CardContent>

          {!message && (
            <CardFooter className="flex flex-col pt-0">
              <Link
                href="/"
                className="flex items-center text-[10px] text-foreground/40 hover:text-primary transition-colors uppercase tracking-widest font-black"
              >
                <ArrowLeft className="w-3 h-3 mr-2" />
                Volver al inicio
              </Link>
            </CardFooter>
          )}
        </Card>
      </main>
    </div>
  );
}
