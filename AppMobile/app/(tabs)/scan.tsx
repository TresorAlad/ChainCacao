import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useLots } from '@/hooks/use-storage';
import { extractLotIdFromScanPayload } from '@/utils/lotQr';

export default function ScanScreen() {
  const router = useRouter();
  const { lots } = useLots();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [manualId, setManualId] = useState('');
  const [mode, setMode] = useState<'camera' | 'manual'>('camera');

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    navigateToLot(data.trim());
  };

  const navigateToLot = (rawId: string) => {
    const lotId = extractLotIdFromScanPayload(rawId);
    const lot = lots.find(
      l => l.id === lotId || l.title.toLowerCase() === lotId.toLowerCase()
    );

    if (lot) {
      router.push({
        pathname: '/caracteristiqueslot',
        params: {
          lotId: lot.id,
          title: lot.title,
          status: lot.status,
          dateProd: lot.date,
          poids: lot.poids,
          acheteur: lot.acheteur || 'En attente',
          destination: lot.destination || 'Non définie',
          typeCacao: lot.typeCacao || '',
          synced: lot.synced ? '1' : '0',
        },
      });
    } else {
      // Lot non trouvé localement → rediriger vers l'historique (vérification publique)
      router.push({
        pathname: '/historique',
        params: { lotId },
      });
    }
  };

  const handleManualSearch = () => {
    if (!manualId.trim()) {
      Alert.alert('Champ vide', 'Veuillez saisir un identifiant de lot.');
      return;
    }
    navigateToLot(manualId.trim());
  };

  if (!permission) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#2E7D32" />
        </View>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <LinearGradient colors={['#1B5E20', '#2E7D32', '#43A047']} style={styles.header}>
          <Text style={styles.headerTitle}>Scanner QR</Text>
        </LinearGradient>
        <View style={styles.permissionContainer}>
          <MaterialCommunityIcons name="camera-off" size={80} color="#CCC" />
          <Text style={styles.permissionTitle}>Accès caméra requis</Text>
          <Text style={styles.permissionDesc}>
            L'autorisation caméra est nécessaire pour scanner les QR codes des lots.
          </Text>
          <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
            <Text style={styles.permissionBtnText}>Autoriser la caméra</Text>
          </TouchableOpacity>
          <Text style={styles.orText}>— ou —</Text>
          <Text style={styles.manualHint}>Saisie manuelle ci-dessous</Text>
          <ManualInput value={manualId} onChange={setManualId} onSearch={handleManualSearch} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient colors={['#1B5E20', '#2E7D32', '#43A047']} style={styles.header}>
        <Text style={styles.headerTitle}>Scanner QR</Text>
        <TouchableOpacity
          style={styles.modeToggle}
          onPress={() => setMode(mode === 'camera' ? 'manual' : 'camera')}
        >
          <MaterialCommunityIcons
            name={mode === 'camera' ? 'keyboard' : 'camera'}
            size={24}
            color="white"
          />
        </TouchableOpacity>
      </LinearGradient>

      {mode === 'camera' ? (
        <View style={styles.cameraContainer}>
          <CameraView
            style={StyleSheet.absoluteFillObject}
            facing="back"
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            barcodeScannerSettings={{ barcodeTypes: ['qr', 'code128', 'code39'] }}
          />
          {/* Overlay viseur — position absolue, hors de CameraView */}
          <View style={styles.overlay} pointerEvents="none">
            <View style={styles.viewfinder}>
              <View style={[styles.corner, styles.cornerTopLeft]} />
              <View style={[styles.corner, styles.cornerTopRight]} />
              <View style={[styles.corner, styles.cornerBottomLeft]} />
              <View style={[styles.corner, styles.cornerBottomRight]} />
            </View>
            <Text style={styles.scanInstruction}>
              Pointez la caméra sur le QR code du lot
            </Text>
          </View>

          {scanned && (
            <TouchableOpacity
              style={styles.rescanBtn}
              onPress={() => setScanned(false)}
            >
              <MaterialCommunityIcons name="refresh" size={20} color="white" />
              <Text style={styles.rescanText}>Scanner à nouveau</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <View style={styles.manualContainer}>
          <MaterialCommunityIcons name="barcode-scan" size={80} color="#CCC" />
          <Text style={styles.manualTitle}>Saisie de l'identifiant</Text>
          <Text style={styles.manualDesc}>
            Entrez l'identifiant ou la référence du lot
          </Text>
          <ManualInput value={manualId} onChange={setManualId} onSearch={handleManualSearch} />
        </View>
      )}
    </SafeAreaView>
  );
}

const ManualInput = ({
  value,
  onChange,
  onSearch,
}: {
  value: string;
  onChange: (v: string) => void;
  onSearch: () => void;
}) => (
  <View style={styles.manualInputRow}>
    <TextInput
      style={styles.manualInput}
      placeholder="Ex: LOT-2026-A1"
      value={value}
      onChangeText={onChange}
      autoCapitalize="characters"
      returnKeyType="search"
      onSubmitEditing={onSearch}
    />
    <TouchableOpacity style={styles.searchBtn} onPress={onSearch}>
      <MaterialCommunityIcons name="magnify" size={24} color="white" />
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1B5E20' },
  header: {
    height: 70,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  headerTitle: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  modeToggle: { padding: 5 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  cameraContainer: { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewfinder: {
    width: 250,
    height: 250,
    position: 'relative',
    backgroundColor: 'transparent',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#4CAF50',
    borderWidth: 3,
  },
  cornerTopLeft: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  cornerTopRight: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  cornerBottomLeft: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  cornerBottomRight: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
  scanInstruction: {
    color: 'white',
    marginTop: 30,
    fontSize: 15,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  rescanBtn: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2E7D32',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  rescanText: { color: 'white', fontWeight: 'bold', fontSize: 15 },
  permissionContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  permissionTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginTop: 15 },
  permissionDesc: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 22,
  },
  permissionBtn: {
    backgroundColor: '#2E7D32',
    borderRadius: 14,
    paddingHorizontal: 30,
    paddingVertical: 14,
    marginTop: 25,
  },
  permissionBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  orText: { color: '#CCC', marginVertical: 15, fontSize: 14 },
  manualHint: { color: '#666', fontSize: 14, marginBottom: 10 },
  manualContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  manualTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginTop: 15 },
  manualDesc: { fontSize: 14, color: '#666', textAlign: 'center', marginTop: 8, marginBottom: 25 },
  manualInputRow: {
    flexDirection: 'row',
    width: '100%',
    marginTop: 15,
  },
  manualInput: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginRight: 10,
  },
  searchBtn: {
    backgroundColor: '#2E7D32',
    borderRadius: 12,
    width: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
