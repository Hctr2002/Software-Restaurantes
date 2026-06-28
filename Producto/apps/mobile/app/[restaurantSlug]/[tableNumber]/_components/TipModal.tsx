import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, ActivityIndicator } from 'react-native';
import { HandCoins } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';

/** Sugerencia por defecto: 10% del consumo. El cliente edita el monto en pesos. */
const DEFAULT_TIP_RATE = 0.1;

interface TipModalProps {
  visible: boolean;
  tableTotal: number;
  submitting: boolean;
  primaryColor: string;
  bgColor: string;
  textColor: string;
  /** Confirma con el monto de propina elegido (0 = sin propina). */
  onConfirm: (tipAmount: number) => void;
  onClose: () => void;
}

function formatCLP(n: number): string {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n);
}

export function TipModal({ visible, tableTotal, submitting, primaryColor, bgColor, textColor, onConfirm, onClose }: TipModalProps) {
  // Sugerencia inicial 10%; el cliente puede dejar más, o 0 (sin propina).
  const [amount, setAmount] = useState<number>(Math.round(tableTotal * DEFAULT_TIP_RATE));

  useEffect(() => {
    if (visible) setAmount(Math.round(tableTotal * DEFAULT_TIP_RATE));
  }, [visible, tableTotal]);

  const muted = textColor + '99';

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <BlurView intensity={20} tint="dark" style={{ flex: 1 }}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={submitting ? undefined : onClose} />
        <Animated.View entering={FadeInDown.springify()} style={[styles.sheet, { backgroundColor: bgColor }]}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <View style={[styles.iconBox, { backgroundColor: primaryColor + '1A' }]}>
              <HandCoins size={20} color={primaryColor} />
            </View>
            <Text style={[styles.title, { color: textColor }]}>¿Deseas dejar propina?</Text>
          </View>
          <Text style={[styles.sub, { color: muted }]}>
            Te sugerimos el 10% de tu consumo. Es voluntaria: puedes editar el monto o dejarlo en 0.
          </Text>

          <View style={styles.row}>
            <Text style={[styles.rowLabel, { color: muted }]}>Subtotal consumo</Text>
            <Text style={[styles.rowValue, { color: textColor }]}>{formatCLP(tableTotal)}</Text>
          </View>

          <Text style={[styles.fieldLabel, { color: muted }]}>MONTO DE PROPINA</Text>
          <View style={[styles.inputBox, { borderColor: textColor + '22' }]}>
            <Text style={[styles.currency, { color: muted }]}>$</Text>
            <TextInput
              value={String(amount)}
              onChangeText={(t) => setAmount(Math.max(0, Math.round(Number(t.replace(/[^0-9]/g, '')) || 0)))}
              keyboardType="number-pad"
              editable={!submitting}
              style={[styles.input, { color: textColor }]}
              placeholderTextColor={muted}
            />
          </View>

          <TouchableOpacity
            style={[styles.confirmBtn, { backgroundColor: primaryColor, opacity: submitting ? 0.6 : 1 }]}
            disabled={submitting}
            onPress={() => onConfirm(amount)}
          >
            {submitting ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.confirmText}>
                {amount > 0 ? `Agregar propina (${formatCLP(amount)})` : 'Pedir cuenta sin propina'}
              </Text>
            )}
          </TouchableOpacity>
        </Animated.View>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: { borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 40, gap: 16 },
  handle: { width: 44, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.15)', alignSelf: 'center', marginBottom: 4 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  iconBox: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '900', flexShrink: 1 },
  sub: { fontSize: 13, fontWeight: '500', lineHeight: 18 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  rowLabel: { fontSize: 13, fontWeight: '600' },
  rowValue: { fontSize: 15, fontWeight: '800' },
  fieldLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5, marginTop: 4 },
  inputBox: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 16, paddingHorizontal: 18, paddingVertical: 14 },
  currency: { fontSize: 18, fontWeight: '900' },
  input: { flex: 1, fontSize: 24, fontWeight: '900', padding: 0 },
  confirmBtn: { height: 56, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  confirmText: { fontSize: 16, fontWeight: '900', color: '#000' },
});
