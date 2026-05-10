"use client";

import { useEffect, useState } from "react";
import { Timer, Layers, Volume2, Wine, ShoppingBag, Package, X } from "lucide-react";
import { supabase, logBarAction } from "@menu-bites/auth";
import { cn } from "@menu-bites/ui";
import type { KDSSettings } from "../../lib/kdsSettings";

import { ThresholdsTab } from "./settings/ThresholdsTab";
import { CategoriesTab } from "./settings/CategoriesTab";
import { SoundTab } from "./settings/SoundTab";
import { AutoClearTab } from "./settings/AutoClearTab";
import { StockOutTab } from "./settings/StockOutTab";
import { InventoryTab } from "./settings/InventoryTab";

type Tab = "umbrales" | "categorias" | "sonido" | "auto" | "86items" | "inventario";

const TABS: { key: Tab; label: string; Icon: React.ElementType }[] = [
  { key: "86items",    label: "Sin Stock",   Icon: ShoppingBag },
  { key: "categorias", label: "Tiempos por Bebida", Icon: Layers },
  { key: "umbrales",   label: "Alertas de Tiempo", Icon: Timer },
  { key: "sonido",     label: "Notificaciones", Icon: Volume2 },
  { key: "auto",       label: "Auto-despacho", Icon: Wine },
  { key: "inventario", label: "Inventario",  Icon: Package },
];

const TABS_WITHOUT_SAVE: Tab[] = ["86items", "inventario"];

interface Props {
  settings: KDSSettings;
  restaurantId: string | undefined;
  userId: string | undefined;
  onSave: (s: KDSSettings) => void;
  onClose: () => void;
}

export function SettingsModal({ settings: initial, restaurantId, userId, onSave, onClose }: Props) {
  const [tab, setTab] = useState<Tab>("86items");
  const [draft, setDraft] = useState<KDSSettings>(initial);
  const [menuItems, setMenuItems] = useState<{ id: string; name: string; is_active: boolean; category_id: string }[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string; target_station: string }[]>([]);
  const [loadingMenu, setLoadingMenu] = useState(false);

  useEffect(() => {
    if (!restaurantId || (tab !== "86items" && tab !== "categorias")) return;
    setLoadingMenu(true);
    Promise.all([
      supabase.from("menu_items").select("id, name, is_active, category_id").eq("restaurant_id", restaurantId).order("name"),
      supabase.from("categories").select("id, name, target_station").eq("restaurant_id", restaurantId).eq("is_active", true).order("name"),
    ]).then(([menuRes, catRes]) => {
      if (!catRes.error) {
        const barCategories = (catRes.data ?? []).filter(c => (c as any).target_station === 'BAR');
        setCategories(barCategories as any);
        
        if (!menuRes.error) {
          const barCatIds = new Set(barCategories.map(c => c.id));
          const filteredItems = (menuRes.data ?? []).filter(m => barCatIds.has(m.category_id));
          setMenuItems(filteredItems as any);
        }
      }
      setLoadingMenu(false);
    });
  }, [restaurantId, tab]);

  const toggle86 = async (item: { id: string; name: string; is_active: boolean }) => {
    const newActive = !item.is_active;
    setMenuItems((prev) => prev.map((m) => (m.id === item.id ? { ...m, is_active: newActive } : m)));
    await supabase.from("menu_items").update({ is_active: newActive }).eq("id", item.id);
    if (restaurantId) {
      logBarAction(restaurantId, userId, newActive ? 'STOCK_RESTORED' : 'STOCK_MARKED_OUT', {
        itemId: item.id,
        itemName: item.name,
      });
    }
  };

  const showSave = !TABS_WITHOUT_SAVE.includes(tab);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-card border border-foreground/10 rounded-3xl shadow-2xl flex flex-col max-h-[90vh]">

        <div className="flex items-center justify-between px-8 py-6 border-b border-foreground/5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Wine className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-xl font-black text-foreground tracking-tight">Configuración de Barra</h2>
          </div>
          <button onClick={onClose} className="text-foreground/40 hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex space-x-1 px-8 py-4 border-b border-foreground/5 overflow-x-auto no-scrollbar">
          {TABS.map(({ key, label, Icon }) => (
            <button key={key} onClick={() => setTab(key)}
              className={cn("flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-all",
                tab === key ? "bg-primary text-primary-foreground" : "text-foreground/40 hover:text-foreground hover:bg-foreground/5")}>
              <Icon className="w-3.5 h-3.5" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-6">
          {tab === "umbrales"   && <ThresholdsTab draft={draft} onChange={setDraft} />}
          {tab === "categorias" && <CategoriesTab draft={draft} categories={categories} loadingMenu={loadingMenu} onChange={setDraft} />}
          {tab === "sonido"     && <SoundTab draft={draft} onChange={setDraft} />}
          {tab === "auto"       && <AutoClearTab draft={draft} onChange={setDraft} />}

          {tab === "86items"    && <StockOutTab menuItems={menuItems} loadingMenu={loadingMenu} restaurantId={restaurantId} onToggle={toggle86} />}
          {tab === "inventario" && <InventoryTab restaurantId={restaurantId} />}
        </div>

        <div className="px-8 py-5 border-t border-foreground/5 flex justify-end space-x-3">
          <button onClick={onClose} className="px-6 py-3 rounded-xl text-foreground/40 text-xs font-bold uppercase tracking-widest hover:text-foreground transition-colors">
            {showSave ? "Cancelar" : "Cerrar"}
          </button>
          {showSave && (
            <button onClick={() => onSave(draft)} className="px-8 py-3 bg-primary rounded-xl text-primary-foreground text-xs font-bold uppercase tracking-widest hover:bg-primary/90 transition-all">
              Guardar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
