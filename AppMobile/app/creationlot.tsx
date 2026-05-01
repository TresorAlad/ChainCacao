import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CreationLotScreen() {
  const router = useRouter();

  // État du formulaire
  const [form, setForm] = useState({
    reference: '',
    typeCacao: '',
    localisation: '',
    quantite: '',
    producteur: "Koffi Mensah", // Valeur par défaut
    statut: "En cours"
  });

  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Gestion du changement de date
  const onDateChange = (event: any, selectedDate?: Date) => {
    // Sur Android, on ferme le picker immédiatement après sélection
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }

    if (selectedDate) {
      // Sécurité : Bloquer les dates futures
      if (selectedDate > new Date()) {
        Alert.alert("Date invalide", "La date de récolte ne peut pas être dans le futur.");
        return;
      }
      setDate(selectedDate);
    }
  };

  const handleSave = () => {
    // 1. Validation des champs obligatoires
    if (!form.reference.trim() || !form.quantite.trim()) {
      Alert.alert("Champs manquants", "Veuillez remplir au moins la référence et la quantité.");
      return;
    }

    // 2. Formatage de la date en chaîne (JJ/MM/AAAA) pour le transport dans l'URL
    const dateString = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;

    // 3. Envoi des données via les paramètres de navigation
    // On utilise router.push vers /production avec les params
    router.push({
      pathname: "/production",
      params: {
        newLotTitle: form.reference,
        newLotStatus: form.statut,
        newLotDate: dateString,
        newLotQty: form.quantite,
        newLotZone: form.localisation,
        newLotType: form.typeCacao
      }
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* --- EN-TÊTE --- */}
      <LinearGradient colors={['#1B5E20', '#2E7D32', '#43A047']} style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={30} color="white" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Ajouter un lot</Text>
        
        <View style={{ width: 40 }} /> 
      </LinearGradient>

      {/* --- FORMULAIRE --- */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        <ScrollView style={styles.body} contentContainerStyle={styles.scrollContent}>
          
          <InputLabel label="Référence du Lot" icon="barcode-scan" />
          <TextInput 
            style={styles.input}
            placeholder="Ex: LOT-2026-A1"
            value={form.reference}
            onChangeText={(t) => setForm({...form, reference: t})}
          />

          <InputLabel label="Type de Cacao" icon="clover" />
          <TextInput 
            style={styles.input}
            placeholder="Ex: Forastero, Criollo..."
            value={form.typeCacao}
            onChangeText={(t) => setForm({...form, typeCacao: t})}
          />

          <InputLabel label="Localisation / Zone" icon="map-marker" />
          <TextInput 
            style={styles.input}
            placeholder="Ex: Zone Sud - Kpalimé"
            value={form.localisation}
            onChangeText={(t) => setForm({...form, localisation: t})}
          />

          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <InputLabel label="Quantité (kg)" icon="weight-kilogram" />
              <TextInput 
                style={styles.input}
                placeholder="Ex: 500"
                keyboardType="numeric"
                value={form.quantite}
                onChangeText={(t) => setForm({...form, quantite: t})}
              />
            </View>
            <View style={{ flex: 1 }}>
              <InputLabel label="Date Récolte" icon="calendar" />
              <TouchableOpacity 
                style={styles.datePickerBtn} 
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.dateText}>{date.toLocaleDateString('fr-FR')}</Text>
                <MaterialCommunityIcons name="chevron-down" size={20} color="#666" />
              </TouchableOpacity>
            </View>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              maximumDate={new Date()}
              onChange={onDateChange}
            />
          )}

          <InputLabel label="Producteur" icon="account-tie" />
          <TextInput 
            style={[styles.input, styles.disabledInput]}
            value={form.producteur}
            editable={false}
          />

          <InputLabel label="Statut initial" icon="clock-outline" />
          <View style={styles.statusMock}>
            <Text style={styles.statusText}>{form.statut}</Text>
          </View>

          {/* --- BOUTON VALIDER --- */}
          <TouchableOpacity style={styles.submitBtn} onPress={handleSave}>
            <LinearGradient 
              colors={['#2E7D32', '#1B5E20']} 
              style={styles.gradientBtn}
            >
              <MaterialCommunityIcons name="check-circle" size={24} color="white" />
              <Text style={styles.submitBtnText}>Ajouter le lot</Text>
            </LinearGradient>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Petit composant interne pour les labels stylisés
const InputLabel = ({ label, icon }: { label: string, icon: string }) => (
  <View style={styles.labelContainer}>
    <MaterialCommunityIcons name={icon as any} size={18} color="#2E7D32" style={{ marginRight: 8 }} />
    <Text style={styles.label}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1B5E20' },
  header: {
    height: 70,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
  },
  headerTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  iconButton: { padding: 5 },
  body: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  scrollContent: { padding: 25, paddingBottom: 50 },
  labelContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, marginTop: 15 },
  label: { fontSize: 14, fontWeight: 'bold', color: '#555' },
  input: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    color: '#333',
  },
  datePickerBtn: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  dateText: { fontSize: 14, color: '#333' },
  disabledInput: { backgroundColor: '#F0F0F0', color: '#888' },
  row: { flexDirection: 'row' },
  statusMock: {
    backgroundColor: '#E8F5E9',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2E7D32',
    borderStyle: 'dashed'
  },
  statusText: { color: '#2E7D32', fontWeight: 'bold' },
  submitBtn: { marginTop: 40, borderRadius: 15, overflow: 'hidden', elevation: 5 },
  gradientBtn: {
    flexDirection: 'row',
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: { color: 'white', fontSize: 18, fontWeight: 'bold', marginLeft: 10 }
});