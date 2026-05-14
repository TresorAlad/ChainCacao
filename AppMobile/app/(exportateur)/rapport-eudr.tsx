import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { eudrApi, getApiError } from '@/services/api';

export default function RapportEudrScreen() {
  const { lotId } = useLocalSearchParams<{ lotId?: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [report, setReport] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    if (!lotId) {
      setErr('Identifiant de lot manquant');
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const { data } = await eudrApi.report(String(lotId));
        setReport((data.report as Record<string, unknown>) ?? null);
      } catch (e) {
        setErr(getApiError(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [lotId]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ title: 'Rapport EUDR', headerShown: true }} />
      <ScrollView contentContainerStyle={styles.content}>
        {loading && <ActivityIndicator size="large" color="#1B5E20" />}
        {err && <Text style={styles.err}>{err}</Text>}
        {report && (
          <Text selectable style={styles.json}>
            {JSON.stringify(report, null, 2)}
          </Text>
        )}
        <Text style={styles.hint} onPress={() => router.back()}>
          Retour
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 16 },
  json: { fontSize: 12, fontFamily: 'monospace', color: '#222' },
  err: { color: '#C62828', marginBottom: 12 },
  hint: { marginTop: 24, color: '#1B5E20', fontWeight: 'bold' },
});
