import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLots, Lot } from '@/hooks/use-storage';
import { useSync } from '@/hooks/use-sync';

const { width } = Dimensions.get('window');

export default function ProductionScreen() {
  const router = useRouter();
  const { lots, loading, loadLots } = useLots();
  const { triggerSync } = useSync();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('Tous');
  const [refreshing, setRefreshing] = useState(false);

  // Recharger les données depuis AsyncStorage à chaque fois qu'on revient sur cet écran
  useFocusEffect(
    useCallback(() => {
      loadLots();
    }, [loadLots])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await triggerSync(); // Tenter de sync les lots en attente
    await loadLots();
    setRefreshing(false);
  };

  const filteredData = lots.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'Tous' || item.status === filter;
    return matchesSearch && matchesFilter;
  });

  const nbPending = lots.filter(l => !l.synced).length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient colors={['#1B5E20', '#2E7D32', '#43A047']} style={styles.header}>
        <Text style={styles.headerTitle}>Productions</Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)/scan')}>
          <MaterialCommunityIcons name="qrcode-scan" size={26} color="white" />
        </TouchableOpacity>
      </LinearGradient>

      <View style={styles.body}>
        {/* Bannière sync en attente */}
        {nbPending > 0 && (
          <TouchableOpacity style={styles.syncBanner} onPress={onRefresh}>
            <MaterialCommunityIcons name="sync" size={16} color="#F57F17" />
            <Text style={styles.syncBannerText}>
              {nbPending} lot(s) en attente de sync · Tirer pour synchroniser
            </Text>
          </TouchableOpacity>
        )}

        <View style={styles.searchContainer}>
          <MaterialCommunityIcons name="magnify" size={20} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un lot..."
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <View style={styles.filterBar}>
          {['Tous', 'Terminé', 'En cours', 'Problème'].map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <FlatList
          data={filteredData}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#2E7D32']}
              tintColor="#2E7D32"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="clipboard-text-outline" size={80} color="#CCC" />
              <Text style={styles.emptyText}>
                {loading ? 'Chargement...' : 'Aucun lot enregistré.'}
              </Text>
              {!loading && (
                <Text style={styles.emptySubText}>Cliquez sur le bouton + pour commencer.</Text>
              )}
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <TouchableOpacity
                style={styles.cardMain}
                onPress={() => router.push({
                  pathname: '/caracteristiqueslot',
                  params: {
                    lotId: item.id,
                    title: item.title,
                    status: item.status,
                    dateProd: item.date,
                    poids: item.poids,
                    acheteur: item.acheteur || 'En attente',
                    destination: item.destination || 'En transit',
                    typeCacao: item.typeCacao || '',
                    synced: item.synced ? '1' : '0',
                  }
                })}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.cardTitleRow}>
                    <MaterialCommunityIcons
                      name={item.synced ? 'check-circle' : 'clock-outline'}
                      size={16}
                      color={item.synced ? '#2E7D32' : '#F9A825'}
                      style={{ marginRight: 6 }}
                    />
                    <Text style={styles.cardTitle}>{item.title}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <StatusBadge status={item.status} />
                    <MaterialCommunityIcons name="chevron-right" size={20} color="#CCC" />
                  </View>
                </View>
                <Text style={styles.cardDate}>{item.date} · {item.poids} kg</Text>
                {!item.synced && (
                  <Text style={styles.pendingSync}>⏳ En attente de synchronisation blockchain</Text>
                )}
                {item.synced && (
                  <Text style={styles.confirmedSync}>✓ Confirmé sur Hyperledger Fabric</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cardHistoryBtn}
                onPress={() =>
                  router.push({ pathname: '/historique', params: { lotId: item.id } })
                }
                accessibilityLabel="Historique du lot"
              >
                <MaterialCommunityIcons name="history" size={22} color="#2E7D32" />
              </TouchableOpacity>
            </View>
          )}
        />
      </View>

      <TouchableOpacity style={styles.fab} onPress={() => router.push('/creationlot')}>
        <MaterialCommunityIcons name="plus" size={35} color="white" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const StatusBadge = ({ status }: { status: string }) => {
  let color = '#666';
  if (status === 'Terminé') color = '#2E7D32';
  if (status === 'En cours') color = '#F9A825';
  if (status === 'Problème') color = '#C62828';
  return (
    <View style={[styles.badge, { backgroundColor: color + '20', borderColor: color }]}>
      <Text style={[styles.badgeText, { color }]}>{status}</Text>
    </View>
  );
};

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
  body: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 15,
  },
  syncBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 8,
  },
  syncBannerText: { color: '#F57F17', fontSize: 13, fontWeight: '500' },
  searchContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 20,
    paddingHorizontal: 15,
    borderRadius: 15,
    height: 50,
    alignItems: 'center',
    elevation: 2,
    marginTop: 5,
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16 },
  filterBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginVertical: 12,
  },
  filterBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#EEE',
  },
  filterBtnActive: { backgroundColor: '#2E7D32' },
  filterText: { fontSize: 12, fontWeight: 'bold', color: '#666' },
  filterTextActive: { color: 'white' },
  listContent: { paddingHorizontal: 20, paddingBottom: 100, flexGrow: 1 },
  card: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: 'white',
    borderRadius: 15,
    marginBottom: 12,
    elevation: 2,
    overflow: 'hidden',
  },
  cardMain: {
    flex: 1,
    padding: 15,
    paddingRight: 8,
  },
  cardHistoryBtn: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 14,
    borderLeftWidth: 1,
    borderLeftColor: '#F0F0F0',
    backgroundColor: '#FAFAFA',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  cardDate: { fontSize: 13, color: '#999', marginTop: 5 },
  pendingSync: { fontSize: 11, color: '#F9A825', marginTop: 4 },
  confirmedSync: { fontSize: 11, color: '#2E7D32', marginTop: 4 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 5,
  },
  badgeText: { fontSize: 10, fontWeight: 'bold' },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    backgroundColor: '#2E7D32',
    width: 65,
    height: 65,
    borderRadius: 32.5,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
  },
  emptyText: { fontSize: 18, color: '#666', fontWeight: 'bold', marginTop: 10 },
  emptySubText: { fontSize: 14, color: '#999', marginTop: 5 },
});
