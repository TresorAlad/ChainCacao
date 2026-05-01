import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CaracteristiqueLotScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* EN-TÊTE */}
      <LinearGradient colors={['#1B5E20', '#2E7D32', '#43A047']} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={28} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Détails du Lot</Text>
        <TouchableOpacity>
          <MaterialCommunityIcons name="pencil-outline" size={24} color="white" />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        {/* CARTE RÉCAPITULATIVE */}
        <View style={styles.infoCard}>
          <Text style={styles.lotTitle}>{params.title || "Lot Sans Nom"}</Text>
          <View style={styles.statusRow}>
            <MaterialCommunityIcons 
              name={params.status === 'Problème' ? 'alert-circle' : 'check-circle'} 
              size={18} 
              color={params.status === 'Problème' ? '#C62828' : '#2E7D32'} 
            />
            <Text style={styles.statusText}>{params.status || "Statut inconnu"}</Text>
          </View>
        </View>

        {/* LISTE DES CARACTÉRISTIQUES */}
        <View style={styles.detailsContainer}>
          <DetailItem 
            icon="calendar-clock" 
            label="Date de Production" 
            value={params.dateProd as string || "Non définie"} 
          />
          <DetailItem 
            icon="calendar-check" 
            label="Date de Vente" 
            value={params.dateVente as string || "Non vendue"} 
          />
          <DetailItem 
            icon="weight-kilogram" 
            label="Poids Total" 
            value={params.poids as string || "0 kg"} 
          />
          <DetailItem 
            icon="account-cash" 
            label="Acheteur" 
            value={params.acheteur as string || "N/A"} 
          />
          <DetailItem 
            icon="truck-delivery" 
            label="Destination & Statut" 
            value={params.destination as string || "En entrepôt"} 
            isLast
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Composant interne pour chaque ligne de détail (Correction de la balise View effectuée)
const DetailItem = ({ icon, label, value, isLast = false }: any) => (
  <View style={[styles.detailItem, !isLast && styles.borderBottom]}>
    <View style={styles.iconCircle}>
      <MaterialCommunityIcons name={icon} size={22} color="#2E7D32" />
    </View>
    <View style={styles.detailTextContent}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1B5E20' },
  header: { 
    height: 70, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20 
  },
  headerTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  body: { 
    flex: 1, 
    backgroundColor: '#F8F9FA', 
    borderTopLeftRadius: 30, 
    borderTopRightRadius: 30,
    padding: 20
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    elevation: 4,
    marginBottom: 20,
    marginTop: 10,
  },
  lotTitle: { fontSize: 22, fontWeight: 'bold', color: '#1B5E20' },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  statusText: { marginLeft: 5, color: '#666', fontWeight: '600' },
  detailsContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 15,
    elevation: 2,
    marginBottom: 30
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  iconCircle: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  detailTextContent: { flex: 1 },
  detailLabel: { fontSize: 11, color: '#999', textTransform: 'uppercase', letterSpacing: 0.5 },
  detailValue: { fontSize: 16, color: '#333', fontWeight: '600', marginTop: 2 },
});