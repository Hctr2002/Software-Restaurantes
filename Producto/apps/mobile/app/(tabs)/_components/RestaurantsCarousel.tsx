import React, { useRef, useEffect, useState } from 'react';
import { View, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Text } from '@/components/Themed';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { Store, MapPin } from 'lucide-react-native';
import { supabase } from '../../../lib/supabase';

interface Restaurant {
  id: string;
  name: string;
  slug: string;
}

export default function RestaurantsCarousel() {
  const flatListRef = useRef<any>(null);
  const autoScrollOffset = useRef(0);
  const isInteracting = useRef(false);
  const scrollInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('restaurants')
      .select('id, name, slug')
      .eq('status', 'ACTIVE')
      .order('name')
      .then(({ data, error }) => {
        if (!error && data) setRestaurants(data);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (loading || restaurants.length === 0) return;

    scrollInterval.current = setInterval(() => {
      if (flatListRef.current && !isInteracting.current) {
        autoScrollOffset.current += 0.5;
        const totalWidth = restaurants.length * 272;
        if (autoScrollOffset.current > totalWidth) autoScrollOffset.current = 0;
        flatListRef.current.scrollToOffset({ offset: autoScrollOffset.current, animated: false });
      }
    }, 30);

    return () => { if (scrollInterval.current) clearInterval(scrollInterval.current); };
  }, [loading, restaurants]);

  return (
    <>
      <View style={styles.header}>
        <Text style={styles.tag}>PARTNERS SELECCIONADOS</Text>
        <Text style={styles.title}>Nuestra Red</Text>
      </View>

      <View style={styles.container}>
        {loading ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingLeft: 24 }}>
            {[1, 2, 3].map((i) => (
              <View key={i} style={[styles.card, { width: 240, opacity: 0.5, justifyContent: 'center' }]}>
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
                <TouchableOpacity style={styles.card} activeOpacity={0.8}>
                  <View style={styles.cardIcon}>
                    <Store size={22} color="#10b981" />
                  </View>
                  <View style={styles.cardInfo}>
                    <Text
                      style={item.name.length > 20 ? styles.nameSmall : styles.name}
                      numberOfLines={1}
                    >
                      {item.name}
                    </Text>
                    <View style={styles.meta}>
                      <MapPin size={12} color="rgba(16, 185, 129, 0.5)" />
                      <Text style={styles.metaText}>DISPONIBLE VÍA QR</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            )}
            contentContainerStyle={{ paddingLeft: 24, paddingRight: 24 }}
            onScroll={(e) => {
              if (isInteracting.current) autoScrollOffset.current = e.nativeEvent.contentOffset.x;
            }}
            onScrollBeginDrag={() => { isInteracting.current = true; }}
            onScrollEndDrag={() => { isInteracting.current = false; }}
            onMomentumScrollBegin={() => { isInteracting.current = true; }}
            onMomentumScrollEnd={() => { isInteracting.current = false; }}
          />
        ) : (
          <Text style={styles.empty}>Pronto nuevos partners...</Text>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  tag: {
    color: 'rgba(16, 185, 129, 0.5)',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 3,
    marginBottom: 4,
  },
  title: {
    color: 'white',
    fontSize: 24,
    fontWeight: '900',
  },
  container: {
    marginBottom: 48,
    height: 100,
  },
  card: {
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
  cardIcon: {
    width: 52,
    height: 52,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardInfo: {
    flex: 1,
  },
  name: {
    color: 'white',
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  nameSmall: {
    color: 'white',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  metaText: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  empty: {
    color: '#94a3b8',
    marginLeft: 24,
    fontStyle: 'italic',
    fontSize: 13,
  },
});
