import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  ScrollView, 
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { X, Clock, ShoppingBag, Hash, ChevronRight, CheckCircle2 } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { MB_COLORS, MB_SPACING, MB_RADIUS } from '../constants/MB_Theme';
import { useTheme } from '../context/ThemeContext';
import { formatCurrency, timeAgo } from '../lib/dashboard';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export type OrderStatus = 'PENDING' | 'VALIDATED' | 'PREPARING' | 'READY' | 'DELIVERED' | 'REJECTED';

export interface OrderDetailProps {
  visible: boolean;
  onClose: () => void;
  order: any | null;
  onUpdateStatus: (orderId: string, nextStatus: OrderStatus) => Promise<void>;
  updating: boolean;
}

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  'PENDING': 'VALIDATED',
  'VALIDATED': 'PREPARING',
  'PREPARING': 'READY',
  'READY': 'DELIVERED',
};

const STATUS_LABELS: Record<OrderStatus, string> = {
  'PENDING': 'PENDIENTE',
  'VALIDATED': 'VALIDADO',
  'PREPARING': 'EN COCINA',
  'READY': 'LISTO',
  'DELIVERED': 'ENTREGADO',
  'REJECTED': 'ANULADO'
};

export default function OrderDetailModal({ visible, onClose, order, onUpdateStatus, updating }: OrderDetailProps) {
  const { colors } = useTheme();
  if (!order) return null;

  const nextStatus = NEXT_STATUS[order.status as OrderStatus];
  const total = (order.order_items || []).reduce((sum: number, it: any) => sum + (it.unit_price * it.quantity), 0);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <BlurView intensity={20} tint="dark" style={styles.overlay}>
        <TouchableOpacity style={styles.dismissArea} activeOpacity={1} onPress={onClose} />
        
        <Animated.View 
          entering={FadeInUp.springify()} 
          style={[styles.modalContent, { backgroundColor: colors.navy, borderTopColor: colors.glassHeavy }]}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.glassHeavy }]}>
            <View style={styles.headerInfo}>
              <View style={[styles.tableBadge, { backgroundColor: colors.text }]}>
                <Text style={[styles.tableText, { color: colors.navy }]}>MESA {order.tables?.number ?? 'S/N'}</Text>
              </View>
              <Text style={[styles.orderId, { color: colors.muted }]}>ID: {order.id.slice(0, 8).toUpperCase()}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={[styles.closeButton, { backgroundColor: colors.glass }]}>
              <X size={20} color={colors.muted} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
            {/* Status Card */}
            <View style={[styles.statusSection, { backgroundColor: colors.glass }]}>
              <View style={styles.statusRow}>
                <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(order.status, colors) }]} />
                <Text style={[styles.statusLabel, { color: getStatusColor(order.status, colors) }]}>
                  {STATUS_LABELS[order.status as OrderStatus] || order.status}
                </Text>
              </View>
              <View style={styles.timeRow}>
                <Clock size={12} color={colors.muted} />
                <Text style={[styles.timeText, { color: colors.muted }]}>{timeAgo(order.createdAt)}</Text>
              </View>
            </View>

            {/* Items List */}
            <Text style={[styles.sectionTitle, { color: colors.muted }]}>PRODUCTOS</Text>
            <View style={styles.itemsContainer}>
              {order.order_items?.map((item: any, idx: number) => (
                <View key={idx} style={[styles.itemRow, { backgroundColor: colors.glass, borderColor: colors.glassHeavy }]}>
                  <View style={styles.itemMain}>
                    <View style={[styles.quantityBox, { backgroundColor: colors.brandAccent + '1A' }]}>
                      <Text style={[styles.quantityText, { color: colors.brandAccent }]}>{item.quantity}x</Text>
                    </View>
                    <View>
                      <Text style={[styles.itemName, { color: colors.text }]}>{item.menu_items?.name}</Text>
                      {item.notes && <Text style={[styles.itemNotes, { color: colors.muted }]}>{item.notes}</Text>}
                    </View>
                  </View>
                  <Text style={[styles.itemPrice, { color: colors.text }]}>{formatCurrency(item.unit_price * item.quantity)}</Text>
                </View>
              ))}
            </View>

            {/* Total Card */}
            <View style={[styles.totalCard, { backgroundColor: colors.brandAccent + '1A', borderColor: colors.brandAccent + '33' }]}>
              <Text style={[styles.totalLabel, { color: colors.brandAccent }]}>TOTAL A PAGAR</Text>
              <Text style={[styles.totalValue, { color: colors.text }]}>{formatCurrency(total)}</Text>
            </View>
          </ScrollView>

          {/* Actions */}
          <View style={styles.footer}>
            {nextStatus ? (
              <TouchableOpacity 
                style={[styles.primaryAction, { backgroundColor: colors.brandAccent, shadowColor: colors.brandAccent }, updating && styles.disabledAction]}
                onPress={() => onUpdateStatus(order.id, nextStatus)}
                disabled={updating}
              >
                {updating ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Text style={styles.actionText}>AVANZAR A {STATUS_LABELS[nextStatus]}</Text>
                    <ChevronRight size={20} color="white" />
                  </>
                )}
              </TouchableOpacity>
            ) : (
              <View style={styles.completedState}>
                <CheckCircle2 size={24} color="#10b981" />
                <Text style={[styles.completedText, { color: "#10b981" }]}>ORDEN FINALIZADA</Text>
              </View>
            )}
            
            {!['DELIVERED', 'REJECTED'].includes(order.status) && (
              <TouchableOpacity 
                style={[styles.cancelAction, { borderColor: colors.glassHeavy }]}
                onPress={() => onUpdateStatus(order.id, 'REJECTED')}
                disabled={updating}
              >
                <Text style={[styles.cancelText, { color: colors.muted }]}>ANULAR PEDIDO</Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      </BlurView>
    </Modal>
  );
}

const getStatusColor = (status: string, colors: any) => {
  switch (status) {
    case 'PENDING': return '#facc15';
    case 'VALIDATED': return '#60a5fa';
    case 'PREPARING': return colors.brandAccent;
    case 'READY': return '#10b981';
    case 'DELIVERED': return colors.muted;
    default: return colors.text;
  }
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  dismissArea: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: MB_COLORS.navy,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    height: SCREEN_HEIGHT * 0.85,
    paddingTop: 8,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  headerInfo: {
    gap: 4,
  },
  tableBadge: {
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  tableText: {
    color: MB_COLORS.navy,
    fontSize: 14,
    fontWeight: '900',
    fontStyle: 'italic',
  },
  orderId: {
    color: MB_COLORS.muted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollBody: {
    padding: 24,
  },
  statusSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 16,
    borderRadius: 20,
    marginBottom: 32,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeText: {
    color: MB_COLORS.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  sectionTitle: {
    color: MB_COLORS.muted,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 16,
  },
  itemsContainer: {
    gap: 12,
    marginBottom: 32,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.02)',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
  },
  itemMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quantityBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(254, 95, 85, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    color: MB_COLORS.brandAccent,
    fontSize: 12,
    fontWeight: '900',
    fontStyle: 'italic',
  },
  itemName: {
    color: 'white',
    fontSize: 14,
    fontWeight: '800',
    textTransform: 'uppercase',
    fontStyle: 'italic',
  },
  itemNotes: {
    color: MB_COLORS.muted,
    fontSize: 11,
    marginTop: 2,
  },
  itemPrice: {
    color: 'white',
    fontSize: 14,
    fontWeight: '900',
  },
  totalCard: {
    backgroundColor: 'rgba(254, 95, 85, 0.1)',
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(254, 95, 85, 0.2)',
    alignItems: 'center',
  },
  totalLabel: {
    color: MB_COLORS.brandAccent,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 3,
    marginBottom: 8,
  },
  totalValue: {
    color: 'white',
    fontSize: 32,
    fontWeight: '900',
    fontStyle: 'italic',
  },
  footer: {
    padding: 24,
    paddingBottom: 40,
    gap: 12,
  },
  primaryAction: {
    backgroundColor: MB_COLORS.brandAccent,
    height: 56,
    borderRadius: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    shadowColor: MB_COLORS.brandAccent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  actionText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },
  disabledAction: {
    opacity: 0.7,
  },
  cancelAction: {
    height: 56,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  cancelText: {
    color: MB_COLORS.muted,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  completedState: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  completedText: {
    color: MB_COLORS.sage,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 2,
  }
});
