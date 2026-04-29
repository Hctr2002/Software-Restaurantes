import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MB_COLORS } from '../../constants/MB_Theme';

export default function AdminLayout() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Admin (Tenant) View</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: MB_COLORS.navy, justifyContent: 'center', alignItems: 'center' },
  text: { color: MB_COLORS.cream, fontSize: 20 },
});
