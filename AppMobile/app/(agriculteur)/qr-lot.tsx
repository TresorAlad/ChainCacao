import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, Image } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { qrcodeApi, getApiError } from '@/services/api';

export default function QrLotScreen() {
  const { lotId } = useLocalSearchParams<{ lotId?: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [uri, setUri] = useState<string | null>(null);
  const [verifyUrl, setVerifyUrl] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!lotId) {
      setErr('Identifiant de lot manquant');
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const { data } = await qrcodeApi.getJson(String(lotId));
        if (data.qrcode_png_base64) {
          setUri(`data:image/png;base64,${data.qrcode_png_base64}`);
        }
        setVerifyUrl(data.verify_url ?? null);
      } catch (e) {
        setErr(getApiError(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [lotId]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ title: 'QR Lot', headerShown: true }} />
      <ScrollView contentContainerStyle={styles.content}>
        {loading && <ActivityIndicator size="large" color="#1B5E20" />}
        {err && <Text style={styles.err}>{err}</Text>}
        {uri && <Image source={{ uri }} style={styles.img} resizeMode="contain" />}
        {verifyUrl && (
          <Text selectable style={styles.url}>
            {verifyUrl}
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
  content: { padding: 20, alignItems: 'center' },
  img: { width: 260, height: 260, marginVertical: 16 },
  url: { fontSize: 11, color: '#555', marginTop: 12, textAlign: 'center' },
  err: { color: '#C62828', marginTop: 12 },
  hint: { marginTop: 24, color: '#1B5E20', fontWeight: 'bold' },
});
