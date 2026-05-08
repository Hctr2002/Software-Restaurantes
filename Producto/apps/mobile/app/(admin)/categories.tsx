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
import { Tag, Search, Plus, ChevronRight } from 'lucide-react-native';
import { MB_COLORS, MB_SPACING, MB_RADIUS } from '../../constants/MB_Theme';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { CategoryModal, CategoryData } from '../../components/CategoryModal';

export default function CategoriesScreen() {
  const { restaurantId } = useAuth();
  
  // States
  const [categories, setCategories] = React.useState<CategoryData[]>([]);
  const [filteredCategories, setFilteredCategories] = React.useState<CategoryData[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  
  // Modal State
  const [modalVisible, setModalVisible] = React.useState(false);
  const [selectedCategory, setSelectedCategory] = React.useState<CategoryData | null>(null);

  const fetchCategories = React.useCallback(async () => {
    if (!restaurantId) return;
    
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, is_active')
        .eq('restaurant_id', restaurantId)
        .order('name', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
      setFilteredCategories(data || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [restaurantId]);

  React.useEffect(() => {
    fetchCategories();

    if (!restaurantId) return;

    // Suscripción Realtime
    const channel = supabase
      .channel('admin-categories-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'categories',
          filter: `restaurant_id=eq.${restaurantId}`
        },
        () => {
          fetchCategories();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId, fetchCategories]);

  // Handlers
  const onRefresh = () => {
    setRefreshing(true);
    fetchCategories();
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (text.trim() === '') {
      setFilteredCategories(categories);
    } else {
      const filtered = categories.filter(c => 
        c.name.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredCategories(filtered);
    }
  };

  const handleOpenEdit = (category: CategoryData) => {
    setSelectedCategory(category);
    setModalVisible(true);
  };

  const handleOpenCreate = () => {
    setSelectedCategory(null);
    setModalVisible(true);
  };

  const handleSaveCategory = async (data: any) => {
    try {
      if (!restaurantId) return;

      const payload = {
        name: data.name,
        is_active: data.is_active,
        restaurant_id: restaurantId
      };

      if (data.id) {
        const { error } = await supabase
          .from('categories')
          .update(payload)
          .eq('id', data.id);
        if (error) throw error;
        Alert.alert('Éxito', 'Categoría actualizada correctamente');
      } else {
        const { error } = await supabase
          .from('categories')
          .insert(payload);
        if (error) throw error;
        Alert.alert('Éxito', 'Categoría creada correctamente');
      }
      fetchCategories();
      setModalVisible(false);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Error en la operación');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    Alert.alert(
      'Eliminar Categoría',
      '¿Estás seguro? Esto podría afectar a los productos asociados.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('categories')
                .delete()
                .eq('id', id);
              
              if (error) throw error;
              fetchCategories();
              Alert.alert('Eliminado', 'La categoría ha sido eliminada');
            } catch (err: any) {
              Alert.alert('Error', 'No se puede eliminar la categoría si tiene productos asociados.');
            }
          }
        }
      ]
    );
  };

  const renderCategory = ({ item, index }: { item: CategoryData, index: number }) => (
    <Animated.View entering={FadeInDown.delay(index * 50)}>
      <TouchableOpacity 
        style={[styles.categoryCard, !item.is_active && styles.categoryCardInactive]}
        onPress={() => handleOpenEdit(item)}
      >
        <View style={styles.categoryInfo}>
          <View style={[styles.iconContainer, !item.is_active && styles.iconContainerInactive]}>
            <Tag size={20} color={item.is_active ? MB_COLORS.brandAccent : MB_COLORS.muted} />
          </View>
          <View>
            <Text style={[styles.categoryName, !item.is_active && styles.categoryNameInactive]}>
              {item.name}
            </Text>
            {!item.is_active && (
              <Text style={styles.inactiveBadge}>DESACTIVADA</Text>
            )}
          </View>
        </View>
        <ChevronRight size={20} color={MB_COLORS.muted} />
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Categorías</Text>
        <Text style={styles.headerSubtitle}>{categories.length} categorías registradas</Text>
      </View>

      <View style={styles.searchBox}>
        <View style={styles.searchInputContainer}>
          <Search size={18} color={MB_COLORS.muted} style={styles.searchIcon} />
          <TextInput
            placeholder="Buscar categoría..."
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
          <Text style={styles.loadingText}>Cargando categorías...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredCategories}
          renderItem={renderCategory}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={MB_COLORS.brandAccent} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Tag size={48} color={MB_COLORS.glassHeavy} />
              <Text style={styles.emptyText}>No se encontraron categorías</Text>
            </View>
          }
        />
      )}

      <CategoryModal 
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        category={selectedCategory}
        onSave={handleSaveCategory}
        onDelete={handleDeleteCategory}
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
  categoryCard: {
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
  categoryCardInactive: {
    opacity: 0.6,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(254, 95, 85, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainerInactive: {
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  categoryName: {
    color: 'white',
    fontSize: 16,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  categoryNameInactive: {
    color: MB_COLORS.muted,
  },
  inactiveBadge: {
    color: MB_COLORS.brandAccent,
    fontSize: 8,
    fontWeight: '900',
    marginTop: 2,
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
