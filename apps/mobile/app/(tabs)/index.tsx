import React from 'react';
import { 
  StyleSheet, 
  ScrollView, 
  Image, 
  TouchableOpacity, 
  Dimensions,
  StatusBar
} from 'react-native';
import { Text, View } from '@/components/Themed';
import { MB_COLORS, MB_SPACING, MB_RADIUS } from '../constants/MB_Theme';
import { ChefHat, Search, ShoppingBag, Star, Timer, Flame, Leaf } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

const CATEGORIES = [
  { id: '1', name: 'Al Fuego', icon: <Flame size={16} color={MB_COLORS.brandAccent} />, active: true },
  { id: '2', name: 'Healthy', icon: <Leaf size={16} color={MB_COLORS.sage} /> },
  { id: '3', name: 'Drinks', icon: <Star size={16} color="#FFD700" /> },
  { id: '4', name: 'Postres', icon: <ChefHat size={16} color={MB_COLORS.muted} /> },
];

const FEATURED_DISHES = [
  {
    id: '1',
    name: 'Truffle Double Burger',
    price: '$12.990',
    rating: '4.9',
    time: '15-20 min',
    image: require('../../assets/images/burger_hero.png'),
    tag: 'Popular'
  },
  {
    id: '2',
    name: 'Grilled Salmon Bowl',
    price: '$14.200',
    rating: '4.8',
    time: '20-25 min',
    image: require('../../assets/images/salad_hero.png'),
    tag: 'Chef Choice'
  }
];

export default function MenuHomeScreen() {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Premium Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>Buenos días,</Text>
          <Text style={styles.userName}>Gourmet Lover</Text>
        </View>
        <TouchableOpacity style={styles.cartButton}>
          <ShoppingBag color="white" size={24} />
          <View style={styles.cartBadge} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Search Bar */}
        <Animated.View entering={FadeInDown.delay(200)} style={styles.searchContainer}>
          <Search color={MB_COLORS.muted} size={20} />
          <Text style={styles.searchPlaceholder}>¿Qué se te antoja hoy?</Text>
        </Animated.View>

        {/* Categories */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Categorías</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          {CATEGORIES.map((cat, index) => (
            <Animated.View key={cat.id} entering={FadeInRight.delay(index * 100)}>
              <TouchableOpacity style={[styles.categoryCard, cat.active && styles.categoryCardActive]}>
                {cat.icon}
                <Text style={[styles.categoryText, cat.active && styles.categoryTextActive]}>{cat.name}</Text>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </ScrollView>

        {/* Featured Selection */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Selección del Chef</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>Ver todo</Text>
          </TouchableOpacity>
        </View>

        {FEATURED_DISHES.map((dish, index) => (
          <Animated.View key={dish.id} entering={FadeInDown.delay(400 + index * 100)}>
            <TouchableOpacity style={styles.dishCard}>
              <Image source={dish.image} style={styles.dishImage} resizeMode="cover" />
              <View style={styles.tagBadge}>
                <Text style={styles.tagText}>{dish.tag}</Text>
              </View>
              
              <View style={styles.dishInfo}>
                <View style={styles.dishMainRow}>
                  <Text style={styles.dishName}>{dish.name}</Text>
                  <Text style={styles.dishPrice}>{dish.price}</Text>
                </View>
                
                <View style={styles.dishMetaRow}>
                  <View style={styles.metaItem}>
                    <Star size={12} color="#FFD700" fill="#FFD700" />
                    <Text style={styles.metaText}>{dish.rating}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Timer size={12} color={MB_COLORS.muted} />
                    <Text style={styles.metaText}>{dish.time}</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          </Animated.View>
        ))}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MB_COLORS.navy,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: MB_SPACING.lg,
    marginBottom: MB_SPACING.lg,
  },
  greeting: {
    fontSize: 14,
    color: MB_COLORS.muted,
    fontFamily: 'System',
    fontWeight: '600',
  },
  userName: {
    fontSize: 24,
    color: 'white',
    fontFamily: 'System',
    fontWeight: '900',
    letterSpacing: -1,
  },
  cartButton: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: MB_COLORS.glassHeavy,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  cartBadge: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: MB_COLORS.brandAccent,
    borderWidth: 2,
    borderColor: MB_COLORS.navy,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  searchContainer: {
    marginHorizontal: MB_SPACING.lg,
    height: 56,
    backgroundColor: MB_COLORS.glass,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
    marginBottom: MB_SPACING.xl,
  },
  searchPlaceholder: {
    color: MB_COLORS.muted,
    marginLeft: 12,
    fontSize: 14,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: MB_SPACING.lg,
    marginBottom: MB_SPACING.md,
  },
  sectionTitle: {
    fontSize: 20,
    color: 'white',
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  seeAll: {
    fontSize: 12,
    color: MB_COLORS.brandAccent,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  categoryScroll: {
    paddingLeft: MB_SPACING.lg,
    marginBottom: MB_SPACING.xl,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MB_COLORS.glass,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 16,
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
  },
  categoryCardActive: {
    backgroundColor: 'white',
    borderColor: 'white',
  },
  categoryText: {
    color: 'white',
    fontSize: 13,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  categoryTextActive: {
    color: MB_COLORS.navy,
  },
  dishCard: {
    marginHorizontal: MB_SPACING.lg,
    backgroundColor: MB_COLORS.glass,
    borderRadius: 32,
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
  },
  dishImage: {
    width: '100%',
    height: 220,
  },
  tagBadge: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: 'rgba(10, 17, 40, 0.8)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  tagText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  dishInfo: {
    padding: 24,
  },
  dishMainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: 'transparent',
  },
  dishName: {
    fontSize: 18,
    color: 'white',
    fontWeight: '900',
    flex: 1,
    marginRight: 10,
  },
  dishPrice: {
    fontSize: 16,
    color: MB_COLORS.brandAccent,
    fontWeight: '900',
  },
  dishMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    backgroundColor: 'transparent',
  },
  metaText: {
    color: MB_COLORS.muted,
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
});
