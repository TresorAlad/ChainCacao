import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  StatusBar,
  ActivityIndicator,
  Alert
} from 'react-native';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import * as Font from 'expo-font';

import { useAuth } from '@/hooks/use-auth';

export default function ProfilAgriculteur() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { logout, user, initialized } = useAuth();
  const [fontsLoaded, setFontsLoaded] = useState(false);
  useEffect(() => {
    async function initProfil() {
      try {
        await Font.loadAsync({
          'Montserrat-Bold': require('../../assets/fonts/Montserrat-Bold.ttf'),
          'Montserrat-Regular': require('../../assets/fonts/Montserrat-Regular.ttf'),
        });
      } catch (e) {
        console.warn("Erreur d'initialisation profil");
      } finally {
        setFontsLoaded(true);
      }
    }
    initProfil();
  }, []);

  const handleLogout = () => {
    Alert.alert('Déconnexion', 'Voulez-vous vraiment vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Déconnexion',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/login' as any);
        },
      },
    ]);
  };

  const navigateTo = (path: string) => {
    router.replace(path as any);
  };

  if (!fontsLoaded || !initialized) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#1B5E20" />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.loaderContainer}>
        <Text style={{ fontFamily: 'Montserrat-Regular', color: '#666' }}>Session invalide</Text>
        <TouchableOpacity onPress={() => router.replace('/login' as any)} style={{ marginTop: 16 }}>
          <Text style={{ color: '#1B5E20', fontWeight: '700' }}>Connexion</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const displayName = user.nom || user.name || 'Agriculteur';
  const org = user.org_id || user.orgID || '—';

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top']}>
        <Stack.Screen options={{ headerShown: false }} />
        <StatusBar barStyle="light-content" />

        <View style={styles.header}>
          <Text style={styles.brandText}>Mon Profil</Text>
        </View>

        <View style={styles.body}>
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.profileHeader}>
              <View style={styles.avatarContainer}>
                <MaterialCommunityIcons name="account" size={60} color="#2E7D32" />
              </View>
              <Text style={styles.userName}>{displayName}</Text>
              <Text style={styles.userPhone}>{user.email || '—'}</Text>
              <Text style={styles.roleLine}>{user.role || '—'} · {org}</Text>
              {user.org_name ? <Text style={styles.metaLine}>{user.org_name}</Text> : null}
              {user.gps_location ? <Text style={styles.metaLine}>GPS : {user.gps_location}</Text> : null}
              {user.field_surface ? <Text style={styles.metaLine}>Surface : {user.field_surface}</Text> : null}
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.editBtn}
                onPress={() => Alert.alert('Infos', 'La modification sera disponible dans une prochaine version.')}
              >
                <MaterialCommunityIcons name="pencil" size={18} color="white" />
                <Text style={styles.btnText}>Modifier</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                <MaterialCommunityIcons name="logout" size={18} color="#C62828" />
                <Text style={[styles.btnText, { color: '#C62828' }]}>Quitter</Text>
              </TouchableOpacity>
            </View>

            <View style={{ height: 100 }} />
          </ScrollView>
        </View>

        <View style={[styles.bottomTab, { paddingBottom: insets.bottom || 5, height: 70 + (insets.bottom || 0) }]}>
          <TabItem icon="home-outline" label="Accueil" onPress={() => navigateTo('/accueil')} />
          <TabItem icon="archive-outline" label="Mes Lots" onPress={() => navigateTo('/meslots')} />
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
  roleLine: { fontSize: 13, fontFamily: 'Montserrat-Regular', color: '#444', marginTop: 6 },
  metaLine: { fontSize: 12, fontFamily: 'Montserrat-Regular', color: '#666', marginTop: 4 },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 20, gap: 12 },
  editBtn: { flex: 1, backgroundColor: '#2E7D32', flexDirection: 'row', height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', gap: 8 },
  logoutBtn: { flex: 1, backgroundColor: 'transparent', flexDirection: 'row', height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#C62828' },
  btnText: { color: 'white', fontFamily: 'Montserrat-Bold', fontSize: 13 },
  bottomTab: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 75, backgroundColor: 'white', flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#EEE', paddingBottom: 10 },
  tabItem: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tabLabel: { fontSize: 10, marginTop: 4 }
});