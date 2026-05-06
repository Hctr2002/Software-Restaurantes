import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ChevronRight, Mail, Shield } from 'lucide-react-native';
import { MB_COLORS, MB_RADIUS, MB_SPACING } from '../constants/MB_Theme';
import Animated, { FadeInDown } from 'react-native-reanimated';

export type UserProfile = {
  id: string;
  email: string;
  role: string;
  createdAt: string;
};

interface UserCardProps {
  user: UserProfile;
  index: number;
  onPress: (user: UserProfile) => void;
}

const getRoleBadgeColor = (role: string) => {
  switch (role.toUpperCase()) {
    case 'ADMIN': return '#4F6D7A';
    case 'GARZON': return '#729B79';
    case 'COCINA': return '#E09F3E';
    case 'CAJERO': return '#335C67';
    default: return MB_COLORS.muted;
  }
};

export const UserCard = ({ user, index, onPress }: UserCardProps) => {
  return (
    <Animated.View 
      entering={FadeInDown.delay(index * 50).duration(400)}
      style={styles.card}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{user.email[0].toUpperCase()}</Text>
      </View>
      
      <View style={styles.info}>
        <Text style={styles.email} numberOfLines={1}>{user.email}</Text>
        <View style={styles.row}>
          <View style={[styles.badge, { backgroundColor: getRoleBadgeColor(user.role) + '15' }]}>
            <Text style={[styles.badgeText, { color: getRoleBadgeColor(user.role) }]}>
              {user.role}
            </Text>
          </View>
          <Text style={styles.date}>
            {new Date(user.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </View>

      <TouchableOpacity onPress={() => onPress(user)} style={styles.action}>
        <ChevronRight size={18} color={MB_COLORS.muted} />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MB_COLORS.glass,
    borderRadius: MB_RADIUS.xl,
    padding: MB_SPACING.md,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: MB_COLORS.glassHeavy,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  avatarText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '900',
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  email: {
    color: 'white',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  date: {
    color: MB_COLORS.muted,
    fontSize: 9,
    fontWeight: '600',
  },
  action: {
    padding: 8,
  }
});
