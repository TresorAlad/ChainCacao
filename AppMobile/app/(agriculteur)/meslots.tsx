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
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import * as Font from 'expo-font';

import { useAuth } from '@/hooks/use-auth';
import { myLotsApi, type BatchResponse, getApiError } from '@/services/api';
import { LOTS_UPDATED_EVENT } from '@/lib/storage-keys';
import { mapCdcLotDisplay } from '@/utils/lot-status';
import { AG, navigateAgriculteurFromTab } from '@/lib/agriculteur-routes';

type DisplayLot = {
  id: string;
  nom: string;
  poids: string;
  date: string;
  statut: string;
  statutColor: string;
  statutTextColor: string;
  cdcColor: 'red' | 'orange' | 'green' | 'blue' | 'grey';
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
  };
}

export default function MesLots() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [lots, setLots] = useState<DisplayLot[]>([]);

  const loadData = useCallback(async () => {
    setRefreshing(true);
    setListError(null);
    try {
      if (!user?.id) {
        setLots([]);
        return;
      }
      const { data } = await myLotsApi.list();
      const remote = (data.lots ?? []).map(mapServerLot);
      setLots(remote.sort((a, b) => (a.date < b.date ? 1 : -1)));
    } catch (e) {
      setListError(getApiError(e));
      console.warn('API mes lots:', e);
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

  const handleNavigation = (path: string) => {
    navigateAgriculteurFromTab(router, path, 'meslots');
  };

  const renderLotItem = ({ item }: { item: DisplayLot }) => (
    <TouchableOpacity
      style={styles.lotCard}
      activeOpacity={0.8}
      onPress={() => router.push(AG.qrLot(item.id) as any)}
      onLongPress={() => router.push(AG.paiementLot(item.id) as any)}
    >
      <View style={styles.lotMainInfo}>
        <View style={styles.syncIndicator}>
          <MaterialCommunityIcons
            name={item.cdcColor === 'green' ? 'cloud-check' : 'cloud-outline'}
            size={14}
            color={item.statutTextColor}
          />
          <Text style={[styles.syncText, { color: item.statutTextColor }]}>Serveur</Text>
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
              <View style={[styles.dot, { backgroundColor: listError ? '#FFA726' : '#4CAF50' }]} />
              <Text style={styles.heroSubtitle}>
                {listError ? listError : 'Liste depuis le serveur — tirez pour actualiser'}
              </Text>
            </View>
          </View>
        </ImageBackground>

        <View style={styles.body}>
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
                {listError ? (
                  <Text style={styles.emptySubText}>Vérifiez la connexion puis tirez pour réessayer.</Text>
                ) : null}
              </View>
            }
          />
        </View>

        <View style={[styles.bottomTab, { paddingBottom: insets.bottom || 5, height: 70 + (insets.bottom || 0) }]}>
          <TabItem icon="home-outline" label="Accueil" onPress={() => handleNavigation(AG.accueil)} />
          <TabItem icon="archive" label="Mes Lots" active onPress={() => {}} />
          <TabItem icon="plus-circle" label="Nouveau" isMain onPress={() => handleNavigation(AG.nouveaulot)} />
          <TabItem
            icon="wallet-outline"
            label="Portefeuille"
            onPress={() => handleNavigation(AG.portefeuille)}
          />
          <TabItem icon="account-circle-outline" label="Profil" onPress={() => handleNavigation(AG.profil)} />
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
  heroSubtitle: { color: 'rgba(255,255,255,0.9)', fontSize: 12, fontFamily: 'Montserrat-Regular', flex: 1 },
  body: { flex: 1, backgroundColor: '#F5F5F5', borderTopLeftRadius: 25, borderTopRightRadius: 25, marginTop: -25 },
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
