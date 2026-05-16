import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';

interface CategoryNavProps {
  categories: any[];
  selectedCategory: string | null;
  onSelectCategory: (id: string | null) => void;
  primaryColor: string;
  bgColor: string;
  textColor: string;
}

export const CategoryNav = ({ 
  categories, 
  selectedCategory, 
  onSelectCategory, 
  primaryColor, 
  bgColor, 
  textColor 
}: CategoryNavProps) => {
  return (
    <View style={[styles.categoryContainer, { backgroundColor: bgColor, borderBottomColor: textColor + '10' }]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
        <TouchableOpacity
          style={[
            styles.categoryChip,
            selectedCategory === 'all'
              ? { backgroundColor: primaryColor, borderColor: primaryColor }
              : { backgroundColor: textColor + '10', borderColor: textColor + '10' }
          ]}
          onPress={() => onSelectCategory('all')}
        >
          <Text style={[styles.categoryText, selectedCategory === 'all' ? styles.categoryTextActive : { color: textColor + '80' }]}>
            Todos
          </Text>
        </TouchableOpacity>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[
              styles.categoryChip,
              selectedCategory === cat.id
                ? { backgroundColor: primaryColor, borderColor: primaryColor }
                : { backgroundColor: textColor + '10', borderColor: textColor + '10' }
            ]}
            onPress={() => onSelectCategory(cat.id)}
          >
            <Text style={[styles.categoryText, selectedCategory === cat.id ? styles.categoryTextActive : { color: textColor + '80' }]}>
              {cat.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  categoryContainer: { paddingVertical: 12, borderBottomWidth: 1 },
  categoryScroll: { paddingHorizontal: 20, gap: 8 },
  categoryChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 18, borderWidth: 1 },
  categoryText: { fontWeight: '800', fontSize: 13 },
  categoryTextActive: { color: 'white' },
});
