"use client";

import { DynamicThemeWrapper } from "@menu-bites/ui";

export default function WaiterThemeWrapper({ children }: { children: React.ReactNode }) {
  return (
    <DynamicThemeWrapper appKey="waiter">
      {children}
    </DynamicThemeWrapper>
  );
}
