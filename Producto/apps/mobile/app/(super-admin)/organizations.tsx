import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity, Modal, TextInput, Alert, Switch } from 'react-native';
import { Store, AlertCircle, Edit2, Trash2, Plus, X } from 'lucide-react-native';
import { MB_COLORS, MB_SPACING, MB_RADIUS } from '../../constants/MB_Theme';
import { supabase } from '../../lib/supabase';

import { SUPERADMIN_API } from '../../lib/api';

type Restaurant = {
  id: string;
  name: string;
  slug: string;
  status: string;
  createdAt: string;
  plan_id?: string | null;
  plans?: { name: string } | null;
};

type PlanOption = {
  id: string;
  name: string;
};

export default function OrganizationsTab() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [availablePlans, setAvailablePlans] = useState<PlanOption[]>([]);
  const [formData, setFormData] = useState({ name: '', slug: '', status: 'ACTIVE', planId: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setError(null);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No hay sesión activa");

      const res = await fetch(`${SUPERADMIN_API}/api/admin/restaurants`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      const json: any = await res.json();
      if (!res.ok) throw new Error(json.error || 'Error al cargar organizaciones');

      setRestaurants(json.data || []);
    } catch (err: any) {
      setError(err.message || 'Error al cargar los datos');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchPlans = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${SUPERADMIN_API}/api/admin/plans`, {
        headers: { Authorization: `Bearer ${session?.access_token}` }
      });
      const json = await res.json() as { data?: any[] };
      if (res.ok) setAvailablePlans(json.data || []);
    } catch (e) {
      console.error("Error al cargar planes", e);
    }
  };

  useEffect(() => {
    fetchData();
    fetchPlans();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const openCreateModal = () => {
    setEditingId(null);
    setFormData({ name: '', slug: '', status: 'ACTIVE', planId: '' });
    setModalVisible(true);
  };

  const openEditModal = (rest: Restaurant) => {
    setEditingId(rest.id);
    setFormData({ 
      name: rest.name, 
      slug: rest.slug, 
      status: rest.status,
      planId: rest.plan_id || ''
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.slug) {
      Alert.alert('Error', 'Nombre y slug son obligatorios');
      return;
    }
    setSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId ? `${SUPERADMIN_API}/api/admin/restaurants/${editingId}` : `${SUPERADMIN_API}/api/admin/restaurants`;

      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}` 
        },
        body: JSON.stringify(formData)
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

  const confirmDelete = (id: string, name: string) => {
    Alert.alert(
      'Eliminar Organización',
      `¿Estás seguro de que deseas eliminar permanentemente a "${name}"? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => handleDelete(id) }
      ]
    );
  };

  const handleDelete = async (id: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${SUPERADMIN_API}/api/admin/restaurants/${id}`, {
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

  if (loading && restaurants.length === 0) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={MB_COLORS.brandAccent} />
        <Text style={styles.loadingText}>Cargando organizaciones...</Text>
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
            <Text style={styles.title}>Directorio</Text>
            <Text style={styles.subtitle}>Listado global de organizaciones</Text>
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

        {restaurants.length === 0 ? (
          <View style={styles.emptyBox}>
            <Store color={MB_COLORS.muted} size={40} />
            <Text style={styles.emptyText}>Aún no existen organizaciones registradas.</Text>
          </View>
        ) : (
          restaurants.map((restaurant) => (
            <View key={restaurant.id} style={styles.cardItem}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardItemTitle}>{restaurant.name}</Text>
                <View style={[styles.badge, restaurant.status === 'ACTIVE' ? styles.badgeActive : styles.badgeSuspended]}>
                  <Text style={styles.badgeText}>{restaurant.status}</Text>
                </View>
              </View>
              <View style={styles.cardSubRow}>
                <Text style={styles.cardItemSub}>{restaurant.slug}</Text>
                <Text style={styles.planBadge}>{restaurant.plans?.name || 'Sin Plan'}</Text>
              </View>
              
              <View style={styles.cardFooter}>
                <Text style={styles.cardItemDate}>Registrado el {formatDate(restaurant.createdAt)}</Text>
                <View style={styles.actionButtons}>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => openEditModal(restaurant)}>
                    <Edit2 color={MB_COLORS.brandAccent} size={18} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => confirmDelete(restaurant.id, restaurant.name)}>
                    <Trash2 color="#ef4444" size={18} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* CREATE/EDIT MODAL */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingId ? 'Editar Organización' : 'Nueva Organización'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X color={MB_COLORS.muted} size={24} />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Nombre</Text>
              <TextInput 
                style={styles.input} 
                placeholder="Ej. Burger King" 
                placeholderTextColor={MB_COLORS.muted}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Slug (Identificador único)</Text>
              <TextInput 
                style={styles.input} 
                placeholder="ej-burger-king" 
                placeholderTextColor={MB_COLORS.muted}
                value={formData.slug}
                autoCapitalize="none"
                onChangeText={(text) => setFormData({ ...formData, slug: text.replace(/\s+/g, '-').toLowerCase() })}
              />
            </View>

            {editingId && (
              <View style={styles.formGroupRow}>
                <Text style={styles.label}>Estado Activo</Text>
                <Switch 
                  value={formData.status === 'ACTIVE'} 
                  onValueChange={(val) => setFormData({ ...formData, status: val ? 'ACTIVE' : 'SUSPENDED' })}
                  trackColor={{ false: '#374151', true: '#22c55e' }}
                  thumbColor="#fff"
                />
              </View>
            )}

            <View style={styles.formGroup}>
              <Text style={styles.label}>Plan de Suscripción</Text>
              <View style={styles.pickerContainer}>
                {availablePlans.map((plan) => (
                  <TouchableOpacity 
                    key={plan.id} 
                    style={[styles.planOption, formData.planId === plan.id && styles.planOptionActive]}
                    onPress={() => setFormData({ ...formData, planId: plan.id })}
                  >
                    <Text style={[styles.planOptionText, formData.planId === plan.id && styles.planOptionTextActive]}>
                      {plan.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.submitButton, submitting && styles.submitButtonDisabled]} 
              onPress={handleSave} 
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>{editingId ? 'Guardar Cambios' : 'Crear Organización'}</Text>
              )}
            </TouchableOpacity>
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
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: MB_SPACING.xs },
  cardItemTitle: { fontSize: 18, fontWeight: 'bold', color: MB_COLORS.cream, flex: 1 },
  cardSubRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: MB_SPACING.sm },
  cardItemSub: { fontSize: 14, color: MB_COLORS.muted },
  planBadge: { fontSize: 12, fontWeight: 'bold', color: '#c084fc', backgroundColor: 'rgba(192, 132, 252, 0.1)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: MB_SPACING.sm, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', paddingTop: MB_SPACING.sm },
  cardItemDate: { fontSize: 12, color: MB_COLORS.muted },
  actionButtons: { flexDirection: 'row', gap: MB_SPACING.sm },
  actionBtn: { padding: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: MB_RADIUS.md },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeActive: { backgroundColor: 'rgba(34, 197, 94, 0.1)' },
  badgeSuspended: { backgroundColor: 'rgba(239, 68, 68, 0.1)' },
  badgeText: { fontSize: 11, fontWeight: 'bold', color: MB_COLORS.cream },
  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: '#1e293b', borderTopLeftRadius: MB_RADIUS.xl, borderTopRightRadius: MB_RADIUS.xl, padding: MB_SPACING.xl, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: MB_SPACING.xl },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: MB_COLORS.cream },
  formGroup: { marginBottom: MB_SPACING.lg },
  formGroupRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: MB_SPACING.lg },
  label: { fontSize: 14, fontWeight: 'bold', color: MB_COLORS.cream, marginBottom: MB_SPACING.sm },
  input: { backgroundColor: 'rgba(0,0,0,0.3)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: MB_RADIUS.md, color: MB_COLORS.cream, padding: MB_SPACING.md, fontSize: 16 },
  submitButton: { backgroundColor: MB_COLORS.brandAccent, padding: MB_SPACING.md, borderRadius: MB_RADIUS.md, alignItems: 'center', marginTop: MB_SPACING.md },
  submitButtonDisabled: { opacity: 0.7 },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  pickerContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  planOption: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: MB_RADIUS.md, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  planOptionActive: { backgroundColor: 'rgba(192, 132, 252, 0.15)', borderColor: '#c084fc' },
  planOptionText: { color: MB_COLORS.muted, fontSize: 14, fontWeight: 'bold' },
  planOptionTextActive: { color: '#c084fc' }
});
