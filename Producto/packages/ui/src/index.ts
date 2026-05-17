/**
 * index.ts — Punto de entrada del package @menu-bites/ui.
 * Re-exporta todos los componentes compartidos: tablas, menú, portal, dashboard y terminal.
 * Importar desde '@menu-bites/ui' en cualquier app del monorepo.
 */

export * from "./components/TableGrid";
export * from "./components/MenuComponents";
export * from "./components/CategoryTabs";
export * from "./components/OrderTicket";
export * from "./components/Badge";
export * from "./components/Table";
export { default as Modal } from "./components/Modal";
export * from "./components/ui/button";
export * from "./components/ui/input";
export * from "./components/ui/card";
export * from "./lib/utils";
export * from "./components/RestaurantThemeProvider";
export * from "./components/SkeletonLoader";
export * from "./components/dashboard";
export * from "./components/terminal";
export * from "./components/portal";
export { PremiumHeader } from "./components/PremiumHeader";
export { HeaderStat } from "./components/HeaderStat";
export * from "./components/DynamicThemeWrapper";