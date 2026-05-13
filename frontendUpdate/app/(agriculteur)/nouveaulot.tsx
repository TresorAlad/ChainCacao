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
  Alert
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import * as Font from 'expo-font';
import { Picker } from '@react-native-picker/picker';

// AJOUTS POUR LE MODE HORS-LIGNE
import * as Network from 'expo-network';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function NouveauLot() {
  const router = useRouter();
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // États du formulaire
  const [typeProduit, setTypeProduit] = useState<'Cacao' | 'Café'>('Cacao');
  const [variete, setVariete] = useState('');
  const [poids, setPoids] = useState('');
  const [parcelle, setParcelle] = useState('');
  const [dateRecolte] = useState(new Date().toLocaleDateString('fr-FR'));

  const varietesCacao = ["Amelonado", "Criollo", "Trinitario", "Forastero"];
  const varietesCafe = ["Robustra", "Arabica", "Niaouli"];

  useEffect(() => {
    async function loadFonts() {
      try {
        await Font.loadAsync({
          'Montserrat-Bold': require('../../assets/fonts/Montserrat-Bold.ttf'),
          'Montserrat-Regular': require('../../assets/fonts/Montserrat-Regular.ttf'),
        });
      } catch (e) {
        console.warn("Erreur polices");
      } finally {
        setFontsLoaded(true);
      }
    }
    loadFonts();
  }, []);

  // FONCTION DE SAUVEGARDE HORS-LIGNE
  const handleValider = async () => {
    // Validation de base
    if (!variete || !poids || !parcelle) {
      Alert.alert("Champs manquants", "Veuillez remplir toutes les informations.");
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Vérifier la connexion
      const network = await Network.getNetworkStateAsync();
      const isConnected = network.isConnected && network.isInternetReachable;

      // 2. Créer l'objet Lot
      const nouveauLot = {
        id: `local_${Date.now()}`, // ID temporaire unique
        nom: `${typeProduit} - ${parcelle}`,
        poids: poids,
        date: dateRecolte,
        variete: variete,
        statut: 'En attente',
        isSynced: false // Drapeau crucial
      };

      // 3. Récupérer les lots existants dans le cache
      const existingLotsJson = await AsyncStorage.getItem('user_lots');
      const existingLots = existingLotsJson ? JSON.parse(existingLotsJson) : [];
      
      // 4. Ajouter le nouveau lot au début de la liste
      const updatedLots = [nouveauLot, ...existingLots];
      await AsyncStorage.setItem('user_lots', JSON.stringify(updatedLots));

      // 5. Message de confirmation adapté
      if (isConnected) {
        // Optionnel : Ici tu pourrais tenter un appel API immédiatement
        Alert.alert("Succès", "Lot enregistré et synchronisé !");
      } else {
        Alert.alert(
          "Mode Hors-ligne", 
          "Lot enregistré localement. Il sera synchronisé dès que vous aurez internet.",
          [{ text: "OK", onPress: () => router.replace('/lots' as any) }]
        );
      }

      // Redirection vers la liste
      router.replace('/lots' as any);

    } catch (error) {
      Alert.alert("Erreur", "Impossible de sauvegarder le lot.");
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
              Enregistrez votre récolte même sans connexion.
            </Text>

            <View style={styles.typeSelectionRow}>
              <TouchableOpacity 
                style={[styles.typeFrame, typeProduit === 'Cacao' && styles.typeFrameActive]}
                onPress={() => { setTypeProduit('Cacao'); setVariete(''); }}
              >
                <MaterialCommunityIcons 
                  name="seed" size={40} 
                  color={typeProduit === 'Cacao' ? "#2E7D32" : "#888"} 
                />
                <Text style={[styles.typeLabel, typeProduit === 'Cacao' && styles.typeLabelActive]}>Cacao</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.typeFrame, typeProduit === 'Café' && styles.typeFrameActive]}
                onPress={() => { setTypeProduit('Café'); setVariete(''); }}
              >
                <MaterialCommunityIcons 
                  name="coffee" size={40} 
                  color={typeProduit === 'Café' ? "#2E7D32" : "#888"} 
                />
                <Text style={[styles.typeLabel, typeProduit === 'Café' && styles.typeLabelActive]}>Café</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.form}>
              <Text style={styles.inputLabel}>Variété de {typeProduit}</Text>
              <View style={styles.inputFrame}>
                <Picker
                  selectedValue={variete}
                  onValueChange={(v) => setVariete(v)}
                  style={styles.picker}
                >
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

        {/* BOTTOM TAB (Simplifié) */}
        <View style={styles.bottomTab}>
          <TabItem icon="home-outline" label="Accueil" onPress={() => router.replace('/accueil' as any)} />
          <TabItem icon="archive-outline" label="Mes Lots" onPress={() => router.replace('/lots' as any)} />
          <TabItem icon="plus-circle" label="Nouveau" active isMain />
          <TabItem icon="wallet-outline" label="Wallet" />
          <TabItem icon="account-circle-outline" label="Profil" />
        </View>

      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const TabItem = ({ icon, label, active = false, isMain = false, onPress }: any) => (
  <TouchableOpacity style={styles.tabItem} onPress={onPress}>
    <MaterialCommunityIcons name={icon} size={isMain ? 34 : 24} color={active || isMain ? "#2E7D32" : "#888"} />
    <Text style={[styles.tabLabel, { color: active ? "#2E7D32" : "#888", fontFamily: active ? 'Montserrat-Bold' : 'Montserrat-Regular' }]}>
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
  typeFrame: { width: '48%', backgroundColor: 'white', height: 90, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#EEE', elevation: 2 },
  typeFrameActive: { borderColor: '#2E7D32', backgroundColor: '#E8F5E9' },
  typeLabel: { marginTop: 5, fontFamily: 'Montserrat-Bold', color: '#888', fontSize: 12 },
  typeLabelActive: { color: '#2E7D32' },
  form: { marginTop: 5 },
  inputLabel: { fontFamily: 'Montserrat-Bold', fontSize: 14, color: '#333', marginBottom: 8, marginTop: 10 },
  inputFrame: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 10, borderWidth: 1, borderColor: '#E0E0E0', height: 50, paddingHorizontal: 12 },
  iconInput: { marginRight: 10 },
  textInput: { flex: 1, fontFamily: 'Montserrat-Regular', fontSize: 15 },
  picker: { flex: 1, marginLeft: -10 },
  validerBtn: { backgroundColor: '#2E7D32', flexDirection: 'row', height: 55, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 30, gap: 10 },
  validerBtnText: { color: 'white', fontFamily: 'Montserrat-Bold', fontSize: 16 },
  bottomTab: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 70, backgroundColor: 'white', flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#EEE' },
  tabItem: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tabLabel: { fontSize: 9, marginTop: 2 }
});