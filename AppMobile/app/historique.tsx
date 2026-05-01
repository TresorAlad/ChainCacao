import React, { useState, useEffect } from 'react';
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
import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
import { useLots } from '@/hooks/use-storage';
import { batchApi, HistoryEvent, getApiError, isNetworkError } from '@/services/api';

interface DisplayEvent {
  type: 'creation' | 'transfert' | 'transformation' | 'certification';
  date: string;
  acteur: string;
  detail: string;
  txHash?: string;
  source: 'blockchain' | 'local';
}

function parseBlockchainHistory(events: HistoryEvent[]): DisplayEvent[] {
  return events.map((e) => {
    const v = e.value || {};
    const statut = v.statut || '';
    let type: DisplayEvent['type'] = 'creation';
    if (statut === 'transféré') type = 'transfert';
    else if (statut === 'transformé') type = 'transformation';

    return {
      type,
      date: v.timestamp ? new Date(v.timestamp).toLocaleDateString('fr-FR') : '—',
      acteur: v.proprietaireID || v.orgID || 'Inconnu',
      detail: `${v.culture || '—'} · ${v.quantite || 0} kg · ${v.lieu || '—'}`,
      txHash: e.txId,
      source: 'blockchain',
    };
  });
}

export default function HistoriqueScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { lots } = useLots();

  const [searchId, setSearchId] = useState((params.lotId as string) || '');
  const [events, setEvents] = useState<DisplayEvent[]>([]);
  const [lotTitle, setLotTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [fromBlockchain, setFromBlockchain] = useState(false);

  useEffect(() => {
    if (params.lotId) handleSearch(params.lotId as string);
  }, [params.lotId]);

  const handleSearch = async (id?: string) => {
    const query = (id || searchId).trim();
    if (!query) {
      Alert.alert('Champ vide', 'Veuillez saisir un identifiant de lot.');
      return;
    }
    setLoading(true);
    setSearched(true);
    setEvents([]);
    setFromBlockchain(false);

    // 1. Essayer l'API publique d'abord (GET /api/v1/verify/:id)
    try {
      const { data } = await batchApi.verify(query);
      if (data && data.length > 0) {
        setEvents(parseBlockchainHistory(data));
        setFromBlockchain(true);
        setLotTitle(data[0]?.value?.culture || query);
        setLoading(false);
        return;
      }
    } catch (e) {
      if (!isNetworkError(e)) {
        // Lot non trouvé sur la blockchain → chercher en local
      }
    }

    // 2. Fallback : chercher dans AsyncStorage
    const lot = lots.find(
      l =>
        l.id === query ||
        l.title.toLowerCase() === query.toLowerCase() ||
        l.title.toLowerCase().includes(query.toLowerCase())
    );

    if (lot) {
      setLotTitle(lot.title);
      const localEvents: DisplayEvent[] = [
        {
          type: 'creation',
          date: lot.date,
          acteur: 'Agriculteur (local)',
          detail: `${lot.poids} kg${lot.typeCacao ? ` de ${lot.typeCacao}` : ''}`,
          txHash: undefined,
          source: 'local',
        },
      ];
      if (lot.destination && lot.destination !== 'Non définie') {
        localEvents.push({
          type: 'transfert',
          date: lot.date,
          acteur: lot.acheteur || 'En transit',
          detail: `Destination : ${lot.destination}`,
          source: 'local',
        });
      }
      setEvents(localEvents);
    }

    setLoading(false);
  };

  const eventConfig: Record<DisplayEvent['type'], { icon: string; color: string; label: string }> = {
    creation: { icon: 'sprout', color: '#2E7D32', label: 'Création' },
    transfert: { icon: 'truck-delivery', color: '#1565C0', label: 'Transfert' },
    transformation: { icon: 'cog', color: '#6A1B9A', label: 'Transformation' },
    certification: { icon: 'shield-check', color: '#00695C', label: 'Certification' },
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      <LinearGradient colors={['#1B5E20', '#2E7D32', '#43A047']} style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={28} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Historique du lot</Text>
        <View style={{ width: 38 }} />
      </LinearGradient>

      <View style={styles.body}>
        <View style={styles.searchSection}>
          <Text style={styles.searchLabel}>Identifiant du lot</Text>
          <View style={styles.searchRow}>
            <TextInput
              style={styles.searchInput}
              placeholder="UUID du lot ou référence"
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
            <MaterialCommunityIcons name="lock-open" size={12} color="#666" /> Accès public — aucune authentification requise
          </Text>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2E7D32" />
              <Text style={styles.loadingText}>Interrogation de la blockchain…</Text>
            </View>
          )}

          {!loading && searched && events.length === 0 && (
            <View style={styles.notFoundContainer}>
              <MaterialCommunityIcons name="alert-circle-outline" size={70} color="#CCC" />
              <Text style={styles.notFoundTitle}>Lot introuvable</Text>
              <Text style={styles.notFoundDesc}>
                Aucun lot correspondant à "{searchId}" n'a été trouvé sur la blockchain ni en local.
              </Text>
            </View>
          )}

          {!loading && events.length > 0 && (
            <>
              {/* En-tête lot */}
              <View style={styles.lotCard}>
                <Text style={styles.lotCardTitle}>{lotTitle || searchId}</Text>
                {fromBlockchain ? (
                  <View style={styles.blockchainBadge}>
                    <MaterialCommunityIcons name="check-decagram" size={15} color="#2E7D32" />
                    <Text style={styles.blockchainBadgeText}>Certifié Hyperledger Fabric</Text>
                  </View>
                ) : (
                  <View style={[styles.blockchainBadge, { backgroundColor: '#FFF8E1' }]}>
                    <MaterialCommunityIcons name="clock-outline" size={15} color="#F9A825" />
                    <Text style={[styles.blockchainBadgeText, { color: '#F57F17' }]}>
                      Données locales — en attente de confirmation
                    </Text>
                  </View>
                )}
              </View>

              {/* Source badge */}
              <View style={styles.sourceRow}>
                <MaterialCommunityIcons
                  name={fromBlockchain ? 'link-variant' : 'database-outline'}
                  size={14}
                  color="#999"
                />
                <Text style={styles.sourceText}>
                  Source : {fromBlockchain ? 'Ledger Fabric via GET /api/v1/verify/:id' : 'Stockage local'}
                </Text>
              </View>

              <Text style={styles.timelineTitle}>Frise chronologique</Text>
              {events.map((event, index) => {
                const cfg = eventConfig[event.type];
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
                      <Text style={styles.timelineDate}>{event.date} · {event.acteur}</Text>
                      {event.txHash && (
                        <View style={styles.hashRow}>
                          <MaterialCommunityIcons name="link" size={12} color="#999" />
                          <Text style={styles.hashText} numberOfLines={1}>
                            {event.txHash}
                          </Text>
                        </View>
                      )}
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
