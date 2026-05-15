import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { batchApi, lotActionApi, lotPaymentApi, getApiError, type PaymentPreviewSummary } from '@/services/api';

function fmt(n: number) {
  return Math.round(n).toLocaleString('fr-FR');
}

export default function PaiementExportateurScreen() {
  const { lotId } = useLocalSearchParams<{ lotId?: string }>();
  const router = useRouter();
  const [pin, setPin] = useState('');
  const [prixParKg, setPrixParKg] = useState('');
  const [preview, setPreview] = useState<PaymentPreviewSummary | null>(null);
  const [qty, setQty] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);

  useEffect(() => {
    if (!lotId) return;
    batchApi
      .get(String(lotId))
      .then((r) => {
        const lot = r.data.lot;
        setQty(Number(lot?.quantite ?? 0));
      })
      .catch(() => setQty(0));
  }, [lotId]);

  useEffect(() => {
    if (!lotId) return;
    const prix = parseFloat(prixParKg);
    if (!prix || prix <= 0) {
      setPreview(null);
      return;
    }
    const t = setTimeout(async () => {
      setLoadingPreview(true);
      try {
        const { data } = await lotPaymentApi.preview(String(lotId), prix);
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
    if (!lotId) {
      Alert.alert('Erreur', 'lotId manquant');
      return;
    }
    if (!pin.trim()) {
      Alert.alert('PIN requis', 'Saisissez votre code PIN.');
      return;
    }
    const prix = parseFloat(prixParKg);
    if (!prix || prix <= 0) {
      Alert.alert('Prix requis', 'Saisissez un prix par kg valide.');
      return;
    }
    setLoading(true);
    try {
      await lotPaymentApi.setPrix(String(lotId), prix);
      const { data } = await lotActionApi.confirmer(String(lotId), { pin: pin.trim() });
      const net = data.montant_net ?? preview?.montant_net;
      Alert.alert(
        'Succès',
        net != null
          ? `Paiement enregistré. Net producteur : ${fmt(net)} FCFA`
          : 'Lot confirmé.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (e) {
      Alert.alert('Erreur', getApiError(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ title: 'Confirmer le lot', headerShown: true }} />
      <View style={styles.content}>
        <Text style={styles.label}>Lot</Text>
        <Text style={styles.lot}>{lotId ?? '—'}</Text>
        {qty > 0 && <Text style={styles.hint}>{qty} kg</Text>}

        <Text style={styles.label}>Prix par kg (FCFA)</Text>
        <TextInput
          style={styles.input}
          value={prixParKg}
          onChangeText={setPrixParKg}
          keyboardType="numeric"
          placeholder="1200"
        />

        {loadingPreview && <ActivityIndicator style={{ marginTop: 12 }} color="#1B5E20" />}

        {preview && !loadingPreview && (
          <View style={styles.card}>
            <Text style={styles.row}>Prix brut : {fmt(preview.montant_brut ?? 0)} FCFA</Text>
            <Text style={styles.row}>
              Marge coop. ({preview.marge_pct ?? 0} %) : −{fmt(preview.marge_fcfa ?? 0)} FCFA
            </Text>
            <Text style={styles.net}>Net producteur : {fmt(preview.montant_net ?? 0)} FCFA</Text>
          </View>
        )}

        <Text style={styles.label}>Code PIN</Text>
        <TextInput
          style={styles.input}
          value={pin}
          onChangeText={setPin}
          secureTextEntry
          keyboardType="number-pad"
          maxLength={4}
          placeholder="••••"
        />
        <TouchableOpacity
          style={styles.btn}
          onPress={submit}
          disabled={loading || !preview}
        >
          {loading ? <ActivityIndicator color="white" /> : <Text style={styles.btnText}>Confirmer</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  content: { padding: 20 },
  label: { fontSize: 12, color: '#666', fontWeight: '600', marginTop: 12 },
  lot: { fontSize: 16, color: '#111', marginTop: 4, fontWeight: 'bold' },
  hint: { fontSize: 13, color: '#888', marginTop: 4 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 14,
    marginTop: 8,
    backgroundColor: 'white',
  },
  card: {
    marginTop: 16,
    padding: 14,
    backgroundColor: '#E8F5E9',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  row: { fontSize: 14, color: '#333', marginTop: 4 },
  net: { fontSize: 15, fontWeight: 'bold', color: '#1B5E20', marginTop: 8 },
  btn: {
    marginTop: 24,
    backgroundColor: '#1B5E20',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
});
