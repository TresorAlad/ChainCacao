import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Image,
  StatusBar,
  ActivityIndicator,
  Alert
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import * as Font from 'expo-font';

// --- MODULES HORS-LIGNE ---
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Network from 'expo-network';

// Données par défaut (au cas où le stockage est vide)
const DEFAULT_USER = {
  nom: "Koffi Mensah",
  telephone: "+228 90 00 00 00",
  parcelles: [
    { id: '1', nom: 'Parcelle Nord - Kpalimé', surface: '2.5 Ha', image: 'https://images.unsplash.com/photo-1590005354167-6da97870c91d?q=80&w=400' },
    { id: '2', nom: 'Zone Foret - Atakpamé', surface: '1.8 Ha', image: 'https://images.unsplash.com/photo-1530537025136-9b51684c9809?q=80&w=400' },
  ]
};

export default function ProfilAgriculteur() {
  const router = useRouter();
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    async function initProfil() {
      try {
        // 1. Charger les polices
        await Font.loadAsync({
          'Montserrat-Bold': require('../../assets/fonts/Montserrat-Bold.ttf'),
          'Montserrat-Regular': require('../../assets/fonts/Montserrat-Regular.ttf'),
        });

        // 2. Vérifier le réseau
        const net = await Network.getNetworkStateAsync();
        setIsOffline(!net.isConnected);

        // 3. Charger les données locales
        const savedData = await AsyncStorage.getItem('user_profile_data');
        if (savedData) {
          setUserData(JSON.parse(savedData));
        } else {
          // Si rien en local, on met les données par défaut et on les sauvegarde
          setUserData(DEFAULT_USER);
          await AsyncStorage.setItem('user_profile_data', JSON.stringify(DEFAULT_USER));
        }

      } catch (e) {
        console.warn("Erreur d'initialisation profil");
      } finally {
        setFontsLoaded(true);
      }
    }
    initProfil();
  }, []);

  const handleLogout = () => {
    Alert.alert("Déconnexion", "Voulez-vous vraiment vous déconnecter ?", [
      { text: "Annuler", style: "cancel" },
      { text: "Déconnexion", onPress: () => router.replace('/login' as any), style: 'destructive' }
    ]);
  };

  const navigateTo = (path: string) => {
    router.replace(path as any);
  };

  if (!fontsLoaded || !userData) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#1B5E20" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top']}>
        <Stack.Screen options={{ headerShown: false }} />
        <StatusBar barStyle="light-content" />
        
        <View style={styles.header}>
          <Text style={styles.brandText}>Mon Profil</Text>
          {isOffline && (
            <MaterialCommunityIcons name="cloud-off-outline" size={20} color="#FFCDD2" />
          )}
        </View>

        <View style={styles.body}>
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            
            {/* 1. INFOS PERSONNELLES */}
            <View style={styles.profileHeader}>
              <View style={styles.avatarContainer}>
                <MaterialCommunityIcons name="account" size={60} color="#2E7D32" />
              </View>
              <Text style={styles.userName}>{userData.nom}</Text>
              <Text style={styles.userPhone}>{userData.telephone}</Text>
              {isOffline && <Text style={styles.offlineTag}>Mode consultation hors-ligne</Text>}
            </View>

            {/* 2. ACTIONS PROFIL */}
            <View style={styles.actionRow}>
              <TouchableOpacity 
                style={[styles.editBtn, isOffline && { opacity: 0.6 }]}
                disabled={isOffline}
                onPress={() => Alert.alert("Infos", "La modification requiert une connexion.")}
              >
                <MaterialCommunityIcons name="pencil" size={18} color="white" />
                <Text style={styles.btnText}>Modifier</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                <MaterialCommunityIcons name="logout" size={18} color="#C62828" />
                <Text style={[styles.btnText, { color: '#C62828' }]}>Quitter</Text>
              </TouchableOpacity>
            </View>

            {/* 3. LISTE DES PARCELLES */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Mes Parcelles</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{userData.parcelles.length}</Text>
              </View>
            </View>

            {userData.parcelles.map((parcelle: any) => (
              <View key={parcelle.id} style={styles.parcelleCard}>
                <Image 
                  source={{ uri: parcelle.image }} 
                  style={styles.parcelleImage}
                  defaultSource={require('../../assets/images/icon.png')} // Image de secours locale
                />
                <View style={styles.parcelleInfo}>
                  <Text style={styles.parcelleName}>{parcelle.nom}</Text>
                  <View style={styles.parcelleMeta}>
                    <MaterialCommunityIcons name="layers-outline" size={16} color="#666" />
                    <Text style={styles.parcelleSurface}> {parcelle.surface}</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.arrowIcon}>
                  <MaterialCommunityIcons name="chevron-right" size={24} color="#CCC" />
                </TouchableOpacity>
              </View>
            ))}

            <View style={{ height: 100 }} />
          </ScrollView>
        </View>

        {/* NAVIGATION BASSE */}
        <View style={styles.bottomTab}>
          <TabItem icon="home-outline" label="Accueil" onPress={() => navigateTo('/accueil')} />
          <TabItem icon="archive-outline" label="Mes Lots" onPress={() => navigateTo('/lots')} />
          <TabItem icon="plus-circle" label="Nouveau" isMain onPress={() => navigateTo('/nouveaulot')} />
          <TabItem icon="wallet-outline" label="Wallet" onPress={() => navigateTo('/portefeuille')} />
          <TabItem icon="account-circle" label="Profil" active />
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const TabItem = ({ icon, label, active = false, isMain = false, onPress }: any) => (
  <TouchableOpacity style={styles.tabItem} onPress={onPress} activeOpacity={0.7}>
    <MaterialCommunityIcons 
        name={icon} 
        size={isMain ? 38 : 26} 
        color={isMain ? "#2E7D32" : (active ? "#2E7D32" : "#888")} 
    />
    <Text style={[styles.tabLabel, { 
      color: active ? "#2E7D32" : "#888", 
      fontFamily: active ? 'Montserrat-Bold' : 'Montserrat-Regular' 
    }]}>
      {label}
    </Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1B5E20' },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F5' },
  header: { height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 },
  brandText: { color: 'white', fontSize: 22, fontFamily: 'Montserrat-Bold' },
  body: { flex: 1, backgroundColor: '#F5F5F5', borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  content: { padding: 20 },
  profileHeader: { alignItems: 'center', marginVertical: 10 },
  avatarContainer: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: '#A5D6A7' },
  userName: { fontSize: 20, fontFamily: 'Montserrat-Bold', color: '#1A1A1A' },
  userPhone: { fontSize: 14, fontFamily: 'Montserrat-Regular', color: '#666', marginTop: 4 },
  offlineTag: { fontSize: 10, color: '#C62828', fontFamily: 'Montserrat-Bold', marginTop: 5, textTransform: 'uppercase' },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 20, gap: 12 },
  editBtn: { flex: 1, backgroundColor: '#2E7D32', flexDirection: 'row', height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', gap: 8 },
  logoutBtn: { flex: 1, backgroundColor: 'transparent', flexDirection: 'row', height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#C62828' },
  btnText: { color: 'white', fontFamily: 'Montserrat-Bold', fontSize: 13 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, gap: 10 },
  sectionTitle: { fontSize: 18, fontFamily: 'Montserrat-Bold', color: '#1A1A1A' },
  badge: { backgroundColor: '#2E7D32', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  badgeText: { color: 'white', fontSize: 12, fontFamily: 'Montserrat-Bold' },
  parcelleCard: { flexDirection: 'row', backgroundColor: 'white', borderRadius: 12, marginBottom: 12, overflow: 'hidden', elevation: 2, alignItems: 'center' },
  parcelleImage: { width: 70, height: 70, backgroundColor: '#DDD' },
  parcelleInfo: { flex: 1, paddingHorizontal: 15 },
  parcelleName: { fontSize: 15, fontFamily: 'Montserrat-Bold', color: '#333' },
  parcelleMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  parcelleSurface: { fontSize: 13, fontFamily: 'Montserrat-Regular', color: '#666' },
  arrowIcon: { paddingRight: 10 },
  bottomTab: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 75, backgroundColor: 'white', flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#EEE', paddingBottom: 10 },
  tabItem: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tabLabel: { fontSize: 10, marginTop: 4 }
});