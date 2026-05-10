import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  ActivityIndicator, 
  Dimensions, 
  StatusBar, 
  Alert, 
  Modal 
} from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { ShoppingBag, ChevronLeft, Star, Clock, Utensils, Minus, Plus, CheckCircle2, Receipt, Timer, History } from 'lucide-react-native';
import Animated, { FadeInDown, SlideInUp, FadeIn, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { getApiUrl } from '../../../lib/api';

const { width, height } = Dimensions.get('window');

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
  
  const [restaurant, setRestaurant] = useState<any>(null);
  const [theme, setTheme] = useState<any>(null);
  const [table, setTable] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>('all');
  
  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showSummary, setShowSummary] = useState(false);
  const [isPlacing, setIsPlacing] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  // Active Orders State
  const [activeOrders, setActiveOrders] = useState<any[]>([]);
  const [showActiveOrders, setShowActiveOrders] = useState(false);
  
  // Ref for polling with safe typing
  const pollingInterval = useRef<any>(null);

  // Fetch orders through the SECURE BRIDGE (Server-side)
  const fetchActiveOrders = useCallback(async (tableId: string) => {
    if (!tableId) return;
    try {
      const portalUrl = getApiUrl(3005);
      const response = await fetch(`${portalUrl}/api/orders?table_id=${tableId}`);
      
      if (!response.ok) throw new Error('Bridge fetch failed');

      const data = await response.json();
      
      if (Array.isArray(data)) {
        setActiveOrders(prev => {
          if (JSON.stringify(prev) === JSON.stringify(data)) return prev;
          return data;
        });
      }
    } catch (err: any) {
      console.error('[Orders Bridge] Error:', err.message);
    }
  }, []);

  useEffect(() => {
    async function fetchData() {
      if (!restaurantSlug) return;

      try {
        // 1. Get Restaurant
        const { data: resData, error: resError } = await supabase
          .from('restaurants')
          .select('id, name, slug')
          .eq('slug', restaurantSlug)
          .eq('status', 'ACTIVE')
          .single();

        if (resError || !resData) {
          Alert.alert('Error', 'Restaurante no encontrado');
          router.replace('/(tabs)');
          return;
        }
        setRestaurant(resData);

        // 2. Get Table ID by Number
        const { data: tableData } = await supabase
          .from('tables')
          .select('id, number')
          .eq('restaurant_id', resData.id)
          .eq('number', tableNumber)
          .single();
        
        if (tableData) {
          setTable(tableData);
          fetchActiveOrders(tableData.id);
        }

        // 3. Get Theme
        const { data: themeData } = await supabase
          .from('restaurant_themes')
          .select('*')
          .eq('restaurant_id', resData.id)
          .eq('is_active', true)
          .single();
        
        if (themeData) setTheme(themeData);

        // 4. Get Categories
        const { data: catData } = await supabase
          .from('categories')
          .select('id, name')
          .eq('restaurant_id', resData.id)
          .eq('is_active', true)
          .order('name');
        
        if (catData) setCategories(catData);

        // 5. Get Items
        const { data: itemData } = await supabase
          .from('menu_items')
          .select('id, name, description, price, image_url, category_id')
          .eq('restaurant_id', resData.id)
          .eq('is_active', true);
        
        if (itemData) setItems(itemData);
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [restaurantSlug, tableNumber, fetchActiveOrders]);

  // Setup Polling
  useEffect(() => {
    if (!table?.id) return;

    fetchActiveOrders(table.id);

    const intervalId = setInterval(() => {
      fetchActiveOrders(table.id);
    }, 5000);

    pollingInterval.current = intervalId;

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [table?.id, fetchActiveOrders]);

  // Cart Helpers
  const addToCart = (item: any) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { id: item.id, name: item.name, price: item.price, quantity: 1, image_url: item.image_url }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === itemId);
      if (existing && existing.quantity > 1) {
        return prev.map(i => i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i);
      }
      return prev.filter(i => i.id !== itemId);
    });
  };

  const getItemQuantity = (itemId: string) => {
    return cart.find(i => i.id === itemId)?.quantity || 0;
  };

  const cartTotal = useMemo(() => cart.reduce((sum, item) => sum + (item.price * item.quantity), 0), [cart]);
  const cartCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);

  const handlePlaceOrder = async () => {
    if (cart.length === 0 || !table || isPlacing) return;
    
    setIsPlacing(true);
    try {
      const portalUrl = getApiUrl(3005);
      const response = await fetch(`${portalUrl}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurant_id: restaurant.id,
          table_id: table.id,
          total_amount: cartTotal,
          items: cart.map(item => ({
            menu_item_id: item.id,
            quantity: item.quantity,
            unit_price: item.price,
          })),
        }),
      });

      if (!response.ok) {
        const errorData: any = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Error en el servidor');
      }

      setOrderSuccess(true);
      setCart([]);
      setShowSummary(false);
      fetchActiveOrders(table.id);
    } catch (err: any) {
      Alert.alert('Error', 'No pudimos procesar tu pedido: ' + err.message);
    } finally {
      setIsPlacing(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10b981" />
        <Text style={styles.loadingText}>Preparando el menú...</Text>
      </View>
    );
  }

  const primaryColor = theme?.primary_color || '#10b981';
  const bgColor = theme?.background_color || '#020617';
  const textColor = theme?.text_color || 'white';
  const accentColor = theme?.accent_color || primaryColor;

  const filteredItems = selectedCategory === 'all' || !selectedCategory
    ? items
    : items.filter(i => i.category_id === selectedCategory);

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING': return 'Esperando Garzón';
      case 'VALIDATED': return 'Enviado a Cocina';
      case 'PREPARING': return 'En Preparación';
      case 'READY': return '¡Listo para servir!';
      case 'DELIVERED': return 'Entregado';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return '#f59e0b';
      case 'VALIDATED': return '#3b82f6';
      case 'PREPARING': return '#8b5cf6';
      case 'READY': return '#10b981';
      case 'DELIVERED': return '#10b981';
      default: return '#94a3b8';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <StatusBar barStyle="light-content" />
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: primaryColor }]}>
        {theme?.logo_url && <Image source={{ uri: theme.logo_url }} style={styles.headerBgImage} blurRadius={10} />}
        <View style={styles.headerOverlay} />
        <View style={[styles.navBar, { paddingTop: insets.top + 10 }]}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <ChevronLeft color="white" size={24} />
          </TouchableOpacity>

          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={[styles.headerActionBtn, { backgroundColor: 'rgba(0,0,0,0.3)' }]}
              onPress={() => setShowActiveOrders(true)}
            >
              <History color="white" size={20} />
              {(activeOrders || []).length > 0 && <View style={styles.activeOrdersDot} />}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.headerContent}>
          {theme?.logo_url ? (
            <Image source={{ uri: theme.logo_url }} style={styles.restaurantLogo} />
          ) : (
            <View style={[styles.restaurantLogo, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
              <Utensils color="white" size={32} />
            </View>
          )}
          <View style={styles.headerInfo}>
            <Text style={[styles.restaurantName, { color: textColor }]}>{restaurant?.name}</Text>
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Star size={14} color="#fbbf24" fill="#fbbf24" />
                <Text style={styles.metaText}>Mesa {tableNumber}</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Categories */}
      <View style={[styles.categoryContainer, { backgroundColor: bgColor }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
          <TouchableOpacity 
            style={[styles.categoryChip, selectedCategory === 'all' ? { backgroundColor: primaryColor, borderColor: primaryColor } : styles.categoryChipInactive]}
            onPress={() => setSelectedCategory('all')}
          >
            <Text style={[styles.categoryText, selectedCategory === 'all' ? styles.categoryTextActive : { color: textColor + '80' }]}>Todos</Text>
          </TouchableOpacity>
          {categories.map((cat) => (
            <TouchableOpacity 
              key={cat.id} 
              style={[styles.categoryChip, selectedCategory === cat.id ? { backgroundColor: primaryColor, borderColor: primaryColor } : styles.categoryChipInactive]}
              onPress={() => setSelectedCategory(cat.id)}
            >
              <Text style={[styles.categoryText, selectedCategory === cat.id ? styles.categoryTextActive : { color: textColor + '80' }]}>{cat.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Menu List */}
      <ScrollView contentContainerStyle={styles.menuList} showsVerticalScrollIndicator={false}>
        {filteredItems.map((item, index) => {
          const qty = getItemQuantity(item.id);
          return (
            <Animated.View key={item.id} entering={FadeInDown.delay(index * 50)} style={styles.itemCard}>
              <View style={styles.itemInfo}>
                <Text style={[styles.itemName, { color: textColor }]}>{item.name}</Text>
                <Text style={styles.itemDesc} numberOfLines={2}>{item.description}</Text>
                <Text style={[styles.itemPrice, { color: accentColor }]}>${item.price.toLocaleString()}</Text>
              </View>
              <View style={styles.itemImageContainer}>
                {item.image_url ? (
                  <Image source={{ uri: item.image_url }} style={styles.itemImage} />
                ) : (
                  <View style={styles.itemImagePlaceholder}><Utensils size={24} color="rgba(255,255,255,0.1)" /></View>
                )}
                {qty > 0 ? (
                  <View style={[styles.qtyControl, { backgroundColor: primaryColor }]}>
                    <TouchableOpacity onPress={() => removeFromCart(item.id)}><Minus size={18} color="white" /></TouchableOpacity>
                    <Text style={styles.qtyText}>{qty}</Text>
                    <TouchableOpacity onPress={() => addToCart(item)}><Plus size={18} color="white" /></TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity style={[styles.addBtn, { backgroundColor: primaryColor }]} onPress={() => addToCart(item)}>
                    <Plus size={22} color="white" />
                  </TouchableOpacity>
                )}
              </View>
            </Animated.View>
          );
        })}
      </ScrollView>

      {/* Footer / Cart Button */}
      {cart.length > 0 && (
        <Animated.View entering={SlideInUp} style={styles.footer}>
          <TouchableOpacity style={[styles.cartBtn, { backgroundColor: primaryColor }]} activeOpacity={0.9} onPress={() => setShowSummary(true)}>
            <View style={styles.cartBadge}><Text style={styles.cartBadgeText}>{cartCount}</Text></View>
            <Text style={styles.cartBtnText}>Enviar al Garzón · ${cartTotal.toLocaleString()}</Text>
            <ShoppingBag size={20} color="white" />
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Order Summary Modal */}
      <Modal visible={showSummary} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: bgColor }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: textColor }]}>Tu Pedido</Text>
              <TouchableOpacity onPress={() => setShowSummary(false)} style={styles.modalClose}>
                <Plus color={textColor} size={28} style={{ transform: [{ rotate: '45deg' }] }} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.summaryList} showsVerticalScrollIndicator={false}>
              {cart.map(item => (
                <View key={item.id} style={[styles.summaryItem, { borderBottomColor: textColor + '10' }]}>
                  <View style={styles.summaryItemInfo}>
                    <Text style={[styles.summaryItemName, { color: textColor }]}>{item.name}</Text>
                    <Text style={[styles.summaryItemPrice, { color: textColor + '60' }]}>${item.price.toLocaleString()} x {item.quantity}</Text>
                  </View>
                  <Text style={[styles.summaryItemTotal, { color: textColor }]}>${(item.price * item.quantity).toLocaleString()}</Text>
                </View>
              ))}
            </ScrollView>
            <View style={[styles.modalFooter, { borderTopColor: textColor + '10' }]}>
              <View style={styles.totalRow}>
                <Text style={[styles.totalLabel, { color: textColor + '60' }]}>Total a pagar</Text>
                <Text style={[styles.totalValue, { color: primaryColor }]}>${cartTotal.toLocaleString()}</Text>
              </View>
              <TouchableOpacity style={[styles.confirmBtn, { backgroundColor: primaryColor }, isPlacing && { opacity: 0.7 }]} onPress={handlePlaceOrder} disabled={isPlacing}>
                {isPlacing ? <ActivityIndicator color="white" /> : <Text style={styles.confirmBtnText}>Solicitar Pedido</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Active Orders Modal */}
      <Modal visible={showActiveOrders} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: bgColor }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: textColor }]}>Mi Mesa</Text>
                <Text style={{ color: textColor + '60', fontSize: 14 }}>Historial de pedidos activos</Text>
              </View>
              <TouchableOpacity onPress={() => setShowActiveOrders(false)} style={styles.modalClose}>
                <Plus color={textColor} size={28} style={{ transform: [{ rotate: '45deg' }] }} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.summaryList} showsVerticalScrollIndicator={false}>
              {(activeOrders || []).length === 0 ? (
                <View style={styles.emptyAccount}>
                  <Receipt size={48} color={textColor + '20'} />
                  <Text style={{ color: textColor + '40', marginTop: 16, textAlign: 'center' }}>Aún no has realizado pedidos</Text>
                </View>
              ) : (
                activeOrders.map(order => (
                  <View key={order.id} style={[styles.activeOrderCard, { borderColor: textColor + '10' }]}>
                    <View style={styles.orderCardHeader}>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) + '20' }]}>
                        <Timer size={12} color={getStatusColor(order.status)} />
                        <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>{getStatusText(order.status)}</Text>
                      </View>
                      <Text style={{ color: textColor + '40', fontSize: 12 }}>#{order.id?.slice(0, 8)}</Text>
                    </View>
                    
                    {(order.items || order.order_items || []).map((item: any, idx: number) => (
                      <View key={idx} style={styles.orderCardItem}>
                        <Text style={{ color: textColor, fontWeight: '600' }}>{item.quantity}x {item.menu_item?.name || item.menu_items?.name || 'Producto'}</Text>
                        <Text style={{ color: textColor + '60' }}>${((item.unit_price || 0) * (item.quantity || 1)).toLocaleString()}</Text>
                      </View>
                    ))}
                    
                    <View style={[styles.orderCardFooter, { borderTopColor: textColor + '05' }]}>
                      <Text style={{ color: textColor + '60' }}>Total del pedido</Text>
                      <Text style={{ color: textColor, fontWeight: '900' }}>${(order.total_amount || 0).toLocaleString()}</Text>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>

            {(activeOrders || []).length > 0 && (
              <View style={[styles.modalFooter, { borderTopColor: textColor + '10' }]}>
                <View style={styles.totalRow}>
                  <Text style={[styles.totalLabel, { color: textColor + '60' }]}>Total Acumulado</Text>
                  <Text style={[styles.totalValue, { color: primaryColor }]}>
                    ${activeOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0).toLocaleString()}
                  </Text>
                </View>
                <TouchableOpacity style={[styles.confirmBtn, { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: textColor + '10' }]} onPress={() => setShowActiveOrders(false)}>
                  <Text style={[styles.confirmBtnText, { color: textColor }]}>Cerrar</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Success Modal */}
      <Modal visible={orderSuccess} transparent animationType="fade">
        <View style={styles.successOverlay}>
          <Animated.View entering={ZoomIn} style={[styles.successCard, { backgroundColor: bgColor, borderColor: primaryColor + '30' }]}>
            <View style={[styles.successIconBg, { backgroundColor: primaryColor + '10' }]}>
              <CheckCircle2 size={72} color={primaryColor} />
            </View>
            <Text style={[styles.successTitle, { color: textColor }]}>¡Solicitud Enviada!</Text>
            <Text style={[styles.successDesc, { color: textColor + '70' }]}>Tu pedido ha sido enviado al garzón. En breve será validado para marchar a cocina.</Text>
            <TouchableOpacity style={[styles.successBtn, { backgroundColor: primaryColor }]} onPress={() => setOrderSuccess(false)}>
              <Text style={styles.successBtnText}>Entendido</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, backgroundColor: '#020617', justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#94a3b8', marginTop: 16, fontWeight: '600' },
  header: { height: 260, justifyContent: 'flex-end', overflow: 'hidden' },
  headerBgImage: { ...StyleSheet.absoluteFillObject, opacity: 0.5 },
  headerOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  navBar: { position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: 20, zIndex: 100, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  headerActions: { flexDirection: 'row', gap: 10 },
  headerActionBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  activeOrdersDot: { position: 'absolute', top: 12, right: 12, width: 8, height: 8, borderRadius: 4, backgroundColor: '#10b981', borderWidth: 2, borderColor: '#020617' },
  headerContent: { padding: 24, flexDirection: 'row', alignItems: 'center', gap: 16 },
  restaurantLogo: { width: 70, height: 70, borderRadius: 20, borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  headerInfo: { flex: 1 },
  restaurantName: { fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { color: '#cbd5e1', fontSize: 13, fontWeight: '700' },
  categoryContainer: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  categoryScroll: { paddingHorizontal: 20, gap: 8 },
  categoryChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 18, borderWidth: 1 },
  categoryChipInactive: { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.05)' },
  categoryText: { fontWeight: '800', fontSize: 13 },
  categoryTextActive: { color: 'white' },
  menuList: { padding: 20, paddingBottom: 140 },
  itemCard: { flexDirection: 'row', backgroundColor: 'rgba(255, 255, 255, 0.03)', borderRadius: 22, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', marginBottom: 16 },
  itemInfo: { flex: 1, paddingRight: 12 },
  itemName: { fontSize: 16, fontWeight: '800', marginBottom: 4 },
  itemDesc: { color: '#94a3b8', fontSize: 12, lineHeight: 16, marginBottom: 8 },
  itemPrice: { fontSize: 15, fontWeight: '900' },
  itemImageContainer: { alignItems: 'center', justifyContent: 'center' },
  itemImage: { width: 90, height: 90, borderRadius: 16 },
  itemImagePlaceholder: { width: 90, height: 90, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.03)', justifyContent: 'center', alignItems: 'center' },
  addBtn: { position: 'absolute', bottom: -8, right: -8, width: 40, height: 40, borderRadius: 14, justifyContent: 'center', alignItems: 'center', elevation: 4 },
  qtyControl: { position: 'absolute', bottom: -8, right: -8, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14, elevation: 6 },
  qtyText: { color: 'white', fontWeight: '900', fontSize: 16 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, paddingBottom: 34 },
  cartBtn: { height: 64, borderRadius: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, elevation: 10 },
  cartBtnText: { color: 'white', fontSize: 16, fontWeight: '900' },
  cartBadge: { backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 10, paddingVertical: 2, borderRadius: 10 },
  cartBadgeText: { color: 'white', fontSize: 12, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 36, borderTopRightRadius: 36, height: height * 0.75, padding: 24, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 28, fontWeight: '900', letterSpacing: -1 },
  modalClose: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
  summaryList: { flex: 1 },
  summaryItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 18, borderBottomWidth: 1 },
  summaryItemInfo: { flex: 1 },
  summaryItemName: { fontSize: 17, fontWeight: '700' },
  summaryItemPrice: { fontSize: 14, marginTop: 4 },
  summaryItemTotal: { fontSize: 17, fontWeight: '900' },
  modalFooter: { paddingTop: 24, borderTopWidth: 1 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  totalLabel: { fontSize: 16, fontWeight: '600' },
  totalValue: { fontSize: 32, fontWeight: '900' },
  confirmBtn: { height: 64, borderRadius: 22, justifyContent: 'center', alignItems: 'center', elevation: 4 },
  confirmBtnText: { color: 'white', fontSize: 18, fontWeight: '900' },
  successOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center', padding: 32 },
  successCard: { padding: 40, borderRadius: 40, alignItems: 'center', borderWidth: 1, width: '100%' },
  successIconBg: { width: 120, height: 120, borderRadius: 60, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  successTitle: { fontSize: 32, fontWeight: '900', textAlign: 'center', letterSpacing: -1 },
  successDesc: { textAlign: 'center', fontSize: 17, marginTop: 16, lineHeight: 24, fontWeight: '500' },
  successBtn: { marginTop: 40, paddingHorizontal: 48, paddingVertical: 18, borderRadius: 24, width: '100%', alignItems: 'center' },
  successBtnText: { color: 'white', fontWeight: '900', fontSize: 18 },
  emptyAccount: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 40 },
  activeOrderCard: { backgroundColor: 'rgba(255, 255, 255, 0.03)', borderRadius: 24, padding: 20, marginBottom: 16, borderWidth: 1 },
  orderCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: '900', letterSpacing: 0.5 },
  orderCardItem: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  orderCardFooter: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
