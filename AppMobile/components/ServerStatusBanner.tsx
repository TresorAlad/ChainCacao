import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { API_BASE, healthApi, isNetworkError } from '@/services/api';

type Status = 'checking' | 'ok' | 'fail';

/** Indique si le serveur API répond — distinct du « mode hors-ligne » (désactivé dans l’app). */
export function ServerStatusBanner() {
  const [status, setStatus] = useState<Status>('checking');
  const [detail, setDetail] = useState<string | null>(null);

  const probe = useCallback(async () => {
    setStatus('checking');
    setDetail(null);
    try {
      await healthApi.check();
      setStatus('ok');
    } catch (e) {
      setStatus('fail');
      if (isNetworkError(e)) {
        setDetail(
          `Le serveur (${API_BASE}) ne répond pas. Ce n’est pas le « mode hors-ligne » de l’app (désactivé) : vérifiez /health dans le navigateur. Les notifications push peuvent encore arriver.`
        );
      } else {
        setDetail('Le serveur a répondu avec une erreur. Réessayez dans quelques instants.');
      }
    }
  }, []);

  useEffect(() => {
    void probe();
  }, [probe]);

  if (status === 'checking') {
    return (
      <View style={[styles.box, styles.boxNeutral]}>
        <ActivityIndicator size="small" color="#1565C0" />
        <Text style={styles.textNeutral}>Vérification du serveur ChainCacao…</Text>
      </View>
    );
  }

  if (status === 'ok') {
    return (
      <View style={[styles.box, styles.boxOk]}>
        <MaterialCommunityIcons name="cloud-check" size={18} color="#2E7D32" />
        <Text style={styles.textOk}>Serveur accessible — vous pouvez vous connecter.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.box, styles.boxFail]}>
      <MaterialCommunityIcons name="cloud-alert" size={18} color="#C62828" />
      <View style={styles.failBody}>
        <Text style={styles.textFail}>Serveur injoignable</Text>
        {detail ? <Text style={styles.detail}>{detail}</Text> : null}
        <TouchableOpacity onPress={() => void probe()} style={styles.retryBtn}>
          <Text style={styles.retryText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  boxNeutral: { backgroundColor: '#E3F2FD' },
  boxOk: { backgroundColor: '#E8F5E9' },
  boxFail: { backgroundColor: '#FFEBEE' },
  textNeutral: { flex: 1, fontSize: 12, color: '#1565C0' },
  textOk: { flex: 1, fontSize: 12, color: '#2E7D32', fontWeight: '600' },
  textFail: { fontSize: 13, fontWeight: '700', color: '#C62828' },
  failBody: { flex: 1 },
  detail: { fontSize: 11, color: '#5D4037', marginTop: 6, lineHeight: 16 },
  retryBtn: { marginTop: 8, alignSelf: 'flex-start' },
  retryText: { fontSize: 12, fontWeight: '700', color: '#1565C0' },
});
