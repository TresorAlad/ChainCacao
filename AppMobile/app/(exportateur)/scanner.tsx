import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, StatusBar, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, Stack, useFocusEffect } from 'expo-router';

import { batchApi, getApiError, isNetworkError } from '@/services/api';
import { extractLotIdFromScanPayload, isGroupedListId, normalizeGroupedListId } from '@/utils/lotQr';

export default function ScannerScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [torch, setTorch] = useState(false);
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    requestPermission();
  }, []);

  useFocusEffect(
    useCallback(() => {
      setScanned(false);
    }, [])
  );

  if (!permission) return <View style={{ flex: 1, backgroundColor: 'black' }} />;
  
  if (!permission.granted) {
    return (
      <View style={styles.containerCenter}>
        <MaterialCommunityIcons name="camera-off" size={60} color="#666" />
        <Text style={styles.message}>Accès à la caméra nécessaire pour identifier les lots de cacao.</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.permissionBtn}>
          <Text style={styles.permissionBtnText}>Accorder la permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    const scannedId = extractLotIdFromScanPayload(data);
    if (!scannedId) {
      Alert.alert('Scan', 'Impossible de lire un identifiant.', [
        { text: 'OK', onPress: () => setScanned(false) },
      ]);
      return;
    }
    if (isGroupedListId(scannedId)) {
      const listId = normalizeGroupedListId(scannedId);
      router.push({
        pathname: '/(exportateur)/paiement-liste',
        params: { listId },
      } as any);
      return;
    }
    try {
      await batchApi.verify(scannedId);
      router.push({
        pathname: '/(exportateur)/paiement',
        params: { lotId: scannedId },
      } as any);
    } catch (e) {
      const msg = isNetworkError(e)
        ? `Serveur injoignable. Vérifiez que le serveur ChainCacao est démarré, puis réessayez.`
        : getApiError(e);
      Alert.alert('Vérification lot', msg, [{ text: 'OK', onPress: () => setScanned(false) }]);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" />
      
      <CameraView 
        style={StyleSheet.absoluteFillObject} 
        facing="back"
        enableTorch={torch}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
      >
        <SafeAreaView style={styles.overlay}>
          {/* HEADER SCANNER */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
              <MaterialCommunityIcons name="chevron-left" size={30} color="white" />
            </TouchableOpacity>
            
            <Text style={styles.headerTitle}>Scan QR Code</Text>
            
            <TouchableOpacity onPress={() => setTorch(!torch)} style={styles.iconButton}>
              <MaterialCommunityIcons 
                name={torch ? "flashlight" : "flashlight-off"} 
                size={25} 
                color={torch ? "#FFD600" : "white"} 
              />
            </TouchableOpacity>
          </View>

          {/* ZONE DE SCAN */}
          <View style={styles.content}>
            <View style={styles.scannerFrame}>
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />
                <View style={styles.scanLine} />
            </View>
            <Text style={styles.hint}>Placez le QR Code dans le cadre</Text>
          </View>

          {/* LA BOTTOM TAB MÉMORISÉE (Structure à 5 onglets) */}
          <View style={[styles.bottomTab, { paddingBottom: insets.bottom || 5, height: 70 + (insets.bottom || 0) }]}>
            <TabItem 
              icon="home-variant" 
              label="Accueil" 
              onPress={() => router.push('/(exportateur)/accueil')} 
            />
            <TabItem 
              icon="wallet" 
              label="Portefeuille" 
              onPress={() => router.push('/(exportateur)/portefeuille' as any)} 
            />
            <TabItem 
              icon="qrcode-scan" 
              label="Scanner" 
              active 
            />
            <TabItem 
              icon="package-variant-closed" 
              label="Stock" 
              onPress={() => router.push('/(exportateur)/stock')} 
            />
            <TabItem icon="history" label="Historique" onPress={() => router.push('/(exportateur)/historique')} />
          </View>
        </SafeAreaView>
      </CameraView>
    </View>
  );
}

const TabItem = ({ icon, label, active = false, onPress }: any) => (
  <TouchableOpacity style={styles.tabItem} onPress={onPress}>
    <MaterialCommunityIcons name={icon} size={24} color={active ? "#1B5E20" : "#888"} />
    <Text style={[styles.tabLabel, { color: active ? "#1B5E20" : "#888" }]}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  containerCenter: { flex: 1, backgroundColor: '#F8F9FA', justifyContent: 'center', alignItems: 'center', padding: 30 },
  message: { textAlign: 'center', color: '#666', marginTop: 20, marginBottom: 30, fontFamily: 'Montserrat-Regular' },
  permissionBtn: { backgroundColor: '#1B5E20', paddingVertical: 15, paddingHorizontal: 30, borderRadius: 15 },
  permissionBtnText: { color: 'white', fontFamily: 'Montserrat-Bold' },
  
  overlay: { flex: 1, justifyContent: 'space-between' },
  
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 20 },
  headerTitle: { color: 'white', fontSize: 18, fontFamily: 'Montserrat-Bold' },
  iconButton: { width: 50, height: 50, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  
  content: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scannerFrame: { width: 250, height: 250, justifyContent: 'center', alignItems: 'center' },
  scanLine: { width: '90%', height: 2, backgroundColor: '#1B5E20', elevation: 10, shadowColor: '#1B5E20', shadowOpacity: 0.5, shadowRadius: 5 },
  corner: { position: 'absolute', width: 40, height: 40, borderColor: '#1B5E20', borderWidth: 5 },
  topLeft: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 20 },
  topRight: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 20 },
  bottomLeft: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 20 },
  bottomRight: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 20 },
  
  hint: { color: 'white', marginTop: 40, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, fontFamily: 'Montserrat-Regular', fontSize: 12 },

  bottomTab: { 
    height: 85, backgroundColor: 'white', flexDirection: 'row', 
    borderTopLeftRadius: 25, borderTopRightRadius: 25,
    elevation: 20
  },
  tabItem: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 5 },
  tabLabel: { fontSize: 10, marginTop: 5, fontFamily: 'Montserrat-Regular' }
});