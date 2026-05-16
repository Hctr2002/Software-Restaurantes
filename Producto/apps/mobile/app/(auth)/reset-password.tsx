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
import { Lock, Eye, EyeOff, ChefHat, CheckCircle, ShieldCheck } from 'lucide-react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { MB_COLORS, MB_SPACING, MB_RADIUS } from '../../constants/MB_Theme';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { clearPasswordRecovery } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleReset = async () => {
    if (password.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (password !== confirm) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      Alert.alert('Error', 'No se pudo actualizar la contraseña. El enlace puede haber expirado.');
    } else {
      setDone(true);
      clearPasswordRecovery();
    }
  };

  const handleGoToLogin = async () => {
    await supabase.auth.signOut();
    router.replace('/(auth)/login');
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.bgCircle1} />
      <View style={styles.bgCircle2} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inner}
      >
        <Animated.View entering={FadeInDown.duration(700)} style={styles.header}>
          <View style={styles.logoContainer}>
            <ShieldCheck color={MB_COLORS.sage} size={40} />
          </View>
          <Text style={styles.title}>Nueva contraseña</Text>
          <Text style={styles.subtitle}>Elige una contraseña segura para tu cuenta</Text>
        </Animated.View>

        {done ? (
          <Animated.View entering={FadeIn.duration(500)} style={styles.successBox}>
            <CheckCircle color={MB_COLORS.sage} size={48} />
            <Text style={styles.successTitle}>¡Contraseña actualizada!</Text>
            <Text style={styles.successText}>
              Tu contraseña fue cambiada exitosamente. Inicia sesión con tus nuevas credenciales.
            </Text>
            <TouchableOpacity style={styles.loginButton} onPress={handleGoToLogin}>
              <Text style={styles.loginButtonText}>Ir al inicio de sesión</Text>
            </TouchableOpacity>
          </Animated.View>
        ) : (
          <Animated.View entering={FadeInDown.delay(200).duration(700)} style={styles.form}>
            <View style={styles.inputWrapper}>
              <Lock color={MB_COLORS.muted} size={20} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Nueva contraseña"
                placeholderTextColor={MB_COLORS.muted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoFocus
              />
              <TouchableOpacity onPress={() => setShowPassword(v => !v)} style={styles.eyeIcon}>
                {showPassword
                  ? <EyeOff color={MB_COLORS.muted} size={20} />
                  : <Eye color={MB_COLORS.muted} size={20} />}
              </TouchableOpacity>
            </View>

            <View style={styles.inputWrapper}>
              <Lock color={MB_COLORS.muted} size={20} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Confirmar contraseña"
                placeholderTextColor={MB_COLORS.muted}
                value={confirm}
                onChangeText={setConfirm}
                secureTextEntry={!showConfirm}
              />
              <TouchableOpacity onPress={() => setShowConfirm(v => !v)} style={styles.eyeIcon}>
                {showConfirm
                  ? <EyeOff color={MB_COLORS.muted} size={20} />
                  : <Eye color={MB_COLORS.muted} size={20} />}
              </TouchableOpacity>
            </View>

            {password.length > 0 && confirm.length > 0 && (
              <Animated.View entering={FadeIn} style={styles.matchRow}>
                <View style={[styles.matchDot, { backgroundColor: password === confirm ? MB_COLORS.sage : MB_COLORS.brandAccent }]} />
                <Text style={[styles.matchText, { color: password === confirm ? MB_COLORS.sage : MB_COLORS.brandAccent }]}>
                  {password === confirm ? 'Las contraseñas coinciden' : 'Las contraseñas no coinciden'}
                </Text>
              </Animated.View>
            )}

            <TouchableOpacity
              style={[styles.resetButton, loading && styles.disabledButton]}
              onPress={handleReset}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.resetButtonText}>Guardar contraseña</Text>
              )}
            </TouchableOpacity>
          </Animated.View>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  bgCircle1: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: MB_COLORS.brandAccent,
    opacity: 0.1,
  },
  bgCircle2: {
    position: 'absolute',
    bottom: -50,
    left: -50,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: MB_COLORS.sage,
    opacity: 0.1,
  },
  inner: {
    flex: 1,
    padding: MB_SPACING.xl,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: MB_SPACING.xxl,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: MB_COLORS.glassHeavy,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: MB_SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: MB_COLORS.cream,
    marginBottom: MB_SPACING.xs,
  },
  subtitle: {
    fontSize: 14,
    color: MB_COLORS.muted,
    textAlign: 'center',
  },
  form: {
    gap: MB_SPACING.md,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MB_COLORS.glass,
    borderRadius: MB_RADIUS.md,
    paddingHorizontal: MB_SPACING.md,
    height: 56,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  inputIcon: {
    marginRight: MB_SPACING.sm,
  },
  eyeIcon: {
    padding: MB_SPACING.xs,
  },
  input: {
    flex: 1,
    color: MB_COLORS.cream,
    fontSize: 16,
  },
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 4,
  },
  matchDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  matchText: {
    fontSize: 13,
  },
  resetButton: {
    backgroundColor: MB_COLORS.sage,
    height: 56,
    borderRadius: MB_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: MB_SPACING.xs,
    shadowColor: MB_COLORS.sage,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledButton: {
    opacity: 0.7,
  },
  resetButtonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '700',
  },
  successBox: {
    alignItems: 'center',
    gap: MB_SPACING.md,
    padding: MB_SPACING.xl,
    backgroundColor: MB_COLORS.glass,
    borderRadius: MB_RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: MB_COLORS.cream,
  },
  successText: {
    fontSize: 14,
    color: MB_COLORS.muted,
    textAlign: 'center',
    lineHeight: 22,
  },
  loginButton: {
    marginTop: MB_SPACING.xs,
    backgroundColor: MB_COLORS.brandAccent,
    paddingVertical: MB_SPACING.sm,
    paddingHorizontal: MB_SPACING.xl,
    borderRadius: MB_RADIUS.md,
  },
  loginButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 15,
  },
});
