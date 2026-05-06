import React from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator,
  RefreshControl,
  StatusBar
} from 'react-native';
import { MB_COLORS, MB_SPACING, MB_RADIUS } from '../../constants/MB_Theme';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { formatCurrency, timeAgo } from '../../lib/dashboard';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ShoppingBag, ChevronRight } from 'lucide-react-native';

export default function AdminOrdersScreen() {
  const { restaurantId } = useAuth();
  const [orders, setOrders] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  const loadOrders = React.useCallback(async () => {
    if (!restaurantId) return;
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id, 
          status, 
          createdAt, 
          table_id,
          tables(number),
          order_items(unit_price, quantity)
        `)
        .eq('restaurant_id', restaurantId)
        .order('createdAt', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [restaurantId]);

  React.useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const onRefresh = () => {
    setRefreshing(true);
    loadOrders();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return '#FFD700';
      case 'PREPARING': return MB_COLORS.brandAccent;
      case 'READY': return MB_COLORS.sage;
      case 'DELIVERED': return MB_COLORS.muted;
      default: return 'white';
    }
  };

  const renderItem = ({ item, index }: { item: any, index: number }) => {
    const total = (item.order_items || []).reduce((sum: number, oi: any) => sum + (oi.unit_price * oi.quantity), 0);

    return (
      <Animated.View entering={FadeInDown.delay(index * 50)}>
        <TouchableOpacity style={styles.orderCard}>
          <View style={styles.orderHeader}>
            <View>
              <Text style={styles.tableText}>Mesa {item.tables?.number ?? 'S/N'}</Text>
              <Text style={styles.timeText}>{timeAgo(item.createdAt)}</Text>
            </View>
            <View style={[styles.statusTag, { borderColor: getStatusColor(item.status) }]}>
              <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
            </View>
          </View>
          
          <View style={styles.orderFooter}>
            <Text style={styles.totalLabel}>Total Orden</Text>
            <Text style={styles.totalAmount}>{formatCurrency(total)}</Text>
            <ChevronRight size={16} color={MB_COLORS.muted} />
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Pedidos</Text>
        <ShoppingBag color={MB_COLORS.brandAccent} size={24} />
      </View>

      {loading && !refreshing ? (
        <View style={styles.centered}>
          <ActivityIndicator color={MB_COLORS.brandAccent} />
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={MB_COLORS.brandAccent} />
          }
          ListEmptyComponent={
            <View style={styles.centered}>
              <Text style={styles.emptyText}>No hay pedidos registrados</Text>
            </View>
          }
        />
      )}
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
    paddingBottom: MB_SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  headerTitle: {
    fontSize: 24,
    color: 'white',
    fontWeight: '900',
    letterSpacing: -0.5,
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
    fontSize: 10,
    fontWeight: '900',
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
    fontSize: 12,
    fontWeight: '600',
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
  emptyText: {
    color: MB_COLORS.muted,
    fontSize: 14,
    fontStyle: 'italic',
  }
});
