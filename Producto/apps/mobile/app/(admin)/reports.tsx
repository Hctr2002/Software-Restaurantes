import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  RefreshControl,
  Dimensions
} from 'react-native';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Package, 
  Calendar, 
  DollarSign, 
  Clock,
  ChevronRight,
  Target
} from 'lucide-react-native';
import { MB_COLORS, MB_SPACING, MB_RADIUS } from '../../constants/MB_Theme';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { 
  daysAgoISO, 
  todayISO, 
  processDailyReports, 
  processTopItems, 
  processStaffReports,
  buildTimingStats 
} from '../../lib/reportUtils';
import Animated, { FadeInDown } from 'react-native-reanimated';

const PRESETS = [
  { label: '7 Días', days: 7 },
  { label: '14 Días', days: 14 },
  { label: '30 Días', days: 30 },
  { label: '90 Días', days: 90 },
];

export default function AdminReportsScreen() {
  const { restaurantId } = useAuth();
  
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [preset, setPreset] = React.useState(7);
  
  const [stats, setStats] = React.useState({
    totalRevenue: 0,
    totalOrders: 0,
    avgTicket: 0,
    topItems: [] as any[],
    topStaff: [] as any[],
    timingStats: [] as any[]
  });

  const fetchData = React.useCallback(async (days: number) => {
    if (!restaurantId) return;
    
    setLoading(true);
    try {
      const from = daysAgoISO(days) + 'T00:00:00Z';
      const to = todayISO() + 'T23:59:59Z';

      const { data: orders, error } = await supabase
        .from('orders')
        .select(`
          id, 
          status, 
          createdAt, 
          validated_at, 
          preparing_at, 
          ready_at,
          users(email),
          tables(number),
          order_items(
            id, 
            unit_price, 
            quantity, 
            menu_items(
              name, 
              categories(name)
            )
          )
        `)
        .eq('restaurant_id', restaurantId)
        .in('status', ['DELIVERED', 'COMPLETED'])
        .gte('createdAt', from)
        .lte('createdAt', to);

      if (error) throw error;

      // Transform data to match reportUtils structure
      const transformedOrders = (orders || []).map(o => ({
        ...o,
        validatedAt: o.validated_at,
        preparingAt: o.preparing_at,
        readyAt: o.ready_at,
        order_items: o.order_items.map((it: any) => ({
          ...it,
          unitPrice: it.unit_price,
          menu_items: {
            ...it.menu_items,
            categories: it.menu_items.categories
          }
        }))
      }));

      const topItems = processTopItems(transformedOrders);
      const topStaff = processStaffReports(transformedOrders);
      const timing = buildTimingStats(transformedOrders);
      
      const revenue = transformedOrders.reduce((acc, o) => 
        acc + o.order_items.reduce((s: number, it: any) => s + (it.unitPrice * it.quantity), 0), 0
      );

      setStats({
        totalRevenue: revenue,
        totalOrders: transformedOrders.length,
        avgTicket: transformedOrders.length > 0 ? Math.round(revenue / transformedOrders.length) : 0,
        topItems,
        topStaff,
        timingStats: timing
      });
    } catch (err) {
      console.error('Error fetching reports:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [restaurantId]);

  React.useEffect(() => {
    fetchData(preset);
  }, [fetchData, preset]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData(preset);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(val);
  };

  const renderKPI = (title: string, value: string, icon: any, color: string, index: number) => (
    <Animated.View 
      entering={FadeInDown.delay(index * 100)}
      style={[styles.kpiCard, { borderLeftColor: color }]}
    >
      <View style={styles.kpiHeader}>
        <View style={[styles.kpiIcon, { backgroundColor: color + '20' }]}>
          {icon}
        </View>
        <Text style={styles.kpiTitle}>{title}</Text>
      </View>
      <Text style={styles.kpiValue}>{value}</Text>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Reportes</Text>
        <Text style={styles.headerSubtitle}>Desempeño del restaurante</Text>
      </View>

      <View style={styles.presetContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presets}>
          {PRESETS.map((p) => (
            <TouchableOpacity 
              key={p.days}
              style={[styles.presetChip, preset === p.days && styles.presetChipActive]}
              onPress={() => setPreset(p.days)}
            >
              <Text style={[styles.presetText, preset === p.days && styles.presetTextActive]}>
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={MB_COLORS.brandAccent} />
        }
      >
        <View style={styles.kpiGrid}>
          {renderKPI('Ventas Totales', formatCurrency(stats.totalRevenue), <DollarSign size={18} color="#4CAF50" />, '#4CAF50', 0)}
          {renderKPI('Tickets', stats.totalOrders.toString(), <BarChart3 size={18} color="#2196F3" />, '#2196F3', 1)}
          {renderKPI('Promedio', formatCurrency(stats.avgTicket), <TrendingUp size={18} color="#FF9800" />, '#FF9800', 2)}
        </View>

        {loading ? (
          <View style={styles.loader}>
            <ActivityIndicator color={MB_COLORS.brandAccent} />
            <Text style={styles.loaderText}>Procesando datos...</Text>
          </View>
        ) : (
          <>
            {/* Top Products */}
            <Animated.View entering={FadeInDown.delay(300)} style={styles.section}>
              <View style={styles.sectionHeader}>
                <Package size={18} color={MB_COLORS.brandAccent} />
                <Text style={styles.sectionTitle}>Platos más Vendidos</Text>
              </View>
              {stats.topItems.length > 0 ? (
                stats.topItems.map((item, i) => (
                  <View key={i} style={styles.rankingItem}>
                    <Text style={styles.rankingPos}>{i + 1}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rankingName}>{item.name}</Text>
                      <Text style={styles.rankingSub}>{item.count} unidades</Text>
                    </View>
                    <Text style={styles.rankingValue}>{formatCurrency(item.revenue)}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>No hay datos disponibles</Text>
              )}
            </Animated.View>

            {/* Staff Ranking */}
            <Animated.View entering={FadeInDown.delay(400)} style={styles.section}>
              <View style={styles.sectionHeader}>
                <Users size={18} color="#9C27B0" />
                <Text style={styles.sectionTitle}>Ranking de Equipo</Text>
              </View>
              {stats.topStaff.length > 0 ? (
                stats.topStaff.map((person, i) => (
                  <View key={i} style={styles.rankingItem}>
                    <Text style={styles.rankingPos}>{i + 1}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rankingName}>{person.email.split('@')[0]}</Text>
                      <Text style={styles.rankingSub}>{person.orders} pedidos</Text>
                    </View>
                    <Text style={styles.rankingValue}>{formatCurrency(person.revenue)}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>No hay datos disponibles</Text>
              )}
            </Animated.View>

            {/* Kitchen Stats */}
            <Animated.View entering={FadeInDown.delay(500)} style={styles.section}>
              <View style={styles.sectionHeader}>
                <Clock size={18} color="#E91E63" />
                <Text style={styles.sectionTitle}>Tiempos de Cocina (Prom.)</Text>
              </View>
              {stats.timingStats.length > 0 ? (
                stats.timingStats.map((stat, i) => (
                  <View key={i} style={styles.timingItem}>
                    <Text style={styles.timingCat}>{stat.category}</Text>
                    <View style={styles.timingBar}>
                      <View style={styles.timingStep}>
                        <Text style={styles.timingStepLabel}>Validación</Text>
                        <Text style={styles.timingStepValue}>{stat.validationMin}m</Text>
                      </View>
                      <View style={styles.timingStep}>
                        <Text style={styles.timingStepLabel}>Cocina</Text>
                        <Text style={styles.timingStepValue}>{stat.kitchenMin}m</Text>
                      </View>
                      <View style={styles.timingStep}>
                        <Text style={styles.timingStepLabel}>Total</Text>
                        <Text style={[styles.timingStepValue, { color: MB_COLORS.brandAccent }]}>{stat.totalMin}m</Text>
                      </View>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>Sin datos de tiempos</Text>
              )}
            </Animated.View>
          </>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MB_COLORS.navy,
  },
  header: {
    paddingHorizontal: MB_SPACING.lg,
    paddingTop: 60,
    paddingBottom: MB_SPACING.md,
  },
  headerTitle: {
    fontSize: 28,
    color: 'white',
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: MB_COLORS.muted,
    fontWeight: '600',
    marginTop: 2,
  },
  presetContainer: {
    paddingVertical: 12,
  },
  presets: {
    paddingHorizontal: MB_SPACING.lg,
    gap: 10,
  },
  presetChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  presetChipActive: {
    backgroundColor: MB_COLORS.brandAccent,
    borderColor: MB_COLORS.brandAccent,
  },
  presetText: {
    color: MB_COLORS.muted,
    fontSize: 12,
    fontWeight: '800',
  },
  presetTextActive: {
    color: 'white',
  },
  content: {
    flex: 1,
  },
  kpiGrid: {
    paddingHorizontal: MB_SPACING.lg,
    gap: 12,
    marginBottom: 24,
  },
  kpiCard: {
    backgroundColor: MB_COLORS.glass,
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
  },
  kpiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  kpiIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  kpiTitle: {
    color: MB_COLORS.muted,
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  kpiValue: {
    color: 'white',
    fontSize: 24,
    fontWeight: '900',
  },
  section: {
    paddingHorizontal: MB_SPACING.lg,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  sectionTitle: {
    color: 'white',
    fontSize: 14,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  rankingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.02)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  rankingPos: {
    color: MB_COLORS.muted,
    fontSize: 14,
    fontWeight: '900',
    width: 20,
  },
  rankingName: {
    color: 'white',
    fontSize: 14,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  rankingSub: {
    color: MB_COLORS.muted,
    fontSize: 10,
    fontWeight: '600',
  },
  rankingValue: {
    color: 'white',
    fontSize: 14,
    fontWeight: '900',
  },
  timingItem: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  timingCat: {
    color: 'white',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  timingBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  timingStep: {
    alignItems: 'center',
  },
  timingStepLabel: {
    color: MB_COLORS.muted,
    fontSize: 8,
    fontWeight: '900',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  timingStepValue: {
    color: 'white',
    fontSize: 14,
    fontWeight: '800',
  },
  loader: {
    padding: 40,
    alignItems: 'center',
  },
  loaderText: {
    color: MB_COLORS.muted,
    marginTop: 12,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  emptyText: {
    color: MB_COLORS.muted,
    fontSize: 12,
    textAlign: 'center',
    paddingVertical: 20,
  }
});

