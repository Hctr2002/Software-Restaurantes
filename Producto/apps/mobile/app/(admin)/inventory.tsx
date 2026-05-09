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
import { MB_COLORS, MB_SPACING, MB_RADIUS } from '../../constants/MB_Theme';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { InventoryModal, InventoryItemData } from '../../components/InventoryModal';

export default function InventoryScreen() {
  const { restaurantId } = useAuth();
  
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
        style={styles.card}
        onPress={() => handleOpenEdit(item)}
      >
        <View style={styles.itemInfo}>
          <View style={[styles.iconContainer, isCritical(item.stock) && styles.iconContainerCritical]}>
            <Package size={20} color={isCritical(item.stock) ? MB_COLORS.brandAccent : MB_COLORS.brandAccent} />
          </View>
          <View>
            <Text style={styles.itemName}>{item.name}</Text>
            <View style={styles.stockRow}>
              <Text style={[styles.stockValue, isCritical(item.stock) && styles.stockValueCritical]}>
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
        <ChevronRight size={20} color={MB_COLORS.muted} />
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Inventario</Text>
        <Text style={styles.headerSubtitle}>{items.length} insumos en stock</Text>
      </View>

      <View style={styles.searchBox}>
        <View style={styles.searchInputContainer}>
          <Search size={18} color={MB_COLORS.muted} style={styles.searchIcon} />
          <TextInput
            placeholder="Buscar insumo..."
            placeholderTextColor={MB_COLORS.muted}
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={handleSearch}
          />
        </View>
        <TouchableOpacity style={styles.addButton} onPress={handleOpenCreate}>
          <Plus size={24} color="white" />
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <View style={styles.centered}>
          <ActivityIndicator color={MB_COLORS.brandAccent} />
          <Text style={styles.loadingText}>Verificando existencias...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={MB_COLORS.brandAccent} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Package size={48} color={MB_COLORS.glassHeavy} />
              <Text style={styles.emptyText}>No hay insumos registrados</Text>
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
    backgroundColor: MB_COLORS.navy,
  },
  header: {
    paddingHorizontal: MB_SPACING.lg,
    paddingTop: 60,
    paddingBottom: MB_SPACING.md,
  },
  headerTitle: {
    fontSize: 28,
    color: 'white',
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: MB_COLORS.muted,
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
    backgroundColor: MB_COLORS.glass,
    borderRadius: 16,
    paddingHorizontal: 12,
    height: 48,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  addButton: {
    width: 48,
    height: 48,
    backgroundColor: MB_COLORS.brandAccent,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: MB_COLORS.brandAccent,
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
    backgroundColor: MB_COLORS.glass,
    borderRadius: MB_RADIUS.lg,
    padding: MB_SPACING.md,
    marginBottom: MB_SPACING.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
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
    backgroundColor: 'rgba(254, 95, 85, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainerCritical: {
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
  },
  itemName: {
    color: 'white',
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
    color: MB_COLORS.muted,
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

