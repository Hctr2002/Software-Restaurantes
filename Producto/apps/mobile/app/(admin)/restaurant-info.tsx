import React from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Store, MapPin, Phone, Mail, Percent, Save, ChevronLeft } from 'lucide-react-native';
import { MB_COLORS, MB_SPACING, MB_RADIUS } from '../../constants/MB_Theme';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

export default function RestaurantInfoScreen() {
  const { restaurantId } = useAuth();
  const router = useRouter();
  
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [formData, setFormData] = React.useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    tax_percentage: '0'
  });

  React.useEffect(() => {
    loadRestaurantInfo();
  }, [restaurantId]);

  const loadRestaurantInfo = async () => {
    if (!restaurantId) return;
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', restaurantId)
        .single();

      if (error) throw error;
      if (data) {
        setFormData({
          name: data.name || '',
          address: data.address || '',
          phone: data.phone || '',
          email: data.email || '',
          tax_percentage: String(data.tax_percentage || '0')
        });
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'No se pudo cargar la información del local');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!restaurantId) return;
    if (!formData.name.trim()) {
      Alert.alert('Error', 'El nombre es obligatorio');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('restaurants')
        .update({
          name: formData.name,
          address: formData.address,
          phone: formData.phone,
          email: formData.email,
          tax_percentage: parseFloat(formData.tax_percentage) || 0
        })
        .eq('id', restaurantId);

      if (error) throw error;
      Alert.alert('Éxito', 'Información actualizada correctamente');
      router.back();
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'No se pudo guardar la información');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={MB_COLORS.brandAccent} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft color="white" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Información del Local</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DATOS PRINCIPALES</Text>
          
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Store size={14} color={MB_COLORS.muted} />
              <Text style={styles.label}>Nombre Comercial</Text>
            </View>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(t) => setFormData({ ...formData, name: t })}
              placeholder="Ej: Burger House"
              placeholderTextColor="rgba(255,255,255,0.2)"
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <MapPin size={14} color={MB_COLORS.muted} />
              <Text style={styles.label}>Dirección Física</Text>
            </View>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.address}
              onChangeText={(t) => setFormData({ ...formData, address: t })}
              placeholder="Calle, Número, Ciudad"
              placeholderTextColor="rgba(255,255,255,0.2)"
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CONTACTO</Text>

          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Phone size={14} color={MB_COLORS.muted} />
              <Text style={styles.label}>Teléfono de Atención</Text>
            </View>
            <TextInput
              style={styles.input}
              value={formData.phone}
              onChangeText={(t) => setFormData({ ...formData, phone: t })}
              placeholder="+56 9 ..."
              keyboardType="phone-pad"
              placeholderTextColor="rgba(255,255,255,0.2)"
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Mail size={14} color={MB_COLORS.muted} />
              <Text style={styles.label}>Email Público</Text>
            </View>
            <TextInput
              style={styles.input}
              value={formData.email}
              onChangeText={(t) => setFormData({ ...formData, email: t })}
              placeholder="contacto@restaurante.com"
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor="rgba(255,255,255,0.2)"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CONFIGURACIÓN FISCAL</Text>
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Percent size={14} color={MB_COLORS.muted} />
              <Text style={styles.label}>Impuesto / IVA (%)</Text>
            </View>
            <TextInput
              style={styles.input}
              value={formData.tax_percentage}
              onChangeText={(t) => setFormData({ ...formData, tax_percentage: t })}
              placeholder="0.00"
              keyboardType="numeric"
              placeholderTextColor="rgba(255,255,255,0.2)"
            />
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.saveButton, saving && styles.disabledButton]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Save size={20} color="white" />
              <Text style={styles.saveButtonText}>GUARDAR CAMBIOS</Text>
            </>
          )}
        </TouchableOpacity>
        
        <View style={{ height: 100 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MB_COLORS.navy,
  },
  centered: {
    flex: 1,
    backgroundColor: MB_COLORS.navy,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: MB_SPACING.lg,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 18,
    color: 'white',
    fontWeight: '900',
    textTransform: 'uppercase',
    fontStyle: 'italic',
    letterSpacing: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: MB_SPACING.lg,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    color: MB_COLORS.muted,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 20,
    marginLeft: 4,
  },
  inputGroup: {
    marginBottom: 20,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
    marginLeft: 4,
  },
  label: {
    color: MB_COLORS.muted,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 16,
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: MB_COLORS.brandAccent,
    height: 60,
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    shadowColor: MB_COLORS.brandAccent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    marginTop: 20,
  },
  disabledButton: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  }
});
