import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { MB_RADIUS, MB_SPACING } from '../../constants/MB_Theme';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { LogOut, User, Building2, Bell, Shield } from 'lucide-react-native';

import { useRouter } from 'expo-router';

export default function AdminSettingsScreen() {
  const { user, signOut } = useAuth();
  const { colors, isLight } = useTheme();
  const router = useRouter();

  const SettingItem = ({ icon, label, sublabel, onPress }: { icon: React.ReactNode, label: string, sublabel?: string, onPress?: () => void }) => (
    <TouchableOpacity
      style={[styles.settingItem, { backgroundColor: colors.glass, borderColor: colors.glassHeavy }]}
      onPress={onPress}
    >
      <View style={[styles.iconContainer, { backgroundColor: colors.glassHeavy }]}>{icon}</View>
      <View style={styles.settingText}>
        <Text style={[styles.settingLabel, { color: colors.text }]}>{label}</Text>
        {sublabel && <Text style={[styles.settingSublabel, { color: colors.muted }]}>{sublabel}</Text>}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.navy }]}>
      <StatusBar barStyle={isLight ? 'dark-content' : 'light-content'} />
      <View style={[styles.header, { borderBottomColor: colors.glassHeavy }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Configuración</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.profileCard, { backgroundColor: colors.glass, borderColor: colors.glassHeavy }]}>
          <View style={[styles.avatar, { backgroundColor: colors.brandAccent }]}>
            <Text style={styles.avatarText}>{user?.email?.[0].toUpperCase()}</Text>
          </View>
          <Text style={[styles.userEmail, { color: colors.text }]}>{user?.email}</Text>
          <Text style={[styles.userRole, { color: colors.muted }]}>Administrador Local</Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.muted }]}>Local</Text>
          <SettingItem
            icon={<Building2 size={20} color={colors.text} />}
            label="Información del Local"
            sublabel="Nombre, dirección y contacto"
            onPress={() => router.push('/(admin)/restaurant-info')}
          />
          <SettingItem
            icon={<Bell size={20} color={colors.text} />}
            label="Notificaciones"
            sublabel="Alertas de pedidos y sistema"
            onPress={() => router.push('/(admin)/notifications')}
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.muted }]}>Cuenta</Text>
          <SettingItem
            icon={<User size={20} color={colors.text} />}
            label="Perfil de Usuario"
            onPress={() => router.push('/(admin)/profile')}
          />
          <SettingItem
            icon={<Shield size={20} color={colors.text} />}
            label="Seguridad"
            sublabel="Cambiar contraseña"
            onPress={() => router.push('/(admin)/security')}
          />
        </View>

        <TouchableOpacity
          style={[styles.signOutButton, { borderColor: colors.brandAccent + '40', backgroundColor: colors.brandAccent + '10' }]}
          onPress={signOut}
        >
          <LogOut size={20} color={colors.brandAccent} />
          <Text style={[styles.signOutText, { color: colors.brandAccent }]}>Cerrar Sesión</Text>
        </TouchableOpacity>

        <Text style={[styles.versionText, { color: colors.muted }]}>Versión 1.0.0 (Alpha)</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: MB_SPACING.lg,
    paddingTop: 60,
    paddingBottom: MB_SPACING.lg,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  scrollContent: {
    padding: MB_SPACING.lg,
    paddingBottom: 120,
  },
  profileCard: {
    alignItems: 'center',
    marginBottom: 32,
    padding: 24,
    borderRadius: MB_RADIUS.xl,
    borderWidth: 1,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    color: 'white',
    fontWeight: '900',
  },
  userEmail: {
    fontSize: 18,
    fontWeight: '800',
  },
  userRole: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 12,
    marginLeft: 8,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: MB_RADIUS.lg,
    marginBottom: 8,
    borderWidth: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  settingText: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  settingSublabel: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    marginTop: 16,
    borderRadius: MB_RADIUS.lg,
    borderWidth: 1,
  },
  signOutText: {
    fontSize: 15,
    fontWeight: '800',
    marginLeft: 10,
  },
  versionText: {
    fontSize: 10,
    textAlign: 'center',
    marginTop: 32,
    fontWeight: '700',
    letterSpacing: 1,
  }
});
