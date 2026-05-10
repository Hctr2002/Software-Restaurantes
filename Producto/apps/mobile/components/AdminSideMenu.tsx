import React from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  Modal, 
  ScrollView,
  Dimensions,
  Pressable
} from 'react-native';
import { MB_SPACING, MB_RADIUS } from '../constants/MB_Theme';
import { 
  X, 
  LayoutDashboard, 
  Users, 
  UtensilsCrossed, 
  Tag, 
  TableProperties, 
  ClipboardList, 
  Package, 
  Palette, 
  BarChart2, 
  LogOut,
  Store,
  Settings,
  ChefHat,
  Wallet
} from 'lucide-react-native';
import Animated, { 
  FadeIn, 
  FadeOut, 
  SlideInLeft, 
  SlideOutLeft 
} from 'react-native-reanimated';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useRouter, usePathname } from 'expo-router';

const { width } = Dimensions.get('window');

interface AdminSideMenuProps {
  visible: boolean;
  onClose: () => void;
}

export default function AdminSideMenu({ visible, onClose }: AdminSideMenuProps) {
  const { user, signOut, role } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const pathname = usePathname();

  const navigateTo = (path: string) => {
    router.push(path as any);
    onClose();
  };

  const NavItem = ({ icon: Icon, label, path }: { icon: any, label: string, path: string }) => {
    const isActive = pathname === path;
    return (
      <TouchableOpacity 
        style={[styles.navItem, isActive && { backgroundColor: colors.brandAccent }]} 
        onPress={() => navigateTo(path)}
      >
        <View style={styles.iconBox}>
          <Icon 
            color={isActive ? 'white' : colors.muted}
            size={20} 
          />
        </View>
        <Text style={[styles.navLabel, isActive && { color: 'white' }, !isActive && { color: colors.muted }]}>{label}</Text>
      </TouchableOpacity>
    );
  };

  const SectionTitle = ({ title }: { title: string }) => (
    <Text style={[styles.sectionTitle, { color: colors.muted }]}>{title}</Text>
  );

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose}>
          <Animated.View entering={FadeIn} exiting={FadeOut} style={StyleSheet.absoluteFill}>
            <View style={styles.backdropBlur} />
          </Animated.View>
        </Pressable>

        <Animated.View 
          entering={SlideInLeft.duration(300)} 
          exiting={SlideOutLeft.duration(250)}
          style={[styles.menuContainer, { backgroundColor: colors.navy }]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.brandBox}>
              <View style={[styles.logoIcon, { backgroundColor: colors.brandAccent }]}>
                <Store size={20} color="white" />
              </View>
              <View>
                <Text style={[styles.brandTitle, { color: colors.text }]}>MENU <Text style={{ color: colors.brandAccent }}>BITES</Text></Text>
                <Text style={[styles.brandSub, { color: colors.muted }]}>LOCAL HUB</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X color={colors.text} size={24} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            <SectionTitle title="Principal" />
            <NavItem icon={LayoutDashboard} label="Resumen" path="/(admin)" />

            <SectionTitle title="Gestión" />
            <NavItem icon={Users} label="Usuarios" path="/(admin)/users" />
            <NavItem icon={UtensilsCrossed} label="Menú" path="/(admin)/menu" />
            <NavItem icon={ChefHat} label="Cocina" path="/(kitchen)" />
            <NavItem icon={Wallet} label="Caja" path="/(cashier)" />
            <NavItem icon={Tag} label="Categorías" path="/(admin)/categories" />
            <NavItem icon={TableProperties} label="Mesas" path="/(admin)/tables" />
            <NavItem icon={ClipboardList} label="Pedidos" path="/(admin)/orders" />
            <NavItem icon={Package} label="Inventario" path="/(admin)/inventory" />
            <NavItem icon={Palette} label="Branding" path="/(admin)/branding" />

            <SectionTitle title="Análisis" />
            <NavItem icon={BarChart2} label="Reportes" path="/(admin)/reports" />
          </ScrollView>

          {/* Footer User Profile */}
          <View style={styles.footer}>
            <View style={styles.userInfo}>
              <View style={styles.avatar}>
                <Text style={[styles.avatarText, { color: colors.brandAccent }]}>{user?.email?.[0].toUpperCase()}</Text>
              </View>
              <View style={styles.userDetails}>
                <Text style={[styles.userEmail, { color: colors.text }]} numberOfLines={1}>{user?.email}</Text>
                <Text style={[styles.userRole, { color: colors.brandAccent }]}>{role}</Text>
              </View>
            </View>
            <TouchableOpacity 
              style={[styles.signOutButton, { borderColor: colors.brandAccent + '30', backgroundColor: colors.glass }]} 
              onPress={signOut}
            >
              <LogOut size={18} color={colors.brandAccent} />
              <Text style={[styles.signOutText, { color: colors.text }]}>Cerrar Sesión</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  backdropBlur: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  menuContainer: {
    width: width * 0.8,
    height: '100%',
    backgroundColor: '#0A1128', // Mantener base oscura o usar colors.navy
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.05)',
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  brandBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#FE5F55', // Fallback
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.5,
    fontStyle: 'italic',
  },
  brandSub: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 2,
    marginTop: -2,
  },
  closeButton: {
    padding: 8,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginTop: 24,
    marginBottom: 12,
    marginLeft: 8,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    marginBottom: 4,
  },
  navItemActive: {
    // Handled dynamically
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconBoxActive: {
    // Icon color handled in component
  },
  navLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  navLabelActive: {
    color: 'white',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '900',
  },
  userDetails: {
    flex: 1,
  },
  userEmail: {
    fontSize: 13,
    fontWeight: '700',
  },
  userRole: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: MB_RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(254, 95, 85, 0.2)',
  },
  signOutText: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  }
});
