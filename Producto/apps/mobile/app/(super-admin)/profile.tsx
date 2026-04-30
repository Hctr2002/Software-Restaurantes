import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LogOut, User } from 'lucide-react-native';
import { MB_COLORS, MB_SPACING, MB_RADIUS } from '../../constants/MB_Theme';
import { useAuth } from '../../context/AuthContext';

export default function ProfileTab() {
  const { user, role, signOut } = useAuth();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Configuración</Text>
        <Text style={styles.subtitle}>Perfil del administrador</Text>
      </View>

      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <User color={MB_COLORS.cream} size={32} />
        </View>
        <Text style={styles.email}>{user?.email}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{role}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={signOut}>
        <LogOut color="white" size={20} />
        <Text style={styles.logoutText}>Cerrar Sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MB_COLORS.navy,
    padding: MB_SPACING.xl,
    paddingTop: 60,
  },
  header: {
    marginBottom: MB_SPACING.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: MB_COLORS.cream,
  },
  subtitle: {
    fontSize: 14,
    color: MB_COLORS.muted,
    marginTop: 4,
  },
  profileCard: {
    backgroundColor: MB_COLORS.glassHeavy,
    padding: MB_SPACING.xl,
    borderRadius: MB_RADIUS.lg,
    alignItems: 'center',
    marginBottom: MB_SPACING.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: MB_COLORS.glass,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: MB_SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  email: {
    fontSize: 18,
    fontWeight: 'bold',
    color: MB_COLORS.cream,
    marginBottom: MB_SPACING.sm,
  },
  roleBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  roleText: {
    color: '#4ade80',
    fontSize: 12,
    fontWeight: 'bold',
  },
  logoutBtn: {
    flexDirection: 'row',
    backgroundColor: '#ef4444',
    padding: MB_SPACING.md,
    borderRadius: MB_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    gap: MB_SPACING.sm,
  },
  logoutText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
