import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Stack, useRouter, useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CoopBottomNav } from '@/components/CoopBottomNav';
import { myLotsApi, getApiError, type BatchResponse } from '@/services/api';
import { canIncludeInGroupedList, canPayLot, isEnTransit, mapStatut } from '@/utils/lot-status';

const brandGreen = '#2E7D32';

export default function CooperativeLotsScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'Tous' | 'Transit' | 'Reçus'>('Tous');
  const [lots, setLots] = useState<BatchResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const { data } = await myLotsApi.list({ limit: 200 });
      setLots(data.lots ?? []);
    } catch (e) {
      setError(getApiError(e));
      setLots([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void load();
    }, [load])
  );

  const filtered = lots.filter((item) => {
    const id = item.id ?? '';
    const q = search.toLowerCase();
    const matchesSearch =
      id.toLowerCase().includes(q) ||
      String(item.culture ?? '').toLowerCase().includes(q) ||
      String(item.lieu ?? '').toLowerCase().includes(q);
    if (!matchesSearch) return false;
    if (filter === 'Transit') return isEnTransit(item.statut);
    if (filter === 'Reçus') return canIncludeInGroupedList(item.statut);
    return true;
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      <LinearGradient colors={['#1B5E20', '#2E7D32', '#43A047']} style={styles.header}>
        <Text style={styles.headerTitle}>Mes lots</Text>
        <TouchableOpacity
          style={styles.listGroupBtn}
          onPress={() => router.push('/(cooperative)/generation_liste' as any)}
        >
          <MaterialCommunityIcons name="format-list-bulleted-type" size={20} color="#1B5E20" />
          <Text style={styles.listGroupText}>Liste groupée</Text>
        </TouchableOpacity>
      </LinearGradient>

      <View style={styles.body}>
        {error ? <Text style={styles.err}>{error}</Text> : null}

        <View style={styles.searchContainer}>
          <MaterialCommunityIcons name="magnify" size={20} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un lot…"
            placeholderTextColor="#999"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <View style={styles.filterBar}>
          {(['Tous', 'Transit', 'Reçus'] as const).map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterBtn, filter === f && { backgroundColor: brandGreen }]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterText, filter === f && { color: 'white' }]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={brandGreen} style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id ?? String(Math.random())}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => {
                  setRefreshing(true);
                  void load();
                }}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="package-variant" size={64} color="#CCC" />
                <Text style={styles.emptyText}>Aucun lot pour ce filtre.</Text>
                <Text style={styles.emptyHint}>
                  Les lots transférés apparaissent en « Transit » jusqu’à confirmation de réception.
                </Text>
              </View>
            }
            renderItem={({ item }) => {
              const id = item.id ?? '';
              const st = mapStatut(item.statut);
              const inTransit = isEnTransit(item.statut);
              const payable = canPayLot(item.statut);
              return (
                <TouchableOpacity
                  style={styles.card}
                  onPress={() => {
                    if (inTransit) {
                      router.push({ pathname: '/confirmer-reception-lot', params: { lotId: id } } as any);
                    } else if (payable) {
                      router.push({ pathname: '/(cooperative)/paiement', params: { lotId: id } } as any);
                    } else {
                      router.push({ pathname: '/historique', params: { lotId: id } } as any);
                    }
                  }}
                  onLongPress={() =>
                    router.push({ pathname: '/historique', params: { lotId: id } } as any)
                  }
                >
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {id}
                    </Text>
                    <View style={[styles.badge, { backgroundColor: st.color }]}>
                      <Text style={[styles.badgeText, { color: st.textColor }]}>{st.label}</Text>
                    </View>
                  </View>
                  <Text style={styles.cardSub}>
                    {item.culture ?? 'Cacao'} · {item.quantite ?? 0} kg · {item.lieu ?? '—'}
                  </Text>
                  {inTransit ? (
                    <Text style={styles.actionHint}>Appuyer pour confirmer la réception →</Text>
                  ) : payable ? (
                    <Text style={[styles.actionHint, { color: '#2E7D32' }]}>Appuyer pour payer l’agriculteur →</Text>
                  ) : null}
                </TouchableOpacity>
              );
            }}
          />
        )}
      </View>

      <CoopBottomNav activeTab="lots" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: {
    paddingTop: 12,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: { color: 'white', fontSize: 22, fontWeight: 'bold' },
  listGroupBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  listGroupText: { color: '#1B5E20', fontWeight: '700', fontSize: 12 },
  body: { flex: 1 },
  err: { color: '#C62828', padding: 16, fontSize: 13 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    height: 46,
    elevation: 2,
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 15, color: '#333' },
  filterBar: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginVertical: 12 },
  filterBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#EEE',
  },
  filterText: { fontSize: 13, color: '#666', fontWeight: '600' },
  listContent: { paddingHorizontal: 16, paddingBottom: 16 },
  card: {
    backgroundColor: 'white',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  cardTitle: { flex: 1, fontSize: 14, fontWeight: '700', color: '#333' },
  cardSub: { fontSize: 12, color: '#777', marginTop: 6 },
  actionHint: { fontSize: 11, color: '#E65100', marginTop: 8, fontWeight: '600' },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 10, fontWeight: '800' },
  emptyContainer: { alignItems: 'center', marginTop: 48, paddingHorizontal: 24 },
  emptyText: { fontSize: 16, color: '#999', marginTop: 12 },
  emptyHint: { fontSize: 13, color: '#AAA', textAlign: 'center', marginTop: 8, lineHeight: 20 },
});
