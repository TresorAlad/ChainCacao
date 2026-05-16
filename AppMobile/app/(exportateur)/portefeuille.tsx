import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import * as Font from 'expo-font';

import { WalletPortefeuilleContent } from '@/components/WalletPortefeuilleContent';
import { useAuth } from '@/hooks/use-auth';

export default function PortefeuilleExportateurScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const isTransformateur = (user?.role ?? '').toLowerCase().includes('transform');
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    Font.loadAsync({
      'Montserrat-Bold': require('../../assets/fonts/Montserrat-Bold.ttf'),
      'Montserrat-Regular': require('../../assets/fonts/Montserrat-Regular.ttf'),
    })
      .catch(() => {})
      .finally(() => setFontsLoaded(true));
  }, []);

  if (!fontsLoaded) {
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
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Portefeuille</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.body}>
          <WalletPortefeuilleContent
            roleSubtitle={isTransformateur ? 'Espace transformateur' : 'Espace exportateur'}
            showCreditBadge
            persistLocalHistory
          />
        </View>

        <View style={[styles.bottomTab, { paddingBottom: insets.bottom || 5, height: 70 + (insets.bottom || 0) }]}>
          <TabItem icon="home-variant" label="Accueil" onPress={() => router.replace('/(exportateur)/accueil')} />
          <TabItem icon="wallet" label="Portefeuille" active />
          <TabItem icon="qrcode-scan" label="Scanner" onPress={() => router.push('/(exportateur)/scanner')} />
          <TabItem icon="package-variant-closed" label="Stock" onPress={() => router.push('/(exportateur)/stock')} />
          <TabItem icon="history" label="Historique" onPress={() => router.push('/(exportateur)/historique')} />
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const TabItem = ({ icon, label, active = false, onPress }: { icon: string; label: string; active?: boolean; onPress?: () => void }) => (
  <TouchableOpacity style={styles.tabItem} onPress={onPress}>
    <MaterialCommunityIcons name={icon as any} size={24} color={active ? '#1B5E20' : '#888'} />
    <Text style={[styles.tabLabel, { color: active ? '#1B5E20' : '#888' }]}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1B5E20' },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    height: 70,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  backBtn: { width: 40, alignItems: 'flex-start' },
  headerTitle: { color: 'white', fontSize: 20, fontFamily: 'Montserrat-Bold' },
  body: { flex: 1, backgroundColor: '#F8F9FA', borderTopLeftRadius: 30, borderTopRightRadius: 30 },
  bottomTab: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 85,
    backgroundColor: 'white',
    flexDirection: 'row',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    elevation: 20,
  },
  tabItem: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 5 },
  tabLabel: { fontSize: 10, marginTop: 5, fontFamily: 'Montserrat-Regular' },
});
