import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, ActivityIndicator } from 'react-native';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import * as Font from 'expo-font';

import { WalletPortefeuilleContent } from '@/components/WalletPortefeuilleContent';
import { AG, navigateAgriculteurFromTab } from '@/lib/agriculteur-routes';

export default function Portefeuille() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    Font.loadAsync({
      'Montserrat-Bold': require('../../assets/fonts/Montserrat-Bold.ttf'),
      'Montserrat-Regular': require('../../assets/fonts/Montserrat-Regular.ttf'),
    })
      .catch(() => {})
      .finally(() => setFontsLoaded(true));
  }, []);

  const navigateTo = (path: string) => {
    navigateAgriculteurFromTab(router, path, 'portefeuille');
  };

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
          <Text style={styles.brandText}>Portefeuille</Text>
        </View>

        <View style={styles.body}>
          <WalletPortefeuilleContent persistLocalHistory />
        </View>

        <View style={[styles.bottomTab, { paddingBottom: insets.bottom || 5, height: 70 + (insets.bottom || 0) }]}>
          <TabItem icon="home-outline" label="Accueil" onPress={() => navigateTo(AG.accueil)} />
          <TabItem icon="archive-outline" label="Mes Lots" onPress={() => navigateTo(AG.meslots)} />
          <TabItem icon="plus-circle" label="Nouveau" isMain onPress={() => navigateTo(AG.nouveaulot)} />
          <TabItem icon="wallet" label="Portefeuille" active />
          <TabItem icon="account-circle-outline" label="Profil" onPress={() => navigateTo(AG.profil)} />
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const TabItem = ({ icon, label, active = false, isMain = false, onPress }: any) => (
  <TouchableOpacity style={styles.tabItem} onPress={onPress} activeOpacity={0.7}>
    <MaterialCommunityIcons name={icon} size={isMain ? 38 : 26} color={isMain ? '#2E7D32' : active ? '#2E7D32' : '#888'} />
    <Text
      style={[
        styles.tabLabel,
        { color: active ? '#2E7D32' : '#888', fontFamily: active ? 'Montserrat-Bold' : 'Montserrat-Regular' },
      ]}
    >
      {label}
    </Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1B5E20' },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { height: 70, justifyContent: 'center', paddingHorizontal: 20 },
  brandText: { color: 'white', fontSize: 20, fontFamily: 'Montserrat-Bold' },
  body: { flex: 1, backgroundColor: '#F5F5F5', borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  bottomTab: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 75,
    backgroundColor: 'white',
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    paddingBottom: 10,
  },
  tabItem: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tabLabel: { fontSize: 10, marginTop: 4 },
});
