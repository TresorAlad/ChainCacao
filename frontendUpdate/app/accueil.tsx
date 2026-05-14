import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  StatusBar 
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient'; 
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';

export default function MainDashboard() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // On initialise avec une liste vide ou des données par défaut
  // Dans une vraie app, ces données viendraient d'un Context ou d'une DB
  const [productions, setProductions] = useState<any[]>([]);

  // Simulation de la récupération des données de la page Production
  useEffect(() => {
    // Si vous revenez de la page de création ou production avec des données
    if (params.data) {
        try {
            const currentData = JSON.parse(params.data as string);
            setProductions(currentData);
        } catch (e) {
            console.log("Erreur de parsing");
        }
    }
  }, [params.data]);

  // --- LOGIQUE DE CALCUL DEMANDÉE ---
  
  // 1. Nombre total de kilos avec le statut "Terminé"
  const totalKilosTermines = productions
    .filter(lot => lot.status === 'Terminé')
    .reduce((acc, lot) => acc + (parseFloat(lot.poids) || 0), 0);

  // 2. Nombre de lots terminés sur le nombre total de lots
  const nbLotsTermines = productions.filter(lot => lot.status === 'Terminé').length;
  const nbTotalLots = productions.length;

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top']}>
        <Stack.Screen options={{ headerShown: false }} />
        <StatusBar barStyle="light-content" />
        
        {/* HEADER */}
        <LinearGradient colors={['#1B5E20', '#2E7D32', '#43A047']} style={styles.header}>
          <MaterialCommunityIcons name="menu" size={32} color="white" />
          <Text style={styles.brandText}>Chaincacao</Text>
          <MaterialCommunityIcons name="bell-outline" size={26} color="white" />
        </LinearGradient>

        <View style={styles.body}>
          <ScrollView contentContainerStyle={styles.content}>
            
            <Text style={styles.welcomeText}>Tableau de bord</Text>
            
            {/* CARTE STATISTIQUES ÉPURÉE */}
            <View style={styles.statsCard}>
              
              {/* TOTAL KILOS TERMINÉS */}
              <View style={styles.statItem}>
                 <Text style={styles.statValue}>{totalKilosTermines.toLocaleString()} kg</Text>
                 <Text style={styles.statLabel}>Total Kilos Terminés</Text>
              </View>
              
              <View style={styles.divider} />
              
              {/* RATIO LOTS TERMINÉS / TOTAL */}
              <View style={styles.statItem}>
                 <Text style={styles.statValue}>{nbLotsTermines} / {nbTotalLots}</Text>
                 <Text style={styles.statLabel}>Lots Validés</Text>
              </View>

            </View>

          </ScrollView>
        </View>

        {/* NAVIGATION BASSE */}
        <View style={styles.bottomTab}>
          <TabItem icon="home" label="Accueil" active color="#2E7D32" onPress={() => {}} />
          <TabItem icon="sprout" label="Production" onPress={() => router.push('/production')} />
          <TabItem icon="cash-multiple" label="Revenus" onPress={() => {}} />
          <TabItem icon="account-circle" label="Profil" onPress={() => router.push('/profil')} />
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const TabItem = ({ icon, label, active = false, color = "#666", onPress }: any) => (
  <TouchableOpacity style={styles.tabItem} onPress={onPress}>
    <MaterialCommunityIcons name={icon} size={24} color={active ? color : "#666"} />
    <Text style={[styles.tabLabel, { color: active ? color : "#666" }]}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1B5E20' },
  header: { height: 80, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 },
  brandText: { color: 'white', fontSize: 22, fontWeight: 'bold' },
  body: { flex: 1, backgroundColor: '#F8F9FA', borderTopLeftRadius: 30, borderTopRightRadius: 30, marginTop: -10 },
  content: { padding: 25 },
  welcomeText: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 25 },
  statsCard: { 
    backgroundColor: 'white', 
    borderRadius: 20, 
    padding: 25, 
    flexDirection: 'row', 
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: 'bold', color: '#2E7D32' },
  statLabel: { fontSize: 11, color: '#999', marginTop: 8, textAlign: 'center', fontWeight: '600' },
  divider: { width: 1, backgroundColor: '#EEE', marginHorizontal: 10 },
  bottomTab: { height: 70, backgroundColor: 'white', flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#EEE' },
  tabItem: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tabLabel: { fontSize: 10, marginTop: 4, fontWeight: '600' },
});