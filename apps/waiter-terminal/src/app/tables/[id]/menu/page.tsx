"use client";

import React, { useState, useMemo } from "react";
import { useAuthStore } from "@menu-bites/store";
import { useMenu } from "@menu-bites/auth";
import { MenuItemCard, ProductSearchBar, CategoryTabs, cn } from "@menu-bites/ui";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, ShoppingBag, Send, Trash2 } from "lucide-react";

export default function TableMenuPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const { menu, categories, loading } = useMenu(user?.restaurantId);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [cart, setCart] = useState<any[]>([]);

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white pb-32">
      {/* Header con Back Button */}
      <header className="glass sticky top-0 z-50 p-4 flex items-center space-x-4 border-b border-white/5">
        <button 
          onClick={() => router.push("/")}
          className="p-2 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-xl font-black tracking-tight">Mesa {params.id?.slice(0, 4)}</h1>
          <p className="text-[10px] text-primary uppercase font-bold tracking-widest">Nuevo Pedido</p>
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
          <div className="text-center py-20 opacity-30 italic font-medium">
            No se encontraron platos con ese criterio.
          </div>
        )}
      </main>

      {/* Floating Action Cart (Wow Factor) */}
      {cart.length > 0 && (
        <div className="fixed bottom-6 inset-x-4 z-50 animate-in slide-in-from-bottom-8 duration-500">
          <div className="max-w-2xl mx-auto glass p-6 rounded-3xl border-primary/20 shadow-2xl shadow-primary/10 space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary rounded-xl">
                  <ShoppingBag className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-xs font-bold opacity-60 uppercase">Total Pedido</p>
                  <p className="text-2xl font-black text-primary">${total.toLocaleString()}</p>
                </div>
              </div>
              <button 
                onClick={() => setCart([])}
                className="p-3 text-muted-foreground hover:text-destructive transition-colors"
                title="Limpiar Carrito"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>

            <div className="flex space-x-3">
              <button className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-xs font-bold uppercase tracking-widest rounded-2xl transition-all">
                Ver Detalle ({cart.length})
              </button>
              <button className="flex-[2] py-4 bg-primary text-primary-foreground font-black uppercase tracking-widest rounded-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center">
                Enviar a Cocina <Send className="ml-2 w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
