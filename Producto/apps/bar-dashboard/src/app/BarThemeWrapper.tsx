"use client";

import { DynamicThemeWrapper } from "@menu-bites/ui";

export default function BarThemeWrapper({ children }: { children: React.ReactNode }) {
  return (
    <DynamicThemeWrapper appKey="bar">
      {children}
    </DynamicThemeWrapper>
  );
}
