import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Mail, Lock, LogIn, Utensils, Eye, EyeOff } from 'lucide-react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { MB_SPACING, MB_RADIUS } from '../../constants/MB_Theme';
import { supabase } from '../../lib/supabase';

const EMERALD = '#10b981';
const MUTED = 'rgba(255,255,255,0.4)';
const GLASS = 'rgba(255,255,255,0.05)';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Por favor ingresa tu email y contraseña');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      Alert.alert('Error de acceso', 'Credenciales inválidas o problema de servidor');
      setLoading(false);
    }
    // AuthContext handles navigation on success
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Background blobs — igual que la landing */}
      <View style={styles.bgBlob1} />
      <View style={styles.bgBlob2} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.formContainer}
      >
        <Animated.View entering={FadeInDown.duration(800)} style={styles.header}>
          <View style={styles.logoBadge}>
            <Utensils color="#020617" size={32} />
          </View>
          <Text style={styles.title}>
            Menu<Text style={styles.titleAccent}>Bites</Text>
          </Text>
          <Text style={styles.subtitle}>Acceso para personal del restaurante</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(800)} style={styles.inputSection}>
          <View style={styles.inputWrapper}>
            <Mail color={MUTED} size={20} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={MUTED}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputWrapper}>
            <Lock color={MUTED} size={20} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Contraseña"
              placeholderTextColor={MUTED}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeIcon}
            >
              {showPassword
                ? <EyeOff color={MUTED} size={20} />
                : <Eye color={MUTED} size={20} />}
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.loginButton, loading && styles.disabledButton]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
                <LogIn color="white" size={20} style={{ marginLeft: 8 }} />
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.forgotButton}
            onPress={() => router.push('/(auth)/forgot-password' as any)}
          >
            <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View entering={FadeIn.delay(600)} style={styles.footer}>
          <Text style={styles.versionText}>v1.1.0 · Menu Bites Staff</Text>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },

  // Background — mismos blobs que la landing
  bgBlob1: {
    position: 'absolute',
    top: -120,
    right: -120,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: EMERALD,
    opacity: 0.07,
  },
  bgBlob2: {
    position: 'absolute',
    bottom: -80,
    left: -80,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: EMERALD,
    opacity: 0.05,
  },

  formContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: MB_SPACING.xl,
  },

  // Header / logo
  header: {
    alignItems: 'center',
    marginBottom: MB_SPACING.xxl,
  },
  logoBadge: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: EMERALD,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: MB_SPACING.md,
    shadowColor: EMERALD,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: 'white',
    letterSpacing: -1,
  },
  titleAccent: {
    color: EMERALD,
  },
  subtitle: {
    fontSize: 13,
    color: MUTED,
    marginTop: MB_SPACING.xs,
  },

  // Inputs
  inputSection: {
    gap: MB_SPACING.md,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: GLASS,
    borderRadius: MB_RADIUS.md,
    paddingHorizontal: MB_SPACING.md,
    height: 56,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  inputIcon: {
    marginRight: MB_SPACING.sm,
  },
  eyeIcon: {
    padding: MB_SPACING.xs,
  },
  input: {
    flex: 1,
    color: 'white',
    fontSize: 16,
  },

  // Button
  loginButton: {
    flexDirection: 'row',
    backgroundColor: EMERALD,
    height: 56,
    borderRadius: MB_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: MB_SPACING.md,
    shadowColor: EMERALD,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  disabledButton: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: '#020617',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  // Links
  forgotButton: {
    alignItems: 'center',
    paddingVertical: MB_SPACING.sm,
  },
  forgotText: {
    color: EMERALD,
    fontSize: 13,
    fontWeight: '600',
    opacity: 0.8,
  },

  // Footer
  footer: {
    marginTop: MB_SPACING.xxl,
    alignItems: 'center',
  },
  versionText: {
    color: 'rgba(255,255,255,0.2)',
    fontSize: 11,
    letterSpacing: 0.5,
  },
});
