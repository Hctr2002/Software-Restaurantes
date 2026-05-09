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
import { Users, Search, Plus } from 'lucide-react-native';
import { MB_COLORS, MB_SPACING } from '../../constants/MB_Theme';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { UserCard, UserProfile } from '../../components/UserCard';
import { UserModal } from '../../components/UserModal';

export default function UsersScreen() {
  const { restaurantId } = useAuth();
  
  // States
  const [profiles, setProfiles] = React.useState<UserProfile[]>([]);
  const [filteredProfiles, setFilteredProfiles] = React.useState<UserProfile[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [page, setPage] = React.useState(0);
  const [hasMore, setHasMore] = React.useState(true);
  
  // Modal State
  const [modalVisible, setModalVisible] = React.useState(false);
  const [selectedUser, setSelectedUser] = React.useState<UserProfile | null>(null);

  const PAGE_SIZE = 15;

  const fetchProfiles = React.useCallback(async (pageNum = 0, isRefreshing = false) => {
    if (!restaurantId) return;
    
    try {
      const from = pageNum * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, error } = await supabase
        .from('users')
        .select('id, email, role, createdAt')
        .eq('restaurant_id', restaurantId)
        .order('createdAt', { ascending: false })
        .range(from, to);

      if (error) throw error;

      const newProfiles = data || [];
      
      setProfiles(prev => {
        const updated = isRefreshing ? newProfiles : [...prev, ...newProfiles];
        setFilteredProfiles(updated);
        return updated;
      });

      setHasMore(newProfiles.length === PAGE_SIZE);
      setPage(pageNum);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [restaurantId]);

  React.useEffect(() => {
    fetchProfiles(0, true);

    if (!restaurantId) return;

    const channelSuffix = Math.random().toString(36).substring(7);

    // Suscripción en tiempo real para la tabla de usuarios
    const channel = supabase
      .channel(`admin-users-realtime-${restaurantId}-${channelSuffix}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'users',
          filter: `restaurant_id=eq.${restaurantId}`
        },
        () => {
          fetchProfiles(0, true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId, fetchProfiles]);

  // Handlers
  const onRefresh = () => {
    setRefreshing(true);
    setHasMore(true);
    fetchProfiles(0, true);
  };

  const loadMore = () => {
    if (loadingMore || !hasMore || searchQuery.length > 0) return;
    setLoadingMore(true);
    fetchProfiles(page + 1);
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (text.trim() === '') {
      setFilteredProfiles(profiles);
    } else {
      const filtered = profiles.filter(p => 
        p.email.toLowerCase().includes(text.toLowerCase()) ||
        p.role.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredProfiles(filtered);
    }
  };

  const handleOpenEdit = (user: UserProfile) => {
    setSelectedUser(user);
    setModalVisible(true);
  };

  const handleOpenCreate = () => {
    setSelectedUser(null);
    setModalVisible(true);
  };

  const handleSaveUser = async (data: any) => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No hay sesión activa');

      if (data.id) {
        // UPDATE ROLE (Sigue siendo directo a la tabla users por RLS)
        const { error } = await supabase
          .from('users')
          .update({ role: data.role })
          .eq('id', data.id);
        
        if (error) throw error;
        Alert.alert('Éxito', 'Usuario actualizado correctamente');
      } else {
        // CREATE NEW USER (vía Edge Function)
        // La URL de la función se construye a partir de tu SUPABASE_URL
        const { data: result, error: funcError } = await supabase.functions.invoke('manage-users', {
          body: { 
            action: 'create',
            email: data.email,
            password: data.password,
            role: data.role
          }
        });

        if (funcError) throw funcError;
        if (result?.error) throw new Error(result.error);
        
        Alert.alert('Éxito', 'Usuario creado correctamente en el sistema');
      }
      onRefresh();
      setModalVisible(false);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Error en la operación');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    Alert.alert(
      'Eliminar Usuario',
      '¿Estás seguro de que deseas eliminar a este miembro del equipo?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const { data: result, error: funcError } = await supabase.functions.invoke('manage-users', {
                body: { action: 'delete', id }
              });
              
              if (funcError) throw funcError;
              if (result?.error) throw new Error(result.error);

              onRefresh();
              Alert.alert('Eliminado', 'El usuario ha sido removido del equipo');
            } catch (err: any) {
              Alert.alert('Error', err.message || 'No se pudo eliminar el usuario');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchBox}>
        <View style={styles.searchInputContainer}>
          <Search size={18} color={MB_COLORS.muted} style={styles.searchIcon} />
          <TextInput
            placeholder="Buscar por correo o rol..."
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
          <Text style={styles.loadingText}>Sincronizando equipo...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredProfiles}
          renderItem={({ item, index }) => (
            <UserCard 
              user={item} 
              index={index} 
              onPress={handleOpenEdit} 
            />
          )}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={MB_COLORS.brandAccent} />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator color={MB_COLORS.brandAccent} style={{ marginVertical: 20 }} />
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Users size={48} color={MB_COLORS.glassHeavy} />
              <Text style={styles.emptyText}>No se encontraron usuarios</Text>
            </View>
          }
        />
      )}

      <UserModal 
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        user={selectedUser}
        onSave={handleSaveUser}
        onDelete={handleDeleteUser}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MB_COLORS.navy,
  },
  searchBox: {
    flexDirection: 'row',
    padding: MB_SPACING.md,
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
    padding: MB_SPACING.md,
    paddingTop: 0,
    paddingBottom: 40,
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
