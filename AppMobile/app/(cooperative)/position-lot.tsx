import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { lotApi, getApiError } from '@/services/api';

export default function PositionLotScreen() {
  const { lotId } = useLocalSearchParams<{ lotId?: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [pos, setPos] = useState<Record<string, string | undefined> | null>(null);

  useEffect(() => {
    if (!lotId) {
      setErr('Identifiant de lot manquant');
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const { data } = await lotApi.position(String(lotId));
        const p = data.position as Record<string, string | undefined> | undefined;
        setPos(p ?? null);
      } catch (e) {
        setErr(getApiError(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [lotId]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ title: 'Position du lot', headerShown: true }} />
      <ScrollView contentContainerStyle={styles.content}>
        {loading && <ActivityIndicator size="large" color="#1B5E20" />}
        {err && <Text style={styles.err}>{err}</Text>}
        {pos && (
          <View style={styles.card}>
            <Row label="Statut" value={pos.statut} />
            <Row label="Propriétaire" value={pos.proprietaire_nom ?? pos.proprietaire_id} />
            <Row label="Organisation" value={pos.org_id} />
          </View>
        )}
        <Text style={styles.hint} onPress={() => router.back()}>
          Retour
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value ?? '—'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  content: { padding: 20 },
  card: { backgroundColor: 'white', borderRadius: 12, padding: 16, elevation: 2 },
  row: { marginBottom: 12 },
  label: { fontSize: 12, color: '#666', fontWeight: '600' },
  value: { fontSize: 16, color: '#111', marginTop: 4 },
  err: { color: '#C62828', marginBottom: 12 },
  hint: { marginTop: 24, color: '#1B5E20', fontWeight: 'bold' },
});
