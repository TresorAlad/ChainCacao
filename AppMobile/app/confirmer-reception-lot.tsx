import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { batchApi, getApiError, lotActionApi, type BatchResponse } from '@/services/api';
import { isEnTransit, mapStatut } from '@/utils/lot-status';

function firstParam(v: string | string[] | undefined): string {
  if (v === undefined || v === null) return '';
  return Array.isArray(v) ? String(v[0] ?? '').trim() : String(v).trim();
}

/** Confirmation de réception physique (destinataire) — partagé coopérative / exportateur / autres rôles. */
export default function ConfirmerReceptionLotScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const brandGreen = '#2E7D32';

  const lotId = firstParam(params.lotId as string | string[] | undefined);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [lot, setLot] = useState<BatchResponse | null>(null);
  const [pin, setPin] = useState('');
  const [poidsReception, setPoidsReception] = useState('');

  const loadLot = useCallback(async () => {
    if (!lotId) {
      setLoading(false);
      setLot(null);
      return;
    }
    setLoading(true);
    try {
      const { data } = await batchApi.get(lotId);
      const b = data.lot;
      if (!b?.id) {
        setLot(null);
        return;
      }
      setLot(b);
      if (b.quantite != null) setPoidsReception(String(b.quantite));
    } catch (e) {
      Alert.alert('Erreur', getApiError(e));
      setLot(null);
    } finally {
      setLoading(false);
    }
  }, [lotId]);

  useEffect(() => {
    void loadLot();
  }, [loadLot]);

  const onValider = async () => {
    if (!lotId) {
      Alert.alert('Lot manquant', 'Ouvrez cet écran depuis la liste des lots en transit.');
      return;
    }
    if (!pin.trim()) {
      Alert.alert('PIN requis', 'Saisissez votre code PIN pour confirmer la réception sur la chaîne.');
      return;
    }
    if (lot?.statut && !isEnTransit(lot.statut)) {
      Alert.alert(
        'Statut',
        `Ce lot n'est pas en attente de réception (statut : ${mapStatut(lot.statut).label}).`
      );
      return;
    }
    setSubmitting(true);
    try {
      await lotActionApi.confirmerReception(lotId, { pin: pin.trim() });
      Alert.alert('Réception confirmée', 'Le lot est enregistré comme reçu. L’historique du lot inclura cet événement.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e) {
      Alert.alert('Échec', getApiError(e));
    } finally {
      setSubmitting(false);
    }
  };

  if (!lotId) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialCommunityIcons name="arrow-left" size={28} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Réception lot</Text>
          <View style={{ width: 28 }} />
        </View>
        <View style={[styles.body, { padding: 24 }]}>
          <Text style={{ color: '#333', fontSize: 16 }}>Identifiant de lot manquant.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={28} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Confirmer la réception</Text>
        <View style={{ width: 28 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView style={styles.body} contentContainerStyle={styles.content}>
          {loading ? (
            <ActivityIndicator size="large" color={brandGreen} style={{ marginTop: 40 }} />
          ) : !lot ? (
            <Text style={{ color: '#666', marginTop: 24 }}>Lot introuvable.</Text>
          ) : (
            <>
              <View style={styles.infoSection}>
                <Text style={styles.sectionTitle}>Lot (propriétaire actuel : vous)</Text>
                <View style={styles.infoCard}>
                  <View style={styles.infoRow}>
                    <MaterialCommunityIcons name="identifier" size={20} color={brandGreen} />
                    <View style={styles.infoTextGroup}>
                      <Text style={styles.infoLabel}>Identifiant</Text>
                      <Text style={styles.infoValue}>{lot.id}</Text>
                    </View>
                  </View>
                  <View style={styles.infoRow}>
                    <MaterialCommunityIcons name="leaf" size={20} color={brandGreen} />
                    <View style={styles.infoTextGroup}>
                      <Text style={styles.infoLabel}>Culture</Text>
                      <Text style={styles.infoValue}>{lot.culture ?? '—'}</Text>
                    </View>
                  </View>
                  <View style={styles.infoRow}>
                    <MaterialCommunityIcons name="map-marker" size={20} color={brandGreen} />
                    <View style={styles.infoTextGroup}>
                      <Text style={styles.infoLabel}>Lieu</Text>
                      <Text style={styles.infoValue}>{lot.lieu ?? '—'}</Text>
                    </View>
                  </View>
                  <View style={styles.infoRow}>
                    <MaterialCommunityIcons name="information-outline" size={20} color={brandGreen} />
                    <View style={styles.infoTextGroup}>
                      <Text style={styles.infoLabel}>Statut</Text>
                      <Text style={styles.infoValue}>{mapStatut(lot.statut).label}</Text>
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.receptionSection}>
                <Text style={styles.sectionTitle}>Poids constaté à la réception (référence)</Text>
                <View style={styles.inputFrame}>
                  <MaterialCommunityIcons name="weight-kilogram" size={24} color={brandGreen} />
                  <TextInput
                    style={styles.poidsInput}
                    placeholder="Poids mesuré (kg)"
                    keyboardType="decimal-pad"
                    value={poidsReception}
                    onChangeText={setPoidsReception}
                    placeholderTextColor="#999"
                  />
                  <Text style={styles.unitText}>Kg</Text>
                </View>
                <Text style={styles.hint}>
                  La confirmation sur la chaîne enregistre la réception du lot (événement « réception » dans
                  l’historique). Le paiement au producteur reste une action distincte.
                </Text>
              </View>

              <View style={styles.receptionSection}>
                <Text style={styles.sectionTitle}>Code PIN</Text>
                <View style={styles.inputFrame}>
                  <MaterialCommunityIcons name="lock-outline" size={24} color={brandGreen} />
                  <TextInput
                    style={styles.poidsInput}
                    placeholder="PIN à 4 chiffres"
                    keyboardType="number-pad"
                    secureTextEntry
                    maxLength={8}
                    value={pin}
                    onChangeText={setPin}
                    placeholderTextColor="#999"
                  />
                </View>
              </View>

              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.btnAnnuler} onPress={() => router.back()}>
                  <Text style={styles.btnAnnulerText}>Annuler</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.btnValider, submitting && { opacity: 0.6 }]}
                  disabled={submitting}
                  onPress={() => void onValider()}
                >
                  {submitting ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.btnValiderText}>Confirmer sur la chaîne</Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1B5E20' },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  headerTitle: { color: 'white', fontSize: 18, fontFamily: 'Montserrat-Bold' },
  body: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  content: { padding: 20, paddingBottom: 40 },
  sectionTitle: { fontSize: 15, fontFamily: 'Montserrat-Bold', color: '#333', marginBottom: 10 },
  infoSection: { marginBottom: 25 },
  infoCard: { backgroundColor: 'white', borderRadius: 20, padding: 15, elevation: 2 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  infoTextGroup: { marginLeft: 15, flex: 1 },
  infoLabel: { fontSize: 11, color: '#888', fontFamily: 'Montserrat-Regular' },
  infoValue: { fontSize: 15, color: '#333', fontFamily: 'Montserrat-Bold' },
  receptionSection: { marginBottom: 24 },
  inputFrame: {
    backgroundColor: 'white',
    minHeight: 56,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    borderWidth: 2,
    borderColor: '#E8F5E9',
  },
  poidsInput: { flex: 1, marginLeft: 10, fontSize: 16, fontFamily: 'Montserrat-Bold', color: '#2E7D32' },
  unitText: { fontSize: 16, fontFamily: 'Montserrat-Bold', color: '#999' },
  hint: { marginTop: 8, fontSize: 12, color: '#666', lineHeight: 18 },
  actionRow: { flexDirection: 'row', gap: 15, marginTop: 10, marginBottom: 20 },
  btnAnnuler: {
    flex: 1,
    height: 55,
    backgroundColor: 'white',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DDD',
  },
  btnAnnulerText: { color: '#666', fontFamily: 'Montserrat-Bold', fontSize: 16 },
  btnValider: {
    flex: 1,
    height: 55,
    backgroundColor: '#2E7D32',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  btnValiderText: { color: 'white', fontFamily: 'Montserrat-Bold', fontSize: 15 },
});
