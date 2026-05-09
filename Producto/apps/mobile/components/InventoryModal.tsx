import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  TextInput, 
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView
} from 'react-native';
import { X, Package, Trash2, Hash, Ruler } from 'lucide-react-native';
import { MB_COLORS, MB_RADIUS, MB_SPACING } from '../constants/MB_Theme';

export interface InventoryItemData {
  id: string;
  name: string;
  stock: number;
  unit: string;
}

interface InventoryModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  item: InventoryItemData | null;
}

const UNITS = ["unidades", "kg", "g", "L", "mL", "porciones"];

export const InventoryModal = ({ visible, onClose, onSave, onDelete, item }: InventoryModalProps) => {
  const [name, setName] = React.useState('');
  const [stock, setStock] = React.useState('');
  const [unit, setUnit] = React.useState(UNITS[0]);
  const [loading, setLoading] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  React.useEffect(() => {
    if (item) {
      setName(item.name);
      setStock(item.stock.toString());
      setUnit(item.unit || UNITS[0]);
    } else {
      setName('');
      setStock('0');
      setUnit(UNITS[0]);
    }
  }, [item, visible]);

  const handleSave = async () => {
    if (!name.trim() || isNaN(parseFloat(stock))) return;
    
    setLoading(true);
    try {
      await onSave({ 
        name: name.trim(), 
        stock: parseFloat(stock),
        unit: unit,
        id: item?.id 
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!item || !onDelete) return;
    setDeleting(true);
    try {
      await onDelete(item.id);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <KeyboardAvoidingView 
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.content}
            >
              <View style={styles.header}>
                <Text style={styles.title}>{item ? 'Editar Insumo' : 'Nuevo Insumo'}</Text>
                <TouchableOpacity onPress={onClose}>
                  <X size={20} color="white" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.form} bounces={false}>
                <Text style={styles.label}>Nombre del Insumo</Text>
                <View style={styles.inputContainer}>
                  <Package size={16} color={MB_COLORS.muted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={name}
                    onChangeText={setName}
                    placeholder="Ej. Harina, Tomates..."
                    placeholderTextColor={MB_COLORS.muted}
                    autoCapitalize="words"
                  />
                </View>

                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Stock Actual</Text>
                    <View style={styles.inputContainer}>
                      <Hash size={16} color={MB_COLORS.muted} style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        value={stock}
                        onChangeText={setStock}
                        placeholder="0.00"
                        placeholderTextColor={MB_COLORS.muted}
                        keyboardType="numeric"
                      />
                    </View>
                  </View>
                </View>

                <Text style={styles.label}>Unidad de Medida</Text>
                <View style={styles.unitsGrid}>
                  {UNITS.map((u) => (
                    <TouchableOpacity 
                      key={u}
                      style={[styles.unitChip, unit === u && styles.unitChipActive]}
                      onPress={() => setUnit(u)}
                    >
                      <Text style={[styles.unitChipText, unit === u && styles.unitChipTextActive]}>
                        {u}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity 
                  style={[styles.saveButton, (!name.trim() || !stock) && { opacity: 0.5 }]} 
                  onPress={handleSave}
                  disabled={loading || !name.trim() || !stock}
                >
                  {loading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.saveButtonText}>
                      {item ? 'Actualizar Stock' : 'Registrar Insumo'}
                    </Text>
                  )}
                </TouchableOpacity>

                {item && (
                  <TouchableOpacity 
                    style={styles.deleteButton} 
                    onPress={handleDelete}
                    disabled={deleting}
                  >
                    {deleting ? (
                      <ActivityIndicator color={MB_COLORS.brandAccent} />
                    ) : (
                      <>
                        <Trash2 size={16} color={MB_COLORS.brandAccent} />
                        <Text style={styles.deleteButtonText}>Eliminar Insumo</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
                <View style={{ height: 20 }} />
              </ScrollView>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    padding: 20,
  },
  content: {
    backgroundColor: MB_COLORS.navy,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  title: {
    color: 'white',
    fontSize: 18,
    fontWeight: '900',
  },
  form: {
    padding: 20,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 0,
  },
  label: {
    color: MB_COLORS.muted,
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  unitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  unitChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  unitChipActive: {
    backgroundColor: MB_COLORS.brandAccent,
    borderColor: MB_COLORS.brandAccent,
  },
  unitChipText: {
    color: MB_COLORS.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  unitChipTextActive: {
    color: 'white',
  },
  saveButton: {
    backgroundColor: MB_COLORS.brandAccent,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '900',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    gap: 8,
    paddingVertical: 8,
  },
  deleteButtonText: {
    color: MB_COLORS.brandAccent,
    fontSize: 12,
    fontWeight: '800',
  }
});
