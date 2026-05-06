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
import { X, Mail, Lock, Shield, Trash2, Eye, EyeOff } from 'lucide-react-native';
import { MB_COLORS, MB_RADIUS, MB_SPACING } from '../constants/MB_Theme';
import { UserProfile } from './UserCard';

interface UserModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  user: UserProfile | null;
}

const ROLES = ["ADMIN", "GARZON", "COCINA", "CAJERO"];

export const UserModal = ({ visible, onClose, onSave, onDelete, user }: UserModalProps) => {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [role, setRole] = React.useState('GARZON');
  const [loading, setLoading] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  React.useEffect(() => {
    if (user) {
      setEmail(user.email);
      setRole(user.role);
      setPassword(''); 
      setShowPassword(false);
    } else {
      setEmail('');
      setRole('GARZON');
      setPassword('');
      setShowPassword(false);
    }
  }, [user, visible]);

  const handleSave = async () => {
    if (!email || (!user && !password)) return;
    setLoading(true);
    try {
      await onSave({ email, password, role, id: user?.id });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!user || !onDelete) return;
    setDeleting(true);
    try {
      await onDelete(user.id);
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
                <Text style={styles.title}>{user ? 'Editar Usuario' : 'Nuevo Usuario'}</Text>
                <TouchableOpacity onPress={onClose}>
                  <X size={20} color="white" />
                </TouchableOpacity>
              </View>

              <View style={styles.form}>
                <Text style={styles.label}>Email</Text>
                <View style={styles.inputContainer}>
                  <Mail size={16} color={MB_COLORS.muted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="ejemplo@restaurante.com"
                    placeholderTextColor={MB_COLORS.muted}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    editable={!user} // Email usually not editable in Auth
                  />
                </View>

                <Text style={styles.label}>{user ? 'Nueva Contraseña (Opcional)' : 'Contraseña'}</Text>
                <View style={styles.inputContainer}>
                  <Lock size={16} color={MB_COLORS.muted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="••••••••"
                    placeholderTextColor={MB_COLORS.muted}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity 
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeButton}
                  >
                    {showPassword ? (
                      <EyeOff size={18} color={MB_COLORS.muted} />
                    ) : (
                      <Eye size={18} color={MB_COLORS.muted} />
                    )}
                  </TouchableOpacity>
                </View>

                <Text style={styles.label}>Rol</Text>
                <View style={styles.rolesRow}>
                  {ROLES.map((r) => (
                    <TouchableOpacity 
                      key={r}
                      onPress={() => setRole(r)}
                      style={[
                        styles.roleButton,
                        role === r && styles.roleButtonActive
                      ]}
                    >
                      <Text style={[
                        styles.roleButtonText,
                        role === r && styles.roleButtonTextActive
                      ]}>{r}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity 
                  style={styles.saveButton} 
                  onPress={handleSave}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.saveButtonText}>
                      {user ? 'Guardar Cambios' : 'Crear Usuario'}
                    </Text>
                  )}
                </TouchableOpacity>

                {user && (
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
                        <Text style={styles.deleteButtonText}>Eliminar Usuario</Text>
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
  eyeButton: {
    padding: 8,
  },
  rolesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  roleButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  roleButtonActive: {
    backgroundColor: 'rgba(254, 95, 85, 0.1)',
    borderColor: 'rgba(254, 95, 85, 0.2)',
  },
  roleButtonText: {
    color: MB_COLORS.muted,
    fontSize: 11,
    fontWeight: '800',
  },
  roleButtonTextActive: {
    color: MB_COLORS.brandAccent,
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
