"use client";

import { DynamicThemeWrapper } from "@menu-bites/ui";

export default function LocalThemeWrapper({ children }: { children: React.ReactNode }) {
  return (
    <DynamicThemeWrapper appKey="local">
      {children}
    </DynamicThemeWrapper>
  );
}

