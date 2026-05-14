import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';

export default function ScannerScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [torch, setTorch] = useState(false);
  const [scanned, setScanned] = useState(false);

  // Demande de permission au chargement
  useEffect(() => {
    requestPermission();
  }, []);

  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Nous avons besoin de votre permission pour utiliser la caméra</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.button}>
          <Text style={styles.buttonText}>Accorder la permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBarCodeScanned = ({ type, data }: { type: string, data: string }) => {
    if (scanned) return;
    setScanned(true);
    alert(`Code scanner : ${data}`);
    // Ici tu pourras rediriger vers les détails du lot
    // router.push({ pathname: '/lot-detail', params: { id: data } });
    
    // Pour l'instant on réinitialise après 2 sec
    setTimeout(() => setScanned(false), 2000);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <CameraView 
        style={StyleSheet.absoluteFillObject} 
        facing="back"
        enableTorch={torch}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
      >
        <SafeAreaView style={styles.overlay}>
          {/* HEADER DU SCANNER */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
              <MaterialCommunityIcons name="close" size={30} color="white" />
            </TouchableOpacity>
            
            <Text style={styles.instructionText}>Placez le QR code dans le cadre</Text>
            
            <TouchableOpacity onPress={() => setTorch(!torch)} style={styles.iconButton}>
              <MaterialCommunityIcons 
                name={torch ? "flashlight" : "flashlight-off"} 
                size={30} 
                color="white" 
              />
            </TouchableOpacity>
          </View>

          {/* CADRE DE VISÉE */}
          <View style={styles.content}>
            <View style={styles.scannerFrame}>
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />
            </View>
          </View>

          <View style={styles.footer}>
             {scanned && <Text style={styles.scannedText}>Lecture en cours...</Text>}
          </View>
        </SafeAreaView>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black', justifyContent: 'center' },
  message: { textAlign: 'center', color: 'white', paddingBottom: 10, fontFamily: 'Montserrat-Regular' },
  button: { backgroundColor: '#2E7D32', padding: 15, borderRadius: 10, alignSelf: 'center' },
  buttonText: { color: 'white', fontFamily: 'Montserrat-Bold' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20, 
    paddingTop: 40 
  },
  instructionText: { 
    color: 'white', 
    fontFamily: 'Montserrat-Bold', 
    fontSize: 14,
    textAlign: 'center',
    flex: 1
  },
  iconButton: { padding: 10, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 25 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scannerFrame: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#43A047',
    borderWidth: 4,
  },
  topLeft: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  topRight: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  bottomLeft: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  bottomRight: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
  footer: { paddingBottom: 60, alignItems: 'center' },
  scannedText: { color: '#43A047', fontFamily: 'Montserrat-Bold', fontSize: 18, backgroundColor: 'white', padding: 10, borderRadius: 10 }
});