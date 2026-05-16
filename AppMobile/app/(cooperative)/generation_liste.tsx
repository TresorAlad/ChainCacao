import React, { useCallback, useState } from 'react';
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
      Alert.alert('Sélection', 'Choisissez au moins 2 lots.');
      return;
    }
    const listId = generateListId();
    setCreating(true);
    try {
      await groupedListApi.create(listId, selectedIds);
      setLastListId(listId);
      setSelectedIds([]);
      try {
        const qr = await qrcodeApi.getJson(listId);
        setQrBase64(qr.data.qrcode_png_base64 ?? null);
      } catch {
        setQrBase64(null);
      }
      Alert.alert('Succès', `Liste ${listId} créée sur la blockchain.`);
    } catch (e) {
      Alert.alert('Erreur', getApiError(e));
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

      <View style={styles.body}>
        {lastListId && (
          <View style={styles.successBox}>
            <Text style={styles.successTitle}>Liste créée</Text>
            <Text style={styles.successId}>{lastListId}</Text>
            {qrBase64 ? (
              <Image
                source={{ uri: `data:image/png;base64,${qrBase64}` }}
                style={styles.qr}
                resizeMode="contain"
              />
            ) : (
              <Text style={styles.qrHint}>{getApiBaseUrl()}/qrcode/{lastListId}</Text>
            )}
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
          <FlatList
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
        )}
      </View>

      {selectedIds.length > 0 && (
        <View style={styles.selectionFrame}>
          <View style={styles.frameLeft}>
            <Text style={styles.frameText}>{selectedIds.length} lot(s)</Text>
            <Text style={styles.framePoids}>{poidsTotal} kg</Text>
          </View>
          <View style={styles.frameCenter}>
            <TouchableOpacity style={styles.generateBtn} onPress={createList} disabled={creating}>
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
    paddingTop: 10,
  },
  successBox: {
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    alignItems: 'center',
  },
  successTitle: { fontWeight: 'bold', color: '#2E7D32' },
  successId: { fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', fontSize: 12, marginTop: 4 },
  qr: { width: 160, height: 160, marginTop: 8 },
  qrHint: { fontSize: 10, color: '#666', marginTop: 8, textAlign: 'center' },
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
    elevation: 10,
  },
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
  },
  generateBtnText: { color: 'white', marginLeft: 8, fontSize: 14, fontWeight: 'bold' },
  emptyContainer: { alignItems: 'center', marginTop: 80 },
  emptyText: { fontSize: 16, color: '#999', marginTop: 10 },
  emptyHint: { fontSize: 13, color: '#AAA', textAlign: 'center', marginTop: 10, lineHeight: 20, paddingHorizontal: 12 },
});
