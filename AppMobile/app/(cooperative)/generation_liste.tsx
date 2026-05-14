import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  FlatList, 
  Platform 
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Lot {
  id: string;
  title: string;
  poids: number;
  date: string;
}

export default function GenerationListeScreen() {
  const router = useRouter();
  const brandGreen = '#2E7D32';

  const [lots, setLots] = useState<Lot[]>([
    { id: '1', title: 'Lot Cacao - Zone A', poids: 250, date: '12/05/2026' },
    { id: '2', title: 'Lot Cacao - Zone B', poids: 400, date: '11/05/2026' },
    { id: '3', title: 'Lot Cacao - Zone A', poids: 150, date: '10/05/2026' },
    { id: '4', title: 'Récolte Nord', poids: 500, date: '09/05/2026' },
  ]);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // LOGIQUE DE RECHERCHE RÉELLE
  const filteredLots = lots.filter(l => 
    l.title.toLowerCase().includes(search.toLowerCase())
  );

  const selectedLotsData = lots.filter(l => selectedIds.includes(l.id));
  const poidsTotal = selectedLotsData.reduce((acc, curr) => acc + curr.poids, 0);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* HEADER : Couleur unie, pas de dégradé */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <MaterialCommunityIcons name="arrow-left" size={26} color="white" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Liste groupée</Text>
        
        <View style={styles.headerBtn} /> 
      </View>

      <View style={styles.body}>
        {/* Barre de recherche fonctionnelle */}
        <View style={styles.searchBar}>
          <MaterialCommunityIcons name="magnify" size={20} color="#999" style={styles.searchIcon} />
          <TextInput 
            style={styles.searchInput}
            placeholder="Rechercher un lot (ex: Zone A)..."
            value={search}
            onChangeText={setSearch}
            placeholderTextColor="#999"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <MaterialCommunityIcons name="close-circle" size={20} color="#CCC" />
            </TouchableOpacity>
          )}
        </View>

        <FlatList
          data={filteredLots}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="clipboard-search-outline" size={80} color="#CCC" />
              <Text style={styles.emptyText}>Aucun lot trouvé.</Text>
            </View>
          }
          renderItem={({ item }) => {
            const isSelected = selectedIds.includes(item.id);
            return (
              <TouchableOpacity 
                style={[styles.card, isSelected && styles.cardSelected]} 
                onPress={() => toggleSelect(item.id)}
                activeOpacity={0.7}
              >
                <View style={styles.cardInfo}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Text style={styles.cardSub}>{item.date} • {item.poids} kg</Text>
                </View>
                <MaterialCommunityIcons 
                  name={isSelected ? "checkbox-marked-circle" : "checkbox-blank-circle-outline"} 
                  size={26} 
                  color={isSelected ? brandGreen : "#CCC"} 
                />
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* FRAME DU BAS : Bouton générer au milieu */}
      {selectedIds.length > 0 && (
        <View style={styles.selectionFrame}>
          <View style={styles.frameLeft}>
            <Text style={styles.frameText}>{selectedIds.length} lot(s)</Text>
            <Text style={styles.framePoids}>{poidsTotal} kg</Text>
          </View>

          <View style={styles.frameCenter}>
            <TouchableOpacity 
              style={styles.generateBtn}
              onPress={() => console.log("Génération...", selectedIds)}
            >
              <MaterialCommunityIcons name="check-all" size={22} color="white" />
              <Text style={styles.generateBtnText}>Générer</Text>
            </TouchableOpacity>
          </View>

         
        </View>
      )}

      {/* NAVIGATION BASSE */}
      <View style={styles.bottomTab}>
        <TabItem icon="home-variant" label="Dashboard" onPress={() => router.push('/(cooperative)/accueil' as any)} />
        <TabItem icon="camera" label="Scanner" onPress={() => router.push('/scanner')} />
        <TabItem icon="package-variant-closed" label="Lots" active color={brandGreen} />
        <TabItem icon="chart-timeline-variant" label="Historique" />
        <TabItem icon="account" label="Profil" onPress={() => router.push('/(cooperative)/profil' as any)} />
      </View>
    </SafeAreaView>
  );
}

const TabItem = ({ icon, label, active = false, color = "#666", onPress }: any) => (
  <TouchableOpacity style={styles.tabItem} onPress={onPress}>
    <MaterialCommunityIcons name={icon} size={26} color={active ? color : "#666"} />
    <Text style={[styles.tabLabel, { color: active ? color : "#666", fontWeight: active ? 'bold' : 'normal' }]}>
      {label}
    </Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#2E7D32' },
  header: { 
    height: 60, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20 
  },
  headerTitle: { 
    color: 'white', 
    fontSize: 18, 
    fontWeight: 'bold',
    textAlign: 'center'
  },
  headerBtn: { width: 40, alignItems: 'center' },
  body: { 
    flex: 1, 
    backgroundColor: '#F8F9FA', 
    borderTopLeftRadius: 30, 
    borderTopRightRadius: 30, 
    paddingTop: 10 
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginVertical: 15,
    paddingHorizontal: 15,
    borderRadius: 15,
    height: 50,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchIcon: { marginRight: 10 },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#333',
  },
  listContent: { paddingHorizontal: 20, paddingBottom: 150 },
  card: { 
    backgroundColor: 'white', 
    borderRadius: 15, 
    padding: 15, 
    marginBottom: 12, 
    flexDirection: 'row', 
    alignItems: 'center',
    elevation: 1
  },
  cardSelected: { borderColor: '#2E7D32', borderWidth: 1.5, backgroundColor: '#F1F8E9' },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  cardSub: { fontSize: 13, color: '#666', marginTop: 4 },
  
  // Styles du Frame de sélection (Optimisé pour centrer le bouton)
  selectionFrame: {
    position: 'absolute',
    bottom: 90,
    left: 15,
    right: 15,
    backgroundColor: 'white',
    height: 80,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 10
  },
  frameLeft: { flex: 1, justifyContent: 'center' },
  frameCenter: { flex: 2, alignItems: 'center', justifyContent: 'center' },
  frameRight: { flex: 1, alignItems: 'flex-end', justifyContent: 'center' },
  frameText: { fontSize: 11, color: '#666' },
  framePoids: { fontSize: 16, fontWeight: 'bold', color: '#2E7D32' },
  generateBtn: { 
    backgroundColor: '#2E7D32', 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingVertical: 12, 
    borderRadius: 15,
  },
  generateBtnText: { color: 'white', marginLeft: 8, fontSize: 14, fontWeight: 'bold' },

  emptyContainer: { alignItems: 'center', marginTop: 80 },
  emptyText: { fontSize: 16, color: '#999', marginTop: 10 },
  
  bottomTab: { 
    height: 75, 
    backgroundColor: 'white', 
    flexDirection: 'row', 
    borderTopWidth: 1, 
    borderTopColor: '#EEE', 
    paddingBottom: Platform.OS === 'ios' ? 15 : 0 
  }, 
  tabItem: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tabLabel: { fontSize: 10, marginTop: 4 }
});