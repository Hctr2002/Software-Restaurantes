import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@/components/Themed';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Smartphone, ConciergeBell, CookingPot, Wine, Receipt, BarChart3 } from 'lucide-react-native';
import SectionHeader from './SectionHeader';

const FLOW_STEPS = [
  {
    icon: Smartphone,
    role: 'Cliente',
    title: 'Escanea y pide',
    desc: 'Escanea el QR de tu mesa, explora el menú con fotos y realiza tu pedido sin esperas.',
  },
  {
    icon: ConciergeBell,
    role: 'Garzón',
    title: 'Valida el pedido',
    desc: 'Recibe la notificación, verifica disponibilidad y confirma. El ticket pasa a cocina.',
  },
  {
    icon: CookingPot,
    role: 'Cocina',
    title: 'Prepara en KDS',
    desc: 'El ticket aparece en la pantalla Kanban. El chef inicia preparación y marca como listo.',
  },
  {
    icon: Wine,
    role: 'Barra',
    title: 'Despacha bebidas',
    desc: 'Los ítems de barra se preparan en paralelo. El pedido no cierra hasta que ambos terminan.',
  },
  {
    icon: Receipt,
    role: 'Cajero',
    title: 'Cobra y cierra',
    desc: 'Consolida la cuenta, procesa el pago y emite comprobante digital.',
  },
  {
    icon: BarChart3,
    role: 'Admin',
    title: 'Analiza datos',
    desc: 'Ve reportes de ventas, tiempos de cocina y rendimiento del personal en tiempo real.',
  },
];

export default function OperationalFlowSection() {
  return (
    <Animated.View entering={FadeInDown.delay(700)} style={styles.section}>
      <SectionHeader label="Flujo Operativo" title="El recorrido completo de un pedido" />
      <View style={styles.timeline}>
        <View style={styles.line} />
        {FLOW_STEPS.map((step, i) => (
          <Animated.View key={step.title} entering={FadeInDown.delay(800 + i * 80)} style={styles.step}>
            <View style={styles.stepIcon}>
              <step.icon size={18} color="#10b981" />
            </View>
            <View style={styles.stepCard}>
              <Text style={styles.stepRole}>{step.role.toUpperCase()}</Text>
              <Text style={styles.stepTitle}>{step.title}</Text>
              <Text style={styles.stepDesc}>{step.desc}</Text>
            </View>
          </Animated.View>
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 48,
    paddingHorizontal: 24,
  },
  timeline: {
    position: 'relative',
  },
  line: {
    position: 'absolute',
    left: 19,
    top: 10,
    bottom: 10,
    width: 1,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    marginBottom: 14,
  },
  stepIcon: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  stepCard: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  stepRole: {
    color: 'rgba(16, 185, 129, 0.6)',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 4,
  },
  stepTitle: {
    color: 'white',
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 4,
  },
  stepDesc: {
    color: '#94a3b8',
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '500',
  },
});
