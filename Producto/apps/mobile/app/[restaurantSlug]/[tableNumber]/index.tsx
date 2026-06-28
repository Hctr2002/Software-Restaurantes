import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { StyleSheet, View, Text, ScrollView, ActivityIndicator, StatusBar, Alert } from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getApiUrl } from '../../../lib/api';

// Components
import { MenuHeader } from './_components/MenuHeader';
import { CategoryNav } from './_components/CategoryNav';
import { MenuItemCard } from './_components/MenuItemCard';
import { CartFooter } from './_components/CartFooter';
import { CheckoutModal } from './_components/CheckoutModal';
import { ActiveOrdersModal } from './_components/ActiveOrdersModal';
import { SuccessOverlay } from './_components/SuccessOverlay';
import { RatingModal } from './_components/RatingModal';
import { TipModal } from './_components/TipModal';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image_url?: string;
}

export default function RestaurantMenuScreen() {
  const { restaurantSlug, tableNumber } = useLocalSearchParams<{ restaurantSlug: string, tableNumber: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  // Data State
  const [restaurant, setRestaurant] = useState<any>(null);
  const [theme, setTheme] = useState<any>(null);
  const [table, setTable] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // UI State
  const [selectedCategory, setSelectedCategory] = useState<string | null>('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showSummary, setShowSummary] = useState(false);
  const [showActiveOrders, setShowActiveOrders] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  
  // Async Action State
  const [activeOrders, setActiveOrders] = useState<any[]>([]);
  const [isPlacing, setIsPlacing] = useState(false);
  const [callingWaiter, setCallingWaiter] = useState(false);
  const [requestingBill, setRequestingBill] = useState(false);
  const [showTipModal, setShowTipModal] = useState(false);

  // Rating state
  const [showRating, setShowRating] = useState(false);
  const [ratingOrderId, setRatingOrderId] = useState<string | null>(null);
  const prevOrderStatusesRef = useRef<Record<string, string>>({});

  // Sync Logic (Polling)
  const syncTableData = useCallback(async (tableId: string) => {
    if (!tableId) return;
    try {
      const portalUrl = getApiUrl(3005);
      
      const ordersRes = await fetch(`${portalUrl}/api/orders?table_id=${tableId}`);
      if (ordersRes.ok) {
        const data = await ordersRes.json();
        if (Array.isArray(data)) {
          setActiveOrders(prev => JSON.stringify(prev) === JSON.stringify(data) ? prev : data);
        }
      }

      const { data: tableData } = await supabase
        .from('tables')
        .select('help_requested, bill_requested, status')
        .eq('id', tableId)
        .single();
      
      if (tableData) {
        setTable((prev: any) => ({ ...prev, ...tableData }));
      }
    } catch (err: any) {
      console.error('[Sync] Error:', err.message);
    }
  }, []);

  // Initial Load
  useEffect(() => {
    async function fetchData() {
      if (!restaurantSlug) return;
      try {
        const { data: resData } = await supabase.from('restaurants').select('id, name, slug').eq('slug', restaurantSlug).single();
        if (!resData) return router.replace('/(tabs)');
        setRestaurant(resData);

        const { data: tableData } = await supabase.from('tables').select('*').eq('restaurant_id', resData.id).eq('number', tableNumber).single();
        if (tableData) {
          setTable(tableData);
          syncTableData(tableData.id);
        }

        const { data: themeData } = await supabase.from('restaurant_themes').select('*').eq('restaurant_id', resData.id).eq('is_active', true).single();
        if (themeData) setTheme(themeData);

        const { data: catData } = await supabase.from('categories').select('id, name').eq('restaurant_id', resData.id).eq('is_active', true).order('name');
        if (catData) setCategories(catData);

        const { data: itemData } = await supabase.from('menu_items').select('id, name, description, price, image_url, category_id').eq('restaurant_id', resData.id).eq('is_active', true);
        if (itemData) setItems(itemData);
      } catch (err) {
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [restaurantSlug, tableNumber, syncTableData]);

  // Polling Effect
  useEffect(() => {
    if (!table?.id) return;
    const intervalId = setInterval(() => syncTableData(table.id), 4000);
    return () => clearInterval(intervalId);
  }, [table?.id, syncTableData]);

  // Realtime theme updates
  useEffect(() => {
    if (!restaurant?.id) return;
    const channel = supabase
      .channel(`customer-theme-${restaurant.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'restaurant_themes', filter: `restaurant_id=eq.${restaurant.id}` },
        async () => {
          const { data } = await supabase
            .from('restaurant_themes')
            .select('*')
            .eq('restaurant_id', restaurant.id)
            .eq('is_active', true)
            .single();
          if (data) setTheme(data);
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [restaurant?.id]);

  // Detect when any order transitions to DELIVERED and trigger rating
  useEffect(() => {
    const prev = prevOrderStatusesRef.current;
    for (const order of activeOrders) {
      if (order.status === 'DELIVERED' && prev[order.id] && prev[order.id] !== 'DELIVERED') {
        setRatingOrderId(order.id);
        setShowRating(true);
        break;
      }
    }
    const next: Record<string, string> = {};
    for (const order of activeOrders) next[order.id] = order.status;
    prevOrderStatusesRef.current = next;
  }, [activeOrders]);

  // Handlers
  const handleCallWaiter = async () => {
    if (!table || !restaurant || callingWaiter || table.help_requested) return;
    setCallingWaiter(true);
    try {
      const portalUrl = getApiUrl(3005);
      await fetch(`${portalUrl}/api/help-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table_id: table.id, restaurant_id: restaurant.id, table_number: table.number }),
      });
      syncTableData(table.id);
    } finally {
      setCallingWaiter(false);
    }
  };

  // Total de la mesa para sugerir la propina (10%) en el modal.
  const tableTotal = useMemo(
    () => activeOrders.reduce(
      (s: number, o: any) => s + (o.items ?? o.order_items ?? []).reduce(
        (si: number, i: any) => si + Number(i.unit_price ?? i.unitPrice ?? 0) * (i.quantity ?? 0), 0), 0),
    [activeOrders],
  );

  const handleRequestBill = async (tipAmount: number) => {
    if (!table || !restaurant || requestingBill || table.bill_requested) return;
    setRequestingBill(true);
    try {
      const portalUrl = getApiUrl(3005);
      await fetch(`${portalUrl}/api/bill-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table_id: table.id,
          restaurant_id: restaurant.id,
          table_number: table.number,
          tip_included: tipAmount > 0,
          tip_amount: tipAmount,
        }),
      });
      syncTableData(table.id);
    } finally {
      setRequestingBill(false);
      setShowTipModal(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (cart.length === 0 || !table || isPlacing) return;
    setIsPlacing(true);
    try {
      const portalUrl = getApiUrl(3005);
      const res = await fetch(`${portalUrl}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurant_id: restaurant.id,
          table_id: table.id,
          total_amount: cartTotal,
          items: cart.map(i => ({ menu_item_id: i.id, quantity: i.quantity, unit_price: i.price })),
        }),
      });
      if (res.ok) {
        setOrderSuccess(true);
        setCart([]);
        setShowSummary(false);
        syncTableData(table.id);
      }
    } catch (err) {
      Alert.alert('Error', 'No se pudo enviar el pedido');
    } finally {
      setIsPlacing(false);
    }
  };

  const handleSubmitRating = async (rating: number, comment: string) => {
    if (!ratingOrderId || !restaurant || !table) return;
    try {
      const portalUrl = getApiUrl(3005);
      await fetch(`${portalUrl}/api/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: ratingOrderId,
          restaurant_id: restaurant.id,
          table_id: table.id,
          session_id: table.current_session_id,
          rating,
          comment: comment || null,
        }),
      });
    } catch (err) {
      console.error('[Rating] submit error:', err);
    }
  };

  // Cart Logic
  const addToCart = (item: any) => {
    setCart(prev => {
      const exists = prev.find(i => i.id === item.id);
      return exists ? prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i) : [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => {
      const item = prev.find(i => i.id === id);
      return item && item.quantity > 1 ? prev.map(i => i.id === id ? { ...i, quantity: i.quantity - 1 } : i) : prev.filter(i => i.id !== id);
    });
  };

  // Derived State
  const cartTotal = useMemo(() => cart.reduce((s, i) => s + (i.price * i.quantity), 0), [cart]);
  const cartCount = useMemo(() => cart.reduce((s, i) => s + i.quantity, 0), [cart]);
  const filteredItems = useMemo(() => selectedCategory === 'all' ? items : items.filter(i => i.category_id === selectedCategory), [items, selectedCategory]);

  const primaryColor = theme?.primary_color || '#10b981';
  const bgColor = theme?.background_color || '#020617';
  const textColor = theme?.text_color || '#ffffff';
  const accentColor = theme?.accent_color || primaryColor;

  const isLightBg = (() => {
    const hex = bgColor.replace('#', '');
    if (hex.length !== 6) return false;
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5;
  })();

  const getStatusText = (s: string) => {
    const map: any = { PENDING: 'Esperando Garzón', VALIDATED: 'En Cocina', PREPARING: 'Preparando', READY: '¡Listo!', DELIVERED: 'Entregado' };
    return map[s] || s;
  };

  const getStatusColor = (s: string) => {
    const map: any = { PENDING: '#f59e0b', VALIDATED: '#3b82f6', PREPARING: '#8b5cf6', READY: '#10b981', DELIVERED: '#10b981' };
    return map[s] || '#94a3b8';
  };

  if (loading) return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#10b981" />
      <Text style={styles.loadingText}>Preparando menú...</Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <StatusBar barStyle={isLightBg ? 'dark-content' : 'light-content'} />
      <Stack.Screen options={{ headerShown: false }} />

      <MenuHeader 
        restaurant={restaurant} 
        theme={theme} 
        tableNumber={tableNumber || ''} 
        insets={insets}
        onBack={() => router.back()}
        onOpenHistory={() => setShowActiveOrders(true)}
        hasActiveOrders={activeOrders.length > 0}
      />

      <CategoryNav 
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        primaryColor={primaryColor}
        bgColor={bgColor}
        textColor={textColor}
      />

      <ScrollView contentContainerStyle={styles.menuList} showsVerticalScrollIndicator={false}>
        {filteredItems.map((item, index) => (
          <MenuItemCard 
            key={item.id}
            item={item}
            index={index}
            quantity={cart.find(i => i.id === item.id)?.quantity || 0}
            onAdd={addToCart}
            onRemove={removeFromCart}
            textColor={textColor}
            accentColor={accentColor}
            primaryColor={primaryColor}
          />
        ))}
      </ScrollView>

      <CartFooter 
        cartCount={cartCount} 
        cartTotal={cartTotal} 
        primaryColor={primaryColor} 
        onPress={() => setShowSummary(true)} 
      />

      <CheckoutModal 
        visible={showSummary}
        onClose={() => setShowSummary(false)}
        cart={cart}
        cartTotal={cartTotal}
        onPlaceOrder={handlePlaceOrder}
        isPlacing={isPlacing}
        primaryColor={primaryColor}
        bgColor={bgColor}
        textColor={textColor}
      />

      <ActiveOrdersModal 
        visible={showActiveOrders}
        onClose={() => setShowActiveOrders(false)}
        activeOrders={activeOrders}
        table={table}
        onCallWaiter={handleCallWaiter}
        onConfirmBill={() => { setShowActiveOrders(false); setShowTipModal(true); }}
        callingWaiter={callingWaiter}
        requestingBill={requestingBill}
        primaryColor={primaryColor}
        bgColor={bgColor}
        textColor={textColor}
        getStatusText={getStatusText}
        getStatusColor={getStatusColor}
      />

      <SuccessOverlay
        visible={orderSuccess}
        onClose={() => setOrderSuccess(false)}
        primaryColor={primaryColor}
        bgColor={bgColor}
        textColor={textColor}
      />

      <RatingModal
        visible={showRating}
        onClose={() => { setShowRating(false); setRatingOrderId(null); }}
        onSubmit={handleSubmitRating}
        primaryColor={primaryColor}
        bgColor={bgColor}
        textColor={textColor}
      />

      <TipModal
        visible={showTipModal}
        tableTotal={tableTotal}
        submitting={requestingBill}
        primaryColor={primaryColor}
        bgColor={bgColor}
        textColor={textColor}
        onConfirm={handleRequestBill}
        onClose={() => setShowTipModal(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, backgroundColor: '#020617', justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#94a3b8', marginTop: 16, fontWeight: '600' },
  menuList: { padding: 20, paddingBottom: 140 },
});
