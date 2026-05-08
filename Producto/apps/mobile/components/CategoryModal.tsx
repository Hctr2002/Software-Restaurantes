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
  Keyboard
} from 'react-native';
import { X, Tag, Trash2 } from 'lucide-react-native';
import { MB_COLORS, MB_RADIUS, MB_SPACING } from '../constants/MB_Theme';

export interface CategoryData {
  id: string;
  name: string;
  is_active: boolean;
}

interface CategoryModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  category: CategoryData | null;
}

export const CategoryModal = ({ visible, onClose, onSave, onDelete, category }: CategoryModalProps) => {
  const [name, setName] = React.useState('');
  const [isActive, setIsActive] = React.useState(true);
  const [loading, setLoading] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  React.useEffect(() => {
    if (category) {
      setName(category.name);
      setIsActive(category.is_active !== false); // Default to true if undefined
    } else {
      setName('');
      setIsActive(true);
    }
  }, [category, visible]);

  const handleSave = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      await onSave({ 
        name: name.trim(), 
        is_active: isActive,
        id: category?.id 
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!category || !onDelete) return;
    setDeleting(true);
    try {
      await onDelete(category.id);
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
                <Text style={styles.title}>{category ? 'Editar Categoría' : 'Nueva Categoría'}</Text>
                <TouchableOpacity onPress={onClose}>
                  <X size={20} color="white" />
                </TouchableOpacity>
              </View>

              <View style={styles.form}>
                <Text style={styles.label}>Nombre de la Categoría</Text>
                <View style={styles.inputContainer}>
                  <Tag size={16} color={MB_COLORS.muted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={name}
                    onChangeText={setName}
                    placeholder="Ej. Bebidas, Postres..."
                    placeholderTextColor={MB_COLORS.muted}
                    autoCapitalize="words"
                  />
                </View>

                <TouchableOpacity 
                  style={styles.toggleContainer} 
                  onPress={() => setIsActive(!isActive)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.checkbox, isActive && styles.checkboxActive]}>
                    {isActive && <View style={styles.checkboxInner} />}
                  </View>
                  <Text style={styles.toggleLabel}>Categoría Activa</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.saveButton, !name.trim() && { opacity: 0.5 }]} 
                  onPress={handleSave}
                  disabled={loading || !name.trim()}
                >
                  {loading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.saveButtonText}>
                      {category ? 'Guardar Cambios' : 'Crear Categoría'}
                    </Text>
                  )}
                </TouchableOpacity>

                {category && (
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
                        <Text style={styles.deleteButtonText}>Eliminar Categoría</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>
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
  label: {
    color: MB_COLORS.muted,
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
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
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxActive: {
    backgroundColor: MB_COLORS.brandAccent,
    borderColor: MB_COLORS.brandAccent,
  },
  checkboxInner: {
    width: 10,
    height: 10,
    borderRadius: 2,
    backgroundColor: 'white',
  },
  toggleLabel: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
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
