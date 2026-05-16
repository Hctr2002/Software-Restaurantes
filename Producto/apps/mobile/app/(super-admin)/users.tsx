import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { Users, AlertCircle, Edit2, Trash2, Plus, X, Eye, EyeOff } from 'lucide-react-native';
import { MB_COLORS, MB_SPACING, MB_RADIUS } from '../../constants/MB_Theme';
import { supabase } from '../../lib/supabase';
import { SUPERADMIN_API } from '../../lib/api';

type UserRecord = {
  id: string;
  email: string;
  role: string;
  createdAt: string;
  restaurants?: { name: string } | { name: string }[] | null;
  restaurant_id?: string | null;
};

const ROLES = ['SUPER_ADMIN', 'ADMIN', 'GARZON', 'COCINA', 'CAJERO', 'BAR'];

export default function UsersTab() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [restaurants, setRestaurants] = useState<{id: string, name: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ email: '', password: '', role: 'GARZON', restaurantId: '' as string | null });
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const fetchData = async () => {
    try {
      setError(null);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No hay sesión activa");

      const [usersRes, restRes] = await Promise.all([
        fetch(`${SUPERADMIN_API}/api/admin/users`, { headers: { Authorization: `Bearer ${session.access_token}` } }),
        fetch(`${SUPERADMIN_API}/api/admin/restaurants`, { headers: { Authorization: `Bearer ${session.access_token}` } })
      ]);
      
      const usersJson: any = await usersRes.json();
      const restJson: any = await restRes.json();
      
      if (!usersRes.ok) throw new Error(usersJson.error || 'Error al cargar usuarios');
      
      setUsers(usersJson.data || []);
      setRestaurants(restJson.data || []);
    } catch (err: any) {
      setError(err.message || 'Error al cargar los datos');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const openCreateModal = () => {
    setEditingId(null);
    setFormData({ email: '', password: '', role: 'GARZON', restaurantId: null });
    setModalVisible(true);
  };

  const openEditModal = (user: UserRecord) => {
    setEditingId(user.id);
    setFormData({ 
      email: user.email, 
      password: '', 
      role: user.role, 
      restaurantId: user.restaurant_id || null 
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formData.email) {
      Alert.alert('Error', 'El email es obligatorio');
      return;
    }
    if (!editingId && !formData.password) {
      Alert.alert('Error', 'La contraseña es obligatoria para nuevos usuarios');
      return;
    }
    
    setSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId ? `${SUPERADMIN_API}/api/admin/users/${editingId}` : `${SUPERADMIN_API}/api/admin/users`;

      // Clean payload
      const payload: any = { ...formData };
      if (editingId && !payload.password) {
        delete payload.password; // Don't send empty password on update
      }

      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}` 
        },
        body: JSON.stringify(payload)
      });
      
      const json: any = await res.json();
      if (!res.ok) throw new Error(json.error || 'Error al guardar');
      
      setModalVisible(false);
      setLoading(true);
      fetchData();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = (id: string, email: string) => {
    Alert.alert(
      'Eliminar Usuario',
      `¿Estás seguro de eliminar a "${email}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => handleDelete(id) }
      ]
    );
  };

  const handleDelete = async (id: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${SUPERADMIN_API}/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session?.access_token}` }
      });
      if (!res.ok) {
        const json: any = await res.json();
        throw new Error(json.error || 'Error al eliminar');
      }
      setLoading(true);
      fetchData();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  if (loading && users.length === 0) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={MB_COLORS.brandAccent} />
        <Text style={styles.loadingText}>Cargando usuarios...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.container} 
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={MB_COLORS.brandAccent} />}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Usuarios</Text>
            <Text style={styles.subtitle}>Gestión global de identidades</Text>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={openCreateModal}>
            <Plus color="#fff" size={24} />
          </TouchableOpacity>
        </View>

        {error && (
          <View style={styles.errorBox}>
            <AlertCircle color="#ef4444" size={20} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {users.length === 0 ? (
          <View style={styles.emptyBox}>
            <Users color={MB_COLORS.muted} size={40} />
            <Text style={styles.emptyText}>Aún no existen usuarios registrados.</Text>
          </View>
        ) : (
          users.map((userRow) => {
            const restaurantName = Array.isArray(userRow.restaurants)
              ? userRow.restaurants[0]?.name
              : userRow.restaurants?.name;

            return (
              <View key={userRow.id} style={styles.cardItem}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardItemTitle}>{userRow.email}</Text>
                </View>
                <Text style={styles.cardItemSub}>
                  <Text style={styles.roleText}>{userRow.role}</Text> • {restaurantName || "Sin organización"}
                </Text>

                <View style={styles.cardFooter}>
                  <Text style={styles.cardItemDate}>Creado el {formatDate(userRow.createdAt)}</Text>
                  <View style={styles.actionButtons}>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => openEditModal(userRow)}>
                      <Edit2 color={MB_COLORS.brandAccent} size={18} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => confirmDelete(userRow.id, userRow.email)}>
                      <Trash2 color="#ef4444" size={18} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* CREATE/EDIT MODAL */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingId ? 'Editar Usuario' : 'Nuevo Usuario'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X color={MB_COLORS.muted} size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 500 }} showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput 
                  style={styles.input} 
                  placeholder="usuario@ejemplo.com" 
                  placeholderTextColor={MB_COLORS.muted}
                  value={formData.email}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  onChangeText={(text) => setFormData({ ...formData, email: text.trim() })}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Contraseña {editingId && '(Opcional)'}</Text>
                <View style={styles.passwordContainer}>
                  <TextInput 
                    style={[styles.input, { flex: 1, backgroundColor: 'transparent', borderWidth: 0 }]} 
                    placeholder={editingId ? "Dejar en blanco para no cambiar" : "Mínimo 6 caracteres"} 
                    placeholderTextColor={MB_COLORS.muted}
                    value={formData.password}
                    secureTextEntry={!showPassword}
                    onChangeText={(text) => setFormData({ ...formData, password: text })}
                  />
                  <TouchableOpacity 
                    style={styles.eyeIcon} 
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff color={MB_COLORS.muted} size={20} />
                    ) : (
                      <Eye color={MB_COLORS.muted} size={20} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Rol</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                  {ROLES.map(r => (
                    <TouchableOpacity 
                      key={r} 
                      style={[styles.pill, formData.role === r && styles.pillActive]}
                      onPress={() => setFormData({ ...formData, role: r })}
                    >
                      <Text style={[styles.pillText, formData.role === r && styles.pillTextActive]}>{r}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Organización (Opcional)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                  <TouchableOpacity 
                    style={[styles.pill, formData.restaurantId === null && styles.pillActive]}
                    onPress={() => setFormData({ ...formData, restaurantId: null })}
                  >
                    <Text style={[styles.pillText, formData.restaurantId === null && styles.pillTextActive]}>Ninguna</Text>
                  </TouchableOpacity>
                  {restaurants.map(rest => (
                    <TouchableOpacity 
                      key={rest.id} 
                      style={[styles.pill, formData.restaurantId === rest.id && styles.pillActive]}
                      onPress={() => setFormData({ ...formData, restaurantId: rest.id })}
                    >
                      <Text style={[styles.pillText, formData.restaurantId === rest.id && styles.pillTextActive]}>{rest.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <TouchableOpacity 
                style={[styles.submitButton, submitting && styles.submitButtonDisabled]} 
                onPress={handleSave} 
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>{editingId ? 'Guardar Cambios' : 'Crear Usuario'}</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: MB_COLORS.navy },
  content: { padding: MB_SPACING.xl, paddingBottom: 40, paddingTop: 60 },
  centered: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: MB_COLORS.muted, marginTop: MB_SPACING.md },
  header: { marginBottom: MB_SPACING.xl, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '800', color: MB_COLORS.cream },
  subtitle: { fontSize: 14, color: MB_COLORS.muted, marginTop: 4 },
  addButton: { backgroundColor: MB_COLORS.brandAccent, width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4 },
  errorBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)', borderWidth: 1, padding: MB_SPACING.md, borderRadius: MB_RADIUS.md, marginBottom: MB_SPACING.lg, gap: MB_SPACING.sm },
  errorText: { color: '#ef4444', fontSize: 14, fontWeight: '500', flex: 1 },
  emptyBox: { alignItems: 'center', justifyContent: 'center', padding: MB_SPACING.xxl, opacity: 0.5 },
  emptyText: { color: MB_COLORS.muted, marginTop: MB_SPACING.md },
  cardItem: { backgroundColor: MB_COLORS.glassHeavy, padding: MB_SPACING.lg, borderRadius: MB_RADIUS.lg, marginBottom: MB_SPACING.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  cardItemTitle: { fontSize: 18, fontWeight: 'bold', color: MB_COLORS.cream, flex: 1 },
  cardItemSub: { fontSize: 14, color: MB_COLORS.muted, marginBottom: MB_SPACING.sm },
  roleText: { color: MB_COLORS.brandAccent, fontWeight: 'bold' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: MB_SPACING.sm, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', paddingTop: MB_SPACING.sm },
  cardItemDate: { fontSize: 12, color: MB_COLORS.muted },
  actionButtons: { flexDirection: 'row', gap: MB_SPACING.sm },
  actionBtn: { padding: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: MB_RADIUS.md },
  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: '#1e293b', borderTopLeftRadius: MB_RADIUS.xl, borderTopRightRadius: MB_RADIUS.xl, padding: MB_SPACING.xl, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: MB_SPACING.xl },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: MB_COLORS.cream },
  formGroup: { marginBottom: MB_SPACING.lg },
  label: { fontSize: 14, fontWeight: 'bold', color: MB_COLORS.cream, marginBottom: MB_SPACING.sm },
  input: { color: MB_COLORS.cream, padding: MB_SPACING.md, fontSize: 16, backgroundColor: 'rgba(0,0,0,0.3)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: MB_RADIUS.md },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: MB_RADIUS.md,
  },
  eyeIcon: {
    paddingHorizontal: 12,
  },
  pill: { backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  pillActive: { backgroundColor: 'rgba(139, 92, 246, 0.2)', borderColor: '#8b5cf6' },
  pillText: { color: MB_COLORS.muted, fontWeight: 'bold' },
  pillTextActive: { color: '#8b5cf6' },
  submitButton: { backgroundColor: MB_COLORS.brandAccent, padding: MB_SPACING.md, borderRadius: MB_RADIUS.md, alignItems: 'center', marginTop: MB_SPACING.md },
  submitButtonDisabled: { opacity: 0.7 },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
