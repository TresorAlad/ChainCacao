import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const router = useRouter();

  // Données simulées (provenant normalement de ta base de données/inscription)
  const userData = {
    nom: "Koffi Mensah",
    role: "Producteur de Cacao",
    localisation: "Kpalimé, Togo",
    coordonnees: "6.9458° N, 0.6333° E",
    surface: "4.5 Hectares",
    dateInscription: "15 Avril 2026"
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* --- HEADER AVEC DÉGRADÉ --- */}
      <LinearGradient colors={['#1B5E20', '#2E7D32']} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={28} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mon Profil</Text>
        <TouchableOpacity style={styles.editButton}>
          <MaterialCommunityIcons name="account-edit" size={26} color="white" />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        {/* --- PHOTO ET NOM --- */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <MaterialCommunityIcons name="account" size={80} color="#2E7D32" />
          </View>
          <Text style={styles.userName}>{userData.nom}</Text>
          <Text style={styles.userRole}>{userData.role}</Text>
        </View>

        {/* --- INFORMATIONS DU CHAMP (SURFACE & LOC) --- */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Informations de l'exploitation</Text>
          
          <InfoCard 
            icon="map-marker-radius" 
            label="Localisation" 
            value={userData.localisation} 
            subValue={userData.coordonnees}
          />
          
          <InfoCard 
            icon="texture-box" 
            label="Surface exploitée" 
            value={userData.surface} 
          />

          <InfoCard 
            icon="calendar-check" 
            label="Membre depuis" 
            value={userData.dateInscription} 
          />
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={() => router.replace('/')}>
          <Text style={styles.logoutText}>Déconnexion</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// Composant pour les lignes d'information
const InfoCard = ({ icon, label, value, subValue }: any) => (
  <View style={styles.infoCard}>
    <View style={styles.iconCircle}>
      <MaterialCommunityIcons name={icon} size={22} color="#2E7D32" />
    </View>
    <View style={styles.infoTexts}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
      {subValue && <Text style={styles.infoSubValue}>{subValue}</Text>}
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1B5E20' },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  headerTitle: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  backButton: { padding: 5 },
  editButton: { padding: 5 },
  body: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  profileHeader: { alignItems: 'center', marginTop: 30, marginBottom: 20 },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    marginBottom: 15,
  },
  userName: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  userRole: { fontSize: 16, color: '#666', marginTop: 5 },
  infoSection: { paddingHorizontal: 20, marginTop: 10 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#999', textTransform: 'uppercase', marginBottom: 15, marginLeft: 5 },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    alignItems: 'center',
    elevation: 1,
  },
  iconCircle: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoTexts: { marginLeft: 15, flex: 1 },
  infoLabel: { fontSize: 12, color: '#888' },
  infoValue: { fontSize: 16, fontWeight: 'bold', color: '#333', marginTop: 2 },
  infoSubValue: { fontSize: 12, color: '#2E7D32', marginTop: 2 },
  logoutBtn: {
    margin: 25,
    padding: 15,
    borderRadius: 15,
    backgroundColor: '#FFEBEE',
    alignItems: 'center',
  },
  logoutText: { color: '#C62828', fontWeight: 'bold', fontSize: 16 },
});