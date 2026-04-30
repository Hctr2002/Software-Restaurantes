"use client";

import React, { useState, useEffect } from "react";
import { X, Plus, Trash2, Volume2, Timer, Layers, ShoppingBag, ChefHat } from "lucide-react";
import { supabase } from "@menu-bites/auth";
import { cn } from "@menu-bites/ui";
import { type KDSSettings } from "../../lib/kdsSettings";

type Tab = "umbrales" | "categorias" | "sonido" | "auto" | "86items";

interface Props {
  settings: KDSSettings;
  restaurantId: string | undefined;
  onSave: (s: KDSSettings) => void;
  onClose: () => void;
}

export function SettingsModal({ settings: initial, restaurantId, onSave, onClose }: Props) {
  const [tab, setTab] = useState<Tab>("umbrales");
  const [draft, setDraft] = useState<KDSSettings>(initial);
  const [menuItems, setMenuItems] = useState<{ id: string; name: string; is_active: boolean }[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [loadingMenu, setLoadingMenu] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatMinutes, setNewCatMinutes] = useState(15);

  useEffect(() => {
    if (!restaurantId || (tab !== "86items" && tab !== "categorias")) return;
    setLoadingMenu(true);
    Promise.all([
      supabase.from("menu_items").select("id, name, is_active").eq("restaurant_id", restaurantId).order("name"),
      supabase.from("categories").select("id, name").eq("restaurant_id", restaurantId).eq("is_active", true).order("name"),
    ]).then(([menuRes, catRes]) => {
      if (!menuRes.error) setMenuItems(menuRes.data ?? []);
      if (!catRes.error) setCategories(catRes.data ?? []);
      setLoadingMenu(false);
    });
  }, [restaurantId, tab]);

  const toggle86 = async (item: { id: string; is_active: boolean }) => {
    const newActive = !item.is_active;
    setMenuItems(prev => prev.map(m => m.id === item.id ? { ...m, is_active: newActive } : m));
    await supabase.from("menu_items").update({ is_active: newActive }).eq("id", item.id);
  };

  const addCategoryTime = () => {
    if (!newCatName.trim()) return;
    setDraft(d => ({ ...d, categoryTimes: [...d.categoryTimes, { name: newCatName.trim(), minutes: newCatMinutes }] }));
    setNewCatName("");
    setNewCatMinutes(15);
  };

  const removeCategoryTime = (i: number) => {
    setDraft(d => ({ ...d, categoryTimes: d.categoryTimes.filter((_, idx) => idx !== i) }));
  };

  const tabs: { key: Tab; label: string; Icon: React.ElementType }[] = [
    { key: "umbrales", label: "Umbrales", Icon: Timer },
    { key: "categorias", label: "Categorías", Icon: Layers },
    { key: "sonido", label: "Sonido", Icon: Volume2 },
    { key: "auto", label: "Auto-borrado", Icon: ChefHat },
    { key: "86items", label: "Sin Stock", Icon: ShoppingBag },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-slate-900 border border-white/10 rounded-3xl shadow-2xl flex flex-col max-h-[90vh]">

        <div className="flex items-center justify-between px-8 py-6 border-b border-white/5">
          <h2 className="text-xl font-black text-white tracking-tight">Configuración KDS</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex space-x-1 px-8 py-4 border-b border-white/5 overflow-x-auto no-scrollbar">
          {tabs.map(({ key, label, Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={cn(
                "flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-all",
                tab === key ? "bg-primary text-primary-foreground" : "text-white/40 hover:text-white hover:bg-white/5"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-4">

          {tab === "umbrales" && (
            <div className="space-y-5">
              <p className="text-white/40 text-sm">Minutos a partir de los cuales una comanda cambia de color.</p>
              <ThresholdRow label="Amarillo" description="Alerta moderada" color="text-yellow-400"
                value={draft.thresholds.yellow}
                onChange={v => setDraft(d => ({ ...d, thresholds: { ...d.thresholds, yellow: v } }))} />
              <ThresholdRow label="Rojo" description="Estado crítico" color="text-red-400"
                value={draft.thresholds.red}
                onChange={v => setDraft(d => ({ ...d, thresholds: { ...d.thresholds, red: v } }))} />
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                <p className="text-[11px] text-white/40 uppercase tracking-widest font-bold mb-3">Vista previa</p>
                <div className="flex space-x-3">
                  <Preview label={`Verde < ${draft.thresholds.yellow}m`} color="border-emerald-500/50 text-emerald-400" />
                  <Preview label={`Amarillo ${draft.thresholds.yellow}–${draft.thresholds.red}m`} color="border-yellow-500/50 text-yellow-400" />
                  <Preview label={`Rojo > ${draft.thresholds.red}m`} color="border-red-500/50 text-red-400" />
                </div>
              </div>
            </div>
          )}

          {tab === "categorias" && (
            <div className="space-y-4">
              <p className="text-white/40 text-sm">Tiempo de preparación objetivo por categoría de plato.</p>
              {draft.categoryTimes.length === 0 && (
                <p className="text-white/20 text-sm text-center py-6">Sin categorías configuradas</p>
              )}
              {draft.categoryTimes.map((ct, i) => (
                <div key={i} className="flex items-center justify-between bg-white/5 rounded-2xl px-5 py-4 border border-white/5">
                  <span className="text-white font-semibold text-sm">{ct.name}</span>
                  <div className="flex items-center space-x-4">
                    <span className="text-primary font-black">{ct.minutes} min</span>
                    <button onClick={() => removeCategoryTime(i)} className="text-red-400/60 hover:text-red-400 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              <div className="flex space-x-3 items-end pt-2">
                {loadingMenu ? (
                  <div className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white/30 text-sm">Cargando...</div>
                ) : categories.length > 0 ? (
                  <select className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm"
                    value={newCatName} onChange={e => setNewCatName(e.target.value)}>
                    <option value="">Seleccionar categoría...</option>
                    {categories.filter(c => !draft.categoryTimes.find(ct => ct.name === c.name)).map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                ) : (
                  <input className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/20"
                    placeholder="Nombre de categoría..." value={newCatName} onChange={e => setNewCatName(e.target.value)} />
                )}
                <div className="flex items-center space-x-2 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                  <input type="number" min={1} max={120} value={newCatMinutes}
                    onChange={e => setNewCatMinutes(Number(e.target.value))}
                    className="w-12 bg-transparent text-white text-sm text-center outline-none" />
                  <span className="text-white/40 text-xs">min</span>
                </div>
                <button onClick={addCategoryTime}
                  className="px-5 py-3 bg-primary rounded-xl text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-all">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {tab === "sonido" && (
            <div className="space-y-4">
              <p className="text-white/40 text-sm">Notificaciones sonoras del sistema KDS.</p>
              <ToggleRow label="Nuevo ticket" description="Alerta cuando llega un nuevo pedido"
                checked={draft.sounds.newTicket}
                onChange={v => setDraft(d => ({ ...d, sounds: { ...d.sounds, newTicket: v } }))} />
              <ToggleRow label="Alerta crítica"
                description={`Alerta cuando un ticket supera ${draft.thresholds.red} minutos`}
                checked={draft.sounds.criticalAlert}
                onChange={v => setDraft(d => ({ ...d, sounds: { ...d.sounds, criticalAlert: v } }))} />
            </div>
          )}

          {tab === "auto" && (
            <div className="space-y-4">
              <p className="text-white/40 text-sm">Las comandas marcadas como "Listo" desaparecen automáticamente.</p>
              <ToggleRow label="Activar auto-borrado" description="Elimina comandas listas tras el tiempo configurado"
                checked={draft.autoClear.enabled}
                onChange={v => setDraft(d => ({ ...d, autoClear: { ...d.autoClear, enabled: v } }))} />
              {draft.autoClear.enabled && (
                <div className="p-5 bg-white/5 rounded-2xl border border-white/5 space-y-3">
                  <label className="text-white/60 text-xs uppercase tracking-widest font-bold">Tiempo de espera</label>
                  <div className="flex items-center space-x-4">
                    <input type="range" min={5} max={300} step={5} value={draft.autoClear.delaySeconds}
                      onChange={e => setDraft(d => ({ ...d, autoClear: { ...d.autoClear, delaySeconds: Number(e.target.value) } }))}
                      className="flex-1 accent-primary" />
                    <span className="text-white font-black text-lg w-16 text-right">{draft.autoClear.delaySeconds}s</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === "86items" && (
            <div className="space-y-4">
              <p className="text-white/40 text-sm">Marca productos como agotados. El cambio es inmediato en el sistema.</p>
              {loadingMenu && <div className="flex justify-center py-12 text-white/30 text-sm">Cargando menú...</div>}
              {!restaurantId && !loadingMenu && (
                <div className="flex justify-center py-12 text-white/30 text-sm">Sin conexión — modo demo activo</div>
              )}
              {restaurantId && !loadingMenu && menuItems.length === 0 && (
                <div className="flex justify-center py-12 text-white/30 text-sm">No hay items en el menú</div>
              )}
              {!loadingMenu && menuItems.map(item => (
                <div key={item.id} className={cn(
                  "flex items-center justify-between px-5 py-4 rounded-2xl border transition-all",
                  item.is_active ? "bg-white/5 border-white/5" : "bg-red-500/10 border-red-500/20"
                )}>
                  <div>
                    <p className={cn("font-semibold text-sm", item.is_active ? "text-white" : "text-red-400 line-through")}>{item.name}</p>
                    {!item.is_active && <p className="text-red-400/60 text-xs font-bold uppercase tracking-widest mt-0.5">86 — Agotado</p>}
                  </div>
                  <button onClick={() => toggle86(item)}
                    className={cn(
                      "px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all",
                      item.is_active ? "bg-red-500/20 text-red-400 hover:bg-red-500/30" : "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                    )}>
                    {item.is_active ? "86 Item" : "Restaurar"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-8 py-5 border-t border-white/5 flex justify-end space-x-3">
          <button onClick={onClose} className="px-6 py-3 rounded-xl text-white/40 text-xs font-bold uppercase tracking-widest hover:text-white transition-colors">
            {tab === "86items" ? "Cerrar" : "Cancelar"}
          </button>
          {tab !== "86items" && (
            <button onClick={() => onSave(draft)}
              className="px-8 py-3 bg-primary rounded-xl text-primary-foreground text-xs font-bold uppercase tracking-widest hover:bg-primary/90 transition-all">
              Guardar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ThresholdRow({ label, description, color, value, onChange }: {
  label: string; description: string; color: string; value: number; onChange: (v: number) => void;
}) {
  return (
    <div className="p-5 bg-white/5 rounded-2xl border border-white/5 space-y-3">
      <div>
        <p className={cn("font-bold text-sm", color)}>{label}</p>
        <p className="text-white/40 text-xs">{description}</p>
      </div>
      <div className="flex items-center space-x-4">
        <input type="range" min={1} max={60} value={value}
          onChange={e => onChange(Number(e.target.value))} className="flex-1 accent-primary" />
        <span className="text-white font-black text-lg w-16 text-right">{value} min</span>
      </div>
    </div>
  );
}

function ToggleRow({ label, description, checked, onChange }: {
  label: string; description: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between p-5 bg-white/5 rounded-2xl border border-white/5">
      <div>
        <p className="text-white font-semibold text-sm">{label}</p>
        <p className="text-white/40 text-xs mt-0.5">{description}</p>
      </div>
      <button onClick={() => onChange(!checked)}
        className={cn("w-12 h-6 rounded-full transition-all relative flex-shrink-0", checked ? "bg-primary" : "bg-white/10")}>
        <span className={cn("absolute top-1 w-4 h-4 rounded-full bg-white transition-all", checked ? "left-7" : "left-1")} />
      </button>
    </div>
  );
}

function Preview({ label, color }: { label: string; color: string }) {
  return (
    <div className={cn("flex-1 p-3 rounded-xl border text-center text-xs font-bold", color)}>{label}</div>
  );
}
