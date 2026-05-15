import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Stack, useRouter, useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { myLotsApi, getApiError, type BatchResponse } from '@/services/api';
import { isEnTransit, mapStatut } from '@/utils/lot-status';

export default function LotsRecusScreen() {
  const router = useRouter();
  const [lots, setLots] = useState<BatchResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const { data } = await myLotsApi.list();
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

  const enTransit = lots.filter((b) => isEnTransit(b.statut));
  const autres = lots.filter((b) => !isEnTransit(b.statut));

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={28} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lots à réceptionner</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.body}>
        {error ? <Text style={styles.err}>{error}</Text> : null}
        {loading ? (
          <ActivityIndicator size="large" color="#2E7D32" style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={enTransit}
            keyExtractor={(item) => item.id}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />
            }
            ListHeaderComponent={
              <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 }}>
                <Text style={styles.intro}>
                  Après un transfert vers votre compte, le lot est en <Text style={{ fontWeight: '700' }}>transit</Text>{' '}
                  jusqu’à ce que vous confirmiez la réception physique (PIN).
                </Text>
                {autres.length > 0 ? (
                  <Text style={styles.subIntro}>
                    {autres.length} autre(s) lot(s) déjà réceptionné(s) ou sans transit — voir « Mes lots ».
                  </Text>
                ) : null}
              </View>
            }
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, flexGrow: 1 }}
            ListEmptyComponent={
              <View style={styles.empty}>
                <MaterialCommunityIcons name="truck-check-outline" size={48} color="#BDBDBD" />
                <Text style={styles.emptyTitle}>Aucun lot en transit</Text>
                <Text style={styles.emptyText}>
                  Lorsqu’un producteur ou partenaire vous transfère un lot, il apparaîtra ici pour confirmation.
                </Text>
              </View>
            }
            renderItem={({ item }) => {
              const id = item.id ?? '';
              const poids = item.quantite != null ? `${item.quantite} kg` : '—';
              return (
                <TouchableOpacity
                  style={styles.card}
                  onPress={() =>
                    router.push({
                      pathname: '/confirmer-reception-lot',
                      params: { lotId: id },
                    } as any)
                  }
                >
                  <View style={styles.cardInfo}>
                    <Text style={styles.lotName} numberOfLines={1}>
                      {id}
                    </Text>
                    <Text style={styles.detailText}>
                      {item.culture ?? 'Cacao'} · {poids} · {item.lieu ?? '—'}
                    </Text>
                    <View style={[styles.badgeTransit, { backgroundColor: mapStatut(item.statut).color }]}>
                      <Text style={[styles.badgeTransitText, { color: mapStatut(item.statut).textColor }]}>
                        {mapStatut(item.statut).label.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={24} color="#CCC" />
                </TouchableOpacity>
              );
            }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1B5E20' },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
  },
  headerTitle: { color: 'white', fontSize: 18, fontFamily: 'Montserrat-Bold' },
  body: { flex: 1, backgroundColor: '#F8F9FA', borderTopLeftRadius: 30, borderTopRightRadius: 30 },
  err: { color: '#C62828', padding: 16, fontSize: 14 },
  intro: { fontSize: 14, color: '#444', lineHeight: 20 },
  subIntro: { fontSize: 12, color: '#888', marginTop: 8 },
  card: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 15,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
  },
  cardInfo: { flex: 1 },
  lotName: { fontSize: 14, fontFamily: 'Montserrat-Bold', color: '#333' },
  detailText: { fontSize: 13, color: '#666', marginTop: 4 },
  badgeTransit: {
    alignSelf: 'flex-start',
    marginTop: 8,
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeTransitText: { fontSize: 11, fontWeight: '800', color: '#E65100' },
  empty: { alignItems: 'center', paddingTop: 48, paddingHorizontal: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#555', marginTop: 12 },
  emptyText: { fontSize: 14, color: '#888', textAlign: 'center', marginTop: 8, lineHeight: 20 },
});
