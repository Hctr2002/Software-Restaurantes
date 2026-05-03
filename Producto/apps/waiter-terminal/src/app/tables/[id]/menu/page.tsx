"use client";

import React, { useState, useMemo } from "react";
import { useAuthStore } from "@menu-bites/store";
import { useMenu, supabase } from "@menu-bites/auth";
import { MenuItemCard, ProductSearchBar, CategoryTabs, Button } from "@menu-bites/ui";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, ShoppingBag, Send, Trash2, Loader2 } from "lucide-react";

export default function TableMenuPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const { menu, categories, loading } = useMenu(user?.restaurantId);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [cart, setCart] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const tableId = params.id as string;

  // Filtrado de menú
  const filteredMenu = useMemo(() => {
    return menu.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = activeCategory === "all" || item.category_id === activeCategory;
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
      // 1. Crear la orden
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          restaurant_id: user.restaurantId,
          table_id: tableId,
          user_id: user.id,
          status: "PENDING", // Pasa a cocina para validación/preparación
          total_amount: total
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // 2. Insertar ítems
      const orderItems = cart.map((item) => ({
        order_id: order.id,
        menu_item_id: item.id,
        quantity: item.quantity,
        unit_price: item.price
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
    } catch (err) {
      console.error("Error al enviar pedido:", err);
      alert("Error al enviar a cocina. Inténtelo de nuevo.");
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
    <div className="min-h-screen bg-navy bg-body-gradient text-white pb-32">
      {/* Header con Back Button */}
      <header className="glass-navy sticky top-0 z-50 p-5 flex items-center space-x-4">
        <button
          onClick={() => router.push("/")}
          className="p-3 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all active:scale-95"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-black tracking-tighter uppercase italic">
            Mesa <span className="text-brand-accent">{tableId.slice(0, 4)}</span>
          </h1>
          <p className="text-[10px] text-sage uppercase font-black tracking-[0.2em] mt-0.5">Nuevo Pedido</p>
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
              imageUrl={item.image_url}
              description={item.description}
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
    </div>
  );
}
