import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { MB_COLORS, MB_RADIUS, MB_SPACING } from '../../constants/MB_Theme';
import { useAuth } from '../../context/AuthContext';
import { LogOut, User, Building2, Bell, Shield } from 'lucide-react-native';

import { useRouter } from 'expo-router';

export default function AdminSettingsScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const SettingItem = ({ icon, label, sublabel, onPress }: { icon: React.ReactNode, label: string, sublabel?: string, onPress?: () => void }) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
      <View style={styles.iconContainer}>{icon}</View>
      <View style={styles.settingText}>
        <Text style={styles.settingLabel}>{label}</Text>
        {sublabel && <Text style={styles.settingSublabel}>{sublabel}</Text>}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Configuración</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.email?.[0].toUpperCase()}</Text>
          </View>
          <Text style={styles.userEmail}>{user?.email}</Text>
          <Text style={styles.userRole}>Administrador Local</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Local</Text>
          <SettingItem 
            icon={<Building2 size={20} color="white" />} 
            label="Información del Local" 
            sublabel="Nombre, dirección y contacto" 
            onPress={() => router.push('/(admin)/restaurant-info')}
          />
          <SettingItem 
            icon={<Bell size={20} color="white" />} 
            label="Notificaciones" 
            sublabel="Alertas de pedidos y sistema" 
            onPress={() => router.push('/(admin)/notifications')} 
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cuenta</Text>
          <SettingItem 
            icon={<User size={20} color="white" />} 
            label="Perfil de Usuario" 
            onPress={() => router.push('/(admin)/profile')}
          />
          <SettingItem 
            icon={<Shield size={20} color="white" />} 
            label="Seguridad" 
            sublabel="Cambiar contraseña" 
            onPress={() => router.push('/(admin)/security')}
          />
        </View>

        <TouchableOpacity style={styles.signOutButton} onPress={signOut}>
          <LogOut size={20} color={MB_COLORS.brandAccent} />
          <Text style={styles.signOutText}>Cerrar Sesión</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>Versión 1.0.0 (Alpha)</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MB_COLORS.navy,
  },
  header: {
    paddingHorizontal: MB_SPACING.lg,
    paddingTop: 60,
    paddingBottom: MB_SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  headerTitle: {
    fontSize: 24,
    color: 'white',
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
    backgroundColor: MB_COLORS.glass,
    borderRadius: MB_RADIUS.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: MB_COLORS.brandAccent,
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
    color: 'white',
    fontSize: 18,
    fontWeight: '800',
  },
  userRole: {
    color: MB_COLORS.muted,
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
    color: MB_COLORS.muted,
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
    backgroundColor: MB_COLORS.glass,
    padding: 16,
    borderRadius: MB_RADIUS.lg,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.02)',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: MB_COLORS.glassHeavy,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  settingText: {
    flex: 1,
  },
  settingLabel: {
    color: 'white',
    fontSize: 15,
    fontWeight: '700',
  },
  settingSublabel: {
    color: MB_COLORS.muted,
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
    borderColor: 'rgba(254, 95, 85, 0.2)',
    backgroundColor: 'rgba(254, 95, 85, 0.05)',
  },
  signOutText: {
    color: MB_COLORS.brandAccent,
    fontSize: 15,
    fontWeight: '800',
    marginLeft: 10,
  },
  versionText: {
    color: 'rgba(255,255,255,0.15)',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 32,
    fontWeight: '700',
    letterSpacing: 1,
  }
});
