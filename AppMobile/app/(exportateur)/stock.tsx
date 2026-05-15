import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Stack, useRouter, useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { myLotsApi, getApiError, type BatchResponse } from '@/services/api';
import { mapStatut } from '@/utils/lot-status';

const { width } = Dimensions.get('window');

const PLACEHOLDER = 'https://images.unsplash.com/photo-1582131503261-fca1d1c058d3?q=80&w=500&auto=format&fit=crop';

export default function StockScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [lots, setLots] = useState<BatchResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await myLotsApi.list();
      setLots(data.lots ?? []);
    } catch (e) {
      setError(getApiError(e));
      setLots([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const totalQty = lots.reduce((s, b) => s + (b.quantite ?? 0), 0);

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <View>
          <Text style={styles.headerSubtitle}>Inventaire</Text>
          <Text style={styles.headerTitle}>Gestion de Stock</Text>
        </View>
        <TouchableOpacity style={styles.filterBtn} onPress={() => void load()}>
          <MaterialCommunityIcons name="refresh" size={24} color="#1B5E20" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.statsRow}>
          <StatCard label="Lots (API)" value={String(lots.length)} icon="package-variant-closed" />
          <StatCard label="Volume (kg)" value={totalQty.toFixed(0)} icon="weight-kilogram" />
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#1B5E20" style={{ marginTop: 40 }} />
        ) : error ? (
          <Text style={styles.err}>{error}</Text>
        ) : (
          <>
            <Text style={styles.sectionTitle}>Mes lots (propriétaire)</Text>
            {lots.length === 0 ? (
              <Text style={styles.empty}>Aucun lot renvoyé par l&apos;API.</Text>
            ) : (
              lots.map((item) => {
                const id = item.id ?? '';
                const statut = item.statut ?? '—';
                const statutLc = String(statut).toLowerCase();
                const poidsKg = item.quantite != null ? `${item.quantite} kg` : '—';
                const destination = item.lieu ?? item.org_id ?? '—';
                const enTransit = statutLc === 'en_transit';
                return (
                  <View key={id} style={styles.stockCard}>
                    <Image source={{ uri: PLACEHOLDER }} style={styles.stockImage} />
                    <View style={styles.cardContent}>
                      <View style={styles.cardHeader}>
                        <Text style={styles.lotId}>{id}</Text>
                        <View style={[styles.badge, { backgroundColor: mapStatut(item.statut).color }]}>
                          <Text style={[styles.badgeText, { color: mapStatut(item.statut).textColor }]}>
                            {mapStatut(item.statut).label}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.infoRow}>
                        <MaterialCommunityIcons name="weight-kilogram" size={18} color="#1B5E20" />
                        <Text style={styles.infoText}>{poidsKg}</Text>
                        <MaterialCommunityIcons
                          name="map-marker-radius-outline"
                          size={18}
                          color="#1B5E20"
                          style={{ marginLeft: 15 }}
                        />
                        <Text style={styles.infoText} numberOfLines={1}>
                          {destination}
                        </Text>
                      </View>

                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                        {enTransit ? (
                          <TouchableOpacity
                            style={[styles.linkBtn, { backgroundColor: '#FFF3E0' }]}
                            onPress={() =>
                              router.push({
                                pathname: '/confirmer-reception-lot',
                                params: { lotId: id },
                              } as any)
                            }
                          >
                            <Text style={[styles.linkBtnText, { color: '#E65100' }]}>
                              Confirmer la réception
                            </Text>
                          </TouchableOpacity>
                        ) : null}
                        <TouchableOpacity
                          style={[styles.linkBtn, { backgroundColor: enTransit ? '#EEEEEE' : '#FFF3E0' }]}
                          disabled={enTransit}
                          onPress={() =>
                            router.push(`/(exportateur)/paiement?lotId=${encodeURIComponent(id)}` as any)
                          }
                        >
                          <Text
                            style={[
                              styles.linkBtnText,
                              { color: enTransit ? '#9E9E9E' : '#E65100' },
                            ]}
                          >
                            {enTransit ? 'Paiement après réception' : 'Confirmer / payer'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={[styles.bottomTab, { paddingBottom: insets.bottom || 5, height: 70 + (insets.bottom || 0) }]}>
        <TabItem icon="home-variant" label="Accueil" onPress={() => router.push('/(exportateur)/accueil')} />
        <TabItem icon="wallet" label="Portefeuille" onPress={() => router.push('/(exportateur)/portefeuille' as any)} />
        <TabItem icon="qrcode-scan" label="Scanner" onPress={() => router.push('/(exportateur)/scanner')} />
        <TabItem icon="package-variant-closed" label="Stock" active />
        <TabItem icon="history" label="Historique" onPress={() => router.push('/(exportateur)/historique')} />
      </View>
    </SafeAreaView>
  );
}

const StatCard = ({ label, value, icon }: any) => (
  <View style={styles.statCard}>
    <View style={styles.statIconBg}>
      <MaterialCommunityIcons name={icon} size={22} color="#1B5E20" />
    </View>
    <View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  </View>
);

const TabItem = ({ icon, label, active = false, onPress }: any) => (
  <TouchableOpacity style={styles.tabItem} onPress={onPress}>
    <MaterialCommunityIcons name={icon} size={24} color={active ? '#1B5E20' : '#888'} />
    <Text style={[styles.tabLabel, { color: active ? '#1B5E20' : '#888' }]}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: {
    backgroundColor: '#1B5E20',
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 5,
  },
  headerTitle: { fontSize: 24, fontFamily: 'Montserrat-Bold', color: 'white' },
  headerSubtitle: { fontSize: 13, fontFamily: 'Montserrat-Regular', color: 'rgba(255,255,255,0.7)' },
  filterBtn: { backgroundColor: 'white', padding: 10, borderRadius: 12, elevation: 2 },
  scrollContent: { padding: 20 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 25 },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    elevation: 2,
  },
  statIconBg: {
    width: 40,
    height: 40,
    backgroundColor: '#E8F5E9',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: { fontSize: 18, fontFamily: 'Montserrat-Bold', color: '#333' },
  statLabel: { fontSize: 10, fontFamily: 'Montserrat-Regular', color: '#777' },
  sectionTitle: { fontSize: 18, fontFamily: 'Montserrat-Bold', color: '#1B5E20', marginBottom: 15 },
  stockCard: { backgroundColor: 'white', borderRadius: 25, marginBottom: 20, overflow: 'hidden', elevation: 3 },
  stockImage: { width: '100%', height: 160 },
  cardContent: { padding: 20 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  lotId: { fontSize: 14, fontFamily: 'Montserrat-Bold', color: '#333', flex: 1, marginRight: 8 },
  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  badgeText: { fontSize: 10, fontFamily: 'Montserrat-Bold' },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' },
  infoText: { fontSize: 13, fontFamily: 'Montserrat-Bold', color: '#444', marginLeft: 6, maxWidth: width * 0.5 },
  linkBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
  linkBtnText: { fontFamily: 'Montserrat-Bold', fontSize: 12 },
  err: { color: '#C62828', marginTop: 16, textAlign: 'center' },
  empty: { color: '#888', marginTop: 12 },
  bottomTab: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 85,
    backgroundColor: 'white',
    flexDirection: 'row',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    elevation: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  tabItem: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 5 },
  tabLabel: { fontSize: 10, marginTop: 5, fontFamily: 'Montserrat-Regular' },
});
