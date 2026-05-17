import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Font from 'expo-font';
import { CoopBottomNav } from '@/components/CoopBottomNav';
import { useAuth } from '@/hooks/use-auth';
import { walletApi } from '@/services/api';

export default function ProfilCooperativeScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [solde, setSolde] = useState<number | null>(null);

  useEffect(() => {
    async function init() {
      try {
        await Font.loadAsync({
          'Montserrat-Bold': require('../../assets/fonts/Montserrat-Bold.ttf'),
          'Montserrat-Regular': require('../../assets/fonts/Montserrat-Regular.ttf'),
        });
        try {
          const { data } = await walletApi.solde();
          if (typeof data.balance === 'number') setSolde(data.balance);
        } catch {
          setSolde(null);
        }
      } finally {
        setFontsLoaded(true);
      }
    }
    void init();
  }, []);

  const handleLogout = () => {
    Alert.alert('Déconnexion', 'Voulez-vous vraiment vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Déconnexion',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/login' as never);
        },
      },
    ]);
  };

  if (!fontsLoaded) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#1B5E20" />
      </View>
    );
  }

  const displayName = user?.nom || user?.name || 'Coopérative';
  const org = user?.org_id || user?.orgID || '—';

  return (
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
            <Text style={styles.userPhone}>{user?.email || '—'}</Text>
            <Text style={styles.roleLine}>
              {user?.role || 'cooperative'} · {org}
            </Text>
            {user?.org_name ? <Text style={styles.metaLine}>{user.org_name}</Text> : null}
            {solde !== null && (
              <View style={styles.soldeBadge}>
                <MaterialCommunityIcons name="wallet" size={18} color="#1B5E20" />
                <Text style={styles.soldeText}>
                  Solde : {Math.round(solde).toLocaleString('fr-FR')} FCFA
                </Text>
              </View>
            )}
          </View>

          <View style={styles.settingsFrame}>
            <Text style={styles.settingsTitle}>Paramètres</Text>
            <SettingItem
              icon="format-list-bulleted-type"
              label="Liste groupée"
              onPress={() => router.push('/(cooperative)/generation_liste' as never)}
            />
            <SettingItem
              icon="lock-reset"
              label="Changer le code PIN"
              onPress={() => Alert.alert('PIN', 'Contactez l’administrateur pour réinitialiser le PIN.')}
            />
            <View style={styles.itemDivider} />
            <SettingItem icon="logout" label="Déconnexion" isDestructive onPress={handleLogout} />
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      </View>

      <CoopBottomNav activeTab="profil" />
    </SafeAreaView>
  );
}

function SettingItem({
  icon,
  label,
  onPress,
  isDestructive = false,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  onPress: () => void;
  isDestructive?: boolean;
}) {
  return (
    <TouchableOpacity style={styles.settingItem} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.settingLeft}>
        <View style={[styles.settingIconBg, isDestructive && { backgroundColor: '#FFEBEE' }]}>
          <MaterialCommunityIcons name={icon} size={22} color={isDestructive ? '#C62828' : '#2E7D32'} />
        </View>
        <Text style={[styles.settingLabel, isDestructive && { color: '#C62828' }]}>{label}</Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={24} color={isDestructive ? '#C62828' : '#2E7D32'} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1B5E20' },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F5' },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  brandText: { color: 'white', fontSize: 22, fontFamily: 'Montserrat-Bold' },
  body: { flex: 1, backgroundColor: '#F5F5F5', borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  content: { padding: 20 },
  profileHeader: { alignItems: 'center', marginVertical: 10 },
  avatarContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#A5D6A7',
  },
  userName: { fontSize: 20, fontFamily: 'Montserrat-Bold', color: '#1A1A1A' },
  userPhone: { fontSize: 14, fontFamily: 'Montserrat-Regular', color: '#666', marginTop: 4 },
  roleLine: { fontSize: 13, fontFamily: 'Montserrat-Regular', color: '#444', marginTop: 6 },
  metaLine: { fontSize: 12, fontFamily: 'Montserrat-Regular', color: '#666', marginTop: 4 },
  soldeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  soldeText: { fontFamily: 'Montserrat-Bold', color: '#1B5E20', fontSize: 14 },
  settingsFrame: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    marginTop: 20,
    elevation: 2,
  },
  settingsTitle: { fontSize: 17, fontFamily: 'Montserrat-Bold', color: '#333', marginBottom: 12 },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
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
});
