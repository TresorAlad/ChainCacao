import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, ActivityIndicator, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Font from 'expo-font';
import { useAuth } from '@/hooks/use-auth';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
  const router = useRouter();
  const [fontsLoaded, setFontsLoaded] = useState(false);

  const { user, logout } = useAuth();
  
  const userNom = user?.name || "Coopérative Admin";
  const userSolde = "—"; // Le solde peut venir d'une API de portefeuille si la coopérative en a un

  // CHARGEMENT DES POLICES (Chemin corrigé pour dossier de groupe)
  useEffect(() => {
    async function loadFonts() {
      try {
        await Font.loadAsync({
          'Montserrat-Bold': require('../../assets/fonts/Montserrat-Bold.ttf'),
          'Montserrat-Regular': require('../../assets/fonts/Montserrat-Regular.ttf'),
        });
        setFontsLoaded(true);
      } catch (e) {
        console.warn("Erreur chargement polices Profil : ", e);
        setFontsLoaded(true); // On affiche quand même en cas d'erreur
      }
    }
    loadFonts();
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#1B5E20" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        
        {/* --- FRAME SOLDE DESIGN --- */}
        <View style={styles.walletWrapper}>
          <LinearGradient colors={['#1B5E20', '#2E7D32']} style={styles.walletCard}>
            {/* Cercles déco en arrière-plan */}
            <View style={[styles.circleDeco, { top: -50, right: -50, opacity: 0.2 }]} />
            <View style={[styles.circleDeco, { bottom: -70, left: -40, width: 150, height: 150, opacity: 0.1 }]} />

            <View style={styles.walletHeader}>
               <View>
                 <Text style={styles.walletLabel}>{userNom}</Text>
                 <Text style={styles.walletValue}>{userSolde} <Text style={styles.currency}>FCFA</Text></Text>
               </View>
               <MaterialCommunityIcons name="shield-check" size={24} color="white" />
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.actionBtn}>
                <View style={styles.actionIcon}>
                  <MaterialCommunityIcons name="plus" size={22} color="#1B5E20" />
                </View>
                <Text style={styles.actionText}>Déposer</Text>
              </TouchableOpacity>

              <View style={styles.divider} />

              <TouchableOpacity style={styles.actionBtn}>
                <View style={styles.actionIcon}>
                  <MaterialCommunityIcons name="minus" size={22} color="#1B5E20" />
                </View>
                <Text style={styles.actionText}>Retirer</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>

        {/* --- SECTION PARAMÈTRES --- */}
        <View style={styles.settingsFrame}>
          <View style={styles.settingsHeader}>
            <Text style={styles.settingsTitle}>Paramètres</Text>
            <MaterialCommunityIcons name="cog-outline" size={20} color="#999" />
          </View>

          <SettingItem 
            icon="account-outline" 
            label="Modifier le profil" 
            onPress={() => {}} 
          />
          <SettingItem 
            icon="lock-reset" 
            label="Changer le code PIN" 
            onPress={() => {}} 
          />
          <SettingItem 
            icon="bell-outline" 
            label="Notifications" 
            onPress={() => {}} 
          />
          
          <View style={styles.itemDivider} />

          <SettingItem 
            icon="logout" 
            label="Déconnexion" 
            isDestructive 
            onPress={async () => {
              await logout();
              router.replace('/');
            }} 
          />
        </View>

        <Text style={styles.versionText}>Chaincacao v1.0.4</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const SettingItem = ({ icon, label, onPress, isDestructive = false }: any) => (
  <TouchableOpacity style={styles.settingItem} onPress={onPress}>
    <View style={styles.settingLeft}>
      <View style={[styles.settingIconBg, isDestructive && { backgroundColor: '#FFEBEE' }]}>
        <MaterialCommunityIcons 
          name={icon} 
          size={22} 
          color={isDestructive ? '#C62828' : '#2E7D32'} 
        />
      </View>
      <Text style={[styles.settingLabel, isDestructive && { color: '#C62828' }]}>{label}</Text>
    </View>
    <MaterialCommunityIcons 
      name="chevron-right" 
      size={24} 
      color={isDestructive ? '#C62828' : '#2E7D32'} 
    />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  body: { flex: 1 },
  
  // Wallet Design
  walletWrapper: { padding: 20, marginTop: 10 },
  walletCard: {
    borderRadius: 25,
    padding: 25,
    height: 210,
    overflow: 'hidden',
    justifyContent: 'space-between',
    elevation: 8,
    shadowColor: '#1B5E20',
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  circleDeco: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'white' },
  walletHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  walletLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontFamily: 'Montserrat-Regular' },
  walletValue: { color: 'white', fontSize: 30, fontFamily: 'Montserrat-Bold', marginTop: 5 },
  currency: { fontSize: 16, fontFamily: 'Montserrat-Regular' },
  
  actionRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 18,
    padding: 12,
    alignItems: 'center',
  },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  actionIcon: {
    backgroundColor: 'white',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  actionText: { color: 'white', fontFamily: 'Montserrat-Bold', fontSize: 14 },
  divider: { width: 1, height: 20, backgroundColor: 'rgba(255,255,255,0.3)' },

  // Settings Design
  settingsFrame: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 25,
    padding: 20,
    elevation: 2,
  },
  settingsHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  settingsTitle: { fontSize: 18, fontFamily: 'Montserrat-Bold', color: '#333' },
  settingItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
  settingLeft: { flexDirection: 'row', alignItems: 'center' },
  settingIconBg: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  settingLabel: { fontSize: 15, color: '#444', fontFamily: 'Montserrat-Bold' },
  itemDivider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 8 },
  versionText: { textAlign: 'center', color: '#BBB', fontSize: 11, fontFamily: 'Montserrat-Regular', marginTop: 20, marginBottom: 30 },
});