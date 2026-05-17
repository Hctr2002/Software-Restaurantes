import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Bell, RefreshCw, Receipt, Sparkles, ChevronDown, CheckCircle2 } from 'lucide-react-native';
import Animated, { FadeInUp, FadeInLeft, Layout } from 'react-native-reanimated';
import { MB_SPACING } from '../../../constants/MB_Theme';

interface WaiterIslandsProps {
  colors: any;
  readyOrders: any[];
  readyTablesList: string;
  helpRequestedTables: any[];
  cleaningTables: any[];
  billRequestedTables: any[];
  isIslandExpanded: boolean;
  onToggleIsland: () => void;
  onDeliver: (orderId: string) => void;
  onHelpComplete: (tableId: string) => void;
  onTableClean: (tableId: string) => void;
  onSetTipTable: (table: any) => void;
}

export function WaiterIslands({
  colors, readyOrders, readyTablesList, helpRequestedTables, cleaningTables, billRequestedTables,
  isIslandExpanded, onToggleIsland, onDeliver, onHelpComplete, onTableClean, onSetTipTable,
}: WaiterIslandsProps) {
  if (readyOrders.length === 0 && helpRequestedTables.length === 0 && cleaningTables.length === 0 && billRequestedTables.length === 0) {
    return null;
  }

  return (
    <View style={styles.islandsContainer}>
      {readyOrders.length > 0 && (
        <Animated.View entering={FadeInUp} layout={Layout.springify()} style={[styles.island, { backgroundColor: 'rgba(76, 175, 80, 0.1)', borderColor: 'rgba(76, 175, 80, 0.2)' }]}>
          <View style={styles.islandHeader}>
            <View style={styles.islandIconContainer}>
              <Sparkles size={20} color="#4CAF50" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.islandTitle, { color: '#4CAF50' }]}>PLATOS LISTOS</Text>
              <Text style={[styles.islandSub, { color: 'rgba(76,175,80,0.7)' }]}>{readyTablesList}</Text>
            </View>
            <TouchableOpacity onPress={onToggleIsland} style={styles.islandToggle}>
              <Animated.View style={{ transform: [{ rotate: isIslandExpanded ? '180deg' : '0deg' }] }}>
                <ChevronDown size={20} color="#4CAF50" />
              </Animated.View>
            </TouchableOpacity>
          </View>
          {isIslandExpanded && (
            <View style={[styles.islandContent, { borderTopColor: colors.glassHeavy }]}>
              {readyOrders.map(order => (
                <TouchableOpacity key={order.id} style={styles.readyOrderRow} onPress={() => onDeliver(order.id)}>
                  <View style={styles.readyOrderTable}>
                    <Text style={styles.readyOrderTableText}>{order.tables?.number}</Text>
                  </View>
                  <Text style={[styles.readyOrderText, { color: colors.text }]} numberOfLines={1}>
                    {order.order_items.map((it: any) => `${it.quantity}x ${it.menu_items.name}`).join(', ')}
                  </Text>
                  <CheckCircle2 size={16} color="#4CAF50" />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </Animated.View>
      )}

      {helpRequestedTables.length > 0 && (
        <Animated.View entering={FadeInLeft} layout={Layout.springify()} style={[styles.island, { backgroundColor: 'rgba(244, 67, 54, 0.1)', borderColor: 'rgba(244, 67, 54, 0.2)' }]}>
          <View style={styles.islandHeader}>
            <Bell size={20} color="#F44336" />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.islandTitle, { color: '#F44336' }]}>AYUDA SOLICITADA</Text>
              <Text style={[styles.islandSub, { color: 'rgba(244, 67, 54, 0.6)' }]}>{helpRequestedTables.length} mesa(s) esperando</Text>
            </View>
            <View style={styles.islandActions}>
              {helpRequestedTables.slice(0, 2).map(t => (
                <TouchableOpacity key={t.id} onPress={() => onHelpComplete(t.id)} style={styles.islandActionBtn}>
                  <Text style={styles.islandActionText}>Mesa {t.number} ✓</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Animated.View>
      )}

      {cleaningTables.length > 0 && (
        <Animated.View entering={FadeInLeft} layout={Layout.springify()} style={[styles.island, { backgroundColor: 'rgba(33, 150, 243, 0.1)', borderColor: 'rgba(33, 150, 243, 0.2)' }]}>
          <View style={styles.islandHeader}>
            <RefreshCw size={20} color="#2196F3" />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.islandTitle, { color: '#2196F3' }]}>LIMPIEZA</Text>
              <Text style={[styles.islandSub, { color: 'rgba(33, 150, 243, 0.6)' }]}>{cleaningTables.length} pendiente(s)</Text>
            </View>
            <View style={styles.islandActions}>
              {cleaningTables.slice(0, 2).map(t => (
                <TouchableOpacity key={t.id} onPress={() => onTableClean(t.id)} style={[styles.islandActionBtn, { backgroundColor: 'rgba(33, 150, 243, 0.2)' }]}>
                  <Text style={[styles.islandActionText, { color: '#2196F3' }]}>Mesa {t.number} ✓</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Animated.View>
      )}

      {billRequestedTables.length > 0 && (
        <Animated.View entering={FadeInLeft} layout={Layout.springify()} style={[styles.island, { backgroundColor: 'rgba(255, 215, 0, 0.1)', borderColor: 'rgba(255, 215, 0, 0.2)' }]}>
          <View style={styles.islandHeader}>
            <Receipt size={20} color="#FFD700" />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.islandTitle, { color: '#FFD700' }]}>CUENTAS SOLICITADAS</Text>
              <Text style={[styles.islandSub, { color: 'rgba(255, 215, 0, 0.6)' }]}>{billRequestedTables.length} mesa(s) por cobrar</Text>
            </View>
            <View style={styles.islandActions}>
              {billRequestedTables.slice(0, 2).map(t => (
                <TouchableOpacity key={t.id} onPress={() => onSetTipTable(t)} style={[styles.islandActionBtn, { backgroundColor: 'rgba(255, 215, 0, 0.2)' }]}>
                  <Text style={[styles.islandActionText, { color: '#FFD700' }]}>Mesa {t.number}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  islandsContainer: { paddingHorizontal: MB_SPACING.lg, gap: 12, marginBottom: 10 },
  island: { borderRadius: 24, padding: 16, borderWidth: 1 },
  islandHeader: { flexDirection: 'row', alignItems: 'center' },
  islandIconContainer: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(76, 175, 80, 0.2)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  islandTitle: { fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  islandSub: { fontSize: 10, fontWeight: '700', marginTop: 2 },
  islandToggle: { padding: 8 },
  islandContent: { marginTop: 12, borderTopWidth: 1, paddingTop: 12, gap: 8 },
  readyOrderRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
  readyOrderTable: { width: 24, height: 24, borderRadius: 6, backgroundColor: 'rgba(76, 175, 80, 0.2)', justifyContent: 'center', alignItems: 'center' },
  readyOrderTableText: { color: '#4CAF50', fontSize: 10, fontWeight: '900' },
  readyOrderText: { flex: 1, fontSize: 12, fontWeight: '700' },
  islandActions: { flexDirection: 'row', gap: 8 },
  islandActionBtn: { backgroundColor: 'rgba(244, 67, 54, 0.2)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  islandActionText: { color: '#F44336', fontSize: 10, fontWeight: '900' },
});
