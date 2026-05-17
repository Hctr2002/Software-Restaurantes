import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@/components/Themed';

interface Props {
  label: string;
  title: string;
}

export default function SectionHeader({ label, title }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 24,
  },
  label: {
    color: 'rgba(16, 185, 129, 0.5)',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 4,
    marginBottom: 8,
    textAlign: 'center',
  },
  title: {
    color: 'white',
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
    textAlign: 'center',
    lineHeight: 32,
  },
});
