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
  Image,
  ScrollView,
  Share
} from 'react-native';
import { X, Hash, Trash2, MapPin, Share as ShareIcon } from 'lucide-react-native';
import { MB_COLORS, MB_RADIUS, MB_SPACING } from '../constants/MB_Theme';

export interface TableData {
  id: string;
  number: number;
  label: string;
  status: 'FREE' | 'OCCUPIED' | 'RESERVED' | 'CLEANING';
  qrData?: string;
}

interface TableModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  table: TableData | null;
}

const STATUSES = ['FREE', 'OCCUPIED', 'RESERVED', 'CLEANING'];

export const TableModal = ({ visible, onClose, onSave, onDelete, table }: TableModalProps) => {
  const [number, setNumber] = React.useState('');
  const [label, setLabel] = React.useState('');
  const [status, setStatus] = React.useState<'FREE' | 'OCCUPIED' | 'RESERVED' | 'CLEANING'>('FREE');
  const [loading, setLoading] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  React.useEffect(() => {
    if (table) {
      setNumber(table.number.toString());
      setLabel(table.label || '');
      setStatus(table.status);
    } else {
      setNumber('');
      setLabel('');
      setStatus('FREE');
    }
  }, [table, visible]);

  const handleSave = async () => {
    if (!number.trim()) return;
    setLoading(true);
    try {
      await onSave({ 
        number: parseInt(number), 
        label: label.trim(),
        status,
        id: table?.id 
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!table || !onDelete) return;
    setDeleting(true);
    try {
      await onDelete(table.id);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  const qrImageUrl = table?.qrData 
    ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(table.qrData)}`
    : null;

  const handleShareQR = async () => {
    if (!table?.qrData) return;
    try {
      await Share.share({
        message: `Mesa ${table.number} - Menú Digital: ${table.qrData}`,
        url: table.qrData
      });
    } catch (error) {
      console.error('Error sharing QR:', error);
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
                <Text style={styles.title}>{table ? `Mesa ${table.number}` : 'Nueva Mesa'}</Text>
                <TouchableOpacity onPress={onClose}>
                  <X size={20} color="white" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.scrollView} bounces={false}>
                <View style={styles.form}>
                  <View style={styles.row}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.label}>Número</Text>
                      <View style={styles.inputContainer}>
                        <Hash size={16} color={MB_COLORS.muted} style={styles.inputIcon} />
                        <TextInput
                          style={styles.input}
                          value={number}
                          onChangeText={setNumber}
                          placeholder="Ej. 1"
                          placeholderTextColor={MB_COLORS.muted}
                          keyboardType="number-pad"
                        />
                      </View>
                    </View>
                  </View>

                  <Text style={[styles.label, { marginTop: 16 }]}>Ubicación / Etiqueta</Text>
                  <View style={styles.inputContainer}>
                    <MapPin size={16} color={MB_COLORS.muted} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      value={label}
                      onChangeText={setLabel}
                      placeholder="Ej. Terraza, Piso 2..."
                      placeholderTextColor={MB_COLORS.muted}
                    />
                  </View>

                  <Text style={[styles.label, { marginTop: 16 }]}>Estado de la Mesa</Text>
                  <View style={styles.statusGrid}>
                    {STATUSES.map((s) => (
                      <TouchableOpacity 
                        key={s}
                        style={[
                          styles.statusBtn, 
                          status === s && styles.statusBtnActive,
                          status === s && s === 'FREE' && { borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)' },
                          status === s && s === 'OCCUPIED' && { borderColor: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)' },
                          status === s && s === 'RESERVED' && { borderColor: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.1)' },
                          status === s && s === 'CLEANING' && { borderColor: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.1)' },
                        ]}
                        onPress={() => setStatus(s as any)}
                      >
                        <Text style={[
                          styles.statusBtnText, 
                          status === s && { color: s === 'FREE' ? '#10b981' : s === 'OCCUPIED' ? '#ef4444' : s === 'RESERVED' ? '#f59e0b' : '#3b82f6' }
                        ]}>
                          {s === 'FREE' ? 'LIBRE' : s === 'OCCUPIED' ? 'OCUPADA' : s === 'CLEANING' ? 'LIMPIEZA' : 'RESERVADA'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {table && qrImageUrl && (
                    <View style={styles.qrSection}>
                      <Text style={styles.label}>Código QR</Text>
                      <View style={styles.qrContainer}>
                        <View style={styles.qrWrapper}>
                          <Image 
                            source={{ uri: qrImageUrl }} 
                            style={styles.qrImage}
                          />
                        </View>
                        <TouchableOpacity 
                          style={styles.shareQRButton} 
                          onPress={handleShareQR}
                        >
                          <ShareIcon size={16} color={MB_COLORS.brandAccent} />
                          <Text style={styles.shareQRText}>Compartir QR</Text>
                        </TouchableOpacity>
                        <Text style={styles.qrHint}>Escanea para abrir el menú digital de esta mesa</Text>
                      </View>
                    </View>
                  )}

                  <TouchableOpacity 
                    style={[styles.saveButton, !number.trim() && { opacity: 0.5 }]} 
                    onPress={handleSave}
                    disabled={loading || !number.trim()}
                  >
                    {loading ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <Text style={styles.saveButtonText}>
                        {table ? 'Guardar Cambios' : 'Crear Mesa'}
                      </Text>
                    )}
                  </TouchableOpacity>

                  {table && (
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
                          <Text style={styles.deleteButtonText}>Eliminar Mesa</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
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
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    maxHeight: '90%',
    overflow: 'hidden',
  },
  scrollView: {
    flexGrow: 0,
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
    color: 'white',
    fontSize: 20,
    fontWeight: '900',
    textTransform: 'uppercase',
    fontStyle: 'italic',
  },
  form: {
    padding: 24,
  },
  row: {
    flexDirection: 'row',
    gap: 16,
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
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  statusGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  statusBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  statusBtnActive: {
    borderWidth: 1,
  },
  statusBtnText: {
    color: MB_COLORS.muted,
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  qrSection: {
    marginTop: 32,
    alignItems: 'center',
    paddingTop: 32,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  qrContainer: {
    alignItems: 'center',
    gap: 16,
  },
  qrWrapper: {
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 24,
  },
  qrImage: {
    width: 160,
    height: 160,
  },
  qrHint: {
    color: MB_COLORS.muted,
    fontSize: 10,
    textAlign: 'center',
    paddingHorizontal: 40,
    fontWeight: '600',
  },
  shareQRButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(254, 95, 85, 0.1)',
    borderRadius: 12,
  },
  shareQRText: {
    color: MB_COLORS.brandAccent,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  saveButton: {
    backgroundColor: MB_COLORS.brandAccent,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
    shadowColor: MB_COLORS.brandAccent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    gap: 8,
    paddingVertical: 12,
  },
  deleteButtonText: {
    color: MB_COLORS.brandAccent,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  }
});
