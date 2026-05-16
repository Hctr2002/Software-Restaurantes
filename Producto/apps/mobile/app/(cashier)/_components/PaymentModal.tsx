import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { X, ChevronRight, Receipt, Share2 } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../../../context/ThemeContext';
import { formatCurrency } from '../../../lib/dashboard';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { shareReceipt } from '../../../lib/receipt';

interface PaymentModalProps {
  visible: boolean;
  group: any | null;
  isProcessing: boolean;
  onClose: () => void;
  onConfirm: (reference: string) => Promise<void>;
}

export default function PaymentModal({ visible, group, isProcessing, onClose, onConfirm }: PaymentModalProps) {
  const { colors, isLight } = useTheme();
  const [reference, setReference] = useState('');
  const [isSharing, setIsSharing] = useState(false);

  if (!group) return null;

  const allItems = group.orders.flatMap((o: any) => o.order_items ?? []);
  const tableLabel = group.sessionId ? "Mesas fusionadas" : `Mesa ${group.tableNumber ?? "S/N"}`;
  const subtotal = group.total;
  const tipAmount = group.tipIncluded ? Math.round(subtotal * 0.10) : 0;
  const totalToPay = subtotal + tipAmount;

  const handleConfirm = async () => {
    await onConfirm(reference);
    setReference('');
  };

  const handleShare = async () => {
    setIsSharing(true);
    try {
      await shareReceipt({
        tableLabel,
        items: allItems.map((i: any) => ({
          name: i.menu_items?.name ?? 'Ítem',
          quantity: i.quantity,
          unitPrice: Number(i.unit_price),
        })),
        tipIncluded: group.tipIncluded,
        reference: reference || undefined,
      });
    } catch {
      // Sharing cancelled or unavailable — no feedback needed
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <BlurView intensity={20} tint={isLight ? 'light' : 'dark'} style={styles.overlay}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.centered}
        >
          <TouchableOpacity style={styles.dismissArea} activeOpacity={1} onPress={onClose} />
          
          <Animated.View 
            entering={FadeInDown.springify()} 
            style={[styles.modalContent, { backgroundColor: colors.navy, borderTopColor: colors.glassHeavy }]}
          >
            <View style={styles.header}>
              <View style={styles.headerTitleRow}>
                <View style={[styles.iconBox, { backgroundColor: colors.glass }]}>
                  <Receipt size={20} color={colors.brandAccent} />
                </View>
                <Text style={[styles.title, { color: colors.text }]}>{tableLabel.toUpperCase()}</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <X size={24} color={colors.muted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.body}>
              <View style={styles.summaryCard}>
                <Text style={[styles.summaryLabel, { color: colors.muted }]}>TOTAL A COBRAR</Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>{formatCurrency(totalToPay)}</Text>
                {group.tipIncluded && (
                  <View style={[styles.tipRow, { backgroundColor: '#FFD70015', borderColor: '#FFD70030' }]}>
                    <Text style={[styles.tipLabel, { color: '#FFD700' }]}>Propina 10%</Text>
                    <Text style={[styles.tipValue, { color: '#FFD700' }]}>+{formatCurrency(tipAmount)}</Text>
                  </View>
                )}
              </View>

              <Text style={[styles.sectionTitle, { color: colors.muted }]}>DESGLOSE DE PRODUCTOS</Text>
              <View style={styles.itemsContainer}>
                {allItems.map((item: any, idx: number) => (
                  <View key={idx} style={[styles.itemRow, { borderBottomColor: colors.glassHeavy }]}>
                    <Text style={[styles.itemQty, { color: colors.brandAccent }]}>{item.quantity}x</Text>
                    <Text style={[styles.itemName, { color: colors.text }]}>{item.menu_items?.name}</Text>
                    <Text style={[styles.itemPrice, { color: colors.text }]}>{formatCurrency(item.unit_price * item.quantity)}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.muted }]}>REFERENCIA DE PAGO (OPCIONAL)</Text>
                <TextInput 
                  style={[styles.input, { backgroundColor: colors.glass, borderColor: colors.glassHeavy, color: colors.text }]}
                  placeholder="Ej. ID Transbank, Transferencia..."
                  placeholderTextColor={colors.muted}
                  value={reference}
                  onChangeText={setReference}
                />
              </View>
            </ScrollView>

            <View style={styles.footer}>
              <TouchableOpacity
                style={[styles.shareBtn, { borderColor: colors.glassHeavy }]}
                onPress={handleShare}
                disabled={isSharing}
              >
                {isSharing
                  ? <ActivityIndicator color="#94a3b8" size="small" />
                  : <Share2 size={18} color="#94a3b8" />}
                <Text style={styles.shareBtnText}>
                  {isSharing ? 'Generando...' : 'Compartir recibo'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.confirmBtn, { backgroundColor: '#10b981' }]}
                onPress={handleConfirm}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Text style={styles.confirmBtnText}>CONFIRMAR COBRO</Text>
                    <ChevronRight size={20} color="white" />
                  </>
                )}
              </TouchableOpacity>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  dismissArea: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    borderTopWidth: 1,
    height: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    fontStyle: 'italic',
  },
  closeBtn: {
    padding: 4,
  },
  body: {
    flex: 1,
  },
  summaryCard: {
    alignItems: 'center',
    marginBottom: 32,
    paddingVertical: 16,
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 42,
    fontWeight: '900',
    fontStyle: 'italic',
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
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
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  itemQty: {
    width: 32,
    fontSize: 14,
    fontWeight: '900',
  },
  itemName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  inputGroup: {
    gap: 8,
    marginBottom: 40,
  },
  label: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  input: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    paddingTop: 12,
    paddingBottom: 20,
  },
  confirmBtn: {
    height: 56,
    borderRadius: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  confirmBtnText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },
  shareBtn: {
    height: 44,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
    borderWidth: 1,
  },
  shareBtnText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '700',
  },
  tipRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  tipLabel: { fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
  tipValue: { fontSize: 14, fontWeight: '900' },
});
