"use client";

/**
 * Shared Hooks Aggregator
 * This file maintains backward compatibility while the logic is split into domain-specific modules.
 */

export * from "./hooks/useRealtimeSync";
export * from "./hooks/useTableHooks";
export * from "./hooks/useMenuHooks";
export * from "./hooks/useOrderHooks";
export * from "./hooks/useAlertHooks";
export * from "./hooks/useUserHooks";
export * from "./hooks/useCashierHooks";
export * from "./hooks/useThemeHooks";

// Backward compatibility alias
import { useTables } from "./hooks/useTableHooks";
export const useTableStatus = useTables;
