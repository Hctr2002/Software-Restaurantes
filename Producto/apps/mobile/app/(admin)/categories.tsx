import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MB_COLORS } from '../../constants/MB_Theme';

export default function CategoriesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Categorías</Text>
      <Text style={styles.sub}>Próximamente...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: MB_COLORS.navy, justifyContent: 'center', alignItems: 'center' },
  text: { color: 'white', fontSize: 18, fontWeight: '900' },
  sub: { color: MB_COLORS.muted, fontSize: 14, marginTop: 8 }
});
