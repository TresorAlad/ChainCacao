import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  StatusBar,
  ActivityIndicator,
  ImageBackground,
  RefreshControl,
  DeviceEventEmitter,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import * as Font from 'expo-font';
import NetInfo from '@react-native-community/netinfo';

import { useAuth } from '@/hooks/use-auth';
import { readLotsListForActor, type Lot } from '@/hooks/use-storage';
import { runPendingSync } from '@/hooks/use-sync';
import { myLotsApi, type BatchResponse, getApiError } from '@/services/api';
import { LOTS_UPDATED_EVENT } from '@/lib/storage-keys';
import { mapCdcLotDisplay, mapStatut } from '@/utils/lot-status';

type DisplayLot = {
  id: string;
  nom: string;
  poids: string;
  date: string;
  statut: string;
  statutColor: string;
  statutTextColor: string;
  cdcColor: 'red' | 'orange' | 'green' | 'blue' | 'grey';
  isSynced: boolean;
};

function mapServerLot(b: BatchResponse): DisplayLot {
  const cdc = mapCdcLotDisplay({ synced: true, chainStatut: b.statut });
  return {
    id: b.id,
    nom: `${b.culture ?? 'Lot'} — ${b.lieu ?? ''}`.trim(),
    poids: String(b.quantite ?? 0),
    date: b.date_recolte ?? b.timestamp ?? '',
    statut: cdc.label,
    statutColor: cdc.color,
    statutTextColor: cdc.textColor,
    cdcColor: b.statut === 'paye' || b.statut === 'transfere' ? 'green' : 'orange',
    isSynced: true,
  };
}

function mapLocalLot(l: Lot): DisplayLot {
  const cdc = mapCdcLotDisplay({
    synced: l.synced,
    chainStatut: l.chainStatut,
    localStatus: l.status,
  });
  return {
    id: l.id,
    nom: l.title,
    poids: l.poids,
    date: l.date,
    statut: l.syncPhase === 'photo_pending' ? 'Photo en attente réseau' : cdc.label,
    statutColor: cdc.color,
    statutTextColor: cdc.textColor,
    cdcColor: !l.synced ? 'red' : l.syncPhase === 'photo_pending' ? 'orange' : 'orange',
    isSynced: l.synced,
  };
}

export default function MesLots() {
  const router = useRouter();
  const { user } = useAuth();
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [lots, setLots] = useState<DisplayLot[]>([]);
  const pendingCount = lots.filter((l) => !l.isSynced).length;

  const loadData = useCallback(async () => {
    setRefreshing(true);
    try {
      const state = await NetInfo.fetch();
      const connected = state.isConnected === true && state.isInternetReachable !== false;
      setIsOffline(!connected);

      const local = await readLotsListForActor(user?.id);
      const localMapped = local.map(mapLocalLot);
      const byId = new Map<string, DisplayLot>();
      localMapped.forEach((l) => byId.set(l.id, l));

      if (connected && user?.id) {
        try {
          const { data } = await myLotsApi.list();
          const remote = (data.lots ?? []).map(mapServerLot);
          remote.forEach((l) => byId.set(l.id, l));
        } catch (e) {
          console.warn('API mes lots:', getApiError(e));
        }
      }

      setLots(Array.from(byId.values()).sort((a, b) => (a.date < b.date ? 1 : -1)));
    } catch (e) {
      console.error('Erreur de chargement', e);
    } finally {
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    async function init() {
      try {
        await Font.loadAsync({
          'Montserrat-Bold': require('../../assets/fonts/Montserrat-Bold.ttf'),
          'Montserrat-Regular': require('../../assets/fonts/Montserrat-Regular.ttf'),
        });
        await loadData();
      } catch (e) {
        console.warn('Erreur init');
      } finally {
        setFontsLoaded(true);
      }
    }
    init();
  }, [loadData]);

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener(LOTS_UPDATED_EVENT, () => {
      void loadData();
    });
    return () => sub.remove();
  }, [loadData]);

  const handleRetrySync = async () => {
    setSyncing(true);
    try {
      await runPendingSync();
      await loadData();
    } finally {
      setSyncing(false);
    }
  };

  const handleNavigation = (path: string) => {
    router.replace(path as any);
  };

  const renderLotItem = ({ item }: { item: DisplayLot }) => (
    <TouchableOpacity
      style={styles.lotCard}
      activeOpacity={0.8}
      onPress={() => router.push(`/(agriculteur)/qr-lot?lotId=${encodeURIComponent(item.id)}` as any)}
      onLongPress={() =>
        router.push(`/(agriculteur)/paiement-lot?lotId=${encodeURIComponent(item.id)}` as any)
      }
    >
      <View style={styles.lotMainInfo}>
        <View style={styles.syncIndicator}>
          <MaterialCommunityIcons
            name={
              item.cdcColor === 'green'
                ? 'cloud-check'
                : item.cdcColor === 'red'
                  ? 'cloud-off-outline'
                  : 'cloud-sync-outline'
            }
            size={14}
            color={item.statutTextColor}
          />
          <Text style={[styles.syncText, { color: item.statutTextColor }]}>
            {item.isSynced ? 'Synchronisé' : 'En attente réseau'}
          </Text>
        </View>

        <View style={styles.rowBetween}>
          <View style={{ flex: 1 }}>
            <Text style={styles.lotNom}>{item.nom}</Text>
            <Text style={styles.lotDate}>Récolté le {item.date}</Text>
          </View>

          <View style={styles.rightInfo}>
            <Text style={styles.weightText}>{item.poids} Kg</Text>
            <View style={[styles.statusBadge, { backgroundColor: item.statutColor }]}>
              <Text style={[styles.statusText, { color: item.statutTextColor }]}>{item.statut}</Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (!fontsLoaded) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#1B5E20" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top']}>
        <Stack.Screen options={{ headerShown: false }} />
        <StatusBar barStyle="light-content" />

        <ImageBackground
          source={{ uri: 'https://images.unsplash.com/photo-1585250001962-6761005f7004?q=80&w=800&auto=format&fit=crop' }}
          style={styles.heroImage}
        >
          <View style={styles.overlay}>
            <View style={styles.heroTopRow}>
              <Text style={styles.heroTitle}>Mes Lots</Text>
              <Text style={styles.heroCount}>{lots.length} lots</Text>
            </View>
            <View style={styles.statusRow}>
              <View style={[styles.dot, { backgroundColor: isOffline ? '#FF5252' : '#4CAF50' }]} />
              <Text style={styles.heroSubtitle}>{isOffline ? 'Mode hors-ligne' : 'Connecté au réseau'}</Text>
            </View>
          </View>
        </ImageBackground>

        <View style={styles.body}>
          {pendingCount > 0 ? (
            <View style={styles.pendingBanner}>
              <MaterialCommunityIcons name="cloud-sync" size={22} color="#E65100" />
              <View style={{ flex: 1 }}>
                <Text style={styles.pendingTitle}>
                  {pendingCount} lot{pendingCount > 1 ? 's' : ''} en attente réseau
                </Text>
                <Text style={styles.pendingSub}>
                  Enregistrés sur l’appareil — envoi automatique quand l’API répond.
                </Text>
              </View>
              <TouchableOpacity
                style={styles.syncBtn}
                onPress={() => void handleRetrySync()}
                disabled={syncing || isOffline}
              >
                {syncing ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.syncBtnText}>Synchroniser</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : null}
          <FlatList
            data={lots}
            keyExtractor={(item) => item.id}
            renderItem={renderLotItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} colors={['#2E7D32']} />}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="archive-off-outline" size={60} color="#CCC" />
                <Text style={styles.emptyText}>Aucun lot trouvé</Text>
                {isOffline && <Text style={styles.emptySubText}>Vérifiez votre connexion pour synchroniser</Text>}
              </View>
            }
          />
        </View>

        <View style={styles.bottomTab}>
          <TabItem icon="home-outline" label="Accueil" onPress={() => handleNavigation('/(agriculteur)/accueil')} />
          <TabItem icon="archive" label="Mes Lots" active onPress={() => {}} />
          <TabItem icon="plus-circle" label="Nouveau" isMain onPress={() => handleNavigation('/(agriculteur)/nouveaulot')} />
          <TabItem
            icon="wallet-outline"
            label="Portefeuille"
            onPress={() => handleNavigation('/(agriculteur)/portefeuille')}
          />
          <TabItem icon="account-circle-outline" label="Profil" onPress={() => handleNavigation('/(agriculteur)/profil')} />
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const TabItem = ({ icon, label, active = false, isMain = false, onPress }: any) => (
  <TouchableOpacity style={styles.tabItem} onPress={onPress} activeOpacity={0.6}>
    <MaterialCommunityIcons name={icon} size={isMain ? 38 : 24} color={active || isMain ? '#2E7D32' : '#888'} />
    <Text
      style={[
        styles.tabLabel,
        { color: active ? '#2E7D32' : '#888', fontFamily: active ? 'Montserrat-Bold' : 'Montserrat-Regular' },
      ]}
    >
      {label}
    </Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1B5E20' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F5' },
  heroImage: { height: 160, width: '100%' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', paddingHorizontal: 20 },
  heroTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroTitle: { color: 'white', fontSize: 26, fontFamily: 'Montserrat-Bold' },
  heroCount: { color: 'white', fontSize: 18, fontFamily: 'Montserrat-Bold' },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  heroSubtitle: { color: 'rgba(255,255,255,0.9)', fontSize: 12, fontFamily: 'Montserrat-Regular' },
  body: { flex: 1, backgroundColor: '#F5F5F5', borderTopLeftRadius: 25, borderTopRightRadius: 25, marginTop: -25 },
  pendingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 14,
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  pendingTitle: { fontFamily: 'Montserrat-Bold', fontSize: 14, color: '#E65100' },
  pendingSub: { fontFamily: 'Montserrat-Regular', fontSize: 11, color: '#BF360C', marginTop: 2 },
  syncBtn: {
    backgroundColor: '#2E7D32',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 96,
    alignItems: 'center',
  },
  syncBtnText: { color: '#fff', fontFamily: 'Montserrat-Bold', fontSize: 11 },
  listContent: { padding: 20, paddingBottom: 100 },
  lotCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderLeftWidth: 5,
    borderLeftColor: '#2E7D32',
  },
  lotMainInfo: { padding: 15 },
  syncIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: '#F9F9F9',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  syncText: { fontSize: 10, fontFamily: 'Montserrat-Regular', marginLeft: 4 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  lotNom: { fontSize: 16, fontFamily: 'Montserrat-Bold', color: '#333' },
  lotDate: { fontSize: 12, fontFamily: 'Montserrat-Regular', color: '#777', marginTop: 2 },
  rightInfo: { alignItems: 'flex-end' },
  weightText: { fontSize: 18, fontFamily: 'Montserrat-Bold', color: '#1B5E20' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginTop: 5 },
  statusText: { fontSize: 10, fontFamily: 'Montserrat-Bold' },
  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyText: { textAlign: 'center', marginTop: 10, color: '#999', fontFamily: 'Montserrat-Bold' },
  emptySubText: { fontSize: 11, color: '#AAA', marginTop: 5 },
  bottomTab: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 75,
    backgroundColor: 'white',
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    paddingBottom: 10,
  },
  tabItem: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tabLabel: { fontSize: 10, marginTop: 4 },
});
