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
import { User, Mail, Save, ChevronLeft } from 'lucide-react-native';
import { MB_SPACING, MB_RADIUS } from '../../constants/MB_Theme';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';

export default function ProfileScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();

  const [loading, setLoading] = React.useState(false);
  const [name, setName] = React.useState(user?.user_metadata?.full_name || '');
  const [email] = React.useState(user?.email || '');

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'El nombre no puede estar vacío');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: name.trim() }
      });

      if (error) throw error;
      Alert.alert('Éxito', 'Perfil actualizado correctamente');
      router.back();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo actualizar el perfil');
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
        title: 'PERFIL',
        headerStyle: { backgroundColor: colors.navy },
        headerTintColor: colors.text,
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 10 }}>
            <ChevronLeft color={colors.text} size={24} />
          </TouchableOpacity>
        )
      }} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.avatarSection}>
          <View style={[styles.avatar, { backgroundColor: colors.brandAccent, shadowColor: colors.brandAccent }]}>
            <Text style={styles.avatarText}>{email?.[0].toUpperCase()}</Text>
          </View>
          <Text style={[styles.emailLabel, { color: colors.muted }]}>{email}</Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Información Personal</Text>

          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <User size={14} color={colors.muted} />
              <Text style={[styles.label, { color: colors.muted }]}>Nombre Completo</Text>
            </View>
            <TextInput
              style={[styles.input, { backgroundColor: colors.glass, borderColor: colors.glassHeavy, color: colors.text }]}
              value={name}
              onChangeText={setName}
              placeholder="Tu nombre"
              placeholderTextColor={colors.muted}
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Mail size={14} color={colors.muted} />
              <Text style={[styles.label, { color: colors.muted }]}>Correo Electrónico (No editable)</Text>
            </View>
            <TextInput
              style={[styles.input, styles.disabledInput, { backgroundColor: colors.glass + '80', color: colors.muted }]}
              value={email}
              editable={false}
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: colors.brandAccent, shadowColor: colors.brandAccent }, loading && styles.disabledButton]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Save size={20} color="white" />
              <Text style={styles.saveButtonText}>GUARDAR CAMBIOS</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: MB_SPACING.lg,
  },
  avatarSection: {
    alignItems: 'center',
    marginVertical: 32,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  avatarText: {
    fontSize: 40,
    color: 'white',
    fontWeight: '900',
  },
  emailLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 20,
    marginLeft: 4,
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
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  input: {
    borderRadius: MB_RADIUS.lg,
    borderWidth: 1,
    padding: 16,
    fontSize: 15,
    fontWeight: '600',
  },
  disabledInput: {
    borderColor: 'transparent',
  },
  saveButton: {
    height: 60,
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
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
  }
});
