import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  TextInput, 
  RefreshControl,
  ActivityIndicator,
  Alert,
  Dimensions
} from 'react-native';
import { Table as TableIcon, Search, Plus, MapPin, ChevronRight, Hash } from 'lucide-react-native';
import { MB_COLORS, MB_SPACING, MB_RADIUS } from '../../constants/MB_Theme';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { TableModal, TableData } from '../../components/TableModal';

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 2;
const ITEM_WIDTH = (width - 48) / COLUMN_COUNT;

export default function TablesScreen() {
  const { restaurantId } = useAuth();
  const { colors } = useTheme();
  
  // States
  const [tables, setTables] = React.useState<TableData[]>([]);
  const [filteredTables, setFilteredTables] = React.useState<TableData[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  
  // Modal State
  const [modalVisible, setModalVisible] = React.useState(false);
  const [selectedTable, setSelectedTable] = React.useState<TableData | null>(null);

  const fetchTables = React.useCallback(async () => {
    if (!restaurantId) return;
    
    try {
      const { data, error } = await supabase
        .from('tables')
        .select('id, number, label, status, qrData:qr_data, restaurant_id')
        .eq('restaurant_id', restaurantId)
        .order('number', { ascending: true });

      if (error) throw error;
      setTables(data || []);
      setFilteredTables(data || []);
    } catch (err) {
      console.error('Error fetching tables:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [restaurantId]);

  React.useEffect(() => {
    fetchTables();

    if (!restaurantId) return;

    const channelSuffix = Math.random().toString(36).substring(7);

    // Suscripción Realtime
    const channel = supabase
      .channel(`admin-tables-realtime-${restaurantId}-${channelSuffix}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tables',
          filter: `restaurant_id=eq.${restaurantId}`
        },
        () => {
          fetchTables();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId, fetchTables]);

  // Handlers
  const onRefresh = () => {
    setRefreshing(true);
    fetchTables();
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (text.trim() === '') {
      setFilteredTables(tables);
    } else {
      const filtered = tables.filter(t => 
        t.number.toString().includes(text) || 
        (t.label && t.label.toLowerCase().includes(text.toLowerCase()))
      );
      setFilteredTables(filtered);
    }
  };

  const handleOpenEdit = (table: TableData) => {
    setSelectedTable(table);
    setModalVisible(true);
  };

  const handleOpenCreate = () => {
    setSelectedTable(null);
    setModalVisible(true);
  };

  const handleSaveTable = async (data: any) => {
    try {
      if (!restaurantId) return;

      const payload = {
        number: data.number,
        label: data.label,
        status: data.status,
        restaurant_id: restaurantId
      };

      if (data.id) {
        const { error } = await supabase
          .from('tables')
          .update(payload)
          .eq('id', data.id);
        if (error) throw error;
        Alert.alert('Éxito', 'Mesa actualizada correctamente');
      } else {
        // Generar qrData para la nueva mesa
        const { data: rest } = await supabase
          .from('restaurants')
          .select('slug')
          .eq('id', restaurantId)
          .single();
        
        const slug = rest?.slug || restaurantId;
        // Usar la URL de producción o desarrollo según corresponda
        const portalUrl = "https://menubites.vercel.app"; 
        const qr_data = `${portalUrl}/${slug}/${data.number}`;

        const { error } = await supabase
          .from('tables')
          .insert({ ...payload, qr_data });
        if (error) throw error;
        Alert.alert('Éxito', 'Mesa creada correctamente');
      }
      fetchTables();
      setModalVisible(false);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Error en la operación');
    }
  };

  const handleDeleteTable = async (id: string) => {
    Alert.alert(
      'Eliminar Mesa',
      '¿Estás seguro de que deseas eliminar esta mesa? Los pedidos asociados podrían verse afectados.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('tables')
                .delete()
                .eq('id', id);
              
              if (error) throw error;
              fetchTables();
              Alert.alert('Eliminado', 'La mesa ha sido eliminada');
            } catch (err: any) {
              Alert.alert('Error', 'No se pudo eliminar la mesa. Asegúrate de que no tenga pedidos activos.');
            }
          }
        }
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'FREE': return '#10b981';
      case 'OCCUPIED': return '#ef4444';
      case 'RESERVED': return '#f59e0b';
      case 'CLEANING': return '#3b82f6';
      default: return MB_COLORS.muted;
    }
  };

  const renderTable = ({ item, index }: { item: TableData, index: number }) => (
    <Animated.View entering={FadeInDown.delay(index * 50)}>
      <TouchableOpacity 
        style={[styles.tableCard, { backgroundColor: colors.glass, borderColor: colors.glassHeavy }]}
        onPress={() => handleOpenEdit(item)}
      >
        <View style={styles.tableHeader}>
          <View style={[styles.iconContainer, { backgroundColor: `${getStatusColor(item.status)}15` }]}>
            <TableIcon size={24} color={getStatusColor(item.status)} />
          </View>
          <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(item.status)}20` }]}>
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {item.status === 'FREE' ? 'LIBRE' : 
               item.status === 'OCCUPIED' ? 'OCUPADA' : 
               item.status === 'CLEANING' ? 'LIMPIEZA' : 'RESERVADA'}
            </Text>
          </View>
        </View>

        <View style={styles.tableInfo}>
          <Text style={[styles.tableNumber, { color: colors.text }]}>Mesa {item.number}</Text>
          <View style={styles.labelRow}>
            <MapPin size={10} color={colors.muted} />
            <Text style={[styles.tableLabel, { color: colors.muted }]} numberOfLines={1}>{item.label || 'Principal'}</Text>
          </View>
        </View>

        <View style={[styles.tableFooter, { borderTopColor: colors.glassHeavy }]}>
          <Text style={[styles.footerText, { color: colors.muted }]}>Ver detalles</Text>
          <ChevronRight size={14} color={colors.muted} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.navy }]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Gestión de Mesas</Text>
          <Text style={[styles.headerSubtitle, { color: colors.muted }]}>{tables.length} mesas en el salón</Text>
        </View>
        <TouchableOpacity 
          style={[styles.addButton, { backgroundColor: colors.brandAccent, shadowColor: colors.brandAccent }]} 
          onPress={handleOpenCreate}
        >
          <Plus size={24} color="white" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchBox}>
        <View style={[styles.searchInputContainer, { backgroundColor: colors.glass, borderColor: colors.glassHeavy }]}>
          <Search size={18} color={colors.muted} style={styles.searchIcon} />
          <TextInput
            placeholder="Buscar por número o ubicación..."
            placeholderTextColor={colors.muted}
            style={[styles.searchInput, { color: colors.text }]}
            value={searchQuery}
            onChangeText={handleSearch}
            keyboardType="default"
          />
        </View>
      </View>

      {loading && !refreshing ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.brandAccent} />
          <Text style={[styles.loadingText, { color: colors.muted }]}>Organizando el salón...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredTables}
          renderItem={renderTable}
          keyExtractor={item => item.id}
          numColumns={COLUMN_COUNT}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.columnWrapper}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brandAccent} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <TableIcon size={64} color={colors.glassHeavy} />
              <Text style={[styles.emptyText, { color: colors.muted }]}>No hay mesas configuradas</Text>
            </View>
          }
        />
      )}

      <TableModal 
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        table={selectedTable}
        onSave={handleSaveTable}
        onDelete={handleDeleteTable}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MB_COLORS.navy,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: MB_SPACING.lg,
    paddingTop: 60,
    paddingBottom: MB_SPACING.md,
  },
  headerTitle: {
    fontSize: 28,
    color: 'white',
    fontWeight: '900',
    letterSpacing: -0.5,
    fontStyle: 'italic',
    textTransform: 'uppercase',
  },
  headerSubtitle: {
    fontSize: 13,
    color: MB_COLORS.muted,
    fontWeight: '600',
    marginTop: 2,
  },
  addButton: {
    width: 52,
    height: 52,
    backgroundColor: MB_COLORS.brandAccent,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: MB_COLORS.brandAccent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  searchBox: {
    paddingHorizontal: MB_SPACING.lg,
    paddingBottom: MB_SPACING.md,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MB_COLORS.glass,
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 52,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
  },
  listContent: {
    padding: MB_SPACING.lg,
    paddingBottom: 40,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 16,
  },
  tableCard: {
    width: ITEM_WIDTH,
    backgroundColor: MB_COLORS.glass,
    borderRadius: 28,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 8,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  tableInfo: {
    marginBottom: 16,
  },
  tableNumber: {
    color: 'white',
    fontSize: 20,
    fontWeight: '900',
    fontStyle: 'italic',
    textTransform: 'uppercase',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  tableLabel: {
    color: MB_COLORS.muted,
    fontSize: 11,
    fontWeight: '600',
  },
  tableFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  footerText: {
    color: MB_COLORS.muted,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  loadingText: {
    color: MB_COLORS.muted,
    marginTop: 12,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    color: MB_COLORS.muted,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 16,
  },
});
