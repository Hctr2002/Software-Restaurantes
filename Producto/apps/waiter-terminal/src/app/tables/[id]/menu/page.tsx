"use client";

import React, { useState, useMemo } from "react";
import { useAuthStore } from "@menu-bites/store";
import { useMenu, useTable, supabase } from "@menu-bites/auth";
import { MenuItemCard, ProductSearchBar, CategoryTabs, Button, RestaurantThemeProvider } from "@menu-bites/ui";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, ShoppingBag, Send, Trash2, Loader2 } from "lucide-react";
import { useThemeSync } from "@menu-bites/auth";

export default function TableMenuPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const tableId = params.id as string;

  const { menu, categories, loading: menuLoading } = useMenu(user?.restaurantId);
  const { table, loading: tableLoading } = useTable(tableId);
  const theme = useThemeSync(user?.restaurantId);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [cart, setCart] = useState<any[]>([]);
  const [orderNote, setOrderNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loading = menuLoading || tableLoading;

  // Filtrado de menú
  const filteredMenu = useMemo(() => {
    return menu.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = activeCategory === "all" || item.categoryId === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [menu, searchTerm, activeCategory]);

  const addToCart = (item: any) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const total = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const handleSubmitOrder = async () => {
    if (!user?.restaurantId || cart.length === 0 || submitting) return;
    setSubmitting(true);

    try {
      // Map each category to its station
      const categoryStationMap = new Map<string, 'KITCHEN' | 'BAR'>(
        categories.map((cat: any) => [cat.id, (cat.target_station ?? 'KITCHEN') as 'KITCHEN' | 'BAR'])
      );
      // Map each menu item to its station via category
      const itemStationMap = new Map<string, 'KITCHEN' | 'BAR'>(
        menu.map((item) => [item.id, categoryStationMap.get(item.categoryId ?? '') ?? 'KITCHEN'])
      );

      const kitchenItems = cart.filter((i) => itemStationMap.get(i.id) === 'KITCHEN');
      const barItems     = cart.filter((i) => itemStationMap.get(i.id) === 'BAR');

      const createSubOrder = async (items: typeof cart, station: 'KITCHEN' | 'BAR', parentId?: string) => {
        const stationTotal = items.reduce((acc, i) => acc + i.price * i.quantity, 0);
        const { data: order, error: orderError } = await supabase
          .from("orders")
          .insert({
            restaurant_id: user.restaurantId,
            table_id: tableId,
            status: "VALIDATED",
            validated_at: new Date().toISOString(),
            total_amount: items.length === cart.length ? total : stationTotal,
            station,
            parent_order_id: parentId ?? null,
            notes: orderNote.trim() || null
          })
          .select()
          .single();
        if (orderError) throw orderError;

        const { error: itemsError } = await supabase.from("order_items").insert(
          items.map((item) => ({
            order_id: order.id,
            menu_item_id: item.id,
            quantity: item.quantity,
            unit_price: item.price,
            restaurant_id: user.restaurantId
          }))
        );
        if (itemsError) throw itemsError;
        return order.id as string;
      };

      const orderIds: string[] = [];
      if (kitchenItems.length > 0) orderIds.push(await createSubOrder(kitchenItems, 'KITCHEN'));
      if (barItems.length > 0)     orderIds.push(await createSubOrder(barItems, 'BAR', orderIds[0] ?? undefined));

      await supabase.from("tables").update({ status: "OCCUPIED" }).eq("id", tableId);
      router.push("/");
    } catch (err: any) {
      console.error("Error al enviar pedido:", err?.message || err?.code || JSON.stringify(err));
      alert("Error al enviar pedido. Inténtelo de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy">
        <div className="w-16 h-16 border-4 border-white/5 border-t-brand-accent rounded-full animate-spin shadow-2xl shadow-brand-accent/20" />
      </div>
    );
  }

  return (
    <RestaurantThemeProvider theme={theme ?? undefined} isGlobal>
      <div className="min-h-screen bg-background text-foreground pb-32">
        {/* Header con Back Button */}
        <header className="bg-card/50 backdrop-blur-xl sticky top-0 z-50 p-5 flex items-center space-x-4 border-b border-border/10">
          <button
            onClick={() => router.push("/")}
            className="p-3 bg-foreground/5 rounded-2xl border border-foreground/5 hover:bg-foreground/10 hover:border-foreground/10 transition-all active:scale-95 text-foreground"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-black tracking-tighter uppercase italic">
              Mesa <span className="text-brand-accent">{table?.number ?? "..."}</span>
            </h1>
            <p className="text-[10px] text-primary uppercase font-black tracking-[0.2em] mt-0.5">Nuevo Pedido</p>
          </div>
        </header>

        <main className="space-y-6 pt-6">
          <ProductSearchBar 
            value={searchTerm} 
            onChange={setSearchTerm} 
            onClear={() => setSearchTerm("")} 
          />

          <CategoryTabs 
            categories={[{ id: "all", name: "Todos" }, ...categories]} 
            activeId={activeCategory}
            onSelect={setActiveCategory}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 px-4">
            {filteredMenu.map((item) => (
              <MenuItemCard
                key={item.id}
                name={item.name}
                price={item.price}
                imageUrl={item.imageUrl ?? undefined}
                description={item.description ?? undefined}
                onAdd={() => addToCart(item)}
              />
            ))}
          </div>

          {filteredMenu.length === 0 && (
            <div className="text-center py-24 bg-foreground/[0.02] rounded-[3rem] border border-dashed border-border/20 flex flex-col items-center mx-4">
              <p className="text-foreground/20 font-black uppercase tracking-widest text-xs">No se encontraron platos con ese criterio.</p>
            </div>
          )}
        </main>

        {/* Bandeja Flotante (Wow Factor) */}
        {cart.length > 0 && (
          <div className="fixed bottom-6 inset-x-4 z-50 animate-in slide-in-from-bottom-8 duration-500">
            <div className="max-w-2xl mx-auto bg-card/80 backdrop-blur-2xl p-6 rounded-[2.5rem] shadow-2xl shadow-black/20 space-y-4 border border-white/10">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-primary/10 rounded-[1.25rem] flex items-center justify-center border border-primary/10 relative">
                    <ShoppingBag className="w-6 h-6 text-primary" />
                    <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-card">
                      {cart.reduce((a, b) => a + b.quantity, 0)}
                    </div>
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-primary">Bandeja</p>
                    <p className="text-2xl font-black leading-none mt-1">${total.toLocaleString()}</p>
                  </div>
                </div>
                <button
                  onClick={() => setCart([])}
                  className="p-3 text-foreground/20 hover:text-red-500 transition-colors"
                  title="Limpiar Carrito"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>

              <input
                type="text"
                placeholder="Nota para preparación (ej: sin sal, alergia...)"
                value={orderNote}
                onChange={(e) => setOrderNote(e.target.value)}
                className="w-full text-xs px-4 py-3 rounded-2xl bg-foreground/5 border border-foreground/10 text-foreground placeholder:text-foreground/30 focus:outline-none focus:ring-1 focus:ring-primary/20"
              />
              <div className="flex space-x-3">
                <button
                  onClick={() => setCart([])}
                  className="flex-1 py-4 bg-foreground/5 hover:bg-foreground/10 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all border border-foreground/5 text-foreground/60"
                >
                  Limpiar
                </button>
                <button
                  onClick={handleSubmitOrder}
                  disabled={submitting}
                  className="flex-[2] py-4 bg-primary text-primary-foreground font-black uppercase tracking-widest rounded-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center shadow-xl shadow-primary/20 text-[10px] disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="mr-2 w-4 h-4" />}
                  Enviar Pedido
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RestaurantThemeProvider>
  );
}
