import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, 
  TouchableOpacity, Switch, SafeAreaView, StatusBar 
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/use-auth';

export default function SettingsScreen() {
  const router = useRouter();
  const { logout } = useAuth();
  
  // États pour les switchs
  const [isNotifEnabled, setIsNotifEnabled] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(true);

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
          <Text style={styles.headerSubtitle}>Configuration</Text>
          <Text style={styles.headerTitle}>Paramètres</Text>
        </View>

        {/* SECTION PROFIL RAPIDE */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>AD</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.userName}>Abalo Dossè</Text>
            <Text style={styles.userRole}>Exportateur Agréé • Lomé, Togo</Text>
          </View>
          <TouchableOpacity style={styles.editBtn}>
            <MaterialCommunityIcons name="pencil-outline" size={20} color="#1B5E20" />
          </TouchableOpacity>
        </View>

        {/* SECTION COMPTE */}
        <Text style={styles.sectionTitle}>Compte & Entreprise</Text>
        <View style={styles.settingsGroup}>
          <SettingItem icon="office-building" label="Informations Société" />
          <SettingItem icon="shield-check-outline" label="Certifications export" />
          <SettingItem icon="bank-outline" label="Coordonnées Bancaires" />
        </View>

        {/* SECTION PRÉFÉRENCES (AVEC SWITCHS) */}
        <Text style={styles.sectionTitle}>Préférences</Text>
        <View style={styles.settingsGroup}>
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconBg, { backgroundColor: '#E8F5E9' }]}>
                <MaterialCommunityIcons name="bell-outline" size={22} color="#1B5E20" />
              </View>
              <Text style={styles.settingLabel}>Notifications Push</Text>
            </View>
            <Switch 
              value={isNotifEnabled} 
              onValueChange={setIsNotifEnabled}
              trackColor={{ false: "#DDD", true: "#1B5E20" }}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconBg, { backgroundColor: '#E8F5E9' }]}>
                <MaterialCommunityIcons name="fingerprint" size={22} color="#1B5E20" />
              </View>
              <Text style={styles.settingLabel}>Sécurité Biométrique</Text>
            </View>
            <Switch 
              value={isBiometricEnabled} 
              onValueChange={setIsBiometricEnabled}
              trackColor={{ false: "#DDD", true: "#1B5E20" }}
            />
          </View>
        </View>

        {/* SECTION SUPPORT */}
        <Text style={styles.sectionTitle}>Support & Légal</Text>
        <View style={styles.settingsGroup}>
          <SettingItem icon="help-circle-outline" label="Centre d'aide" />
          <SettingItem icon="file-document-outline" label="Conditions d'utilisation" />
          <SettingItem icon="information-outline" label="À propos de l'application" />
        </View>

        {/* BOUTON DÉCONNEXION */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={async () => {
            await logout();
            router.replace('/login' as any);
          }}
        >
          <MaterialCommunityIcons name="logout" size={22} color="#C62828" />
          <Text style={styles.logoutText}>Déconnexion</Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* TA BOTTOM TAB HARMONISÉE */}
      <View style={styles.bottomTab}>
        <TabItem icon="home-variant" label="Accueil" onPress={() => router.push('/(exportateur)/accueil')} />
        <TabItem icon="chart-line" label="Bourse" onPress={() => router.push('/(exportateur)/bourse')} />
        <TabItem icon="qrcode-scan" label="Scanner" onPress={() => router.push('/(exportateur)/scanner')} />
        <TabItem icon="package-variant-closed" label="Stock" onPress={() => router.push('/(exportateur)/stock')} />
        <TabItem icon="file-document-outline" label="Rapport" onPress={() => router.push('/(exportateur)/rapport')} />
      </View>
    </SafeAreaView>
  );
}

// COMPOSANTS RÉUTILISABLES
const SettingItem = ({ icon, label, onPress }: any) => (
  <TouchableOpacity style={styles.settingItem} onPress={onPress}>
    <View style={styles.settingLeft}>
      <View style={[styles.iconBg, { backgroundColor: '#F0F0F0' }]}>
        <MaterialCommunityIcons name={icon} size={22} color="#555" />
      </View>
      <Text style={styles.settingLabel}>{label}</Text>
    </View>
    <MaterialCommunityIcons name="chevron-right" size={20} color="#CCC" />
  </TouchableOpacity>
);

const TabItem = ({ icon, label, active = false, onPress }: any) => (
  <TouchableOpacity style={styles.tabItem} onPress={onPress}>
    <MaterialCommunityIcons name={icon} size={24} color={active ? "#1B5E20" : "#888"} />
    <Text style={[styles.tabLabel, { color: active ? "#1B5E20" : "#888" }]}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  scrollContent: { padding: 20 },
  
  header: { marginBottom: 25 },
  headerSubtitle: { fontSize: 14, fontFamily: 'Montserrat-Regular', color: '#666' },
  headerTitle: { fontSize: 28, fontFamily: 'Montserrat-Bold', color: '#1B5E20' },

  profileCard: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', 
    padding: 15, borderRadius: 25, marginBottom: 30, elevation: 2 
  },
  avatarContainer: { 
    width: 60, height: 60, borderRadius: 30, backgroundColor: '#1B5E20', 
    justifyContent: 'center', alignItems: 'center' 
  },
  avatarText: { color: 'white', fontSize: 20, fontFamily: 'Montserrat-Bold' },
  profileInfo: { flex: 1, marginLeft: 15 },
  userName: { fontSize: 18, fontFamily: 'Montserrat-Bold', color: '#333' },
  userRole: { fontSize: 12, fontFamily: 'Montserrat-Regular', color: '#888' },
  editBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center' },

  sectionTitle: { fontSize: 16, fontFamily: 'Montserrat-Bold', color: '#1B5E20', marginLeft: 10, marginBottom: 10 },
  settingsGroup: { backgroundColor: 'white', borderRadius: 20, paddingHorizontal: 15, marginBottom: 25, elevation: 1 },
  
  settingItem: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', 
    paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' 
  },
  settingLeft: { flexDirection: 'row', alignItems: 'center' },
  iconBg: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  settingLabel: { fontSize: 14, fontFamily: 'Montserrat-Bold', color: '#444' },

  logoutBtn: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', 
    padding: 18, borderRadius: 20, backgroundColor: '#FFEBEE', marginTop: 10 
  },
  logoutText: { color: '#C62828', fontFamily: 'Montserrat-Bold', marginLeft: 10 },

  bottomTab: { 
    position: 'absolute', bottom: 0, left: 0, right: 0, 
    height: 85, backgroundColor: 'white', flexDirection: 'row', 
    borderTopLeftRadius: 25, borderTopRightRadius: 25, elevation: 20 
  },
  tabItem: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tabLabel: { fontSize: 10, marginTop: 5, fontFamily: 'Montserrat-Regular' }
});