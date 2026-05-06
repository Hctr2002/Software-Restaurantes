"use client";

import { useState } from "react";

export function useMergeTables() {
  const [mergeMode, setMergeMode] = useState(false);
  const [selectedForMerge, setSelectedForMerge] = useState<Set<string>>(new Set());
  const [merging, setMerging] = useState(false);
  const [mergeResult, setMergeResult] = useState<string | null>(null);

  const toggleMergeSelect = (tableId: string) => {
    setSelectedForMerge((prev) => {
      const next = new Set(prev);
      next.has(tableId) ? next.delete(tableId) : next.add(tableId);
      return next;
    });
  };

  const handleMergeTables = async () => {
    if (selectedForMerge.size < 2) return;
    setMerging(true);
    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tableIds: Array.from(selectedForMerge) }),
    });
    const json = await res.json();
    setMerging(false);
    if (res.ok) {
      setMergeResult(`Mesas fusionadas — ${json.ordersUpdated} pedido(s) unificados.`);
      setMergeMode(false);
      setSelectedForMerge(new Set());
      setTimeout(() => setMergeResult(null), 4000);
    }
  };

  const toggleMode = () => {
    setMergeMode((m) => !m);
    setSelectedForMerge(new Set());
  };

  return { mergeMode, selectedForMerge, merging, mergeResult, toggleMergeSelect, handleMergeTables, toggleMode };
}
