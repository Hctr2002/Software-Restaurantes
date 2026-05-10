import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  RefreshControl,
  Image,
  Dimensions,
  TextInput
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { 
  Plus, 
  Search, 
  Package, 
  Edit2,
  Power
} from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import MenuItemModal from '../../components/MenuItemModal';
import { Buffer } from 'buffer';

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 2;
const ITEM_WIDTH = (width - 48) / COLUMN_COUNT;

export default function MenuScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [items, setItems] = React.useState<any[]>([]);
  const [categories, setCategories] = React.useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = React.useState('all');
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [restaurantId, setRestaurantId] = React.useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState<any | null>(null);

  const fetchMenuData = React.useCallback(async () => {
    try {
      const { data: profile } = await supabase
        .from('users')
        .select('restaurant_id')
        .eq('id', user?.id)
        .single();
      
      if (!profile?.restaurant_id) return;
      setRestaurantId(profile.restaurant_id);

      const { data: cats } = await supabase
        .from('categories')
        .select('*')
        .eq('restaurant_id', profile.restaurant_id)
        .order('name');
      
      setCategories(cats || []);

      const { data: menuItems, error } = await supabase
        .from('menu_items')
        .select('*, categories(name)')
        .eq('restaurant_id', profile.restaurant_id)
        .order('name');
      
      if (error) throw error;
      setItems(menuItems || []);
    } catch (err) {
      console.error('Error fetching menu:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  React.useEffect(() => {
    fetchMenuData();

    if (!user?.id) return;

    const channelSuffix = Math.random().toString(36).substring(7);

    // Suscripción para cambios en productos
    const menuChannel = supabase
      .channel(`admin-menu-items-${user?.id}-${channelSuffix}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'menu_items'
        },
        () => {
          fetchMenuData();
        }
      )
      .subscribe();

    // Suscripción para cambios en categorías
    const categoriesChannel = supabase
      .channel(`admin-categories-${user?.id}-${channelSuffix}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'categories'
        },
        () => {
          fetchMenuData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(menuChannel);
      supabase.removeChannel(categoriesChannel);
    };
  }, [fetchMenuData, user?.id]);

  const onRefresh = () => {
    setRefreshing(refreshing); // Dummy to satisfy lint if needed, but fetchMenuData handles it
    fetchMenuData();
  };

  const uploadImage = async (uri: string) => {
    if (!restaurantId) return null;
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const arrayBuffer = await new Response(blob).arrayBuffer();
      
      const fileName = `${Date.now()}.jpg`;
      const filePath = `${restaurantId}/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('menu-images')
        .upload(filePath, arrayBuffer, {
          contentType: 'image/jpeg',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('menu-images')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (err) {
      console.error('Error uploading image:', err);
      return null;
    }
  };

  const handleSaveProduct = async (data: any, newImageUri?: string) => {
    try {
      let finalImageUrl = data.image_url;

      if (newImageUri) {
        const uploadedUrl = await uploadImage(newImageUri);
        if (uploadedUrl) finalImageUrl = uploadedUrl;
      }

      const payload = {
        name: data.name,
        description: data.description,
        price: data.price,
        category_id: data.category_id,
        is_active: data.is_active,
        image_url: finalImageUrl,
        restaurant_id: restaurantId
      };

      if (data.id) {
        const { error } = await supabase
          .from('menu_items')
          .update(payload)
          .eq('id', data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('menu_items')
          .insert(payload);
        if (error) throw error;
      }

      fetchMenuData();
    } catch (err) {
      console.error('Error saving product:', err);
    }
  };

  const handleToggleActive = async (item: any) => {
    try {
      const { error } = await supabase
        .from('menu_items')
        .update({ is_active: !item.is_active })
        .eq('id', item.id);
      
      if (error) throw error;
      fetchMenuData();
    } catch (err) {
      console.error('Error toggling status:', err);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      fetchMenuData();
    } catch (err) {
      console.error('Error deleting product:', err);
    }
  };

  const filteredItems = items.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category_id === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const renderProduct = ({ item, index }: { item: any, index: number }) => (
    <Animated.View 
      entering={FadeInDown.delay(index * 100).duration(500)}
      style={[styles.productCard, { backgroundColor: colors.glass, borderColor: colors.glassHeavy }]}
    >
      <View style={[styles.imageContainer, { backgroundColor: colors.glassHeavy }]}>
        {item.image_url ? (
          <Image source={{ uri: item.image_url }} style={styles.productImage} />
        ) : (
          <View style={[styles.productImage, styles.placeholderImage]}>
            <Package size={32} color={colors.muted + '40'} />
          </View>
        )}
        <View style={styles.badgeContainer}>
          <View style={[styles.statusBadge, { backgroundColor: item.is_active ? colors.brandAccent : colors.muted }]}>
            <Text style={styles.statusText}>{item.is_active ? 'ACTIVO' : 'PAUSADO'}</Text>
          </View>
        </View>
      </View>

      <View style={styles.productInfo}>
        <Text style={[styles.productName, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
        <Text style={[styles.productCategory, { color: colors.muted }]}>{item.categories?.name || 'General'}</Text>
        <Text style={[styles.productPrice, { color: colors.brandAccent }]}>${item.price.toLocaleString()}</Text>
        
        <View style={styles.cardActions}>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: colors.glassHeavy }]}
            onPress={() => {
              setEditingItem(item);
              setIsModalVisible(true);
            }}
          >
            <Edit2 size={16} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: item.is_active ? colors.brandAccent + '20' : colors.muted + '20' }]}
            onPress={() => handleToggleActive(item)}
          >
            <Power size={16} color={item.is_active ? colors.brandAccent : colors.muted} />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.navy }]}>
      <BlurView intensity={80} tint="dark" style={[styles.header, { borderBottomColor: colors.glassHeavy }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={[styles.title, { color: colors.text }]}>Carta / Menú</Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>{items.length} productos registrados</Text>
          </View>
          <TouchableOpacity 
            style={[styles.addButton, { backgroundColor: colors.brandAccent, shadowColor: colors.brandAccent }]}
            onPress={() => {
              setEditingItem(null);
              setIsModalVisible(true);
            }}
          >
            <Plus size={24} color="white" />
          </TouchableOpacity>
        </View>

        <View style={[styles.searchContainer, { backgroundColor: colors.glass, borderColor: colors.glassHeavy }]}>
          <Search size={20} color={colors.muted} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Buscar plato o ingrediente..."
            placeholderTextColor={colors.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[{ id: 'all', name: 'Todos' }, ...categories]}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.categoriesList}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setSelectedCategory(item.id)}
              style={[
                styles.categoryTab,
                { backgroundColor: colors.glass, borderColor: colors.glassHeavy },
                selectedCategory === item.id && { backgroundColor: colors.brandAccent, borderColor: colors.brandAccent }
              ]}
            >
              <Text style={[
                styles.categoryTabText,
                { color: colors.muted },
                selectedCategory === item.id && { color: 'white' }
              ]}>
                {item.name}
              </Text>
            </TouchableOpacity>
          )}
        />
      </BlurView>

      <FlatList
        data={filteredItems}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        numColumns={COLUMN_COUNT}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnWrapper}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brandAccent} />
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <Package size={64} color={colors.glassHeavy} />
              <Text style={[styles.emptyText, { color: colors.muted }]}>No se encontraron platos</Text>
            </View>
          ) : null
        }
      />

      <MenuItemModal
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        onSave={handleSaveProduct}
        onDelete={handleDeleteProduct}
        item={editingItem}
        categories={categories}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -0.5,
    fontStyle: 'italic',
    textTransform: 'uppercase',
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '600',
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
  },
  categoriesList: {
    paddingBottom: 4,
  },
  categoryTab: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  categoryTabActive: {
    backgroundColor: '#fff',
  },
  categoryTabText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  categoryTabTextActive: {
    color: '#000',
  },
  listContent: {
    padding: 16,
    paddingTop: 24,
    paddingBottom: 100,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  productCard: {
    width: ITEM_WIDTH,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  imageContainer: {
    height: 120,
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeContainer: {
    position: 'absolute',
    top: 8,
    left: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: '900',
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
    textTransform: 'uppercase',
    fontStyle: 'italic',
    marginBottom: 2,
  },
  productCategory: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 8,
  },
  productPrice: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 12,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.3)',
    marginTop: 16,
    fontSize: 14,
    fontWeight: '600',
  }
});
