import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import * as Font from 'expo-font';
import { Picker } from '@react-native-picker/picker';
import * as Network from 'expo-network';
import * as Location from 'expo-location';

import { useLots, type Lot } from '@/hooks/use-storage';
import { useAuth } from '@/hooks/use-auth';
import { batchApi, getApiError, isNetworkError } from '@/services/api';

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

  const [typeProduit, setTypeProduit] = useState<'Cacao' | 'Café'>('Cacao');
  const [variete, setVariete] = useState('');
  const [poids, setPoids] = useState('');
  const [parcelle, setParcelle] = useState('');
  const [dateRecolte] = useState(new Date().toLocaleDateString('fr-FR'));

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

  const handleValider = async () => {
    if (!variete || !poids || !parcelle) {
      Alert.alert('Champs manquants', 'Veuillez remplir toutes les informations.');
      return;
    }

    if (!user?.id) {
      Alert.alert('Connexion', 'Vous devez être connecté pour créer un lot.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('GPS requis', "L'API exige latitude et longitude pour créer un lot.");
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const latitude = pos.coords.latitude;
      const longitude = pos.coords.longitude;

      const network = await Network.getNetworkStateAsync();
      const isConnected = !!(network.isConnected && network.isInternetReachable);

      const localId = `local_${Date.now()}`;
      const culture = typeProduit === 'Cacao' ? 'Cacao' : 'Cafe';
      const dateIso = frDateToIso(dateRecolte);
      const qty = parseFloat(poids.replace(',', '.')) || 0;

      const lotRow: Lot = {
        id: localId,
        title: `${typeProduit} — ${parcelle}`,
        status: 'En cours',
        date: dateRecolte,
        poids,
        destination: parcelle,
        typeCacao: variete,
        synced: false,
        latitude,
        longitude,
      };

      if (isConnected) {
        try {
          const { data } = await batchApi.create({
            culture,
            quantite: qty,
            lieu: parcelle,
            date_recolte: dateIso,
            notes: variete,
            variete,
            parcelle,
            latitude,
            longitude,
            client_lot_id: localId,
          });
          const serverId = data.batch?.id ?? localId;
          await saveLot({
            ...lotRow,
            id: serverId,
            synced: true,
            status: 'Terminé',
          });
          Alert.alert('Succès', 'Lot enregistré sur la blockchain.', [
            { text: 'OK', onPress: () => router.replace('/(agriculteur)/meslots' as any) },
          ]);
          return;
        } catch (e) {
          if (!isNetworkError(e)) {
            Alert.alert('Erreur API', getApiError(e));
            return;
          }
        }
      }

      await saveLot(lotRow);
      Alert.alert(
        'Mode hors-ligne',
        'Lot enregistré localement. Il sera synchronisé automatiquement dès que le réseau sera disponible.',
        [{ text: 'OK', onPress: () => router.replace('/(agriculteur)/meslots' as any) }]
      );
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de sauvegarder le lot.');
    } finally {
      setIsSubmitting(false);
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

        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialCommunityIcons name="arrow-left" size={28} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Nouveau lot</Text>
        </View>

        <View style={styles.body}>
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <Text style={styles.instructionText}>
              Enregistrez votre récolte. Le GPS est utilisé pour la conformité API.
            </Text>

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
              <View style={styles.inputFrame}>
                <Picker selectedValue={variete} onValueChange={(v) => setVariete(v)} style={styles.picker}>
                  <Picker.Item label="Sélectionner..." value="" color="#AAA" />
                  {(typeProduit === 'Cacao' ? varietesCacao : varietesCafe).map((v) => (
                    <Picker.Item key={v} label={v} value={v} />
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

              <Text style={styles.inputLabel}>Parcelle d'origine</Text>
              <View style={styles.inputFrame}>
                <MaterialCommunityIcons name="map-marker-radius" size={20} color="#2E7D32" style={styles.iconInput} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Nom de la parcelle"
                  value={parcelle}
                  onChangeText={setParcelle}
                />
              </View>

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
  instructionText: { fontFamily: 'Montserrat-Regular', fontSize: 13, color: '#666', marginBottom: 20, textAlign: 'center' },
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
  iconInput: { marginRight: 10 },
  textInput: { flex: 1, fontFamily: 'Montserrat-Regular', fontSize: 15 },
  picker: { flex: 1, marginLeft: -10 },
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
});
