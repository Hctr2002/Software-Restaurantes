import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Text } from '@/components/Themed';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Zap, TrendingUp, Palette, Bell } from 'lucide-react-native';
import SectionHeader from './SectionHeader';

const { width } = Dimensions.get('window');
const CARD_GAP = 12;
const HALF_CARD_WIDTH = (width - 24 * 2 - CARD_GAP) / 2;

const BENEFITS = [
  {
    icon: Zap,
    title: 'Pedidos directos a cocina',
    desc: 'Del QR al KDS en segundos, sin papel ni errores de transcripción.',
  },
  {
    icon: TrendingUp,
    title: 'Reportes en tiempo real',
    desc: 'Ventas, top productos y ocupación de mesas — exportables a Excel.',
  },
  {
    icon: Palette,
    title: 'Marca 100% personalizable',
    desc: '9 diseños de branding que se propagan al portal al instante.',
  },
  {
    icon: Bell,
    title: 'Alertas inteligentes',
    desc: 'Stock crítico, pedidos sin validar y Web Push nativo al garzón.',
  },
];

export default function BenefitsSection() {
  return (
    <Animated.View entering={FadeInDown.delay(800)} style={styles.section}>
      <SectionHeader label="Beneficios" title="Lo que gana tu negocio" />
      <View style={styles.grid}>
        {BENEFITS.map((b, i) => (
          <Animated.View key={b.title} entering={FadeInDown.delay(900 + i * 80)} style={styles.card}>
            <View style={styles.iconBox}>
              <b.icon size={22} color="#10b981" />
            </View>
            <Text style={styles.cardTitle}>{b.title}</Text>
            <Text style={styles.cardDesc}>{b.desc}</Text>
          </Animated.View>
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 48,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CARD_GAP,
    paddingHorizontal: 24,
  },
  card: {
    width: HALF_CARD_WIDTH,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    color: 'white',
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  cardDesc: {
    color: '#94a3b8',
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '500',
  },
});
