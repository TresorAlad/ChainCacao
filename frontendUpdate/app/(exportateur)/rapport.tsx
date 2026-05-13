import React from 'react';
import { 
  View, Text, StyleSheet, ScrollView, 
  TouchableOpacity, StatusBar, SafeAreaView 
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function RapportScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="dark-content" />

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerSubtitle}>Documentation</Text>
            <Text style={styles.headerTitle}>Rapports & Certifs</Text>
          </View>
          <TouchableOpacity style={styles.downloadAllBtn}>
            <MaterialCommunityIcons name="cloud-download-outline" size={22} color="#1B5E20" />
          </TouchableOpacity>
        </View>

        {/* SECTION RÉSUMÉ CONFORMITÉ */}
        <View style={styles.complianceCard}>
          <View style={styles.complianceHeader}>
            <Text style={styles.complianceTitle}>Conformité EUDR</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>À JOUR</Text>
            </View>
          </View>
          <Text style={styles.complianceDesc}>
            Vos certificats de géo-localisation pour la saison 2026 sont validés.
          </Text>
          <View style={styles.divider} />
          <View style={styles.complianceStats}>
            <View style={styles.compStatItem}>
              <Text style={styles.compStatVal}>98%</Text>
              <Text style={styles.compStatLab}>Parcelles GPS</Text>
            </View>
            <View style={styles.compStatItem}>
              <Text style={styles.compStatVal}>124</Text>
              <Text style={styles.compStatLab}>Lots Certifiés</Text>
            </View>
          </View>
        </View>

        {/* LISTE DES DOCUMENTS */}
        <Text style={styles.sectionTitle}>Documents récents</Text>
        
        <ReportItem 
          title="Rapport Déforestation Mai 2026" 
          subtitle="Format PDF • 2.4 MB" 
          icon="file-pdf-box"
          color="#E53935"
        />
        <ReportItem 
          title="Certificats Origine - Lot #502" 
          subtitle="Format PDF • 1.1 MB" 
          icon="certificate"
          color="#1B5E20"
        />
        <ReportItem 
          title="Analyse Qualité Export" 
          subtitle="Format XLSX • 850 KB" 
          icon="file-excel"
          color="#2E7D32"
        />
        <ReportItem 
          title="Preuve de Géo-localisation" 
          subtitle="Format PDF • 5.7 MB" 
          icon="map-marker-check"
          color="#1976D2"
        />

        {/* ACTION GENERER */}
        <TouchableOpacity style={styles.generateBtn}>
          <MaterialCommunityIcons name="plus" size={24} color="white" />
          <Text style={styles.generateBtnText}>Générer un nouveau rapport</Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* LA BOTTOM TAB MÉMORISÉE */}
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
          onPress={() => router.push('/(exportateur)/stock')} 
        />
        <TabItem 
          icon="file-document-outline" 
          label="Rapport" 
          active 
        />
      </View>
    </SafeAreaView>
  );
}

const ReportItem = ({ title, subtitle, icon, color }: any) => (
  <TouchableOpacity style={styles.reportItem}>
    <View style={[styles.reportIconContainer, { backgroundColor: color + '15' }]}>
      <MaterialCommunityIcons name={icon} size={26} color={color} />
    </View>
    <View style={styles.reportTextContainer}>
      <Text style={styles.reportTitle}>{title}</Text>
      <Text style={styles.reportSubtitle}>{subtitle}</Text>
    </View>
    <MaterialCommunityIcons name="dots-vertical" size={20} color="#CCC" />
  </TouchableOpacity>
);

const TabItem = ({ icon, label, active = false, onPress }: any) => (
  <TouchableOpacity style={styles.tabItem} onPress={onPress}>
    <MaterialCommunityIcons name={icon} size={24} color={active ? "#1B5E20" : "#888"} />
    <Text style={[styles.tabLabel, { color: active ? "#1B5E20" : "#888" }]}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  scrollContent: { padding: 20 },
  
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  headerSubtitle: { fontSize: 14, fontFamily: 'Montserrat-Regular', color: '#666' },
  headerTitle: { fontSize: 24, fontFamily: 'Montserrat-Bold', color: '#1B5E20' },
  downloadAllBtn: { width: 45, height: 45, backgroundColor: 'white', borderRadius: 12, justifyContent: 'center', alignItems: 'center', elevation: 2 },

  complianceCard: { backgroundColor: '#1B5E20', borderRadius: 25, padding: 20, elevation: 5, marginBottom: 30 },
  complianceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  complianceTitle: { color: 'white', fontSize: 18, fontFamily: 'Montserrat-Bold' },
  statusBadge: { backgroundColor: '#4CAF50', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { color: 'white', fontSize: 10, fontFamily: 'Montserrat-Bold' },
  complianceDesc: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontFamily: 'Montserrat-Regular', lineHeight: 20 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginVertical: 15 },
  complianceStats: { flexDirection: 'row', justifyContent: 'space-around' },
  compStatItem: { alignItems: 'center' },
  compStatVal: { color: 'white', fontSize: 20, fontFamily: 'Montserrat-Bold' },
  compStatLab: { color: 'rgba(255,255,255,0.6)', fontSize: 11, fontFamily: 'Montserrat-Regular' },

  sectionTitle: { fontSize: 18, fontFamily: 'Montserrat-Bold', color: '#333', marginBottom: 15 },
  reportItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', padding: 15, borderRadius: 20, marginBottom: 12, elevation: 1 },
  reportIconContainer: { width: 50, height: 50, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  reportTextContainer: { flex: 1, marginLeft: 15 },
  reportTitle: { fontSize: 14, fontFamily: 'Montserrat-Bold', color: '#333' },
  reportSubtitle: { fontSize: 12, fontFamily: 'Montserrat-Regular', color: '#999', marginTop: 2 },

  generateBtn: { backgroundColor: '#1B5E20', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 18, borderRadius: 20, marginTop: 10, elevation: 3 },
  generateBtnText: { color: 'white', fontFamily: 'Montserrat-Bold', marginLeft: 10 },

  bottomTab: { 
    position: 'absolute', bottom: 0, left: 0, right: 0, 
    height: 85, backgroundColor: 'white', flexDirection: 'row', 
    borderTopLeftRadius: 25, borderTopRightRadius: 25,
    elevation: 20
  },
  tabItem: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 5 },
  tabLabel: { fontSize: 10, marginTop: 5, fontFamily: 'Montserrat-Regular' }
});