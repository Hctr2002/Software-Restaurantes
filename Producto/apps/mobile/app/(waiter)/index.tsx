import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { LayoutDashboard, Clock } from 'lucide-react-native';
import { MB_SPACING } from '../../constants/MB_Theme';
import { supabase } from '../../lib/supabase';
import { uuidv4 } from '../../lib/uuid';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useRouter } from 'expo-router';
import AlertModal from '../../components/AlertModal';

import { WaiterHeader } from './_components/WaiterHeader';
import { WaiterIslands } from './_components/WaiterIslands';
import { TableGrid } from './_components/TableGrid';
import { OrdersList } from './_components/OrdersList';
import { MergeBar } from './_components/MergeBar';
import { TipModal } from './_components/TipModal';

export default function WaiterDashboard() {
  const { restaurantId, user, signOut } = useAuth();
  const { colors, isLight } = useTheme();
  const router = useRouter();

  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<'mesas' | 'pedidos'>('mesas');
  const [isIslandExpanded, setIsIslandExpanded] = React.useState(false);
  const [mergeMode, setMergeMode] = React.useState(false);
  const [selectedTables, setSelectedTables] = React.useState<string[]>([]);
  const [isAlertModalVisible, setIsAlertModalVisible] = React.useState(false);
  const [merging, setMerging] = React.useState(false);
  const [tipModalTable, setTipModalTable] = React.useState<any | null>(null);
  const [tables, setTables] = React.useState<any[]>([]);
  const [orders, setOrders] = React.useState<any[]>([]);

  const fetchData = React.useCallback(async () => {
    if (!restaurantId) return;
    try {
      const { data: tablesData, error: tablesError } = await supabase
        .from('tables')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('number', { ascending: true });
      if (tablesError) throw tablesError;
      setTables(tablesData || []);

      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*, tables(number), order_items(id, quantity, menu_items(name))')
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

  // Derived state
  const readyOrders = orders.filter(o => o.status === 'READY');
  const readyTableIds = React.useMemo(() => new Set(readyOrders.map(o => o.table_id)), [readyOrders]);
  const readyTablesList = React.useMemo(() => {
    const nums = Array.from(new Set(readyOrders.map(o => o.tables?.number).filter(Boolean)));
    return nums.length > 0 ? `Mesas: ${nums.join(', ')}` : 'Cargando...';
  }, [readyOrders]);

  const mergedNumbersBySession = React.useMemo(() => {
    const map: Record<string, number[]> = {};
    tables.forEach(t => {
      if (t.current_session_id) {
        if (!map[t.current_session_id]) map[t.current_session_id] = [];
        map[t.current_session_id].push(t.number);
      }
    });
    Object.keys(map).forEach(k => { if (map[k].length < 2) delete map[k]; });
    return map;
  }, [tables]);

  const helpRequestedTables = tables.filter(t => t.help_requested);
  const billRequestedTables = tables.filter(t => t.bill_requested);
  const cleaningTables = tables.filter(t => t.status === 'CLEANING');
  const pendingOrders = orders.filter(o => o.status === 'PENDING');

  // Handlers
  const handleDeliver = async (orderId: string) => {
    try {
      const { error } = await supabase.from('orders').update({ status: 'DELIVERED' }).eq('id', orderId);
      if (error) throw error;
      fetchData();
    } catch {
      Alert.alert('Error', 'No se pudo marcar como entregado');
    }
  };

  const handleHelpComplete = async (tableId: string) => {
    await supabase.from('tables').update({ help_requested: false }).eq('id', tableId);
    fetchData();
  };

  const handleConfirmTip = async (tableId: string, includeTip: boolean) => {
    await supabase.from('tables').update({ tip_included: includeTip }).eq('id', tableId);
    setTipModalTable(null);
    fetchData();
  };

  const handleTableClean = async (tableId: string) => {
    await supabase.from('tables').update({ status: 'FREE', bill_requested: false, current_session_id: null }).eq('id', tableId);
    fetchData();
  };

  const handleValidateOrder = async (orderId: string) => {
    await supabase.from('orders').update({ status: 'VALIDATED', validated_at: new Date().toISOString() }).eq('id', orderId);
    fetchData();
  };

  const handleRejectOrder = async (orderId: string, _tableId: string) => {
    Alert.alert('Rechazar Pedido', '¿Por qué rechazas este pedido?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Error cliente', style: 'destructive', onPress: async () => {
        await supabase.from('orders').update({ status: 'REJECTED' }).eq('id', orderId);
        fetchData();
      }},
    ]);
  };

  const handleMergeTables = async () => {
    if (!restaurantId || selectedTables.length < 2) return;
    setMerging(true);
    try {
      const { data: tableRows, error: fetchErr } = await supabase
        .from('tables').select('id, current_session_id').in('id', selectedTables);
      if (fetchErr) throw fetchErr;

      const existingSessions = [...new Set((tableRows ?? []).map((t: any) => t.current_session_id).filter(Boolean))] as string[];
      let winningSessionId: string;

      if (existingSessions.length === 0) {
        winningSessionId = uuidv4();
      } else if (existingSessions.length === 1) {
        winningSessionId = existingSessions[0];
      } else {
        const { data: oldest } = await supabase
          .from('orders').select('session_id, createdAt')
          .in('session_id', existingSessions)
          .not('status', 'in', '("REJECTED")')
          .order('createdAt', { ascending: true }).limit(1);
        winningSessionId = (oldest && oldest.length > 0) ? oldest[0].session_id : existingSessions[0];

        const losingSessions = existingSessions.filter(s => s !== winningSessionId);
        const { error: reassignErr } = await supabase
          .from('orders').update({ session_id: winningSessionId })
          .in('session_id', losingSessions).not('status', 'in', '("REJECTED")');
        if (reassignErr) throw reassignErr;
      }

      const { error: orderErr } = await supabase
        .from('orders').update({ session_id: winningSessionId })
        .in('table_id', selectedTables).eq('restaurant_id', restaurantId!).not('status', 'in', '("REJECTED")');
      if (orderErr) throw orderErr;

      const { error: tableErr } = await supabase
        .from('tables').update({ current_session_id: winningSessionId })
        .in('id', selectedTables).eq('restaurant_id', restaurantId!);
      if (tableErr) throw tableErr;

      Alert.alert('Éxito', 'Mesas fusionadas correctamente');
      setMergeMode(false);
      setSelectedTables([]);
      fetchData();
    } catch {
      Alert.alert('Error', 'No se pudieron fusionar las mesas');
    } finally {
      setMerging(false);
    }
  };

  const handleUnmergeTables = async () => {
    if (!restaurantId || selectedTables.length === 0) return;
    setMerging(true);
    try {
      const { data: tableRows, error: fetchErr } = await supabase
        .from('tables').select('id, current_session_id').in('id', selectedTables);
      if (fetchErr) throw fetchErr;

      const sessionsToDissolve = [...new Set((tableRows ?? []).map((t: any) => t.current_session_id).filter(Boolean))] as string[];
      if (sessionsToDissolve.length > 0) {
        const { error: tableErr } = await supabase
          .from('tables').update({ current_session_id: null })
          .in('current_session_id', sessionsToDissolve).eq('restaurant_id', restaurantId!);
        if (tableErr) throw tableErr;

        const { error: orderErr } = await supabase
          .from('orders').update({ session_id: null })
          .in('session_id', sessionsToDissolve).not('status', 'in', '("DELIVERED","REJECTED")');
        if (orderErr) throw orderErr;
      }

      Alert.alert('Éxito', 'Mesas separadas correctamente');
      setMergeMode(false);
      setSelectedTables([]);
      fetchData();
    } catch {
      Alert.alert('Error', 'No se pudieron separar las mesas');
    } finally {
      setMerging(false);
    }
  };

  const toggleMergeMode = () => { setMergeMode(m => !m); setSelectedTables([]); };

  const handleTablePress = (table: any) => {
    if (mergeMode) {
      setSelectedTables(prev => prev.includes(table.id) ? prev.filter(id => id !== table.id) : [...prev, table.id]);
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
        type,
        message,
        table_number: tableNum ? parseInt(tableNum) : null,
        status: 'PENDING',
      });
      if (error) throw error;
      return true;
    } catch {
      Alert.alert('Error', 'No se pudo enviar la alerta');
      return false;
    }
  };

  const handleSignOut = () => {
    Alert.alert('Cerrar Sesión', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: signOut },
    ]);
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
      <WaiterHeader
        colors={colors}
        mergeMode={mergeMode}
        activeTab={activeTab}
        onToggleMergeMode={toggleMergeMode}
        onOpenAlerts={() => setIsAlertModalVisible(true)}
        onSignOut={handleSignOut}
      />

      <WaiterIslands
        colors={colors}
        readyOrders={readyOrders}
        readyTablesList={readyTablesList}
        helpRequestedTables={helpRequestedTables}
        cleaningTables={cleaningTables}
        billRequestedTables={billRequestedTables}
        isIslandExpanded={isIslandExpanded}
        onToggleIsland={() => setIsIslandExpanded(e => !e)}
        onDeliver={handleDeliver}
        onHelpComplete={handleHelpComplete}
        onTableClean={handleTableClean}
        onSetTipTable={setTipModalTable}
      />

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
                <View style={[styles.tabBadge, { borderColor: colors.navy }]}>
                  <Text style={styles.tabBadgeText}>{pendingOrders.length}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.tabText, { color: activeTab === 'pedidos' ? 'white' : colors.muted }]}>PEDIDOS</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor={colors.brandAccent} />}
      >
        {activeTab === 'mesas' ? (
          <TableGrid
            tables={tables}
            mergeMode={mergeMode}
            selectedTables={selectedTables}
            colors={colors}
            readyTableIds={readyTableIds}
            mergedNumbersBySession={mergedNumbersBySession}
            onTablePress={handleTablePress}
          />
        ) : (
          <OrdersList
            orders={orders}
            colors={colors}
            onValidate={handleValidateOrder}
            onReject={handleRejectOrder}
          />
        )}
      </ScrollView>

      {mergeMode && (
        <MergeBar
          colors={colors}
          isLight={isLight}
          selectedTables={selectedTables}
          merging={merging}
          onClose={toggleMergeMode}
          onMerge={handleMergeTables}
          onUnmerge={handleUnmergeTables}
        />
      )}

      <AlertModal
        visible={isAlertModalVisible}
        onClose={() => setIsAlertModalVisible(false)}
        onSend={handleNewAlert}
      />

      <TipModal
        table={tipModalTable}
        colors={colors}
        isLight={isLight}
        onClose={() => setTipModalTable(null)}
        onConfirm={handleConfirmTip}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 12, fontWeight: '900', letterSpacing: 2 },
  tabsContainer: { paddingHorizontal: MB_SPACING.lg, marginBottom: 20 },
  tabs: { flexDirection: 'row', borderRadius: 16, padding: 4 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 10, borderRadius: 12 },
  tabText: { fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  tabBadge: { position: 'absolute', top: -8, right: -8, backgroundColor: '#F44336', width: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center', borderWidth: 2 },
  tabBadgeText: { color: 'white', fontSize: 8, fontWeight: '900' },
  content: { flex: 1 },
  scrollContent: { paddingHorizontal: MB_SPACING.lg, paddingBottom: 40 },
});
