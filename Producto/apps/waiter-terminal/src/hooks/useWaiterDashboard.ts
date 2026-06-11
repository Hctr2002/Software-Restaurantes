"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@menu-bites/store";
import { signOut } from "@menu-bites/auth";
import { 
  useRealtimeWaiterOrders as useWaiterOrders, 
  useAlertForm, 
  useThemeSync 
} from "@menu-bites/auth";
import { useWebPush } from "./useWebPush";
import { useMergeTables } from "./useMergeTables";

export function useWaiterDashboard() {
  const router = useRouter();
  const { user, logout: clearAuth } = useAuthStore();
  const orders = useWaiterOrders(user?.restaurantId);
  
  const { 
    tables, 
    loading: waiterLoading, 
    handleTableClean,
    billRequestedTableIds,
    readyTableIds,
    preparingTableIds,
    cleaningTables
  } = orders;

  const notificationSound = useWebPush(user?.restaurantId, orders.readyOrders);
  const merge = useMergeTables();
  const alertForm = useAlertForm(user?.restaurantId, user?.id, user?.email);
  const theme = useThemeSync(user?.restaurantId);

  const [isSigningOut, setIsSigningOut] = useState(false);
  const [alertModal, setAlertModal] = useState(false);
  const [isIslandExpanded, setIsIslandExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<"mesas" | "pedidos">("mesas");
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);

  const selectedTable = tables.find(t => t.id === selectedTableId) || null;

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
    } finally {
      clearAuth();
      window.location.href = process.env.NEXT_PUBLIC_AUTH_URL ?? '/';
    }
  };

  return {
    router,
    user,
    orders,
    tables,
    waiterLoading,
    handleTableClean,
    billRequestedTableIds,
    readyTableIds,
    preparingTableIds,
    cleaningTables,
    merge,
    alertForm,
    theme,
    isSigningOut,
    alertModal,
    setAlertModal,
    isIslandExpanded,
    setIsIslandExpanded,
    activeTab,
    setActiveTab,
    selectedTableId,
    setSelectedTableId,
    selectedTable,
    handleSignOut,
    notificationSound
  };
}
