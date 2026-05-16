import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image } from 'react-native';
import { ChevronLeft, Utensils, Star, History } from 'lucide-react-native';

interface MenuHeaderProps {
  restaurant: any;
  theme: any;
  tableNumber: string;
  insets: any;
  onBack: () => void;
  onOpenHistory: () => void;
  hasActiveOrders: boolean;
}

export const MenuHeader = ({ 
  restaurant, 
  theme, 
  tableNumber, 
  insets, 
  onBack, 
  onOpenHistory,
  hasActiveOrders
}: MenuHeaderProps) => {
  const primaryColor = theme?.primary_color || '#10b981';

  return (
    <View style={[styles.header, { backgroundColor: primaryColor }]}>
      {theme?.logo_url && <Image source={{ uri: theme.logo_url }} style={styles.headerBgImage} blurRadius={10} />}
      <View style={styles.headerOverlay} />

      <View style={[styles.navBar, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <ChevronLeft color="white" size={24} />
        </TouchableOpacity>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.headerActionBtn, { backgroundColor: 'rgba(0,0,0,0.3)' }]}
            onPress={onOpenHistory}
          >
            <History color="white" size={20} />
            {hasActiveOrders && <View style={styles.activeOrdersDot} />}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.headerContent}>
        {theme?.logo_url ? (
          <Image source={{ uri: theme.logo_url }} style={styles.restaurantLogo} />
        ) : (
          <View style={[styles.restaurantLogo, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
            <Utensils color="white" size={32} />
          </View>
        )}
        <View style={styles.headerInfo}>
          <Text style={styles.restaurantName}>{restaurant?.name}</Text>
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Star size={14} color="#fbbf24" fill="#fbbf24" />
              <Text style={styles.metaText}>Mesa {tableNumber}</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: { height: 260, justifyContent: 'flex-end', overflow: 'hidden' },
  headerBgImage: { ...StyleSheet.absoluteFillObject, opacity: 0.5 },
  headerOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  navBar: { position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: 20, zIndex: 100, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  headerActions: { flexDirection: 'row', gap: 10 },
  headerActionBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  activeOrdersDot: { position: 'absolute', top: 12, right: 12, width: 8, height: 8, borderRadius: 4, backgroundColor: '#10b981', borderWidth: 2, borderColor: '#020617' },
  headerContent: { padding: 24, flexDirection: 'row', alignItems: 'center', gap: 16 },
  restaurantLogo: { width: 70, height: 70, borderRadius: 20, borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  headerInfo: { flex: 1 },
  restaurantName: { fontSize: 24, fontWeight: '900', letterSpacing: -0.5, color: 'white' },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { color: '#cbd5e1', fontSize: 13, fontWeight: '700' },
});
