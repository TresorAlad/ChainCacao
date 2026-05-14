import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LotsRecusScreen() {
  const router = useRouter();

  const [lots] = useState([
    { id: '1', nom: 'Lot Cacao-001', provenance: 'Kpalimé', agriculteur: 'Koffi Mensah', poids: 65, date: '12/05/2026' },
    { id: '2', nom: 'Lot Cacao-042', provenance: 'Badou', agriculteur: 'Abla Adjo', poids: 120, date: '12/05/2026' },
  ]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><MaterialCommunityIcons name="arrow-left" size={28} color="white" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Lots Reçus</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.body}>
        <FlatList
          data={lots}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 20 }}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.card}
              onPress={() => router.push({
                pathname: '/validation_reception',
                params: { ...item } // On envoie toutes les infos ici
              })}
            >
              <View style={styles.cardInfo}>
                <Text style={styles.lotName}>{item.nom}</Text>
                <Text style={styles.detailText}>{item.provenance} • {item.agriculteur}</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={24} color="#CCC" />
            </TouchableOpacity>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1B5E20' },
  header: { height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15 },
  headerTitle: { color: 'white', fontSize: 18, fontFamily: 'Montserrat-Bold' },
  body: { flex: 1, backgroundColor: '#F8F9FA', borderTopLeftRadius: 30, borderTopRightRadius: 30 },
  card: { backgroundColor: 'white', padding: 15, borderRadius: 15, marginBottom: 10, flexDirection: 'row', alignItems: 'center', elevation: 2 },
  cardInfo: { flex: 1 },
  lotName: { fontSize: 16, fontFamily: 'Montserrat-Bold' },
  detailText: { fontSize: 13, color: '#666', marginTop: 4 }
});