"use client";

import React, { useState, useEffect, use } from 'react';
import { ShoppingBag, Search, Plus, Info, ChevronRight, Loader2 } from 'lucide-react';
import { supabase, getPublicImageUrl } from '@/lib/supabase';

interface Category {
  id: string;
  name: string;
}

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  categoryId: string;
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export default function MenuPage({ params: paramsPromise }: { params: Promise<{ restaurantSlug: string, tableNumber: string }> }) {
  const params = use(paramsPromise);
  const [restaurant, setRestaurant] = useState<any>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { id: item.id, name: item.name, price: item.price, quantity: 1 }];
    });
  };

  useEffect(() => {
    async function fetchData() {
      try {
        // 1. Fetch Restaurant
        const { data: restData, error: restError } = await supabase
          .from('restaurants')
          .select('*')
          .eq('slug', params.restaurantSlug)
          .single();

        if (restError || !restData) {
          console.warn('Restaurante no encontrado, usando modo demo');
          useMockData();
          return;
        }
        setRestaurant(restData);

        // 2. Fetch Categories
        const { data: catData, error: catError } = await supabase
          .from('categories')
          .select('id, name')
          .eq('restaurant_id', restData.id)
          .eq('is_active', true);

        if (catError) throw catError;
        
        if (!catData || catData.length === 0) {
          useMockData();
          return;
        }

        setCategories(catData || []);
        if (catData && catData.length > 0) setActiveCategory(catData[0].id);

        // 3. Fetch Items
        const { data: itemData, error: itemError } = await supabase
          .from('menu_items')
          .select('id, name, description, price, image_url, category_id')
          .eq('restaurant_id', restData.id)
          .eq('is_active', true);

        if (itemError) throw itemError;
        
        // Map data to match interface (price as number)
        const mappedItems = itemData.map((item: any) => ({
          ...item,
          price: Number(item.price),
          imageUrl: item.image_url
        }));
        
        setItems(mappedItems);
      } catch (err) {
        console.error(err);
        useMockData();
      } finally {
        setLoading(false);
      }
    }

    function useMockData() {
      setRestaurant({ name: 'Olympia Garden (Demo)', id: 'demo' });
      const demoCats = [
        { id: '1', name: 'Sugerencias' },
        { id: '2', name: 'Entradas' },
        { id: '3', name: 'Platos Fuertes' },
        { id: '4', name: 'Vinos' }
      ];
      setCategories(demoCats);
      setActiveCategory('1');
      setItems([
        {
          id: 'item1',
          name: 'Risotto de Setas (Demo)',
          description: 'Arroz cremoso con aceite de trufa y parmesano. Esta es la imagen cargada en su storage.',
          price: 18500,
          imageUrl: '169f8d4d-72eb-4b7a-b062-3ddae4cdef1c',
          categoryId: '1'
        },
        {
          id: 'item2',
          name: 'Entrecot Premium',
          description: 'Corte de res madurado con mantequilla de hierbas y papas rústicas.',
          price: 24900,
          imageUrl: null,
          categoryId: '1'
        }
      ]);
    }

    fetchData();
  }, [params.restaurantSlug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-navy-dark flex flex-col items-center justify-center p-6">
        <Loader2 className="w-12 h-12 text-sage animate-spin mb-4" />
        <p className="text-sand/60 font-medium">Cargando menú exclusivo...</p>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-navy-dark flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-2xl font-bold text-sand mb-2">Error 404</h2>
        <p className="text-sage">Lo sentimos, no pudimos encontrar el restaurante solicitado.</p>
      </div>
    );
  }

  const filteredItems = items.filter(item => item.categoryId === activeCategory);

  return (
    <div className="min-h-screen pb-32">
      {/* Header Section */}
      <header className="sticky top-0 z-50 glass-panel px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-sand">{restaurant.name}</h1>
          <p className="text-xs text-sage font-medium uppercase tracking-widest">Mesa {params.tableNumber}</p>
        </div>
        <div className="flex gap-4">
          <button className="p-2 rounded-full hover:bg-sand/10 transition-colors">
            <Search className="w-5 h-5 text-sand/80" />
          </button>
          <div className="relative">
            <button className="p-2 rounded-full bg-sage/20 text-sage hover:bg-sage/30 transition-all">
              <ShoppingBag className="w-5 h-5" />
            </button>
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-accent text-navy-dark text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full animate-in zoom-in">
                {cartCount}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Category Navigation */}
      <nav className="mt-4 px-6 overflow-x-auto no-scrollbar flex gap-3 pb-2 sticky top-[72px] z-40 bg-navy-dark/80 backdrop-blur-sm">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
              activeCategory === cat.id 
                ? "bg-sage text-navy-dark shadow-lg shadow-sage/20 scale-105" 
                : "bg-navy-light/40 text-sand/60 border border-sand/5 hover:bg-navy-light/60"
            }`}
          >
            {cat.name}
          </button>
        ))}
      </nav>

      {/* Menu Items Grid */}
      <section className="px-6 mt-10 space-y-6">
        <h3 className="text-lg font-semibold text-sage-light border-l-4 border-sage pl-3">
          {categories.find(c => c.id === activeCategory)?.name || "Nuestros Platos"}
        </h3>
        
        <div className="grid grid-cols-1 gap-5">
          {filteredItems.length > 0 ? (
            filteredItems.map((item) => (
              <div key={item.id} className="glass-card rounded-2xl overflow-hidden flex h-36 group border border-white/5">
                <div className="w-1/3 relative overflow-hidden bg-navy-light/20">
                  <img 
                    src={getPublicImageUrl(item.imageUrl)} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                    alt={item.name}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=400&auto=format&fit=crop';
                    }}
                  />
                  <button className="absolute top-2 left-2 p-1.5 glass-panel rounded-full text-sand hover:text-accent transition-colors">
                    <Info className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="w-2/3 p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-sand leading-tight line-clamp-1">{item.name}</h4>
                      <span className="text-sage font-bold text-sm ml-2">${item.price.toLocaleString()}</span>
                    </div>
                    <p className="text-[11px] text-sand/60 mt-1 line-clamp-2 font-light italic">
                      {item.description}
                    </p>
                  </div>
                  <div className="flex justify-end items-center">
                    <button 
                      onClick={() => addToCart(item)}
                      className="flex items-center gap-2 bg-sage/10 hover:bg-sage text-sand hover:text-navy-dark px-4 py-1.5 rounded-full border border-sage/30 transition-all duration-300 text-xs font-bold group/btn active:scale-90"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Añadir
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-sand/40 italic">No hay platos disponibles en esta categoría.</p>
            </div>
          )}
        </div>
      </section>

      {/* Floating Cart Button */}
      {cartCount > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] max-w-md z-50 animate-in slide-in-from-bottom-10 fade-in duration-500">
          <button className="w-full bg-sage hover:bg-sage-light text-navy-dark py-4 px-6 rounded-2xl shadow-2xl shadow-sage/20 flex justify-between items-center transition-all active:scale-95 group">
            <div className="flex items-center gap-3">
              <div className="bg-navy-dark text-sand w-8 h-8 rounded-lg flex items-center justify-center font-bold">{cartCount}</div>
              <div className="text-left">
                <span className="block text-[10px] uppercase font-black tracking-widest opacity-60 leading-none">Mi Pedido</span>
                <span className="font-bold">Ver Carrito</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-black text-lg">${cartTotal.toLocaleString()}</span>
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </div>
      )}
    </div>
  );
}


