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
import { Mail, ArrowLeft, Send, ChefHat, CheckCircle } from 'lucide-react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { MB_COLORS, MB_SPACING, MB_RADIUS } from '../../constants/MB_Theme';
import { supabase } from '../../lib/supabase';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Ingresa tu email');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: 'menubites://reset-password',
    });
    setLoading(false);

    if (error) {
      Alert.alert('Error', 'No se pudo enviar el correo. Verifica el email ingresado.');
    } else {
      setSent(true);
    }
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
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft color={MB_COLORS.muted} size={22} />
          <Text style={styles.backText}>Volver</Text>
        </TouchableOpacity>

        <Animated.View entering={FadeInDown.duration(700)} style={styles.header}>
          <View style={styles.logoContainer}>
            <ChefHat color={MB_COLORS.brandAccent} size={40} />
          </View>
          <Text style={styles.title}>Recuperar contraseña</Text>
          <Text style={styles.subtitle}>
            Te enviaremos un enlace para restablecer tu contraseña
          </Text>
        </Animated.View>

        {sent ? (
          <Animated.View entering={FadeIn.duration(500)} style={styles.successBox}>
            <CheckCircle color={MB_COLORS.sage} size={48} />
            <Text style={styles.successTitle}>¡Correo enviado!</Text>
            <Text style={styles.successText}>
              Revisa tu bandeja de entrada y sigue el enlace para crear una nueva contraseña.
            </Text>
            <TouchableOpacity style={styles.backToLogin} onPress={() => router.replace('/(auth)/login')}>
              <Text style={styles.backToLoginText}>Volver al inicio de sesión</Text>
            </TouchableOpacity>
          </Animated.View>
        ) : (
          <Animated.View entering={FadeInDown.delay(200).duration(700)} style={styles.form}>
            <View style={styles.inputWrapper}>
              <Mail color={MB_COLORS.muted} size={20} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor={MB_COLORS.muted}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoFocus
              />
            </View>

            <TouchableOpacity
              style={[styles.sendButton, loading && styles.disabledButton]}
              onPress={handleSend}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Text style={styles.sendButtonText}>Enviar enlace</Text>
                  <Send color="white" size={18} style={{ marginLeft: 8 }} />
                </>
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
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    top: MB_SPACING.xxl,
    left: MB_SPACING.xl,
    gap: MB_SPACING.xs,
  },
  backText: {
    color: MB_COLORS.muted,
    fontSize: 15,
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
    lineHeight: 20,
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
  input: {
    flex: 1,
    color: MB_COLORS.cream,
    fontSize: 16,
  },
  sendButton: {
    flexDirection: 'row',
    backgroundColor: MB_COLORS.brandAccent,
    height: 56,
    borderRadius: MB_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: MB_SPACING.xs,
    shadowColor: MB_COLORS.brandAccent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledButton: {
    opacity: 0.7,
  },
  sendButtonText: {
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
  backToLogin: {
    marginTop: MB_SPACING.xs,
    paddingVertical: MB_SPACING.sm,
    paddingHorizontal: MB_SPACING.lg,
    borderRadius: MB_RADIUS.md,
    borderWidth: 1,
    borderColor: MB_COLORS.brandAccent,
  },
  backToLoginText: {
    color: MB_COLORS.brandAccent,
    fontWeight: '600',
    fontSize: 15,
  },
});
