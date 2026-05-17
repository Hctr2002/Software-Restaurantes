import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Text } from '@/components/Themed';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Clock, FileX2, BarChart3, DollarSign } from 'lucide-react-native';
import SectionHeader from './SectionHeader';

const { width } = Dimensions.get('window');
const CARD_GAP = 12;
const HALF_CARD_WIDTH = (width - 24 * 2 - CARD_GAP) / 2;

const PROBLEMS = [
  {
    icon: Clock,
    title: 'Tiempos de espera excesivos',
    desc: 'Los pedidos en papel generan colas, errores y clientes insatisfechos.',
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.1)',
  },
  {
    icon: FileX2,
    title: 'Comandas perdidas',
    desc: 'Sin trazabilidad digital, hasta el 25% de pedidos tiene errores de transcripción.',
    color: '#ef4444',
    bg: 'rgba(239, 68, 68, 0.1)',
  },
  {
    icon: BarChart3,
    title: 'Cero visibilidad',
    desc: 'El dueño no tiene datos en tiempo real de ventas, cocina ni personal.',
    color: '#f97316',
    bg: 'rgba(249, 115, 22, 0.1)',
  },
  {
    icon: DollarSign,
    title: 'Ineficiencia operativa',
    desc: 'Personal sobrecargado por procesos manuales que podrían automatizarse.',
    color: '#f43f5e',
    bg: 'rgba(244, 63, 94, 0.1)',
  },
];

export default function ProblemSection() {
  return (
    <Animated.View entering={FadeInDown.delay(500)} style={styles.section}>
      <SectionHeader label="El Problema" title="¿Por qué necesitan Menu Bites?" />
      <View style={styles.grid}>
        {PROBLEMS.map((p, i) => (
          <Animated.View key={p.title} entering={FadeInDown.delay(600 + i * 80)} style={styles.card}>
            <View style={[styles.iconBox, { backgroundColor: p.bg }]}>
              <p.icon size={22} color={p.color} />
            </View>
            <Text style={styles.cardTitle}>{p.title}</Text>
            <Text style={styles.cardDesc}>{p.desc}</Text>
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
