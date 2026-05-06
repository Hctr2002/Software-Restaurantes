import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Switch,
  ActivityIndicator,
  Image
} from 'react-native';
import { X, ImagePlus, Check, ChevronDown, Trash2 } from 'lucide-react-native';
import { MB_COLORS } from '../constants/MB_Theme';
import * as ImagePicker from 'expo-image-picker';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Alert } from 'react-native';

interface MenuItemModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: any, newImageUri?: string) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  item?: any;
  categories: any[];
}

export default function MenuItemModal({ 
  visible, 
  onClose, 
  onSave, 
  onDelete,
  item, 
  categories 
}: MenuItemModalProps) {
  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [price, setPrice] = React.useState('');
  const [categoryId, setCategoryId] = React.useState('');
  const [isActive, setIsActive] = React.useState(true);
  const [imageUrl, setImageUrl] = React.useState('');
  const [newImageUri, setNewImageUri] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = React.useState(false);

  React.useEffect(() => {
    if (item) {
      setName(item.name || '');
      setDescription(item.description || '');
      setPrice(item.price?.toString() || '');
      setCategoryId(item.category_id || '');
      setIsActive(item.is_active ?? true);
      setImageUrl(item.image_url || '');
      setNewImageUri(null);
    } else {
      setName('');
      setDescription('');
      setPrice('');
      setCategoryId('');
      setIsActive(true);
      setImageUrl('');
      setNewImageUri(null);
    }
    setShowCategoryPicker(false);
  }, [item, visible]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setNewImageUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!name || !price || !categoryId) return;
    
    setLoading(true);
    try {
      await onSave({
        id: item?.id,
        name,
        description,
        price: parseFloat(price),
        category_id: categoryId,
        is_active: isActive,
        image_url: imageUrl
      }, newImageUri || undefined);
      onClose();
    } catch (err) {
      console.error('Error saving menu item:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!item?.id || !onDelete) return;

    Alert.alert(
      "Eliminar Plato",
      "¿Estás seguro de que quieres eliminar este plato? Esta acción no se puede deshacer.",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Eliminar", 
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              await onDelete(item.id);
              onClose();
            } catch (err) {
              console.error('Error deleting menu item:', err);
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.content}
        >
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.title}>
                {item ? 'Editar Plato' : 'Nuevo Plato'}
              </Text>
              {item && (
                <TouchableOpacity 
                  onPress={handleDelete}
                  style={styles.deleteButtonHeader}
                >
                  <Trash2 color="#ef4444" size={18} />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X color="#fff" size={24} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.form} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
              {newImageUri || imageUrl ? (
                <Image source={{ uri: newImageUri || imageUrl }} style={styles.previewImage} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <ImagePlus color="rgba(255,255,255,0.3)" size={32} />
                  <Text style={styles.imagePlaceholderText}>Añadir Imagen</Text>
                </View>
              )}
              {(newImageUri || imageUrl) && (
                <View style={styles.imageOverlay}>
                  <ImagePlus color="#fff" size={20} />
                </View>
              )}
            </TouchableOpacity>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nombre del Plato</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Ej. Hamburguesa Especial"
                placeholderTextColor="rgba(255,255,255,0.2)"
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Precio</Text>
                <TextInput
                  style={styles.input}
                  value={price}
                  onChangeText={setPrice}
                  placeholder="0.00"
                  keyboardType="numeric"
                  placeholderTextColor="rgba(255,255,255,0.2)"
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1.5, marginLeft: 12 }]}>
                <Text style={styles.label}>Categoría</Text>
                <TouchableOpacity 
                  style={[styles.pickerContainer, showCategoryPicker && styles.pickerContainerActive]}
                  onPress={() => setShowCategoryPicker(!showCategoryPicker)}
                >
                  <Text style={[styles.pickerText, !categoryId && { color: 'rgba(255,255,255,0.2)' }]}>
                    {categories.find(c => c.id === categoryId)?.name || 'Seleccionar...'}
                  </Text>
                  <ChevronDown color={showCategoryPicker ? MB_COLORS.brandAccent : "rgba(255,255,255,0.4)"} size={16} />
                </TouchableOpacity>

                {showCategoryPicker && (
                  <Animated.View entering={FadeInDown.duration(200)} style={styles.dropdownList}>
                    <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled keyboardShouldPersistTaps="handled">
                      {categories.map(cat => (
                        <TouchableOpacity 
                          key={cat.id} 
                          onPress={() => {
                            setCategoryId(cat.id);
                            setShowCategoryPicker(false);
                          }}
                          style={[styles.dropdownItem, categoryId === cat.id && styles.dropdownItemActive]}
                        >
                          <Text style={[styles.dropdownItemText, categoryId === cat.id && styles.dropdownItemTextActive]}>
                            {cat.name}
                          </Text>
                          {categoryId === cat.id && <Check size={14} color="#000" />}
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </Animated.View>
                )}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Descripción</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Describe los ingredientes o preparación..."
                placeholderTextColor="rgba(255,255,255,0.2)"
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.statusContainer}>
              <View>
                <Text style={styles.statusTitle}>Disponibilidad</Text>
                <Text style={styles.statusSub}>¿Está el plato listo para la venta?</Text>
              </View>
              <Switch
                value={isActive}
                onValueChange={setIsActive}
                trackColor={{ false: '#333', true: '#10b981' }}
                thumbColor={isActive ? '#fff' : '#f4f3f4'}
              />
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity 
              style={styles.saveButton}
              onPress={handleSave}
              disabled={loading || !name || !price || !categoryId}
            >
              {loading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <>
                  <Check color="#000" size={20} style={{ marginRight: 8 }} />
                  <Text style={styles.saveButtonText}>Guardar Plato</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: '#111',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    height: '90%',
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: '#fff',
    textTransform: 'uppercase',
    fontStyle: 'italic',
  },
  closeButton: {
    padding: 4,
  },
  deleteButtonHeader: {
    marginLeft: 12,
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  form: {
    padding: 24,
  },
  imagePicker: {
    width: '100%',
    height: 180,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 24,
    overflow: 'hidden',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  imagePlaceholderText: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 8,
    textTransform: 'uppercase',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  inputGroup: {
    marginBottom: 20,
    zIndex: 1,
  },
  label: {
    fontSize: 10,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
    paddingLeft: 4,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 52,
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  textArea: {
    height: 100,
    paddingTop: 16,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    zIndex: 10,
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 52,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  pickerContainerActive: {
    borderColor: MB_COLORS.brandAccent,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  pickerText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  dropdownList: {
    position: 'absolute',
    top: 65,
    left: 0,
    right: 0,
    backgroundColor: '#222',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    zIndex: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  dropdownItemActive: {
    backgroundColor: '#fff',
  },
  dropdownItemText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '600',
  },
  dropdownItemTextActive: {
    color: '#000',
    fontWeight: '800',
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 20,
    marginTop: 10,
    marginBottom: 40,
  },
  statusTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  statusSub: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
    fontWeight: '600',
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  saveButton: {
    height: 56,
    backgroundColor: '#fff',
    borderRadius: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },
  saveButtonText: {
    color: '#000',
    fontSize: 15,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
});
