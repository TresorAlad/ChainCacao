import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  StatusBar,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import * as Font from 'expo-font';
import { myLotsApi, getApiError } from '@/services/api';

export default function MainDashboard() {
  const router = useRouter();
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [lotsRecus, setLotsRecus] = useState(0);
  const [poidsTotal, setPoidsTotal] = useState(0);
  const [margeEstimee, setMargeEstimee] = useState(0);

  // CHARGEMENT DES POLICES
  useEffect(() => {
    async function loadFonts() {
      try {
        // On remonte de DEUX niveaux pour sortir de (cooperative) et aller vers assets
        await Font.loadAsync({
          'Montserrat-Bold': require('../../assets/fonts/Montserrat-Bold.ttf'),
          'Montserrat-Regular': require('../../assets/fonts/Montserrat-Regular.ttf'),
        });
        setFontsLoaded(true);
      } catch (e) {
        console.warn("Erreur chargement polices : ", e);
        setFontsLoaded(true); // Sécurité pour afficher l'UI même en cas d'erreur
      }
    }
    loadFonts();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await myLotsApi.list();
        const lots = data.lots ?? [];
        setLotsRecus(lots.length);
        const kg = lots.reduce((s, b) => s + (b.quantite ?? 0), 0);
        setPoidsTotal(Math.round(kg));
        setMargeEstimee(Math.round(kg * 150));
      } catch (e) {
        console.warn(getApiError(e));
      }
    })();
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="white" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top']}>
        <Stack.Screen options={{ headerShown: false }} />
        <StatusBar barStyle="light-content" />
        
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerIconBtn}>
            <MaterialCommunityIcons name="menu" size={32} color="white" />
          </TouchableOpacity>
          <Text style={styles.brandText}>Chaincacao</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.body}>
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <Text style={styles.welcomeText}>Tableau de bord</Text>
            
            {/* CARTE STATS */}
            <TouchableOpacity 
              style={styles.mainGreenCard}
              activeOpacity={0.85}
              onPress={() => router.push('/(cooperative)/lots_recus' as any)}
            >
              <View>
                <Text style={styles.todayLabel}>Lots reçus aujourd'hui</Text>
                <Text style={styles.todayValue}>{lotsRecus}</Text>
              </View>
              <View style={styles.iconCircle}>
                <MaterialCommunityIcons name="package-variant-closed" size={35} color="white" />
              </View>
            </TouchableOpacity>

            <View style={styles.statsRow}>
               <View style={styles.whiteCard}>
                  <Text style={styles.smallLabel}>Poids total</Text>
                  <Text style={styles.statText}>
                    <Text style={styles.greenValue}>{poidsTotal}</Text> Kg
                  </Text>
               </View>

               <View style={styles.whiteCard}>
                  <Text style={styles.smallLabel}>Marge estimée</Text>
                  <Text style={styles.statText}>
                    <Text style={styles.greenValue}>{margeEstimee.toLocaleString('fr-FR')}</Text> FCFA
                  </Text>
               </View>
            </View>

            {/* ACTIONS PRINCIPALES */}
            <TouchableOpacity 
              style={styles.scanButton} 
              onPress={() => router.push('/(cooperative)/scanner' as any)}
              activeOpacity={0.8}
            >
               <MaterialCommunityIcons name="qrcode-scan" size={50} color="white" />
               <Text style={styles.scanText}>Scanner QR Code</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.scanButton, styles.listButton]} 
              activeOpacity={0.8}
              onPress={() => router.push('/(cooperative)/generation_liste' as any)}
            >
               <MaterialCommunityIcons name="format-list-bulleted-type" size={30} color="white" />
               <Text style={styles.listText}>Créer une liste groupée</Text>
            </TouchableOpacity>

          </ScrollView>
        </View>

        {/* BARRE DE NAVIGATION BASSE (CORRIGÉE) */}
        <View style={styles.bottomTab}>
          <TabItem 
            icon="home-variant" 
            label="Dashboard" 
            active 
            color="#2E7D32" 
          />
          <TabItem 
            icon="camera" 
            label="Scanner" 
            onPress={() => router.push('/(cooperative)/scanner' as any)} 
          />
          <TabItem 
            icon="package-variant-closed" 
            label="Lots" 
            onPress={() => router.push('/(cooperative)/lot' as any)} 
          />
          <TabItem 
            icon="chart-timeline-variant" 
            label="Historique" 
            onPress={() => router.push('/historique' as any)} 
          />
          <TabItem 
            icon="account" 
            label="Profil" 
            onPress={() => router.push('/(cooperative)/profil' as any)} 
          />
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

// Composant interne pour les onglets
const TabItem = ({ icon, label, active = false, color = "#666", onPress }: any) => (
  <TouchableOpacity style={styles.tabItem} onPress={onPress} activeOpacity={0.6}>
    <MaterialCommunityIcons name={icon} size={26} color={active ? color : "#666"} />
    <Text style={[styles.tabLabel, { 
        color: active ? color : "#666", 
        fontFamily: active ? 'Montserrat-Bold' : 'Montserrat-Regular' 
      }]}>
      {label}
    </Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1B5E20' },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1B5E20' },
  header: { 
    height: 70, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20,
    backgroundColor: '#1B5E20'
  },
  headerIconBtn: { width: 40 },
  headerSpacer: { width: 40 },
  brandText: { color: 'white', fontSize: 22, fontFamily: 'Montserrat-Bold' },
  body: { 
    flex: 1, 
    backgroundColor: '#F8F9FA', 
    borderTopLeftRadius: 30, 
    borderTopRightRadius: 30,
  },
  content: { padding: 20 },
  welcomeText: { fontSize: 22, fontFamily: 'Montserrat-Bold', color: '#000', marginBottom: 20 },
  mainGreenCard: {
    backgroundColor: '#2E7D32',
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 4,
  },
  todayLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontFamily: 'Montserrat-Regular' },
  todayValue: { color: 'white', fontSize: 40, fontFamily: 'Montserrat-Bold' },
  iconCircle: {
    backgroundColor: '#43A047',
    width: 65,
    height: 65,
    borderRadius: 33,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15 },
  whiteCard: {
    backgroundColor: 'white',
    width: '48%',
    padding: 15,
    borderRadius: 15,
    elevation: 3,
  },
  smallLabel: { fontSize: 11, color: '#888', marginBottom: 5, fontFamily: 'Montserrat-Regular' },
  statText: { fontSize: 14, fontFamily: 'Montserrat-Bold', color: '#333' },
  greenValue: { color: '#2E7D32', fontSize: 18, fontFamily: 'Montserrat-Bold' },
  scanButton: {
    backgroundColor: '#2E7D32',
    borderRadius: 20,
    padding: 25,
    marginTop: 25,
    alignItems: 'center',
    elevation: 4,
  },
  scanText: { color: 'white', fontFamily: 'Montserrat-Bold', fontSize: 16, marginTop: 10 },
  listButton: {
    backgroundColor: '#43A047',
    marginTop: 15,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  listText: { color: 'white', fontFamily: 'Montserrat-Bold', fontSize: 15, marginLeft: 10 },
  bottomTab: { 
    height: 75, 
    backgroundColor: 'white', 
    flexDirection: 'row', 
    borderTopWidth: 1, 
    borderTopColor: '#EEE',
    paddingBottom: Platform.OS === 'ios' ? 20 : 10 
  },
  tabItem: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tabLabel: { fontSize: 10, marginTop: 4 },
});