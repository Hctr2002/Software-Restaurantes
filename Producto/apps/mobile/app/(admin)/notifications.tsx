import React from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { Bell, ShoppingBag, Clock, ChevronRight, CheckCircle2, Trash2 } from 'lucide-react-native';
import { MB_COLORS, MB_SPACING, MB_RADIUS } from '../../constants/MB_Theme';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { formatCurrency, timeAgo } from '../../lib/dashboard';
import Animated, { FadeInDown, FadeOutRight } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

export default function NotificationsScreen() {
  const { restaurantId } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const [notifications, setNotifications] = React.useState<any[]>([]);
  const [dismissedIds, setDismissedIds] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  const STORAGE_KEY = `dismissed_notifs_${restaurantId}`;

  const loadDismissedIds = React.useCallback(async () => {
    try {
      const stored = await SecureStore.getItemAsync(STORAGE_KEY);
      if (stored) {
        setDismissedIds(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Error loading dismissed notifs:', e);
    }
  }, [STORAGE_KEY]);

  const saveDismissedIds = async (ids: string[]) => {
    try {
      await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(ids));
    } catch (e) {
      console.error('Error saving dismissed notifs:', e);
    }
  };

  const fetchNotifications = React.useCallback(async () => {
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
        .order('createdAt', { ascending: false })
        .limit(50);

      if (error) throw error;
      setNotifications(data || []);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [restaurantId]);

  React.useEffect(() => {
    loadDismissedIds();
    fetchNotifications();
  }, [fetchNotifications, loadDismissedIds]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const dismissNotification = (id: string) => {
    const nextIds = [...dismissedIds, id];
    setDismissedIds(nextIds);
    saveDismissedIds(nextIds);
  };

  const clearAll = () => {
    const allIds = notifications.map(n => n.id);
    const nextIds = Array.from(new Set([...dismissedIds, ...allIds]));
    setDismissedIds(nextIds);
    saveDismissedIds(nextIds);
  };

  const visibleNotifications = notifications.filter(n => !dismissedIds.includes(n.id));

  const renderItem = ({ item, index }: { item: any, index: number }) => {
    const total = (item.order_items || []).reduce((sum: number, oi: any) => sum + (oi.unit_price * oi.quantity), 0);
    
    return (
      <Animated.View 
        entering={FadeInDown.delay(index * 50)}
        exiting={FadeOutRight}
      >
        <View style={styles.notifCardContainer}>
          <TouchableOpacity 
            style={[styles.notifCard, { backgroundColor: colors.glass, borderColor: colors.glassHeavy }]}
            onPress={() => router.push('/(admin)/orders')}
          >
            <View style={[styles.iconContainer, { backgroundColor: colors.glassHeavy }]}>
              <ShoppingBag size={20} color={colors.text} />
            </View>
            <View style={styles.notifContent}>
              <View style={styles.notifHeader}>
                <Text style={[styles.notifTitle, { color: colors.text }]}>Mesa {item.tables?.number || 'S/N'}</Text>
                <Text style={[styles.notifTime, { color: colors.muted }]}>{timeAgo(item.createdAt)}</Text>
              </View>
              <Text style={[styles.notifSub, { color: colors.muted }]}>Total: {formatCurrency(total)}</Text>
              <View style={styles.statusBadge}>
                <View style={[styles.statusDot, { backgroundColor: item.status === 'PENDING' ? '#facc15' : '#10b981' }]} />
                <Text style={[styles.statusText, { color: colors.text }]}>{item.status}</Text>
              </View>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.checkButton, { backgroundColor: colors.brandAccent + '20' }]}
            onPress={() => dismissNotification(item.id)}
          >
            <CheckCircle2 size={24} color={colors.brandAccent} />
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.navy }]}>
      <View style={[styles.header, { borderBottomColor: colors.glassHeavy }]}>
        <View style={styles.headerInfo}>
          <View style={[styles.headerIcon, { backgroundColor: colors.brandAccent }]}>
            <Bell color="white" size={24} />
          </View>
          <View>
            <Text style={[styles.title, { color: colors.text }]}>Historial de Alertas</Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>{visibleNotifications.length} pendientes</Text>
          </View>
        </View>
        
        {visibleNotifications.length > 0 && (
          <TouchableOpacity style={[styles.clearAllButton, { backgroundColor: colors.glass }]} onPress={clearAll}>
            <Trash2 size={16} color={colors.text} />
            <Text style={[styles.clearAllText, { color: colors.text }]}>Limpiar</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading && !refreshing ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.brandAccent} />
        </View>
      ) : (
        <FlatList
          data={visibleNotifications}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brandAccent} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <CheckCircle2 size={48} color={colors.brandAccent} style={{ opacity: 0.3 }} />
              <Text style={[styles.emptyText, { color: colors.text }]}>¡Todo al día!</Text>
              <Text style={[styles.emptySub, { color: colors.muted }]}>No tienes notificaciones pendientes</Text>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: MB_SPACING.lg,
    paddingTop: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: MB_COLORS.brandAccent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: 'white',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: MB_COLORS.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  clearAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  clearAllText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  listContent: {
    padding: MB_SPACING.lg,
    paddingBottom: 100,
  },
  notifCardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  notifCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MB_COLORS.glass,
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  notifContent: {
    flex: 1,
  },
  notifHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  notifTitle: {
    color: 'white',
    fontSize: 14,
    fontWeight: '800',
  },
  notifTime: {
    color: MB_COLORS.muted,
    fontSize: 10,
    fontWeight: '600',
  },
  notifSub: {
    color: MB_COLORS.muted,
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  checkButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(254, 95, 85, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '900',
    marginTop: 20,
  },
  emptySub: {
    color: MB_COLORS.muted,
    fontSize: 13,
    fontWeight: '500',
    marginTop: 4,
  }
});
