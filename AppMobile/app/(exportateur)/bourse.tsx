import React from 'react';
import { 
  View, Text, StyleSheet, ScrollView, Dimensions, 
  TouchableOpacity, StatusBar, SafeAreaView 
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';

const { width } = Dimensions.get('window');

export default function BourseScreen() {
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
            <Text style={styles.headerSubtitle}>Statistiques</Text>
            <Text style={styles.headerTitle}>Marché & Finance</Text>
          </View>
          <TouchableOpacity style={styles.notifBtn}>
            <MaterialCommunityIcons name="bell-outline" size={24} color="#1B5E20" />
          </TouchableOpacity>
        </View>

        {/* SECTION PORTEFEUILLE */}
        <View style={styles.walletCard}>
          <View style={styles.walletTop}>
            <Text style={styles.walletLabel}>Solde total disponible</Text>
            <MaterialCommunityIcons name="wallet-outline" size={24} color="white" />
          </View>
          <Text style={styles.walletBalance}>4 250 000 FCFA</Text>
          <View style={styles.walletActions}>
            <ActionBtn icon="plus-circle-outline" label="Dépôt" />
            <ActionBtn icon="minus-circle-outline" label="Retrait" />
            <ActionBtn icon="swap-horizontal" label="Échange" />
          </View>
        </View>

        {/* SECTION RENDEMENT */}
        <View style={styles.yieldSection}>
          <Text style={styles.sectionTitle}>Performance Annuelle</Text>
          <View style={styles.yieldCard}>
            <View>
              <Text style={styles.yieldValue}>+12.4%</Text>
              <Text style={styles.yieldSub}>Rendement net 2026</Text>
            </View>
            <View style={styles.yieldIconBg}>
                <MaterialCommunityIcons name="trending-up" size={30} color="#1B5E20" />
            </View>
          </View>
        </View>

        {/* SECTION TENDANCE BOURSE (GRAPHIQUE) */}
        <View style={styles.chartSection}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Cours du Cacao (Togo)</Text>
            <View style={styles.liveBadge}>
              <View style={styles.dot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          </View>
          
          <LineChart
            data={{
              labels: ["Jan", "Fév", "Mar", "Avr", "Mai"],
              datasets: [{ data: [1500, 1700, 1650, 1900, 2100] }]
            }}
            width={width - 40}
            height={200}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />
        </View>

        {/* HISTORIQUE DES FLUX */}
        <View style={styles.historySection}>
          <View style={styles.historyHeader}>
            <Text style={styles.sectionTitle}>Transactions Récentes</Text>
            <TouchableOpacity><Text style={styles.seeMore}>Voir tout</Text></TouchableOpacity>
          </View>

          <TransactionItem 
            title="Vente Lot #402" 
            date="Aujourd'hui, 14:20" 
            amount="+850 000" 
            type="up" 
          />
          <TransactionItem 
            title="Achat Sacs Export" 
            date="Hier, 09:15" 
            amount="-120 000" 
            type="down" 
          />
        </View>

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
          active 
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
  );
}

const ActionBtn = ({ icon, label }: any) => (
  <TouchableOpacity style={styles.actionBtn}>
    <View style={styles.actionIconCircle}>
      <MaterialCommunityIcons name={icon} size={22} color="#1B5E20" />
    </View>
    <Text style={styles.actionLabel}>{label}</Text>
  </TouchableOpacity>
);

const TabItem = ({ icon, label, active = false, onPress }: any) => (
  <TouchableOpacity style={styles.tabItem} onPress={onPress}>
    <MaterialCommunityIcons name={icon} size={24} color={active ? "#1B5E20" : "#888"} />
    <Text style={[styles.tabLabel, { color: active ? "#1B5E20" : "#888" }]}>{label}</Text>
  </TouchableOpacity>
);

const TransactionItem = ({ title, date, amount, type }: any) => (
  <View style={styles.transactionItem}>
    <View style={styles.transacLeft}>
      <View style={[styles.transacIcon, { backgroundColor: type === 'up' ? '#E8F5E9' : '#FFEBEE' }]}>
        <MaterialCommunityIcons 
          name={type === 'up' ? 'arrow-bottom-left' : 'arrow-top-right'} 
          size={20} 
          color={type === 'up' ? '#2E7D32' : '#C62828'} 
        />
      </View>
      <View>
        <Text style={styles.transacTitle}>{title}</Text>
        <Text style={styles.transacDate}>{date}</Text>
      </View>
    </View>
    <Text style={[styles.transacAmount, { color: type === 'up' ? '#2E7D32' : '#C62828' }]}>
      {amount}
    </Text>
  </View>
);

const chartConfig = {
  backgroundGradientFrom: "#1B5E20",
  backgroundGradientTo: "#1B5E20",
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
  style: { borderRadius: 16 },
  propsForDots: { r: "5", strokeWidth: "2", stroke: "#FFF" }
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  scrollContent: { padding: 20 },
  
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  headerSubtitle: { fontSize: 14, fontFamily: 'Montserrat-Regular', color: '#666' },
  headerTitle: { fontSize: 24, fontFamily: 'Montserrat-Bold', color: '#1B5E20' },
  notifBtn: { width: 45, height: 45, backgroundColor: 'white', borderRadius: 12, justifyContent: 'center', alignItems: 'center', elevation: 2 },

  walletCard: { backgroundColor: '#1B5E20', borderRadius: 25, padding: 25, elevation: 8 },
  walletTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  walletLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontFamily: 'Montserrat-Regular' },
  walletBalance: { color: 'white', fontSize: 26, fontFamily: 'Montserrat-Bold', marginBottom: 25 },
  walletActions: { flexDirection: 'row', justifyContent: 'space-between' },
  actionBtn: { alignItems: 'center' },
  actionIconCircle: { width: 45, height: 45, backgroundColor: 'white', borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  actionLabel: { color: 'white', fontSize: 11, fontFamily: 'Montserrat-Bold' },

  sectionTitle: { fontSize: 18, fontFamily: 'Montserrat-Bold', color: '#333', marginBottom: 15 },
  yieldSection: { marginTop: 25 },
  yieldCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', padding: 18, borderRadius: 20, elevation: 2 },
  yieldValue: { fontSize: 24, fontFamily: 'Montserrat-Bold', color: '#1B5E20' },
  yieldSub: { color: '#888', fontSize: 12, fontFamily: 'Montserrat-Regular' },
  yieldIconBg: { width: 45, height: 45, backgroundColor: '#E8F5E9', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },

  chartSection: { marginTop: 25, backgroundColor: '#1B5E20', borderRadius: 25, paddingVertical: 20, paddingHorizontal: 5 },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 15, marginBottom: 10 },
  chartTitle: { color: 'white', fontSize: 16, fontFamily: 'Montserrat-Bold' },
  liveBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  dot: { width: 8, height: 8, backgroundColor: '#FF5252', borderRadius: 4, marginRight: 6 },
  liveText: { color: 'white', fontSize: 10, fontFamily: 'Montserrat-Bold' },
  chart: { marginVertical: 8, borderRadius: 16 },

  historySection: { marginTop: 25 },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  seeMore: { color: '#1B5E20', fontFamily: 'Montserrat-Bold', fontSize: 13 },
  transactionItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', padding: 15, borderRadius: 15, marginBottom: 10, elevation: 1 },
  transacLeft: { flexDirection: 'row', alignItems: 'center' },
  transacIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  transacTitle: { fontFamily: 'Montserrat-Bold', color: '#333', fontSize: 14 },
  transacDate: { fontSize: 11, color: '#999', fontFamily: 'Montserrat-Regular' },
  transacAmount: { fontFamily: 'Montserrat-Bold' },

  bottomTab: { 
    position: 'absolute', bottom: 0, left: 0, right: 0, 
    height: 85, backgroundColor: 'white', flexDirection: 'row', 
    borderTopLeftRadius: 25, borderTopRightRadius: 25,
    elevation: 20
  },
  tabItem: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 5 },
  tabLabel: { fontSize: 10, marginTop: 5, fontFamily: 'Montserrat-Regular' }
});