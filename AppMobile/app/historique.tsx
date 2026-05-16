import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, Stack, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useAuth } from '@/hooks/use-auth';
import { useLots } from '@/hooks/use-storage';
import { batchApi, isNetworkError, myLotsApi, type BatchResponse } from '@/services/api';
import { mapStatut } from '@/utils/lot-status';
import {
  eventsFromVerifyResponse,
  parseTimelineEvents,
  type TimelineDisplayEvent,
} from '@/utils/historiqueTimeline';
import type { Lot } from '@/hooks/use-storage';

function firstParam(v: string | string[] | undefined): string {
  if (v === undefined || v === null) return '';
  return Array.isArray(v) ? String(v[0] ?? '').trim() : String(v).trim();
}

type LotFilter = 'all' | 'owned' | 'transferred';

type ServerLotPick = {
  id: string;
  title: string;
  subtitle: string;
  statutLabel: string;
  isTransferredAway: boolean;
};

export default function HistoriqueScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { lots } = useLots();
  const { isAuthenticated, user } = useAuth();

  const lotIdFromRoute = firstParam(params.lotId as string | string[] | undefined);

  const [searchId, setSearchId] = useState(lotIdFromRoute);
  const [serverLots, setServerLots] = useState<ServerLotPick[]>([]);
  const [serverLotsLoading, setServerLotsLoading] = useState(false);
  const [lotFilter, setLotFilter] = useState<LotFilter>('all');
  const [events, setEvents] = useState<TimelineDisplayEvent[]>([]);
  const [lotTitle, setLotTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [fromBlockchain, setFromBlockchain] = useState(false);

  const handleSearch = useCallback(async (id?: string) => {
    const rawQuery = (id ?? searchId).trim();
    if (!rawQuery) {
      Alert.alert('Champ vide', 'Veuillez saisir un identifiant de lot ou scanner un QR.');
      return;
    }

    const localMatch = lots.find(
      (l) =>
        l.id === rawQuery ||
        l.title.toLowerCase() === rawQuery.toLowerCase()
    );
    const blockchainId = localMatch?.id ? localMatch.id : rawQuery;

    setLoading(true);
    setSearched(true);
    setEvents([]);
    setFromBlockchain(false);

    let verifyNetworkError = false;

    // 1. API publique GET /api/v1/verify/:id → { lot, timeline, ... }
    try {
      const { data } = await batchApi.verify(blockchainId);
      const timelineEvents = eventsFromVerifyResponse(data);
      if (timelineEvents && data.lot) {
        const title =
          (data.lot.notes && String(data.lot.notes).trim()) ||
          data.lot.culture ||
          rawQuery;
        setLotTitle(title);
        setFromBlockchain(true);
        setEvents(timelineEvents);
        setLoading(false);
        return;
      }
    } catch (e) {
      verifyNetworkError = isNetworkError(e);
    }

    // 2. Historique authentifié (lot connu côté serveur)
    try {
      const histRes = await batchApi.history(blockchainId);
      const rawEvents = histRes.data.events ?? [];
      if (rawEvents.length > 0) {
        setLotTitle(rawQuery);
        setFromBlockchain(true);
        setEvents(parseTimelineEvents(rawEvents));
        setLoading(false);
        return;
      }
    } catch (e2) {
      if (isNetworkError(e2)) verifyNetworkError = true;
    }

    if (verifyNetworkError) {
      Alert.alert(
        'Connexion requise',
        'Impossible de joindre le serveur pour afficher l’historique. Réessayez plus tard.'
      );
    } else {
      Alert.alert('Lot introuvable', 'Aucun historique pour cet identifiant.');
    }

    setLoading(false);
  }, [searchId, lots]);

  useEffect(() => {
    const next = lotIdFromRoute;
    if (next) setSearchId(next);
  }, [lotIdFromRoute]);

  const loadServerLots = useCallback(async () => {
    if (!isAuthenticated) {
      setServerLots([]);
      return;
    }
    const actorId = (user?.id ?? '').trim();
    setServerLotsLoading(true);
    try {
      const { data } = await myLotsApi.list({ limit: 200 });
      const picks = (data.lots ?? []).map((b: BatchResponse) => {
        const st = mapStatut(b.statut);
        const ownerId = (b.proprietaire_id ?? '').trim();
        const isTransferredAway = Boolean(actorId && ownerId && ownerId !== actorId);
        return {
          id: b.id ?? '',
          title: b.id ?? '—',
          subtitle: `${b.culture ?? '—'} · ${b.quantite ?? '—'} kg · ${b.lieu ?? '—'}`,
          statutLabel: isTransferredAway ? `${st.label} · Transféré` : st.label,
          isTransferredAway,
        };
      });
      setServerLots(picks.filter((p) => p.id));
    } catch {
      setServerLots([]);
    } finally {
      setServerLotsLoading(false);
    }
  }, [isAuthenticated, user?.id]);

  useFocusEffect(
    useCallback(() => {
      void loadServerLots();
    }, [loadServerLots])
  );

  const filteredServerLots = useMemo(() => {
    if (lotFilter === 'owned') return serverLots.filter((l) => !l.isTransferredAway);
    if (lotFilter === 'transferred') return serverLots.filter((l) => l.isTransferredAway);
    return serverLots;
  }, [serverLots, lotFilter]);

  useEffect(() => {
    if (!lotIdFromRoute) return;
    void handleSearch(lotIdFromRoute);
    // Dépendre de `lots` pour rejouer la recherche une fois les lots chargés depuis AsyncStorage.
    // Ne pas dépendre de `handleSearch` (refait à chaque frappe dans searchId).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lotIdFromRoute, lots]);

  const openLotHistoryById = useCallback(
    (id: string) => {
      setSearchId(id);
      void handleSearch(id);
    },
    [handleSearch]
  );

  const openLotHistory = useCallback(
    (lot: Lot) => {
      openLotHistoryById(lot.id);
    },
    [openLotHistoryById]
  );

  const eventConfig: Record<
    TimelineDisplayEvent['type'],
    { icon: string; color: string; label: string }
  > = {
    creation: { icon: 'sprout', color: '#2E7D32', label: 'Création' },
    transfert: { icon: 'truck-delivery', color: '#1565C0', label: 'Transfert / transit' },
    reception: { icon: 'package-check', color: '#00897B', label: 'Réception confirmée' },
    paiement: { icon: 'cash-multiple', color: '#E65100', label: 'Paiement' },
    transformation: { icon: 'cog', color: '#6A1B9A', label: 'Transformation' },
    certification: { icon: 'shield-check', color: '#00695C', label: 'Certification' },
    export: { icon: 'airplane', color: '#5E35B1', label: 'Export' },
    maj_poids: { icon: 'weight-kilogram', color: '#546E7A', label: 'Mise à jour du poids' },
    other: { icon: 'timeline-text-outline', color: '#78909C', label: 'Événement' },
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      <LinearGradient colors={['#1B5E20', '#2E7D32', '#43A047']} style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={28} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Historique des lots</Text>
        <View style={{ width: 38 }} />
      </LinearGradient>

      <View style={styles.body}>
        <View style={styles.searchSection}>
          <Text style={styles.searchLabel}>Identifiant du lot</Text>
          <View style={styles.searchRow}>
            <TextInput
              style={styles.searchInput}
              placeholder="UUID, référence LOT-… ou coller l’URL du QR"
              value={searchId}
              onChangeText={setSearchId}
              autoCapitalize="none"
              returnKeyType="search"
              onSubmitEditing={() => handleSearch()}
            />
            <TouchableOpacity style={styles.searchBtn} onPress={() => handleSearch()}>
              <MaterialCommunityIcons name="magnify" size={24} color="white" />
            </TouchableOpacity>
          </View>
          <Text style={styles.publicNote}>
            <MaterialCommunityIcons name="lock-open" size={12} color="#666" /> Vérification
            publique — aucune connexion obligatoire
          </Text>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {isAuthenticated && (serverLotsLoading || serverLots.length > 0) ? (
            <View style={styles.myLotsSection}>
              <Text style={styles.myLotsTitle}>
                Mes lots {user?.role ? `(${user.role})` : ''}
              </Text>
              <Text style={styles.myLotsSubtitle}>
                Les lots transférés restent visibles pour la traçabilité (création, envoi, réception).
              </Text>
              <View style={styles.filterRow}>
                {(
                  [
                    { key: 'all' as const, label: 'Tous' },
                    { key: 'owned' as const, label: 'En ma possession' },
                    { key: 'transferred' as const, label: 'Transférés' },
                  ] as const
                ).map((f) => (
                  <TouchableOpacity
                    key={f.key}
                    style={[styles.filterChip, lotFilter === f.key && styles.filterChipActive]}
                    onPress={() => setLotFilter(f.key)}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        lotFilter === f.key && styles.filterChipTextActive,
                      ]}
                    >
                      {f.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {serverLotsLoading ? (
                <ActivityIndicator color="#2E7D32" style={{ marginVertical: 12 }} />
              ) : null}
              {!serverLotsLoading && filteredServerLots.length === 0 ? (
                <Text style={styles.emptyFilterText}>
                  {lotFilter === 'transferred'
                    ? 'Aucun lot transféré listé. Après un nouveau transfert (API à jour), ils apparaîtront ici.'
                    : 'Aucun lot pour ce filtre.'}
                </Text>
              ) : null}
              {filteredServerLots.map((lot) => (
                <TouchableOpacity
                  key={lot.id}
                  style={[
                    styles.lotPickRow,
                    lot.isTransferredAway && styles.lotPickRowTransferred,
                  ]}
                  onPress={() => openLotHistoryById(lot.id)}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons
                    name={lot.isTransferredAway ? 'truck-check' : 'timeline-text-outline'}
                    size={22}
                    color={lot.isTransferredAway ? '#1565C0' : '#2E7D32'}
                  />
                  <View style={styles.lotPickTexts}>
                    <Text style={styles.lotPickTitle}>{lot.title}</Text>
                    <Text style={styles.lotPickSub}>{lot.subtitle}</Text>
                    <Text style={styles.lotPickStatut}>{lot.statutLabel}</Text>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={20} color="#CCC" />
                </TouchableOpacity>
              ))}
            </View>
          ) : null}

          {lots.length > 0 && (
            <View style={styles.myLotsSection}>
              <Text style={styles.myLotsTitle}>Lots sur l&apos;appareil</Text>
              <Text style={styles.myLotsSubtitle}>
                Lots locaux (hors ligne ou en attente de synchro).
              </Text>
              {lots.map((lot) => (
                <TouchableOpacity
                  key={lot.id}
                  style={styles.lotPickRow}
                  onPress={() => openLotHistory(lot)}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons
                    name={lot.synced ? 'check-circle' : 'clock-outline'}
                    size={22}
                    color={lot.synced ? '#2E7D32' : '#F9A825'}
                  />
                  <View style={styles.lotPickTexts}>
                    <Text style={styles.lotPickTitle}>{lot.title}</Text>
                    <Text style={styles.lotPickSub}>
                      {lot.date} · {lot.poids} kg
                      {lot.synced ? '' : ' · en attente synchro'}
                    </Text>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={20} color="#CCC" />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {lots.length === 0 && !searched && !loading && (
            <View style={styles.emptyHint}>
              <MaterialCommunityIcons name="information-outline" size={40} color="#90A4AE" />
              <Text style={styles.emptyHintText}>
                Aucun lot sur cet appareil. Créez un lot depuis l’accueil, ou saisissez un identifiant /
                URL de vérification ci-dessus.
              </Text>
            </View>
          )}

          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2E7D32" />
              <Text style={styles.loadingText}>Chargement de l’historique…</Text>
            </View>
          )}

          {!loading && searched && events.length === 0 && (
            <View style={styles.notFoundContainer}>
              <MaterialCommunityIcons name="alert-circle-outline" size={70} color="#CCC" />
              <Text style={styles.notFoundTitle}>Lot introuvable</Text>
              <Text style={styles.notFoundDesc}>
                Aucune donnée pour « {searchId} ». Utilisez l’UUID du lot (visible après synchro
                blockchain), ou scannez le QR qui pointe vers /verify/&lt;id&gt;.
              </Text>
            </View>
          )}

          {!loading && events.length > 0 && (
            <>
              <View style={styles.lotCard}>
                <Text style={styles.lotCardTitle}>{lotTitle || searchId}</Text>
                {fromBlockchain ? (
                  <View style={styles.blockchainBadge}>
                    <MaterialCommunityIcons name="check-decagram" size={15} color="#2E7D32" />
                    <Text style={styles.blockchainBadgeText}>Piste Hyperledger Fabric</Text>
                  </View>
                ) : (
                  <View style={[styles.blockchainBadge, { backgroundColor: '#FFF8E1' }]}>
                    <MaterialCommunityIcons name="clock-outline" size={15} color="#F9A825" />
                    <Text style={[styles.blockchainBadgeText, { color: '#F57F17' }]}>
                      Données locales sur cet appareil
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.sourceRow}>
                <MaterialCommunityIcons
                  name={fromBlockchain ? 'link-variant' : 'database-outline'}
                  size={14}
                  color="#999"
                />
                <Text style={styles.sourceText}>
                  Source : {fromBlockchain ? 'API ChainCacao (blockchain)' : 'Stockage local'}
                </Text>
              </View>

              <Text style={styles.timelineTitle}>Frise chronologique</Text>
              {events.map((event, index) => {
                const cfg = eventConfig[event.type] ?? eventConfig.other;
                return (
                  <View key={index} style={styles.timelineItem}>
                    <View style={styles.timelineLeft}>
                      <View style={[styles.timelineDot, { backgroundColor: cfg.color }]}>
                        <MaterialCommunityIcons name={cfg.icon as any} size={16} color="white" />
                      </View>
                      {index < events.length - 1 && <View style={styles.timelineLine} />}
                    </View>
                    <View style={styles.timelineContent}>
                      <View style={styles.timelineTopRow}>
                        <Text style={[styles.timelineType, { color: cfg.color }]}>{cfg.label}</Text>
                        {event.source === 'local' && (
                          <View style={styles.localTag}>
                            <Text style={styles.localTagText}>local</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.timelineDetail}>{event.detail}</Text>
                      <Text style={styles.timelineDate}>
                        {event.date} · Acteur : {event.acteur}
                      </Text>
                      {event.txHash ? (
                        <View style={styles.hashRow}>
                          <MaterialCommunityIcons name="link" size={12} color="#999" />
                          <Text style={styles.hashText} numberOfLines={2}>
                            {event.txHash}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                );
              })}
            </>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1B5E20' },
  header: {
    height: 70,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  headerTitle: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  backBtn: { padding: 5 },
  body: { flex: 1, backgroundColor: '#F8F9FA', borderTopLeftRadius: 30, borderTopRightRadius: 30 },
  searchSection: { padding: 20, paddingBottom: 5 },
  searchLabel: { fontSize: 13, fontWeight: 'bold', color: '#555', marginBottom: 8, textTransform: 'uppercase' },
  searchRow: { flexDirection: 'row' },
  searchInput: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginRight: 10,
  },
  searchBtn: {
    backgroundColor: '#2E7D32',
    borderRadius: 12,
    width: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  publicNote: { fontSize: 12, color: '#999', marginTop: 8 },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  myLotsSection: { marginBottom: 16 },
  myLotsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1B5E20',
    marginBottom: 4,
  },
  myLotsSubtitle: { fontSize: 13, color: '#666', marginBottom: 12, lineHeight: 18 },
  lotPickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    gap: 12,
  },
  lotPickTexts: { flex: 1 },
  lotPickTitle: { fontSize: 16, fontWeight: '600', color: '#333' },
  lotPickSub: { fontSize: 13, color: '#888', marginTop: 2 },
  lotPickStatut: { fontSize: 11, color: '#2E7D32', fontWeight: '700', marginTop: 4 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#EEE',
  },
  filterChipActive: { backgroundColor: '#2E7D32' },
  filterChipText: { fontSize: 11, fontWeight: '600', color: '#666' },
  filterChipTextActive: { color: '#FFF' },
  lotPickRowTransferred: { borderLeftWidth: 3, borderLeftColor: '#1565C0' },
  emptyFilterText: { fontSize: 12, color: '#888', marginVertical: 8, lineHeight: 18 },
  emptyHint: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  emptyHintText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 22,
  },
  loadingContainer: { alignItems: 'center', marginTop: 60 },
  loadingText: { color: '#999', marginTop: 12, fontSize: 14 },
  notFoundContainer: { alignItems: 'center', marginTop: 60 },
  notFoundTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginTop: 15 },
  notFoundDesc: { fontSize: 14, color: '#666', textAlign: 'center', marginTop: 8, lineHeight: 22 },
  lotCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 18,
    marginBottom: 10,
    elevation: 3,
  },
  lotCardTitle: { fontSize: 18, fontWeight: 'bold', color: '#1B5E20', marginBottom: 10 },
  blockchainBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    gap: 6,
  },
  blockchainBadgeText: { fontSize: 12, color: '#2E7D32', fontWeight: '600' },
  sourceRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 15 },
  sourceText: { fontSize: 11, color: '#999' },
  timelineTitle: { fontSize: 15, fontWeight: 'bold', color: '#333', marginBottom: 12 },
  timelineItem: { flexDirection: 'row', marginBottom: 5 },
  timelineLeft: { alignItems: 'center', marginRight: 14, width: 36 },
  timelineDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineLine: { width: 2, flex: 1, backgroundColor: '#E0E0E0', marginTop: 4, marginBottom: 4 },
  timelineContent: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    elevation: 1,
  },
  timelineTopRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4, gap: 8 },
  timelineType: { fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' },
  localTag: {
    backgroundColor: '#E3F2FD',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  localTagText: { fontSize: 10, color: '#1565C0', fontWeight: 'bold' },
  timelineDetail: { fontSize: 15, color: '#333', fontWeight: '500' },
  timelineDate: { fontSize: 12, color: '#999', marginTop: 4 },
  hashRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 4 },
  hashText: { fontSize: 11, color: '#999', fontFamily: 'monospace', flex: 1 },
});
