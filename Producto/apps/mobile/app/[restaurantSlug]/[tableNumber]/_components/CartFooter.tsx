import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { ShoppingBag } from 'lucide-react-native';
import Animated, { SlideInUp } from 'react-native-reanimated';

interface CartFooterProps {
  cartCount: number;
  cartTotal: number;
  primaryColor: string;
  onPress: () => void;
}

export const CartFooter = ({ cartCount, cartTotal, primaryColor, onPress }: CartFooterProps) => {
  if (cartCount === 0) return null;

  return (
    <Animated.View entering={SlideInUp} style={styles.footer}>
      <TouchableOpacity 
        style={[styles.cartBtn, { backgroundColor: primaryColor }]} 
        activeOpacity={0.9} 
        onPress={onPress}
      >
        <View style={styles.cartBadge}><Text style={styles.cartBadgeText}>{cartCount}</Text></View>
        <Text style={styles.cartBtnText}>Enviar al Garzón · ${cartTotal.toLocaleString()}</Text>
        <ShoppingBag size={20} color="white" />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, paddingBottom: 34 },
  cartBtn: { height: 64, borderRadius: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, elevation: 10 },
  cartBtnText: { color: 'white', fontSize: 16, fontWeight: '900' },
  cartBadge: { backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 10, paddingVertical: 2, borderRadius: 10 },
  cartBadgeText: { color: 'white', fontSize: 12, fontWeight: 'bold' },
});
