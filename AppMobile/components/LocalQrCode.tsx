import React from 'react';
import { View, StyleSheet } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { getApiBaseUrl } from '@/services/api';

type Props = {
  lotId: string;
  size?: number;
};

/** QR offline : pointe vers l’URL de vérification (fonctionne après sync quand l’ID serveur est connu). */
export function buildVerifyUrlForLot(lotId: string): string {
  try {
    const base = getApiBaseUrl().replace(/\/$/, '');
    return `${base}/api/v1/verify/${encodeURIComponent(lotId)}`;
  } catch {
    return `chaincacao://verify/${encodeURIComponent(lotId)}`;
  }
}

export function LocalQrCode({ lotId, size = 220 }: Props) {
  const value = buildVerifyUrlForLot(lotId);
  return (
    <View style={styles.wrap}>
      <QRCode value={value} size={size} backgroundColor="white" color="#1B5E20" />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    padding: 12,
    backgroundColor: 'white',
    borderRadius: 12,
    alignItems: 'center',
  },
});
