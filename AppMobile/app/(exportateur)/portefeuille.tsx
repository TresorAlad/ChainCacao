import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Alert,
  TextInput,
  RefreshControl,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import * as Font from 'expo-font';

import { portefeuilleApi, walletApi, getApiError, isNetworkError } from '@/services/api';
import { useAuth } from '@/hooks/use-auth';

function fmt(n: number) {
  return Math.round(n).toLocaleString('fr-FR');
}

export default function PortefeuilleExportateurScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const isTransformateur = (user?.role ?? '').toLowerCase().includes('transform');

  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [solde, setSolde] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  // isOffline supprimé — mode offline désactivé

  // Dépôt / retrait
  const [pin, setPin] = useState('');
  const [montantDepot, setMontantDepot] = useState('');
  const [montantRetrait, setMontantRetrait] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    Font.loadAsync({
      'Montserrat-Bold': require('../../assets/fonts/Montserrat-Bold.ttf'),
      'Montserrat-Regular': require('../../assets/fonts/Montserrat-Regular.ttf'),
    })
      .catch(() => {})
      .finally(() => setFontsLoaded(true));
  }, []);

  const fetchSolde = useCallback(async () => {
    try {
      console.log('[Portefeuille] Appel API solde');
      const { data } = await portefeuilleApi.solde();
      if (typeof data.balance === 'number') setSolde(data.balance);
      console.log('[Portefeuille] Solde:', data.balance);
    } catch (e) {
      console.warn('[Portefeuille] Erreur solde:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchSolde();
  }, [fetchSolde]);

  const handleDepot = async () => {
    const montant = parseFloat(montantDepot);
    if (!montant || montant <= 0) {
      Alert.alert('Montant invalide', 'Saisissez un montant positif.');
      return;
    }
    if (pin.length !== 4) {
      Alert.alert('PIN requis', 'Saisissez votre code PIN à 4 chiffres.');
      return;
    }
    setActionLoading(true);
    try {
      await walletApi.depot({ montant, pin });
      Alert.alert('Dépôt effectué', `${fmt(montant)} FCFA ajoutés.`);
      setMontantDepot('');
      setPin('');
      fetchSolde();
    } catch (e) {
      Alert.alert('Erreur', getApiError(e));
    } finally {
      setActionLoading(false);
    }
  };

  const handleRetrait = async () => {
    const montant = parseFloat(montantRetrait);
    if (!montant || montant <= 0) {
      Alert.alert('Montant invalide', 'Saisissez un montant positif.');
      return;
    }
    if (pin.length !== 4) {
      Alert.alert('PIN requis', 'Saisissez votre code PIN à 4 chiffres.');
      return;
    }
    setActionLoading(true);
    try {
      await walletApi.retrait({ montant, pin });
      Alert.alert('Retrait effectué', `${fmt(montant)} FCFA débités.`);
      setMontantRetrait('');
      setPin('');
      fetchSolde();
    } catch (e) {
      Alert.alert('Erreur', getApiError(e));
    } finally {
      setActionLoading(false);
    }
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
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Portefeuille</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.body}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchSolde(); }} />
            }
          >

            {/* Carte solde principal */}
            <View style={styles.soldeCard}>
              <Text style={styles.soldeLabel}>Solde disponible</Text>
              {loading ? (
                <ActivityIndicator color="white" style={{ marginTop: 8 }} />
              ) : (
                <Text style={styles.soldeValue}>
                  {solde !== null ? `${fmt(solde)} FCFA` : '— FCFA'}
                </Text>
              )}
              <Text style={styles.soldeSubLabel}>
                {isTransformateur ? 'Espace Transformateur' : 'Espace Exportateur'}
              </Text>
              <View style={styles.creditBadge}>
                <MaterialCommunityIcons name="shield-check" size={14} color="#A5D6A7" />
                <Text style={styles.creditBadgeText}>Crédit démo 2 000 000 FCFA</Text>
              </View>
            </View>

            {/* Section dépôt */}
            <View style={styles.actionCard}>
              <Text style={styles.actionTitle}>Dépôt</Text>
              <TextInput
                style={styles.input}
                placeholder="Montant (FCFA)"
                placeholderTextColor="#999"
                value={montantDepot}
                onChangeText={setMontantDepot}
                keyboardType="numeric"
              />
              <TextInput
                style={styles.input}
                placeholder="Code PIN (4 chiffres)"
                placeholderTextColor="#999"
                value={pin}
                onChangeText={(t) => setPin(t.replace(/\D/g, '').slice(0, 4))}
                keyboardType="number-pad"
                maxLength={4}
                secureTextEntry
              />
              <TouchableOpacity
                style={[styles.actionBtn, styles.depotBtn]}
                onPress={handleDepot}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="plus-circle" size={18} color="white" />
                    <Text style={styles.actionBtnText}>Effectuer un dépôt</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Section retrait */}
            <View style={styles.actionCard}>
              <Text style={styles.actionTitle}>Retrait</Text>
              <TextInput
                style={styles.input}
                placeholder="Montant (FCFA)"
                placeholderTextColor="#999"
                value={montantRetrait}
                onChangeText={setMontantRetrait}
                keyboardType="numeric"
              />
              <TextInput
                style={styles.input}
                placeholder="Code PIN (4 chiffres)"
                placeholderTextColor="#999"
                value={pin}
                onChangeText={(t) => setPin(t.replace(/\D/g, '').slice(0, 4))}
                keyboardType="number-pad"
                maxLength={4}
                secureTextEntry
              />
              <TouchableOpacity
                style={[styles.actionBtn, styles.retraitBtn]}
                onPress={handleRetrait}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="minus-circle" size={18} color="white" />
                    <Text style={styles.actionBtnText}>Effectuer un retrait</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            <View style={{ height: 100 }} />
          </ScrollView>
        </View>

        {/* BOTTOM NAVIGATION */}
        <View style={[styles.bottomTab, { paddingBottom: insets.bottom || 5, height: 70 + (insets.bottom || 0) }]}>
          <TabItem icon="home-variant" label="Accueil" onPress={() => router.replace('/(exportateur)/accueil')} />
          <TabItem icon="wallet" label="Portefeuille" active />
          <TabItem icon="qrcode-scan" label="Scanner" onPress={() => router.push('/(exportateur)/scanner')} />
          <TabItem icon="package-variant-closed" label="Stock" onPress={() => router.push('/(exportateur)/stock')} />
          <TabItem icon="history" label="Historique" onPress={() => router.push('/(exportateur)/historique')} />
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const TabItem = ({ icon, label, active = false, onPress }: { icon: string; label: string; active?: boolean; onPress?: () => void }) => (
  <TouchableOpacity style={styles.tabItem} onPress={onPress}>
    <MaterialCommunityIcons name={icon as any} size={24} color={active ? '#1B5E20' : '#888'} />
    <Text style={[styles.tabLabel, { color: active ? '#1B5E20' : '#888' }]}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1B5E20' },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    height: 70,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  backBtn: { width: 40, alignItems: 'flex-start' },
  headerTitle: { color: 'white', fontSize: 20, fontFamily: 'Montserrat-Bold' },
  body: { flex: 1, backgroundColor: '#F8F9FA', borderTopLeftRadius: 30, borderTopRightRadius: 30 },
  scrollContent: { padding: 20 },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  offlineText: { color: '#C62828', fontSize: 13, flex: 1 },
  soldeCard: {
    backgroundColor: '#1B5E20',
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    alignItems: 'center',
    elevation: 4,
  },
  soldeLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 14, fontFamily: 'Montserrat-Regular' },
  soldeValue: { color: 'white', fontSize: 32, fontFamily: 'Montserrat-Bold', marginTop: 8 },
  soldeSubLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 12, fontFamily: 'Montserrat-Regular', marginTop: 6 },
  creditBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 12,
    gap: 6,
  },
  creditBadgeText: { color: '#A5D6A7', fontSize: 12, fontFamily: 'Montserrat-Regular' },
  actionCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
  },
  actionTitle: {
    fontSize: 14,
    fontFamily: 'Montserrat-Bold',
    color: '#333',
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    fontSize: 15,
    color: '#111',
    backgroundColor: '#FAFAFA',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 4,
  },
  depotBtn: { backgroundColor: '#1B5E20' },
  retraitBtn: { backgroundColor: '#E53935' },
  actionBtnText: { color: 'white', fontWeight: 'bold', fontSize: 15, fontFamily: 'Montserrat-Bold' },
  bottomTab: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 85,
    backgroundColor: 'white',
    flexDirection: 'row',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    elevation: 20,
  },
  tabItem: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 5 },
  tabLabel: { fontSize: 10, marginTop: 5, fontFamily: 'Montserrat-Regular' },
});
