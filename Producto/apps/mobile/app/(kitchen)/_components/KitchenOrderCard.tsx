import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Clock, ChevronRight, X } from 'lucide-react-native';
import { MB_SPACING, MB_RADIUS } from '../../../constants/MB_Theme';
import { useTheme } from '../../../context/ThemeContext';
import { timeAgo } from '../../../lib/dashboard';

interface KitchenOrderCardProps {
  order: any;
  onPress: () => void;
  onAdvanceStatus?: () => void;
  onReject?: () => void;
  thresholds?: { yellow: number; red: number };
}

export default function KitchenOrderCard({ 
  order, 
  onPress, 
  onAdvanceStatus, 
  onReject, 
  thresholds = { yellow: 10, red: 20 } 
}: KitchenOrderCardProps) {
  const { colors } = useTheme();
  
  const getUrgencyColor = () => {
    const elapsedMinutes = (new Date().getTime() - new Date(order.createdAt).getTime()) / 60000;
    if (elapsedMinutes > thresholds.red) return '#ef4444'; // Red
    if (elapsedMinutes > thresholds.yellow) return '#f59e0b'; // Amber
    return colors.brandAccent;
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

      <View style={styles.footerActions}>
        {nextLabel ? (
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: urgencyColor }]}
            onPress={(e) => {
              e.stopPropagation();
              onAdvanceStatus?.();
            }}
          >
            <Text style={styles.actionText}>{nextLabel}</Text>
            <ChevronRight size={16} color="white" />
          </TouchableOpacity>
        ) : (
          <View style={[styles.actionButton, { backgroundColor: 'rgba(16, 185, 129, 0.1)', borderWidth: 1, borderColor: '#10b98140' }]}>
            <Text style={[styles.actionText, { color: '#10b981' }]}>LISTO</Text>
          </View>
        )}

        {onReject && (
          <TouchableOpacity 
            style={styles.rejectButtonSmall}
            onPress={(e) => {
              e.stopPropagation();
              onReject();
            }}
          >
            <X size={20} color="#ef4444" />
          </TouchableOpacity>
        )}
      </View>
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
  rejectBtn: {
    marginLeft: 10,
    padding: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 8,
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
  footerActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    gap: 6,
  },
  actionText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  rejectButtonSmall: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  }
});
