import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, Image } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { qrcodeApi, getApiError } from '@/services/api';
import { LocalQrCode, buildVerifyUrlForLot } from '@/components/LocalQrCode';

export default function QrLotScreen() {
  const { lotId } = useLocalSearchParams<{ lotId?: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [uri, setUri] = useState<string | null>(null);
  const [verifyUrl, setVerifyUrl] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!lotId) {
      setLoading(false);
      return;
    }
    const id = String(lotId);
    (async () => {
      try {
        const { data } = await qrcodeApi.getJson(id);
        if (data.qrcode_png_base64) {
          setUri(`data:image/png;base64,${data.qrcode_png_base64}`);
        }
        setVerifyUrl(data.verify_url ?? buildVerifyUrlForLot(id));
        setLoadError(null);
      } catch (e) {
        setLoadError(getApiError(e));
        setVerifyUrl(buildVerifyUrlForLot(id));
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
        {!loading && loadError ? (
          <>
            <Text style={styles.errText}>{loadError}</Text>
            <Text style={styles.hintSmall}>QR généré localement (même lien que le serveur) :</Text>
            <LocalQrCode lotId={String(lotId)} />
          </>
        ) : null}
        {!loading && !loadError && uri && (
          <>
            <Text style={styles.syncedHint}>QR — lot enregistré</Text>
            <Image source={{ uri }} style={styles.img} resizeMode="contain" />
          </>
        )}
        {!loading && !loadError && !uri ? (
          <>
            <Text style={styles.syncedHint}>QR généré localement</Text>
            <LocalQrCode lotId={String(lotId)} />
          </>
        ) : null}
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
  errText: { fontSize: 13, color: '#C62828', marginBottom: 12, textAlign: 'center' },
  hintSmall: { fontSize: 12, color: '#666', marginBottom: 8 },
  syncedHint: { fontSize: 12, color: '#2E7D32', marginBottom: 8 },
  img: { width: 260, height: 260, marginVertical: 16 },
  url: { fontSize: 11, color: '#555', marginTop: 12, textAlign: 'center' },
  hint: { marginTop: 24, color: '#1B5E20', fontWeight: '600' },
});
