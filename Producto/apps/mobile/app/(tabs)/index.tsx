import React, { useRef, useEffect, useState } from 'react';
import { 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Dimensions,
  StatusBar,
  ActivityIndicator,
  View
} from 'react-native';
import { Text } from '@/components/Themed';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import LandingHeader from '../../components/LandingHeader';
import { supabase } from '../../lib/supabase';
import { QrCode, Utensils, Zap, Star, Store, MapPin } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');

export default function MenuHomeScreen() {
  const autoScrollOffset = useRef(0);
  const flatListRef = useRef<any>(null);
  const isInteracting = useRef(false);
  const scrollInterval = useRef<any>(null);
  
  const insets = useSafeAreaInsets();
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRestaurants() {
      const { data, error } = await supabase
        .from('restaurants')
        .select('id, name, slug')
        .eq('status', 'ACTIVE')
        .order('name');
      
      if (!error && data) setRestaurants(data);
      setLoading(false);
    }
    loadRestaurants();
  }, []);

  useEffect(() => {
    if (loading || restaurants.length === 0) return;

    const startCarousel = () => {
      if (scrollInterval.current) clearInterval(scrollInterval.current);
      scrollInterval.current = setInterval(() => {
        if (flatListRef.current && !isInteracting.current) {
          autoScrollOffset.current += 0.5;
          
          // Reset logic based on card width (260) + gap (12)
          const totalWidth = restaurants.length * 272;
          if (autoScrollOffset.current > totalWidth) {
            autoScrollOffset.current = 0;
          }
          
          flatListRef.current.scrollToOffset({ 
            offset: autoScrollOffset.current, 
            animated: false 
          });
        }
      }, 30);
    };

    startCarousel();

    return () => {
      if (scrollInterval.current) clearInterval(scrollInterval.current);
    };
  }, [loading, restaurants]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LandingHeader />
      
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
      >
        
        {/* Background Decorative Elements */}
        <View style={styles.bgDecorContainer}>
          <View style={styles.bgBlob} />
        </View>

        {/* Hero Section */}
        <Animated.View entering={FadeInDown.delay(200)} style={styles.heroSection}>
          <View style={styles.heroBadge}>
            <Star size={12} color="#10b981" fill="#10b981" />
            <Text style={styles.heroBadgeText}>NUEVA EXPERIENCIA GASTRONÓMICA</Text>
          </View>
          
          <Text style={styles.heroTitle}>
            Pide sin <Text style={{ color: '#10b981' }}>esperas</Text>, disfruta sin límites.
          </Text>
          
          <Text style={styles.heroSubtitle}>
            Tu menú digital inteligente. Escanea el código QR en tu mesa para comenzar.
          </Text>
        </Animated.View>

        {/* Scan CTA */}
        <Animated.View entering={FadeInDown.delay(400)} style={styles.scanCtaContainer}>
          <TouchableOpacity activeOpacity={0.9} style={styles.scanCtaWrapper}>
            <BlurView intensity={10} tint="dark" style={styles.scanCtaCard}>
              <View style={styles.scanIconBox}>
                <QrCode size={32} color="#10b981" />
              </View>
              <View style={styles.scanCtaInfo}>
                <Text style={styles.scanCtaTitle}>¿Estás en un restaurante?</Text>
                <Text style={styles.scanCtaSub}>Toca aquí para escanear el código QR</Text>
              </View>
            </BlurView>
          </TouchableOpacity>
        </Animated.View>

        {/* Restaurants Section */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTag}>PARTNERS SELECCIONADOS</Text>
            <Text style={styles.sectionTitle}>Nuestra Red</Text>
          </View>
        </View>

        <View style={styles.carouselContainer}>
          {loading ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
              {[1, 2, 3].map((i) => (
                <View key={i} style={[styles.restaurantCard, { width: 240, opacity: 0.5, justifyContent: 'center' }]}>
                  <ActivityIndicator color="#10b981" />
                </View>
              ))}
            </ScrollView>
          ) : restaurants.length > 0 ? (
            <Animated.FlatList
              ref={flatListRef}
              data={[...restaurants, ...restaurants, ...restaurants]}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item, index) => `${item.id}-${index}`}
              renderItem={({ item, index }) => (
                <Animated.View entering={FadeInRight.delay(index * 100)}>
                  <TouchableOpacity style={styles.restaurantCard} activeOpacity={0.8}>
                    <View style={styles.restaurantIcon}>
                      <Store size={22} color="#10b981" />
                    </View>
                    <View style={styles.restaurantInfo}>
                      <Text style={item.name.length > 20 ? styles.restaurantNameSmall : styles.restaurantName} numberOfLines={1}>{item.name}</Text>
                      <View style={styles.restaurantMeta}>
                        <MapPin size={12} color="rgba(16, 185, 129, 0.5)" />
                        <Text style={styles.restaurantMetaText}>DISPONIBLE VÍA QR</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              )}
              contentContainerStyle={{ paddingLeft: 24, paddingRight: 24 }}
              onScroll={(e) => {
                if (isInteracting.current) {
                  autoScrollOffset.current = e.nativeEvent.contentOffset.x;
                }
              }}
              onScrollBeginDrag={() => { isInteracting.current = true; }}
              onScrollEndDrag={() => { isInteracting.current = false; }}
              onMomentumScrollBegin={() => { isInteracting.current = true; }}
              onMomentumScrollEnd={() => { isInteracting.current = false; }}
            />
          ) : (
            <Text style={{ color: '#94a3b8', marginLeft: 24, fontStyle: 'italic', fontSize: 13 }}>Pronto nuevos partners...</Text>
          )}
        </View>

        {/* Steps Section */}
        <View style={styles.stepsContainer}>
          {[
            { icon: QrCode, title: "Escanea", desc: "Usa la cámara en el QR de tu mesa." },
            { icon: Utensils, title: "Elige", desc: "Explora el menú con fotos reales." },
            { icon: Zap, title: "Disfruta", desc: "Tu pedido llega directo a cocina." }
          ].map((step, idx) => (
            <Animated.View key={idx} entering={FadeInDown.delay(600 + idx * 100)} style={styles.stepCard}>
              <View style={styles.stepIconBox}>
                <step.icon size={24} color="#10b981" />
              </View>
              <Text style={styles.stepTitle}>{step.title}</Text>
              <Text style={styles.stepDesc}>{step.desc}</Text>
            </Animated.View>
          ))}
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
  bgDecorContainer: {
    position: 'absolute',
    top: -100,
    left: -100,
    width: 400,
    height: 400,
    pointerEvents: 'none',
  },
  bgBlob: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    borderRadius: 200,
  },
  heroSection: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 32,
    alignItems: 'center',
  },
  heroBadge: {
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
  heroBadgeText: {
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
  heroSubtitle: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  scanCtaContainer: {
    paddingHorizontal: 24,
    marginBottom: 48,
  },
  scanCtaWrapper: {
    borderRadius: 32,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  scanCtaCard: {
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  scanIconBox: {
    width: 64,
    height: 64,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanCtaInfo: {
    flex: 1,
  },
  scanCtaTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 4,
  },
  scanCtaSub: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
  },
  sectionHeader: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  sectionTag: {
    color: 'rgba(16, 185, 129, 0.5)',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 3,
    marginBottom: 4,
  },
  sectionTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: '900',
  },
  carouselContainer: {
    marginBottom: 48,
    height: 100,
  },
  categoryScroll: {
    paddingLeft: 24,
  },
  restaurantCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderRadius: 24,
    padding: 20,
    marginRight: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    width: 260,
  },
  restaurantIcon: {
    width: 52,
    height: 52,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  restaurantInfo: {
    flex: 1,
  },
  restaurantName: {
    color: 'white',
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  restaurantNameSmall: {
    color: 'white',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  restaurantMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  restaurantMetaText: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  stepsContainer: {
    paddingHorizontal: 24,
    gap: 16,
    marginBottom: 40,
  },
  stepCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  stepIconBox: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  stepTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 8,
  },
  stepDesc: {
    color: '#94a3b8',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
});
