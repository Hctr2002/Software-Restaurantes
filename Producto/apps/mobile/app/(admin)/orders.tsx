import React from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  ScrollView,
  Alert
} from 'react-native';
import { MB_COLORS, MB_SPACING, MB_RADIUS } from '../../constants/MB_Theme';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';
import { formatCurrency, timeAgo } from '../../lib/dashboard';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ShoppingBag, ChevronRight, Filter } from 'lucide-react-native';
import OrderDetailModal, { OrderStatus } from '../../components/OrderDetailModal';

const STATUS_FILTER = [
  { label: 'TODOS', value: 'ALL' },
  { label: 'PENDIENTES', value: 'PENDING' },
  { label: 'VALIDADOS', value: 'VALIDATED' },
  { label: 'COCINA', value: 'PREPARING' },
  { label: 'LISTOS', value: 'READY' },
  { label: 'ENTREGADOS', value: 'DELIVERED' },
];

export default function AdminOrdersScreen() {
  const { restaurantId } = useAuth();
  const { colors } = useTheme();
  // Pagination State
  const [orders, setOrders] = React.useState<any[]>([]);
  const [filteredOrders, setFilteredOrders] = React.useState<any[]>([]);
  const [page, setPage] = React.useState(0);
  const [hasMore, setHasMore] = React.useState(true);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [statusFilter, setStatusFilter] = React.useState('ALL');
  const PAGE_SIZE = 20;
  
  // Modal State
  const [selectedOrder, setSelectedOrder] = React.useState<any | null>(null);
  const [isModalVisible, setIsModalVisible] = React.useState(false);
  const [updating, setUpdating] = React.useState(false);

  const loadOrders = React.useCallback(async (isRefresh = false, nextStatus = statusFilter) => {
    if (!restaurantId) return;
    
    const targetPage = isRefresh ? 0 : page;
    const from = targetPage * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    try {
      if (isRefresh) setRefreshing(true);
      else if (targetPage > 0) setLoadingMore(true);

      let query = supabase
        .from('orders')
        .select(`
          id, 
          status, 
          createdAt, 
          table_id,
          tables(number),
          order_items(
            id,
            unit_price, 
            quantity,
            notes,
            menu_items(name)
          )
        `)
        .eq('restaurant_id', restaurantId)
        .not('status', 'eq', 'REJECTED')
        .order('createdAt', { ascending: false })
        .range(from, to);

      // Si hay un filtro de estado, aplicarlo en la consulta para mayor eficiencia
      if (nextStatus !== 'ALL') {
        query = query.eq('status', nextStatus);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      const newOrders = data || [];
      
      if (isRefresh) {
        setOrders(newOrders);
        setFilteredOrders(newOrders);
        setPage(0);
      } else {
        setOrders(prev => [...prev, ...newOrders]);
        setFilteredOrders(prev => [...prev, ...newOrders]);
      }
      
      setHasMore(newOrders.length === PAGE_SIZE);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [restaurantId, page, statusFilter]);

  React.useEffect(() => {
    loadOrders(true);

    if (!restaurantId) return;

    const channelSuffix = Math.random().toString(36).substring(7);

    // Suscripción en tiempo real
    const channel = supabase
      .channel(`admin-orders-realtime-${restaurantId}-${channelSuffix}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `restaurant_id=eq.${restaurantId}`
        },
        () => {
          loadOrders(true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId, statusFilter]);

  const handleUpdateStatus = async (orderId: string, nextStatus: OrderStatus) => {
    setUpdating(true);
    try {
      const updateData: any = { status: nextStatus };
      
      // Update timestamps based on status
      if (nextStatus === 'VALIDATED') updateData.validated_at = new Date().toISOString();
      if (nextStatus === 'PREPARING') updateData.preparing_at = new Date().toISOString();
      if (nextStatus === 'READY') updateData.ready_at = new Date().toISOString();

      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId);

      if (error) throw error;
      
      setIsModalVisible(false);
      loadOrders();
    } catch (err: any) {
      Alert.alert('Error', 'No se pudo actualizar el pedido');
    } finally {
      setUpdating(false);
    }
  };

  const onRefresh = () => {
    loadOrders(true);
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      setPage(prev => prev + 1);
      // El useEffect se encargará de disparar la carga al cambiar la página
    }
  };

  const handleFilterChange = (filter: string) => {
    setStatusFilter(filter);
    setLoading(true);
    loadOrders(true, filter);
  };

  React.useEffect(() => {
    if (page > 0) {
      loadOrders();
    }
  }, [page]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return '#facc15';
      case 'VALIDATED': return '#60a5fa';
      case 'PREPARING': return colors.brandAccent;
      case 'READY': return '#10b981';
      case 'DELIVERED': return colors.muted;
      default: return colors.text;
    }
  };

  const renderItem = ({ item, index }: { item: any, index: number }) => {
    const total = (item.order_items || []).reduce((sum: number, oi: any) => sum + (oi.unit_price * oi.quantity), 0);

    return (
      <Animated.View entering={FadeInDown.delay(index * 50)}>
        <TouchableOpacity 
          style={[styles.orderCard, { backgroundColor: colors.glass, borderColor: colors.glassHeavy }]}
          onPress={() => {
            setSelectedOrder(item);
            setIsModalVisible(true);
          }}
        >
          <View style={styles.orderHeader}>
            <View>
              <Text style={[styles.tableText, { color: colors.text }]}>Mesa {item.tables?.number ?? 'S/N'}</Text>
              <Text style={[styles.timeText, { color: colors.muted }]}>{timeAgo(item.createdAt)}</Text>
            </View>
            <View style={[styles.statusTag, { borderColor: getStatusColor(item.status) }]}>
              <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                {item.status === 'PENDING' ? 'PENDIENTE' : 
                 item.status === 'VALIDATED' ? 'VALIDADO' :
                 item.status === 'PREPARING' ? 'EN COCINA' :
                 item.status === 'READY' ? 'LISTO' : 
                 item.status === 'DELIVERED' ? 'ENTREGADO' : item.status}
              </Text>
            </View>
          </View>
          
          <View style={[styles.orderFooter, { borderTopColor: colors.glassHeavy }]}>
            <Text style={[styles.totalLabel, { color: colors.muted }]}>Total Orden</Text>
            <Text style={[styles.totalAmount, { color: colors.text }]}>{formatCurrency(total)}</Text>
            <ChevronRight size={16} color={colors.muted} />
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.navy }]}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Gestión de Pedidos</Text>
          <Text style={[styles.headerSubtitle, { color: colors.muted }]}>{orders.length} órdenes registradas</Text>
        </View>
        <ShoppingBag color={colors.brandAccent} size={24} />
      </View>

      <View style={[styles.filterContainer, { borderBottomColor: colors.glassHeavy }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {STATUS_FILTER.map((f) => (
            <TouchableOpacity 
              key={f.value}
              style={[
                styles.filterChip, 
                { backgroundColor: colors.glass, borderColor: colors.glassHeavy },
                statusFilter === f.value && { backgroundColor: colors.brandAccent, borderColor: colors.brandAccent }
              ]}
              onPress={() => handleFilterChange(f.value)}
            >
              <Text style={[
                styles.filterText, 
                { color: colors.muted },
                statusFilter === f.value && { color: 'white' }
              ]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading && !refreshing ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.brandAccent} />
          <Text style={[styles.loadingText, { color: colors.muted }]}>Sincronizando comandas...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brandAccent} />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={() => (
            loadingMore ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator color={colors.brandAccent} />
              </View>
            ) : null
          )}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Text style={[styles.emptyText, { color: colors.muted }]}>No hay pedidos con este estado</Text>
            </View>
          }
        />
      )}

      <OrderDetailModal
        visible={isModalVisible}
        order={selectedOrder}
        onClose={() => setIsModalVisible(false)}
        onUpdateStatus={handleUpdateStatus}
        updating={updating}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MB_COLORS.navy,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: MB_SPACING.lg,
    paddingTop: 60,
    paddingBottom: MB_SPACING.md,
  },
  headerTitle: {
    fontSize: 26,
    color: 'white',
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    color: MB_COLORS.muted,
    fontWeight: '600',
    marginTop: 2,
  },
  filterContainer: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  filterScroll: {
    paddingHorizontal: MB_SPACING.lg,
    gap: 10,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  filterChipActive: {
    backgroundColor: MB_COLORS.brandAccent,
    borderColor: MB_COLORS.brandAccent,
  },
  filterText: {
    color: MB_COLORS.muted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  filterTextActive: {
    color: 'white',
  },
  listContent: {
    padding: MB_SPACING.lg,
    paddingBottom: 100,
  },
  orderCard: {
    backgroundColor: MB_COLORS.glass,
    borderRadius: MB_RADIUS.lg,
    padding: MB_SPACING.md,
    marginBottom: MB_SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  tableText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '900',
    fontStyle: 'italic',
    textTransform: 'uppercase',
  },
  timeText: {
    color: MB_COLORS.muted,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  orderFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  totalLabel: {
    flex: 1,
    color: MB_COLORS.muted,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  totalAmount: {
    color: 'white',
    fontSize: 16,
    fontWeight: '900',
    marginRight: 8,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    color: MB_COLORS.muted,
    marginTop: 12,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  emptyText: {
    color: MB_COLORS.muted,
    fontSize: 14,
    fontStyle: 'italic',
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  }
});

