import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Receipt } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { TIP_COLOR } from '../../../constants/MB_Theme';
import { ThemeColors } from '../../../context/ThemeContext';

interface Table {
  id: string;
  number: number;
  status: string;
  bill_requested: boolean;
  tip_included: boolean;
}

interface TipModalProps {
  table: Table | null;
  colors: ThemeColors;
  isLight: boolean;
  onClose: () => void;
  onConfirm: (tableId: string, includeTip: boolean) => void;
}

export function TipModal({ table, colors, isLight, onClose, onConfirm }: TipModalProps) {
  return (
    <Modal visible={!!table} transparent animationType="none" onRequestClose={onClose}>
      <BlurView intensity={20} tint={isLight ? 'light' : 'dark'} style={{ flex: 1 }}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
        <Animated.View entering={FadeInDown.springify()} style={[styles.tipSheet, { backgroundColor: colors.navy, borderTopColor: colors.glassHeavy }]}>
          <View style={styles.tipHeader}>
            <View style={[styles.tipIconBox, { backgroundColor: TIP_COLOR + '1A' }]}>
              <Receipt size={20} color={TIP_COLOR} />
            </View>
            <View>
              <Text style={[styles.tipTitle, { color: colors.text }]}>PROPINA — MESA {table?.number}</Text>
              <Text style={[styles.tipSub, { color: colors.muted }]}>¿El cliente desea incluir el 10% sugerido?</Text>
            </View>
          </View>
          <View style={styles.tipBtnRow}>
            <TouchableOpacity style={[styles.tipBtn, { backgroundColor: colors.glass }]} onPress={() => onConfirm(table!.id, false)}>
              <Text style={[styles.tipBtnText, { color: colors.muted }]}>No incluir</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.tipBtn, { backgroundColor: TIP_COLOR }]} onPress={() => onConfirm(table!.id, true)}>
              <Text style={[styles.tipBtnText, { color: '#000' }]}>Sí, incluir propina</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  tipSheet: { borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 40, borderTopWidth: 1, gap: 24 },
  tipHeader: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  tipIconBox: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  tipTitle: { fontSize: 14, fontWeight: '900', letterSpacing: 0.5 },
  tipSub: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  tipBtnRow: { flexDirection: 'row', gap: 12 },
  tipBtn: { flex: 1, height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  tipBtnText: { fontSize: 13, fontWeight: '900', letterSpacing: 0.5 },
});
