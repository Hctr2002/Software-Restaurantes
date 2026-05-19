import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  StatusBar,
  RefreshControl
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';
import { Beer, LogOut, AlertTriangle, Settings } from 'lucide-react-native';
import KitchenOrderCard from '../(kitchen)/_components/KitchenOrderCard';
import OrderDetailModal, { OrderStatus } from '../../components/OrderDetailModal';
import StockAlertModal from '../(kitchen)/_components/StockAlertModal';
import KdsSettingsModal, { KdsSettings, DEFAULT_KDS_SETTINGS } from '../(kitchen)/_components/KdsSettingsModal';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { useKdsAudio } from '../../lib/useKdsAudio';

type BarTab = 'Nuevos' | 'Preparando' | 'Listos';

export default function BarDashboard() {
  const { restaurantId, signOut } = useAuth();
  const { colors, isLight } = useTheme();
  
  const [activeTab, setActiveTab] = useState<BarTab>('Nuevos');
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [clearedOrderIds, setClearedOrderIds] = useState<Set<string>>(new Set());
  
  // Modals Visibility
  const [isDetailVisible, setIsDetailVisible] = useState(false);
  const [isAlertVisible, setIsAlertVisible] = useState(false);
  const [isSettingsVisible, setIsSettingsVisible] = useState(false);
  
  // Bar Settings (Using KDS settings for now as they are shared/similar)
  const [settings, setSettings] = useState<KdsSettings>(DEFAULT_KDS_SETTINGS);
  const [tick, setTick] = useState(0);

  // Audio alerts
  const { playNewOrder, playUrgent } = useKdsAudio(true);
  const knownOrderIdsRef = useRef<Set<string>>(new Set());

  const fetchOrders = useCallback(async () => {
    if (!restaurantId) return;
    
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          tables(number),
          order_items(
            *,
            menu_items(name)
          )
        `)
        .eq('restaurant_id', restaurantId)
        .eq('station', 'BAR')
        .in('status', ['VALIDATED', 'PREPARING', 'READY'])
        .order('createdAt', { ascending: true });

      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error('[Bar] Fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [restaurantId]);

  const fetchSettings = useCallback(async () => {
    if (!restaurantId) return;
    try {
      const { data, error } = await supabase
        .from('kds_settings') // Reusing kds_settings table or should we have bar_settings?
        .select('settings')
        .eq('restaurant_id', restaurantId)
        .single();

      if (!error && data?.settings) {
        setSettings({ ...DEFAULT_KDS_SETTINGS, ...data.settings });
      }
    } catch (err) {
      console.error('[Bar] Settings fetch error:', err);
    }
  }, [restaurantId]);

  useEffect(() => {
    fetchOrders();
    fetchSettings();

    if (!restaurantId) return;

    const channel = supabase
      .channel(`bar-orders-realtime-${restaurantId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `restaurant_id=eq.${restaurantId}`
        },
        () => {
          fetchOrders();
        }
      )
      .subscribe();

    const interval = setInterval(() => setTick(t => t + 1), 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [restaurantId, fetchOrders, fetchSettings]);

  // Sound: play when new VALIDATED orders appear
  useEffect(() => {
    const known = knownOrderIdsRef.current;
    const incoming = orders.filter(o => o.status === 'VALIDATED');
    const hasNew = incoming.some(o => !known.has(o.id));
    if (hasNew) playNewOrder();
    knownOrderIdsRef.current = new Set(orders.map(o => o.id));
  }, [orders, playNewOrder]);

  // Sound: play urgent alert on tick if any order exceeds critical threshold
  useEffect(() => {
    if (tick === 0) return;
    const criticalMs = (settings.thresholds?.red ?? 30) * 60 * 1000;
    const hasCritical = orders.some(o => {
      if (o.status === 'READY') return false;
      const age = Date.now() - new Date(o.createdAt).getTime();
      return age > criticalMs;
    });
    if (hasCritical) playUrgent();
  }, [tick, orders, settings.thresholds, playUrgent]);

  const handleUpdateStatus = async (orderId: string, nextStatus: OrderStatus) => {
    setUpdating(true);
    try {
      const updateData: any = { status: nextStatus };
      if (nextStatus === 'PREPARING') updateData.preparing_at = new Date().toISOString();
      if (nextStatus === 'READY') updateData.ready_at = new Date().toISOString();

      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId);

      if (error) throw error;
      
      setIsDetailVisible(false);
    } catch (err) {
      console.error('[Bar] Update error:', err);
    } finally {
      setUpdating(false);
    }
  };
  
  const handleDismissOrder = (orderId: string) => {
    setClearedOrderIds(prev => new Set([...prev, orderId]));
    setIsDetailVisible(false);
  };

  const visibleOrders = orders.filter(order => {
    if (clearedOrderIds.has(order.id)) return false;

    if (order.status === 'READY' && settings.autoClear.enabled) {
      const readyAt = order.ready_at ? new Date(order.ready_at).getTime() : 0;
      if (readyAt > 0) {
        const elapsedSeconds = (Date.now() - readyAt) / 1000;
        if (elapsedSeconds > settings.autoClear.delaySeconds) return false;
      }
    }
    return true;
  });

  const filteredOrders = visibleOrders.filter(o => {
    if (activeTab === 'Nuevos') return o.status === 'VALIDATED';
    if (activeTab === 'Preparando') return o.status === 'PREPARING';
    if (activeTab === 'Listos') return o.status === 'READY';
    return false;
  });

  const getTabCount = (tab: BarTab) => {
    if (tab === 'Nuevos') return visibleOrders.filter(o => o.status === 'VALIDATED').length;
    if (tab === 'Preparando') return visibleOrders.filter(o => o.status === 'PREPARING').length;
    if (tab === 'Listos') return visibleOrders.filter(o => o.status === 'READY').length;
    return 0;
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTitleContainer}>
        <View style={[styles.iconBox, { backgroundColor: '#3b82f6' }]}>
          <Beer color="white" size={24} />
        </View>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>MONITOR <Text style={{ color: '#3b82f6' }}>BAR</Text></Text>
          <View style={styles.liveIndicator}>
            <View style={styles.dot} />
            <Text style={[styles.liveText, { color: colors.muted }]}>SISTEMA EN VIVO</Text>
          </View>
        </View>
      </View>
      <View style={styles.headerActions}>
        <TouchableOpacity 
          onPress={() => setIsAlertVisible(true)} 
          style={[styles.headerBtn, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}
        >
          <AlertTriangle size={20} color="#f59e0b" />
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => setIsSettingsVisible(true)} 
          style={[styles.headerBtn, { backgroundColor: colors.glass }]}
        >
          <Settings size={20} color={colors.text} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => signOut()} style={[styles.headerBtn, { backgroundColor: colors.glass }]}>
          <LogOut size={20} color={colors.muted} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderTabs = () => (
    <View style={[styles.tabBar, { borderBottomColor: colors.glassHeavy }]}>
      {(['Nuevos', 'Preparando', 'Listos'] as BarTab[]).map((tab) => (
        <TouchableOpacity 
          key={tab} 
          style={[
            styles.tab, 
            activeTab === tab && { borderBottomColor: '#3b82f6' }
          ]}
          onPress={() => setActiveTab(tab)}
        >
          <View style={styles.tabContent}>
            <Text style={[
              styles.tabText, 
              { color: activeTab === tab ? colors.text : colors.muted }
            ]}>
              {tab.toUpperCase()}
            </Text>
            <View style={[
              styles.badge, 
              { backgroundColor: activeTab === tab ? '#3b82f6' : colors.glassHeavy }
            ]}>
              <Text style={[styles.badgeText, { color: activeTab === tab ? 'white' : colors.text }]}>{getTabCount(tab)}</Text>
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.navy }]}>
      <StatusBar barStyle={isLight ? 'dark-content' : 'light-content'} />
      {renderHeader()}
      {renderTabs()}

      {loading && !refreshing ? (
        <View style={styles.centered}>
          <ActivityIndicator color="#3b82f6" size="large" />
          <Text style={[styles.loadingText, { color: colors.muted }]}>Sincronizando bar...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInRight.delay(index * 100)}>
              <KitchenOrderCard 
                order={item} 
                thresholds={settings.thresholds}
                onPress={() => {
                  setSelectedOrder(item);
                  setIsDetailVisible(true);
                }}
                onAdvanceStatus={() => {
                  const next: any = { VALIDATED: 'PREPARING', PREPARING: 'READY' };
                  if (next[item.status]) {
                    handleUpdateStatus(item.id, next[item.status]);
                  }
                }}
                onReject={() => handleDismissOrder(item.id)}
              />
            </Animated.View>
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchOrders(); }} tintColor="#3b82f6" />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.muted }]}>No hay pedidos en esta sección</Text>
            </View>
          }
        />
      )}

      {/* Modals */}
      <OrderDetailModal 
        visible={isDetailVisible}
        order={selectedOrder}
        onClose={() => setIsDetailVisible(false)}
        onUpdateStatus={handleUpdateStatus}
        updating={updating}
        allowDelivery={false}
        allowCancel={true}
        cancelLabel="QUITAR DE LA VISTA"
        onCancel={() => handleDismissOrder(selectedOrder?.id)}
      />

      <StockAlertModal 
        visible={isAlertVisible}
        onClose={() => setIsAlertVisible(false)}
      />

      <KdsSettingsModal 
        visible={isSettingsVisible}
        onClose={() => setIsSettingsVisible(false)}
        onSave={(newSettings) => setSettings(newSettings)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    fontStyle: 'italic',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
  },
  liveText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  tabText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '800',
  },
  listContent: {
    padding: 20,
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
    letterSpacing: 1,
  },
  emptyContainer: {
    marginTop: 100,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontStyle: 'italic',
  }
});
