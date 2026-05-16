import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  batchApi,
  lotActionApi,
  lotPaymentApi,
  getApiError,
  type PaymentPreviewSummary,
} from '@/services/api';
import { isEnTransit } from '@/utils/lot-status';

function fmt(n: number) {
  return Math.round(n).toLocaleString('fr-FR');
}

export default function PaiementCooperativeScreen() {
  const { lotId: lotIdParam } = useLocalSearchParams<{ lotId?: string }>();
  const router = useRouter();
  const [lotId, setLotId] = useState(String(lotIdParam ?? '').trim());
  const [pin, setPin] = useState('');
  const [prixParKg, setPrixParKg] = useState('');
  const [preview, setPreview] = useState<PaymentPreviewSummary | null>(null);
  const [qty, setQty] = useState(0);
  const [statut, setStatut] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loadingLot, setLoadingLot] = useState(false);

  const loadLot = async (id?: string) => {
    const trimmed = (id ?? lotId).trim();
    if (!trimmed) {
      Alert.alert('Lot requis', 'Saisissez l’identifiant du lot (ex. TC-…).');
      return;
    }
    setLoadingLot(true);
    setPreview(null);
    try {
      const { data } = await batchApi.get(trimmed);
      const lot = data.lot;
      if (!lot) {
        Alert.alert('Erreur', 'Lot introuvable');
        return;
      }
      setLotId(trimmed);
      setQty(Number(lot.quantite ?? 0));
      setStatut(String(lot.statut ?? ''));
      if (isEnTransit(lot.statut)) {
        Alert.alert(
          'Réception requise',
          'Confirmez d’abord la réception physique du lot avant de payer l’agriculteur.',
          [
            { text: 'Annuler', style: 'cancel' },
            {
              text: 'Réceptionner',
              onPress: () =>
                router.push({
                  pathname: '/confirmer-reception-lot',
                  params: { lotId: trimmed },
                } as any),
            },
          ]
        );
      }
    } catch (e) {
      Alert.alert('Erreur', getApiError(e));
    } finally {
      setLoadingLot(false);
    }
  };

  useEffect(() => {
    if (lotIdParam) void loadLot(String(lotIdParam));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lotIdParam]);

  useEffect(() => {
    if (!lotId.trim()) return;
    const prix = parseFloat(prixParKg);
    if (!prix || prix <= 0) {
      setPreview(null);
      return;
    }
    const t = setTimeout(async () => {
      setLoadingPreview(true);
      try {
        const { data } = await lotPaymentApi.preview(lotId.trim(), prix);
        setPreview(data);
      } catch {
        setPreview(null);
      } finally {
        setLoadingPreview(false);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [lotId, prixParKg]);

  const submit = async () => {
    const id = lotId.trim();
    if (!id) {
      Alert.alert('Erreur', 'Identifiant de lot requis');
      return;
    }
    if (isEnTransit(statut)) {
      Alert.alert('Réception requise', 'Confirmez la réception avant le paiement.');
      return;
    }
    if (!pin.trim() || pin.length !== 4) {
      Alert.alert('PIN requis', 'Saisissez votre code PIN à 4 chiffres.');
      return;
    }
    const prix = parseFloat(prixParKg);
    if (!prix || prix <= 0) {
      Alert.alert('Prix requis', 'Saisissez un prix par kg valide.');
      return;
    }
    setLoading(true);
    try {
      await lotPaymentApi.setPrix(id, prix);
      const { data } = await lotActionApi.confirmer(id, { pin: pin.trim() });
      const net = data.montant_net ?? preview?.montant_net;
      Alert.alert(
        'Paiement enregistré',
        net != null
          ? `L’agriculteur recevra ${fmt(net)} FCFA (net après marge).`
          : 'Le lot a été payé sur la blockchain.',
        [{ text: 'OK', onPress: () => router.replace('/(cooperative)/lot' as any) }]
      );
    } catch (e) {
      Alert.alert('Erreur', getApiError(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ title: 'Payer l’agriculteur', headerShown: true }} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.intro}>
          <MaterialCommunityIcons name="cash-multiple" size={28} color="#1B5E20" />
          <Text style={styles.introText}>
            Paiement direct du producteur après réception du lot. Le montant net est crédité sur le portefeuille de
            l’agriculteur.
          </Text>
        </View>

        <Text style={styles.label}>Identifiant du lot</Text>
        <View style={styles.row}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            value={lotId}
            onChangeText={setLotId}
            placeholder="TC-…"
            autoCapitalize="characters"
          />
          <TouchableOpacity style={styles.loadBtn} onPress={() => void loadLot()} disabled={loadingLot}>
            {loadingLot ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text style={styles.loadBtnText}>Charger</Text>
            )}
          </TouchableOpacity>
        </View>

        {qty > 0 ? <Text style={styles.hint}>{qty} kg — statut : {statut || '—'}</Text> : null}

        <Text style={styles.label}>Prix par kg (FCFA)</Text>
        <TextInput
          style={styles.input}
          value={prixParKg}
          onChangeText={setPrixParKg}
          keyboardType="numeric"
          placeholder="Ex: 1200"
        />

        {loadingPreview && <ActivityIndicator style={{ marginTop: 12 }} color="#1B5E20" />}

        {preview && !loadingPreview && (
          <View style={styles.card}>
            <Text style={styles.rowLine}>Prix brut : {fmt(preview.montant_brut ?? 0)} FCFA</Text>
            <Text style={styles.rowLine}>
              Marge coop. ({preview.marge_pct ?? 0} %) : −{fmt(preview.marge_fcfa ?? 0)} FCFA
            </Text>
            <Text style={styles.net}>Net agriculteur : {fmt(preview.montant_net ?? 0)} FCFA</Text>
            <Text style={styles.debit}>
              Débité de votre portefeuille : {fmt(preview.montant_total_debite ?? preview.montant_brut ?? 0)} FCFA
            </Text>
          </View>
        )}

        <Text style={styles.label}>Code PIN (4 chiffres)</Text>
        <TextInput
          style={styles.input}
          value={pin}
          onChangeText={(t) => setPin(t.replace(/\D/g, '').slice(0, 4))}
          secureTextEntry
          keyboardType="number-pad"
          maxLength={4}
          placeholder="••••"
        />

        <TouchableOpacity
          style={[styles.btn, (!preview || loading) && styles.btnDisabled]}
          onPress={submit}
          disabled={loading || !preview}
        >
          {loading ? <ActivityIndicator color="white" /> : <Text style={styles.btnText}>Confirmer le paiement</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  content: { padding: 20, paddingBottom: 40 },
  intro: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#E8F5E9',
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  introText: { flex: 1, fontSize: 13, color: '#2E7D32', lineHeight: 20 },
  label: { fontSize: 12, color: '#666', fontWeight: '600', marginTop: 12 },
  row: { flexDirection: 'row', gap: 8, marginTop: 6 },
  input: {
    marginTop: 6,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  loadBtn: {
    marginTop: 6,
    backgroundColor: '#2E7D32',
    borderRadius: 10,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadBtnText: { color: 'white', fontWeight: '700', fontSize: 13 },
  hint: { fontSize: 13, color: '#888', marginTop: 8 },
  card: {
    marginTop: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  rowLine: { fontSize: 14, color: '#444', marginBottom: 6 },
  net: { fontSize: 16, fontWeight: '800', color: '#1B5E20', marginTop: 8 },
  debit: { fontSize: 12, color: '#888', marginTop: 8 },
  btn: {
    marginTop: 24,
    backgroundColor: '#1B5E20',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
});
