"use client";

import React, { useState, useMemo, Suspense } from "react";
import { useAuthStore } from "@menu-bites/store";
import { useMenu, supabase } from "@menu-bites/auth";
import { MenuItemCard, ProductSearchBar, CategoryTabs } from "@menu-bites/ui";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ShoppingBag, Send, Trash2 } from "lucide-react";

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category_id: string;
  restaurant_id: string;
  is_active: boolean;
}

interface CartItem extends MenuItem {
  quantity: number;
}

function MenuPageContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  const { menu, categories, loading } = useMenu(user?.restaurantId);

  const tableNumber = searchParams.get("number") ?? (params.id as string)?.slice(0, 4);

  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const filteredMenu = useMemo(() => {
    return (menu as MenuItem[]).filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = activeCategory === "all" || item.category_id === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [menu, searchTerm, activeCategory]);

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const total = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const sendToKitchen = async () => {
    if (cart.length === 0 || !user?.restaurantId) return;
    const tableId = params.id as string;
    setIsSending(true);
    setSendError(null);

    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .insert({
        table_id: tableId,
        restaurant_id: user.restaurantId,
        status: "PENDING",
        total_amount: total,
      })
      .select("id")
      .single();

    if (orderError || !orderData) {
      setSendError("No se pudo crear el pedido. Intenta nuevamente.");
      setIsSending(false);
      return;
    }

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(
        cart.map((item) => ({
          order_id: orderData.id as string,
          menu_item_id: item.id,
          restaurant_id: user.restaurantId as string,
          quantity: item.quantity,
          unit_price: item.price,
        }))
      );

    if (itemsError) {
      setSendError("Pedido creado pero falló al guardar los ítems.");
      setIsSending(false);
      return;
    }

    const { error: tableError } = await supabase
      .from("tables")
      .update({ status: "OCCUPIED" })
      .eq("id", tableId);

    if (tableError) console.error("table status update failed:", tableError.message);

    router.push("/");
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
      <header className="glass-navy sticky top-0 z-50 p-5 flex items-center space-x-4">
        <button
          onClick={() => router.push("/")}
          className="p-3 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all active:scale-95"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-black tracking-tighter uppercase italic">
            Mesa <span className="text-brand-accent">{tableNumber}</span>
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
              imageUrl={item.image_url ?? undefined}
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

      {cart.length > 0 && (
        <div className="fixed bottom-6 inset-x-4 z-50 animate-in slide-in-from-bottom-8 duration-500">
          <div className="max-w-2xl mx-auto glass-navy p-6 rounded-[2.5rem] shadow-2xl shadow-black/40 space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-white/10 rounded-[1.25rem] flex items-center justify-center border border-white/5 relative">
                  <ShoppingBag className="w-6 h-6 text-sage" />
                  <div className="absolute -top-1 -right-1 bg-sage text-navy text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-navy">
                    {cart.length}
                  </div>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.3em] text-sage">Bandeja</p>
                  <p className="text-2xl font-black leading-none mt-1">${total.toLocaleString()}</p>
                </div>
              </div>
              <button
                onClick={() => setCart([])}
                className="p-3 text-white/20 hover:text-destructive transition-colors"
                title="Limpiar Carrito"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>

            {isDetailOpen && (
              <ul className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {cart.map((item) => (
                  <li key={item.id} className="flex justify-between items-center text-xs text-white/70">
                    <span className="font-semibold truncate max-w-[60%]">{item.name}</span>
                    <span className="font-black text-white">
                      x{item.quantity}{" "}
                      <span className="text-sage">${(item.price * item.quantity).toLocaleString()}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}

            {sendError && (
              <p className="text-xs text-destructive font-semibold text-center">{sendError}</p>
            )}

            <div className="flex space-x-3">
              <button
                onClick={() => setIsDetailOpen((prev) => !prev)}
                className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all border border-white/5"
              >
                {isDetailOpen ? "Ocultar" : `Detalle (${cart.length})`}
              </button>
              <button
                onClick={sendToKitchen}
                disabled={isSending}
                className="flex-[2] py-4 bg-sage text-navy font-black uppercase tracking-widest rounded-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center shadow-xl shadow-black/30 text-[10px] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isSending ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-navy/30 border-t-navy rounded-full animate-spin" />
                    Enviando...
                  </span>
                ) : (
                  <>Enviar Pedido <Send className="ml-2 w-4 h-4" /></>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TableMenuPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-navy">
        <div className="w-16 h-16 border-4 border-white/5 border-t-brand-accent rounded-full animate-spin" />
      </div>
    }>
      <MenuPageContent />
    </Suspense>
  );
}
