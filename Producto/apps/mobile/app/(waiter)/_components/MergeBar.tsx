import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { XCircle } from 'lucide-react-native';
import Animated, { SlideInDown } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';

interface MergeBarProps {
  colors: any;
  isLight: boolean;
  selectedTables: string[];
  merging: boolean;
  onClose: () => void;
  onMerge: () => void;
  onUnmerge: () => void;
}

export function MergeBar({ colors, isLight, selectedTables, merging, onClose, onMerge, onUnmerge }: MergeBarProps) {
  return (
    <Animated.View entering={SlideInDown} style={[styles.mergeBar, { borderColor: colors.glassHeavy }]}>
      <BlurView intensity={80} tint={isLight ? 'light' : 'dark'} style={styles.mergeBarBlur}>
        <View style={styles.mergeBarInfo}>
          <Text style={[styles.mergeBarText, { color: colors.text }]}>GESTIÓN DE MESAS</Text>
          <Text style={{ color: colors.muted, fontSize: 9, fontWeight: '700' }}>{selectedTables.length} seleccionadas</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          <TouchableOpacity onPress={onClose} style={{ padding: 8 }}>
            <XCircle size={20} color={colors.muted} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onUnmerge}
            style={[styles.mergeBtn, { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: colors.brandAccent + '40' }, selectedTables.length === 0 && { opacity: 0.3 }]}
            disabled={selectedTables.length === 0 || merging}
          >
            <Text style={[styles.mergeBtnText, { color: colors.brandAccent }]}>SEPARAR</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onMerge}
            style={[styles.mergeBtn, { backgroundColor: colors.brandAccent }, selectedTables.length < 2 && { opacity: 0.3 }]}
            disabled={selectedTables.length < 2 || merging}
          >
            {merging ? <ActivityIndicator color="white" size="small" /> : <Text style={styles.mergeBtnText}>FUSIONAR</Text>}
          </TouchableOpacity>
        </View>
      </BlurView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  mergeBar: { position: 'absolute', bottom: 30, left: 16, right: 16, borderRadius: 28, overflow: 'hidden', borderWidth: 1, zIndex: 100 },
  mergeBarBlur: { padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  mergeBarInfo: { flex: 1, marginRight: 10 },
  mergeBarText: { fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
  mergeBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  mergeBtnText: { color: 'white', fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
});
