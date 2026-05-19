import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { MB_RADIUS, MB_SPACING } from '../constants/MB_Theme';
import { useTheme } from '../context/ThemeContext';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface AdminKpiCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
  delay?: number;
}

export default function AdminKpiCard({ icon, label, value, detail, delay = 0 }: AdminKpiCardProps) {
  const { colors } = useTheme();

  return (
    <Animated.View 
      entering={FadeInDown.delay(delay)}
      style={[styles.card, { backgroundColor: colors.glass, borderColor: colors.glassHeavy }]}
    >
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: colors.brandAccent + '1A' }]}>
          {icon}
        </View>
        <Text style={[styles.label, { color: colors.muted }]}>{label}</Text>
      </View>
      
      <Text style={[styles.value, { color: colors.text }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>{value}</Text>
      <Text style={[styles.detail, { color: colors.muted }]}>{detail}</Text>
      
      <View style={[styles.glow, { backgroundColor: colors.brandAccent }]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
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
    borderRadius: 12,
    marginRight: 10,
  },
  label: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  value: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  detail: {
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
    opacity: 0.05,
  }
});
