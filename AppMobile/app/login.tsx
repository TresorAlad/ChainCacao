import React, { useState, useEffect } from 'react';
import {
  View, Text, ImageBackground, StyleSheet, TextInput,
  TouchableOpacity, StatusBar, Dimensions, KeyboardAvoidingView,
  Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import { useAuth } from '@/hooks/use-auth';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const router = useRouter();
  const { login, loading, error, initialized, isAuthenticated } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);

  const brandGreen = '#228B22';

  useEffect(() => {
    (async () => {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      setIsBiometricSupported(compatible);
    })();
  }, []);

  useEffect(() => {
    if (!initialized) return;
    if (isAuthenticated) {
      router.replace('/(tabs)/accueil');
    }
  }, [initialized, isAuthenticated, router]);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Champs requis', 'Veuillez saisir votre email et mot de passe.');
      return;
    }
    const ok = await login(email.trim(), password.trim());
    if (ok) {
      router.replace('/(tabs)/accueil');
    }
  };

  const handleBiometricAuth = async () => {
    setBiometricLoading(true);
    try {
      // Vérifier si un token existe déjà (biométrie = accès rapide si déjà connecté)
      if (!isAuthenticated) {
        Alert.alert(
          'Connexion requise',
          'Veuillez vous connecter une première fois avec votre email et mot de passe.'
        );
        return;
      }
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Accès Chaincacao',
        fallbackLabel: 'Utiliser le mot de passe',
      });
      if (result.success) {
        router.replace('/(tabs)/accueil');
      }
    } finally {
      setBiometricLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      <ImageBackground
        source={require('../assets/images/accueil.jpg')}
        style={styles.background}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
          <View style={styles.spacer} />

          <View style={styles.whiteFrame}>
            <View style={styles.headerRow}>
              <Text style={[styles.title, { color: brandGreen }]}>Connexion</Text>
              <MaterialCommunityIcons name="leaf" size={28} color={brandGreen} />
            </View>

            {/* Message d'erreur API */}
            {error && (
              <View style={styles.errorBanner}>
                <MaterialCommunityIcons name="alert-circle" size={16} color="#C62828" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <View style={styles.form}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="votre@email.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
              />

              <Text style={styles.label}>Mot de passe</Text>
              <View style={styles.passwordRow}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="••••••••"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  editable={!loading}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeBtn}
                >
                  <MaterialCommunityIcons
                    name={showPassword ? 'eye' : 'eye-off'}
                    size={22}
                    color="#999"
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.actionsRow}>
                {isBiometricSupported && (
                  <TouchableOpacity
                    onPress={handleBiometricAuth}
                    style={styles.biometricButton}
                    disabled={biometricLoading}
                  >
                    {biometricLoading ? (
                      <ActivityIndicator size="small" color={brandGreen} />
                    ) : (
                      <MaterialCommunityIcons name="fingerprint" size={40} color={brandGreen} />
                    )}
                    <Text style={[styles.biometricText, { color: brandGreen }]}>Rapide</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity>
                  <Text style={[styles.forgotText, { color: brandGreen }]}>Oublié ?</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.loginButton, { backgroundColor: brandGreen }, loading && styles.btnDisabled]}
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.loginButtonText}>Se connecter</Text>
                )}
              </TouchableOpacity>

              <View style={styles.footer}>
                <Text style={styles.footerText}>Besoin d'un compte ? </Text>
                <TouchableOpacity onPress={() => router.push('/register')}>
                  <Text style={[styles.signUpText, { color: brandGreen }]}>S'inscrire</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </ImageBackground>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  background: { width, height },
  scrollContent: { flexGrow: 1 },
  spacer: { height: height * 0.20 },
  whiteFrame: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopRightRadius: 80,
    paddingHorizontal: 35,
    paddingTop: 45,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: { fontSize: 38, fontWeight: 'bold' },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    borderRadius: 12,
    padding: 12,
    marginBottom: 15,
    gap: 8,
  },
  errorText: { color: '#C62828', fontSize: 13, flex: 1 },
  form: { width: '100%' },
  label: {
    fontSize: 11,
    color: '#666',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F5F7FA',
    borderRadius: 15,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E1E8ED',
    fontSize: 15,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#E1E8ED',
    marginBottom: 20,
  },
  passwordInput: { flex: 1, padding: 16, fontSize: 15 },
  eyeBtn: { padding: 12 },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
  },
  biometricButton: { alignItems: 'center', flexDirection: 'row' },
  biometricText: { marginLeft: 5, fontWeight: 'bold', fontSize: 12 },
  forgotText: { fontWeight: 'bold', fontSize: 14 },
  loginButton: {
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
    elevation: 4,
  },
  btnDisabled: { opacity: 0.7 },
  loginButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  footerText: { color: '#8e8e8e', fontSize: 15 },
  signUpText: { fontSize: 15, fontWeight: 'bold' },
});
