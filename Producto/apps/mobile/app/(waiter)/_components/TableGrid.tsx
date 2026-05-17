import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Receipt, Sparkles, Link2 } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { MB_SPACING } from '../../../constants/MB_Theme';

const { width } = Dimensions.get('window');

interface TableGridProps {
  tables: any[];
  mergeMode: boolean;
  selectedTables: string[];
  colors: any;
  readyTableIds: Set<string>;
  mergedNumbersBySession: Record<string, number[]>;
  onTablePress: (table: any) => void;
}

export function TableGrid({ tables, mergeMode, selectedTables, colors, readyTableIds, mergedNumbersBySession, onTablePress }: TableGridProps) {
  return (
    <View style={styles.grid}>
      {tables.map((table, i) => (
        <Animated.View key={table.id} entering={FadeInDown.delay(i * 50)}>
          <TouchableOpacity
            style={[
              styles.tableCard,
              { backgroundColor: colors.glass, borderColor: colors.glassHeavy },
              table.status === 'OCCUPIED' && { borderColor: colors.brandAccent + '40' },
              !!mergedNumbersBySession[table.current_session_id] && { backgroundColor: colors.brandAccent + '10', borderColor: colors.brandAccent + '80' },
              selectedTables.includes(table.id) && { borderColor: '#FE5F55', backgroundColor: 'rgba(254, 95, 85, 0.1)' },
            ]}
            onPress={() => onTablePress(table)}
          >
            <View style={[styles.tableHeader, { borderBottomColor: colors.glassHeavy }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={[styles.tableNumber, { color: colors.text }]}>{table.number}</Text>
                {!!mergedNumbersBySession[table.current_session_id] && (
                  <View style={{ backgroundColor: colors.brandAccent, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                    <Link2 size={8} color="white" />
                    <Text style={{ color: 'white', fontSize: 8, fontWeight: '900' }}>FUSIÓN</Text>
                  </View>
                )}
              </View>
              <View style={[styles.statusDot, { backgroundColor: table.status === 'FREE' ? '#4CAF50' : '#FF9800' }]} />
            </View>

            <View style={styles.tableBody}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.tableStatus, { color: colors.muted }]}>
                  {table.status === 'FREE' ? 'LIBRE' : 'OCUPADA'}
                </Text>
                {table.current_session_id && mergedNumbersBySession[table.current_session_id] && (
                  <Text style={{ color: colors.brandAccent, fontSize: 9, fontWeight: '900', marginTop: 3 }} numberOfLines={1}>
                    + {mergedNumbersBySession[table.current_session_id].filter(n => n !== table.number).map(n => `M.${n}`).join(', ')}
                  </Text>
                )}
              </View>
              <View style={{ flexDirection: 'row', gap: 4 }}>
                {table.bill_requested && (
                  <View style={styles.tableIconBadge}>
                    <Receipt size={14} color="#FFD700" />
                  </View>
                )}
                {readyTableIds.has(table.id) && (
                  <View style={[styles.tableIconBadge, { backgroundColor: 'rgba(76, 175, 80, 0.1)' }]}>
                    <Sparkles size={14} color="#4CAF50" />
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  tableCard: { width: (width - MB_SPACING.lg * 2 - 12) / 2, borderRadius: 20, borderWidth: 1, overflow: 'hidden' },
  tableHeader: { padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1 },
  tableNumber: { fontSize: 20, fontWeight: '900' },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  tableBody: { padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tableStatus: { fontSize: 10, fontWeight: '800' },
  tableIconBadge: { width: 24, height: 24, borderRadius: 8, backgroundColor: 'rgba(255, 215, 0, 0.1)', justifyContent: 'center', alignItems: 'center' },
});
