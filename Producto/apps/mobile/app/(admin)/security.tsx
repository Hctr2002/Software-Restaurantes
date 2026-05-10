import React from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Lock, ShieldCheck, ChevronLeft } from 'lucide-react-native';
import { MB_COLORS, MB_SPACING, MB_RADIUS } from '../../constants/MB_Theme';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';

export default function SecurityScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  
  const [loading, setLoading] = React.useState(false);
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');

  const handleUpdatePassword = async () => {
    if (!password || password.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;
      Alert.alert('Éxito', 'Contraseña actualizada correctamente');
      setPassword('');
      setConfirmPassword('');
      router.back();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo actualizar la contraseña');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: colors.navy }]} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen options={{ 
        headerShown: true, 
        title: 'SEGURIDAD',
        headerStyle: { backgroundColor: colors.navy },
        headerTintColor: colors.text,
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 10 }}>
            <ChevronLeft color={colors.text} size={24} />
          </TouchableOpacity>
        )
      }} />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.iconHeader}>
          <View style={[styles.shieldIcon, { backgroundColor: colors.brandAccent + '20', borderColor: colors.brandAccent + '40' }]}>
            <ShieldCheck size={40} color={colors.brandAccent} />
          </View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Cambiar Contraseña</Text>
          <Text style={[styles.headerSub, { color: colors.muted }]}>Asegura el acceso a tu cuenta administrativa</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Lock size={14} color={colors.muted} />
              <Text style={[styles.label, { color: colors.muted }]}>Nueva Contraseña</Text>
            </View>
            <TextInput
              style={[styles.input, { backgroundColor: colors.glass, borderColor: colors.glassHeavy, color: colors.text }]}
              value={password}
              onChangeText={setPassword}
              placeholder="Min. 6 caracteres"
              placeholderTextColor={colors.muted}
              secureTextEntry
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Lock size={14} color={colors.muted} />
              <Text style={[styles.label, { color: colors.muted }]}>Confirmar Contraseña</Text>
            </View>
            <TextInput
              style={[styles.input, { backgroundColor: colors.glass, borderColor: colors.glassHeavy, color: colors.text }]}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Repite la contraseña"
              placeholderTextColor={colors.muted}
              secureTextEntry
            />
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.saveButton, { backgroundColor: colors.brandAccent, shadowColor: colors.brandAccent }, loading && styles.disabledButton]}
          onPress={handleUpdatePassword}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Lock size={20} color="white" />
              <Text style={styles.saveButtonText}>ACTUALIZAR CONTRASEÑA</Text>
            </>
          )}
        </TouchableOpacity>
        
        <Text style={styles.footerNote}>
          Se recomienda usar una combinación de letras, números y símbolos para mayor seguridad.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MB_COLORS.navy,
  },
  scrollContent: {
    padding: MB_SPACING.lg,
  },
  iconHeader: {
    alignItems: 'center',
    marginVertical: 40,
  },
  shieldIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: 'rgba(254, 95, 85, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(254, 95, 85, 0.2)',
    marginBottom: 20,
  },
  headerTitle: {
    color: 'white',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  headerSub: {
    color: MB_COLORS.muted,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  section: {
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 24,
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
  },
  disabledButton: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },
  footerNote: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 24,
    paddingHorizontal: 40,
    lineHeight: 16,
  }
});
