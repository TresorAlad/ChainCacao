import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  FlatList,
  Dimensions,
  Platform
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
  const brandGreen = '#2E7D32';

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('Tous');
  const [productions, setProductions] = useState<Production[]>([]);

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

  const filteredData = productions.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase());
    // On garde la logique de filtrage mais on a retiré l'option "Problème" de l'interface
    const matchesFilter = filter === 'Tous' || item.status === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* HEADER */}
      <LinearGradient colors={['#1B5E20', '#2E7D32', '#43A047']} style={styles.header}>
        <Text style={styles.headerTitle}>Lots</Text>
      </LinearGradient>

      <View style={styles.body}>
        <View style={styles.searchContainer}>
          <MaterialCommunityIcons name="magnify" size={20} color="#999" />
          <TextInput 
            style={styles.searchInput}
            placeholder="Rechercher un lot..."
            placeholderTextColor="#999"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <View style={styles.filterBar}>
          {/* Option "Problème" supprimée ici */}
          {['Tous', 'Terminé', 'En cours'].map((f) => (
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
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="clipboard-text-outline" size={80} color="#CCC" />
              <Text style={styles.emptyText}>Aucun lot reçu.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.card}
              onPress={() => router.push({
                pathname: "/caracteristiqueslot",
                params: { ...item }
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

      {/* NAVIGATION BASSE */}
      <View style={styles.bottomTab}>
        <TabItem 
          icon="home-variant" 
          label="Dashboard" 
          onPress={() => router.push('/(cooperative)/accueil' as any)} 
        />
        <TabItem 
          icon="camera" 
          label="Scanner" 
          onPress={() => router.push('/(cooperative)/scanner' as any)} 
        />
        <TabItem 
          icon="package-variant-closed" 
          label="Lots" 
          active 
          color="#2E7D32" 
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
  );
}

// Sous-composants
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

const TabItem = ({ icon, label, active = false, color = "#666", onPress }: any) => (
  <TouchableOpacity style={styles.tabItem} onPress={onPress} activeOpacity={0.6}>
    <MaterialCommunityIcons name={icon} size={26} color={active ? color : "#666"} />
    <Text style={[styles.tabLabel, { color: active ? color : "#666", fontFamily: active ? 'Montserrat-Bold' : 'Montserrat-Regular' }]}>
        {label}
    </Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1B5E20' },
  header: { 
    height: 70, 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 25 
  },
  headerTitle: { 
    color: 'white', 
    fontSize: 24, 
    fontFamily: 'Montserrat-Bold' 
  },
  body: { 
    flex: 1, 
    backgroundColor: '#F8F9FA', 
    borderTopLeftRadius: 30, 
    borderTopRightRadius: 30, 
    paddingTop: 20 
  },
  searchContainer: { 
    flexDirection: 'row', 
    backgroundColor: 'white', 
    marginHorizontal: 20, 
    paddingHorizontal: 15, 
    borderRadius: 15, 
    height: 50, 
    alignItems: 'center', 
    elevation: 2 
  },
  searchInput: { 
    flex: 1, 
    marginLeft: 10, 
    fontSize: 16, 
    fontFamily: 'Montserrat-Regular',
    color: '#333'
  },
  filterBar: { 
    flexDirection: 'row', 
    justifyContent: 'flex-start', // Alignement au début pour 3 boutons
    paddingHorizontal: 20, 
    marginVertical: 15 
  },
  filterBtn: { 
    paddingHorizontal: 15, 
    paddingVertical: 8, 
    borderRadius: 20, 
    backgroundColor: '#EEE',
    marginRight: 10
  },
  filterText: { 
    fontSize: 12, 
    fontFamily: 'Montserrat-Bold', 
    color: '#666' 
  },
  listContent: { 
    paddingHorizontal: 20, 
    paddingBottom: 40, // Moins d'espace nécessaire sans le FAB
    flexGrow: 1 
  },
  card: { 
    backgroundColor: 'white', 
    borderRadius: 15, 
    padding: 15, 
    marginBottom: 12, 
    elevation: 2 
  },
  cardHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  cardTitle: { 
    fontSize: 16, 
    fontFamily: 'Montserrat-Bold', 
    color: '#333' 
  },
  cardDate: { 
    fontSize: 13, 
    color: '#999', 
    marginTop: 5, 
    fontFamily: 'Montserrat-Regular' 
  },
  badge: { 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 8, 
    borderWidth: 1, 
    marginRight: 5 
  },
  badgeText: { 
    fontSize: 10, 
    fontFamily: 'Montserrat-Bold' 
  },
  emptyContainer: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginTop: 100 
  },
  emptyText: { 
    fontSize: 18, 
    color: '#666', 
    fontFamily: 'Montserrat-Bold', 
    marginTop: 10 
  },
  bottomTab: { 
    height: 75, 
    backgroundColor: 'white', 
    flexDirection: 'row', 
    borderTopWidth: 1, 
    borderTopColor: '#EEE', 
    paddingBottom: Platform.OS === 'ios' ? 15 : 0 
  },
  tabItem: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  tabLabel: { 
    fontSize: 10, 
    marginTop: 4 
  },
});