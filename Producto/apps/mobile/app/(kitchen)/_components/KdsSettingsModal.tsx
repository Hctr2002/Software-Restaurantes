import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  Modal, 
  Switch,
  TextInput,
  ActivityIndicator,
  ScrollView,
  Dimensions
} from 'react-native';
import { 
  Settings, X, Save, BellRing, MousePointer2, 
  Timer, Layers, Volume2, ChefHat, ShoppingBag, Package, Plus, Trash2, AlertTriangle, CheckCircle 
} from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../../../context/ThemeContext';
import { useAuth } from '../../../context/AuthContext';
import { supabase } from '../../../lib/supabase';
import Animated, { FadeInDown } from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface KdsSettings {
  thresholds: { yellow: number; red: number };
  categoryTimes: { name: string; minutes: number }[];
  sounds: { newTicket: boolean; criticalAlert: boolean };
  autoClear: { enabled: boolean; delaySeconds: number };
}

export const DEFAULT_KDS_SETTINGS: KdsSettings = {
  thresholds: { yellow: 10, red: 20 },
  categoryTimes: [],
  sounds: { newTicket: true, criticalAlert: true },
  autoClear: { enabled: false, delaySeconds: 30 },
};

type Tab = "umbrales" | "categorias" | "sonido" | "auto" | "86items" | "inventario";

const TABS: { key: Tab; label: string; Icon: any }[] = [
  { key: "umbrales",   label: "Umbrales",    Icon: Timer },
  { key: "categorias", label: "Categorías",  Icon: Layers },
  { key: "sonido",     label: "Sonido",      Icon: Volume2 },
  { key: "auto",       label: "Auto-borrado", Icon: ChefHat },
  { key: "86items",    label: "Sin Stock",   Icon: ShoppingBag },
  { key: "inventario", label: "Inventario",  Icon: Package },
];

interface KdsSettingsModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (settings: KdsSettings) => void;
}

export default function KdsSettingsModal({ visible, onClose, onSave }: KdsSettingsModalProps) {
  const { colors } = useTheme();
  const { restaurantId } = useAuth();
  
  const [activeTab, setActiveTab] = useState<Tab>("umbrales");
  const [draft, setDraft] = useState<KdsSettings>(DEFAULT_KDS_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loadingExtra, setLoadingExtra] = useState(false);

  useEffect(() => {
    if (visible && restaurantId) {
      fetchSettings();
    }
  }, [visible, restaurantId]);

  useEffect(() => {
    if (visible && restaurantId && (activeTab === "86items" || activeTab === "categorias")) {
      fetchExtraData();
    }
  }, [visible, restaurantId, activeTab]);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('kds_settings')
        .select('settings')
        .eq('restaurant_id', restaurantId)
        .single();

      if (!error && data?.settings) {
        setDraft({ ...DEFAULT_KDS_SETTINGS, ...data.settings });
      }
    } catch (err) {
      console.error('[KdsSettings] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchExtraData = async () => {
    setLoadingExtra(true);
    try {
      const [menuRes, catRes] = await Promise.all([
        supabase.from("menu_items").select("id, name, is_active").eq("restaurant_id", restaurantId).order("name"),
        supabase.from("categories").select("id, name").eq("restaurant_id", restaurantId).eq("is_active", true).order("name"),
      ]);
      
      if (!menuRes.error) setMenuItems(menuRes.data || []);
      if (!catRes.error) setCategories(catRes.data || []);
    } finally {
      setLoadingExtra(false);
    }
  };

  const handleSave = async () => {
    if (!restaurantId) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('kds_settings')
        .upsert({
          restaurant_id: restaurantId,
          settings: draft,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'restaurant_id'
        });

      if (error) throw error;
      onSave(draft);
      onClose();
    } catch (err) {
      console.error('[KdsSettings] Save error:', err);
    } finally {
      setSaving(false);
    }
  };

  const toggle86 = async (item: any) => {
    const newActive = !item.is_active;
    setMenuItems(prev => prev.map(m => m.id === item.id ? { ...m, is_active: newActive } : m));
    await supabase.from("menu_items").update({ is_active: newActive }).eq("id", item.id);
  };

  const updateCategoryTime = (index: number, minutes: number) => {
    const newCatTimes = [...draft.categoryTimes];
    newCatTimes[index].minutes = minutes;
    setDraft(p => ({ ...p, categoryTimes: newCatTimes }));
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'umbrales':
        return (
          <View style={styles.tabContainer}>
            <Text style={[styles.sectionDesc, { color: colors.muted }]}>Umbrales de tiempo para alertas visuales de tickets.</Text>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: '#f59e0b' }]}>TIEMPO ADVERTENCIA (AMARILLO)</Text>
              <View style={styles.inputWithUnit}>
                <TextInput 
                  style={[styles.input, { flex: 1, backgroundColor: colors.glass, borderColor: colors.glassHeavy, color: colors.text }]}
                  keyboardType="numeric"
                  value={String(draft.thresholds.yellow)}
                  onChangeText={(val) => setDraft(p => ({ ...p, thresholds: { ...p.thresholds, yellow: parseInt(val) || 0 } }))}
                />
                <Text style={[styles.unitText, { color: colors.muted }]}>min</Text>
              </View>
            </View>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: '#ef4444' }]}>TIEMPO CRÍTICO (ROJO)</Text>
              <View style={styles.inputWithUnit}>
                <TextInput 
                  style={[styles.input, { flex: 1, backgroundColor: colors.glass, borderColor: colors.glassHeavy, color: colors.text }]}
                  keyboardType="numeric"
                  value={String(draft.thresholds.red)}
                  onChangeText={(val) => setDraft(p => ({ ...p, thresholds: { ...p.thresholds, red: parseInt(val) || 0 } }))}
                />
                <Text style={[styles.unitText, { color: colors.muted }]}>min</Text>
              </View>
            </View>
          </View>
        );
      case 'categorias':
        return (
          <View style={styles.tabContainer}>
            <Text style={[styles.sectionDesc, { color: colors.muted }]}>Tiempo de preparación objetivo por categoría de plato.</Text>
            {draft.categoryTimes.length === 0 && <Text style={styles.emptyNote}>Sin categorías configuradas</Text>}
            {draft.categoryTimes.map((ct, i) => (
              <View key={i} style={[styles.itemRow, { backgroundColor: colors.glass }]}>
                <Text style={[styles.itemText, { color: colors.text }]}>{ct.name}</Text>
                <View style={styles.itemActions}>
                   <TextInput 
                    style={[styles.inlineInput, { color: colors.brandAccent }]}
                    keyboardType="numeric"
                    value={String(ct.minutes)}
                    onChangeText={(val) => updateCategoryTime(i, parseInt(val) || 0)}
                  />
                  <Text style={[styles.unitTextSmall, { color: colors.muted }]}>min</Text>
                  <TouchableOpacity onPress={() => setDraft(p => ({ ...p, categoryTimes: p.categoryTimes.filter((_, idx) => idx !== i) }))}>
                    <Trash2 size={16} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            <Text style={[styles.label, { color: colors.muted, marginTop: 12 }]}>AÑADIR CATEGORÍA</Text>
            {loadingExtra ? <ActivityIndicator color={colors.brandAccent} /> : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {categories.filter(c => !draft.categoryTimes.find(ct => ct.name === c.name)).map(c => (
                  <TouchableOpacity 
                    key={c.id} 
                    style={[styles.catChip, { backgroundColor: colors.glassHeavy }]}
                    onPress={() => setDraft(p => ({ ...p, categoryTimes: [...p.categoryTimes, { name: c.name, minutes: 15 }] }))}
                  >
                    <Plus size={12} color={colors.text} />
                    <Text style={[styles.catChipText, { color: colors.text }]}>{c.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        );
      case 'sonido':
        return (
          <View style={styles.tabContainer}>
            <Text style={[styles.sectionDesc, { color: colors.muted }]}>Alertas auditivas para eventos de cocina.</Text>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Volume2 size={18} color={colors.muted} />
                <Text style={[styles.settingLabel, { color: colors.text }]}>Nuevos Pedidos</Text>
              </View>
              <Switch 
                value={draft.sounds.newTicket}
                onValueChange={(val) => setDraft(p => ({ ...p, sounds: { ...p.sounds, newTicket: val } }))}
                trackColor={{ false: colors.glassHeavy, true: colors.brandAccent }}
              />
            </View>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Volume2 size={18} color="#ef4444" />
                <Text style={[styles.settingLabel, { color: colors.text }]}>Alertas Críticas (Retrasos)</Text>
              </View>
              <Switch 
                value={draft.sounds.criticalAlert}
                onValueChange={(val) => setDraft(p => ({ ...p, sounds: { ...p.sounds, criticalAlert: val } }))}
                trackColor={{ false: colors.glassHeavy, true: colors.brandAccent }}
              />
            </View>
          </View>
        );
      case 'auto':
        return (
          <View style={styles.tabContainer}>
            <Text style={[styles.sectionDesc, { color: colors.muted }]}>Ocultar automáticamente pedidos completados.</Text>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <ChefHat size={18} color={colors.muted} />
                <Text style={[styles.settingLabel, { color: colors.text }]}>Habilitar auto-borrado</Text>
              </View>
              <Switch 
                value={draft.autoClear.enabled}
                onValueChange={(val) => setDraft(p => ({ ...p, autoClear: { ...p.autoClear, enabled: val } }))}
                trackColor={{ false: colors.glassHeavy, true: colors.brandAccent }}
              />
            </View>
            {draft.autoClear.enabled && (
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.muted }]}>SEGUNDOS DE ESPERA ANTES DE OCULTAR</Text>
                <View style={styles.inputWithUnit}>
                  <TextInput 
                    style={[styles.input, { flex: 1, backgroundColor: colors.glass, borderColor: colors.glassHeavy, color: colors.text }]}
                    keyboardType="numeric"
                    value={String(draft.autoClear.delaySeconds)}
                    onChangeText={(val) => setDraft(p => ({ ...p, autoClear: { ...p.autoClear, delaySeconds: parseInt(val) || 0 } }))}
                  />
                  <Text style={[styles.unitText, { color: colors.muted }]}>seg</Text>
                </View>
              </View>
            )}
          </View>
        );
      case '86items':
        return (
          <View style={styles.tabContainer}>
            <Text style={[styles.sectionDesc, { color: colors.muted }]}>Marca productos como agotados (86). El cambio es inmediato.</Text>
            {loadingExtra ? <ActivityIndicator color={colors.brandAccent} /> : (
              menuItems.map(item => (
                <View key={item.id} style={[styles.menuItemRow, { backgroundColor: item.is_active ? colors.glass : 'rgba(239, 68, 68, 0.1)' }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.itemText, { color: item.is_active ? colors.text : '#ef4444', textDecorationLine: item.is_active ? 'none' : 'line-through' }]}>{item.name}</Text>
                    {!item.is_active && <Text style={styles.outOfStockBadge}>PRODUCTO AGOTADO</Text>}
                  </View>
                  <TouchableOpacity 
                    style={[styles.toggleBtn, { backgroundColor: item.is_active ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)' }]}
                    onPress={() => toggle86(item)}
                  >
                    <Text style={[styles.toggleBtnText, { color: item.is_active ? '#ef4444' : '#10b981' }]}>
                      {item.is_active ? "86 ITEM" : "RESTAURAR"}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        );
      case 'inventario':
        return (
          <View style={styles.tabContainer}>
             <Text style={[styles.sectionDesc, { color: colors.muted }]}>Descarga el inventario actual como CSV para actualizar conteos.</Text>
             <View style={[styles.infoCard, { backgroundColor: colors.glass, borderColor: colors.glassHeavy, borderWidth: 1 }]}>
                <Package size={32} color={colors.brandAccent} />
                <Text style={[styles.infoText, { color: colors.text }]}>Gestión de Bodega Sincronizada</Text>
                <Text style={[styles.subInfoText, { color: colors.muted }]}>Para realizar cargas masivas de inventario, utilice la versión web del Monitor de Cocina.</Text>
             </View>
             <View style={styles.inventoryActions}>
                <TouchableOpacity style={[styles.invBtn, { backgroundColor: colors.glassHeavy }]}>
                  <AlertTriangle size={18} color="#f59e0b" />
                  <Text style={[styles.invBtnText, { color: colors.text }]}>VER ALERTAS</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.invBtn, { backgroundColor: colors.glassHeavy }]}>
                  <CheckCircle size={18} color="#10b981" />
                  <Text style={[styles.invBtnText, { color: colors.text }]}>CONTEO RÁPIDO</Text>
                </TouchableOpacity>
             </View>
          </View>
        );
      default: return null;
    }
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <BlurView intensity={20} tint="dark" style={styles.overlay}>
        <View style={styles.centered}>
          <TouchableOpacity style={styles.dismissArea} activeOpacity={1} onPress={onClose} />
          
          <Animated.View entering={FadeInDown.springify()} style={[styles.modalContent, { backgroundColor: colors.navy, borderTopColor: colors.glassHeavy }]}>
            <View style={styles.header}>
              <View style={styles.headerTitleRow}>
                <Settings size={20} color={colors.brandAccent} />
                <Text style={[styles.title, { color: colors.text }]}>CONFIGURACIÓN KDS</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <X size={24} color={colors.muted} />
              </TouchableOpacity>
            </View>

            <View style={styles.tabsWrapper}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsList}>
                {TABS.map(({ key, label, Icon }) => (
                  <TouchableOpacity 
                    key={key} 
                    style={[styles.tabBtn, activeTab === key && { backgroundColor: colors.brandAccent }]}
                    onPress={() => setActiveTab(key)}
                  >
                    <Icon size={14} color={activeTab === key ? 'white' : colors.muted} />
                    <Text style={[styles.tabBtnText, { color: activeTab === key ? 'white' : colors.muted }]}>{label.toUpperCase()}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.contentScroll} contentContainerStyle={{ paddingBottom: 40 }}>
              {loading ? <ActivityIndicator color={colors.brandAccent} style={{ marginVertical: 40 }} /> : renderTabContent()}
            </ScrollView>

            {(activeTab !== '86items' && activeTab !== 'inventario') && (
              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.brandAccent }]} onPress={handleSave} disabled={saving}>
                {saving ? <ActivityIndicator color="white" /> : (
                  <>
                    <Text style={styles.saveBtnText}>GUARDAR CONFIGURACIÓN</Text>
                    <Save size={18} color="white" />
                  </>
                )}
              </TouchableOpacity>
            )}
          </Animated.View>
        </View>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1 },
  dismissArea: { flex: 1 },
  centered: { flex: 1, justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, borderTopWidth: 1, height: '92%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { fontSize: 20, fontWeight: '900', fontStyle: 'italic' },
  closeBtn: { padding: 4 },
  tabsWrapper: { marginBottom: 20, marginHorizontal: -24 },
  tabsList: { paddingHorizontal: 24, gap: 8 },
  tabBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.05)' },
  tabBtnText: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  contentScroll: { flex: 1 },
  tabContainer: { gap: 16 },
  sectionDesc: { fontSize: 13, fontStyle: 'italic', marginBottom: 8, lineHeight: 18 },
  inputGroup: { gap: 8 },
  label: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  inputWithUnit: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  input: { borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1, fontSize: 16, fontWeight: '700' },
  unitText: { fontSize: 14, fontWeight: '700' },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 16 },
  itemText: { fontSize: 14, fontWeight: '700' },
  itemActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  inlineInput: { fontSize: 16, fontWeight: '900', width: 40, textAlign: 'right' },
  unitTextSmall: { fontSize: 12, fontWeight: '600' },
  addCategoryRow: { marginTop: 8 },
  catChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  catChipText: { fontSize: 12, fontWeight: '700' },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  settingInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingLabel: { fontSize: 15, fontWeight: '700' },
  menuItemRow: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, gap: 12 },
  outOfStockBadge: { color: '#ef4444', fontSize: 9, fontWeight: '900', letterSpacing: 1, marginTop: 2 },
  toggleBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  toggleBtnText: { fontSize: 10, fontWeight: '900' },
  infoCard: { padding: 32, borderRadius: 24, gap: 16, alignItems: 'center' },
  infoText: { fontSize: 18, textAlign: 'center', fontWeight: '900', fontStyle: 'italic' },
  subInfoText: { fontSize: 13, textAlign: 'center', fontWeight: '600', lineHeight: 20 },
  inventoryActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  invBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 16 },
  invBtnText: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  emptyNote: { fontSize: 14, textAlign: 'center', marginTop: 20, fontStyle: 'italic', opacity: 0.3 },
  saveBtn: { height: 56, borderRadius: 18, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 12 },
  saveBtnText: { color: 'white', fontSize: 14, fontWeight: '900', letterSpacing: 1 }
});
