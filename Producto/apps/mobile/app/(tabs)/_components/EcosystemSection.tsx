import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text } from '@/components/Themed';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import {
  Shield, LayoutDashboard, CookingPot, ConciergeBell,
  Receipt, Smartphone, Wine,
} from 'lucide-react-native';
import SectionHeader from './SectionHeader';

const APPS = [
  {
    icon: Shield,
    name: 'Admin Dashboard',
    role: 'SUPER_ADMIN',
    features: ['KPIs globales de la red', 'Gestión de restaurantes y planes SaaS', 'Asignación de roles y usuarios'],
    accent: '#8b5cf6',
    bg: 'rgba(139, 92, 246, 0.1)',
  },
  {
    icon: LayoutDashboard,
    name: 'Panel Local',
    role: 'ADMIN',
    features: ['Menú, inventario y mesas + QR', 'Reportes exportables a Excel', 'Branding Lab con 12 templates'],
    accent: '#3b82f6',
    bg: 'rgba(59, 130, 246, 0.1)',
  },
  {
    icon: CookingPot,
    name: 'Kitchen KDS',
    role: 'COCINA',
    features: ['Kanban en tiempo real', 'Temporizadores con código de color', 'Modo offline con Service Worker'],
    accent: '#f97316',
    bg: 'rgba(249, 115, 22, 0.1)',
  },
  {
    icon: ConciergeBell,
    name: 'Waiter Terminal',
    role: 'GARZÓN',
    features: ['Mapa de mesas en vivo', 'Toma de pedidos + validación', 'Fusión de mesas y Web Push'],
    accent: '#10b981',
    bg: 'rgba(16, 185, 129, 0.1)',
  },
  {
    icon: Receipt,
    name: 'Cashier Dashboard',
    role: 'CAJERO',
    features: ['Cuentas agrupadas por mesa', 'Cobro con propina y comprobante', 'Cierre de turno con reporte'],
    accent: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.1)',
  },
  {
    icon: Smartphone,
    name: 'Customer Portal',
    role: 'CLIENTE',
    features: ['Menú digital vía QR sin app', 'Tracker de pedido en tiempo real', 'Rating y solicitar cuenta'],
    accent: '#06b6d4',
    bg: 'rgba(6, 182, 212, 0.1)',
  },
  {
    icon: Wine,
    name: 'Bar Dashboard',
    role: 'BAR',
    features: ['KDS dedicado para bebidas', 'Alerta de stock y auto-despacho', 'Pedidos mixtos cocina + barra'],
    accent: '#ec4899',
    bg: 'rgba(236, 72, 153, 0.1)',
  },
];

export default function EcosystemSection() {
  return (
    <Animated.View entering={FadeInDown.delay(600)} style={styles.section}>
      <SectionHeader label="Ecosistema Completo" title="7 pantallas, un solo sistema" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {APPS.map((app, i) => (
          <Animated.View key={app.name} entering={FadeInRight.delay(i * 80)} style={styles.card}>
            <Text style={[styles.role, { color: app.accent }]}>{app.role}</Text>
            <View style={[styles.iconBox, { backgroundColor: app.bg }]}>
              <app.icon size={22} color={app.accent} />
            </View>
            <Text style={styles.name}>{app.name}</Text>
            {app.features.map((f) => (
              <View key={f} style={styles.featureRow}>
                <View style={[styles.featureDot, { backgroundColor: app.bg }]} />
                <Text style={styles.featureText}>{f}</Text>
              </View>
            ))}
          </Animated.View>
        ))}
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 48,
  },
  scroll: {
    paddingHorizontal: 24,
    gap: 12,
  },
  card: {
    width: 210,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  role: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 10,
    opacity: 0.7,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  name: {
    color: 'white',
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 6,
  },
  featureDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginTop: 5,
    flexShrink: 0,
  },
  featureText: {
    color: '#94a3b8',
    fontSize: 11,
    lineHeight: 16,
    flex: 1,
    fontWeight: '500',
  },
});
