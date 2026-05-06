import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { MB_COLORS, MB_RADIUS, MB_SPACING } from '../constants/MB_Theme';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface AdminKpiCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
  delay?: number;
}

export default function AdminKpiCard({ icon, label, value, detail, delay = 0 }: AdminKpiCardProps) {
  return (
    <Animated.View 
      entering={FadeInDown.delay(delay)}
      style={styles.card}
    >
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          {icon}
        </View>
        <Text style={styles.label}>{label}</Text>
      </View>
      
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.detail}>{detail}</Text>
      
      <View style={styles.glow} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: MB_COLORS.glass,
    borderRadius: MB_RADIUS.xl,
    padding: MB_SPACING.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
    marginBottom: MB_SPACING.md,
    overflow: 'hidden',
    position: 'relative',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: MB_SPACING.sm,
  },
  iconContainer: {
    padding: 8,
    backgroundColor: 'rgba(254, 95, 85, 0.1)',
    borderRadius: 12,
    marginRight: 10,
  },
  label: {
    color: MB_COLORS.muted,
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  value: {
    color: 'white',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  detail: {
    color: MB_COLORS.muted,
    fontSize: 10,
    fontWeight: '700',
    marginTop: 4,
    textTransform: 'uppercase',
  },
  glow: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: MB_COLORS.brandAccent,
    opacity: 0.05,
  }
});
