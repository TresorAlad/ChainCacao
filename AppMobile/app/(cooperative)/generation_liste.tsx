import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Platform,
  Alert,
  ActivityIndicator,
  Image,
  ScrollView,
  Share,
} from 'react-native';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CoopBottomNav } from '@/components/CoopBottomNav';
import {
  myLotsApi,
  groupedListApi,
  qrcodeApi,
  getApiError,
  getApiBaseUrl,
  type BatchResponse,
} from '@/services/api';
import { canIncludeInGroupedList } from '@/utils/lot-status';
import {
  groupedListPartialSuccessMessage,
  isGroupedListPartialSuccess,
} from '@/utils/grouped-list-error';

function generateListId() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const r = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');
  return `LIST-${y}${m}${day}-${r}`;
}

interface LotRow {
  id: string;
  title: string;
  poids: number;
  date: string;
}

function toRow(b: BatchResponse): LotRow {
  const id = b.id ?? '';
  let date = '—';
  if (b.timestamp) {
    const d = new Date(b.timestamp);
    if (!Number.isNaN(d.getTime())) date = d.toLocaleDateString('fr-FR');
  }
  return {
    id,
    title: `${b.culture ?? 'Cacao'}${b.variete ? ` · ${b.variete}` : ''}`,
    poids: b.quantite ?? 0,
    date,
  };
}

export default function GenerationListeScreen() {
  const router = useRouter();
  const brandGreen = '#2E7D32';

  const [lots, setLots] = useState<LotRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [lastListId, setLastListId] = useState<string | null>(null);
  const [qrBase64, setQrBase64] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'error' | 'info'; text: string } | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  const loadLots = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await myLotsApi.list({ limit: 200 });
      const rows = (data.lots ?? [])
        .filter((b) => canIncludeInGroupedList(b.statut))
        .map(toRow)
        .filter((r) => r.id);
      setLots(rows);
    } catch (e) {
      Alert.alert('Erreur', getApiError(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadLots();
    }, [loadLots])
  );

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const filteredLots = lots.filter((l) => l.title.toLowerCase().includes(search.toLowerCase()) || l.id.toLowerCase().includes(search.toLowerCase()));

  const selectedLotsData = lots.filter((l) => selectedIds.includes(l.id));
  const poidsTotal = selectedLotsData.reduce((acc, curr) => acc + curr.poids, 0);

  const createList = async () => {
    if (selectedIds.length < 2) {
      const msg = 'Choisissez au moins 2 lots.';
      setStatusMessage({ type: 'error', text: msg });
      Alert.alert('Sélection', msg);
      return;
    }
    const listId = generateListId();
    setCreating(true);
    setStatusMessage({ type: 'info', text: 'Création en cours…' });
    const finishSuccess = async (id: string, title: string, message: string) => {
      setStatusMessage(null);
      setLastListId(id);
      setSelectedIds([]);
      setQrBase64(null);
      try {
        const qr = await qrcodeApi.getJson(id);
        setQrBase64(qr.data.qrcode_png_base64 ?? null);
      } catch {
        setQrBase64(null);
      }
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      Alert.alert(title, `${message}\n\nIdentifiant : ${id}`);
    };
    try {
      const { data } = await groupedListApi.create(listId, selectedIds);
      const id = data.list_id?.trim() || listId;
      await finishSuccess(id, 'Succès', `Liste créée sur la blockchain.`);
    } catch (e) {
      if (isGroupedListPartialSuccess(e)) {
        await finishSuccess(listId, 'Liste créée (avec avertissement)', groupedListPartialSuccessMessage(listId));
        return;
      }
      const msg = getApiError(e);
      setStatusMessage({ type: 'error', text: msg });
      Alert.alert('Erreur', msg);
    } finally {
      setCreating(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <MaterialCommunityIcons name="arrow-left" size={26} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Liste groupée</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView ref={scrollRef} style={styles.body} contentContainerStyle={styles.bodyContent}>
        {lastListId && (
          <View style={styles.successBox}>
            <Text style={styles.successTitle}>Liste créée — conservez cet identifiant</Text>
            <Text style={styles.successId}>{lastListId}</Text>
            <TouchableOpacity
              style={styles.copyBtn}
              onPress={async () => {
                try {
                  await Share.share({ message: lastListId, title: 'Identifiant liste groupée' });
                } catch {
                  Alert.alert('Identifiant', lastListId);
                }
              }}
            >
              <MaterialCommunityIcons name="content-copy" size={18} color="#2E7D32" />
              <Text style={styles.copyBtnText}>Partager l&apos;identifiant</Text>
            </TouchableOpacity>
            {qrBase64 ? (
              <Image
                source={{ uri: `data:image/png;base64,${qrBase64}` }}
                style={styles.qr}
                resizeMode="contain"
              />
            ) : (
              <ActivityIndicator color={brandGreen} style={{ marginVertical: 12 }} />
            )}
            <TouchableOpacity
              style={styles.payBtn}
              onPress={() =>
                router.push({
                  pathname: '/paiement-liste',
                  params: { listId: lastListId },
                } as never)
              }
            >
              <MaterialCommunityIcons name="cash-multiple" size={22} color="white" />
              <Text style={styles.payBtnText}>Payer cette liste</Text>
            </TouchableOpacity>
            <Text style={styles.qrHint}>
              Ou menu web « Payer liste groupée » avec l&apos;identifiant LIST-…
            </Text>
          </View>
        )}

        {statusMessage && (
          <View
            style={[
              styles.statusBanner,
              statusMessage.type === 'error' ? styles.statusBannerError : styles.statusBannerInfo,
            ]}
          >
            <Text
              style={[
                styles.statusBannerText,
                statusMessage.type === 'error' ? styles.statusBannerTextError : styles.statusBannerTextInfo,
              ]}
            >
              {statusMessage.text}
            </Text>
          </View>
        )}

        <View style={styles.searchBar}>
          <MaterialCommunityIcons name="magnify" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un lot…"
            value={search}
            onChangeText={setSearch}
            placeholderTextColor="#999"
          />
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={brandGreen} style={{ marginTop: 40 }} />
        ) : (
          <View style={styles.listWrap}>
          <FlatList
            scrollEnabled={false}
            data={filteredLots}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Aucun lot éligible.</Text>
                <Text style={styles.emptyHint}>
                  Confirmez d’abord la réception des lots en transit (Scanner ou onglet Lots → Transit), puis
                  revenez ici pour créer une liste groupée (minimum 2 lots).
                </Text>
              </View>
            }
            renderItem={({ item }) => {
              const isSelected = selectedIds.includes(item.id);
              return (
                <TouchableOpacity
                  style={[styles.card, isSelected && styles.cardSelected]}
                  onPress={() => toggleSelect(item.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <Text style={styles.cardSub}>
                      {item.id} · {item.date} · {item.poids} kg
                    </Text>
                  </View>
                  <MaterialCommunityIcons
                    name={isSelected ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'}
                    size={26}
                    color={isSelected ? brandGreen : '#CCC'}
                  />
                </TouchableOpacity>
              );
            }}
          />
          </View>
        )}
      </ScrollView>

      {selectedIds.length > 0 && (
        <View style={styles.selectionFrame}>
          <View style={styles.frameLeft}>
            <Text style={styles.frameText}>{selectedIds.length} lot(s)</Text>
            <Text style={styles.framePoids}>{poidsTotal} kg</Text>
          </View>
          <View style={styles.frameCenter}>
            <TouchableOpacity
              style={[styles.generateBtn, creating && styles.generateBtnDisabled]}
              onPress={() => void createList()}
              disabled={creating}
              activeOpacity={0.85}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              {creating ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <MaterialCommunityIcons name="check-all" size={22} color="white" />
                  <Text style={styles.generateBtnText}>Générer</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      <CoopBottomNav activeTab="lots" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#2E7D32' },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  headerTitle: { color: 'white', fontSize: 18, fontWeight: 'bold', textAlign: 'center' },
  headerBtn: { width: 40, alignItems: 'center' },
  body: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  bodyContent: { paddingTop: 10, paddingBottom: 180 },
  listWrap: { minHeight: 200 },
  successBox: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#E8F5E9',
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#2E7D32',
  },
  successTitle: { fontWeight: 'bold', color: '#2E7D32', fontSize: 15, textAlign: 'center' },
  successId: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 8,
    color: '#1B5E20',
    textAlign: 'center',
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2E7D32',
    backgroundColor: 'white',
  },
  copyBtnText: { marginLeft: 6, color: '#2E7D32', fontWeight: '600', fontSize: 13 },
  qr: { width: 200, height: 200, marginTop: 12 },
  payBtn: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2E7D32',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    width: '100%',
  },
  payBtnText: { color: 'white', fontWeight: 'bold', fontSize: 15, marginLeft: 8 },
  qrHint: { fontSize: 11, color: '#666', marginTop: 10, textAlign: 'center', lineHeight: 16 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginVertical: 15,
    paddingHorizontal: 15,
    borderRadius: 15,
    height: 50,
    elevation: 3,
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 15, color: '#333' },
  listContent: { paddingHorizontal: 20, paddingBottom: 150 },
  card: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 15,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 1,
  },
  cardSelected: { borderColor: '#2E7D32', borderWidth: 1.5, backgroundColor: '#F1F8E9' },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  cardSub: { fontSize: 12, color: '#666', marginTop: 4 },
  selectionFrame: {
    position: 'absolute',
    bottom: 90,
    left: 15,
    right: 15,
    backgroundColor: 'white',
    height: 80,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    elevation: 24,
    zIndex: 100,
  },
  statusBanner: {
    marginHorizontal: 20,
    marginBottom: 8,
    padding: 12,
    borderRadius: 12,
  },
  statusBannerError: { backgroundColor: '#FFEBEE' },
  statusBannerInfo: { backgroundColor: '#FFF8E1' },
  statusBannerText: { fontSize: 13, lineHeight: 18 },
  statusBannerTextError: { color: '#B71C1C' },
  statusBannerTextInfo: { color: '#E65100' },
  frameLeft: { flex: 1, justifyContent: 'center' },
  frameCenter: { flex: 2, alignItems: 'center', justifyContent: 'center' },
  frameText: { fontSize: 11, color: '#666' },
  framePoids: { fontSize: 16, fontWeight: 'bold', color: '#2E7D32' },
  generateBtn: {
    backgroundColor: '#2E7D32',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 15,
    minWidth: 140,
    justifyContent: 'center',
  },
  generateBtnDisabled: { opacity: 0.7 },
  generateBtnText: { color: 'white', marginLeft: 8, fontSize: 14, fontWeight: 'bold' },
  emptyContainer: { alignItems: 'center', marginTop: 80 },
  emptyText: { fontSize: 16, color: '#999', marginTop: 10 },
  emptyHint: { fontSize: 13, color: '#AAA', textAlign: 'center', marginTop: 10, lineHeight: 20, paddingHorizontal: 12 },
});
