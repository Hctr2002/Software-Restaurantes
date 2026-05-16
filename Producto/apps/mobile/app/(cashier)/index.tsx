import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  StatusBar,
  RefreshControl,
  TextInput
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';
import { History, Clock, Search, Wallet, TrendingUp, X, AlertTriangle, LogOut } from 'lucide-react-native';
import { formatCurrency } from '../../lib/dashboard';
import CashierOrderCard from './_components/CashierOrderCard';
import PaymentModal from './_components/PaymentModal';
import CashierAlertModal from './_components/CashierAlertModal';
import { Alert } from 'react-native';
import Animated, { FadeInUp, FadeInRight } from 'react-native-reanimated';

type CashierTab = 'pending' | 'history';

function orderTotal(order: any): number {
  return (order.order_items ?? []).reduce((s: number, i: any) => s + Number(i.unit_price) * i.quantity, 0);
}

function groupOrders(orders: any[], billMap: Record<string, boolean>): any[] {
  const map = new Map<string, any>();
  for (const order of orders) {
    const key = order.session_id ?? order.table_id ?? order.id;
    if (!map.has(key)) {
      map.set(key, {
        key,
        tableId:          order.table_id ?? null,
        sessionId:        order.session_id ?? null,
        tableNumber:      order.tables?.number ?? null,
        orders:           [],
        total:            0,
        billRequested:    (order.table_id && billMap[order.table_id]) || false,
        oldestCreatedAt:  order.createdAt,
      });
    }
    const g = map.get(key)!;
    g.orders.push(order);
    g.total += orderTotal(order);
  }
  return Array.from(map.values());
}

export default function CashierDashboard() {
  const { restaurantId, user, signOut } = useAuth();
  const { colors, isLight } = useTheme();
  
  const [activeTab, setActiveTab] = useState<CashierTab>('pending');
  const [orders, setOrders] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [tables, setTables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  
  const [selectedGroup, setSelectedGroup] = useState<any | null>(null);
  const [isPaymentVisible, setIsPaymentVisible] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const [isAlertVisible, setIsAlertVisible] = useState(false);
  const [isSendingAlert, setIsSendingAlert] = useState(false);

  const fetchOrders = useCallback(async () => {
    if (!restaurantId) return;
    
    try {
      // Pending Orders
      const { data: pendingData, error: pErr } = await supabase
        .from('orders')
        .select(`*, tables(number), order_items(*, menu_items(name))`)
        .eq('restaurant_id', restaurantId)
        .in('status', ['PENDING', 'VALIDATED', 'PREPARING', 'READY', 'DELIVERED'])
        .order('createdAt', { ascending: true });

      if (pErr) throw pErr;

      // Today's History
      const todayStr = new Date().toISOString().split('T')[0] + 'T00:00:00.000Z';
      const { data: historyData } = await supabase
        .from('orders')
        .select(`*, tables(number), order_items(*, menu_items(name))`)
        .eq('restaurant_id', restaurantId)
        .eq('status', 'COMPLETED')
        .gte('createdAt', todayStr)
        .order('createdAt', { ascending: false })
        .limit(50);

      // Table Status (for bill requested)
      const { data: tableData } = await supabase
        .from('tables')
        .select('id, bill_requested')
        .eq('restaurant_id', restaurantId);

      setOrders(pendingData || []);
      setHistory(historyData || []);
      setTables(tableData || []);
    } catch (err) {
      console.error('[Cashier] Fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    fetchOrders();

    if (!restaurantId) return;

    const channel = supabase
      .channel(`cashier-realtime-${restaurantId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `restaurant_id=eq.${restaurantId}` }, () => fetchOrders())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tables', filter: `restaurant_id=eq.${restaurantId}` }, () => fetchOrders())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId, fetchOrders]);

  const billRequestedMap = useMemo(() => 
    Object.fromEntries(tables.map(t => [t.id, t.bill_requested])), 
  [tables]);

  const groups = useMemo(() => ({
    pending: groupOrders(orders, billRequestedMap),
    history: groupOrders(history, billRequestedMap)
  }), [orders, history, billRequestedMap]);

  const totals = useMemo(() => ({
    pending: groups.pending.reduce((s, g) => s + g.total, 0),
    history: groups.history.reduce((s, g) => s + g.total, 0)
  }), [groups]);

  const filteredGroups = useMemo(() => {
    const current = activeTab === 'pending' ? groups.pending : groups.history;
    if (!searchQuery) return current;
    
    const search = searchQuery.toLowerCase().trim();
    
    return current.filter(g => {
      const displayLabel = (g.sessionId ? "Mesas fusionadas" : `Mesa ${g.tableNumber ?? "S/N"}`).toLowerCase();
      const tableNumberStr = (g.tableNumber ?? '').toString().toLowerCase();
      
      return displayLabel.includes(search) || 
             tableNumberStr.includes(search) ||
             g.key.toLowerCase().includes(search);
    });
  }, [activeTab, groups, searchQuery]);

  const handleProcessPayment = async (reference: string) => {
    if (!selectedGroup) return;
    setIsProcessing(true);
    try {
      const orderIds = selectedGroup.orders.map((o: any) => o.id);
      
      const { error: oErr } = await supabase
        .from('orders')
        .update({ 
          status: 'COMPLETED', 
          notes: reference ? `Ref: ${reference}` : 'Pagado en Caja'
        })
        .in('id', orderIds);
        
      if (oErr) throw oErr;

      if (selectedGroup.tableId) {
        await supabase
          .from('tables')
          .update({ status: 'FREE', bill_requested: false })
          .eq('id', selectedGroup.tableId);
      }

      await fetchOrders();
      setIsPaymentVisible(false);
      setSelectedGroup(null);
    } catch (err) {
      console.error('[Cashier] Payment error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSendAlert = async (tableNum: string, message: string) => {
    if (!restaurantId) return;
    setIsSendingAlert(true);
    try {
      const { error } = await supabase
        .from('alerts')
        .insert({
          restaurant_id: restaurantId,
          user_id: user?.id,
          user_email: user?.email,
          type: 'HELP_REQUEST',
          message: message,
          table_number: tableNum ? parseInt(tableNum, 10) : null,
          status: 'PENDING'
        });
      
      if (error) throw error;
      
      Alert.alert('Alerta Enviada', 'El administrador ha sido notificado.');
      setIsAlertVisible(false);
    } catch (err) {
      console.error('[Cashier] Alert error:', err);
      Alert.alert('Error', 'No se pudo enviar la alerta.');
    } finally {
      setIsSendingAlert(false);
    }
  };

  const renderHeader = () => (
    <View style={[styles.header, { backgroundColor: colors.navy }]}>
      <View style={styles.headerTop}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.text, lineHeight: 22 }]}>
            CAJA{"\n"}
            <Text style={{ color: colors.brandAccent }}>REGISTRADORA</Text>
          </Text>
          <Text style={[styles.headerSub, { color: colors.muted, marginTop: 4 }]}>CONTROL DE COBROS</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={[styles.headerIconBtn, { backgroundColor: 'rgba(245, 158, 11, 0.1)', marginRight: 12 }]}
            onPress={() => setIsAlertVisible(true)}
          >
            <AlertTriangle size={20} color="#f59e0b" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.headerIconBtn, { backgroundColor: colors.glass }]}
            onPress={() => setShowSearch(!showSearch)}
          >
            <Search size={20} color={showSearch ? colors.brandAccent : colors.muted} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.headerIconBtn, { backgroundColor: 'rgba(239, 68, 68, 0.1)', marginLeft: 8 }]}
            onPress={() => signOut()}
          >
            <LogOut size={20} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>

      {showSearch && (
        <Animated.View entering={FadeInUp} style={styles.searchContainer}>
          <TextInput 
            style={[styles.searchInput, { backgroundColor: colors.glass, borderColor: colors.glassHeavy, color: colors.text }]}
            placeholder="Buscar por mesa..."
            placeholderTextColor={colors.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={[styles.clearSearch, { backgroundColor: colors.glassHeavy }]}>
              <X size={16} color={colors.muted} />
            </TouchableOpacity>
          )}
        </Animated.View>
      )}

      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: colors.glass }]}>
          <View style={styles.statHeader}>
            <Wallet size={14} color="#10b981" />
            <Text style={[styles.statLabel, { color: colors.muted }]}>PENDIENTE</Text>
          </View>
          <Text style={[styles.statValue, { color: '#10b981' }]}>{formatCurrency(totals.pending)}</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.glass }]}>
          <View style={styles.statHeader}>
            <TrendingUp size={14} color={colors.brandAccent} />
            <Text style={[styles.statLabel, { color: colors.muted }]}>COBRADO HOY</Text>
          </View>
          <Text style={[styles.statValue, { color: colors.text }]}>{formatCurrency(totals.history)}</Text>
        </View>
      </View>
    </View>
  );

  const renderTabs = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity 
        style={[styles.tab, activeTab === 'pending' && { backgroundColor: colors.brandAccent }]}
        onPress={() => setActiveTab('pending')}
      >
        <Clock size={16} color={activeTab === 'pending' ? 'white' : colors.muted} />
        <Text style={[styles.tabText, { color: activeTab === 'pending' ? 'white' : colors.muted }]}>PENDIENTES</Text>
        {groups.pending.length > 0 && (
          <View style={[styles.tabBadge, { backgroundColor: activeTab === 'pending' ? 'white' : colors.glassHeavy }]}>
            <Text style={[styles.tabBadgeText, { color: activeTab === 'pending' ? colors.brandAccent : colors.muted }]}>{groups.pending.length}</Text>
          </View>
        )}
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.tab, activeTab === 'history' && { backgroundColor: colors.glassHeavy }]}
        onPress={() => setActiveTab('history')}
      >
        <History size={16} color={activeTab === 'history' ? colors.text : colors.muted} />
        <Text style={[styles.tabText, { color: activeTab === 'history' ? colors.text : colors.muted }]}>HISTORIAL</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.navy }]}>
      <StatusBar barStyle={isLight ? 'dark-content' : 'light-content'} />
      {renderHeader()}
      {renderTabs()}

      {loading && !refreshing ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.brandAccent} size="large" />
          <Text style={[styles.loadingText, { color: colors.muted }]}>Sincronizando caja...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredGroups}
          keyExtractor={(item) => item.key}
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInRight.delay(index * 100)}>
              <CashierOrderCard 
                group={item} 
                index={index}
                isPending={activeTab === 'pending'}
                onPress={() => {
                  if (activeTab === 'pending') {
                    setSelectedGroup(item);
                    setIsPaymentVisible(true);
                  }
                }}
              />
            </Animated.View>
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchOrders(); }} tintColor={colors.brandAccent} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.muted }]}>
                {searchQuery ? "No se encontraron resultados" : activeTab === 'pending' ? "No hay cuentas listas para cobro" : "Sin cobros hoy"}
              </Text>
            </View>
          }
        />
      )}

      <PaymentModal 
        visible={isPaymentVisible}
        group={selectedGroup}
        isProcessing={isProcessing}
        onClose={() => setIsPaymentVisible(false)}
        onConfirm={handleProcessPayment}
      />

      <CashierAlertModal 
        visible={isAlertVisible}
        isSending={isSendingAlert}
        onClose={() => setIsAlertVisible(false)}
        onSend={handleSendAlert}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    fontStyle: 'italic',
  },
  headerSub: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    marginTop: 2,
  },
  headerIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchContainer: {
    position: 'relative',
  },
  searchInput: {
    height: 48,
    borderRadius: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  clearSearch: {
    position: 'absolute',
    right: 12,
    top: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 20,
    gap: 4,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '900',
    fontStyle: 'italic',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 12,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 12,
  },
  tabText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  tabBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  tabBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 12,
    fontWeight: '700',
  },
  emptyContainer: {
    marginTop: 100,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
  }
});
