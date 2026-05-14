import React from 'react';
import { 
  View, Text, StyleSheet, ScrollView, Image, 
  TouchableOpacity, SafeAreaView, StatusBar, Dimensions 
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// Données fictives
const STOCK_DATA = [
  {
    id: 'LOT-2026-001',
    statut: 'En Transit',
    poids: '15 Tonnes',
    destination: 'Port de Lomé',
    image: 'https://images.unsplash.com/photo-1582131503261-fca1d1c058d3?q=80&w=500&auto=format&fit=crop',
    progress: 0.6
  },
  {
    id: 'LOT-2026-005',
    statut: 'Arrivé',
    poids: '8 Tonnes',
    destination: 'Entrepôt Kpalimé',
    image: 'https://images.unsplash.com/photo-1628102422617-6404764836f3?q=80&w=500&auto=format&fit=crop',
    progress: 1.0
  }
];

export default function StockScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" />

      {/* HEADER OPTIMISÉ */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSubtitle}>Inventaire</Text>
          <Text style={styles.headerTitle}>Gestion de Stock</Text>
        </View>
        <TouchableOpacity style={styles.filterBtn}>
          <MaterialCommunityIcons name="filter-variant" size={24} color="#1B5E20" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* STATISTIQUES RAPIDES */}
        <View style={styles.statsRow}>
            <StatCard label="Total Stock" value="23T" icon="package-variant-closed" />
            <StatCard label="En Route" value="15T" icon="truck-check-outline" />
        </View>

        <Text style={styles.sectionTitle}>Lots en cours</Text>

        {/* LISTE DES LOTS */}
        {STOCK_DATA.map((item) => (
          <View key={item.id} style={styles.stockCard}>
            <Image source={{ uri: item.image }} style={styles.stockImage} />
            
            <View style={styles.cardContent}>
              <View style={styles.cardHeader}>
                <Text style={styles.lotId}>{item.id}</Text>
                <View style={[styles.badge, { backgroundColor: item.statut === 'Arrivé' ? '#E8F5E9' : '#FFF3E0' }]}>
                  <Text style={[styles.badgeText, { color: item.statut === 'Arrivé' ? '#2E7D32' : '#E65100' }]}>
                    {item.statut.toUpperCase()}
                  </Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="weight-kilogram" size={18} color="#1B5E20" />
                <Text style={styles.infoText}>{item.poids}</Text>
                <MaterialCommunityIcons name="map-marker-radius-outline" size={18} color="#1B5E20" style={{marginLeft: 15}} />
                <Text style={styles.infoText}>{item.destination}</Text>
              </View>

              {/* BARRE DE PROGRESSION */}
              <View style={styles.progressContainer}>
                <View style={[styles.progressBar, { width: `${item.progress * 100}%` }]} />
              </View>

              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                <TouchableOpacity
                  style={[styles.linkBtn, { backgroundColor: '#E8F5E9' }]}
                  onPress={() => router.push(`/(exportateur)/rapport-eudr?lotId=${encodeURIComponent(item.id)}` as any)}
                >
                  <Text style={[styles.linkBtnText, { color: '#1B5E20' }]}>Rapport EUDR</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.linkBtn, { backgroundColor: '#FFF3E0' }]}
                  onPress={() => router.push(`/(exportateur)/paiement?lotId=${encodeURIComponent(item.id)}` as any)}
                >
                  <Text style={[styles.linkBtnText, { color: '#E65100' }]}>Confirmer / payer</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.exportButton}>
                <MaterialCommunityIcons name="truck-delivery-outline" size={20} color="white" />
                <Text style={styles.exportButtonText}>Détails de l'expédition</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
        
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* LA BOTTOM TAB HARMONISÉE (5 ONGLET) */}
      <View style={styles.bottomTab}>
        <TabItem 
          icon="home-variant" 
          label="Accueil" 
          onPress={() => router.push('/(exportateur)/accueil')} 
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
          active 
        />
        <TabItem 
          icon="file-document-outline" 
          label="Rapport" 
          onPress={() => router.push('/(exportateur)/rapport')} 
        />
      </View>
    </SafeAreaView>
  );
}

// COMPOSANTS INTERNES
const StatCard = ({ label, value, icon }: any) => (
  <View style={styles.statCard}>
    <View style={styles.statIconBg}>
        <MaterialCommunityIcons name={icon} size={22} color="#1B5E20" />
    </View>
    <View>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
    </View>
  </View>
);

const TabItem = ({ icon, label, active = false, onPress }: any) => (
  <TouchableOpacity style={styles.tabItem} onPress={onPress}>
    <MaterialCommunityIcons name={icon} size={24} color={active ? "#1B5E20" : "#888"} />
    <Text style={[styles.tabLabel, { color: active ? "#1B5E20" : "#888" }]}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { 
    backgroundColor: '#1B5E20', 
    paddingTop: 50, 
    paddingBottom: 30, 
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 5
  },
  headerTitle: { fontSize: 24, fontFamily: 'Montserrat-Bold', color: 'white' },
  headerSubtitle: { fontSize: 13, fontFamily: 'Montserrat-Regular', color: 'rgba(255,255,255,0.7)' },
  filterBtn: { backgroundColor: 'white', padding: 10, borderRadius: 12, elevation: 2 },
  
  scrollContent: { padding: 20 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 25 },
  statCard: { flex: 1, backgroundColor: 'white', padding: 15, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 10, elevation: 2 },
  statIconBg: { width: 40, height: 40, backgroundColor: '#E8F5E9', borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  statValue: { fontSize: 18, fontFamily: 'Montserrat-Bold', color: '#333' },
  statLabel: { fontSize: 10, fontFamily: 'Montserrat-Regular', color: '#777' },

  sectionTitle: { fontSize: 18, fontFamily: 'Montserrat-Bold', color: '#1B5E20', marginBottom: 15 },
  
  stockCard: { backgroundColor: 'white', borderRadius: 25, marginBottom: 20, overflow: 'hidden', elevation: 3 },
  stockImage: { width: '100%', height: 160 },
  cardContent: { padding: 20 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  lotId: { fontSize: 16, fontFamily: 'Montserrat-Bold', color: '#333' },
  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  badgeText: { fontSize: 10, fontFamily: 'Montserrat-Bold' },
  
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  infoText: { fontSize: 13, fontFamily: 'Montserrat-Bold', color: '#444', marginLeft: 6 },
  
  progressContainer: { height: 8, backgroundColor: '#F0F0F0', borderRadius: 4, marginBottom: 20 },
  progressBar: { height: '100%', backgroundColor: '#4CAF50', borderRadius: 4 },
  
  exportButton: { 
    backgroundColor: '#1B5E20', 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 15, 
    borderRadius: 18, 
    gap: 10 
  },
  exportButtonText: { color: 'white', fontFamily: 'Montserrat-Bold', fontSize: 14 },
  linkBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
  linkBtnText: { fontFamily: 'Montserrat-Bold', fontSize: 12 },

  bottomTab: { 
    position: 'absolute', bottom: 0, left: 0, right: 0, 
    height: 85, backgroundColor: 'white', flexDirection: 'row', 
    borderTopLeftRadius: 25, borderTopRightRadius: 25,
    elevation: 20, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10
  },
  tabItem: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 5 },
  tabLabel: { fontSize: 10, marginTop: 5, fontFamily: 'Montserrat-Regular' }
});