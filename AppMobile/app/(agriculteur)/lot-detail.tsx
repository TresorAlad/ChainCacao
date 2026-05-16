import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Linking,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';

import {
  batchApi,
  getApiError,
  unwrapLotFromResponse,
  type BatchResponse,
} from '@/services/api';
import { parseTimelineEvents, type TimelineDisplayEvent } from '@/utils/historiqueTimeline';
import { mapStatut } from '@/utils/lot-status';
import { AG } from '@/lib/agriculteur-routes';

function firstParam(v: string | string[] | undefined): string {
  if (v === undefined || v === null) return '';
  return Array.isArray(v) ? String(v[0] ?? '').trim() : String(v).trim();
}

/** Transfert possible tant que le lot n’est pas déjà envoyé (en transit / payé / exporté). */
function canAgriculteurTransfer(statut?: string | null): boolean {
  const s = String(statut ?? '').toLowerCase();
  if (!s || s === 'cree') return true;
  return false;
}

const TIMELINE_ICONS: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
  creation: 'seed-plus',
  transfert: 'truck-delivery',
  reception: 'package-check',
  paiement: 'cash-multiple',
  transformation: 'factory',
  export: 'earth',
  maj_poids: 'scale-balance',
  other: 'timeline-clock-outline',
};

export default function LotDetailAgriculteurScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const lotId = firstParam(params.lotId as string | string[] | undefined);

  const [lot, setLot] = useState<BatchResponse | null>(null);
  const [events, setEvents] = useState<TimelineDisplayEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!lotId) {
      setError('Identifiant de lot manquant');
      setLoading(false);
      return;
    }
    setError(null);
    try {
      const [lotRes, histRes] = await Promise.all([
        batchApi.get(lotId),
        batchApi.history(lotId),
      ]);
      const body = unwrapLotFromResponse(lotRes.data);
      if (!body?.id) {
        setLot(null);
        setError('Lot introuvable sur le serveur');
        return;
      }
      setLot(body);
      setEvents(parseTimelineEvents(histRes.data.events ?? []));
    } catch (e) {
      setError(getApiError(e));
      setLot(null);
      setEvents([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [lotId]);

  useEffect(() => {
    void load();
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    void load();
  };

  const statutUi = mapStatut(lot?.statut);
  const showTransfer = lot ? canAgriculteurTransfer(lot.statut) : false;

  const openMaps = () => {
    if (lot?.latitude == null || lot?.longitude == null) {
      Alert.alert('Position', 'Coordonnées GPS non disponibles pour ce lot.');
      return;
    }
    const url = `https://www.google.com/maps?q=${lot.latitude},${lot.longitude}`;
    void Linking.openURL(url);
  };

  if (!lotId) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.centered}>
          <Text style={styles.errText}>Aucun lot sélectionné.</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => router.replace(AG.meslots as any)}>
            <Text style={styles.primaryBtnText}>Mes lots</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      <LinearGradient colors={['#1B5E20', '#2E7D32', '#43A047']} style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} accessibilityRole="button">
          <MaterialCommunityIcons name="arrow-left" size={26} color="white" />
        </TouchableOpacity>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {lot?.id ?? lotId}
          </Text>
          <Text style={styles.headerSub} numberOfLines={1}>
            {lot ? `${lot.culture ?? 'Lot'}${lot.variete ? ` · ${lot.variete}` : ''}` : 'Chargement…'}
          </Text>
        </View>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.push(AG.qrLot(lotId) as any)}>
          <MaterialCommunityIcons name="qrcode" size={24} color="white" />
        </TouchableOpacity>
      </LinearGradient>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#2E7D32" />
          <Text style={styles.loadingHint}>Chargement du lot et de l’historique…</Text>
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <MaterialCommunityIcons name="alert-circle-outline" size={48} color="#C62828" />
          <Text style={styles.errText}>{error}</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => void load()}>
            <Text style={styles.primaryBtnText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      ) : lot ? (
        <ScrollView
          style={styles.body}
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2E7D32']} />}
        >
          <View style={styles.card}>
            <View style={styles.rowBetween}>
              <Text style={styles.cardTitle}>Informations</Text>
              <View style={[styles.badge, { backgroundColor: statutUi.color }]}>
                <Text style={[styles.badgeText, { color: statutUi.textColor }]}>{statutUi.label}</Text>
              </View>
            </View>
            <InfoRow icon="weight-kilogram" label="Poids" value={`${lot.quantite ?? '—'} kg`} />
            <InfoRow icon="calendar" label="Récolte" value={lot.date_recolte ?? '—'} />
            <InfoRow icon="map-marker" label="Lieu" value={lot.lieu ?? '—'} />
            {lot.region ? <InfoRow icon="earth" label="Région" value={lot.region} /> : null}
            {lot.notes ? <InfoRow icon="note-text" label="Notes / variété" value={lot.notes} /> : null}
            {lot.latitude != null && lot.longitude != null ? (
              <TouchableOpacity onPress={openMaps} style={styles.mapLink}>
                <MaterialCommunityIcons name="crosshairs-gps" size={18} color="#2E7D32" />
                <Text style={styles.mapLinkText}>
                  {lot.latitude.toFixed(5)}, {lot.longitude.toFixed(5)} — Ouvrir la carte
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>

          <Text style={styles.sectionTitle}>Actions</Text>
          <View style={styles.actionsRow}>
            {showTransfer ? (
              <ActionChip
                icon="truck-delivery"
                label="Transférer"
                onPress={() => router.push(AG.transfertLot(lotId) as any)}
              />
            ) : (
              <View style={[styles.actionChip, styles.actionChipDisabled]}>
                <MaterialCommunityIcons name="truck-delivery-outline" size={22} color="#999" />
                <Text style={styles.actionChipTextDisabled}>Transfert indisponible</Text>
              </View>
            )}
            <ActionChip
              icon="qrcode"
              label="QR code"
              onPress={() => router.push(AG.qrLot(lotId) as any)}
            />
            <ActionChip
              icon="cash"
              label="Paiement"
              onPress={() => router.push(AG.paiementLot(lotId) as any)}
            />
          </View>

          <View style={styles.card}>
            <View style={styles.rowBetween}>
              <Text style={styles.cardTitle}>Suivi & historique</Text>
              <TouchableOpacity onPress={() => router.push(AG.historiqueLot(lotId) as any)}>
                <Text style={styles.linkText}>Plein écran</Text>
              </TouchableOpacity>
            </View>
            {events.length === 0 ? (
              <Text style={styles.emptyTimeline}>Aucun événement enregistré pour l’instant.</Text>
            ) : (
              events.map((ev, idx) => (
                <View key={`${ev.type}-${idx}-${ev.date}`} style={styles.timelineRow}>
                  <View style={styles.timelineIconWrap}>
                    <MaterialCommunityIcons
                      name={TIMELINE_ICONS[ev.type] ?? 'circle-small'}
                      size={22}
                      color="#2E7D32"
                    />
                  </View>
                  <View style={styles.timelineBody}>
                    <Text style={styles.timelineType}>{ev.type.replace(/_/g, ' ')}</Text>
                    <Text style={styles.timelineDetail} numberOfLines={3}>
                      {ev.detail}
                    </Text>
                    <Text style={styles.timelineMeta}>
                      {ev.date} · {ev.acteur}
                    </Text>
                    {ev.txHash ? (
                      <Text style={styles.timelineTx} numberOfLines={1}>
                        Tx: {ev.txHash}
                      </Text>
                    ) : null}
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      ) : null}
    </SafeAreaView>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoRow}>
      <MaterialCommunityIcons name={icon} size={18} color="#666" />
      <View style={styles.infoText}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

function ActionChip({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.actionChip} onPress={onPress} activeOpacity={0.85}>
      <MaterialCommunityIcons name={icon} size={24} color="#1B5E20" />
      <Text style={styles.actionChipText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1B5E20' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  backBtn: { padding: 8 },
  headerTextWrap: { flex: 1, paddingHorizontal: 4 },
  headerTitle: { color: 'white', fontSize: 16, fontWeight: '700' },
  headerSub: { color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 2 },
  body: { flex: 1, backgroundColor: '#F5F5F5' },
  scrollContent: { padding: 16, paddingBottom: 32 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#F5F5F5' },
  loadingHint: { marginTop: 12, color: '#666', fontSize: 14 },
  errText: { color: '#333', textAlign: 'center', marginVertical: 12, fontSize: 15 },
  primaryBtn: {
    backgroundColor: '#2E7D32',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 8,
  },
  primaryBtnText: { color: 'white', fontWeight: '700' },
  card: {
    backgroundColor: 'white',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#1B5E20' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 12 },
  infoText: { flex: 1 },
  infoLabel: { fontSize: 11, color: '#888', textTransform: 'uppercase' },
  infoValue: { fontSize: 15, color: '#333', marginTop: 2 },
  mapLink: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#EEE' },
  mapLinkText: { color: '#2E7D32', fontSize: 13, fontWeight: '600', flex: 1 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#555', marginBottom: 8, marginLeft: 4 },
  actionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
  actionChip: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  actionChipDisabled: { backgroundColor: '#F5F5F5', borderColor: '#E0E0E0' },
  actionChipText: { marginTop: 6, fontSize: 12, fontWeight: '700', color: '#1B5E20' },
  actionChipTextDisabled: { marginTop: 6, fontSize: 11, color: '#999', textAlign: 'center' },
  linkText: { color: '#2E7D32', fontSize: 13, fontWeight: '600' },
  emptyTimeline: { color: '#888', fontSize: 14, marginTop: 8 },
  timelineRow: { flexDirection: 'row', marginTop: 14 },
  timelineIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  timelineBody: { flex: 1 },
  timelineType: { fontSize: 13, fontWeight: '700', color: '#1B5E20', textTransform: 'capitalize' },
  timelineDetail: { fontSize: 13, color: '#444', marginTop: 4 },
  timelineMeta: { fontSize: 11, color: '#888', marginTop: 4 },
  timelineTx: { fontSize: 10, color: '#2E7D32', marginTop: 2, fontFamily: 'monospace' },
});
