import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  TextInput,
  Dimensions,
  Image,
  Alert,
  Modal
} from 'react-native';
import { 
  Search, 
  ChevronLeft, 
  Plus, 
  Minus, 
  ShoppingCart, 
  Send,
  Utensils,
  ChevronRight,
  Trash2,
  X,
  Clock,
  CheckCircle2
} from 'lucide-react-native';
import { MB_COLORS, MB_SPACING, MB_RADIUS } from '../../../constants/MB_Theme';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, { FadeInRight, FadeInUp, SlideInDown, Layout } from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    paddingTop: 60,
    paddingHorizontal: MB_SPACING.lg,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  backBtn: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  headerInfo: { alignItems: 'center' },
  tableLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 2 },
  tableNumber: { fontSize: 24, fontWeight: '900' },
  headerRight: { width: 44, alignItems: 'flex-end' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  statusText: { fontSize: 10, fontWeight: '900' },

  sectionTitle: { fontSize: 11, fontWeight: '900', letterSpacing: 1.5, color: MB_COLORS.sage, marginBottom: 16, paddingHorizontal: MB_SPACING.lg },
  
  // Current Consumption Section
  consumptionSection: { marginBottom: 24 },
  consumptionCard: { marginHorizontal: MB_SPACING.lg, borderRadius: 24, padding: 16, borderWidth: 1 },
  consumptionItem: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  consumptionItemText: { fontSize: 13, fontWeight: '600' },
  consumptionStatus: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  consumptionStatusText: { fontSize: 10, fontWeight: '800' },

  searchSection: { paddingHorizontal: MB_SPACING.lg, marginBottom: 16 },
  searchBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, height: 50, borderRadius: 16 },
  searchInput: { flex: 1, marginLeft: 12, fontSize: 14, fontWeight: '600' },

  categoriesSection: { marginBottom: 20 },
  categoriesScroll: { paddingHorizontal: MB_SPACING.lg, gap: 10 },
  categoryTab: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)' },
  categoryText: { fontSize: 12, fontWeight: '800' },

  content: { flex: 1 },
  itemsGrid: { paddingHorizontal: MB_SPACING.lg, flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingBottom: 120 },
  itemCard: { width: (width - MB_SPACING.lg * 2 - 12) / 2, borderRadius: 24, borderWidth: 1, overflow: 'hidden' },
  itemImageContainer: { height: 120, width: '100%', backgroundColor: 'rgba(255,255,255,0.02)' },
  itemImage: { width: '100%', height: '100%' },
  itemPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  itemBadge: { position: 'absolute', top: 8, right: 8, backgroundColor: '#FE5F55', width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#0A1128' },
  itemBadgeText: { color: 'white', fontSize: 10, fontWeight: '900' },
  itemInfo: { padding: 12 },
  itemName: { fontSize: 13, fontWeight: '800', marginBottom: 4 },
  itemPrice: { fontSize: 14, fontWeight: '900', marginBottom: 12 },
  itemActions: { flexDirection: 'row', justifyContent: 'flex-end' },
  addBtn: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  quantityControls: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn: { width: 30, height: 30, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  qtyText: { fontSize: 14, fontWeight: '900', minWidth: 20, textAlign: 'center' },

  cartContainer: { position: 'absolute', bottom: 0, width: '100%', padding: 20, backgroundColor: 'transparent' },
  cartContent: { borderRadius: 30, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 },
  cartHeader: { flexDirection: 'row', alignItems: 'center' },
  cartIconContainer: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(254, 95, 85, 0.1)', justifyContent: 'center', alignItems: 'center' },
  cartBadge: { position: 'absolute', top: -5, right: -5, width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#1a1a1a' },
  cartBadgeText: { color: 'white', fontSize: 9, fontWeight: '900' },
  cartLabel: { fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  cartTotal: { fontSize: 18, fontWeight: '900' },
  sendBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, height: 44, borderRadius: 14 },
  sendBtnText: { color: 'white', fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  reviewBtn: { flex: 1, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
  reviewBtnText: { color: 'white', fontSize: 10, fontWeight: '900', letterSpacing: 1 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#0A1128', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, maxHeight: height * 0.8 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '900', color: 'white' },
  cartItemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  cartItemInfo: { flex: 1 },
  cartItemName: { color: 'white', fontSize: 14, fontWeight: '700' },
  cartItemPrice: { color: MB_COLORS.sage, fontSize: 12, fontWeight: '600' },
});

export default function TableOrderScreen() {
  const { id } = useLocalSearchParams();
  const { restaurantId } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();

  const [loading, setLoading] = React.useState(true);
  const [table, setTable] = React.useState<any>(null);
  const [categories, setCategories] = React.useState<any[]>([]);
  const [menuItems, setMenuItems] = React.useState<any[]>([]);
  const [activeOrders, setActiveOrders] = React.useState<any[]>([]);
  const [activeCategory, setActiveCategory] = React.useState<string | null | undefined>(undefined);
  const [searchQuery, setSearchQuery] = React.useState('');
  
  // Cart State
  const [cart, setCart] = React.useState<any[]>([]);
  const [isPlacing, setIsPlacing] = React.useState(false);
  const [showReview, setShowReview] = React.useState(false);

  const fetchData = React.useCallback(async () => {
    if (!restaurantId || !id) return;
    
    try {
      // Fetch Table Info
      const { data: tableData } = await supabase.from('tables').select('*').eq('id', id).single();
      setTable(tableData);

      // Fetch Categories
      const { data: catData } = await supabase
        .from('categories')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .eq('is_active', true)
        .order('name');
      
      setCategories(catData || []);
      
      // Only auto-select first category if activeCategory is undefined (first load)
      // and NOT when it is null (explicitly "All")
      if (catData?.length && activeCategory === undefined) {
        setActiveCategory(catData[0].id);
      }
      
      // If the currently selected category no longer exists, reset to "All" (null)
      if (activeCategory && catData?.length && !catData.find(c => c.id === activeCategory)) {
        setActiveCategory(null);
      }

      // Fetch Menu Items
      const { data: itemsData } = await supabase
        .from('menu_items')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .eq('is_active', true)
        .order('name');
      
      setMenuItems(itemsData || []);

      // Fetch Active Orders for this table
      const { data: ordersData } = await supabase
        .from('orders')
        .select('*, order_items(*, menu_items(name))')
        .eq('table_id', id)
        .in('status', ['PENDING', 'VALIDATED', 'PREPARING', 'READY'])
        .order('createdAt', { ascending: false });
      
      setActiveOrders(ordersData || []);

    } catch (err) {
      console.error('Error fetching table data:', err);
    } finally {
      setLoading(false);
    }
  }, [restaurantId, id]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredItems = menuItems.filter(item => {
    const matchesCategory = activeCategory ? item.category_id === activeCategory : true;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const addToCart = (item: any) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
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

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleSendOrder = async () => {
    if (cart.length === 0 || isPlacing) return;
    
    setIsPlacing(true);
    try {
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          restaurant_id: restaurantId,
          table_id: id,
          status: 'VALIDATED',
          total_amount: cartTotal,
          validated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItems = cart.map(item => ({
        order_id: order.id,
        menu_item_id: item.id,
        quantity: item.quantity,
        unit_price: item.price,
        restaurant_id: restaurantId
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
      if (itemsError) throw itemsError;

      await supabase.from('tables').update({ status: 'OCCUPIED' }).eq('id', id);

      Alert.alert('Éxito', 'Comanda enviada a cocina');
      setCart([]);
      setShowReview(false);
      fetchData(); // Refresh to show the new order in consumption

    } catch (err) {
      console.error('Error sending order:', err);
      Alert.alert('Error', 'No se pudo enviar el pedido');
    } finally {
      setIsPlacing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return <Clock size={12} color="#FF9800" />;
      case 'READY': return <CheckCircle2 size={12} color="#4CAF50" />;
      default: return <Clock size={12} color={MB_COLORS.sage} />;
    }
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.navy }]}>
        <ActivityIndicator color={colors.brandAccent} size="large" />
        <Text style={{ color: colors.muted, marginTop: 10, fontSize: 10 }}>Cargando mesa...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.navy }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.glass }]}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={[styles.tableLabel, { color: colors.muted }]}>MESA</Text>
          <Text style={[styles.tableNumber, { color: colors.text }]}>{table?.number}</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={[styles.statusBadge, { backgroundColor: table?.status === 'FREE' ? '#4CAF5020' : colors.brandAccent + '20' }]}>
            <Text style={[styles.statusText, { color: table?.status === 'FREE' ? '#4CAF50' : colors.brandAccent }]}>
              {table?.status === 'FREE' ? 'LIBRE' : 'OCUPADA'}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Active Consumption Section */}
        {activeOrders.length > 0 && (
          <View style={styles.consumptionSection}>
            <Text style={styles.sectionTitle}>CONSUMO ACTUAL</Text>
            <View style={[styles.consumptionCard, { backgroundColor: colors.glass, borderColor: colors.glassHeavy }]}>
              {activeOrders.map(order => (
                <View key={order.id} style={{ marginBottom: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)', paddingBottom: 8 }}>
                  {order.order_items.map((item: any) => (
                    <View key={item.id} style={styles.consumptionItem}>
                      <Text style={[styles.consumptionItemText, { color: colors.text }]}>
                        {item.quantity}x {item.menu_items?.name}
                      </Text>
                      <View style={styles.consumptionStatus}>
                        {getStatusIcon(order.status)}
                        <Text style={[styles.consumptionStatusText, { color: colors.muted }]}>{order.status}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              ))}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                <Text style={{ color: colors.muted, fontSize: 10, fontWeight: '800' }}>TOTAL ACUMULADO</Text>
                <Text style={{ color: colors.brandAccent, fontSize: 14, fontWeight: '900' }}>
                  ${activeOrders.reduce((acc, o) => acc + Number(o.total_amount), 0).toLocaleString()}
                </Text>
              </View>
            </View>
          </View>
        )}

        <Text style={styles.sectionTitle}>AÑADIR AL PEDIDO</Text>
        
        {/* Search Bar */}
        <View style={styles.searchSection}>
          <View style={[styles.searchBar, { backgroundColor: colors.glass }]}>
            <Search size={18} color={colors.muted} />
            <TextInput 
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Buscar plato o bebida..."
              placeholderTextColor={colors.muted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* Categories */}
        <View style={styles.categoriesSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesScroll}>
            <TouchableOpacity 
              style={[styles.categoryTab, !activeCategory && { backgroundColor: colors.brandAccent }]}
              onPress={() => setActiveCategory(null)}
            >
              <Text style={[styles.categoryText, { color: !activeCategory ? 'white' : colors.muted }]}>Todos</Text>
            </TouchableOpacity>
            {categories.map(cat => (
              <TouchableOpacity 
                key={cat.id} 
                style={[styles.categoryTab, activeCategory === cat.id && { backgroundColor: colors.brandAccent }]}
                onPress={() => setActiveCategory(cat.id)}
              >
                <Text style={[styles.categoryText, { color: activeCategory === cat.id ? 'white' : colors.muted }]}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Menu Items Grid */}
        <View style={styles.itemsGrid}>
          {filteredItems.map((item, i) => {
            const cartItem = cart.find(c => c.id === item.id);
            return (
              <Animated.View key={item.id} entering={FadeInUp.delay(i * 30)} style={[styles.itemCard, { backgroundColor: colors.glass, borderColor: colors.glassHeavy }]}>
                <View style={styles.itemImageContainer}>
                  {item.image_url ? (
                    <Image source={{ uri: item.image_url }} style={styles.itemImage} />
                  ) : (
                    <View style={styles.itemPlaceholder}>
                      <Utensils size={24} color={colors.muted} />
                    </View>
                  )}
                  {cartItem && (
                    <View style={styles.itemBadge}>
                      <Text style={styles.itemBadgeText}>{cartItem.quantity}</Text>
                    </View>
                  )}
                </View>
                <View style={styles.itemInfo}>
                  <Text style={[styles.itemName, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
                  <Text style={[styles.itemPrice, { color: colors.brandAccent }]}>${item.price.toLocaleString()}</Text>
                  
                  <View style={styles.itemActions}>
                    {cartItem ? (
                      <View style={styles.quantityControls}>
                        <TouchableOpacity onPress={() => removeFromCart(item.id)} style={[styles.qtyBtn, { backgroundColor: colors.glassHeavy }]}>
                          <Minus size={14} color={colors.text} />
                        </TouchableOpacity>
                        <Text style={[styles.qtyText, { color: colors.text }]}>{cartItem.quantity}</Text>
                        <TouchableOpacity onPress={() => addToCart(item)} style={[styles.qtyBtn, { backgroundColor: colors.brandAccent }]}>
                          <Plus size={14} color="white" />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity onPress={() => addToCart(item)} style={[styles.addBtn, { backgroundColor: colors.brandAccent }]}>
                        <Plus size={18} color="white" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </Animated.View>
            );
          })}
          {filteredItems.length === 0 && (
            <View style={[styles.centered, { width: '100%', paddingVertical: 40, opacity: 0.5 }]}>
              <Utensils size={48} color={colors.muted} />
              <Text style={{ color: colors.muted, marginTop: 12, fontWeight: '800' }}>NO HAY PRODUCTOS</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Floating Cart */}
      {cart.length > 0 && (
        <Animated.View entering={SlideInDown} style={[styles.cartContainer, { borderTopColor: colors.glassHeavy }]}>
          <View style={[styles.cartContent, { backgroundColor: colors.glassHeavy }]}>
            <View style={styles.cartHeader}>
              <View style={styles.cartIconContainer}>
                <ShoppingCart size={20} color={colors.brandAccent} />
                <View style={[styles.cartBadge, { backgroundColor: colors.brandAccent }]}>
                  <Text style={styles.cartBadgeText}>{cartCount}</Text>
                </View>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.cartLabel, { color: colors.muted }]}>TOTAL ESTIMADO</Text>
                <Text style={[styles.cartTotal, { color: colors.text }]}>${cartTotal.toLocaleString()}</Text>
              </View>
              <TouchableOpacity onPress={() => setCart([])} style={{ padding: 10 }}>
                <Trash2 size={20} color={colors.muted} />
              </TouchableOpacity>
            </View>
            
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
              <TouchableOpacity onPress={() => setShowReview(true)} style={styles.reviewBtn}>
                <Text style={styles.reviewBtnText}>REVISAR ({cart.length})</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.sendBtn, { backgroundColor: colors.brandAccent, flex: 2 }]}
                onPress={handleSendOrder}
                disabled={isPlacing}
              >
                {isPlacing ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <>
                    <Text style={styles.sendBtnText}>ENVIAR A COCINA</Text>
                    <Send size={16} color="white" />
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      )}

      {/* Review Modal */}
      <Modal visible={showReview} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Revisar Bandeja</Text>
              <TouchableOpacity onPress={() => setShowReview(false)}>
                <X size={24} color="white" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ marginBottom: 20 }}>
              {cart.map(item => (
                <View key={item.id} style={styles.cartItemRow}>
                  <View style={styles.cartItemInfo}>
                    <Text style={styles.cartItemName}>{item.name}</Text>
                    <Text style={styles.cartItemPrice}>{item.quantity}x ${item.price.toLocaleString()}</Text>
                  </View>
                  <View style={styles.quantityControls}>
                    <TouchableOpacity onPress={() => removeFromCart(item.id)} style={[styles.qtyBtn, { backgroundColor: 'rgba(255,255,255,0.05)' }]}>
                      <Minus size={14} color="white" />
                    </TouchableOpacity>
                    <Text style={[styles.qtyText, { color: 'white' }]}>{item.quantity}</Text>
                    <TouchableOpacity onPress={() => addToCart(item)} style={[styles.qtyBtn, { backgroundColor: colors.brandAccent }]}>
                      <Plus size={14} color="white" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>
            <View style={{ borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', paddingTop: 20 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
                <Text style={{ color: colors.muted, fontWeight: '700' }}>TOTAL</Text>
                <Text style={{ color: 'white', fontSize: 20, fontWeight: '900' }}>${cartTotal.toLocaleString()}</Text>
              </View>
              <TouchableOpacity 
                style={[styles.sendBtn, { backgroundColor: colors.brandAccent, width: '100%' }]}
                onPress={handleSendOrder}
                disabled={isPlacing}
              >
                <Text style={styles.sendBtnText}>CONFIRMAR Y ENVIAR</Text>
                <Send size={16} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
