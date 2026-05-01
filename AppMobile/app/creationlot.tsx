import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter, Redirect } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLots } from '@/hooks/use-storage';
import { useAuth } from '@/hooks/use-auth';
import { batchApi, isNetworkError, getApiError } from '@/services/api';

function generateLotReference(): string {
  const y = new Date().getFullYear();
  const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `LOT-${y}-${rand}`;
}

export default function CreationLotScreen() {
  const router = useRouter();
  const { saveLot, updateLot } = useLots();
  const { user, initialized, isAuthenticated } = useAuth();

  const initialRef = useMemo(() => generateLotReference(), []);

  const producerName = user?.nom || user?.name || '—';

  const [form, setForm] = useState({
    reference: initialRef,
    typeCacao: '',
    localisation: '',
    quantite: '',
    producteur: producerName,
    statut: 'En cours' as 'En cours' | 'Terminé' | 'Problème',
  });

  useEffect(() => {
    const name = user?.nom || user?.name;
    if (name) setForm((f) => ({ ...f, producteur: name }));
  }, [user?.nom, user?.name]);

  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const onDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (selectedDate) {
      if (selectedDate > new Date()) {
        Alert.alert('Date invalide', 'La date de récolte ne peut pas être dans le futur.');
        return;
      }
      setDate(selectedDate);
    }
  };

  const handleSave = async () => {
    if (!form.quantite.trim()) {
      Alert.alert('Champs manquants', 'Veuillez indiquer la quantité (kg).');
      return;
    }
    if (!form.localisation.trim()) {
      Alert.alert('Champs manquants', 'Veuillez indiquer la localisation / zone GPS.');
      return;
    }
    if (!form.typeCacao.trim()) {
      Alert.alert('Champs manquants', 'Veuillez indiquer la culture / type de cacao.');
      return;
    }
    const quantiteNum = parseFloat(form.quantite);
    if (isNaN(quantiteNum) || quantiteNum <= 0) {
      Alert.alert('Quantité invalide', 'Veuillez entrer une quantité valide en kg.');
      return;
    }

    setSaving(true);

    // Date format JJ/MM/AAAA pour affichage et AAAA-MM-JJ pour l'API
    const dd = date.getDate().toString().padStart(2, '0');
    const mm = (date.getMonth() + 1).toString().padStart(2, '0');
    const yyyy = date.getFullYear();
    const dateDisplay = `${dd}/${mm}/${yyyy}`;
    const dateISO = `${yyyy}-${mm}-${dd}`;

    const localId = `${form.reference.toUpperCase().replace(/\s/g, '-')}-${Date.now()}`;

    // 1. Sauvegarder localement en premier (garantie hors-ligne)
    await saveLot({
      id: localId,
      title: form.reference.trim(),
      status: form.statut,
      date: dateDisplay,
      poids: form.quantite.trim(),
      destination: form.localisation.trim() || 'Non définie',
      typeCacao: form.typeCacao.trim(),
      acheteur: 'En attente',
      synced: false,
    });

    // 2. Tenter l'envoi immédiat vers l'API
    try {
      const { data } = await batchApi.create({
        culture: form.typeCacao.trim(),
        quantite: quantiteNum,
        lieu: form.localisation.trim(),
        date_recolte: dateISO,
        notes: form.reference.trim(),
      });

      const serverId = data.batch?.id ?? localId;

      // Mettre à jour le même lot (évite un doublon : avant localId, après id serveur)
      await updateLot(localId, { id: serverId, synced: true });

      setSaving(false);
      Alert.alert(
        'Lot créé ✓',
        `Lot "${form.reference}" enregistré sur la blockchain.\nID: ${serverId}`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (e) {
      setSaving(false);

      if (isNetworkError(e)) {
        // Mode hors-ligne : lot sauvegardé localement, sera sync plus tard
        Alert.alert(
          'Enregistré hors-ligne',
          `Le lot "${form.reference}" a été sauvegardé localement.\nIl sera synchronisé sur la blockchain dès que la connexion sera rétablie.`,
          [{ text: 'OK', onPress: () => router.back() }]
        );
      } else {
        // Erreur API (lot déjà existe, données invalides, etc.)
        Alert.alert('Erreur API', getApiError(e));
      }
    }
  };

  if (!initialized) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.authGate}>
          <ActivityIndicator size="large" color="#2E7D32" />
        </View>
      </SafeAreaView>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      <LinearGradient colors={['#1B5E20', '#2E7D32', '#43A047']} style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={30} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ajouter un lot</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView style={styles.body} contentContainerStyle={styles.scrollContent}>

          <InputLabel label="Référence du Lot" icon="barcode-scan" required />
          <TextInput
            style={[styles.input, styles.disabledInput]}
            placeholder="Générée automatiquement"
            value={form.reference}
            editable={false}
          />

          <InputLabel label="Culture / Type de Cacao" icon="clover" required />
          <TextInput
            style={styles.input}
            placeholder="Ex: Forastero, Criollo, Trinitario..."
            value={form.typeCacao}
            onChangeText={(t) => setForm({ ...form, typeCacao: t })}
          />

          <InputLabel label="Localisation / Zone GPS" icon="map-marker" required />
          <TextInput
            style={styles.input}
            placeholder="Ex: Zone Sud - Kpalimé, ou coordonnées GPS"
            value={form.localisation}
            onChangeText={(t) => setForm({ ...form, localisation: t })}
          />

          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <InputLabel label="Quantité (kg)" icon="weight-kilogram" required />
              <TextInput
                style={styles.input}
                placeholder="Ex: 500"
                keyboardType="numeric"
                value={form.quantite}
                onChangeText={(t) => setForm({ ...form, quantite: t })}
              />
            </View>
            <View style={{ flex: 1 }}>
              <InputLabel label="Date Récolte" icon="calendar" required />
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
          <View style={styles.statusRow}>
            {(['En cours', 'Terminé', 'Problème'] as const).map(s => (
              <TouchableOpacity
                key={s}
                style={[styles.statusBtn, form.statut === s && styles.statusBtnActive]}
                onPress={() => setForm({ ...form, statut: s })}
              >
                <Text style={[styles.statusBtnText, form.statut === s && styles.statusBtnTextActive]}>
                  {s}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, saving && { opacity: 0.7 }]}
            onPress={handleSave}
            disabled={saving}
          >
            <LinearGradient colors={['#2E7D32', '#1B5E20']} style={styles.gradientBtn}>
              <MaterialCommunityIcons name="check-circle" size={24} color="white" />
              <Text style={styles.submitBtnText}>
                {saving ? 'Enregistrement...' : 'Ajouter le lot'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const InputLabel = ({ label, icon, required }: { label: string; icon: string; required?: boolean }) => (
  <View style={styles.labelContainer}>
    <MaterialCommunityIcons name={icon as any} size={18} color="#2E7D32" style={{ marginRight: 8 }} />
    <Text style={styles.label}>{label}</Text>
    {required && <Text style={{ color: '#C62828', marginLeft: 3 }}>*</Text>}
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
  authGate: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FA' },
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
  statusRow: { flexDirection: 'row', gap: 10 },
  statusBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#EEE',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  statusBtnActive: { backgroundColor: '#E8F5E9', borderColor: '#2E7D32' },
  statusBtnText: { fontSize: 13, fontWeight: 'bold', color: '#666' },
  statusBtnTextActive: { color: '#2E7D32' },
  submitBtn: { marginTop: 35, borderRadius: 15, overflow: 'hidden', elevation: 5 },
  gradientBtn: {
    flexDirection: 'row',
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  submitBtnText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
});
