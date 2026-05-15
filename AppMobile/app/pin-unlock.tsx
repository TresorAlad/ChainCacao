import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/use-auth';
import { homePathForActor } from '@/lib/home-path';
import { FORM_PLACEHOLDER_COLOR, FORM_TEXT_COLOR, formInputStyle, formLabelStyle } from '@/constants/form-styles';

const brandGreen = '#228B22';

export default function PinUnlockScreen() {
  const router = useRouter();
  const { user, unlockWithPin, logout, pinUnlockLoading, pinUnlockError } = useAuth();
  const [pin, setPin] = useState('');

  const submit = async () => {
    if (pin.length !== 4) {
      Alert.alert('Code PIN', 'Saisissez les 4 chiffres de votre code PIN.');
      return;
    }
    const ok = await unlockWithPin(pin);
    if (ok && user) {
      router.replace(homePathForActor(user));
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.card}>
        <MaterialCommunityIcons name="shield-lock" size={48} color={brandGreen} />
        <Text style={styles.title}>Code PIN</Text>
        <Text style={styles.subtitle}>
          Saisissez le code PIN défini lors de votre inscription pour accéder à ChainCacao.
        </Text>

        {pinUnlockError ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{pinUnlockError}</Text>
          </View>
        ) : null}

        <Text style={formLabelStyle}>Votre code PIN (4 chiffres)</Text>
        <TextInput
          style={[formInputStyle, styles.pinInput]}
          value={pin}
          onChangeText={(t) => setPin(t.replace(/\D/g, '').slice(0, 4))}
          keyboardType="number-pad"
          maxLength={4}
          secureTextEntry
          placeholder="••••"
          placeholderTextColor={FORM_PLACEHOLDER_COLOR}
          selectionColor={brandGreen}
          editable={!pinUnlockLoading}
          onSubmitEditing={submit}
        />

        <TouchableOpacity
          style={[styles.btn, pinUnlockLoading && styles.btnDisabled]}
          onPress={submit}
          disabled={pinUnlockLoading}
        >
          {pinUnlockLoading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.btnText}>Accéder à l&apos;application</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={async () => {
            await logout();
            router.replace('/login');
          }}
        >
          <Text style={styles.logout}>Utiliser un autre compte</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F4F0',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: brandGreen,
    marginTop: 12,
  },
  subtitle: {
    fontSize: 14,
    color: '#4B5563',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 20,
    lineHeight: 20,
  },
  pinInput: {
    width: '100%',
    textAlign: 'center',
    letterSpacing: 12,
    fontSize: 24,
    fontWeight: '700',
    color: FORM_TEXT_COLOR,
  },
  btn: {
    backgroundColor: brandGreen,
    width: '100%',
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  btnDisabled: { opacity: 0.7 },
  btnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  logout: { marginTop: 20, color: '#6B7280', fontSize: 14 },
  errorBanner: {
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 10,
    width: '100%',
    marginBottom: 12,
  },
  errorText: { color: '#C62828', textAlign: 'center', fontSize: 13 },
});
