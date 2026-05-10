import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Clock, ChevronRight } from 'lucide-react-native';
import { MB_COLORS, MB_SPACING, MB_RADIUS } from '../../../constants/MB_Theme';
import { useTheme } from '../../../context/ThemeContext';
import { timeAgo } from '../../../lib/dashboard';

interface KitchenOrderCardProps {
  order: any;
  onPress: () => void;
  onAdvanceStatus?: () => void;
  thresholds?: { yellow: number; red: number };
}

export default function KitchenOrderCard({ order, onPress, onAdvanceStatus, thresholds = { yellow: 10, red: 20 } }: KitchenOrderCardProps) {
  const { colors } = useTheme();
  
  const getUrgencyColor = () => {
    const elapsedMinutes = (new Date().getTime() - new Date(order.createdAt).getTime()) / 60000;
    if (elapsedMinutes > thresholds.red) return '#ef4444'; // Red
    if (elapsedMinutes > thresholds.yellow) return '#f59e0b'; // Amber
    return colors.brandAccent || MB_COLORS.brandAccent;
  };

  const urgencyColor = getUrgencyColor();

  const getNextStatusLabel = () => {
    switch (order.status) {
      case 'VALIDATED': return 'INICIAR';
      case 'PREPARING': return 'LISTO';
      case 'READY': return '';
      default: return '';
    }
  };

  const nextLabel = getNextStatusLabel();

  return (
    <TouchableOpacity 
      style={[styles.card, { backgroundColor: colors.glass, borderColor: colors.glassHeavy }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={[styles.tableBadge, { backgroundColor: urgencyColor }]}>
          <Text style={styles.tableText}>MESA {order.tables?.number ?? 'S/N'}</Text>
        </View>
        <View style={styles.timeContainer}>
          <Clock size={12} color={colors.muted} />
          <Text style={[styles.timeText, { color: colors.muted }]}>{timeAgo(order.createdAt)}</Text>
        </View>
      </View>

      <View style={styles.content}>
        {order.order_items?.map((item: any, idx: number) => (
          <View key={idx} style={styles.itemRow}>
            <Text style={[styles.quantityText, { color: urgencyColor }]}>{item.quantity}x</Text>
            <View style={styles.itemDetails}>
              <Text style={[styles.itemName, { color: colors.text }]} numberOfLines={1}>
                {item.menu_items?.name}
              </Text>
              {item.notes && (
                <Text style={[styles.itemNotes, { color: colors.muted }]} numberOfLines={1}>
                  {item.notes}
                </Text>
              )}
            </View>
          </View>
        ))}
      </View>

      {onAdvanceStatus && nextLabel && (
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: urgencyColor }]}
          onPress={(e) => {
            e.stopPropagation();
            onAdvanceStatus();
          }}
        >
          <Text style={styles.actionText}>{nextLabel}</Text>
          <ChevronRight size={16} color="white" />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: MB_RADIUS.lg,
    padding: MB_SPACING.md,
    marginBottom: MB_SPACING.md,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: MB_SPACING.md,
  },
  tableBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tableText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '900',
    fontStyle: 'italic',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  content: {
    gap: 8,
    marginBottom: MB_SPACING.md,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  quantityText: {
    fontSize: 14,
    fontWeight: '900',
    fontStyle: 'italic',
    width: 25,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  itemNotes: {
    fontSize: 11,
    fontStyle: 'italic',
  },
  actionButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  actionText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  }
});
