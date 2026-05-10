"use client";

import React, { useState, useMemo } from "react";
import { useAuthStore } from "@menu-bites/store";
import { useMenu, useTable, supabase, useThemeSync } from "@menu-bites/auth";
import { MenuItemCard, ProductSearchBar, CategoryTabs, Button, RestaurantThemeProvider } from "@menu-bites/ui";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, ShoppingBag, Send, Trash2, Loader2, Receipt } from "lucide-react";

export default function TableMenuPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const tableId = params.id as string;

  const { menu, categories, loading: menuLoading } = useMenu(user?.restaurantId);
  const { table, loading: tableLoading } = useTable(tableId);
  const theme = useThemeSync(user?.restaurantId, "waiter");
  
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [cart, setCart] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [showBillModal, setShowBillModal] = useState(false);
  const [requestingBill, setRequestingBill] = useState(false);

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
      // 0. Obtener el session_id de la mesa actual para agrupar en mesas fusionadas
      const { data: tableData } = await supabase
        .from("tables")
        .select("session_id")
        .eq("id", tableId)
        .single();

      // 1. Crear la orden
      const orderId = crypto.randomUUID();
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          id: orderId,
          restaurant_id: user.restaurantId,
          table_id: tableId,
          session_id: tableData?.session_id || null,
          status: "PENDING", // Pasa a cocina para validación/preparación
          total_amount: total
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // 2. Insertar ítems
      const orderItems = cart.map((item) => ({
        id: crypto.randomUUID(),
        order_id: order.id,
        menu_item_id: item.id,
        restaurant_id: user.restaurantId,
        quantity: item.quantity,
        unit_price: item.price,
        restaurant_id: user.restaurantId
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // 3. Marcar mesa como OCUPADA
      await supabase
        .from("tables")
        .update({ status: "OCCUPIED" })
        .eq("id", tableId);

      // 4. Éxito: volver al inicio
      router.push("/");
    } catch (err: any) {
      console.error("Error al enviar pedido:", err?.message || JSON.stringify(err));
      alert(`Error al enviar a cocina: ${err?.message || 'Revisa la consola'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestBill = async (includeTip: boolean) => {
    if (!user?.restaurantId || requestingBill) return;
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
        {/* Header con Back Button y Pedir Cuenta */}
        <header className="glass-navy sticky top-0 z-50 p-5 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push("/")}
              className="p-3 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all active:scale-95"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-black tracking-tighter uppercase italic">
                Mesa <span className="text-brand-accent">{table?.number ?? "..."}</span>
              </h1>
              <p className="text-[10px] text-sage uppercase font-black tracking-[0.2em] mt-0.5">Nuevo Pedido</p>
            </div>
          </div>
          <button
            onClick={() => setShowBillModal(true)}
            className="flex items-center gap-2 px-4 py-3 bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 rounded-2xl hover:bg-yellow-500/20 transition-all active:scale-95"
          >
            <Receipt className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Pedir Cuenta</span>
          </button>
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

            <div className="flex space-x-3">
              <button 
                onClick={() => alert("Función de detalle en construcción")}
                className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all border border-white/5"
              >
                Revisar ({cart.length})
              </button>
              <button 
                onClick={handleSubmitOrder}
                disabled={submitting}
                className="flex-[2] py-4 bg-sage text-navy font-black uppercase tracking-widest rounded-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center shadow-xl shadow-black/30 text-[10px] disabled:opacity-50"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="mr-2 w-4 h-4" />}
                Enviar a Cocina
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
              <Button
                variant="outline"
                onClick={() => handleRequestBill(false)}
                disabled={requestingBill}
                className="w-full h-14 border-white/10 hover:bg-white/5 font-black uppercase text-[10px] tracking-[0.2em] rounded-[1.5rem]"
              >
                {requestingBill ? <Loader2 className="w-4 h-4 animate-spin" /> : "No incluir propina"}
              </Button>
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
