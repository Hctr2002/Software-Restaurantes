"use client";

import { DynamicThemeWrapper } from "@menu-bites/ui";

export default function KitchenThemeWrapper({ children }: { children: React.ReactNode }) {
  return (
    <DynamicThemeWrapper appKey="kitchen">
      {children}
    </DynamicThemeWrapper>
  );
}
