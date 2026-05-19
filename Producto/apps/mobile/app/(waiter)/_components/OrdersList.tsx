import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { UtensilsCrossed, CheckCircle2, XCircle, ChevronRight } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';

interface OrdersListProps {
  orders: any[];
  colors: any;
  onValidate: (orderId: string) => void;
  onReject: (orderId: string, tableId: string) => void;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: '#FF9800',
  VALIDATED: '#2196F3',
  PREPARING: '#9C27B0',
  READY: '#4CAF50',
};

export function OrdersList({ orders, colors, onValidate, onReject }: OrdersListProps) {
  const router = useRouter();

  if (orders.length === 0) {
    return (
      <View style={styles.emptyState}>
        <UtensilsCrossed size={48} color={colors.glassHeavy} />
        <Text style={[styles.emptyText, { color: colors.muted }]}>No hay pedidos activos</Text>
      </View>
    );
  }

  return (
    <View style={styles.ordersList}>
      {orders.map((order, i) => (
        <Animated.View key={order.id} entering={FadeInDown.delay(i * 50)} style={[styles.orderCard, { backgroundColor: colors.glass, borderColor: colors.glassHeavy }]}>
          <View style={styles.orderHeader}>
            <View style={[styles.orderTableBadge, { backgroundColor: colors.glass }]}>
              <Text style={[styles.orderTableText, { color: colors.text }]}>MESA {order.tables?.number}</Text>
            </View>
            <View style={[styles.orderStatusBadge, { backgroundColor: (STATUS_COLORS[order.status] || '#757575') + '20' }]}>
              <Text style={[styles.orderStatusText, { color: STATUS_COLORS[order.status] || '#757575' }]}>{order.status}</Text>
            </View>
          </View>

          <View style={styles.orderItems}>
            {order.order_items.map((it: any) => (
              <Text key={it.id} style={[styles.orderItemText, { color: colors.text }]}>
                • {it.quantity}x {it.menu_items.name}
              </Text>
            ))}
          </View>

          <View style={[styles.orderFooter, { borderTopColor: colors.glassHeavy }]}>
            <Text style={[styles.orderTime, { color: colors.muted }]}>
              {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
            {order.status === 'PENDING' ? (
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity onPress={() => onReject(order.id, order.table_id)} style={[styles.actionBtn, { backgroundColor: 'rgba(244, 67, 54, 0.1)' }]}>
                  <XCircle size={14} color="#F44336" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => onValidate(order.id)} style={[styles.actionBtn, { backgroundColor: 'rgba(76, 175, 80, 0.1)' }]}>
                  <CheckCircle2 size={14} color="#4CAF50" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity onPress={() => router.push(`/(waiter)/table/${order.table_id}`)}>
                <Text style={{ color: colors.brandAccent, fontWeight: '800', fontSize: 12 }}>
                  VER MESA <ChevronRight size={12} color={colors.brandAccent} />
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  ordersList: { gap: 12 },
  orderCard: { padding: 16, borderRadius: 24, borderWidth: 1 },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  orderTableBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  orderTableText: { fontSize: 10, fontWeight: '900' },
  orderStatusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  orderStatusText: { fontSize: 10, fontWeight: '900' },
  orderItems: { gap: 4, marginBottom: 12 },
  orderItemText: { fontSize: 13, fontWeight: '600', opacity: 0.8 },
  orderFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, paddingTop: 12 },
  orderTime: { fontSize: 11, fontWeight: '700' },
  actionBtn: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  emptyState: { alignItems: 'center', paddingVertical: 60, opacity: 0.5 },
  emptyText: { marginTop: 12, fontSize: 12, fontWeight: '800', textTransform: 'uppercase' },
});
