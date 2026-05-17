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
import {
  groupedListApi,
  portefeuilleApi,
  getApiError,
  type PaymentPreviewSummary,
} from '@/services/api';
import { normalizeGroupedListId } from '@/utils/lotQr';

function fmt(n: number) {
  return Math.round(n).toLocaleString('fr-FR');
}

export default function PaiementListeScreen() {
  const { listId: listIdParam } = useLocalSearchParams<{ listId?: string }>();
  const router = useRouter();
  const [listId, setListId] = useState(normalizeGroupedListId(String(listIdParam ?? '')));
  const [prixParKg, setPrixParKg] = useState('');
  const [pin, setPin] = useState('');
  const [preview, setPreview] = useState<(PaymentPreviewSummary & { list_id?: string }) | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    portefeuilleApi
      .solde()
      .then((r) => setBalance(r.data.balance ?? 0))
      .catch(() => setBalance(null));
  }, []);

  const runPreview = async () => {
    const id = normalizeGroupedListId(listId);
    if (id !== listId.trim()) setListId(id);
    const prix = parseFloat(prixParKg);
    if (!id) {
      Alert.alert('Erreur', 'Identifiant de liste requis');
      return;
    }
    if (!prix || prix <= 0) {
      Alert.alert('Erreur', 'Prix par kg invalide');
      return;
    }
    setLoadingPreview(true);
    setPreview(null);
    try {
      const { data } = await groupedListApi.preview(id, prix);
      setPreview({ ...data, list_id: data.list_id ?? id });
    } catch (e) {
      const msg = getApiError(e);
      const hint =
        msg.toLowerCase().includes('liste introuvable')
          ? '\n\nVérifiez l’identifiant exact affiché lors de la création (LIST-…). Si la liste vient d’être créée, demandez à la coopérative de la régénérer ou copier l’ID depuis l’écran « Liste créée ».'
          : '';
      Alert.alert('Prévisualisation', msg + hint);
    } finally {
      setLoadingPreview(false);
    }
  };

  const submit = async () => {
    if (!preview?.list_id) return;
    if (!pin.trim()) {
      Alert.alert('PIN requis', 'Saisissez votre code PIN.');
      return;
    }
    setSubmitting(true);
    try {
      await groupedListApi.pay(preview.list_id, {
        pin: pin.trim(),
        prix_par_kg: preview.prix_par_kg ?? parseFloat(prixParKg),
      });
      const { data } = await portefeuilleApi.solde();
      setBalance(data.balance ?? balance);
      Alert.alert('Succès', 'Paiement de la liste effectué.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e) {
      const msg = getApiError(e);
      const isFabric =
        /endorse|fabric|rpc error|chaincode/i.test(msg);
      try {
        const { data } = await portefeuilleApi.solde();
        setBalance(data.balance ?? null);
      } catch {
        /* ignore */
      }
      Alert.alert(
        isFabric ? 'Erreur blockchain' : 'Erreur',
        isFabric
          ? `${msg}\n\nLa prévisualisation ne débite pas le portefeuille, mais un échec à l’enregistrement sur la chaîne peut avoir débité votre solde. Vérifiez le solde affiché ci-dessous avant de réessayer. Contactez l’administrateur si le montant a été prélevé sans confirmation.`
          : msg
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ title: 'Payer liste groupée', headerShown: true }} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.label}>Identifiant liste (LIST-…)</Text>
        <TextInput
          style={styles.input}
          value={listId}
          onChangeText={setListId}
          autoCapitalize="characters"
          placeholderTextColor="#9E9E9E"
        />

        <Text style={styles.label}>Prix par kg (FCFA)</Text>
        <TextInput
          style={styles.input}
          value={prixParKg}
          onChangeText={setPrixParKg}
          keyboardType="numeric"
          placeholder="1200"
          placeholderTextColor="#9E9E9E"
        />

        <TouchableOpacity style={styles.btnSecondary} onPress={runPreview} disabled={loadingPreview}>
          {loadingPreview ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.btnText}>Prévisualiser</Text>
          )}
        </TouchableOpacity>

        {balance !== null && (
          <Text style={styles.hint}>Solde : {fmt(balance)} FCFA</Text>
        )}

        {preview && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{preview.list_id}</Text>
            <Text style={styles.row}>
              {preview.nb_agriculteurs ?? 0} agriculteur(s) · {preview.poids_total_kg ?? 0} kg
            </Text>
            <Text style={styles.row}>Marge coop. : {preview.marge_pct ?? 0} %</Text>
            <Text style={styles.row}>Marge : {fmt(preview.marge_fcfa ?? 0)} FCFA</Text>
            <Text style={styles.total}>Total à débiter : {fmt(preview.montant_total_debite ?? 0)} FCFA</Text>
            <Text style={styles.hint}>
              Net producteurs : {fmt(preview.montant_net_agriculteurs ?? 0)} FCFA
            </Text>

            <Text style={styles.label}>Code PIN (4 chiffres)</Text>
            <TextInput
              style={styles.pinInput}
              value={pin}
              onChangeText={(t) => setPin(t.replace(/\D/g, '').slice(0, 4))}
              secureTextEntry
              keyboardType="number-pad"
              maxLength={4}
              placeholder="••••"
              placeholderTextColor="#9E9E9E"
              autoComplete="off"
              textContentType="password"
            />
            <Text style={styles.pinHint} accessibilityLabel={`${pin.length} chiffres saisis`}>
              {pin.length > 0 ? '•'.repeat(pin.length).padEnd(4, '○') : '○○○○'}
            </Text>

            <TouchableOpacity
              style={styles.btn}
              onPress={submit}
              disabled={submitting || (balance !== null && balance < (preview.montant_total_debite ?? 0))}
            >
              {submitting ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.btnText}>Payer la liste</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  content: { padding: 20, paddingBottom: 40 },
  label: { fontSize: 12, color: '#666', fontWeight: '600', marginTop: 12 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 14,
    marginTop: 8,
    backgroundColor: '#FFFFFF',
    color: '#1B5E20',
    fontSize: 16,
  },
  pinInput: {
    borderWidth: 2,
    borderColor: '#2E7D32',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    backgroundColor: '#FFFFFF',
    color: '#1B5E20',
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 12,
    textAlign: 'center',
  },
  pinHint: {
    marginTop: 8,
    fontSize: 20,
    letterSpacing: 6,
    textAlign: 'center',
    color: '#2E7D32',
    fontWeight: '600',
  },
  btnSecondary: {
    marginTop: 16,
    backgroundColor: '#33691E',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  btn: {
    marginTop: 16,
    backgroundColor: '#1B5E20',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  hint: { fontSize: 13, color: '#666', marginTop: 10 },
  card: {
    marginTop: 20,
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  cardTitle: { fontFamily: 'monospace', fontWeight: 'bold', fontSize: 14, color: '#1B5E20' },
  row: { fontSize: 14, color: '#333', marginTop: 6 },
  total: { fontSize: 16, fontWeight: 'bold', color: '#1B5E20', marginTop: 10 },
});
