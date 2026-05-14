import React, { useState } from 'react';
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
import { lotActionApi, getApiError } from '@/services/api';

export default function PaiementExportateurScreen() {
  const { lotId } = useLocalSearchParams<{ lotId?: string }>();
  const router = useRouter();
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!lotId) {
      Alert.alert('Erreur', 'lotId manquant');
      return;
    }
    if (!pin.trim()) {
      Alert.alert('PIN requis', 'Saisissez votre code PIN.');
      return;
    }
    setLoading(true);
    try {
      await lotActionApi.confirmer(String(lotId), { pin: pin.trim() });
      Alert.alert('Succès', 'Lot confirmé.', [{ text: 'OK', onPress: () => router.back() }]);
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
        <Text style={styles.label}>Code PIN</Text>
        <TextInput
          style={styles.input}
          value={pin}
          onChangeText={setPin}
          secureTextEntry
          keyboardType="number-pad"
          placeholder="••••"
        />
        <TouchableOpacity style={styles.btn} onPress={submit} disabled={loading}>
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
  lot: { fontSize: 16, color: '#111', marginTop: 4 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 14,
    marginTop: 8,
    backgroundColor: 'white',
  },
  btn: {
    marginTop: 24,
    backgroundColor: '#1B5E20',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
});
