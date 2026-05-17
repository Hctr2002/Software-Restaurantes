"use client";

import React, { useState, useMemo } from "react";
import { useAuthStore } from "@menu-bites/store";
import { useMenu, useTable, supabase, useThemeSync, useTableOrders } from "@menu-bites/auth";
import { MenuItemCard, ProductSearchBar, CategoryTabs, Button, RestaurantThemeProvider, PremiumHeader } from "@menu-bites/ui";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, ShoppingBag, Send, Trash2, Loader2, Receipt } from "lucide-react";

export default function TableMenuPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const tableId = params.id as string;

  const { menu, categories, loading: menuLoading } = useMenu(user?.restaurantId);
  const { table, loading: tableLoading } = useTable(tableId);
  const { orders: tableOrders, loading: ordersLoading } = useTableOrders(tableId, table?.current_session_id);
  const theme = useThemeSync(user?.restaurantId, "waiter");
  
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [cart, setCart] = useState<any[]>([]);
  const [orderNote, setOrderNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showBillModal, setShowBillModal] = useState(false);
  const [requestingBill, setRequestingBill] = useState(false);
  const [orderNotes, setOrderNotes] = useState("");

  const loading = menuLoading || tableLoading || ordersLoading;

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
    if (!user?.restaurantId) {
      alert("No se encontró el ID del restaurante en la sesión. ¿Estás logueado?");
      return;
    }
    if (cart.length === 0 || submitting) return;
    setSubmitting(true);

    try {
      // 0. Obtener el current_session_id de la mesa actual para agrupar en mesas fusionadas
      const { data: tableData } = await supabase
        .from("tables")
        .select("current_session_id")
        .eq("id", tableId)
        .single();

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
            session_id: tableData?.current_session_id ?? null,
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

  const handleRequestBill = async (includeTip: boolean) => {
    if (!user?.restaurantId || requestingBill || table?.status === 'FREE') return;
    setRequestingBill(true);
    try {
      const { error } = await supabase
        .from("tables")
        .update({ bill_requested: true, tip_included: includeTip })
        .eq("id", tableId);
      
      if (error) throw error;
      router.push("/");
    } catch (err) {
      console.error("Error al pedir cuenta:", err);
      alert("Error al solicitar la cuenta.");
    } finally {
      setRequestingBill(false);
      setShowBillModal(false);
    }
  };

  if (loading) {
    return (
      <RestaurantThemeProvider theme={theme ?? undefined} isGlobal>
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
          <div className="w-16 h-16 border-4 border-foreground/5 border-t-primary rounded-full animate-spin shadow-2xl shadow-primary/20" />
        </div>
      </RestaurantThemeProvider>
    );
  }

  return (
    <RestaurantThemeProvider theme={theme ?? undefined} isGlobal>
      <div className="min-h-screen bg-navy bg-body-gradient text-white pb-32">
        {/* Header */}
        <div className="px-4 py-4 sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-white/5">
          <PremiumHeader
            title={`Mesa ${table?.number ?? "..."}`}
            statusLabel="Nuevo Pedido"
            statusSubLabel="Terminal de Garzón"
            icon={ShoppingBag}
            variant="compact"
            actions={
              <div className="flex items-center gap-2">
                <button
                  onClick={() => router.push("/")}
                  className="p-3 text-white/40 hover:text-white bg-white/5 rounded-2xl hover:bg-white/10 transition-colors"
                  title="Volver"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => {
                    if (tableOrders.length === 0) {
                      alert("Validación Estricta: La mesa no tiene productos pedidos.");
                      return;
                    }
                    if (tableOrders.some(o => o.status !== 'DELIVERED')) {
                      alert("Validación Estricta: Todos los pedidos deben estar ENTREGADOS antes de pedir la cuenta.");
                      return;
                    }
                    setShowBillModal(true);
                  }}
                  disabled={table?.status === 'FREE'}
                  className={`flex items-center gap-2 px-4 py-3 bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 rounded-2xl hover:bg-yellow-500/20 transition-all active:scale-95 ${
                    table?.status === 'FREE' ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <Receipt className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Pedir Cuenta</span>
                </button>
              </div>
            }
          />
        </div>

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
          <div className="text-center py-24 bg-white/[0.02] rounded-[3rem] border border-dashed border-white/10 flex flex-col items-center mx-4">
            <p className="text-white/20 font-black uppercase tracking-widest text-xs">No se encontraron platos con ese criterio.</p>
          </div>
        )}
      </main>

      {/* Bandeja Flotante (Wow Factor) */}
      {cart.length > 0 && (
        <div className="fixed bottom-6 inset-x-4 z-50 animate-in slide-in-from-bottom-8 duration-500">
          <div className="max-w-2xl mx-auto glass-navy p-6 rounded-[2.5rem] shadow-2xl shadow-black/40 space-y-4 border border-white/5">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-white/10 rounded-[1.25rem] flex items-center justify-center border border-white/5 relative">
                  <ShoppingBag className="w-6 h-6 text-sage" />
                  <div className="absolute -top-1 -right-1 bg-sage text-navy text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-navy">
                    {cart.reduce((a, b) => a + b.quantity, 0)}
                  </div>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.3em] text-sage">Bandeja</p>
                  <p className="text-2xl font-black leading-none mt-1">${total.toLocaleString()}</p>
                </div>
              </div>
              <button
                onClick={() => setCart([])}
                className="p-3 text-white/20 hover:text-red-500 transition-colors"
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
              className="w-full text-xs px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/20"
            />

            <div className="flex space-x-3">
              <button
                onClick={() => setCart([])}
                className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all border border-white/5 text-white/60"
              >
                Limpiar
              </button>
              <button
                onClick={handleSubmitOrder}
                disabled={submitting}
                className="flex-[2] py-4 bg-sage text-navy font-black uppercase tracking-widest rounded-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center shadow-xl shadow-black/30 text-[10px] disabled:opacity-50"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="mr-2 w-4 h-4" />}
                Enviar Pedido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Pedir Cuenta */}
      {showBillModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-xl" onClick={() => !requestingBill && setShowBillModal(false)} />
          <div className="relative w-full max-w-sm bg-card border border-white/10 rounded-[3rem] p-8 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-yellow-500/10 rounded-[1.5rem] flex items-center justify-center border border-yellow-500/20 mx-auto">
              <Receipt className="w-8 h-8 text-yellow-500" />
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-black tracking-tighter">Solicitar Cuenta</h2>
              <p className="text-xs text-muted-foreground font-bold opacity-80">
                ¿El cliente desea incluir el <span className="text-yellow-500 font-black">10% de propina</span> sugerida?
              </p>
            </div>
            <div className="space-y-3 pt-4">
              <Button
                onClick={() => handleRequestBill(true)}
                disabled={requestingBill}
                className="w-full h-14 bg-yellow-500 hover:bg-yellow-400 text-black font-black uppercase text-[10px] tracking-[0.2em] rounded-[1.5rem]"
              >
                {requestingBill ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sí, incluir propina"}
              </Button>
              <button
                onClick={() => handleRequestBill(false)}
                disabled={requestingBill}
                className="w-full h-14 bg-white/10 hover:bg-white/20 text-white font-black uppercase text-[10px] tracking-[0.2em] rounded-[1.5rem] border border-white/10 flex items-center justify-center transition-colors"
              >
                {requestingBill ? <Loader2 className="w-4 h-4 animate-spin" /> : "No incluir propina"}
              </button>
              <button
                onClick={() => setShowBillModal(false)}
                disabled={requestingBill}
                className="w-full py-4 text-[10px] text-muted-foreground font-black uppercase tracking-widest hover:text-white transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </RestaurantThemeProvider>
  );
}
