import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router'; 
import * as Font from 'expo-font';
import Svg, { Circle } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { myLotsApi, walletApi, getApiError } from '@/services/api';
import { AG, logNavigation } from '@/lib/agriculteur-routes';

const { width } = Dimensions.get('window');

export default function AccueilAgriculteur() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [stats, setStats] = useState({ production: 0, revenus: 0 });
  const [lotsCount, setLotsCount] = useState(0);

  useEffect(() => {
    async function init() {
      try {
        // 1. Charger les polices
        await Font.loadAsync({
          'Montserrat-Bold': require('../../assets/fonts/Montserrat-Bold.ttf'),
          'Montserrat-Regular': require('../../assets/fonts/Montserrat-Regular.ttf'),
        });

        let production = 0;
        let count = 0;
        try {
          const { data } = await myLotsApi.list();
          const lots = data.lots ?? [];
          count = lots.length;
          production = lots.reduce((s, b) => s + (b.quantite ?? 0), 0);
        } catch (e) {
          console.warn(getApiError(e));
        }
        let revenus = 0;
        try {
          const { data } = await walletApi.solde();
          if (typeof data.balance === 'number') revenus = data.balance;
        } catch (e) {
          console.warn(getApiError(e));
        }
        const next = { production: Math.round(production), revenus: Math.round(revenus) };
        setStats(next);
        setLotsCount(count);
        await AsyncStorage.setItem('user_stats', JSON.stringify(next));
      } catch (e) {
        console.warn("Erreur lors de l'initialisation :", e);
      } finally {
        setFontsLoaded(true);
      }
    }
    init();
  }, []);

  const handleNavigation = (path: string) => {
    logNavigation('accueil', path);
    router.push(path as any);
  };

  const objectifKg = Math.max(stats.production, 500);
  const objectifPourcentage = objectifKg > 0 ? Math.min(100, Math.round((stats.production / objectifKg) * 100)) : 0;
  const lastUpdate = new Date().toLocaleString('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

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
          <Text style={styles.brandText}>Chaincacao</Text>
        </View>

        <View style={styles.body}>
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            
            {/* STATS RÉCAPITULATIVES */}
            <View style={styles.statsRow}>
               <View style={styles.rectCard}>
                  <View style={styles.cardHeader}>
                    <MaterialCommunityIcons name="leaf" size={28} color="#2E7D32" />
                  </View>
                  <Text style={styles.cardLabel}>Production totale</Text>
                  <Text style={styles.cardMainValue}>{stats.production} <Text style={styles.unit}>Kg</Text></Text>
                  <Text style={styles.cardSub}>{lotsCount} lot{lotsCount > 1 ? 's' : ''} enregistré{lotsCount > 1 ? 's' : ''}</Text>
               </View>

               <View style={[styles.rectCard, { backgroundColor: '#2E7D32' }]}>
                  <View style={styles.cardHeader}>
                    <MaterialCommunityIcons name="cash-multiple" size={28} color="white" />
                  </View>
                  <Text style={[styles.cardLabel, { color: 'rgba(255,255,255,0.8)' }]}>Solde portefeuille</Text>
                  <Text style={[styles.cardMainValue, { color: 'white' }]}>
                    {stats.revenus.toLocaleString('fr-FR')} <Text style={styles.unitWhite}>FCFA</Text>
                  </Text>
                  <Text style={[styles.cardSub, { color: 'rgba(255,255,255,0.75)' }]}>Paiements reçus crédités ici</Text>
               </View>
            </View>

            <TouchableOpacity
              style={styles.historiqueCard}
              onPress={() => handleNavigation(AG.historique)}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons name="timeline-text-outline" size={28} color="#1B5E20" />
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={styles.historiqueTitle}>Historique des lots</Text>
                <Text style={styles.historiqueSub}>
                  Transferts, réceptions et traçabilité sur la blockchain
                </Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={24} color="#CCC" />
            </TouchableOpacity>

            <View style={styles.rectGoalCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.goalTitle}>Production enregistrée</Text>
                <View style={styles.goalLine}>
                  <Text style={styles.metricLabel}>Récolté :</Text>
                  <Text style={styles.metricValueAtteint}> {stats.production} Kg</Text>
                </View>
                <View style={styles.goalLine}>
                  <Text style={styles.metricLabel}>Référence :</Text>
                  <Text style={styles.metricValueRestant}> {objectifKg} Kg</Text>
                </View>
              </View>
              <View style={styles.progressWrapper}>
                <Svg width="70" height="70" viewBox="0 0 100 100">
                  <Circle cx="50" cy="50" r="40" stroke="#F1F8E9" strokeWidth="10" fill="none" />
                  <Circle 
                    cx="50" cy="50" r="40" stroke="#2E7D32" strokeWidth="10" fill="none"
                    strokeDasharray={`${objectifPourcentage * 2.51}, 251`}
                    strokeLinecap="round" transform="rotate(-90 50 50)"
                  />
                </Svg>
                <Text style={styles.progressPercentage}>{objectifPourcentage}%</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.rectChartCard}
              onPress={() => handleNavigation(AG.portefeuille)}
              activeOpacity={0.85}
            >
              <Text style={styles.chartTitle}>Portefeuille et historique</Text>
              <Text style={styles.chartHint}>
                Consultez les paiements reçus, dépôts et retraits dans l’onglet Portefeuille.
              </Text>
              <View style={styles.updateWrapper}>
                <MaterialCommunityIcons name="clock-outline" size={12} color="#AAA" />
                <Text style={styles.updateText}> Mis à jour : {lastUpdate}</Text>
              </View>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* NAVIGATION BASSE */}
        <View style={[styles.bottomTab, { paddingBottom: insets.bottom || 5, height: 70 + (insets.bottom || 0) }]}>
          <TabItem icon="home" label="Accueil" active onPress={() => {}} />
          <TabItem icon="archive-outline" label="Mes Lots" onPress={() => handleNavigation(AG.meslots)} />
          <TabItem icon="plus-circle" label="Nouveau" isMain onPress={() => handleNavigation(AG.nouveaulot)} />
          <TabItem icon="wallet-outline" label="Portefeuille" onPress={() => handleNavigation(AG.portefeuille)} />
          <TabItem icon="account-circle-outline" label="Profil" onPress={() => handleNavigation(AG.profil)} />
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const TabItem = ({ icon, label, active = false, isMain = false, onPress }: any) => (
  <TouchableOpacity style={styles.tabItem} onPress={onPress} activeOpacity={0.7}>
    <MaterialCommunityIcons 
        name={icon} 
        size={isMain ? 35 : 24} 
        color={isMain ? "#2E7D32" : (active ? "#2E7D32" : "#888")} 
    />
    <Text style={[styles.tabLabel, { color: active ? "#2E7D32" : "#888", fontWeight: active ? 'bold' : 'normal' }]}>
      {label}
    </Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1B5E20' },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F5' },
  header: { height: 60, justifyContent: 'center', paddingHorizontal: 20 },
  brandText: { color: 'white', fontSize: 22, fontFamily: 'Montserrat-Bold' },
  body: { flex: 1, backgroundColor: '#F5F5F5', borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  content: { padding: 15 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  historiqueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
    elevation: 2,
  },
  historiqueTitle: { fontSize: 15, fontFamily: 'Montserrat-Bold', color: '#1B5E20' },
  historiqueSub: { fontSize: 12, fontFamily: 'Montserrat-Regular', color: '#666', marginTop: 4 },
  rectCard: { width: '48%', backgroundColor: 'white', borderRadius: 12, padding: 15, minHeight: 120, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  trendTextUp: { color: '#2E7D32', fontSize: 12, fontWeight: 'bold' },
  trendTextWhite: { color: '#A5D6A7', fontSize: 12, fontWeight: 'bold' },
  cardLabel: { fontSize: 11, color: '#666' },
  cardMainValue: { fontSize: 18, fontWeight: 'bold', color: '#1A1A1A', marginTop: 5 },
  cardSub: { fontSize: 11, fontFamily: 'Montserrat-Regular', color: '#888', marginTop: 6 },
  unit: { fontSize: 12, color: '#888' },
  unitWhite: { fontSize: 12, color: 'white' },
  rectGoalCard: { backgroundColor: 'white', padding: 15, borderRadius: 12, flexDirection: 'row', alignItems: 'center', marginBottom: 15, elevation: 2 },
  goalTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 8 },
  goalLine: { flexDirection: 'row', marginBottom: 2 },
  metricLabel: { fontSize: 12, color: '#777' },
  metricValueAtteint: { fontSize: 12, fontWeight: 'bold', color: '#2E7D32' },
  metricValueRestant: { fontSize: 12, fontWeight: 'bold', color: '#333' },
  progressWrapper: { justifyContent: 'center', alignItems: 'center', marginLeft: 10 },
  progressPercentage: { position: 'absolute', fontSize: 13, fontWeight: 'bold', color: '#2E7D32' },
  rectChartCard: { backgroundColor: 'white', borderRadius: 12, elevation: 2, padding: 15 },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  chartTitle: { fontSize: 14, fontWeight: 'bold' },
  chartHint: { fontSize: 13, fontFamily: 'Montserrat-Regular', color: '#666', marginTop: 8, lineHeight: 20 },
  toggleContainer: { flexDirection: 'row', backgroundColor: '#F0F0F0', borderRadius: 6, padding: 2 },
  toggleBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4 },
  toggleBtnActive: { backgroundColor: 'white', elevation: 1 },
  toggleText: { fontSize: 10, color: '#888' },
  toggleTextActive: { color: '#2E7D32', fontWeight: 'bold' },
  barChartContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 100, marginBottom: 10, paddingHorizontal: 5 },
  barWrapper: { alignItems: 'center', flex: 1 },
  bar: { backgroundColor: '#2E7D32', width: 14, borderRadius: 3 },
  barLabel: { fontSize: 9, color: '#999', marginTop: 5 },
  updateWrapper: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F0F0F0', paddingTop: 8 },
  updateText: { fontSize: 9, color: '#AAA' },
  bottomTab: { height: 70, backgroundColor: 'white', flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#EEE', paddingBottom: 5 },
  tabItem: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tabLabel: { fontSize: 10, marginTop: 2 }
});