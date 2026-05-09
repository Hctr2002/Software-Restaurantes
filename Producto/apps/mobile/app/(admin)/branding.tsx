import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { 
  Palette, 
  Type, 
  Image as ImageIcon, 
  Save, 
  RefreshCcw,
  Check,
  ChevronRight,
  Upload
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { MB_COLORS, MB_SPACING, MB_RADIUS } from '../../constants/MB_Theme';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import Animated, { FadeInDown } from 'react-native-reanimated';

const FONTS = ['Outfit', 'Inter', 'Roboto', 'Montserrat', 'Playfair Display'];

const COLOR_PRESETS = [
  { name: 'MenuBites Red', primary: '#FE5F55', background: '#0B0D17' },
  { name: 'Elegant Dark', primary: '#D4AF37', background: '#121212' },
  { name: 'Ocean Fresh', primary: '#0077B6', background: '#F8F9FA' },
  { name: 'Forest Bio', primary: '#2D6A4F', background: '#FFFFFF' },
];

export default function BrandingScreen() {
  const { restaurantId } = useAuth();
  
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [theme, setTheme] = React.useState<any>(null);
  const [newLogoUri, setNewLogoUri] = React.useState<string | null>(null);

  const fetchTheme = React.useCallback(async () => {
    if (!restaurantId) return;
    
    try {
      const { data, error } = await supabase
        .from('restaurant_themes')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setTheme(data);
      } else {
        // Default theme if none exists
        setTheme({
          name: 'Default',
          primary_color: '#FE5F55',
          secondary_color: '#495057',
          background_color: '#0B0D17',
          accent_color: '#FE5F55',
          text_color: '#FFFFFF',
          card_background: 'rgba(255,255,255,0.05)',
          font_title: 'Outfit',
          font_body: 'Inter',
          is_active: true
        });
      }
    } catch (err) {
      console.error('Error fetching theme:', err);
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  React.useEffect(() => {
    fetchTheme();
  }, [fetchTheme]);

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setNewLogoUri(result.assets[0].uri);
    }
  };

  const uploadLogo = async (uri: string) => {
    if (!restaurantId) return null;
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const arrayBuffer = await new Response(blob).arrayBuffer();
      
      const fileName = `logo_${Date.now()}.jpg`;
      const filePath = `${restaurantId}/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('restaurant-assets')
        .upload(filePath, arrayBuffer, {
          contentType: 'image/jpeg',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('restaurant-assets')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (err) {
      console.error('Error uploading logo:', err);
      return null;
    }
  };

  const handleSave = async () => {
    if (!restaurantId || !theme) return;
    
    setSaving(true);
    try {
      let finalLogoUrl = theme.logo_url;

      if (newLogoUri) {
        const uploadedUrl = await uploadLogo(newLogoUri);
        if (uploadedUrl) finalLogoUrl = uploadedUrl;
      }

      const payload = {
        ...theme,
        logo_url: finalLogoUrl,
        restaurant_id: restaurantId,
        updatedAt: new Date().toISOString()
      };

      // Remove ID if it's a new theme object we just initialized
      if (payload.id === undefined) delete payload.id;

      const { error } = await supabase
        .from('restaurant_themes')
        .upsert(payload, { onConflict: 'restaurant_id, is_active' });

      if (error) throw error;
      
      Alert.alert('Éxito', 'Identidad visual actualizada correctamente');
      setNewLogoUri(null);
      fetchTheme();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  const updateTheme = (field: string, value: string) => {
    setTheme({ ...theme, [field]: value });
  };

  const applyPreset = (preset: any) => {
    setTheme({
      ...theme,
      primary_color: preset.primary,
      background_color: preset.background,
      accent_color: preset.primary,
    });
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={MB_COLORS.brandAccent} />
        <Text style={styles.loadingText}>Cargando identidad...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Branding</Text>
        <Text style={styles.headerSubtitle}>Personaliza la experiencia visual</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Presets */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Inspiración Rápida</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presets}>
            {COLOR_PRESETS.map((p, i) => (
              <TouchableOpacity 
                key={i} 
                style={styles.presetCard}
                onPress={() => applyPreset(p)}
              >
                <View style={[styles.presetPreview, { backgroundColor: p.background }]}>
                  <View style={[styles.presetCircle, { backgroundColor: p.primary }]} />
                </View>
                <Text style={styles.presetName}>{p.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Colors */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Palette size={18} color={MB_COLORS.brandAccent} />
            <Text style={styles.sectionTitleText}>Paleta de Colores</Text>
          </View>
          
          <View style={styles.field}>
            <Text style={styles.label}>Color Primario</Text>
            <View style={styles.colorInputRow}>
              <View style={[styles.colorPreview, { backgroundColor: theme.primary_color }]} />
              <TextInput 
                style={styles.input}
                value={theme.primary_color}
                onChangeText={(v) => updateTheme('primary_color', v)}
                placeholder="#000000"
                placeholderTextColor={MB_COLORS.muted}
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Color de Fondo</Text>
            <View style={styles.colorInputRow}>
              <View style={[styles.colorPreview, { backgroundColor: theme.background_color }]} />
              <TextInput 
                style={styles.input}
                value={theme.background_color}
                onChangeText={(v) => updateTheme('background_color', v)}
                placeholder="#000000"
                placeholderTextColor={MB_COLORS.muted}
              />
            </View>
          </View>
        </View>

        {/* Fonts */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Type size={18} color={MB_COLORS.brandAccent} />
            <Text style={styles.sectionTitleText}>Tipografía</Text>
          </View>

          <Text style={styles.label}>Fuente de Títulos</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.fontList}>
            {FONTS.map((f) => (
              <TouchableOpacity 
                key={f} 
                style={[styles.fontChip, theme.font_title === f && styles.fontChipActive]}
                onPress={() => updateTheme('font_title', f)}
              >
                <Text style={[styles.fontChipText, theme.font_title === f && styles.fontChipTextActive]}>{f}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Logo */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ImageIcon size={18} color={MB_COLORS.brandAccent} />
            <Text style={styles.sectionTitleText}>Logo del Restaurante</Text>
          </View>

          <TouchableOpacity style={styles.logoUpload} onPress={handlePickImage}>
            {(newLogoUri || theme.logo_url) ? (
              <Image source={{ uri: newLogoUri || theme.logo_url }} style={styles.logoImage} />
            ) : (
              <View style={styles.logoPlaceholder}>
                <Upload size={32} color={MB_COLORS.muted} />
                <Text style={styles.logoPlaceholderText}>Subir Logo</Text>
              </View>
            )}
            <View style={styles.logoEditOverlay}>
              <RefreshCcw size={16} color="white" />
            </View>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={[styles.saveButton, saving && { opacity: 0.7 }]} 
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Save size={20} color="white" />
              <Text style={styles.saveButtonText}>Guardar Identidad</Text>
            </>
          )}
        </TouchableOpacity>
        
        <View style={{ height: 60 }} />
      </ScrollView>
    </KeyboardAvoidingView>
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
  content: {
    flex: 1,
  },
  section: {
    marginBottom: 32,
    paddingHorizontal: MB_SPACING.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  sectionTitle: {
    color: MB_COLORS.muted,
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  sectionTitleText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  presets: {
    gap: 12,
  },
  presetCard: {
    width: 100,
    alignItems: 'center',
  },
  presetPreview: {
    width: 100,
    height: 60,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  presetCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  presetName: {
    color: MB_COLORS.muted,
    fontSize: 10,
    fontWeight: '700',
    marginTop: 6,
    textAlign: 'center',
  },
  field: {
    marginBottom: 16,
  },
  label: {
    color: MB_COLORS.muted,
    fontSize: 10,
    fontWeight: '800',
    marginBottom: 8,
  },
  colorInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    gap: 12,
  },
  colorPreview: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  input: {
    flex: 1,
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
  },
  fontList: {
    gap: 8,
  },
  fontChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  fontChipActive: {
    backgroundColor: MB_COLORS.brandAccent,
    borderColor: MB_COLORS.brandAccent,
  },
  fontChipText: {
    color: MB_COLORS.muted,
    fontSize: 14,
    fontWeight: '700',
  },
  fontChipTextActive: {
    color: 'white',
  },
  logoUpload: {
    width: '100%',
    height: 160,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 24,
    borderStyle: 'dashed',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  logoImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  logoPlaceholder: {
    alignItems: 'center',
    gap: 8,
  },
  logoPlaceholderText: {
    color: MB_COLORS.muted,
    fontSize: 12,
    fontWeight: '800',
  },
  logoEditOverlay: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: MB_COLORS.brandAccent,
    marginHorizontal: MB_SPACING.lg,
    height: 56,
    borderRadius: 16,
    marginTop: 8,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '900',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: MB_COLORS.navy,
  },
  loadingText: {
    color: MB_COLORS.muted,
    marginTop: 12,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  }
});

