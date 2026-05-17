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
  Alert
} from 'react-native';
import { Package, Search, Plus, ChevronRight, AlertTriangle } from 'lucide-react-native';
import { MB_SPACING, MB_RADIUS } from '../../constants/MB_Theme';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { InventoryModal, InventoryItemData } from '../../components/InventoryModal';

export default function InventoryScreen() {
  const { restaurantId } = useAuth();
  const { colors } = useTheme();
  
  // States
  const [items, setItems] = React.useState<InventoryItemData[]>([]);
  const [filteredItems, setFilteredItems] = React.useState<InventoryItemData[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  
  // Modal State
  const [modalVisible, setModalVisible] = React.useState(false);
  const [selectedItem, setSelectedItem] = React.useState<InventoryItemData | null>(null);

  const fetchInventory = React.useCallback(async () => {
    if (!restaurantId) return;
    
    try {
      const { data, error } = await supabase
        .from('inventories')
        .select('id, name, stock, unit')
        .eq('restaurant_id', restaurantId)
        .order('name', { ascending: true });

      if (error) throw error;
      setItems(data || []);
      setFilteredItems(data || []);
    } catch (err) {
      console.error('Error fetching inventory:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [restaurantId]);

  React.useEffect(() => {
    fetchInventory();

    if (!restaurantId) return;

    const channelSuffix = Math.random().toString(36).substring(7);

    // Realtime Subscription
    const channel = supabase
      .channel(`admin-inventory-realtime-${restaurantId}-${channelSuffix}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'inventories',
          filter: `restaurant_id=eq.${restaurantId}`
        },
        () => {
          fetchInventory();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId, fetchInventory]);

  // Handlers
  const onRefresh = () => {
    setRefreshing(true);
    fetchInventory();
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (text.trim() === '') {
      setFilteredItems(items);
    } else {
      const filtered = items.filter(i => 
        i.name.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredItems(filtered);
    }
  };

  const handleOpenEdit = (item: InventoryItemData) => {
    setSelectedItem(item);
    setModalVisible(true);
  };

  const handleOpenCreate = () => {
    setSelectedItem(null);
    setModalVisible(true);
  };

  const handleSaveItem = async (data: any) => {
    try {
      if (!restaurantId) return;

      const payload = {
        name: data.name,
        stock: data.stock,
        unit: data.unit,
        restaurant_id: restaurantId
      };

      if (data.id) {
        const { error } = await supabase
          .from('inventories')
          .update(payload)
          .eq('id', data.id);
        if (error) throw error;
        Alert.alert('Éxito', 'Insumo actualizado correctamente');
      } else {
        const { error } = await supabase
          .from('inventories')
          .insert(payload);
        if (error) throw error;
        Alert.alert('Éxito', 'Insumo registrado correctamente');
      }
      fetchInventory();
      setModalVisible(false);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Error en la operación');
    }
  };

  const handleDeleteItem = async (id: string) => {
    Alert.alert(
      'Eliminar Insumo',
      '¿Estás seguro de eliminar este insumo del inventario?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('inventories')
                .delete()
                .eq('id', id);
              
              if (error) throw error;
              fetchInventory();
              Alert.alert('Eliminado', 'El insumo ha sido removido');
            } catch (err: any) {
              Alert.alert('Error', 'No se puede eliminar el insumo si está siendo utilizado en recetas.');
            }
          }
        }
      ]
    );
  };

  const isCritical = (stock: number) => stock < 10;

  const renderItem = ({ item, index }: { item: InventoryItemData, index: number }) => (
    <Animated.View entering={FadeInDown.delay(index * 50)}>
      <TouchableOpacity 
        style={[styles.card, { backgroundColor: colors.glass, borderColor: colors.glassHeavy }]}
        onPress={() => handleOpenEdit(item)}
      >
        <View style={styles.itemInfo}>
          <View style={[styles.iconContainer, isCritical(item.stock) && styles.iconContainerCritical, { backgroundColor: isCritical(item.stock) ? 'rgba(255, 152, 0, 0.1)' : colors.brandAccent + '15' }]}>
            <Package size={20} color={isCritical(item.stock) ? '#FF9800' : colors.brandAccent} />
          </View>
          <View>
            <Text style={[styles.itemName, { color: colors.text }]}>{item.name}</Text>
            <View style={styles.stockRow}>
              <Text style={[styles.stockValue, { color: colors.muted }, isCritical(item.stock) && styles.stockValueCritical]}>
                {item.stock} {item.unit}
              </Text>
              {isCritical(item.stock) && (
                <View style={styles.criticalBadge}>
                  <AlertTriangle size={10} color="white" />
                  <Text style={styles.criticalText}>STOCK BAJO</Text>
                </View>
              )}
            </View>
          </View>
        </View>
        <ChevronRight size={20} color={colors.muted} />
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.navy }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Inventario</Text>
        <Text style={[styles.headerSubtitle, { color: colors.muted }]}>{items.length} insumos en stock</Text>
      </View>

      <View style={styles.searchBox}>
        <View style={[styles.searchInputContainer, { backgroundColor: colors.glass, borderColor: colors.glassHeavy }]}>
          <Search size={18} color={colors.muted} style={styles.searchIcon} />
          <TextInput
            placeholder="Buscar insumo..."
            placeholderTextColor={colors.muted}
            style={[styles.searchInput, { color: colors.text }]}
            value={searchQuery}
            onChangeText={handleSearch}
          />
        </View>
        <TouchableOpacity 
          style={[styles.addButton, { backgroundColor: colors.brandAccent, shadowColor: colors.brandAccent }]} 
          onPress={handleOpenCreate}
        >
          <Plus size={24} color="white" />
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.brandAccent} />
          <Text style={[styles.loadingText, { color: colors.muted }]}>Verificando existencias...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brandAccent} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Package size={48} color={colors.glassHeavy} />
              <Text style={[styles.emptyText, { color: colors.muted }]}>No hay insumos registrados</Text>
            </View>
          }
        />
      )}

      <InventoryModal 
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        item={selectedItem}
        onSave={handleSaveItem}
        onDelete={handleDeleteItem}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: MB_SPACING.lg,
    paddingTop: 60,
    paddingBottom: MB_SPACING.md,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  searchBox: {
    flexDirection: 'row',
    padding: MB_SPACING.lg,
    paddingTop: 0,
    gap: 12,
    alignItems: 'center',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 12,
    height: 48,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  listContent: {
    padding: MB_SPACING.lg,
    paddingTop: 0,
    paddingBottom: 40,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: MB_RADIUS.lg,
    padding: MB_SPACING.md,
    marginBottom: MB_SPACING.sm,
    borderWidth: 1,
  },
  itemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainerCritical: {
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
  },
  itemName: {
    fontSize: 16,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  stockValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  stockValueCritical: {
    color: '#FF9800',
  },
  criticalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FF9800',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  criticalText: {
    color: 'white',
    fontSize: 8,
    fontWeight: '900',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
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
    fontSize: 14,
    fontWeight: '700',
    marginTop: 16,
  },
});

