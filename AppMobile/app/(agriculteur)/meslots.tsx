import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
  StatusBar,
  ActivityIndicator,
  ImageBackground,
  RefreshControl // Pour permettre à l'utilisateur de forcer la synchro
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import * as Font from 'expo-font';

// AJOUTS HORS-LIGNE
import * as Network from 'expo-network';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Lot {
  id: string;
  nom: string;
  poids: string;
  date: string;
  statut: 'En attente' | 'Validé' | 'Transféré';
  isSynced: boolean; 
}

export default function MesLots() {
  const router = useRouter();
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  
  // État initial vide (sera rempli par le cache ou l'API)
  const [lots, setLots] = useState<Lot[]>([]);

  const loadData = async () => {
    setRefreshing(true);
    try {
      // 1. Vérifier la connexion
      const state = await Network.getNetworkStateAsync();
      const connected = state.isConnected && state.isInternetReachable;
      setIsOffline(!connected);

      if (connected) {
        // ICI : Appel API réel normalement
        // simulation : setLots(apiResponse)
        // syncWithCache(apiResponse)
      } else {
        // 2. Charger depuis le stockage local si hors-ligne
        const savedLots = await AsyncStorage.getItem('user_lots');
        if (savedLots) {
          setLots(JSON.parse(savedLots));
        }
      }
    } catch (e) {
      console.error("Erreur de chargement", e);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    async function init() {
      try {
        await Font.loadAsync({
          'Montserrat-Bold': require('../../assets/fonts/Montserrat-Bold.ttf'),
          'Montserrat-Regular': require('../../assets/fonts/Montserrat-Regular.ttf'),
        });
        await loadData();
      } catch (e) {
        console.warn("Erreur init");
      } finally {
        setFontsLoaded(true);
      }
    }
    init();
  }, []);

  const handleNavigation = (path: string) => {
    if (path === '/accueil') {
      router.replace('/accueil' as any);
    } else {
      router.push(path as any);
    }
  };

  const renderLotItem = ({ item }: { item: Lot }) => (
    <TouchableOpacity style={styles.lotCard} activeOpacity={0.8}>
      <View style={styles.lotMainInfo}>
        <View style={styles.syncIndicator}>
            <MaterialCommunityIcons 
              name={item.isSynced ? "cloud-check" : "cloud-sync-outline"} 
              size={14} 
              color={item.isSynced ? "#4CAF50" : "#FF9800"} 
            />
            <Text style={[styles.syncText, { color: item.isSynced ? "#4CAF50" : "#FF9800" }]}>
              {item.isSynced ? "Synchronisé" : "Attente de réseau"}
            </Text>
        </View>

        <View style={styles.rowBetween}>
          <View style={{ flex: 1 }}>
            <Text style={styles.lotNom}>{item.nom}</Text>
            <Text style={styles.lotDate}>Récolté le {item.date}</Text>
          </View>
          
          <View style={styles.rightInfo}>
             <Text style={styles.weightText}>{item.poids} Kg</Text>
             <View style={[styles.statusBadge, { 
                backgroundColor: item.statut === 'Validé' ? '#E8F5E9' : item.statut === 'En attente' ? '#FFF3E0' : '#E3F2FD' 
             }]}>
                <Text style={[styles.statusText, { 
                    color: item.statut === 'Validé' ? '#2E7D32' : item.statut === 'En attente' ? '#EF6C00' : '#1976D2' 
                }]}>
                    {item.statut}
                </Text>
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
                <Text style={styles.heroSubtitle}>
                    {isOffline ? "Mode hors-ligne" : "Connecté au réseau"}
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
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={loadData} colors={['#2E7D32']} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="archive-off-outline" size={60} color="#CCC" />
                <Text style={styles.emptyText}>Aucun lot trouvé</Text>
                {isOffline && <Text style={styles.emptySubText}>Vérifiez votre connexion pour synchroniser</Text>}
              </View>
            }
          />
        </View>

        {/* NAVIGATION BASSE */}
        <View style={styles.bottomTab}>
          <TabItem icon="home-outline" label="Accueil" onPress={() => handleNavigation('/accueil')} />
          <TabItem icon="archive" label="Mes Lots" active onPress={() => {}} />
          <TabItem icon="plus-circle" label="Nouveau" isMain onPress={() => handleNavigation('/nouveaulot')} />
          <TabItem icon="wallet-outline" label="Portefeuille" />
          <TabItem icon="account-circle-outline" label="Profil" />
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const TabItem = ({ icon, label, active = false, isMain = false, onPress }: any) => (
  <TouchableOpacity style={styles.tabItem} onPress={onPress} activeOpacity={0.6}>
    <MaterialCommunityIcons 
        name={icon} 
        size={isMain ? 38 : 24} 
        color={active || isMain ? "#2E7D32" : "#888"} 
    />
    <Text style={[styles.tabLabel, { 
      color: active ? "#2E7D32" : "#888", 
      fontFamily: active ? 'Montserrat-Bold' : 'Montserrat-Regular' 
    }]}>
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
  listContent: { padding: 20, paddingBottom: 100 },
  lotCard: { backgroundColor: 'white', borderRadius: 12, marginBottom: 12, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, borderLeftWidth: 5, borderLeftColor: '#2E7D32' },
  lotMainInfo: { padding: 15 },
  syncIndicator: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, backgroundColor: '#F9F9F9', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
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
  bottomTab: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 75, backgroundColor: 'white', flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#EEE', paddingBottom: 10 },
  tabItem: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tabLabel: { fontSize: 10, marginTop: 4 }
});