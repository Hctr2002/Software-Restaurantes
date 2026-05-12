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
import { useTheme } from '../../context/ThemeContext';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { CategoryModal, CategoryData } from '../../components/CategoryModal';

export default function CategoriesScreen() {
  const { restaurantId } = useAuth();
  const { colors } = useTheme();
  
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
        .select('id, name, is_active, target_station')
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

    const channelSuffix = Math.random().toString(36).substring(7);

    // Suscripción Realtime
    const channel = supabase
      .channel(`admin-categories-realtime-${restaurantId}-${channelSuffix}`)
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
        target_station: data.target_station,
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
        style={[styles.categoryCard, { backgroundColor: colors.glass, borderColor: colors.glassHeavy }, !item.is_active && styles.categoryCardInactive]}
        onPress={() => handleOpenEdit(item)}
      >
        <View style={styles.categoryInfo}>
          <View style={[styles.iconContainer, { backgroundColor: item.is_active ? colors.brandAccent + '15' : colors.glassHeavy }]}>
            <Tag size={20} color={item.is_active ? colors.brandAccent : colors.muted} />
          </View>
          <View>
            <Text style={[styles.categoryName, { color: colors.text }, !item.is_active && { color: colors.muted }]}>
              {item.name}
            </Text>
            {!item.is_active && (
              <Text style={[styles.inactiveBadge, { color: colors.brandAccent }]}>DESACTIVADA</Text>
            )}
          </View>
        </View>
        <ChevronRight size={20} color={colors.muted} />
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.navy }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Categorías</Text>
        <Text style={[styles.headerSubtitle, { color: colors.muted }]}>{categories.length} categorías registradas</Text>
      </View>

      <View style={styles.searchBox}>
        <View style={[styles.searchInputContainer, { backgroundColor: colors.glass, borderColor: colors.glassHeavy }]}>
          <Search size={18} color={colors.muted} style={styles.searchIcon} />
          <TextInput
            placeholder="Buscar categoría..."
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
          <Text style={[styles.loadingText, { color: colors.muted }]}>Cargando categorías...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredCategories}
          renderItem={renderCategory}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brandAccent} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Tag size={48} color={colors.glassHeavy} />
              <Text style={[styles.emptyText, { color: colors.muted }]}>No se encontraron categorías</Text>
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
    backgroundColor: '#0A1128',
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
    color: 'rgba(255, 255, 255, 0.4)',
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
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
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
    backgroundColor: '#FE5F55',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FE5F55',
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
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
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
    color: 'rgba(255, 255, 255, 0.4)',
  },
  inactiveBadge: {
    color: '#FE5F55',
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
    color: 'rgba(255, 255, 255, 0.4)',
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
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 16,
  },
});
