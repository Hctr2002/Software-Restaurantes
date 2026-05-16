import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Alert
} from 'react-native';
import { 
  UtensilsCrossed, 
  Bell, 
  RefreshCw, 
  Receipt, 
  LayoutDashboard, 
  CheckCircle2,
  ChevronDown,
  Sparkles,
  LogOut,
  Clock,
  ChevronRight,
  AlertTriangle,
  XCircle,
  Link2
} from 'lucide-react-native';
import { MB_SPACING } from '../../constants/MB_Theme';
import { supabase } from '../../lib/supabase';
import { uuidv4 } from '../../lib/uuid';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import Animated, { FadeInDown, FadeInUp, Layout, FadeInLeft, SlideInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import AlertModal from '../../components/AlertModal';

const { width } = Dimensions.get('window');


const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 12, fontWeight: '900', letterSpacing: 2 },
  header: {
    paddingHorizontal: MB_SPACING.lg,
    paddingTop: 60,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  headerTitle: { fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4CAF50' },
  statusText: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  logoutBtn: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  
  islandsContainer: { paddingHorizontal: MB_SPACING.lg, gap: 12, marginBottom: 10 },
  island: { borderRadius: 24, padding: 16, borderWidth: 1 },
  islandHeader: { flexDirection: 'row', alignItems: 'center' },
  islandIconContainer: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(76, 175, 80, 0.2)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  islandTitle: { fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  islandSub: { fontSize: 10, fontWeight: '700', marginTop: 2 },
  islandToggle: { padding: 8 },
  islandContent: { marginTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', paddingTop: 12, gap: 8 },
  readyOrderRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
  readyOrderTable: { width: 24, height: 24, borderRadius: 6, backgroundColor: 'rgba(76, 175, 80, 0.2)', justifyContent: 'center', alignItems: 'center' },
  readyOrderTableText: { color: '#4CAF50', fontSize: 10, fontWeight: '900' },
  readyOrderText: { flex: 1, fontSize: 12, fontWeight: '700' },
  
  islandActions: { flexDirection: 'row', gap: 8 },
  islandActionBtn: { backgroundColor: 'rgba(244, 67, 54, 0.2)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  islandActionText: { color: '#F44336', fontSize: 10, fontWeight: '900' },

  tabsContainer: { paddingHorizontal: MB_SPACING.lg, marginBottom: 20 },
  tabs: { flexDirection: 'row', borderRadius: 16, padding: 4 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 10, borderRadius: 12 },
  tabText: { fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  tabBadge: { position: 'absolute', top: -8, right: -8, backgroundColor: '#F44336', width: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#0A1128' },
  tabBadgeText: { color: 'white', fontSize: 8, fontWeight: '900' },

  content: { flex: 1 },
  scrollContent: { paddingHorizontal: MB_SPACING.lg, paddingBottom: 40 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  tableCard: { width: (width - MB_SPACING.lg * 2 - 12) / 2, borderRadius: 20, borderWidth: 1, overflow: 'hidden' },
  tableHeader: { padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1 },
  tableNumber: { fontSize: 20, fontWeight: '900' },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  tableBody: { padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tableStatus: { fontSize: 10, fontWeight: '800' },
  tableIconBadge: { width: 24, height: 24, borderRadius: 8, backgroundColor: 'rgba(255, 215, 0, 0.1)', justifyContent: 'center', alignItems: 'center' },

  ordersList: { gap: 12 },
  orderCard: { padding: 16, borderRadius: 24, borderWidth: 1 },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  orderTableBadge: { backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  orderTableText: { color: 'white', fontSize: 10, fontWeight: '900' },
  orderStatusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  orderStatusText: { fontSize: 10, fontWeight: '900' },
  orderItems: { gap: 4, marginBottom: 12 },
  orderItemText: { fontSize: 13, fontWeight: '600', opacity: 0.8 },
  orderFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', paddingTop: 12 },
  orderTime: { fontSize: 11, fontWeight: '700' },

  emptyState: { alignItems: 'center', paddingVertical: 60, opacity: 0.5 },
  emptyText: { marginTop: 12, fontSize: 12, fontWeight: '800', textTransform: 'uppercase' },
  pulse: { opacity: 1 },
  actionBtnSmall: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  mergeBar: { 
    position: 'absolute', 
    bottom: 30, 
    left: 16, 
    right: 16, 
    borderRadius: 28, 
    overflow: 'hidden',
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.1)', 
    zIndex: 100 
  },
  mergeBarBlur: {
    padding: 16,
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
  },
  mergeBarInfo: {
    flex: 1,
    marginRight: 10,
  },
  mergeBarText: { color: 'white', fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
  mergeBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  mergeBtnText: { color: 'white', fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
});

export default function WaiterDashboard() {
  const { restaurantId, user, signOut } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<'mesas' | 'pedidos'>('mesas');
  const [isIslandExpanded, setIsIslandExpanded] = React.useState(false);
  
  // Merge Mode State
  const [mergeMode, setMergeMode] = React.useState(false);
  const [selectedTables, setSelectedTables] = React.useState<string[]>([]);
  const [isAlertModalVisible, setIsAlertModalVisible] = React.useState(false);
  const [merging, setMerging] = React.useState(false);

  // Data State
  const [tables, setTables] = React.useState<any[]>([]);
  const [orders, setOrders] = React.useState<any[]>([]);

  const fetchData = React.useCallback(async () => {
    if (!restaurantId) return;
    
    try {
      // Fetch Tables
      const { data: tablesData, error: tablesError } = await supabase
        .from('tables')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('number', { ascending: true });

      if (tablesError) throw tablesError;
      setTables(tablesData || []);

      // Fetch Orders (Pending, Validated, Preparing, Ready)
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          tables(number),
          order_items(
            id, 
            quantity, 
            menu_items(name)
          )
        `)
        .eq('restaurant_id', restaurantId)
        .in('status', ['PENDING', 'VALIDATED', 'PREPARING', 'READY'])
        .order('createdAt', { ascending: true });

      if (ordersError) throw ordersError;
      setOrders(ordersData || []);

    } catch (err) {
      console.error('Error fetching waiter data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [restaurantId]);

  React.useEffect(() => {
    fetchData();

    if (!restaurantId) return;

    // Realtime Subscriptions
    const tablesChannel = supabase.channel(`waiter-tables-${restaurantId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tables', filter: `restaurant_id=eq.${restaurantId}` }, () => fetchData())
      .subscribe();

    const ordersChannel = supabase.channel(`waiter-orders-${restaurantId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `restaurant_id=eq.${restaurantId}` }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(tablesChannel);
      supabase.removeChannel(ordersChannel);
    };
  }, [restaurantId, fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // Derived State
  const readyOrders = orders.filter(o => o.status === 'READY');
  const readyTableIds = React.useMemo(() => new Set(readyOrders.map(o => o.table_id)), [readyOrders]);
  const readyTablesList = React.useMemo(() => {
    const tableNums = Array.from(new Set(readyOrders.map(o => o.tables?.number).filter(Boolean)));
    return tableNums.length > 0 ? `Mesas: ${tableNums.join(', ')}` : 'Cargando...';
  }, [readyOrders]);
  
  // session_id → números de todas las mesas del grupo (cualquier status)
  const mergedNumbersBySession = React.useMemo(() => {
    const map: Record<string, number[]> = {};
    tables.forEach(t => {
      if (t.current_session_id) {
        if (!map[t.current_session_id]) map[t.current_session_id] = [];
        map[t.current_session_id].push(t.number);
      }
    });
    // Descartar sesiones con una sola mesa (no son grupos)
    Object.keys(map).forEach(k => { if (map[k].length < 2) delete map[k]; });
    return map;
  }, [tables]);
  
  const helpRequestedTables = tables.filter(t => t.help_requested);
  const billRequestedTables = tables.filter(t => t.bill_requested);
  const cleaningTables = tables.filter(t => t.status === 'CLEANING');
  const pendingOrders = orders.filter(o => o.status === 'PENDING');
  const preparingOrders = orders.filter(o => o.status === 'VALIDATED' || o.status === 'PREPARING');

  const handleDeliver = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'DELIVERED' })
        .eq('id', orderId);
      if (error) throw error;
      fetchData();
    } catch (err) {
      Alert.alert('Error', 'No se pudo marcar como entregado');
    }
  };

  const handleHelpComplete = async (tableId: string) => {
    await supabase.from('tables').update({ help_requested: false }).eq('id', tableId);
    fetchData();
  };

  const handleTableClean = async (tableId: string) => {
    await supabase.from('tables')
      .update({ 
        status: 'FREE', 
        bill_requested: false,
        current_session_id: null 
      })
      .eq('id', tableId);
    fetchData();
  };

  const handleValidateOrder = async (orderId: string) => {
    await supabase.from('orders').update({ status: 'VALIDATED', validated_at: new Date().toISOString() }).eq('id', orderId);
    fetchData();
  };

  const handleRejectOrder = async (orderId: string, tableId: string) => {
    Alert.alert('Rechazar Pedido', '¿Por qué rechazas este pedido?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Error cliente', style: 'destructive', onPress: async () => {
        await supabase.from('orders').update({ status: 'REJECTED' }).eq('id', orderId);
        // If it was the only order, we might want to free the table, but usually we just reject the order
        fetchData();
      }}
    ]);
  };

  const handleMergeTables = async () => {
    if (!restaurantId || selectedTables.length < 2) return;
    setMerging(true);
    try {
      // 1. Obtener session_ids actuales de las mesas seleccionadas
      const { data: tableRows, error: fetchErr } = await supabase
        .from('tables')
        .select('id, current_session_id')
        .in('id', selectedTables);

      if (fetchErr) throw fetchErr;

      const existingSessions = [
        ...new Set(
          (tableRows ?? [])
            .map((t: any) => t.current_session_id)
            .filter(Boolean)
        ),
      ] as string[];

      let winningSessionId: string;

      if (existingSessions.length === 0) {
        // Ninguna mesa tiene sesión activa — crear nueva
        winningSessionId = uuidv4();
      } else if (existingSessions.length === 1) {
        // Todas apuntan a la misma sesión — reutilizar
        winningSessionId = existingSessions[0];
      } else {
        // Conflicto: múltiples sesiones — gana la que tiene el pedido más antiguo
        const { data: oldest } = await supabase
          .from('orders')
          .select('session_id, createdAt')
          .in('session_id', existingSessions)
          .not('status', 'in', '("REJECTED")')
          .order('createdAt', { ascending: true })
          .limit(1);

        winningSessionId =
          oldest && oldest.length > 0
            ? oldest[0].session_id
            : existingSessions[0];

        // Reasignar pedidos de sesiones perdedoras a la ganadora (incluye DELIVERED para historial unificado)
        const losingSessions = existingSessions.filter(s => s !== winningSessionId);
        const { error: reassignErr } = await supabase
          .from('orders')
          .update({ session_id: winningSessionId })
          .in('session_id', losingSessions)
          .not('status', 'in', '("REJECTED")');

        if (reassignErr) throw reassignErr;
      }

      // 2. Sincronizar pedidos de mesas sin sesión previa a la sesión ganadora
      const { error: orderErr } = await supabase
        .from('orders')
        .update({ session_id: winningSessionId })
        .in('table_id', selectedTables)
        .eq('restaurant_id', restaurantId!)
        .not('status', 'in', '("REJECTED")');

      if (orderErr) throw orderErr;

      // 3. Actualizar todas las mesas seleccionadas a la sesión ganadora
      const { error: tableErr } = await supabase
        .from('tables')
        .update({ current_session_id: winningSessionId })
        .in('id', selectedTables)
        .eq('restaurant_id', restaurantId!);

      if (tableErr) throw tableErr;

      Alert.alert('Éxito', 'Mesas fusionadas correctamente');
      setMergeMode(false);
      setSelectedTables([]);
      fetchData();
    } catch (err) {
      Alert.alert('Error', 'No se pudieron fusionar las mesas');
    } finally {
      setMerging(false);
    }
  };

  const handleUnmergeTables = async () => {
    if (!restaurantId || selectedTables.length === 0) return;
    setMerging(true);
    try {
      // Obtener session_ids de las mesas seleccionadas para limpiar el grupo completo
      const { data: tableRows, error: fetchErr } = await supabase
        .from('tables')
        .select('id, current_session_id')
        .in('id', selectedTables);

      if (fetchErr) throw fetchErr;

      const sessionsToDissolve = [
        ...new Set(
          (tableRows ?? [])
            .map((t: any) => t.current_session_id)
            .filter(Boolean)
        ),
      ] as string[];

      if (sessionsToDissolve.length > 0) {
        // Limpiar session_id de TODAS las mesas del grupo (no solo las seleccionadas)
        const { error: tableErr } = await supabase
          .from('tables')
          .update({ current_session_id: null })
          .in('current_session_id', sessionsToDissolve)
          .eq('restaurant_id', restaurantId!);

        if (tableErr) throw tableErr;

        // Limpiar session_id de pedidos activos del grupo (mantiene DELIVERED para historial)
        const { error: orderErr } = await supabase
          .from('orders')
          .update({ session_id: null })
          .in('session_id', sessionsToDissolve)
          .not('status', 'in', '("DELIVERED","REJECTED")');

        if (orderErr) throw orderErr;
      }

      Alert.alert('Éxito', 'Mesas separadas correctamente');
      setMergeMode(false);
      setSelectedTables([]);
      fetchData();
    } catch (err) {
      Alert.alert('Error', 'No se pudieron separar las mesas');
    } finally {
      setMerging(false);
    }
  };

  const toggleMergeMode = () => {
    setMergeMode(!mergeMode);
    setSelectedTables([]);
  };

  const handleTablePress = (table: any) => {
    if (mergeMode) {
      setSelectedTables(prev => 
        prev.includes(table.id) ? prev.filter(id => id !== table.id) : [...prev, table.id]
      );
    } else {
      router.push(`/(waiter)/table/${table.id}`);
    }
  };

  const handleNewAlert = async (type: string, message: string, tableNum?: string) => {
    try {
      const { error } = await supabase.from('alerts').insert({
        restaurant_id: restaurantId,
        user_id: user?.id,
        user_email: user?.email,
        type: type,
        message: message,
        table_number: tableNum ? parseInt(tableNum) : null,
        status: 'PENDING'
      });
      
      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Error sending alert:', err);
      Alert.alert('Error', 'No se pudo enviar la alerta');
      return false;
    }
  };

  const handleSignOut = () => {
    Alert.alert('Cerrar Sesión', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: signOut }
    ]);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return '#FF9800';
      case 'VALIDATED': return '#2196F3';
      case 'PREPARING': return '#9C27B0';
      case 'READY': return '#4CAF50';
      default: return '#757575';
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.navy }]}>
        <ActivityIndicator color={colors.brandAccent} size="large" />
        <Text style={[styles.loadingText, { color: colors.muted }]}>Conectando con Salón...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.navy }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Terminal <Text style={{ color: colors.brandAccent }}>Garzón</Text>
          </Text>
          <View style={styles.statusBadge}>
            <View style={styles.onlineDot} />
            <Text style={[styles.statusText, { color: colors.muted }]}>EN LÍNEA</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {activeTab === 'mesas' && (
            <TouchableOpacity onPress={toggleMergeMode} style={[styles.logoutBtn, { backgroundColor: mergeMode ? 'rgba(254, 95, 85, 0.2)' : 'rgba(255, 255, 255, 0.05)' }]}>
              <Link2 size={18} color={mergeMode ? '#FE5F55' : colors.muted} />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => setIsAlertModalVisible(true)} style={[styles.logoutBtn, { backgroundColor: 'rgba(255, 152, 0, 0.1)' }]}>
            <AlertTriangle size={18} color="#FF9800" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSignOut} style={[styles.logoutBtn, { backgroundColor: 'rgba(244, 67, 54, 0.1)' }]}>
            <LogOut size={18} color="#F44336" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Operation Islands */}
      <View style={styles.islandsContainer}>
        {readyOrders.length > 0 && (
          <Animated.View entering={FadeInUp} layout={Layout.springify()} style={[styles.island, { backgroundColor: 'rgba(76, 175, 80, 0.1)', borderColor: 'rgba(76, 175, 80, 0.2)' }]}>
            <View style={styles.islandHeader}>
              <View style={styles.islandIconContainer}>
                <Sparkles size={20} color="#4CAF50" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.islandTitle}>PLATOS LISTOS</Text>
                <Text style={styles.islandSub}>{readyTablesList}</Text>
              </View>
              <TouchableOpacity onPress={() => setIsIslandExpanded(!isIslandExpanded)} style={styles.islandToggle}>
                <Animated.View style={{ transform: [{ rotate: isIslandExpanded ? '180deg' : '0deg' }] }}>
                  <ChevronDown size={20} color="#4CAF50" />
                </Animated.View>
              </TouchableOpacity>
            </View>
            {isIslandExpanded && (
              <View style={styles.islandContent}>
                {readyOrders.map(order => (
                  <TouchableOpacity 
                    key={order.id} 
                    style={styles.readyOrderRow}
                    onPress={() => handleDeliver(order.id)}
                  >
                    <View style={styles.readyOrderTable}>
                      <Text style={styles.readyOrderTableText}>{order.tables?.number}</Text>
                    </View>
                    <Text style={[styles.readyOrderText, { color: colors.text }]} numberOfLines={1}>
                      {order.order_items.map((it: any) => `${it.quantity}x ${it.menu_items.name}`).join(', ')}
                    </Text>
                    <CheckCircle2 size={16} color="#4CAF50" />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </Animated.View>
        )}

        {helpRequestedTables.length > 0 && (
          <Animated.View entering={FadeInLeft} layout={Layout.springify()} style={[styles.island, { backgroundColor: 'rgba(244, 67, 54, 0.1)', borderColor: 'rgba(244, 67, 54, 0.2)' }]}>
             <View style={styles.islandHeader}>
              <Bell size={20} color="#F44336" style={styles.pulse} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.islandTitle, { color: '#F44336' }]}>AYUDA SOLICITADA</Text>
                <Text style={[styles.islandSub, { color: 'rgba(244, 67, 54, 0.6)' }]}>{helpRequestedTables.length} mesa(s) esperando</Text>
              </View>
              <View style={styles.islandActions}>
                {helpRequestedTables.slice(0, 2).map(t => (
                  <TouchableOpacity key={t.id} onPress={() => handleHelpComplete(t.id)} style={styles.islandActionBtn}>
                    <Text style={styles.islandActionText}>Mesa {t.number} ✓</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </Animated.View>
        )}

        {cleaningTables.length > 0 && (
          <Animated.View entering={FadeInLeft} layout={Layout.springify()} style={[styles.island, { backgroundColor: 'rgba(33, 150, 243, 0.1)', borderColor: 'rgba(33, 150, 243, 0.2)' }]}>
             <View style={styles.islandHeader}>
              <RefreshCw size={20} color="#2196F3" />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.islandTitle, { color: '#2196F3' }]}>LIMPIEZA</Text>
                <Text style={[styles.islandSub, { color: 'rgba(33, 150, 243, 0.6)' }]}>{cleaningTables.length} pendiente(s)</Text>
              </View>
              <View style={styles.islandActions}>
                {cleaningTables.slice(0, 2).map(t => (
                  <TouchableOpacity key={t.id} onPress={() => handleTableClean(t.id)} style={[styles.islandActionBtn, { backgroundColor: 'rgba(33, 150, 243, 0.2)' }]}>
                    <Text style={[styles.islandActionText, { color: '#2196F3' }]}>Mesa {t.number} ✓</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </Animated.View>
        )}

        {billRequestedTables.length > 0 && (
          <Animated.View entering={FadeInLeft} layout={Layout.springify()} style={[styles.island, { backgroundColor: 'rgba(255, 215, 0, 0.1)', borderColor: 'rgba(255, 215, 0, 0.2)' }]}>
             <View style={styles.islandHeader}>
              <Receipt size={20} color="#FFD700" />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.islandTitle, { color: '#FFD700' }]}>CUENTAS SOLICITADAS</Text>
                <Text style={[styles.islandSub, { color: 'rgba(255, 215, 0, 0.6)' }]}>{billRequestedTables.length} mesa(s) por cobrar</Text>
              </View>
              <View style={styles.islandActions}>
                {billRequestedTables.slice(0, 2).map(t => (
                  <TouchableOpacity key={t.id} style={[styles.islandActionBtn, { backgroundColor: 'rgba(255, 215, 0, 0.2)' }]}>
                    <Text style={[styles.islandActionText, { color: '#FFD700' }]}>Mesa {t.number}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </Animated.View>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <View style={[styles.tabs, { backgroundColor: colors.glass }]}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'mesas' && { backgroundColor: colors.brandAccent }]}
            onPress={() => setActiveTab('mesas')}
          >
            <LayoutDashboard size={16} color={activeTab === 'mesas' ? 'white' : colors.muted} />
            <Text style={[styles.tabText, { color: activeTab === 'mesas' ? 'white' : colors.muted }]}>MESAS</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'pedidos' && { backgroundColor: colors.brandAccent }]}
            onPress={() => setActiveTab('pedidos')}
          >
            <View>
              <Clock size={16} color={activeTab === 'pedidos' ? 'white' : colors.muted} />
              {pendingOrders.length > 0 && (
                <View style={styles.tabBadge}>
                  <Text style={styles.tabBadgeText}>{pendingOrders.length}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.tabText, { color: activeTab === 'pedidos' ? 'white' : colors.muted }]}>PEDIDOS</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brandAccent} />}
      >
        {activeTab === 'mesas' ? (
          <View style={styles.grid}>
            {tables.map((table, i) => (
              <Animated.View key={table.id} entering={FadeInDown.delay(i * 50)}>
                <TouchableOpacity 
                  style={[
                    styles.tableCard, 
                    { backgroundColor: colors.glass, borderColor: colors.glassHeavy },
                    table.status === 'OCCUPIED' && { borderColor: colors.brandAccent + '40' },
                    !!mergedNumbersBySession[table.current_session_id] && { backgroundColor: colors.brandAccent + '10', borderColor: colors.brandAccent + '80' },
                    selectedTables.includes(table.id) && { borderColor: '#FE5F55', backgroundColor: 'rgba(254, 95, 85, 0.1)' }
                  ]}
                  onPress={() => handleTablePress(table)}
                >
                  <View style={[styles.tableHeader, { borderBottomColor: colors.glassHeavy }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={[styles.tableNumber, { color: colors.text }]}>{table.number}</Text>
                      {!!mergedNumbersBySession[table.current_session_id] && (
                        <View style={{ backgroundColor: colors.brandAccent, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                          <Link2 size={8} color="white" />
                          <Text style={{ color: 'white', fontSize: 8, fontWeight: '900' }}>FUSIÓN</Text>
                        </View>
                      )}
                    </View>
                    <View style={[styles.statusDot, { backgroundColor: table.status === 'FREE' ? '#4CAF50' : '#FF9800' }]} />
                  </View>

                  <View style={styles.tableBody}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.tableStatus, { color: colors.muted }]}>
                        {table.status === 'FREE' ? 'LIBRE' : 'OCUPADA'}
                      </Text>
                      {table.current_session_id && mergedNumbersBySession[table.current_session_id] && (
                        <Text style={{ color: colors.brandAccent, fontSize: 9, fontWeight: '900', marginTop: 3 }} numberOfLines={1}>
                          + {mergedNumbersBySession[table.current_session_id]
                              .filter(n => n !== table.number)
                              .map(n => `M.${n}`)
                              .join(', ')}
                        </Text>
                      )}
                    </View>
                    <View style={{ flexDirection: 'row', gap: 4 }}>
                      {table.bill_requested && (
                        <View style={styles.tableIconBadge}>
                          <Receipt size={14} color="#FFD700" />
                        </View>
                      )}
                      {readyTableIds.has(table.id) && (
                        <View style={[styles.tableIconBadge, { backgroundColor: 'rgba(76, 175, 80, 0.1)' }]}>
                          <Sparkles size={14} color="#4CAF50" />
                        </View>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        ) : (
          <View style={styles.ordersList}>
            {orders.length === 0 ? (
              <View style={styles.emptyState}>
                <UtensilsCrossed size={48} color={colors.glassHeavy} />
                <Text style={[styles.emptyText, { color: colors.muted }]}>No hay pedidos activos</Text>
              </View>
            ) : (
              orders.map((order, i) => (
                <Animated.View key={order.id} entering={FadeInDown.delay(i * 50)} style={[styles.orderCard, { backgroundColor: colors.glass, borderColor: colors.glassHeavy }]}>
                  <View style={styles.orderHeader}>
                    <View style={styles.orderTableBadge}>
                      <Text style={styles.orderTableText}>MESA {order.tables?.number}</Text>
                    </View>
                    <View style={[styles.orderStatusBadge, { backgroundColor: getStatusColor(order.status) + '20' }]}>
                      <Text style={[styles.orderStatusText, { color: getStatusColor(order.status) }]}>{order.status}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.orderItems}>
                    {order.order_items.map((it: any) => (
                      <Text key={it.id} style={[styles.orderItemText, { color: colors.text }]}>
                        • {it.quantity}x {it.menu_items.name}
                      </Text>
                    ))}
                  </View>

                    <View style={styles.orderFooter}>
                    <Text style={[styles.orderTime, { color: colors.muted }]}>
                      {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                    {order.status === 'PENDING' ? (
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        <TouchableOpacity onPress={() => handleRejectOrder(order.id, order.table_id)} style={[styles.actionBtnSmall, { backgroundColor: 'rgba(244, 67, 54, 0.1)' }]}>
                          <XCircle size={14} color="#F44336" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleValidateOrder(order.id)} style={[styles.actionBtnSmall, { backgroundColor: 'rgba(76, 175, 80, 0.1)' }]}>
                          <CheckCircle2 size={14} color="#4CAF50" />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity onPress={() => router.push(`/(waiter)/table/${order.table_id}`)}>
                        <Text style={{ color: colors.brandAccent, fontWeight: '800', fontSize: 12 }}>VER MESA <ChevronRight size={12} color={colors.brandAccent} /></Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </Animated.View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* Merge Mode Bar */}
      {mergeMode && (
        <Animated.View entering={SlideInDown} style={styles.mergeBar}>
          <BlurView intensity={80} tint="dark" style={styles.mergeBarBlur}>
            <View style={styles.mergeBarInfo}>
              <Text style={styles.mergeBarText}>GESTIÓN DE MESAS</Text>
              <Text style={{ color: colors.muted, fontSize: 9, fontWeight: '700' }}>{selectedTables.length} seleccionadas</Text>
            </View>
            
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <TouchableOpacity onPress={toggleMergeMode} style={{ padding: 8 }}>
                <XCircle size={20} color={colors.muted} />
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={handleUnmergeTables} 
                style={[styles.mergeBtn, { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: colors.brandAccent + '40' }, selectedTables.length === 0 && { opacity: 0.3 }]}
                disabled={selectedTables.length === 0 || merging}
              >
                <Text style={[styles.mergeBtnText, { color: colors.brandAccent }]}>SEPARAR</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={handleMergeTables} 
                style={[styles.mergeBtn, { backgroundColor: colors.brandAccent }, selectedTables.length < 2 && { opacity: 0.3 }]}
                disabled={selectedTables.length < 2 || merging}
              >
                {merging ? <ActivityIndicator color="white" size="small" /> : <Text style={styles.mergeBtnText}>FUSIONAR</Text>}
              </TouchableOpacity>
            </View>
          </BlurView>
        </Animated.View>
      )}
      <AlertModal 
        visible={isAlertModalVisible}
        onClose={() => setIsAlertModalVisible(false)}
        onSend={handleNewAlert}
      />
    </View>
  );
}
