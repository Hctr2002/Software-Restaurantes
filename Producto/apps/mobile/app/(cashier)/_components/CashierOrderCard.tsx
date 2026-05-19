import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Clock, Hash, ChevronRight, CheckCircle2, Bell } from 'lucide-react-native';
import { useTheme } from '../../../context/ThemeContext';
import { formatCurrency, timeAgo } from '../../../lib/dashboard';
import Animated, { FadeInRight } from 'react-native-reanimated';

interface TableGroup {
  key: string;
  tableId: string | null;
  sessionId: string | null;
  tableNumber: number | null;
  orders: any[];
  total: number;
  billRequested: boolean;
  oldestCreatedAt: string;
}

interface CashierOrderCardProps {
  group: TableGroup;
  index: number;
  isPending: boolean;
  onPress: () => void;
}

export default function CashierOrderCard({ group, index, isPending, onPress }: CashierOrderCardProps) {
  const { colors } = useTheme();
  
  const allItems = group.orders.flatMap((o) => o.order_items ?? []);
  const previewItems = allItems.slice(0, 3);
  const extraCount = allItems.length - previewItems.length;
  const tableLabel = group.sessionId ? "Mesas fusionadas" : `Mesa ${group.tableNumber ?? "S/N"}`;

  return (
    <TouchableOpacity 
      activeOpacity={0.7}
      onPress={onPress}
      style={[
        styles.container, 
        { backgroundColor: colors.glass, borderColor: colors.glassHeavy },
        group.billRequested && { borderColor: '#f59e0b', borderWidth: 2 }
      ]}
    >
      <View style={styles.header}>
        <View style={styles.headerMain}>
          <View style={[styles.hashBox, { backgroundColor: group.billRequested ? 'rgba(245, 158, 11, 0.1)' : colors.glassHeavy }]}>
            <Hash size={20} color={group.billRequested ? '#f59e0b' : colors.brandAccent} />
          </View>
          <View>
            <Text style={[styles.tableLabel, { color: colors.text }]}>{tableLabel}</Text>
            <Text style={[styles.orderCount, { color: colors.muted }]}>
              {group.orders.length} {group.orders.length > 1 ? "Comandas" : "Comanda"}
            </Text>
          </View>
        </View>
        <View style={styles.headerStatus}>
          <View style={[styles.timeTag, { backgroundColor: colors.glass }]}>
            <Clock size={10} color={colors.muted} />
            <Text style={[styles.timeText, { color: colors.muted }]}>{timeAgo(group.oldestCreatedAt)}</Text>
          </View>
          {group.billRequested && (
            <View style={styles.billBadge}>
              <Bell size={10} color="white" />
              <Text style={styles.billBadgeText}>CUENTA</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.itemsList}>
        {previewItems.map((item, idx) => (
          <View key={idx} style={styles.itemRow}>
            <Text style={[styles.itemQty, { color: colors.muted }]}>{item.quantity}x</Text>
            <Text style={[styles.itemName, { color: colors.muted }]} numberOfLines={1}>
              {item.menu_items?.name ?? "Item"}
            </Text>
            <Text style={[styles.itemPrice, { color: colors.muted }]}>
              {formatCurrency(item.unit_price * item.quantity)}
            </Text>
          </View>
        ))}
        {extraCount > 0 && (
          <Text style={[styles.extraText, { color: colors.muted }]}>+ {extraCount} productos adicionales</Text>
        )}
      </View>

      <View style={[styles.footer, { borderTopColor: colors.glassHeavy }]}>
        <View style={styles.totalRow}>
          <Text style={[styles.totalLabel, { color: colors.muted }]}>TOTAL CUENTA</Text>
          <Text style={[styles.totalValue, { color: '#10b981' }]}>{formatCurrency(group.total)}</Text>
        </View>
        
        {isPending ? (
          <View style={[styles.actionBtn, { backgroundColor: group.billRequested ? '#f59e0b' : colors.brandAccent }]}>
            <Text style={styles.actionBtnText}>PROCESAR PAGO</Text>
            <ChevronRight size={16} color="white" />
          </View>
        ) : (
          <View style={styles.paidTag}>
            <CheckCircle2 size={16} color="#10b981" />
            <Text style={styles.paidTagText}>PAGADO</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  hashBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tableLabel: {
    fontSize: 18,
    fontWeight: '900',
    fontStyle: 'italic',
  },
  orderCount: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 2,
  },
  headerStatus: {
    alignItems: 'flex-end',
    gap: 6,
  },
  timeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  timeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  billBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f59e0b',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  billBadgeText: {
    color: 'white',
    fontSize: 9,
    fontWeight: '900',
  },
  itemsList: {
    gap: 6,
    marginBottom: 20,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemQty: {
    fontSize: 12,
    fontWeight: '900',
    width: 24,
  },
  itemName: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
  },
  itemPrice: {
    fontSize: 12,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  extraText: {
    fontSize: 10,
    fontWeight: '800',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 4,
  },
  footer: {
    paddingTop: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  totalLabel: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  totalValue: {
    fontSize: 22,
    fontWeight: '900',
    fontStyle: 'italic',
  },
  actionBtn: {
    height: 48,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  actionBtnText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
  paidTag: {
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  paidTagText: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  }
});
