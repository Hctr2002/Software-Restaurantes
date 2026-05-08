import React from 'react';
import { useRouter } from 'expo-router';
import { 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  View, 
  Text,
  StatusBar,
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import { MB_COLORS, MB_SPACING, MB_RADIUS } from '../../constants/MB_Theme';
import { 
  TrendingUp, 
  Wallet, 
  ReceiptText, 
  ClipboardList, 
  Bell, 
  User,
  Menu as MenuIcon,
  Flame,
  Timer
} from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import AdminKpiCard from '../../components/AdminKpiCard';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import AdminSideMenu from '../../components/AdminSideMenu';
import { 
  fetchDashboardStats, 
  fetchRecentOrders, 
  fetchTables,
  formatCurrency, 
  timeAgo,
  DashboardStats,
  DashboardOrder,
  TableData
} from '../../lib/dashboard';

export default function AdminDashboardScreen() {
  const { restaurantId } = useAuth();
  const router = useRouter();
  const [refreshing, setRefreshing] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [stats, setStats] = React.useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = React.useState<DashboardOrder[]>([]);
  const [tables, setTables] = React.useState<TableData[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  const loadData = React.useCallback(async () => {
    if (!restaurantId) {
      setLoading(false);
      return;
    }
    
    try {
      setError(null);
      const [statsData, ordersData, tablesData] = await Promise.all([
        fetchDashboardStats(restaurantId),
        fetchRecentOrders(restaurantId),
        fetchTables(restaurantId)
      ]);
      setStats(statsData);
      setRecentOrders(ordersData);
      setTables(tablesData);
    } catch (err) {
      console.error('AdminDashboard Error:', err);
      setError('Error de conexión con el servidor');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [restaurantId]);

  React.useEffect(() => {
    loadData();

    if (!restaurantId) return;

    // Suscripción para cambios en pedidos (afecta estadísticas y pedidos recientes)
    const ordersChannel = supabase
      .channel('admin-dashboard-orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `restaurant_id=eq.${restaurantId}`
        },
        () => {
          loadData();
        }
      )
      .subscribe();

    // Suscripción para cambios en mesas
    const tablesChannel = supabase
      .channel('admin-dashboard-tables')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tables',
          filter: `restaurant_id=eq.${restaurantId}`
        },
        () => {
          loadData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(tablesChannel);
    };
  }, [loadData, restaurantId]);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={MB_COLORS.brandAccent} />
        <Text style={styles.loadingText}>Sincronizando Local...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={MB_COLORS.brandAccent} />
        }
      >
        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* KPI Grid */}
        <View style={styles.kpiGrid}>
          <View style={styles.kpiColumn}>
            <AdminKpiCard 
              icon={<Wallet size={16} color={MB_COLORS.brandAccent} />}
              label="Ingresos Hoy"
              value={formatCurrency(stats?.ingresos_dia ?? 0)}
              detail={`${stats?.pedidos_dia ?? 0} pedidos`}
              delay={100}
            />
            <AdminKpiCard 
              icon={<ReceiptText size={16} color={MB_COLORS.brandAccent} />}
              label="Ticket Prom."
              value={formatCurrency(stats?.ticket_promedio ?? 0)}
              detail="Promedio hoy"
              delay={300}
            />
          </View>
          <View style={styles.kpiColumn}>
            <AdminKpiCard 
              icon={<TrendingUp size={16} color={MB_COLORS.brandAccent} />}
              label="Este Mes"
              value={formatCurrency(stats?.ingresos_mes ?? 0)}
              detail="Ventas acumuladas"
              delay={200}
            />
            <AdminKpiCard 
              icon={<ClipboardList size={16} color={MB_COLORS.brandAccent} />}
              label="Activos"
              value={String(stats?.activos ?? 0)}
              detail="Pendientes/Cocina"
              delay={400}
            />
          </View>
        </View>

        {/* Live Flow & Metrics */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Métricas en Vivo</Text>
        </View>
        
        <View style={styles.metricsContainer}>
          <View style={styles.flowCard}>
            <View style={styles.flowHeader}>
              <View style={styles.iconContainer}>
                <Flame size={14} color={MB_COLORS.brandAccent} />
              </View>
              <Text style={styles.flowTitle}>Flujo de Órdenes</Text>
            </View>
            <View style={styles.flowGrid}>
              {[
                { label: 'Pend.', count: stats?.flowCounts?.PENDING ?? 0, color: '#facc15' },
                { label: 'Val.', count: stats?.flowCounts?.VALIDATED ?? 0, color: '#60a5fa' },
                { label: 'Prep.', count: stats?.flowCounts?.PREPARING ?? 0, color: MB_COLORS.brandAccent },
                { label: 'Listo', count: stats?.flowCounts?.READY ?? 0, color: '#10b981' },
              ].map((item) => (
                <View key={item.label} style={styles.flowItem}>
                  <Text style={[styles.flowCount, { color: item.color }]}>{item.count}</Text>
                  <Text style={styles.flowLabel}>{item.label}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.timerCard}>
            <View style={styles.timerLayout}>
              <View style={styles.flowHeader}>
                <View style={[styles.iconContainer, { backgroundColor: 'rgba(251, 191, 36, 0.1)' }]}>
                  <Timer size={14} color="#fbbf24" />
                </View>
                <Text style={styles.flowTitle}>Tiempo Promedio de hoy</Text>
              </View>
              
              <View style={styles.timerContent}>
                {stats?.avgCycleMin === null ? (
                  <Text style={styles.emptyTimerText}>Sin datos hoy</Text>
                ) : (
                  <View style={styles.timerMain}>
                    <View style={styles.timerValueRow}>
                      <Text style={styles.timerValue}>{stats?.avgCycleMin}</Text>
                      <Text style={styles.timerUnit}>min</Text>
                    </View>
                    <View style={[
                      styles.timerBadge, 
                      { backgroundColor: (stats?.avgCycleMin ?? 0) > 30 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)' }
                    ]}>
                      <Text style={[
                        styles.timerBadgeText, 
                        { color: (stats?.avgCycleMin ?? 0) > 30 ? '#ef4444' : '#10b981' }
                      ]}>
                        {(stats?.avgCycleMin ?? 0) > 30 ? 'LENTO' : 'ÓPTIMO'}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Section: Top Items */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Top Items Hoy</Text>
        </View>
        <View style={styles.glassCard}>
          {!stats?.top_items?.length ? (
            <Text style={styles.emptyText}>Sin pedidos hoy</Text>
          ) : (
            stats.top_items.map((item, i) => (
              <View key={item.name} style={[styles.itemRow, i === stats.top_items.length - 1 && { borderBottomWidth: 0 }]}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemRank}>#{i + 1}</Text>
                  <Text style={styles.itemName}>{item.name}</Text>
                </View>
                <View style={styles.itemBadge}>
                  <Text style={styles.itemCountText}>{item.count} UNID.</Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Section: Tables Status */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Estado de Mesas</Text>
        </View>
        <View style={styles.tableGrid}>
          {tables.length === 0 ? (
            <Text style={styles.emptyText}>No hay mesas configuradas</Text>
          ) : (
            tables.map((table) => (
              <View 
                key={table.id} 
                style={[
                  styles.tableCard, 
                  table.status === 'OCCUPIED' && styles.tableOccupied,
                  table.status === 'RESERVED' && { backgroundColor: 'rgba(255, 193, 7, 0.1)', borderColor: 'rgba(255, 193, 7, 0.2)' }
                ]}
              >
                <Text 
                  style={[
                    styles.tableNumber, 
                    table.status === 'OCCUPIED' && styles.tableNumberOccupied,
                    table.status === 'RESERVED' && { color: '#FFC107' }
                  ]}
                >
                  {table.number}
                </Text>
                <Text 
                  style={[
                    styles.tableStatusText, 
                    table.status === 'OCCUPIED' && styles.tableStatusOccupied,
                    table.status === 'RESERVED' && { color: '#FFC107' }
                  ]}
                >
                  {table.status === 'FREE' ? 'LIBRE' : table.status === 'OCCUPIED' ? 'USO' : 'RESV'}
                </Text>
              </View>
            ))
          )}
        </View>

        {/* Section: Recent Orders */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Pedidos Recientes</Text>
          <TouchableOpacity onPress={() => router.push('/(admin)/orders')}>
            <Text style={styles.seeAll}>Ver todo</Text>
          </TouchableOpacity>
        </View>

        <Animated.View entering={FadeInDown.delay(500)} style={styles.activityCard}>
          {recentOrders.length === 0 ? (
            <Text style={styles.emptyText}>No hay pedidos recientes</Text>
          ) : (
            recentOrders.map((order, i) => (
              <View key={order.id} style={[styles.activityItem, i === recentOrders.length - 1 && { borderBottomWidth: 0 }]}>
                <View style={styles.activityInfo}>
                  <Text style={styles.activityTitle}>Mesa {order.table_number}</Text>
                  <Text style={styles.activityTime}>{timeAgo(order.createdAt)}</Text>
                </View>
                <View style={[styles.statusBadge, order.status === 'DELIVERED' && styles.statusDelivered]}>
                  <Text style={styles.statusText}>{order.status}</Text>
                </View>
              </View>
            ))
          )}
        </Animated.View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MB_COLORS.navy,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: MB_COLORS.muted,
    marginTop: 12,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: MB_SPACING.lg,
    paddingTop: 60,
    paddingBottom: MB_SPACING.lg,
  },
  greeting: {
    fontSize: 12,
    color: MB_COLORS.muted,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  restaurantName: {
    fontSize: 24,
    color: 'white',
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: MB_COLORS.glassHeavy,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  badge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: MB_COLORS.brandAccent,
    borderWidth: 2,
    borderColor: MB_COLORS.navy,
  },
  scrollContent: {
    paddingHorizontal: MB_SPACING.lg,
    paddingBottom: 120,
  },
  errorBanner: {
    backgroundColor: 'rgba(254, 95, 85, 0.1)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(254, 95, 85, 0.2)',
  },
  errorText: {
    color: MB_COLORS.brandAccent,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  kpiGrid: {
    flexDirection: 'row',
    gap: MB_SPACING.md,
    marginBottom: MB_SPACING.xl,
  },
  kpiColumn: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: MB_SPACING.md,
  },
  sectionTitle: {
    fontSize: 18,
    color: 'white',
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  seeAll: {
    fontSize: 12,
    color: MB_COLORS.brandAccent,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  activityCard: {
    backgroundColor: MB_COLORS.glass,
    borderRadius: MB_RADIUS.xl,
    padding: MB_SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
    marginBottom: MB_SPACING.xl,
  },
  emptyText: {
    color: MB_COLORS.muted,
    fontSize: 12,
    textAlign: 'center',
    paddingVertical: 20,
    fontStyle: 'italic',
  },
  activityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  activityInfo: {
    flex: 1,
  },
  activityTitle: {
    color: 'white',
    fontSize: 15,
    fontWeight: '800',
  },
  activityTime: {
    color: MB_COLORS.muted,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  statusBadge: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  statusDelivered: {
    backgroundColor: 'rgba(114, 155, 121, 0.1)',
  },
  statusText: {
    color: 'white',
    fontSize: 9,
    fontWeight: '900',
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -MB_SPACING.xs,
  },
  quickButtonContainer: {
    width: '25%',
    padding: MB_SPACING.xs,
  },
  quickButton: {
    alignItems: 'center',
  },
  quickIconBg: {
    width: 56,
    height: 56,
    borderRadius: 20,
    backgroundColor: MB_COLORS.glassHeavy,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  quickLabel: {
    color: MB_COLORS.muted,
    fontSize: 11,
    fontWeight: '700',
  },
  glassCard: {
    backgroundColor: MB_COLORS.glass,
    borderRadius: MB_RADIUS.xl,
    padding: MB_SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
    marginBottom: MB_SPACING.xl,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  itemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  itemRank: {
    color: MB_COLORS.muted,
    fontSize: 10,
    fontWeight: '900',
    backgroundColor: 'rgba(255,255,255,0.05)',
    width: 24,
    height: 24,
    borderRadius: 8,
    textAlign: 'center',
    lineHeight: 24,
  },
  itemName: {
    color: 'white',
    fontSize: 14,
    fontWeight: '800',
  },
  itemBadge: {
    backgroundColor: 'rgba(254, 95, 85, 0.1)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  itemCountText: {
    color: MB_COLORS.brandAccent,
    fontSize: 9,
    fontWeight: '900',
  },
  tableGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: MB_SPACING.xl,
  },
  tableCard: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: 'rgba(114, 155, 121, 0.1)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(114, 155, 121, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  tableOccupied: {
    backgroundColor: 'rgba(254, 95, 85, 0.1)',
    borderColor: 'rgba(254, 95, 85, 0.2)',
  },
  tableNumber: {
    fontSize: 22,
    fontWeight: '900',
    color: '#729B79',
    textAlign: 'center',
    includeFontPadding: false,
  },
  tableNumberOccupied: {
    color: MB_COLORS.brandAccent,
  },
  tableStatusText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#729B79',
    marginTop: 2,
    letterSpacing: 0.5,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  tableStatusOccupied: {
    color: MB_COLORS.brandAccent,
  },
  metricsContainer: {
    flexDirection: 'column',
    gap: MB_SPACING.md,
    marginBottom: MB_SPACING.xl,
  },
  flowCard: {
    backgroundColor: MB_COLORS.glass,
    borderRadius: 24,
    padding: MB_SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
  },
  timerCard: {
    backgroundColor: MB_COLORS.glass,
    borderRadius: 24,
    padding: MB_SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
  },
  timerLayout: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timerMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  flowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 0,
  },
  iconContainer: {
    padding: 6,
    backgroundColor: 'rgba(254, 95, 85, 0.1)',
    borderRadius: 10,
  },
  flowTitle: {
    color: 'white',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  flowGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  flowItem: {
    flex: 1,
    minWidth: '22%',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 8,
    alignItems: 'center',
  },
  flowCount: {
    fontSize: 16,
    fontWeight: '900',
  },
  flowLabel: {
    fontSize: 8,
    color: MB_COLORS.muted,
    fontWeight: '800',
    marginTop: 2,
  },
  timerContent: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  timerValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  timerValue: {
    fontSize: 28,
    fontWeight: '900',
    color: '#fbbf24',
  },
  timerUnit: {
    fontSize: 10,
    color: MB_COLORS.muted,
    fontWeight: '800',
  },
  timerBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  timerBadgeText: {
    fontSize: 8,
    fontWeight: '900',
  },
  emptyTimerText: {
    fontSize: 10,
    color: MB_COLORS.muted,
    fontStyle: 'italic',
  },
});
