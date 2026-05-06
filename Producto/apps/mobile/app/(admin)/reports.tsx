import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MB_COLORS } from '../../constants/MB_Theme';

export default function AdminReportsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Reportes y Estadísticas</Text>
      <Text style={styles.subtext}>Próximamente: Gráficos de ventas y rendimiento</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: MB_COLORS.navy, justifyContent: 'center', alignItems: 'center' },
  text: { color: 'white', fontSize: 20, fontWeight: '900' },
  subtext: { color: MB_COLORS.muted, fontSize: 14, marginTop: 8 },
});
