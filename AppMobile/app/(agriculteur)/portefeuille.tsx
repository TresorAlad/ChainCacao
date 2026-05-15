import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  FlatList,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import * as Font from 'expo-font';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { walletApi, getApiError } from '@/services/api';
import { AG, navigateAgriculteurFromTab } from '@/lib/agriculteur-routes';

const INITIAL_DATA = [
  { id: '1', type: 'depot', libelle: 'Solde initial', montant: 0, date: '—', heure: '—', isSynced: true },
];

export default function Portefeuille() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [solde, setSolde] = useState(0);
  const [transactions, setTransactions] = useState<any[]>(INITIAL_DATA);
  const [pin, setPin] = useState('');
  const [montantDepot, setMontantDepot] = useState('10000');
  const [montantRetrait, setMontantRetrait] = useState('5000');

  useEffect(() => {
    async function initApp() {
      try {
        await Font.loadAsync({
          'Montserrat-Bold': require('../../assets/fonts/Montserrat-Bold.ttf'),
          'Montserrat-Regular': require('../../assets/fonts/Montserrat-Regular.ttf'),
        });

        const savedTxs = await AsyncStorage.getItem('user_transactions');
        if (savedTxs) setTransactions(JSON.parse(savedTxs));

        let balanceLoaded = false;
        try {
          const { data } = await walletApi.solde();
          if (typeof data.balance === 'number') {
            setSolde(data.balance);
            balanceLoaded = true;
          }
        } catch {
          /* serveur ou réseau : repli cache local ci-dessous */
        }
        if (!balanceLoaded) {
          const savedSolde = await AsyncStorage.getItem('user_solde');
          if (savedSolde) setSolde(JSON.parse(savedSolde));
        }
      } catch (e) {
        console.warn("Erreur lors de l'initialisation");
      } finally {
        setFontsLoaded(true);
      }
    }
    initApp();
  }, []);

  const pushLocalTx = async (nouvelleTx: any, nouveauSolde: number) => {
    const nouvellesTxs = [nouvelleTx, ...transactions.filter((t) => t.id !== '1' || nouvelleTx.id === '1')];
    setSolde(nouveauSolde);
    setTransactions(nouvellesTxs);
    await AsyncStorage.setItem('user_solde', JSON.stringify(nouveauSolde));
    await AsyncStorage.setItem('user_transactions', JSON.stringify(nouvellesTxs));
  };

  const handleDepot = async () => {
    const m = parseFloat(montantDepot.replace(',', '.'));
    if (!pin.trim()) {
      Alert.alert('PIN requis', 'Saisissez votre code PIN pour confirmer le dépôt.');
      return;
    }
    if (!m || m <= 0) {
      Alert.alert('Montant invalide', 'Entrez un montant positif.');
      return;
    }
    try {
      const { data } = await walletApi.depot({ montant: m, pin: pin.trim() });
      await pushLocalTx(
        {
          id: String(Date.now()),
          type: 'depot',
          libelle: data.message ?? 'Dépôt',
          montant: m,
          date: new Date().toLocaleDateString('fr-FR'),
          heure: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          isSynced: true,
        },
        solde + m
      );
      const { data: s } = await walletApi.solde();
      if (typeof s.balance === 'number') setSolde(s.balance);
      setPin('');
      Alert.alert('Succès', 'Dépôt effectué.');
    } catch (e) {
      Alert.alert('Erreur', getApiError(e));
    }
  };

  const handleRetrait = async () => {
    const m = parseFloat(montantRetrait.replace(',', '.'));
    if (!pin.trim()) {
      Alert.alert('PIN requis', 'Saisissez votre code PIN pour confirmer le retrait.');
      return;
    }
    if (!m || m <= 0) {
      Alert.alert('Montant invalide', 'Entrez un montant positif.');
      return;
    }
    if (solde < m) {
      Alert.alert('Solde insuffisant', 'Vous n’avez pas assez de fonds.');
      return;
    }
    try {
      const { data } = await walletApi.retrait({ montant: m, pin: pin.trim() });
      await pushLocalTx(
        {
          id: String(Date.now()),
          type: 'retrait',
          libelle: data.message ?? 'Retrait',
          montant: -m,
          date: new Date().toLocaleDateString('fr-FR'),
          heure: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          isSynced: true,
        },
        solde - m
      );
      const { data: s } = await walletApi.solde();
      if (typeof s.balance === 'number') setSolde(s.balance);
      setPin('');
      Alert.alert('Succès', 'Retrait effectué.');
    } catch (e) {
      Alert.alert('Erreur', getApiError(e));
    }
  };

  const navigateTo = (path: string) => {
    navigateAgriculteurFromTab(router, path, 'portefeuille');
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
            <View style={styles.balanceCard}>
              <Text style={styles.balanceLabel}>Solde disponible</Text>
              <Text style={styles.balanceValue}>
                {solde.toLocaleString('fr-FR')} <Text style={styles.currency}>FCFA</Text>
              </Text>

              <Text style={styles.pinLabel}>Code PIN (requis par l’API)</Text>
              <TextInput
                style={styles.pinInput}
                value={pin}
                onChangeText={setPin}
                placeholder="••••"
                secureTextEntry
                keyboardType="number-pad"
              />

              <View style={styles.rowInputs}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.smallLabel}>Montant dépôt</Text>
                  <TextInput
                    style={styles.amountInput}
                    value={montantDepot}
                    onChangeText={setMontantDepot}
                    keyboardType="decimal-pad"
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.smallLabel}>Montant retrait</Text>
                  <TextInput
                    style={styles.amountInput}
                    value={montantRetrait}
                    onChangeText={setMontantRetrait}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>

              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.actionBtn} onPress={handleDepot}>
                  <MaterialCommunityIcons name="plus-circle" size={20} color="#2E7D32" />
                  <Text style={styles.actionBtnText}>Dépôt</Text>
                </TouchableOpacity>
                <View style={styles.dividerV} />
                <TouchableOpacity style={styles.actionBtn} onPress={handleRetrait}>
                  <MaterialCommunityIcons name="minus-circle" size={20} color="#C62828" />
                  <Text style={[styles.actionBtnText, { color: '#C62828' }]}>Retrait</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Historique des transactions</Text>

            <FlatList
              data={transactions}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 100 }}
              renderItem={({ item }) => (
                <View style={styles.transactionItem}>
                  <View
                    style={[
                      styles.iconCircle,
                      { backgroundColor: item.type === 'depot' ? '#E8F5E9' : '#FFEBEE' },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={item.type === 'depot' ? 'arrow-bottom-left' : 'arrow-top-right'}
                      size={20}
                      color={item.type === 'depot' ? '#2E7D32' : '#C62828'}
                    />
                  </View>

                  <View style={styles.txInfo}>
                    <Text style={styles.txLibelle}>{item.libelle}</Text>
                    <Text style={styles.txDate}>
                      {item.date} à {item.heure}
                    </Text>
                  </View>

                  <View style={{ alignItems: 'flex-end' }}>
                    <Text
                      style={[styles.txMontant, { color: item.type === 'depot' ? '#2E7D32' : '#C62828' }]}
                    >
                      {item.montant >= 0 ? '+' : ''}
                      {item.montant.toLocaleString('fr-FR')}
                    </Text>
                    {!item.isSynced && <MaterialCommunityIcons name="cloud-off-outline" size={14} color="#888" />}
                  </View>
                </View>
              )}
            />
          </View>
        </View>

        <View style={[styles.bottomTab, { paddingBottom: insets.bottom || 5, height: 70 + (insets.bottom || 0) }]}>
          <TabItem icon="home-outline" label="Accueil" onPress={() => navigateTo(AG.accueil)} />
          <TabItem icon="archive-outline" label="Mes Lots" onPress={() => navigateTo(AG.meslots)} />
          <TabItem icon="plus-circle" label="Nouveau" isMain onPress={() => navigateTo(AG.nouveaulot)} />
          <TabItem icon="wallet" label="Portefeuille" active />
          <TabItem icon="account-circle-outline" label="Profil" onPress={() => navigateTo(AG.profil)} />
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const TabItem = ({ icon, label, active = false, isMain = false, onPress }: any) => (
  <TouchableOpacity style={styles.tabItem} onPress={onPress} activeOpacity={0.7}>
    <MaterialCommunityIcons name={icon} size={isMain ? 38 : 26} color={isMain ? '#2E7D32' : active ? '#2E7D32' : '#888'} />
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
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { height: 70, justifyContent: 'center', paddingHorizontal: 20 },
  brandText: { color: 'white', fontSize: 20, fontFamily: 'Montserrat-Bold' },
  body: { flex: 1, backgroundColor: '#F5F5F5', borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  content: { padding: 15, flex: 1 },
  balanceCard: { backgroundColor: 'white', borderRadius: 12, padding: 20, alignItems: 'stretch', elevation: 4, marginBottom: 25 },
  balanceLabel: { fontFamily: 'Montserrat-Regular', color: '#666', fontSize: 14, marginBottom: 8, textAlign: 'center' },
  balanceValue: { fontFamily: 'Montserrat-Bold', fontSize: 28, color: '#1B5E20', textAlign: 'center' },
  currency: { fontSize: 16 },
  pinLabel: { fontFamily: 'Montserrat-Bold', fontSize: 12, color: '#333', marginTop: 16 },
  pinInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    padding: 12,
    marginTop: 6,
    fontFamily: 'Montserrat-Regular',
  },
  rowInputs: { flexDirection: 'row', marginTop: 12 },
  smallLabel: { fontSize: 11, color: '#666', fontFamily: 'Montserrat-Bold' },
  amountInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    padding: 10,
    marginTop: 4,
    fontFamily: 'Montserrat-Regular',
  },
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
