"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@menu-bites/store";
import { useThemeSync } from "@menu-bites/auth";
import { RestaurantThemeProvider, RestaurantTheme } from "@menu-bites/ui";

export default function CashierThemeWrapper({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  const liveTheme = useThemeSync(user?.restaurantId, "cashier");
  const [theme, setTheme] = useState<RestaurantTheme | undefined>(undefined);

  useEffect(() => {
    if (liveTheme) {
      setTheme(liveTheme as any);
    }
  }, [liveTheme]);

  return (
    <RestaurantThemeProvider theme={theme} isGlobal>
      {children}
    </RestaurantThemeProvider>
  );
}
