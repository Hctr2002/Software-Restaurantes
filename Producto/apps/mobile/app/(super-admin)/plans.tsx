import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, TextInput } from 'react-native';
import { CheckCircle2, Rocket, Zap, Building2, X, Plus, Trash2, AlertCircle } from 'lucide-react-native';
import { MB_COLORS, MB_SPACING, MB_RADIUS } from '../../constants/MB_Theme';
import { supabase } from '../../lib/supabase';
import { SUPERADMIN_API } from '../../lib/api';

type Plan = {
  id: string;
  name: string;
  price: string;
  period: string;
  description: string;
  icon: React.ReactNode;
  features: string[];
  popular: boolean;
};


export default function PlansTab() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: '',
    features: [] as string[]
  });

  const openEditModal = (plan: Plan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      price: plan.price,
      description: plan.description,
      features: [...plan.features]
    });
    setModalVisible(true);
  };

  const fetchPlans = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No hay sesión activa");

      const res = await fetch(`${SUPERADMIN_API}/api/admin/plans`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      const json = await res.json() as { data?: any[], error?: string };
      if (!res.ok) throw new Error(json.error || "Error al cargar planes");
      
      // Map icons based on some logic or keep it simple
      const mappedPlans = (json.data || []).map((p: any) => ({
        ...p,
        icon: p.name.toLowerCase().includes('enterprise') ? <Building2 color="#34d399" size={24} /> :
              p.name.toLowerCase().includes('pro') ? <Zap color="#c084fc" size={24} /> :
              <Rocket color="#60a5fa" size={24} />
      }));
      
      setPlans(mappedPlans);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleSave = async () => {
    if (!editingPlan) return;
    
    try {
      setSaving(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No hay sesión activa");

      const res = await fetch(`${SUPERADMIN_API}/api/admin/plans/${editingPlan.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}` 
        },
        body: JSON.stringify({
          ...formData,
          features: formData.features.filter(f => f.trim() !== ""),
        })
      });

      const json = await res.json() as { error?: string };
      if (!res.ok) throw new Error(json.error || "Error al guardar");

      await fetchPlans();
      setModalVisible(false);
      Alert.alert("Éxito", "Plan actualizado correctamente");
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setSaving(false);
    }
  };

  const updateFeature = (index: number, value: string) => {
    const newFeatures = [...formData.features];
    newFeatures[index] = value;
    setFormData({ ...formData, features: newFeatures });
  };

  const addFeature = () => {
    setFormData({ ...formData, features: [...formData.features, ""] });
  };

  const removeFeature = (index: number) => {
    const newFeatures = [...formData.features];
    newFeatures.splice(index, 1);
    setFormData({ ...formData, features: newFeatures });
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Planes</Text>
          <Text style={styles.subtitle}>Gestión de suscripciones y precios</Text>
        </View>

        {error && (
          <View style={styles.errorBox}>
            <AlertCircle color="#ef4444" size={20} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {plans.map((plan) => (
          <View key={plan.id} style={[styles.planCard, plan.popular && styles.popularCard]}>
            {plan.popular && (
              <View style={styles.popularBadge}>
                <Text style={styles.popularBadgeText}>MÁS POPULAR</Text>
              </View>
            )}

            <View style={styles.cardHeader}>
              <View style={styles.iconBox}>{plan.icon}</View>
              <Text style={styles.planName}>{plan.name}</Text>
            </View>

            <Text style={styles.planDescription}>{plan.description}</Text>

            <View style={styles.priceContainer}>
              <Text style={styles.planPrice}>{plan.price}</Text>
              <Text style={styles.planPeriod}>{plan.period}</Text>
            </View>

            <View style={styles.featuresList}>
              {plan.features.map((feature, i) => (
                <View key={i} style={styles.featureItem}>
                  <CheckCircle2 color="#10b981" size={16} />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity 
              style={[styles.editButton, plan.popular ? styles.editButtonPrimary : styles.editButtonSecondary]}
              onPress={() => openEditModal(plan)}
            >
              <Text style={[styles.editButtonText, plan.popular ? styles.editButtonTextPrimary : styles.editButtonTextSecondary]}>
                Editar Plan
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      {/* EDIT MODAL */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Editar Plan</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X color={MB_COLORS.muted} size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 500 }} showsVerticalScrollIndicator={false}>
              {saving && (
                <View style={styles.mockNoticeBox}>
                  <Text style={styles.mockNoticeText}>Guardando cambios...</Text>
                </View>
              )}

              <View style={styles.formGroup}>
                <Text style={styles.label}>Nombre del Plan</Text>
                <TextInput 
                  style={styles.input} 
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Precio</Text>
                <TextInput 
                  style={styles.input} 
                  value={formData.price}
                  onChangeText={(text) => setFormData({ ...formData, price: text })}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Descripción</Text>
                <TextInput 
                  style={[styles.input, { height: 80, textAlignVertical: 'top' }]} 
                  multiline
                  value={formData.description}
                  onChangeText={(text) => setFormData({ ...formData, description: text })}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Beneficios Incluidos</Text>
                {formData.features.map((feature, i) => (
                  <View key={i} style={styles.featureRow}>
                    <TextInput 
                      style={[styles.input, styles.featureInput]} 
                      value={feature}
                      onChangeText={(text) => updateFeature(i, text)}
                    />
                    <TouchableOpacity style={styles.removeFeatureBtn} onPress={() => removeFeature(i)}>
                      <Trash2 color="#ef4444" size={18} />
                    </TouchableOpacity>
                  </View>
                ))}
                
                <TouchableOpacity style={styles.addFeatureBtn} onPress={addFeature}>
                  <Plus color={MB_COLORS.muted} size={16} />
                  <Text style={styles.addFeatureText}>Agregar nuevo beneficio</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity 
                style={[styles.submitButton, saving && { opacity: 0.7 }]} 
                onPress={handleSave}
                disabled={saving}
              >
                <Text style={styles.submitButtonText}>
                  {saving ? "Guardando..." : "Guardar cambios"}
                </Text>
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
  header: { marginBottom: MB_SPACING.md },
  title: { fontSize: 28, fontWeight: '800', color: MB_COLORS.cream },
  subtitle: { fontSize: 14, color: MB_COLORS.muted, marginTop: 4 },
  infoBox: { backgroundColor: 'rgba(59, 130, 246, 0.1)', borderColor: 'rgba(59, 130, 246, 0.3)', borderWidth: 1, padding: MB_SPACING.md, borderRadius: MB_RADIUS.md, marginBottom: MB_SPACING.xl },
  infoText: { color: '#60a5fa', fontSize: 12, lineHeight: 18 },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)', borderWidth: 1, padding: MB_SPACING.md, borderRadius: MB_RADIUS.md, marginBottom: MB_SPACING.xl },
  errorText: { color: '#ef4444', fontSize: 12, flex: 1 },
  planCard: { backgroundColor: MB_COLORS.glassHeavy, padding: MB_SPACING.xl, borderRadius: MB_RADIUS.xl, marginBottom: MB_SPACING.xl, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', position: 'relative' },
  popularCard: { borderColor: 'rgba(192, 132, 252, 0.5)', backgroundColor: 'rgba(192, 132, 252, 0.05)' },
  popularBadge: { position: 'absolute', top: -12, alignSelf: 'center', backgroundColor: '#a855f7', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  popularBadgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: MB_SPACING.md, marginBottom: MB_SPACING.md },
  iconBox: { width: 40, height: 40, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
  planName: { fontSize: 22, fontWeight: 'bold', color: MB_COLORS.cream },
  planDescription: { fontSize: 14, color: MB_COLORS.muted, marginBottom: MB_SPACING.lg, lineHeight: 20 },
  priceContainer: { flexDirection: 'row', alignItems: 'baseline', marginBottom: MB_SPACING.xl },
  planPrice: { fontSize: 36, fontWeight: '900', color: MB_COLORS.cream },
  planPeriod: { fontSize: 16, color: MB_COLORS.muted, fontWeight: '500', marginLeft: 4 },
  featuresList: { gap: MB_SPACING.sm, marginBottom: MB_SPACING.xl },
  featureItem: { flexDirection: 'row', alignItems: 'center', gap: MB_SPACING.sm },
  featureText: { fontSize: 14, color: '#cbd5e1', flex: 1 },
  editButton: { paddingVertical: 14, borderRadius: MB_RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  editButtonPrimary: { backgroundColor: '#9333ea' },
  editButtonSecondary: { backgroundColor: 'transparent', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  editButtonText: { fontSize: 15, fontWeight: 'bold' },
  editButtonTextPrimary: { color: '#fff' },
  editButtonTextSecondary: { color: '#cbd5e1' },
  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: '#1e293b', borderTopLeftRadius: MB_RADIUS.xl, borderTopRightRadius: MB_RADIUS.xl, padding: MB_SPACING.xl, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: MB_SPACING.xl },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: MB_COLORS.cream },
  mockNoticeBox: { backgroundColor: 'rgba(59, 130, 246, 0.1)', borderColor: 'rgba(59, 130, 246, 0.3)', borderWidth: 1, padding: 12, borderRadius: MB_RADIUS.sm, marginBottom: MB_SPACING.lg },
  mockNoticeText: { color: '#60a5fa', fontSize: 12 },
  formGroup: { marginBottom: MB_SPACING.lg },
  label: { fontSize: 14, fontWeight: 'bold', color: MB_COLORS.cream, marginBottom: MB_SPACING.sm, textTransform: 'uppercase' },
  input: { backgroundColor: 'rgba(0,0,0,0.3)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: MB_RADIUS.md, color: MB_COLORS.cream, padding: MB_SPACING.md, fontSize: 16 },
  featureRow: { flexDirection: 'row', gap: 8, marginBottom: 8, alignItems: 'center' },
  featureInput: { flex: 1 },
  removeFeatureBtn: { padding: 12, backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: MB_RADIUS.md },
  addFeatureBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: MB_RADIUS.md, marginTop: 8 },
  addFeatureText: { color: MB_COLORS.muted, fontSize: 14, fontWeight: 'bold' },
  submitButton: { backgroundColor: '#2563eb', padding: MB_SPACING.md, borderRadius: MB_RADIUS.md, alignItems: 'center', marginTop: MB_SPACING.md },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
