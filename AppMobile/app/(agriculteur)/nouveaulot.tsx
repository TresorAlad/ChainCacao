import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StatusBar,
  ActivityIndicator,
  Alert,
  Modal,
  Image,
  Platform,
  Linking,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import * as Font from 'expo-font';
import { Picker } from '@react-native-picker/picker';
// NetInfo retiré — pas de pré-vérification réseau (faux positifs fréquents).
import * as Location from 'expo-location';
import { Paths, File, Directory } from 'expo-file-system';
import { CameraView, useCameraPermissions } from 'expo-camera';

import { useLots } from '@/hooks/use-storage';
import { useAuth } from '@/hooks/use-auth';
import { batchApi, getApiError } from '@/services/api';
// device-online retiré — l'app tente toujours l'API directement.
import { signLotPayload } from '@/lib/lot-crypto';
import { reverseGeocodeCoordsWithRegion } from '@/lib/geocode';
import type { LotSignPayload } from '@/lib/lot-payload';
import {
  FORM_PLACEHOLDER_COLOR,
  FORM_TEXT_COLOR,
} from '@/constants/form-styles';

function frDateToIso(fr: string): string {
  const parts = fr.split('/');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  }
  return new Date().toISOString().split('T')[0];
}


export default function NouveauLot() {
  const router = useRouter();
  const { user } = useAuth();
  const { saveLot } = useLots();
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitHint, setSubmitHint] = useState<string | null>(null);

  const [typeProduit, setTypeProduit] = useState<'Cacao' | 'Café'>('Cacao');
  const [variete, setVariete] = useState('');
  const [poids, setPoids] = useState('');
  const [dateRecolte] = useState(new Date().toLocaleDateString('fr-FR'));
  /** Aperçu immédiat après capture (fichier temporaire ou copié). */
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  const [gpsLat, setGpsLat] = useState<number | null>(null);
  const [gpsLon, setGpsLon] = useState<number | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);

  const [showCamera, setShowCamera] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const cameraRef = useRef<InstanceType<typeof CameraView> | null>(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  const varietesCacao = ['Amelonado', 'Criollo', 'Trinitario', 'Forastero'];
  const varietesCafe = ['Robustra', 'Arabica', 'Niaouli'];

  useEffect(() => {
    async function loadFonts() {
      try {
        await Font.loadAsync({
          'Montserrat-Bold': require('../../assets/fonts/Montserrat-Bold.ttf'),
          'Montserrat-Regular': require('../../assets/fonts/Montserrat-Regular.ttf'),
        });
      } catch (e) {
        console.warn('Erreur polices');
      } finally {
        setFontsLoaded(true);
      }
    }
    loadFonts();
  }, []);

  const refreshGpsPosition = useCallback(async () => {
    setGpsLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return;
      }
      try {
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setGpsLat(pos.coords.latitude);
        setGpsLon(pos.coords.longitude);
      } catch {
        const last = await Location.getLastKnownPositionAsync({ maxAge: 86_400_000 });
        if (last?.coords) {
          setGpsLat(last.coords.latitude);
          setGpsLon(last.coords.longitude);
        }
      }
    } finally {
      setGpsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshGpsPosition();
  }, [refreshGpsPosition]);

  const openCameraModal = async () => {
    const cam = await requestCameraPermission();
    if (!cam.granted) {
      Alert.alert('Caméra', "L'accès à la caméra est nécessaire pour photographier le lot.");
      return;
    }
    setCameraReady(false);
    setShowCamera(true);
  };

  const capturePhoto = async () => {
    if (!cameraRef.current || !cameraReady) return;
    try {
      const pic = await cameraRef.current.takePictureAsync({
        quality: 0.88,
        exif: true,
      });
      if (pic?.uri) {
        setPhotoUri(pic.uri);
        setShowCamera(false);
      }
    } catch {
      Alert.alert('Photo', 'Impossible de prendre la photo. Réessayez.');
    }
  };

  const handleValider = async () => {
    if (!variete || !poids) {
      Alert.alert('Champs manquants', 'Sélectionnez une variété et indiquez le poids.');
      return;
    }
    if (!photoUri) {
      Alert.alert(
        'Photo obligatoire',
        'Prenez une photo du lot : elle est exigée pour la traçabilité (CDC). La position est fournie automatiquement par le GPS.'
      );
      return;
    }

    if (!user?.id) {
      Alert.alert('Connexion', 'Vous devez être connecté pour créer un lot.');
      return;
    }

    setIsSubmitting(true);
    setSubmitHint(null);
    try {
      const localId = `local_${Date.now()}`;
      const culture = typeProduit === 'Cacao' ? 'Cacao' : 'Cafe';
      const dateIso = frDateToIso(dateRecolte);
      const qty = parseFloat(poids.replace(',', '.')) || 0;

      const pendingDir = new Directory(Paths.document, 'pending-lots');
      pendingDir.create({ intermediates: true, idempotent: true });
      const destFile = new File(pendingDir, `${localId}.jpg`);
      const srcFile = new File(photoUri);
      srcFile.copy(destFile);
      const storedPhoto = destFile.uri;

      let lat = gpsLat ?? undefined;
      let lon = gpsLon ?? undefined;
      if (lat == null || lon == null) {
        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status === 'granted') {
            try {
              const pos = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
              });
              lat = pos.coords.latitude;
              lon = pos.coords.longitude;
            } catch {
              /* ignore */
            }
            if (lat == null || lon == null) {
              const last = await Location.getLastKnownPositionAsync({ maxAge: 86_400_000 });
              if (last?.coords) {
                lat = last.coords.latitude;
                lon = last.coords.longitude;
              }
            }
          }
        } catch {
          /* ignore */
        }
      }

      if (lat == null || lon == null) {
        Alert.alert(
          'Position requise',
          'Activez la localisation pour cet écran ou touchez « Actualiser la position » après avoir accordé la permission.'
        );
        setIsSubmitting(false);
        return;
      }

      const { lieu: adresseLieu, region } = await reverseGeocodeCoordsWithRegion(lat, lon);

      const fields = {
        culture,
        quantite: qty,
        lieu: adresseLieu,
        date_recolte: dateIso,
        notes: variete,
        variete,
        region,
        client_lot_id: localId,
        latitude: lat,
        longitude: lon,
      };

      const signBase: LotSignPayload = {
        client_lot_id: localId,
        culture,
        variete,
        quantite: qty,
        lieu: adresseLieu,
        latitude: lat,
        longitude: lon,
        date_recolte: dateIso,
        notes: variete,
        actor_id: user.id,
      };
      await signLotPayload(signBase);

      setSubmitHint('Envoi au serveur en cours…');
      try {
        const { data } = await batchApi.createWithPhoto(storedPhoto, fields);
        const serverId = data.batch?.id ?? localId;
        await destFile.delete();
        await saveLot();
        Alert.alert('Succès', 'Lot enregistré sur la blockchain.', [
          {
            text: 'Voir le QR',
            onPress: () =>
              router.replace(`/(agriculteur)/qr-lot?lotId=${encodeURIComponent(serverId)}` as any),
          },
        ]);
        return;
      } catch (e) {
        Alert.alert('Erreur', getApiError(e));
        return;
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de sauvegarder le lot.');
    } finally {
      setIsSubmitting(false);
      setSubmitHint(null);
    }
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

        <Modal visible={showCamera} animationType="slide" onRequestClose={() => setShowCamera(false)}>
          <View style={styles.cameraModal}>
            {cameraPermission?.granted ? (
              <CameraView
                ref={cameraRef}
                style={StyleSheet.absoluteFillObject}
                facing="back"
                onCameraReady={() => setCameraReady(true)}
              />
            ) : (
              <View style={styles.cameraDenied}>
                <Text style={styles.cameraDeniedText}>Permission caméra requise.</Text>
              </View>
            )}
            <SafeAreaView style={styles.cameraOverlay} edges={['top', 'bottom']}>
              <View style={styles.cameraTopBar}>
                <TouchableOpacity onPress={() => setShowCamera(false)} style={styles.cameraIconBtn}>
                  <MaterialCommunityIcons name="close" size={28} color="white" />
                </TouchableOpacity>
                <Text style={styles.cameraTitle}>Photo du lot</Text>
                <View style={{ width: 44 }} />
              </View>
              <View style={{ flex: 1 }} />
              <View style={styles.cameraBottomBar}>
                <TouchableOpacity
                  style={[styles.shutterBtn, (!cameraReady || !cameraPermission?.granted) && { opacity: 0.5 }]}
                  onPress={capturePhoto}
                  disabled={!cameraReady || !cameraPermission?.granted}
                >
                  <View style={styles.shutterInner} />
                </TouchableOpacity>
              </View>
            </SafeAreaView>
          </View>
        </Modal>

        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialCommunityIcons name="arrow-left" size={28} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Nouveau lot</Text>
        </View>

        <View style={styles.body}>
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <Text style={styles.instructionText}>
              Autorisez la localisation au démarrage : votre position est affichée sur la carte et envoyée avec le lot (sans
              saisie manuelle des coordonnées), comme sur le web. Une photo du lot reste obligatoire pour la traçabilité.
            </Text>

            <TouchableOpacity style={styles.photoBtn} onPress={openCameraModal}>
              <MaterialCommunityIcons name="camera" size={28} color="white" />
              <Text style={styles.photoBtnText}>{photoUri ? 'Reprendre la photo' : 'Prendre la photo du lot'}</Text>
            </TouchableOpacity>

            {photoUri ? (
              <View style={styles.previewWrap}>
                <Image source={{ uri: photoUri }} style={styles.previewImg} resizeMode="cover" />
              </View>
            ) : null}

            <View style={styles.mapCard}>
              <View style={styles.mapCardHeader}>
                <MaterialCommunityIcons name="crosshairs-gps" size={22} color="#1B5E20" />
                <Text style={styles.mapCardTitle}>Position du lot</Text>
              </View>
              {gpsLoading ? (
                <View style={styles.mapLoading}>
                  <ActivityIndicator color="#2E7D32" />
                  <Text style={styles.mapLoadingText}>Localisation…</Text>
                </View>
              ) : gpsLat != null && gpsLon != null ? (
                <TouchableOpacity
                  activeOpacity={0.92}
                  onPress={() => Linking.openURL(`geo:${gpsLat},${gpsLon}?q=${gpsLat},${gpsLon}`)}
                >
                  <Image
                    source={{
                      uri: `https://staticmap.openstreetmap.de/staticmap.php?center=${gpsLat},${gpsLon}&zoom=14&size=380x180&markers=${gpsLat},${gpsLon},lightblue1`,
                    }}
                    style={styles.mapPreview}
                    resizeMode="cover"
                  />
                  <Text style={styles.mapHint}>Toucher pour ouvrir dans l’application cartes · {gpsLat.toFixed(5)}, {gpsLon.toFixed(5)}</Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.mapFallbackText}>
                  Activez la localisation dans les réglages du téléphone, puis « Actualiser ».
                </Text>
              )}
              <TouchableOpacity style={styles.gpsRefreshBtn} onPress={() => void refreshGpsPosition()}>
                <MaterialCommunityIcons name="navigation-variant" size={20} color="#fff" />
                <Text style={styles.gpsRefreshText}>Actualiser la position</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.typeSelectionRow}>
              <TouchableOpacity
                style={[styles.typeFrame, typeProduit === 'Cacao' && styles.typeFrameActive]}
                onPress={() => {
                  setTypeProduit('Cacao');
                  setVariete('');
                }}
              >
                <MaterialCommunityIcons name="seed" size={40} color={typeProduit === 'Cacao' ? '#2E7D32' : '#888'} />
                <Text style={[styles.typeLabel, typeProduit === 'Cacao' && styles.typeLabelActive]}>Cacao</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.typeFrame, typeProduit === 'Café' && styles.typeFrameActive]}
                onPress={() => {
                  setTypeProduit('Café');
                  setVariete('');
                }}
              >
                <MaterialCommunityIcons name="coffee" size={40} color={typeProduit === 'Café' ? '#2E7D32' : '#888'} />
                <Text style={[styles.typeLabel, typeProduit === 'Café' && styles.typeLabelActive]}>Café</Text>
              </TouchableOpacity>
            </View>


            <View style={styles.form}>
              <Text style={styles.inputLabel}>Variété de {typeProduit}</Text>
              {variete ? (
                <Text style={styles.pickerValue}>{variete}</Text>
              ) : null}
              <View style={styles.pickerFrame}>
                <Picker
                  selectedValue={variete}
                  onValueChange={(v) => setVariete(v)}
                  style={styles.picker}
                  dropdownIconColor={FORM_TEXT_COLOR}
                  mode={Platform.OS === 'android' ? 'dropdown' : 'dialog'}
                  itemStyle={styles.pickerItemIOS}
                >
                  <Picker.Item label="Sélectionner une variété…" value="" color={FORM_PLACEHOLDER_COLOR} />
                  {(typeProduit === 'Cacao' ? varietesCacao : varietesCafe).map((v) => (
                    <Picker.Item key={v} label={v} value={v} color={FORM_TEXT_COLOR} />
                  ))}
                </Picker>
              </View>

              <Text style={styles.inputLabel}>Poids (Kg)</Text>
              <View style={styles.inputFrame}>
                <MaterialCommunityIcons name="weight-kilogram" size={20} color="#2E7D32" style={styles.iconInput} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Ex: 50"
                  keyboardType="numeric"
                  value={poids}
                  onChangeText={setPoids}
                />
              </View>

              {submitHint ? (
                <View style={styles.submitHintBox}>
                  <ActivityIndicator size="small" color="#2E7D32" />
                  <Text style={styles.submitHintText}>{submitHint}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                style={[styles.validerBtn, isSubmitting && { opacity: 0.7 }]}
                onPress={handleValider}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Text style={styles.validerBtnText}>Enregistrer le lot</Text>
                    <MaterialCommunityIcons name="cloud-upload" size={22} color="white" />
                  </>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>

        <View style={styles.bottomTab}>
          <TabItem icon="home-outline" label="Accueil" onPress={() => router.replace('/(agriculteur)/accueil' as any)} />
          <TabItem icon="archive-outline" label="Mes Lots" onPress={() => router.replace('/(agriculteur)/meslots' as any)} />
          <TabItem icon="plus-circle" label="Nouveau" active isMain />
          <TabItem
            icon="wallet-outline"
            label="Wallet"
            onPress={() => router.replace('/(agriculteur)/portefeuille' as any)}
          />
          <TabItem
            icon="account-circle-outline"
            label="Profil"
            onPress={() => router.replace('/(agriculteur)/profil' as any)}
          />
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const TabItem = ({ icon, label, active = false, isMain = false, onPress }: any) => (
  <TouchableOpacity style={styles.tabItem} onPress={onPress}>
    <MaterialCommunityIcons name={icon} size={isMain ? 34 : 24} color={active || isMain ? '#2E7D32' : '#888'} />
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
  header: { height: 60, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20 },
  headerTitle: { color: 'white', fontSize: 20, fontFamily: 'Montserrat-Bold', marginLeft: 15 },
  body: { flex: 1, backgroundColor: '#F5F5F5', borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  content: { padding: 20, paddingBottom: 100 },
  instructionText: { fontFamily: 'Montserrat-Regular', fontSize: 13, color: '#666', marginBottom: 16, textAlign: 'center' },
  photoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#2E7D32',
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  photoBtnText: { color: 'white', fontFamily: 'Montserrat-Bold', fontSize: 15 },
  previewWrap: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  previewImg: { width: '100%', height: 180, backgroundColor: '#EEE' },
  mapCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    padding: 12,
    marginBottom: 16,
  },
  mapCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  mapCardTitle: { fontFamily: 'Montserrat-Bold', fontSize: 14, color: '#1B5E20' },
  mapPreview: { width: '100%', height: 160, borderRadius: 10, backgroundColor: '#EEE' },
  mapHint: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 11,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  mapLoading: { alignItems: 'center', paddingVertical: 24 },
  mapLoadingText: { marginTop: 8, fontFamily: 'Montserrat-Regular', fontSize: 13, color: '#666' },
  mapFallbackText: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    paddingVertical: 16,
  },
  gpsRefreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2E7D32',
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: 12,
  },
  gpsRefreshText: { color: 'white', fontFamily: 'Montserrat-Bold', fontSize: 14 },
  typeSelectionRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  typeFrame: {
    width: '48%',
    backgroundColor: 'white',
    height: 90,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EEE',
    elevation: 2,
  },
  typeFrameActive: { borderColor: '#2E7D32', backgroundColor: '#E8F5E9' },
  typeLabel: { marginTop: 5, fontFamily: 'Montserrat-Bold', color: '#888', fontSize: 12 },
  typeLabelActive: { color: '#2E7D32' },
  form: { marginTop: 5 },
  inputLabel: { fontFamily: 'Montserrat-Bold', fontSize: 14, color: '#333', marginBottom: 8, marginTop: 10 },
  inputFrame: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    height: 50,
    paddingHorizontal: 12,
  },
  pickerFrame: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginBottom: 4,
    overflow: 'hidden',
    justifyContent: 'center',
    minHeight: Platform.OS === 'ios' ? 52 : 48,
  },
  pickerValue: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 15,
    color: FORM_TEXT_COLOR,
    marginBottom: 6,
  },
  picker: {
    width: '100%',
    color: FORM_TEXT_COLOR,
    ...(Platform.OS === 'android' ? { height: 48 } : {}),
  },
  pickerItemIOS: {
    fontSize: 16,
    color: FORM_TEXT_COLOR,
    fontFamily: 'Montserrat-Regular',
  },
  diagBox: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#ECEFF1',
    borderWidth: 1,
    borderColor: '#B0BEC5',
  },
  diagTitle: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 12,
    color: '#37474F',
    marginBottom: 6,
  },
  diagText: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 11,
    color: '#455A64',
    lineHeight: 16,
  },
  submitHintBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
    padding: 12,
    backgroundColor: '#E8F5E9',
    borderRadius: 10,
  },
  submitHintText: {
    flex: 1,
    fontFamily: 'Montserrat-Regular',
    fontSize: 13,
    color: '#1B5E20',
  },
  iconInput: { marginRight: 10 },
  textInput: { flex: 1, fontFamily: 'Montserrat-Regular', fontSize: 15, color: FORM_TEXT_COLOR },
  validerBtn: {
    backgroundColor: '#2E7D32',
    flexDirection: 'row',
    height: 55,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
    gap: 10,
  },
  validerBtnText: { color: 'white', fontFamily: 'Montserrat-Bold', fontSize: 16 },
  bottomTab: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 70,
    backgroundColor: 'white',
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  tabItem: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tabLabel: { fontSize: 9, marginTop: 2 },
  cameraModal: { flex: 1, backgroundColor: 'black' },
  cameraOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'space-between' },
  cameraTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  cameraIconBtn: { padding: 8 },
  cameraTitle: { color: 'white', fontFamily: 'Montserrat-Bold', fontSize: 16 },
  cameraBottomBar: { alignItems: 'center', paddingBottom: 28 },
  shutterBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'white' },
  cameraDenied: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  cameraDeniedText: { color: 'white', fontFamily: 'Montserrat-Regular' },
});
