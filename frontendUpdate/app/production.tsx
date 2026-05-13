import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  FlatList,
  Dimensions
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router'; 
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

interface Production {
  id: string;
  title: string;
  status: 'Terminé' | 'En cours' | 'Problème';
  date: string;
  poids?: string;
  acheteur?: string;
  destination?: string;
}

export default function ProductionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams(); 
  const brandGreen = '#228B22';

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('Tous');
  
  // CORRECTION : Initialisé avec un tableau vide [] pour qu'il n'y ait rien au départ
  const [productions, setProductions] = useState<Production[]>([]);

  // 1. ÉCOUTER LES NOUVEAUX LOTS CRÉÉS
  useEffect(() => {
    if (params.newLotTitle) {
      const nouveauLot: Production = {
        id: Math.random().toString(),
        title: params.newLotTitle as string,
        status: (params.newLotStatus as any) || 'En cours',
        date: params.newLotDate as string,
        poids: (params.newLotQty as string) || '0',
        destination: (params.newLotZone as string) || 'Non spécifiée',
      };

      setProductions(prev => {
          const exists = prev.find(p => p.title === nouveauLot.title && p.date === nouveauLot.date);
          if (exists) return prev;
          return [nouveauLot, ...prev]; 
      });
    }
  }, [params.newLotTitle, params.newLotDate]);

  // 2. RENVOYER LES DONNÉES À L'ACCUEIL
  const retournerAccueil = () => {
    router.push({
      pathname: '/(tabs)/accueil', 
      params: { data: JSON.stringify(productions) }
    });
  };

  const filteredData = productions.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'Tous' || item.status === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      <LinearGradient colors={['#1B5E20', '#2E7D32', '#43A047']} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={retournerAccueil}>
          <MaterialCommunityIcons name="arrow-left" size={28} color="white" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Productions</Text>
        
        <TouchableOpacity onPress={() => router.push('/profil')}>
          <MaterialCommunityIcons name="account-circle" size={28} color="white" />
        </TouchableOpacity>
      </LinearGradient>

      <View style={styles.body}>
        <View style={styles.searchContainer}>
          <MaterialCommunityIcons name="magnify" size={20} color="#999" />
          <TextInput 
            style={styles.searchInput}
            placeholder="Rechercher un lot..."
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <View style={styles.filterBar}>
          {['Tous', 'Terminé', 'En cours', 'Problème'].map((f) => (
            <TouchableOpacity 
              key={f} 
              style={[styles.filterBtn, filter === f && { backgroundColor: brandGreen }]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterText, filter === f && { color: 'white' }]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <FlatList
          data={filteredData}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          // MESSAGE SI VIDE
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="clipboard-text-outline" size={80} color="#CCC" />
              <Text style={styles.emptyText}>Aucun lot enregistré.</Text>
              <Text style={styles.emptySubText}>Cliquez sur le bouton + pour commencer.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.card}
              onPress={() => router.push({
                pathname: "/caracteristiqueslot",
                params: {
                  title: item.title,
                  status: item.status,
                  dateProd: item.date,
                  poids: item.poids || "0",
                  acheteur: item.acheteur || "En attente",
                  destination: item.destination || "En transit",
                }
              })}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <StatusBadge status={item.status} />
                  <MaterialCommunityIcons name="chevron-right" size={20} color="#CCC" />
                </View>
              </View>
              <Text style={styles.cardDate}>{item.date} • {item.poids} kg</Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <TouchableOpacity style={styles.fab} onPress={() => router.push('/creationlot')}>
        <MaterialCommunityIcons name="plus" size={35} color="white" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const StatusBadge = ({ status }: { status: string }) => {
  let color = '#666';
  if (status === 'Terminé') color = '#2E7D32';
  if (status === 'En cours') color = '#F9A825';
  if (status === 'Problème') color = '#C62828';
  return (
    <View style={[styles.badge, { backgroundColor: color + '20', borderColor: color }]}>
      <Text style={[styles.badgeText, { color }]}>{status}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1B5E20' },
  header: { height: 70, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 },
  headerTitle: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  backButton: { padding: 5 },
  body: { flex: 1, backgroundColor: '#F8F9FA', borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingTop: 20 },
  searchContainer: { flexDirection: 'row', backgroundColor: 'white', marginHorizontal: 20, paddingHorizontal: 15, borderRadius: 15, height: 50, alignItems: 'center', elevation: 2 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16 },
  filterBar: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginVertical: 15 },
  filterBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: '#EEE' },
  filterText: { fontSize: 12, fontWeight: 'bold', color: '#666' },
  listContent: { paddingHorizontal: 20, paddingBottom: 100, flexGrow: 1 },
  card: { backgroundColor: 'white', borderRadius: 15, padding: 15, marginBottom: 12, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  cardDate: { fontSize: 13, color: '#999', marginTop: 5 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, marginRight: 5 },
  badgeText: { fontSize: 10, fontWeight: 'bold' },
  fab: { position: 'absolute', bottom: 30, right: 20, backgroundColor: '#2E7D32', width: 65, height: 65, borderRadius: 32.5, justifyContent: 'center', alignItems: 'center', elevation: 8 },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyText: { fontSize: 18, color: '#666', fontWeight: 'bold', marginTop: 10 },
  emptySubText: { fontSize: 14, color: '#999', marginTop: 5 },
});