import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  StatusBar,
  ActivityIndicator
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import * as Font from 'expo-font';
import { myLotsApi, getApiError } from '@/services/api';

const EXPORT_DATA = {
  recentShipments: [
    { id: 'S1', destination: 'Anvers, Belgique', poids: '25T', statut: 'En mer', date: '10/05/2026' },
    { id: 'S2', destination: 'Le Havre, France', poids: '20T', statut: 'Chargement', date: '12/05/2026' },
    { id: 'S3', destination: 'Hambourg, Allemagne', poids: '18T', statut: 'Douane', date: '13/05/2026' },
  ],
};

export default function ExportateurDashboard() {
  const router = useRouter();
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [stockTotal, setStockTotal] = useState('0');
  const [lotsExpedies, setLotsExpedies] = useState(0);
  const [shipments, setShipments] = useState(EXPORT_DATA.recentShipments);

  useEffect(() => {
    async function loadResources() {
      try {
        await Font.loadAsync({
          'Montserrat-Bold': require('../../assets/fonts/Montserrat-Bold.ttf'),
          'Montserrat-Regular': require('../../assets/fonts/Montserrat-Regular.ttf'),
        });
      } catch (e) {
        console.warn("Erreur chargement polices");
      } finally {
        setFontsLoaded(true);
      }
    }
    loadResources();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await myLotsApi.list();
        const lots = data.lots ?? [];
        const kg = lots.reduce((s, b) => s + (b.quantite ?? 0), 0);
        setStockTotal((kg / 1000).toFixed(1));
        setLotsExpedies(lots.length);
        const mapped = lots.slice(0, 5).map((b, i) => ({
          id: b.id || String(i),
          destination: b.lieu || '—',
          poids: `${b.quantite ?? 0} kg`,
          statut: b.statut || 'Stock',
          date: b.date_recolte || b.timestamp || '',
        }));
        if (mapped.length > 0) setShipments(mapped);
      } catch (e) {
        console.warn(getApiError(e));
      }
    })();
  }, []);

  if (!fontsLoaded) return (
    <View style={styles.loaderContainer}>
      <ActivityIndicator size="large" color="#1B5E20" />
    </View>
  );

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top']}>
        <Stack.Screen options={{ headerShown: false }} />
        <StatusBar barStyle="light-content" />

        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>Bonjour,</Text>
            <Text style={styles.headerTitle}>Espace Exportateur</Text>
          </View>
          {/* CORRECTION : Route vers la page paramètre */}
          <TouchableOpacity 
            activeOpacity={0.7}
            onPress={() => router.push('/(exportateur)/parametre')}
          >
            <MaterialCommunityIcons name="cog-outline" size={28} color="white" />
          </TouchableOpacity>
        </View>

        <View style={styles.body}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            
            {/* STATS */}
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <View style={styles.statIconBg}>
                  <MaterialCommunityIcons name="warehouse" size={22} color="#1B5E20" />
                </View>
                <View>
                  <Text style={styles.statValue}>{stockTotal}T</Text>
                  <Text style={styles.statLabel}>Stock Entrepôt</Text>
                </View>
              </View>
              <View style={styles.statCard}>
                <View style={styles.statIconBg}>
                  <MaterialCommunityIcons name="truck-check" size={22} color="#1B5E20" />
                </View>
                <View>
                  <Text style={styles.statValue}>{lotsExpedies}</Text>
                  <Text style={styles.statLabel}>Lots Expédiés</Text>
                </View>
              </View>
            </View>

            {/* SUIVI DES EXPÉDITIONS */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Suivi des Expéditions</Text>
              <TouchableOpacity onPress={() => router.push('/(exportateur)/stock')}>
                <Text style={styles.seeAll}>Tout voir</Text>
              </TouchableOpacity>
            </View>

            {shipments.map((item) => (
              <View key={item.id} style={styles.shipmentCard}>
                <View style={styles.shipmentIcon}>
                   <MaterialCommunityIcons name="ferry" size={24} color="#1B5E20" />
                </View>
                <View style={styles.shipmentInfo}>
                  <Text style={styles.destText}>{item.destination}</Text>
                  <Text style={styles.dateText}>{item.date} • {item.poids}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.statut) }]}>
                  <Text style={styles.statusText}>{item.statut}</Text>
                </View>
              </View>
            ))}

            <View style={{ height: 100 }} />
          </ScrollView>
        </View>

        {/* BOTTOM NAVIGATION HARMONISÉE (5 ONGLET) */}
        <View style={styles.bottomTab}>
          <TabItem 
            icon="home-variant" 
            label="Accueil" 
            active 
          />
          <TabItem 
            icon="chart-line" 
            label="Bourse" 
            onPress={() => router.push('/(exportateur)/bourse')} 
          />
          <TabItem 
            icon="qrcode-scan" 
            label="Scanner" 
            onPress={() => router.push('/(exportateur)/scanner')} 
          />
          <TabItem 
            icon="package-variant-closed" 
            label="Stock" 
            onPress={() => router.push('/(exportateur)/stock')} 
          />
          <TabItem 
            icon="file-document-outline" 
            label="Rapport" 
            onPress={() => router.push('/(exportateur)/rapport')} 
          />
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const TabItem = ({ icon, label, active = false, onPress }: any) => (
  <TouchableOpacity style={styles.tabItem} onPress={onPress}>
    <MaterialCommunityIcons name={icon} size={24} color={active ? "#1B5E20" : "#888"} />
    <Text style={[styles.tabLabel, { color: active ? "#1B5E20" : "#888" }]}>{label}</Text>
  </TouchableOpacity>
);

const getStatusColor = (status: string) => {
  switch (status) {
    case 'En mer': return '#1976D2';
    case 'Chargement': return '#F57C00';
    case 'Douane': return '#607D8B';
    default: return '#888';
  }
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1B5E20' },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { height: 90, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20 },
  welcomeText: { color: 'rgba(255,255,255,0.7)', fontSize: 14, fontFamily: 'Montserrat-Regular' },
  headerTitle: { color: 'white', fontSize: 22, fontFamily: 'Montserrat-Bold' },
  
  body: { flex: 1, backgroundColor: '#F8F9FA', borderTopLeftRadius: 30, borderTopRightRadius: 30 },
  scrollContent: { padding: 20 },
  
  statsGrid: { flexDirection: 'row', gap: 12, marginBottom: 25 },
  statCard: { 
    flex: 1, 
    backgroundColor: 'white', 
    padding: 15, 
    borderRadius: 20, 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8,
    elevation: 2 
  },
  statIconBg: { width: 35, height: 35, backgroundColor: '#E8F5E9', borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  statValue: { fontSize: 18, fontFamily: 'Montserrat-Bold', color: '#333' },
  statLabel: { fontSize: 10, color: '#777', fontFamily: 'Montserrat-Regular' },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 18, fontFamily: 'Montserrat-Bold', color: '#333' },
  seeAll: { color: '#1B5E20', fontSize: 13, fontFamily: 'Montserrat-Bold' },

  shipmentCard: { 
    backgroundColor: 'white', 
    padding: 15, 
    borderRadius: 20, 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 12, 
    elevation: 1 
  },
  shipmentIcon: { width: 45, height: 45, borderRadius: 12, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center' },
  shipmentInfo: { flex: 1, marginLeft: 12 },
  destText: { fontFamily: 'Montserrat-Bold', fontSize: 14, color: '#333' },
  dateText: { fontFamily: 'Montserrat-Regular', fontSize: 11, color: '#999', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { color: 'white', fontSize: 10, fontFamily: 'Montserrat-Bold' },

  eudrBanner: {
    backgroundColor: '#1B5E20',
    padding: 20,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    elevation: 4
  },
  eudrBannerTitle: { color: 'white', fontFamily: 'Montserrat-Bold', fontSize: 16 },
  eudrBannerSub: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontFamily: 'Montserrat-Regular', marginTop: 2 },

  bottomTab: { 
    position: 'absolute', bottom: 0, left: 0, right: 0, 
    height: 85, backgroundColor: 'white', flexDirection: 'row', 
    borderTopLeftRadius: 25, borderTopRightRadius: 25,
    elevation: 20
  },
  tabItem: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 5 },
  tabLabel: { fontSize: 10, marginTop: 5, fontFamily: 'Montserrat-Regular' }
});