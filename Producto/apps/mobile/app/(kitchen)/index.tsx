import React, { useState, useEffect, useCallback } from 'react';
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
import { ChefHat, LogOut } from 'lucide-react-native';
import KitchenOrderCard from './_components/KitchenOrderCard';
import OrderDetailModal, { OrderStatus } from '../../components/OrderDetailModal';
import Animated, { FadeInRight } from 'react-native-reanimated';

type KitchenTab = 'Nuevos' | 'Cocinando' | 'Listos';

export default function KitchenDashboard() {
  const { restaurantId, signOut } = useAuth();
  const { colors } = useTheme();
  
  const [activeTab, setActiveTab] = useState<KitchenTab>('Nuevos');
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

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
        .in('status', ['VALIDATED', 'PREPARING', 'READY'])
        .order('createdAt', { ascending: true });

      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error('[Kitchen] Fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    fetchOrders();

    if (!restaurantId) return;

    const channel = supabase
      .channel(`kitchen-orders-realtime-${restaurantId}`)
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

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId, fetchOrders]);

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
      
      setIsModalVisible(false);
    } catch (err) {
      console.error('[Kitchen] Update error:', err);
    } finally {
      setUpdating(false);
    }
  };

  const filteredOrders = orders.filter(o => {
    if (activeTab === 'Nuevos') return o.status === 'VALIDATED';
    if (activeTab === 'Cocinando') return o.status === 'PREPARING';
    if (activeTab === 'Listos') return o.status === 'READY';
    return false;
  });

  const getTabCount = (tab: KitchenTab) => {
    if (tab === 'Nuevos') return orders.filter(o => o.status === 'VALIDATED').length;
    if (tab === 'Cocinando') return orders.filter(o => o.status === 'PREPARING').length;
    if (tab === 'Listos') return orders.filter(o => o.status === 'READY').length;
    return 0;
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTitleContainer}>
        <View style={[styles.iconBox, { backgroundColor: colors.brandAccent }]}>
          <ChefHat color="white" size={24} />
        </View>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>MONITOR <Text style={{ color: colors.brandAccent }}>KDS</Text></Text>
          <View style={styles.liveIndicator}>
            <View style={styles.dot} />
            <Text style={[styles.liveText, { color: colors.muted }]}>SISTEMA EN VIVO</Text>
          </View>
        </View>
      </View>
      <TouchableOpacity onPress={() => signOut()} style={[styles.logoutBtn, { backgroundColor: colors.glass }]}>
        <LogOut size={20} color={colors.muted} />
      </TouchableOpacity>
    </View>
  );

  const renderTabs = () => (
    <View style={[styles.tabBar, { borderBottomColor: colors.glassHeavy }]}>
      {(['Nuevos', 'Cocinando', 'Listos'] as KitchenTab[]).map((tab) => (
        <TouchableOpacity 
          key={tab} 
          style={[
            styles.tab, 
            activeTab === tab && { borderBottomColor: colors.brandAccent }
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
              { backgroundColor: activeTab === tab ? colors.brandAccent : colors.glassHeavy }
            ]}>
              <Text style={styles.badgeText}>{getTabCount(tab)}</Text>
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.navy }]}>
      <StatusBar barStyle="light-content" />
      {renderHeader()}
      {renderTabs()}

      {loading && !refreshing ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.brandAccent} size="large" />
          <Text style={[styles.loadingText, { color: colors.muted }]}>Sincronizando cocina...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInRight.delay(index * 100)}>
              <KitchenOrderCard 
                order={item} 
                onPress={() => {
                  setSelectedOrder(item);
                  setIsModalVisible(true);
                }}
                onAdvanceStatus={() => {
                  const next: any = { VALIDATED: 'PREPARING', PREPARING: 'READY' };
                  if (next[item.status]) {
                    handleUpdateStatus(item.id, next[item.status]);
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
              <Text style={[styles.emptyText, { color: colors.muted }]}>No hay pedidos en esta sección</Text>
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
        allowDelivery={false}
        allowCancel={false}
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
  logoutBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
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
