import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, Platform } from 'react-native';
import { Store, Users, AlertCircle } from 'lucide-react-native';
import { MB_COLORS, MB_SPACING, MB_RADIUS } from '../../constants/MB_Theme';
import { supabase } from '../../lib/supabase';

type Restaurant = {
  id: string;
  name: string;
  slug: string;
  status: string;
  createdAt: string;
};

type UserRecord = {
  id: string;
  email: string;
  role: string;
  createdAt: string;
  restaurants?: { name: string } | { name: string }[] | null;
};

export default function SuperAdminIndex() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setError(null);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No hay sesión activa");

      let API_URL = 'http://10.122.168.197:3000'; // Fallback a tu IP de red actual
      
      try {
        const Constants = await import('expo-constants');
        const debuggerHost = Constants.default.expoConfig?.hostUri;
        if (debuggerHost) {
          const hostIp = debuggerHost.split(':')[0];
          API_URL = `http://${hostIp}:3000`;
        }
      } catch (e) {
        // Fallback silencioso
      }

      const [restRes, usersRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/restaurants`, {
          headers: { Authorization: `Bearer ${session.access_token}` }
        }),
        fetch(`${API_URL}/api/admin/users`, {
          headers: { Authorization: `Bearer ${session.access_token}` }
        })
      ]);

      const restJson: any = await restRes.json();
      const usersJson: any = await usersRes.json();

      if (!restRes.ok) throw new Error(restJson.error || 'Error al cargar organizaciones');
      if (!usersRes.ok) throw new Error(usersJson.error || 'Error al cargar usuarios');

      setRestaurants(restJson.data || []);
      setUsers(usersJson.data || []);
    } catch (err: any) {
      setError(err.message || 'Error al cargar los datos');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={MB_COLORS.brandAccent} />
        <Text style={styles.loadingText}>Cargando panel...</Text>
      </View>
    );
  }

  const latestRestaurants = restaurants.slice(0, 10);
  const latestUsers = users.slice(0, 10);

  const restaurantsActive = restaurants.filter(r => r.status === 'ACTIVE').length;
  const restaurantsSuspended = restaurants.filter(r => r.status === 'SUSPENDED').length;
  const usersWithRestaurant = users.filter(u => Array.isArray(u.restaurants) ? u.restaurants.length > 0 : !!u.restaurants).length;
  const adminUsers = users.filter(u => u.role === 'ADMIN' || u.role === 'SUPER_ADMIN').length;

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={MB_COLORS.brandAccent} />}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Panel Principal</Text>
        <Text style={styles.subtitle}>Resumen del Super Administrador</Text>
      </View>

      {error && (
        <View style={styles.errorBox}>
          <AlertCircle color="#ef4444" size={20} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* KPIs */}
      <View style={styles.kpiGrid}>
        <KpiCard label="Organizaciones Totales" value={restaurants.length} detail={`${restaurantsActive} activos`} />
        <KpiCard label="Organizaciones Suspendidas" value={restaurantsSuspended} detail="Estado SUSPENDED" />
        <KpiCard label="Usuarios Totales" value={users.length} detail={`${adminUsers} admins`} />
        <KpiCard label="Usuarios Asignados" value={usersWithRestaurant} detail="Con organización" />
      </View>

      {/* Latest Organizations */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Store color={MB_COLORS.cream} size={20} />
          <Text style={styles.sectionTitle}>Últimas 10 Organizaciones</Text>
        </View>
        {latestRestaurants.length === 0 ? (
          <Text style={styles.emptyText}>Aún no existen organizaciones registradas.</Text>
        ) : (
          latestRestaurants.map((restaurant) => (
            <View key={restaurant.id} style={styles.cardItem}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardItemTitle}>{restaurant.name}</Text>
                <View style={[styles.badge, restaurant.status === 'ACTIVE' ? styles.badgeActive : styles.badgeSuspended]}>
                  <Text style={styles.badgeText}>{restaurant.status}</Text>
                </View>
              </View>
              <Text style={styles.cardItemSub}>{restaurant.slug}</Text>
              <Text style={styles.cardItemDate}>{formatDate(restaurant.createdAt)}</Text>
            </View>
          ))
        )}
      </View>

      {/* Latest Users */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Users color={MB_COLORS.cream} size={20} />
          <Text style={styles.sectionTitle}>Últimos 10 Usuarios</Text>
        </View>
        {latestUsers.length === 0 ? (
          <Text style={styles.emptyText}>Aún no existen usuarios registrados.</Text>
        ) : (
          latestUsers.map((userRow) => {
            const restaurantName = Array.isArray(userRow.restaurants)
              ? userRow.restaurants[0]?.name
              : userRow.restaurants?.name;

            return (
              <View key={userRow.id} style={styles.cardItem}>
                <Text style={styles.cardItemTitle}>{userRow.email}</Text>
                <Text style={styles.cardItemSub}>
                  <Text style={styles.roleText}>{userRow.role}</Text> • {restaurantName || "Sin organización"}
                </Text>
                <Text style={styles.cardItemDate}>{formatDate(userRow.createdAt)}</Text>
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

function KpiCard({ label, value, detail }: { label: string; value: number; detail: string }) {
  return (
    <View style={styles.kpiCard}>
      <Text style={styles.kpiLabel}>{label}</Text>
      <Text style={styles.kpiValue}>{value}</Text>
      <Text style={styles.kpiDetail}>{detail}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MB_COLORS.navy,
  },
  content: {
    padding: MB_SPACING.xl,
    paddingBottom: 40,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: MB_COLORS.muted,
    marginTop: MB_SPACING.md,
  },
  header: {
    marginBottom: MB_SPACING.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: MB_COLORS.cream,
  },
  subtitle: {
    fontSize: 14,
    color: MB_COLORS.muted,
    marginTop: 4,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderWidth: 1,
    padding: MB_SPACING.md,
    borderRadius: MB_RADIUS.md,
    marginBottom: MB_SPACING.lg,
    gap: MB_SPACING.sm,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: MB_SPACING.md,
    marginBottom: MB_SPACING.xl,
  },
  kpiCard: {
    width: '47%',
    backgroundColor: MB_COLORS.glass,
    borderRadius: MB_RADIUS.md,
    padding: MB_SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  kpiLabel: {
    fontSize: 10,
    color: MB_COLORS.muted,
    textTransform: 'uppercase',
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  kpiValue: {
    fontSize: 28,
    fontWeight: '900',
    color: MB_COLORS.cream,
    marginVertical: 4,
  },
  kpiDetail: {
    fontSize: 11,
    color: MB_COLORS.muted,
  },
  section: {
    marginBottom: MB_SPACING.xl,
    backgroundColor: MB_COLORS.glassHeavy,
    borderRadius: MB_RADIUS.lg,
    padding: MB_SPACING.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: MB_SPACING.sm,
    marginBottom: MB_SPACING.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: MB_COLORS.cream,
  },
  emptyText: {
    color: MB_COLORS.muted,
    fontSize: 14,
    fontStyle: 'italic',
  },
  cardItem: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    padding: MB_SPACING.md,
    borderRadius: MB_RADIUS.md,
    marginBottom: MB_SPACING.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardItemTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: MB_COLORS.cream,
    marginBottom: 2,
  },
  cardItemSub: {
    fontSize: 12,
    color: MB_COLORS.muted,
    marginBottom: 6,
  },
  roleText: {
    fontWeight: 'bold',
    color: MB_COLORS.brandAccent,
  },
  cardItemDate: {
    fontSize: 10,
    color: MB_COLORS.muted,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgeActive: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  badgeSuspended: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: MB_COLORS.cream,
  },
});
