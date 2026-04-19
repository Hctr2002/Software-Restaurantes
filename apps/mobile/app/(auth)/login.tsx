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
  ImageBackground,
  Dimensions,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Mail, Lock, LogIn, ChefHat, Eye, EyeOff } from 'lucide-react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { MB_COLORS, MB_SPACING, MB_RADIUS } from '../../constants/MB_Theme';
import { supabase } from '../../lib/supabase';

const { height } = Dimensions.get('window');

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
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      Alert.alert('Error de acceso', 'Credenciales inválidas o problema de servidor');
      setLoading(false);
    } else {
      // AuthContext will handle navigation via _layout observer
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Background Decor */}
      <View style={styles.bgCircle1} />
      <View style={styles.bgCircle2} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.formContainer}
      >
        <Animated.View entering={FadeInDown.duration(800)} style={styles.header}>
          <View style={styles.logoContainer}>
            <ChefHat color={MB_COLORS.brandAccent} size={48} />
          </View>
          <Text style={styles.title}>Menu Bites</Text>
          <Text style={styles.subtitle}>Gourmet Experience Manager</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(800)} style={styles.inputSection}>
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
            />
          </View>

          <View style={styles.inputWrapper}>
            <Lock color={MB_COLORS.muted} size={20} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Contraseña"
              placeholderTextColor={MB_COLORS.muted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity 
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeIcon}
            >
              {showPassword ? (
                <EyeOff color={MB_COLORS.muted} size={20} />
              ) : (
                <Eye color={MB_COLORS.muted} size={20} />
              )}
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
        </Animated.View>

        <Animated.View entering={FadeIn.delay(600)} style={styles.footer}>
          <Text style={styles.versionText}>v1.1.0 Premium Access</Text>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MB_COLORS.navy,
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
  formContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: MB_SPACING.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: MB_SPACING.xxl,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: MB_COLORS.glassHeavy,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: MB_SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: MB_COLORS.cream,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 14,
    color: MB_COLORS.muted,
    marginTop: MB_SPACING.xs,
    fontStyle: 'italic',
  },
  inputSection: {
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
  loginButton: {
    flexDirection: 'row',
    backgroundColor: MB_COLORS.brandAccent,
    height: 56,
    borderRadius: MB_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: MB_SPACING.md,
    shadowColor: MB_COLORS.brandAccent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledButton: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  footer: {
    marginTop: MB_SPACING.xxl,
    alignItems: 'center',
  },
  versionText: {
    color: MB_COLORS.muted,
    fontSize: 12,
  },
});
