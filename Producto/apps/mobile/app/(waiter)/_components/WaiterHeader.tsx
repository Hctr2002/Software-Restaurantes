import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LogOut, AlertTriangle, Link2 } from 'lucide-react-native';
import { MB_SPACING } from '../../../constants/MB_Theme';

interface WaiterHeaderProps {
  colors: any;
  mergeMode: boolean;
  activeTab: 'mesas' | 'pedidos';
  onToggleMergeMode: () => void;
  onOpenAlerts: () => void;
  onSignOut: () => void;
}

export function WaiterHeader({ colors, mergeMode, activeTab, onToggleMergeMode, onOpenAlerts, onSignOut }: WaiterHeaderProps) {
  return (
    <View style={styles.header}>
      <View>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Terminal <Text style={{ color: colors.brandAccent }}>Garzón</Text>
        </Text>
        <View style={styles.statusBadge}>
          <View style={styles.onlineDot} />
          <Text style={[styles.statusText, { color: colors.muted }]}>EN LÍNEA</Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        {activeTab === 'mesas' && (
          <TouchableOpacity
            onPress={onToggleMergeMode}
            style={[styles.btn, { backgroundColor: mergeMode ? 'rgba(254, 95, 85, 0.2)' : 'rgba(255, 255, 255, 0.05)' }]}
          >
            <Link2 size={18} color={mergeMode ? '#FE5F55' : colors.muted} />
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={onOpenAlerts} style={[styles.btn, { backgroundColor: 'rgba(255, 152, 0, 0.1)' }]}>
          <AlertTriangle size={18} color="#FF9800" />
        </TouchableOpacity>
        <TouchableOpacity onPress={onSignOut} style={[styles.btn, { backgroundColor: 'rgba(244, 67, 54, 0.1)' }]}>
          <LogOut size={18} color="#F44336" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: MB_SPACING.lg,
    paddingTop: 60,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4CAF50' },
  statusText: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  btn: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
});
