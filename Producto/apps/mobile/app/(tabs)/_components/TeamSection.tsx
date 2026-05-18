import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@/components/Themed';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { GraduationCap } from 'lucide-react-native';

const TEAM = [
  { name: 'José Luis Medina Mercado', role: 'Product Owner, Product Manager' },
  { name: 'Héctor Robledo', role: 'Desarrollador Fullstack, QA Engineer' },
  { name: 'Alejandro Placencia Menares', role: 'Desarrollador Fullstack, Diseñador UX/UI' },
];

export default function TeamSection() {
  return (
    <Animated.View entering={FadeInDown.delay(900)} style={styles.wrapper}>
      <View style={styles.card}>
        <View style={styles.iconBox}>
          <GraduationCap size={28} color="#10b981" />
        </View>
        <Text style={styles.label}>PROYECTO DE TITULACIÓN</Text>
        <Text style={styles.institution}>Duoc UC · 2026</Text>
        <View style={styles.list}>
          {TEAM.map((member) => (
            <View key={member.name} style={styles.memberRow}>
              <Text style={styles.memberName}>{member.name}</Text>
              <Text style={styles.memberRole}>{member.role}</Text>
            </View>
          ))}
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  card: {
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderRadius: 32,
    padding: 32,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 56,
    height: 56,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  label: {
    color: 'rgba(16, 185, 129, 0.5)',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 3,
    textAlign: 'center',
  },
  institution: {
    color: 'white',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
    textAlign: 'center',
    marginBottom: 8,
  },
  list: {
    width: '100%',
    gap: 8,
  },
  memberRow: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 3,
  },
  memberName: {
    color: 'white',
    fontSize: 13,
    fontWeight: '700',
  },
  memberRole: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
