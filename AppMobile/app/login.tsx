import React, { useState, useEffect } from 'react';
import { 
  View, Text, ImageBackground, StyleSheet, TextInput, 
  TouchableOpacity, StatusBar, Dimensions, KeyboardAvoidingView, 
  Platform, ScrollView, ActivityIndicator 
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons'; 
import * as LocalAuthentication from 'expo-local-authentication';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);

  const brandGreen = '#228B22';

  // Vérification simplifiée de la biométrie au démarrage
  useEffect(() => {
    (async () => {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      setIsBiometricSupported(compatible);
    })();
  }, []);

  // Logique de connexion simplifiée (Mode Démo)
  const handleLogin = () => {
    setIsLoading(true);

    // On simule un petit délai pour faire "vrai" avant de changer de page
    setTimeout(() => {
      setIsLoading(false);
      router.replace('/accueil');
    }, 1000);
  };

  const handleBiometricAuth = async () => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Accès Chaincacao',
    });

    if (result.success) {
      router.replace('/accueil');
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

            <View style={styles.form}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="votre@email.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Text style={styles.label}>Mot de passe</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />

              <View style={styles.actionsRow}>
                {isBiometricSupported && (
                  <TouchableOpacity onPress={handleBiometricAuth} style={styles.biometricButton}>
                    <MaterialCommunityIcons name="fingerprint" size={40} color={brandGreen} />
                    <Text style={[styles.biometricText, {color: brandGreen}]}>Rapide</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity>
                  <Text style={[styles.forgotText, { color: brandGreen }]}>Oublié ?</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity 
                style={[styles.loginButton, { backgroundColor: brandGreen }]}
                onPress={handleLogin}
                disabled={isLoading}
              >
                {isLoading ? (
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
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 35 },
  title: { fontSize: 38, fontWeight: 'bold' },
  form: { width: '100%' },
  label: { fontSize: 11, color: '#666', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 8 },
  input: { backgroundColor: '#F5F7FA', borderRadius: 15, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: '#E1E8ED' },
  actionsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  biometricButton: { alignItems: 'center', flexDirection: 'row' },
  biometricText: { marginLeft: 5, fontWeight: 'bold', fontSize: 12 },
  forgotText: { fontWeight: 'bold', fontSize: 14 },
  loginButton: { borderRadius: 18, padding: 20, alignItems: 'center', elevation: 4 },
  loginButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 30 },
  footerText: { color: '#8e8e8e', fontSize: 15 },
  signUpText: { fontSize: 15, fontWeight: 'bold' },
});