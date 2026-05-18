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
  Upload
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { MB_SPACING } from '../../constants/MB_Theme';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { PALETTE_TEMPLATES, PaletteTemplate } from '../../constants/Palettes';

const TITLE_FONTS = [
  'Vollkorn', 'Playfair Display', 'Cormorant Garamond', 'Bodoni Moda', 'Cinzel',
  'Orbitron', 'Syne', 'Outfit', 'Plus Jakarta Sans', 'Montserrat',
  'Bebas Neue', 'Comfortaa', 'Cormorant Infant', 'Abril Fatface', 'Archivo Black',
];

const BODY_FONTS = [
  'Inter', 'Outfit', 'Montserrat', 'EB Garamond', 'Nunito',
  'Poppins', 'Raleway', 'Roboto', 'Barlow', 'system-ui',
];

const ACCENT_FONTS = [
  'Russo One', 'Oswald', 'Fjalla One', 'Barlow Condensed', 'Cinzel',
  'Josefin Sans', 'Josefin Slab', 'Space Mono', 'JetBrains Mono',
  'Noto Serif JP', 'Permanent Marker', 'Caveat',
];

export default function BrandingScreen() {
  const { restaurantId } = useAuth();
  const { colors, refreshTheme } = useTheme();
  
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
        // Tema por defecto cuando el restaurante no tiene uno configurado
        setTheme({
          name: 'Default',
          primary_color: '#25B16B',
          secondary_color: '#06162B',
          background_color: '#F9F5EF',
          accent_color: '#FFA729',
          text_color: '#06162B',
          card_background: '#FFFFFF',
          font_title: 'Outfit',
          font_body: 'Inter',
          font_accent: 'Outfit',
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
        name: theme.name || 'Personalizado',
        palette_name: theme.palette_name,
        primary_color: theme.primary_color,
        secondary_color: theme.secondary_color,
        background_color: theme.background_color,
        accent_color: theme.accent_color,
        text_color: theme.text_color,
        card_background: theme.card_background,
        font_title: theme.font_title,
        font_body: theme.font_body,
        font_accent: theme.font_accent || theme.font_title,
        logo_url: finalLogoUrl,
        restaurant_id: restaurantId,
        is_active: true,
        updated_at: new Date().toISOString()
      };

      if (theme.id) (payload as any).id = theme.id;

      const { error } = await supabase
        .from('restaurant_themes')
        .upsert(payload);

      if (error) throw error;
      
      Alert.alert('Éxito', 'Identidad visual actualizada correctamente');
      setNewLogoUri(null);
      fetchTheme();
      refreshTheme();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  const updateTheme = (field: string, value: string) => {
    setTheme({ ...theme, [field]: value });
  };

  const applyPreset = (preset: PaletteTemplate) => {
    setTheme({
      ...theme,
      palette_name: preset.id,
      primary_color: preset.primaryColor,
      secondary_color: preset.secondaryColor,
      background_color: preset.backgroundColor,
      accent_color: preset.accentColor,
      text_color: preset.textColor,
      card_background: preset.cardBackground,
      font_title: preset.fontTitle,
      font_body: preset.fontBody,
      font_accent: preset.fontAccent,
      is_custom: false
    });
  };

  const LivePreview = () => (
    <View style={[styles.previewContainer, { backgroundColor: theme.background_color, borderColor: colors.glassHeavy }]}>
      <Text style={[styles.previewLabel, { color: theme.text_color, opacity: 0.5 }]}>VISTA PREVIA EN VIVO</Text>
      
      <View style={styles.previewContent}>
        {/* KPI Mini Preview */}
        <View style={[styles.previewKpi, { backgroundColor: theme.card_background }]}>
          <View style={[styles.previewIcon, { backgroundColor: theme.primary_color + '20' }]}>
            <Palette size={14} color={theme.primary_color} />
          </View>
          <View>
            <Text style={[styles.previewKpiValue, { color: theme.text_color, fontFamily: theme.font_title }]}>$1.240.000</Text>
            <Text style={[styles.previewKpiLabel, { color: theme.text_color, opacity: 0.6, fontFamily: theme.font_body }]}>Ventas de Hoy</Text>
          </View>
        </View>

        {/* Product Card Mini Preview */}
        <View style={[styles.previewCard, { backgroundColor: theme.card_background }]}>
          <View style={[styles.previewImagePlaceholder, { backgroundColor: theme.card_background }]}>
            <ImageIcon size={20} color={theme.text_color + '20'} />
            <View style={[styles.previewBadge, { backgroundColor: theme.primary_color }]}>
              <Text style={styles.previewBadgeText}>POPULAR</Text>
            </View>
          </View>
          <View style={styles.previewCardInfo}>
            <Text style={[styles.previewCardTitle, { color: theme.text_color, fontFamily: theme.font_title }]}>Pizza Napolitana</Text>
            <Text style={[styles.previewCardPrice, { color: theme.primary_color, fontFamily: theme.font_title }]}>$12.900</Text>
            <TouchableOpacity style={[styles.previewButton, { backgroundColor: theme.primary_color }]}>
              <Text style={[styles.previewButtonText, { color: theme.backgroundColor }]}>ORDENAR</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.navy }]}>
        <ActivityIndicator color={colors.brandAccent} />
        <Text style={[styles.loadingText, { color: colors.muted }]}>Cargando identidad...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.navy }]}
    >
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Branding</Text>
        <Text style={[styles.headerSubtitle, { color: colors.muted }]}>Personaliza la experiencia visual</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Live Preview Section */}
        <View style={styles.section}>
          <LivePreview />
        </View>

        {/* Presets */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.muted }]}>Carrusel de Inspiración</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presets}>
            {PALETTE_TEMPLATES.map((p) => (
              <TouchableOpacity 
                key={p.id} 
                style={[styles.presetCard, theme.palette_name === p.id && styles.presetCardActive]}
                onPress={() => applyPreset(p)}
              >
                <View style={[styles.presetPreview, { backgroundColor: p.backgroundColor, borderColor: colors.glassHeavy }]}>
                  <View style={styles.presetColorGrid}>
                    <View style={[styles.presetCircle, { backgroundColor: p.primaryColor }]} />
                    <View style={[styles.presetCircle, { backgroundColor: p.secondaryColor, marginLeft: -8 }]} />
                  </View>
                </View>
                <Text style={[styles.presetName, { color: colors.muted }]} numberOfLines={1}>{p.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Colors */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Palette size={18} color={colors.brandAccent} />
            <Text style={[styles.sectionTitleText, { color: colors.text }]}>Paleta de Colores</Text>
          </View>
          
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.muted }]}>Color Primario</Text>
            <View style={[styles.colorInputRow, { backgroundColor: colors.glass }]}>
              <View style={[styles.colorPreview, { backgroundColor: theme.primary_color, borderColor: colors.glassHeavy }]} />
              <TextInput 
                style={[styles.input, { color: colors.text }]}
                value={theme.primary_color}
                onChangeText={(v) => updateTheme('primary_color', v)}
                placeholder="#000000"
                placeholderTextColor={colors.muted}
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.muted }]}>Color de Fondo</Text>
            <View style={[styles.colorInputRow, { backgroundColor: colors.glass }]}>
              <View style={[styles.colorPreview, { backgroundColor: theme.background_color, borderColor: colors.glassHeavy }]} />
              <TextInput 
                style={[styles.input, { color: colors.text }]}
                value={theme.background_color}
                onChangeText={(v) => updateTheme('background_color', v)}
                placeholder="#000000"
                placeholderTextColor={colors.muted}
              />
            </View>
          </View>
        </View>

        {/* Fonts */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Type size={18} color={colors.brandAccent} />
            <Text style={[styles.sectionTitleText, { color: colors.text }]}>Tipografía</Text>
          </View>

          <Text style={[styles.label, { color: colors.muted }]}>Fuente de Títulos</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.fontList}>
            {TITLE_FONTS.map((f) => (
              <TouchableOpacity 
                key={f} 
                style={[
                  styles.fontChip, 
                  { backgroundColor: colors.glass, borderColor: colors.glassHeavy },
                  theme.font_title === f && { backgroundColor: colors.brandAccent, borderColor: colors.brandAccent }
                ]}
                onPress={() => updateTheme('font_title', f)}
              >
                <Text style={[styles.fontChipText, { color: colors.muted }, theme.font_title === f && styles.fontChipTextActive, { fontFamily: f }]}>{f}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={[styles.label, { marginTop: 16, color: colors.muted }]}>Fuente de Cuerpo</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.fontList}>
            {BODY_FONTS.map((f) => (
              <TouchableOpacity
                key={f}
                style={[
                  styles.fontChip,
                  { backgroundColor: colors.glass, borderColor: colors.glassHeavy },
                  theme.font_body === f && { backgroundColor: colors.brandAccent, borderColor: colors.brandAccent }
                ]}
                onPress={() => updateTheme('font_body', f)}
              >
                <Text style={[styles.fontChipText, { color: colors.muted }, theme.font_body === f && styles.fontChipTextActive, { fontFamily: f }]}>{f}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={[styles.label, { marginTop: 16, color: colors.muted }]}>Fuente de Acento (Navegación & Precios)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.fontList}>
            {ACCENT_FONTS.map((f) => (
              <TouchableOpacity
                key={f}
                style={[
                  styles.fontChip,
                  { backgroundColor: colors.glass, borderColor: colors.glassHeavy },
                  theme.font_accent === f && { backgroundColor: colors.brandAccent, borderColor: colors.brandAccent }
                ]}
                onPress={() => updateTheme('font_accent', f)}
              >
                <Text style={[styles.fontChipText, { color: colors.muted }, theme.font_accent === f && styles.fontChipTextActive, { fontFamily: f }]}>{f}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Logo */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ImageIcon size={18} color={colors.brandAccent} />
            <Text style={[styles.sectionTitleText, { color: colors.text }]}>Logo del Restaurante</Text>
          </View>

          <TouchableOpacity style={[styles.logoUpload, { backgroundColor: colors.glass, borderColor: colors.glassHeavy }]} onPress={handlePickImage}>
            {(newLogoUri || theme.logo_url) ? (
              <Image source={{ uri: newLogoUri || theme.logo_url }} style={styles.logoImage} />
            ) : (
              <View style={styles.logoPlaceholder}>
                <Upload size={32} color={colors.muted} />
                <Text style={[styles.logoPlaceholderText, { color: colors.muted }]}>Subir Logo</Text>
              </View>
            )}
            <View style={styles.logoEditOverlay}>
              <RefreshCcw size={16} color="white" />
            </View>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={[styles.saveButton, { backgroundColor: colors.brandAccent, shadowColor: colors.brandAccent }, saving && { opacity: 0.7 }]} 
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
  },
  header: {
    paddingHorizontal: MB_SPACING.lg,
    paddingTop: 60,
    paddingBottom: MB_SPACING.md,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
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
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  sectionTitleText: {
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
    opacity: 0.6,
  },
  presetCardActive: {
    opacity: 1,
  },
  presetPreview: {
    width: 100,
    height: 60,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  presetCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  presetColorGrid: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  presetName: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 6,
    textAlign: 'center',
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    marginBottom: 8,
  },
  colorInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
  },
  input: {
    flex: 1,
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
    borderWidth: 1,
  },
  fontChipActive: {
    backgroundColor: '#FF3B30',
    borderColor: '#FF3B30',
  },
  fontChipText: {
    fontSize: 14,
    fontWeight: '700',
  },
  fontChipTextActive: {
    color: 'white',
  },
  logoUpload: {
    width: '100%',
    height: 160,
    borderRadius: 24,
    borderStyle: 'dashed',
    borderWidth: 2,
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
  },
  loadingText: {
    marginTop: 12,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  previewContainer: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  previewLabel: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 16,
  },
  previewContent: {
    gap: 12,
  },
  previewKpi: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    gap: 16,
  },
  previewIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewKpiValue: {
    fontSize: 18,
    fontWeight: '900',
  },
  previewKpiLabel: {
    fontSize: 10,
    fontWeight: '700',
  },
  previewCard: {
    borderRadius: 20,
    overflow: 'hidden',
    flexDirection: 'row',
    padding: 12,
    gap: 12,
  },
  previewImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  previewBadgeText: {
    color: 'white',
    fontSize: 7,
    fontWeight: '900',
  },
  previewCardInfo: {
    flex: 1,
    justifyContent: 'center',
    gap: 4,
  },
  previewCardTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  previewCardPrice: {
    fontSize: 13,
    fontWeight: '900',
  },
  previewButton: {
    marginTop: 4,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
  },
  previewButtonText: {
    fontSize: 9,
    fontWeight: '900',
  },
});
