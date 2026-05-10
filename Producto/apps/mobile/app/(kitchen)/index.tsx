import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  Dimensions,
  Alert,
  RefreshControl
} from 'react-native';
import { 
  ChefHat, 
  Bell, 
  Clock, 
  CheckCircle2, 
  Play, 
  Utensils, 
  LogOut,
  ChevronRight,
  Flame,
  LayoutDashboard
} from 'lucide-react-native';
import { MB_COLORS, MB_SPACING, MB_RADIUS } from '../../constants/MB_Theme';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInUp, Layout, FadeInLeft } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 12, fontWeight: '900', letterSpacing: 2 },
  header: {
    paddingTop: 60,
    paddingHorizontal: MB_SPACING.lg,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(10, 17, 40, 0.95)'
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: MB_COLORS.brandAccent, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '900', color: 'white' },
  headerSub: { fontSize: 9, fontWeight: '800', letterSpacing: 2, opacity: 0.5 },
  logoutBtn: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },

  statsBar: { flexDirection: 'row', paddingHorizontal: MB_SPACING.lg, gap: 10, marginBottom: 20 },
  statCard: { flex: 1, padding: 12, borderRadius: 20, borderWidth: 1, alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '900' },
  statLabel: { fontSize: 8, fontWeight: '800', letterSpacing: 1, marginTop: 2 },

  tabs: { flexDirection: 'row', paddingHorizontal: MB_SPACING.lg, gap: 8, marginBottom: 20 },
  tab: { flex: 1, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'transparent' },
  activeTab: { backgroundColor: MB_COLORS.brandAccent + '20', borderColor: MB_COLORS.brandAccent + '40' },
  tabText: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },

  ticketList: { paddingHorizontal: MB_SPACING.lg, paddingBottom: 40 },
  ticketCard: { marginBottom: 16, borderRadius: 24, borderWidth: 1, overflow: 'hidden' },
  ticketHeader: { padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1 },
  tableBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tableText: { fontSize: 16, fontWeight: '900' },
  timer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  timerText: { fontSize: 11, fontWeight: '700' },

  ticketBody: { padding: 16 },
  ticketItem: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  itemQty: { width: 24, height: 24, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
  itemQtyText: { fontSize: 12, fontWeight: '900' },
  itemName: { flex: 1, marginLeft: 12, fontSize: 14, fontWeight: '600' },

  ticketFooter: { padding: 12, backgroundColor: 'rgba(255,255,255,0.02)', flexDirection: 'row', gap: 10 },
  actionBtn: { flex: 1, height: 48, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  actionText: { color: 'white', fontSize: 12, fontWeight: '900', letterSpacing: 1 },

  emptyState: { alignItems: 'center', paddingVertical: 80, opacity: 0.3 },
  emptyText: { marginTop: 12, fontSize: 12, fontWeight: '900', letterSpacing: 2 }
});

export default function KitchenDashboard() {
  const { restaurantId, signOut } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();

  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<'PENDING' | 'PREPARING' | 'READY'>('PENDING');
  const [orders, setOrders] = React.useState<any[]>([]);

  const fetchData = React.useCallback(async () => {
    if (!restaurantId) return;
    
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          table:tables(number),
          order_items(
            *,
            menu_item:menu_items(name)
          )
        `)
        .eq('restaurant_id', restaurantId)
        .in('status', ['VALIDATED', 'PREPARING', 'READY'])
        .order('createdAt', { ascending: true });

      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error('Error fetching kitchen orders:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [restaurantId]);

  React.useEffect(() => {
    fetchData();

    // Real-time subscription
    const channel = supabase
      .channel('kitchen-orders')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'orders',
        filter: `restaurant_id=eq.${restaurantId}`
      }, () => fetchData())
      .subscribe();

    return () => { channel.unsubscribe(); };
  }, [fetchData, restaurantId]);

  const handleUpdateStatus = async (orderId: string, currentStatus: string) => {
    let nextStatus = '';
    if (currentStatus === 'VALIDATED') nextStatus = 'PREPARING';
    else if (currentStatus === 'PREPARING') nextStatus = 'READY';
    else if (currentStatus === 'READY') nextStatus = 'DELIVERED';

    if (!nextStatus) return;

    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: nextStatus })
        .eq('id', orderId);
      
      if (error) throw error;
      fetchData();
    } catch (err) {
      Alert.alert('Error', 'No se pudo actualizar el estado');
    }
  };

  const getFilteredOrders = () => {
    if (activeTab === 'PENDING') return orders.filter(o => o.status === 'VALIDATED');
    return orders.filter(o => o.status === activeTab);
  };

  const getTimeElapsed = (createdAt: string) => {
    const start = new Date(createdAt).getTime();
    const now = new Date().getTime();
    const diff = Math.floor((now - start) / 60000);
    return diff > 60 ? `${Math.floor(diff/60)}h ${diff%60}m` : `${diff}m`;
  };

  const stats = {
    pending: orders.filter(o => o.status === 'VALIDATED').length,
    preparing: orders.filter(o => o.status === 'PREPARING').length,
    ready: orders.filter(o => o.status === 'READY').length,
  };

  if (loading || !colors) {
    return (
      <View style={[styles.centered, { backgroundColor: colors?.navy || MB_COLORS.navy }]}>
        <ActivityIndicator color={colors?.brandAccent || MB_COLORS.brandAccent} size="large" />
        <Text style={[styles.loadingText, { color: colors?.muted || MB_COLORS.muted }]}>CONECTANDO COCINA...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.navy }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIcon}>
            <ChefHat size={24} color="white" />
          </View>
          <View>
            <Text style={styles.headerTitle}>KITCHEN <Text style={{ color: colors.brandAccent }}>KDS</Text></Text>
            <Text style={styles.headerSub}>SISTEMA EN VIVO</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => signOut()} style={[styles.logoutBtn, { backgroundColor: colors.glass }]}>
          <LogOut size={20} color={colors.muted} />
        </TouchableOpacity>
      </View>

      {/* Stats Bar */}
      <View style={styles.statsBar}>
        <View style={[styles.statCard, { backgroundColor: colors.glass, borderColor: colors.glassHeavy }]}>
          <Text style={[styles.statValue, { color: 'white' }]}>{stats.pending}</Text>
          <Text style={[styles.statLabel, { color: colors.muted }]}>PENDIENTES</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.glass, borderColor: colors.brandAccent + '40' }]}>
          <Flame size={14} color={colors.brandAccent} />
          <Text style={[styles.statValue, { color: colors.brandAccent }]}>{stats.preparing}</Text>
          <Text style={[styles.statLabel, { color: colors.brandAccent }]}>EN FUEGO</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.glass, borderColor: '#4CAF5040' }]}>
          <Text style={[styles.statValue, { color: '#4CAF50' }]}>{stats.ready}</Text>
          <Text style={[styles.statLabel, { color: '#4CAF50' }]}>LISTOS</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {(['PENDING', 'PREPARING', 'READY'] as const).map(tab => (
          <TouchableOpacity 
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
          >
            <Text style={[styles.tabText, { color: activeTab === tab ? colors.brandAccent : colors.muted }]}>
              {tab === 'PENDING' ? 'POR PREPARAR' : tab === 'PREPARING' ? 'EN FUEGO' : 'LISTOS'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Ticket List */}
      <ScrollView 
        style={styles.container} 
        contentContainerStyle={styles.ticketList}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchData} tintColor={colors.brandAccent} />}
      >
        {getFilteredOrders().length === 0 ? (
          <View style={styles.emptyState}>
            <Utensils size={64} color={colors.muted} />
            <Text style={[styles.emptyText, { color: colors.muted }]}>SIN PEDIDOS</Text>
          </View>
        ) : (
          getFilteredOrders().map((order, i) => (
            <Animated.View 
              key={order.id} 
              entering={FadeInDown.delay(i * 50)} 
              layout={Layout.springify()}
              style={[styles.ticketCard, { backgroundColor: colors.glass, borderColor: colors.glassHeavy }]}
            >
              <View style={[styles.ticketHeader, { borderBottomColor: 'rgba(255,255,255,0.05)' }]}>
                <View style={styles.tableBadge}>
                  <Text style={[styles.tableText, { color: colors.text }]}>MESA {order.table?.number}</Text>
                </View>
                <View style={styles.timer}>
                  <Clock size={12} color={colors.muted} />
                  <Text style={[styles.timerText, { color: colors.muted }]}>{getTimeElapsed(order.createdAt)}</Text>
                </View>
              </View>

              <View style={styles.ticketBody}>
                {order.order_items.map((item: any) => (
                  <View key={item.id} style={styles.ticketItem}>
                    <View style={styles.itemQty}>
                      <Text style={[styles.itemQtyText, { color: colors.brandAccent }]}>{item.quantity}</Text>
                    </View>
                    <Text style={[styles.itemName, { color: colors.text }]}>{item.menu_item?.name}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.ticketFooter}>
                {order.status === 'VALIDATED' && (
                  <TouchableOpacity 
                    onPress={() => handleUpdateStatus(order.id, 'VALIDATED')}
                    style={[styles.actionBtn, { backgroundColor: colors.brandAccent }]}
                  >
                    <Play size={16} color="white" />
                    <Text style={styles.actionText}>COMENZAR</Text>
                  </TouchableOpacity>
                )}
                {order.status === 'PREPARING' && (
                  <TouchableOpacity 
                    onPress={() => handleUpdateStatus(order.id, 'PREPARING')}
                    style={[styles.actionBtn, { backgroundColor: '#4CAF50' }]}
                  >
                    <CheckCircle2 size={16} color="white" />
                    <Text style={styles.actionText}>TERMINAR</Text>
                  </TouchableOpacity>
                )}
                {order.status === 'READY' && (
                  <TouchableOpacity 
                    onPress={() => handleUpdateStatus(order.id, 'READY')}
                    style={[styles.actionBtn, { backgroundColor: 'rgba(255,255,255,0.05)' }]}
                  >
                    <CheckCircle2 size={16} color="#4CAF50" />
                    <Text style={[styles.actionText, { color: '#4CAF50' }]}>DESPACHADO</Text>
                  </TouchableOpacity>
                )}
              </View>
            </Animated.View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
