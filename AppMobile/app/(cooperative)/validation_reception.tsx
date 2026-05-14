import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  Image, 
  ScrollView,
  KeyboardAvoidingView,
  Platform 
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ValidationReceptionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const brandGreen = '#2E7D32';

  // État pour le poids saisi à la réception
  const [poidsReception, setPoidsReception] = useState('');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={28} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Validation Réception</Text>
        <View style={{ width: 28 }} />
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        <ScrollView style={styles.body} contentContainerStyle={styles.content}>
          
          {/* IMAGE DES SACS */}
          <View style={styles.imageContainer}>
            <Image 
              source={{ uri: 'https://images.unsplash.com/photo-1587049016823-69ef9d68bd44?q=80&w=1000&auto=format&fit=crop' }} 
              style={styles.sacImage}
              resizeMode="cover"
            />
            <View style={styles.imageBadge}>
              <MaterialCommunityIcons name="camera" size={16} color="white" />
              <Text style={styles.imageBadgeText}>Photo du lot</Text>
            </View>
          </View>

          {/* RÉCAPITULATIF INFOS DU LOT */}
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Détails de l'expédition</Text>
            
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="account-circle" size={20} color={brandGreen} />
                <View style={styles.infoTextGroup}>
                  <Text style={styles.infoLabel}>Agriculteur</Text>
                  <Text style={styles.infoValue}>{params.agriculteur || "Non spécifié"}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="map-marker" size={20} color={brandGreen} />
                <View style={styles.infoTextGroup}>
                  <Text style={styles.infoLabel}>Lieu de production</Text>
                  <Text style={styles.infoValue}>{params.provenance || "Lieu inconnu"}</Text>
                </View>
              </View>

              {/* NOUVELLE SECTION : COORDONNÉES GPS */}
              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="crosshairs-gps" size={20} color={brandGreen} />
                <View style={styles.infoTextGroup}>
                  <Text style={styles.infoLabel}>Coordonnées GPS (Origine)</Text>
                  <Text style={styles.infoValue}>
                    {params.latitude && params.longitude 
                      ? `${params.latitude}, ${params.longitude}` 
                      : "6.1311° N, 1.2227° E"} 
                  </Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="scale" size={20} color={brandGreen} />
                <View style={styles.infoTextGroup}>
                  <Text style={styles.infoLabel}>Poids annoncé (Départ)</Text>
                  <Text style={styles.infoValue}>{params.poids || "0"} Kg</Text>
                </View>
              </View>
            </View>
          </View>

          {/* ZONE DE SAISIE : POIDS RÉCEPTION */}
          <View style={styles.receptionSection}>
            <Text style={styles.sectionTitle}>Poids à la réception</Text>
            <View style={styles.inputFrame}>
              <MaterialCommunityIcons name="weight-kilogram" size={24} color={brandGreen} />
              <TextInput 
                style={styles.poidsInput}
                placeholder="Entrez le poids réel mesuré"
                keyboardType="numeric"
                value={poidsReception}
                onChangeText={setPoidsReception}
                placeholderTextColor="#999"
              />
              <Text style={styles.unitText}>Kg</Text>
            </View>
          </View>

          {/* BOUTONS D'ACTION */}
          <View style={styles.actionRow}>
            <TouchableOpacity 
              style={styles.btnAnnuler} 
              onPress={() => router.back()}
            >
              <Text style={styles.btnAnnulerText}>Annuler</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.btnValider}
              onPress={() => {
                console.log("Validation du lot avec poids:", poidsReception);
                router.replace('/(cooperative)/accueil' as any);
              }}
            >
              <Text style={styles.btnValiderText}>Valider</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Les styles restent identiques, j'ai juste ajouté l'icône dans la structure ci-dessus.
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1B5E20' },
  header: { 
    height: 60, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20 
  },
  headerTitle: { color: 'white', fontSize: 18, fontFamily: 'Montserrat-Bold' },
  body: { 
    flex: 1, 
    backgroundColor: '#F8F9FA', 
    borderTopLeftRadius: 30, 
    borderTopRightRadius: 30 
  },
  content: { padding: 20 },
  imageContainer: { 
    width: '100%', 
    height: 180, 
    borderRadius: 20, 
    overflow: 'hidden', 
    marginBottom: 20,
    backgroundColor: '#EEE',
    elevation: 3
  },
  sacImage: { width: '100%', height: '100%' },
  imageBadge: { 
    position: 'absolute', 
    bottom: 10, 
    right: 10, 
    backgroundColor: 'rgba(0,0,0,0.6)', 
    paddingHorizontal: 10, 
    paddingVertical: 5, 
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center'
  },
  imageBadgeText: { color: 'white', fontSize: 10, marginLeft: 5, fontFamily: 'Montserrat-Regular' },
  sectionTitle: { fontSize: 15, fontFamily: 'Montserrat-Bold', color: '#333', marginBottom: 10 },
  infoSection: { marginBottom: 25 },
  infoCard: { backgroundColor: 'white', borderRadius: 20, padding: 15, elevation: 2 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  infoTextGroup: { marginLeft: 15 },
  infoLabel: { fontSize: 11, color: '#888', fontFamily: 'Montserrat-Regular' },
  infoValue: { fontSize: 15, color: '#333', fontFamily: 'Montserrat-Bold' },
  receptionSection: { marginBottom: 30 },
  inputFrame: { 
    backgroundColor: 'white', 
    height: 65, 
    borderRadius: 15, 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 15,
    borderWidth: 2,
    borderColor: '#E8F5E9'
  },
  poidsInput: { flex: 1, marginLeft: 10, fontSize: 18, fontFamily: 'Montserrat-Bold', color: '#2E7D32' },
  unitText: { fontSize: 18, fontFamily: 'Montserrat-Bold', color: '#999' },
  actionRow: { flexDirection: 'row', gap: 15, marginBottom: 20 },
  btnAnnuler: { 
    flex: 1, 
    height: 55, 
    backgroundColor: 'white', 
    borderRadius: 15, 
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DDD'
  },
  btnAnnulerText: { color: '#666', fontFamily: 'Montserrat-Bold', fontSize: 16 },
  btnValider: { 
    flex: 1, 
    height: 55, 
    backgroundColor: '#2E7D32', 
    borderRadius: 15, 
    justifyContent: 'center', 
    alignItems: 'center',
    elevation: 3
  },
  btnValiderText: { color: 'white', fontFamily: 'Montserrat-Bold', fontSize: 16 }
});