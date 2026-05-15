import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { lotPaymentApi, getApiError, type LotPaiementStatus } from '@/services/api';

function firstParam(v: string | string[] | undefined): string {
  if (v === undefined || v === null) return '';
  return Array.isArray(v) ? String(v[0] ?? '').trim() : String(v).trim();
}

export default function PaiementLotAgriculteurScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const lotId = firstParam(params.lotId as string | string[] | undefined);

  const [loading, setLoading] = useState(true);
  const [paiement, setPaiement] = useState<LotPaiementStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!lotId) {
      setLoading(false);
      setError('Identifiant de lot manquant');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data } = await lotPaymentApi.getPaiement(lotId);
      setPaiement(data.paiement ?? null);
    } catch (e) {
      setError(getApiError(e));
      setPaiement(null);
    } finally {
      setLoading(false);
    }
  }, [lotId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const statusLabel =
    paiement?.status === 'paye'
      ? 'Payé'
      : paiement?.status === 'echec'
        ? 'Échec'
        : 'En attente';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={28} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Paiement du lot</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.body} contentContainerStyle={{ padding: 20 }}>
        <Text style={styles.lotId}>{lotId || '—'}</Text>
        {loading ? (
          <ActivityIndicator size="large" color="#2E7D32" style={{ marginTop: 24 }} />
        ) : error ? (
          <Text style={styles.err}>{error}</Text>
        ) : (
          <View style={styles.card}>
            <Text style={styles.label}>Statut paiement</Text>
            <Text style={styles.value}>{statusLabel}</Text>
            {paiement?.montant_net != null ? (
              <>
                <Text style={[styles.label, { marginTop: 16 }]}>Montant net reçu (FCFA)</Text>
                <Text style={styles.amount}>{Math.round(paiement.montant_net).toLocaleString('fr-FR')}</Text>
              </>
            ) : null}
            {paiement?.marge_pct != null ? (
              <>
                <Text style={[styles.label, { marginTop: 12 }]}>Marge coopérative</Text>
                <Text style={styles.value}>
                  {paiement.marge_pct}% ({Math.round(paiement.marge_fcfa ?? 0).toLocaleString('fr-FR')} FCFA)
                </Text>
              </>
            ) : null}
            {paiement?.tx_hash ? (
              <>
                <Text style={[styles.label, { marginTop: 12 }]}>Référence blockchain</Text>
                <Text style={styles.hash} numberOfLines={2}>
                  {paiement.tx_hash}
                </Text>
              </>
            ) : null}
            <Text style={styles.hint}>
              Le détail brut / marge / net est calculé par la coopérative et l’acheteur lors du paiement (CDC §17).
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1B5E20' },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  headerTitle: { color: 'white', fontSize: 18, fontWeight: '700' },
  body: { flex: 1, backgroundColor: '#F5F5F5', borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  lotId: { fontSize: 13, color: '#666', fontFamily: 'monospace' },
  err: { color: '#C62828', marginTop: 16 },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    elevation: 2,
  },
  label: { fontSize: 12, color: '#888', textTransform: 'uppercase', fontWeight: '700' },
  value: { fontSize: 18, color: '#333', marginTop: 4, fontWeight: '600' },
  amount: { fontSize: 28, color: '#2E7D32', fontWeight: '800', marginTop: 4 },
  hash: { fontSize: 11, color: '#555', marginTop: 4 },
  hint: { fontSize: 12, color: '#888', marginTop: 20, lineHeight: 18 },
});
