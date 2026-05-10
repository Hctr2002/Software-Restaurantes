"use client";

import { useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useAuthStore } from "@menu-bites/store";
import { Loader2 } from "lucide-react";

const AUTH_URL = process.env.NEXT_PUBLIC_AUTH_URL ?? "http://localhost:3000";

export default function AuthCallback() {
  const { setUser } = useAuthStore();

  useEffect(() => {
    const hash         = window.location.hash.slice(1);
    const params       = new URLSearchParams(hash);
    const accessToken  = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    const next         = params.get("next") ?? "/";

    if (!accessToken || !refreshToken) {
      window.location.replace(AUTH_URL);
      return;
    }

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookieOptions: { name: "sb-bar-session" } }
    );

    supabase.auth
      .setSession({ access_token: accessToken, refresh_token: refreshToken })
      .then(({ data, error }) => {
        if (error || !data.session) {
          window.location.replace(AUTH_URL);
          return;
        }
        const { role, restaurant_id } = data.session.user.app_metadata;
        setUser({
          id:           data.session.user.id,
          email:        data.session.user.email!,
          role,
          restaurantId: restaurant_id ?? "",
        });
        window.location.replace(next);
      })
      .catch(() => {
        window.location.replace(AUTH_URL);
      });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
}
