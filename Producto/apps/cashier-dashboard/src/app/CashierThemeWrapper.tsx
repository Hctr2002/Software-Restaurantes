"use client";

import { DynamicThemeWrapper } from "@menu-bites/ui";

export default function CashierThemeWrapper({ children }: { children: React.ReactNode }) {
  return (
    <DynamicThemeWrapper appKey="cashier">
      {children}
    </DynamicThemeWrapper>
  );
}
