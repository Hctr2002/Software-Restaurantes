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
  Calendar as CalendarIcon, 
  DollarSign, 
  Clock,
  ChevronRight,
  Target,
  LayoutGrid,
  X
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
  processTableReports,
  buildTimingStats,
  formatShortDate 
} from '../../lib/reportUtils';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { TextInput, Modal } from 'react-native';

const PRESETS = [
  { label: '7D', days: 7 },
  { label: '14D', days: 14 },
  { label: '30D', days: 30 },
  { label: '90D', days: 90 },
  { label: 'CUSTOM', days: 0 },
];

export default function AdminReportsScreen() {
  const { restaurantId } = useAuth();
  
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [preset, setPreset] = React.useState(7);
  
  // Custom Date Range
  const [showCustomModal, setShowCustomModal] = React.useState(false);
  const [dateFrom, setDateFrom] = React.useState(daysAgoISO(7));
  const [dateTo, setDateTo] = React.useState(todayISO());

  const [stats, setStats] = React.useState({
    totalRevenue: 0,
    totalOrders: 0,
    avgTicket: 0,
    dailyReports: [] as any[],
    topItems: [] as any[],
    topStaff: [] as any[],
    tableReports: [] as any[],
    timingStats: [] as any[]
  });

  const fetchData = React.useCallback(async (days: number, customFrom?: string, customTo?: string) => {
    if (!restaurantId) return;
    
    setLoading(true);
    try {
      const from = days === 0 ? (customFrom || dateFrom) : daysAgoISO(days);
      const to = days === 0 ? (customTo || dateTo) : todayISO();

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
        .gte('createdAt', from + 'T00:00:00Z')
        .lte('createdAt', to + 'T23:59:59Z');

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

      const daily = processDailyReports(transformedOrders, from, to);
      const topItems = processTopItems(transformedOrders);
      const topStaff = processStaffReports(transformedOrders);
      const tableReports = processTableReports(transformedOrders);
      const timing = buildTimingStats(transformedOrders);
      
      const revenue = transformedOrders.reduce((acc, o) => 
        acc + o.order_items.reduce((s: number, it: any) => s + (it.unitPrice * it.quantity), 0), 0
      );

      setStats({
        totalRevenue: revenue,
        totalOrders: transformedOrders.length,
        avgTicket: transformedOrders.length > 0 ? Math.round(revenue / transformedOrders.length) : 0,
        dailyReports: daily,
        topItems,
        topStaff,
        tableReports,
        timingStats: timing
      });
    } catch (err) {
      console.error('Error fetching reports:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [restaurantId, dateFrom, dateTo]);

  React.useEffect(() => {
    if (preset !== 0) {
      fetchData(preset);
    }
  }, [fetchData, preset]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData(preset);
  };

  const handleApplyCustom = () => {
    setShowCustomModal(false);
    setPreset(0);
    fetchData(0, dateFrom, dateTo);
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
        <Text style={styles.headerTitle}>Análisis de Datos</Text>
        <Text style={styles.headerSubtitle}>Desempeño y métricas del local</Text>
      </View>

      <View style={styles.presetContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presets}>
          {PRESETS.map((p) => (
            <TouchableOpacity 
              key={p.label}
              style={[styles.presetChip, preset === p.days && p.days !== 0 && styles.presetChipActive, preset === 0 && p.days === 0 && styles.presetChipActive]}
              onPress={() => {
                if (p.days === 0) {
                  setShowCustomModal(true);
                } else {
                  setPreset(p.days);
                }
              }}
            >
              <Text style={[styles.presetText, (preset === p.days || (preset === 0 && p.days === 0)) && styles.presetTextActive]}>
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        {preset === 0 && (
          <View style={styles.customDateDisplay}>
            <CalendarIcon size={12} color={MB_COLORS.brandAccent} />
            <Text style={styles.customDateDisplayText}>
              {dateFrom} al {dateTo}
            </Text>
          </View>
        )}
      </View>

      <Modal visible={showCustomModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Rango Personalizado</Text>
              <TouchableOpacity onPress={() => setShowCustomModal(false)}>
                <X color="white" size={24} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>DESDE (YYYY-MM-DD)</Text>
                <TextInput 
                  style={styles.dateInput}
                  value={dateFrom}
                  onChangeText={setDateFrom}
                  placeholder="2024-01-01"
                  placeholderTextColor="rgba(255,255,255,0.2)"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>HASTA (YYYY-MM-DD)</Text>
                <TextInput 
                  style={styles.dateInput}
                  value={dateTo}
                  onChangeText={setDateTo}
                  placeholder="2024-01-07"
                  placeholderTextColor="rgba(255,255,255,0.2)"
                />
              </View>

              <TouchableOpacity style={styles.applyButton} onPress={handleApplyCustom}>
                <Text style={styles.applyButtonText}>APLICAR RANGO</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
            {/* Daily Performance */}
            <Animated.View entering={FadeInDown.delay(300)} style={styles.section}>
              <View style={styles.sectionHeader}>
                <TrendingUp size={18} color={MB_COLORS.brandAccent} />
                <Text style={styles.sectionTitle}>Rendimiento Diario</Text>
              </View>
              <View style={styles.tableContainer}>
                <View style={styles.tableHeaderRow}>
                  <Text style={[styles.tableHead, { flex: 1.5 }]}>FECHA</Text>
                  <Text style={styles.tableHead}>PEDS</Text>
                  <Text style={[styles.tableHead, { flex: 2, textAlign: 'right' }]}>INGRESOS</Text>
                </View>
                {stats.dailyReports.filter(r => r.orders > 0).length > 0 ? (
                  stats.dailyReports.filter(r => r.orders > 0).reverse().map((day, i) => (
                    <View key={i} style={styles.tableRow}>
                      <Text style={[styles.tableCell, { flex: 1.5, color: 'white' }]}>{formatShortDate(day.date)}</Text>
                      <Text style={styles.tableCell}>{day.orders}</Text>
                      <Text style={[styles.tableCell, { flex: 2, textAlign: 'right', color: MB_COLORS.brandAccent, fontWeight: '900' }]}>
                        {formatCurrency(day.revenue)}
                      </Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptyText}>Sin ventas en este período</Text>
                )}
              </View>
            </Animated.View>

            {/* Top Products */}
            <Animated.View entering={FadeInDown.delay(400)} style={styles.section}>
              <View style={styles.sectionHeader}>
                <Package size={18} color="#FF9800" />
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

            {/* Table Occupation */}
            <Animated.View entering={FadeInDown.delay(450)} style={styles.section}>
              <View style={styles.sectionHeader}>
                <LayoutGrid size={18} color="#00BCD4" />
                <Text style={styles.sectionTitle}>Uso de Mesas</Text>
              </View>
              {stats.tableReports.length > 0 ? (
                stats.tableReports.map((tbl, i) => (
                  <View key={i} style={styles.rankingItem}>
                    <View style={styles.tableNumberCircle}>
                      <Text style={styles.tableNumberText}>{tbl.number}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rankingName}>Mesa {tbl.number}</Text>
                      <Text style={styles.rankingSub}>{tbl.orders} servicios</Text>
                    </View>
                    <Text style={styles.rankingValue}>{formatCurrency(tbl.revenue)}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>No hay datos de mesas</Text>
              )}
            </Animated.View>

            {/* Staff Ranking */}
            <Animated.View entering={FadeInDown.delay(500)} style={styles.section}>
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
            <Animated.View entering={FadeInDown.delay(600)} style={styles.section}>
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
  customDateDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: MB_SPACING.lg,
    marginTop: 8,
  },
  customDateDisplayText: {
    color: MB_COLORS.brandAccent,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: MB_COLORS.navy,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  modalTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  modalBody: {
    padding: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    color: MB_COLORS.muted,
    fontSize: 10,
    fontWeight: '900',
    marginBottom: 8,
  },
  dateInput: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 16,
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  applyButton: {
    backgroundColor: MB_COLORS.brandAccent,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  applyButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '900',
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
  tableContainer: {
    backgroundColor: MB_COLORS.glass,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    marginBottom: 8,
  },
  tableHead: {
    color: MB_COLORS.muted,
    fontSize: 9,
    fontWeight: '900',
    flex: 1,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.03)',
  },
  tableCell: {
    color: MB_COLORS.muted,
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
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
  tableNumberCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 188, 212, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 188, 212, 0.2)',
  },
  tableNumberText: {
    color: '#00BCD4',
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
    fontSize: 11,
    textAlign: 'center',
    paddingVertical: 20,
    fontStyle: 'italic',
  }
});


