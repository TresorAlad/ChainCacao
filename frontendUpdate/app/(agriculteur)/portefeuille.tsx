import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  StatusBar,
  ActivityIndicator,
  FlatList,
  Alert
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import * as Font from 'expo-font';

// --- MODULES POUR LE MODE HORS-LIGNE ---
import * as Network from 'expo-network';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Données initiales par défaut (si le stockage local est vide)
const INITIAL_DATA = [
  { id: '1', type: 'depot', libelle: 'Vente Café Lot #42', montant: 125000, date: '12 Mai 2026', heure: '14:30', isSynced: true },
  { id: '2', type: 'retrait', libelle: 'Transfert Mobile Money', montant: -50000, date: '10 Mai 2026', heure: '09:15', isSynced: true },
];

export default function Portefeuille() {
  const router = useRouter();
  const [fontsLoaded, setFontsLoaded] = useState(false);
  
  // ÉTATS DYNAMIQUES
  const [solde, setSolde] = useState(450000);
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    async function initApp() {
      try {
        // 1. Chargement des polices
        await Font.loadAsync({
          'Montserrat-Bold': require('../../assets/fonts/Montserrat-Bold.ttf'),
          'Montserrat-Regular': require('../../assets/fonts/Montserrat-Regular.ttf'),
        });

        // 2. Récupération des données locales (Cache)
        const savedSolde = await AsyncStorage.getItem('user_solde');
        const savedTxs = await AsyncStorage.getItem('user_transactions');

        if (savedSolde) setSolde(JSON.parse(savedSolde));
        
        if (savedTxs) {
          setTransactions(JSON.parse(savedTxs));
        } else {
          setTransactions(INITIAL_DATA); // Par défaut la première fois
        }
      } catch (e) {
        console.warn("Erreur lors de l'initialisation");
      } finally {
        setFontsLoaded(true);
      }
    }
    initApp();
  }, []);

  // FONCTION DE TRANSACTION (Gère le mode connecté/déconnecté)
  const handleTransaction = async (type: 'depot' | 'retrait', montant: number, libelle: string) => {
    // Vérification réseau
    const net = await Network.getNetworkStateAsync();
    const isOnline = net.isConnected && net.isInternetReachable;

    // Vérification solde si retrait
    if (type === 'retrait' && solde < montant) {
      Alert.alert("Solde insuffisant", "Vous n'avez pas assez de fonds.");
      return;
    }

    const nouvelleTx = {
      id: String(Date.now()),
      type: type,
      libelle: isOnline ? libelle : `${libelle} (Hors-ligne)`,
      montant: type === 'depot' ? montant : -montant,
      date: new Date().toLocaleDateString('fr-FR'),
      heure: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      isSynced: isOnline
    };

    const nouveauSolde = solde + nouvelleTx.montant;
    const nouvellesTxs = [nouvelleTx, ...transactions];

    // Mise à jour UI et Stockage
    setSolde(nouveauSolde);
    setTransactions(nouvellesTxs);
    
    await AsyncStorage.setItem('user_solde', JSON.stringify(nouveauSolde));
    await AsyncStorage.setItem('user_transactions', JSON.stringify(nouvellesTxs));

    if (!isOnline) {
      Alert.alert("Mode Hors-ligne", "Transaction enregistrée localement. Elle sera synchronisée avec le serveur dès que possible.");
    }
  };

  const navigateTo = (path: string) => {
    router.replace(path as any);
  };

  if (!fontsLoaded) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#1B5E20" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top']}>
        <Stack.Screen options={{ headerShown: false }} />
        <StatusBar barStyle="light-content" />
        
        <View style={styles.header}>
          <Text style={styles.brandText}>Mon Portefeuille</Text>
        </View>

        <View style={styles.body}>
          <View style={styles.content}>
            
            {/* CARTE DE SOLDE */}
            <View style={styles.balanceCard}>
              <Text style={styles.balanceLabel}>Solde disponible</Text>
              <Text style={styles.balanceValue}>
                {solde.toLocaleString()} <Text style={styles.currency}>FCFA</Text>
              </Text>
              
              <View style={styles.actionRow}>
                <TouchableOpacity 
                  style={styles.actionBtn} 
                  onPress={() => handleTransaction('depot', 10000, 'Dépôt test')}
                >
                  <MaterialCommunityIcons name="plus-circle" size={20} color="#2E7D32" />
                  <Text style={styles.actionBtnText}>Ajouter</Text>
                </TouchableOpacity>

                <View style={styles.dividerV} />

                <TouchableOpacity 
                  style={styles.actionBtn} 
                  onPress={() => handleTransaction('retrait', 5000, 'Retrait test')}
                >
                  <MaterialCommunityIcons name="minus-circle" size={20} color="#C62828" />
                  <Text style={[styles.actionBtnText, { color: '#C62828' }]}>Retirer</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* HISTORIQUE */}
            <Text style={styles.sectionTitle}>Historique des transactions</Text>
            
            <FlatList
              data={transactions}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 100 }}
              renderItem={({ item }) => (
                <View style={styles.transactionItem}>
                  <View style={[styles.iconCircle, { backgroundColor: item.type === 'depot' ? '#E8F5E9' : '#FFEBEE' }]}>
                    <MaterialCommunityIcons 
                      name={item.type === 'depot' ? 'arrow-bottom-left' : 'arrow-top-right'} 
                      size={20} 
                      color={item.type === 'depot' ? '#2E7D32' : '#C62828'} 
                    />
                  </View>
                  
                  <View style={styles.txInfo}>
                    <Text style={styles.txLibelle}>{item.libelle}</Text>
                    <Text style={styles.txDate}>{item.date} à {item.heure}</Text>
                  </View>

                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.txMontant, { color: item.type === 'depot' ? '#2E7D32' : '#C62828' }]}>
                      {item.type === 'depot' ? '+' : ''}{item.montant.toLocaleString()}
                    </Text>
                    {!item.isSynced && (
                      <MaterialCommunityIcons name="cloud-off-outline" size={14} color="#888" />
                    )}
                  </View>
                </View>
              )}
            />
          </View>
        </View>

        {/* NAVIGATION BASSE */}
        <View style={styles.bottomTab}>
          <TabItem icon="home-outline" label="Accueil" onPress={() => navigateTo('/accueil')} />
          <TabItem icon="archive-outline" label="Mes Lots" onPress={() => navigateTo('/lots')} />
          <TabItem icon="plus-circle" label="Nouveau" isMain onPress={() => navigateTo('/nouveaulot')} />
          <TabItem icon="wallet" label="Portefeuille" active />
          <TabItem icon="account-circle-outline" label="Profil" onPress={() => navigateTo('/profil')} />
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const TabItem = ({ icon, label, active = false, isMain = false, onPress }: any) => (
  <TouchableOpacity style={styles.tabItem} onPress={onPress} activeOpacity={0.7}>
    <MaterialCommunityIcons 
        name={icon} 
        size={isMain ? 38 : 26} 
        color={isMain ? "#2E7D32" : (active ? "#2E7D32" : "#888")} 
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
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { height: 70, justifyContent: 'center', paddingHorizontal: 20 },
  brandText: { color: 'white', fontSize: 20, fontFamily: 'Montserrat-Bold' },
  body: { flex: 1, backgroundColor: '#F5F5F5', borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  content: { padding: 15, flex: 1 },
  balanceCard: { backgroundColor: 'white', borderRadius: 12, padding: 20, alignItems: 'center', elevation: 4, marginBottom: 25 },
  balanceLabel: { fontFamily: 'Montserrat-Regular', color: '#666', fontSize: 14, marginBottom: 8 },
  balanceValue: { fontFamily: 'Montserrat-Bold', fontSize: 28, color: '#1B5E20' },
  currency: { fontSize: 16 },
  actionRow: { flexDirection: 'row', marginTop: 20, borderTopWidth: 1, borderTopColor: '#F0F0F0', width: '100%', paddingTop: 15 },
  actionBtn: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  actionBtnText: { fontFamily: 'Montserrat-Bold', color: '#2E7D32', fontSize: 14 },
  dividerV: { width: 1, height: 25, backgroundColor: '#EEE' },
  sectionTitle: { fontSize: 17, fontFamily: 'Montserrat-Bold', color: '#1A1A1A', marginBottom: 15 },
  transactionItem: { flexDirection: 'row', backgroundColor: 'white', padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 10 },
  iconCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  txInfo: { flex: 1, marginLeft: 12 },
  txLibelle: { fontFamily: 'Montserrat-Bold', fontSize: 14, color: '#333' },
  txDate: { fontFamily: 'Montserrat-Regular', fontSize: 11, color: '#999', marginTop: 2 },
  txMontant: { fontFamily: 'Montserrat-Bold', fontSize: 15 },
  bottomTab: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 75, backgroundColor: 'white', flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#EEE', paddingBottom: 10 },
  tabItem: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tabLabel: { fontSize: 10, marginTop: 4 }
});