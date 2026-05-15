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

import { myLotsApi, getApiError } from '@/services/api';
import { AG } from '@/lib/agriculteur-routes';

const { width } = Dimensions.get('window');

export default function AccueilAgriculteur() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<'Semaine' | 'Mois'>('Semaine'); 
  // Données dynamiques
  const [stats, setStats] = useState({ production: 840, revenus: 450000 });
  const objectifPourcentage = 68;
  const lastUpdate = "13 Mai 2026 à 15:45"; 

  useEffect(() => {
    async function init() {
      try {
        // 1. Charger les polices
        await Font.loadAsync({
          'Montserrat-Bold': require('../../assets/fonts/Montserrat-Bold.ttf'),
          'Montserrat-Regular': require('../../assets/fonts/Montserrat-Regular.ttf'),
        });

        const cachedData = await AsyncStorage.getItem('user_stats');
        if (cachedData) {
          setStats(JSON.parse(cachedData));
        }

        try {
          const { data } = await myLotsApi.list();
          const lots = data.lots ?? [];
          const production = lots.reduce((s, b) => s + (b.quantite ?? 0), 0);
          setStats((prev) => {
            const next = {
              production: Math.round(production) || prev.production,
              revenus: prev.revenus,
            };
            void AsyncStorage.setItem('user_stats', JSON.stringify(next));
            return next;
          });
        } catch (e) {
          console.warn(getApiError(e));
        }
      } catch (e) {
        console.warn("Erreur lors de l'initialisation :", e);
      } finally {
        setFontsLoaded(true);
      }
    }
    init();
  }, []);

  const handleNavigation = (path: string) => {
    router.push(path as any);
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
          <Text style={styles.brandText}>Chaincacao</Text>
        </View>

        <View style={styles.body}>
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            
            {/* STATS RÉCAPITULATIVES */}
            <View style={styles.statsRow}>
               <View style={styles.rectCard}>
                  <View style={styles.cardHeader}>
                    <MaterialCommunityIcons name="leaf" size={28} color="#2E7D32" />
                    <Text style={styles.trendTextUp}>+12%</Text>
                  </View>
                  <Text style={styles.cardLabel}>Production Totale</Text>
                  <Text style={styles.cardMainValue}>{stats.production} <Text style={styles.unit}>Kg</Text></Text>
               </View>

               <View style={[styles.rectCard, { backgroundColor: '#2E7D32' }]}>
                  <View style={styles.cardHeader}>
                    <MaterialCommunityIcons name="cash-multiple" size={28} color="white" />
                    <Text style={styles.trendTextWhite}>+5%</Text>
                  </View>
                  <Text style={[styles.cardLabel, { color: 'rgba(255,255,255,0.8)' }]}>Revenus Estimés</Text>
                  <Text style={[styles.cardMainValue, { color: 'white' }]}>
                    {stats.revenus.toLocaleString()} <Text style={styles.unitWhite}>CFA</Text>
                  </Text>
               </View>
            </View>

            {/* OBJECTIF DE SAISON */}
            <View style={styles.rectGoalCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.goalTitle}>Objectif de saison</Text>
                <View style={styles.goalLine}>
                  <Text style={styles.metricLabel}>Récolté :</Text>
                  <Text style={styles.metricValueAtteint}> 1.200 Kg</Text>
                </View>
                <View style={styles.goalLine}>
                  <Text style={styles.metricLabel}>À venir :</Text>
                  <Text style={styles.metricValueRestant}> 800 Kg</Text>
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

            {/* GRAPHIQUE D'ACTIVITÉ */}
            <View style={styles.rectChartCard}>
              <View style={styles.chartHeader}>
                <Text style={styles.chartTitle}>Analyse d'activité</Text>
                <View style={styles.toggleContainer}>
                  {(['Semaine', 'Mois'] as const).map((tab) => (
                    <TouchableOpacity 
                      key={tab}
                      onPress={() => setActiveTab(tab)}
                      style={[styles.toggleBtn, activeTab === tab && styles.toggleBtnActive]}
                    >
                      <Text style={[styles.toggleText, activeTab === tab && styles.toggleTextActive]}>{tab}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.barChartContainer}>
                {(activeTab === 'Semaine' ? [45, 60, 35, 80, 55, 40, 70] : [30, 50, 85, 45]).map((val, i) => (
                  <View key={i} style={styles.barWrapper}>
                    <View style={[styles.bar, { height: val }]} />
                    <Text style={styles.barLabel}>
                      {(activeTab === 'Semaine' ? ['L', 'M', 'M', 'J', 'V', 'S', 'D'] : ['S1','S2','S3','S4'])[i]}
                    </Text>
                  </View>
                ))}
              </View>

              <View style={styles.updateWrapper}>
                <MaterialCommunityIcons name="clock-outline" size={12} color="#AAA" />
                <Text style={styles.updateText}> Mis à jour : {lastUpdate}</Text>
              </View>
            </View>
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
  rectCard: { width: '48%', backgroundColor: 'white', borderRadius: 12, padding: 15, minHeight: 120, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  trendTextUp: { color: '#2E7D32', fontSize: 12, fontWeight: 'bold' },
  trendTextWhite: { color: '#A5D6A7', fontSize: 12, fontWeight: 'bold' },
  cardLabel: { fontSize: 11, color: '#666' },
  cardMainValue: { fontSize: 18, fontWeight: 'bold', color: '#1A1A1A', marginTop: 5 },
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