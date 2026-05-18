import React from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, View, StatusBar } from 'react-native';
import { Text } from '@/components/Themed';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { Star, QrCode, ArrowRight, Utensils } from 'lucide-react-native';

import LandingHeader from '../../components/LandingHeader';
import ProblemSection from './_components/ProblemSection';
import EcosystemSection from './_components/EcosystemSection';
import OperationalFlowSection from './_components/OperationalFlowSection';
import BenefitsSection from './_components/BenefitsSection';
import TeamSection from './_components/TeamSection';
import RestaurantsCarousel from './_components/RestaurantsCarousel';

export default function MenuHomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LandingHeader />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
      >
        {/* Background blob */}
        <View style={styles.bgDecor} pointerEvents="none">
          <View style={styles.bgBlob} />
        </View>

        {/* ═══════════ Hero ═══════════ */}
        <Animated.View entering={FadeInDown.delay(200)} style={styles.hero}>
          <View style={styles.badge}>
            <Star size={12} color="#10b981" fill="#10b981" />
            <Text style={styles.badgeText}>NUEVA EXPERIENCIA GASTRONÓMICA</Text>
          </View>
          <Text style={styles.heroTitle}>
            Pide sin <Text style={styles.accent}>esperas</Text>,{'\n'}disfruta sin límites.
          </Text>
          <Text style={styles.heroSubtitle}>
            Plataforma SaaS que digitaliza la operación completa del restaurante — desde el menú QR hasta los reportes de negocio.
          </Text>
        </Animated.View>

        {/* ═══════════ Scan CTA ═══════════ */}
        <Animated.View entering={FadeInDown.delay(400)} style={styles.ctaContainer}>
          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.ctaWrapper}
            onPress={() => router.push('/scanner')}
          >
            <BlurView intensity={10} tint="dark" style={styles.ctaCard}>
              <View style={styles.ctaIcon}>
                <QrCode size={32} color="#10b981" />
              </View>
              <View style={styles.ctaInfo}>
                <Text style={styles.ctaTitle}>¿Estás en un restaurante?</Text>
                <Text style={styles.ctaSub}>Toca aquí para escanear el código QR</Text>
              </View>
              <ArrowRight size={18} color="rgba(16,185,129,0.6)" />
            </BlurView>
          </TouchableOpacity>
        </Animated.View>

        {/* ═══════════ Sections ═══════════ */}
        <ProblemSection />
        <EcosystemSection />
        <OperationalFlowSection />
        <BenefitsSection />
        <RestaurantsCarousel />
        <TeamSection />

        {/* ═══════════ Footer ═══════════ */}
        <View style={styles.footer}>
          <View style={styles.footerLogo}>
            <View style={styles.footerBadge}>
              <Utensils size={14} color="#020617" />
            </View>
            <Text style={styles.footerLogoText}>
              Menu<Text style={styles.accent}>Bites</Text>
            </Text>
          </View>
          <Text style={styles.footerCopy}>© 2026 Gastro Analytics 360 · Duoc UC · All Rights Reserved</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  bgDecor: {
    position: 'absolute',
    top: -100,
    left: -100,
    width: 400,
    height: 400,
  },
  bgBlob: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    borderRadius: 200,
  },

  // Hero
  hero: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 32,
    alignItems: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    marginBottom: 24,
  },
  badgeText: {
    color: '#10b981',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  heroTitle: {
    fontSize: 36,
    fontWeight: '900',
    color: 'white',
    textAlign: 'center',
    lineHeight: 42,
    letterSpacing: -1,
  },
  accent: {
    color: '#10b981',
  },
  heroSubtitle: {
    fontSize: 15,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 24,
    paddingHorizontal: 16,
    fontWeight: '500',
  },

  // Scan CTA
  ctaContainer: {
    paddingHorizontal: 24,
    marginBottom: 48,
  },
  ctaWrapper: {
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  ctaCard: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  ctaIcon: {
    width: 60,
    height: 60,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ctaInfo: {
    flex: 1,
  },
  ctaTitle: {
    color: 'white',
    fontSize: 17,
    fontWeight: '900',
    marginBottom: 4,
  },
  ctaSub: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
  },

  // Footer
  footer: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 32,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    gap: 12,
  },
  footerLogo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  footerBadge: {
    width: 24,
    height: 24,
    backgroundColor: '#10b981',
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerLogoText: {
    fontSize: 16,
    fontWeight: '900',
    color: 'white',
    letterSpacing: -0.5,
  },
  footerCopy: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.25)',
    letterSpacing: 0.5,
    textAlign: 'center',
    lineHeight: 16,
  },
});
