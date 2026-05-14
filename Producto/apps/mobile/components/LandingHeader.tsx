import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { QrCode, User, Utensils } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { MB_COLORS } from '../constants/MB_Theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function LandingHeader() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.safeArea, { paddingTop: insets.top }]}>
      <View style={styles.container}>
        <View style={styles.logoContainer}>
          <View style={styles.logoBadge}>
            <Utensils size={18} color="#020617" />
          </View>
          <Text style={styles.logoText}>
            Menu<Text style={styles.logoAccent}>Bites</Text>
          </Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity 
            activeOpacity={0.7}
            style={[styles.actionBtn, styles.qrBtn]}
            onPress={() => router.push('/scanner')}
          >
            <QrCode size={20} color="#10b981" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            activeOpacity={0.7}
            style={[styles.actionBtn, styles.authBtn]}
            onPress={() => router.push('/(auth)/login')}
          >
            <User size={20} color="#94a3b8" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#020617',
  },
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoBadge: {
    width: 32,
    height: 32,
    backgroundColor: '#10b981',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 20,
    fontWeight: '900',
    color: 'white',
    letterSpacing: -1,
  },
  logoAccent: {
    color: '#10b981',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  qrBtn: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  authBtn: {
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
});
