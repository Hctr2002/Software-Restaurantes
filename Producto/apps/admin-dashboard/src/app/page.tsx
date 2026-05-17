"use client";

import React, { useState } from "react";
import { useAuthStore } from "@menu-bites/store";
import { supabase } from "@menu-bites/auth";
import { Lock, ArrowRight, Loader2, Mail, Eye, EyeOff } from "lucide-react";
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@menu-bites/ui";
import Link from "next/link";


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

      const appRole  = data.user.app_metadata?.role;
      const userRole = data.user.user_metadata?.role;
      const rawRole  = appRole || userRole;
      const role     = (Array.isArray(rawRole) ? rawRole[0] : rawRole) as string;
      const restaurantId = data.user.app_metadata?.restaurant_id as string | undefined;

      setUser({
        id:           data.user.id,
        email:        data.user.email!,
        role:         (role as any) || 'CLIENTE',
        restaurantId: restaurantId ?? '',
        user_metadata: data.user.user_metadata
      });

      const roleUpper = String(role || '').toUpperCase();
      const hasRestaurant = restaurantId && String(restaurantId).trim() !== "" && String(restaurantId) !== "null" && String(restaurantId) !== "undefined";

      // 1. ROLES OPERATIVOS: Siempre redirigen a sus apps
      if (['COCINA', 'GARZON', 'CAJERO', 'BAR'].includes(roleUpper)) {
        const callbackBases: Record<string, string | undefined> = {
          COCINA: process.env.NEXT_PUBLIC_KITCHEN_URL,
          GARZON: process.env.NEXT_PUBLIC_WAITER_URL,
          CAJERO: process.env.NEXT_PUBLIC_CASHIER_URL,
          BAR: process.env.NEXT_PUBLIC_BAR_URL,
        };

        const missingUrls = Object.entries(callbackBases)
          .filter(([, url]) => !url)
          .map(([role]) => role);
        if (missingUrls.length > 0) {
          console.warn(`[Login] Variables de entorno faltantes para: ${missingUrls.join(', ')}`);
        }

        const callbackBase = callbackBases[roleUpper];
        if (!callbackBase) {
          setError(`La aplicación para el rol ${roleUpper} no está configurada. Contacte al administrador.`);
          return;
        }

        let slug: string | null = null;
        if (hasRestaurant) {
          const { data: rest } = await supabase.from('restaurants').select('slug').eq('id', restaurantId).single();
          slug = rest?.slug ?? null;
        }
        const nextPath = slug ? `/${slug}` : '/';
        const hash = new URLSearchParams({
          access_token:  data.session!.access_token,
          refresh_token: data.session!.refresh_token,
          next:          nextPath,
        }).toString();
        window.location.replace(`${callbackBase}/auth/callback#${hash}`);
        return;
      }

      // 2. ROL ADMIN: Redirigir a 3003 SOLO si tiene un restaurante asignado
      if (roleUpper === 'ADMIN' && hasRestaurant) {
        const localUrl = process.env.NEXT_PUBLIC_LOCAL_DASHBOARD_URL;
        const { data: rest } = await supabase.from('restaurants').select('slug').eq('id', restaurantId).single();
        const slug = rest?.slug ?? null;
        
        if (localUrl) {
          const nextPath = slug ? `/${slug}/dashboard` : '/dashboard';
          const hash = new URLSearchParams({
            access_token:  data.session!.access_token,
            refresh_token: data.session!.refresh_token,
            next:          nextPath,
          }).toString();
          window.location.replace(`${localUrl}/auth/callback#${hash}`);
          return;
        }
      }

      // 3. TODO LO DEMÁS (SUPER_ADMIN o ADMIN sin restaurante): Se queda en el panel multitenant
      window.location.replace('/dashboard');
    } catch {
      setError("Error de conexión, intente más tarde");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden bg-background">
      {/* 
        Capa de Fondo Premium: 
        Utiliza variables del tema para asegurar que el fondo se adapte a la marca del restaurante.
      */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20 scale-105"
        style={{ backgroundImage: "url('/login_background.png')" }}
      />
      
      {/* Gradiente dinámico que hereda el color primario de la marca */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-background" />

      <main className="relative z-10 w-full max-w-md">
        {/* Tarjeta de Login: Usa bordes y fondos semánticos para coherencia visual */}
        <Card className="border-border/40 bg-card shadow-2xl">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-4xl tracking-tighter text-foreground">
              Menu <span className="text-primary">Bites</span>
            </CardTitle>
            <CardDescription className="text-muted-foreground font-medium">
              Enterprise Gastronomic Management
            </CardDescription>
          </CardHeader>

          <CardContent>
            {/* Función para manejar el envío del formulario de autenticación */}
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-4">
                <div className="relative">
                  {/* Icono con color suavizado basado en el tema */}
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/50 z-10" aria-hidden="true" />
                  {/* Input de correo: utiliza fondo translúcido y bordes semánticos */}
                  <Input
                    type="email"
                    name="email"
                    autoComplete="username"
                    placeholder="admin@menubites.com"
                    aria-label="Correo electrónico"
                    required
                    className="pl-10 bg-foreground/5 border-foreground/10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="relative group">
                  {/* El color del icono cambia dinámicamente al enfocar, heredando el color primario */}
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/50 z-10 transition-colors group-focus-within:text-primary" aria-hidden="true" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    aria-label="Contraseña"
                    required
                    className="pl-10 pr-10 bg-foreground/5 border-foreground/10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  {/* Botón para alternar visibilidad de contraseña */}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/30 hover:text-foreground transition-colors z-10"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" aria-hidden="true" />
                    ) : (
                      <Eye className="w-5 h-5" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>

              {/* Mensaje de error con estilos destructivos del tema */}
              {error && (
                <p className="text-destructive text-xs text-center font-bold bg-destructive/10 p-3 rounded-xl border border-destructive/20 animate-in fade-in zoom-in duration-300">
                  {error}
                </p>
              )}

              {/* Botón de login con variante premium para destacar la acción principal */}
              <Button
                type="submit"
                disabled={isLoading}
                variant="premium"
                className="w-full"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Entrar al Sistema
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4 pt-0">
            {/* Enlace para recuperación de contraseña con herencia de color primario en hover */}
            <Link 
              href="/forgot-password"
              className="text-[10px] text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest font-black"
            >
              ¿Olvidaste tus credenciales?
            </Link>
            {/* Pie de página con identificador de versión del sistema */}
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
