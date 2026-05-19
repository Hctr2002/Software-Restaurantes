import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image } from 'react-native';
import { Utensils, Minus, Plus } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface MenuItemCardProps {
  item: any;
  index: number;
  quantity: number;
  onAdd: (item: any) => void;
  onRemove: (id: string) => void;
  textColor: string;
  accentColor: string;
  primaryColor: string;
}

export const MenuItemCard = ({ 
  item, 
  index, 
  quantity, 
  onAdd, 
  onRemove, 
  textColor, 
  accentColor, 
  primaryColor 
}: MenuItemCardProps) => {
  return (
    <Animated.View entering={FadeInDown.delay(index * 50)} style={[styles.itemCard, { backgroundColor: textColor + '08', borderColor: textColor + '0A' }]}>
      <View style={styles.itemInfo}>
        <Text style={[styles.itemName, { color: textColor }]}>{item.name}</Text>
        <Text style={[styles.itemDesc, { color: textColor + '60' }]} numberOfLines={2}>{item.description}</Text>
        <Text style={[styles.itemPrice, { color: accentColor }]}>${item.price.toLocaleString()}</Text>
      </View>
      <View style={styles.itemImageContainer}>
        {item.image_url ? (
          <Image source={{ uri: item.image_url }} style={styles.itemImage} />
        ) : (
          <View style={[styles.itemImagePlaceholder, { backgroundColor: textColor + '08' }]}><Utensils size={24} color={textColor + '20'} /></View>
        )}
        {quantity > 0 ? (
          <View style={[styles.qtyControl, { backgroundColor: primaryColor }]}>
            <TouchableOpacity onPress={() => onRemove(item.id)}><Minus size={18} color="white" /></TouchableOpacity>
            <Text style={styles.qtyText}>{quantity}</Text>
            <TouchableOpacity onPress={() => onAdd(item)}><Plus size={18} color="white" /></TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={[styles.addBtn, { backgroundColor: primaryColor }]} onPress={() => onAdd(item)}>
            <Plus size={22} color="white" />
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  itemCard: { flexDirection: 'row', borderRadius: 22, padding: 16, borderWidth: 1, marginBottom: 16 },
  itemInfo: { flex: 1, paddingRight: 12 },
  itemName: { fontSize: 16, fontWeight: '800', marginBottom: 4 },
  itemDesc: { fontSize: 12, lineHeight: 16, marginBottom: 8 },
  itemPrice: { fontSize: 15, fontWeight: '900' },
  itemImageContainer: { alignItems: 'center', justifyContent: 'center' },
  itemImage: { width: 90, height: 90, borderRadius: 16 },
  itemImagePlaceholder: { width: 90, height: 90, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  addBtn: { position: 'absolute', bottom: -8, right: -8, width: 40, height: 40, borderRadius: 14, justifyContent: 'center', alignItems: 'center', elevation: 4 },
  qtyControl: { position: 'absolute', bottom: -8, right: -8, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14, elevation: 6 },
  qtyText: { color: 'white', fontWeight: '900', fontSize: 16 },
});
