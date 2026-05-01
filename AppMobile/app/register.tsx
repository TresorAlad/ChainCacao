import React, { useState } from 'react';
import { 
  View, Text, ImageBackground, StyleSheet, TextInput, 
  TouchableOpacity, StatusBar, Dimensions, KeyboardAvoidingView, 
  Platform, ScrollView, Switch, ActivityIndicator, Alert
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi, getApiError, TOKEN_KEY, USER_KEY } from '@/services/api';

const { width, height } = Dimensions.get('window');

export default function RegisterScreen() {
  const router = useRouter();
  const brandGreen = '#228B22'; 

  // --- ÉTATS GÉNÉRAUX ---
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('agriculteur');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // --- ÉTATS SPÉCIFIQUES ---
  const [gpsLocation, setGpsLocation] = useState('');
  const [fieldSurface, setFieldSurface] = useState(''); 
  const [orgName, setOrgName] = useState(''); 

  // --- ÉTATS DE SÉCURITÉ ---
  const [useBiometrics, setUseBiometrics] = useState(false);
  const [usePin, setUsePin] = useState(false);
  const [pinCode, setPinCode] = useState('');
  const [showPin, setShowPin] = useState(false);

  const getOrgLabel = () => {
    switch (role) {
      case 'cooperative': return "Nom de l'organisation / Coopérative";
      case 'transformateur': return "Nom de l'organisation / Transformateur";
      case 'exportateur': return "Nom de l'organisation / Exportateur";
      default: return "Nom de l'organisation";
    }
  };

  const getLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      let location = await Location.getCurrentPositionAsync({});
      setGpsLocation(`${location.coords.latitude.toFixed(4)}, ${location.coords.longitude.toFixed(4)}`);
    }
  };

  const toggleBiometrics = async (value: boolean) => {
    if (value) {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (hasHardware) {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Confirmez votre identité',
        });
        setUseBiometrics(result.success);
      }
    } else {
      setUseBiometrics(false);
    }
  };

  const handleRegister = async () => {
    // validations
    if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      Alert.alert('Champs requis', "Veuillez remplir le nom, l'email et le mot de passe.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Mot de passe', 'Les mots de passe ne correspondent pas.');
      return;
    }
    if (usePin && pinCode.trim().length !== 4) {
      Alert.alert('Code PIN', 'Le PIN doit contenir 4 chiffres.');
      return;
    }
    if (!gpsLocation.trim()) {
      Alert.alert('Localisation', 'Veuillez récupérer vos coordonnées GPS.');
      return;
    }

    setIsLoading(true);
    try {
      const { data } = await authApi.signup({
        nom: name.trim(),
        email: email.trim(),
        password: password.trim(),
        role,
        gps_location: gpsLocation.trim(),
        field_surface: fieldSurface.trim(),
        org_name: orgName.trim(),
        pin_code: usePin ? pinCode.trim() : undefined,
      });

      // Auto-login: stocker token + actor pour passer directement à l'app
      if (data.token) {
        await AsyncStorage.setItem(TOKEN_KEY, data.token);
      }
      if (data.actor) {
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(data.actor));
      }

      Alert.alert('Compte créé ✓', 'Votre compte a été créé. Vous êtes connecté.', [
        { text: 'OK', onPress: () => router.replace('/(tabs)/accueil') },
      ]);
    } catch (e) {
      Alert.alert('Inscription impossible', getApiError(e));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      
      <ImageBackground source={require('../assets/images/accueil.jpg')} style={styles.absoluteBackground}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.spacer} />

            <View style={styles.whiteFrame}>
              <Text style={[styles.title, { color: brandGreen }]}>Inscription</Text>

              <View style={styles.form}>
                <Text style={styles.label}>Nom complet</Text>
                <TextInput style={styles.input} placeholder="Nom & Prénom" value={name} onChangeText={setName} />

                <Text style={styles.label}>Email</Text>
                <TextInput style={styles.input} placeholder="votre@email.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />

                <Text style={styles.label}>Votre Rôle</Text>
                <View style={styles.pickerContainer}>
                  <Picker selectedValue={role} onValueChange={(v) => setRole(v)} style={styles.picker}>
                    <Picker.Item label="Agriculteur" value="agriculteur" />
                    <Picker.Item label="Coopérative" value="cooperative" />
                    <Picker.Item label="Transformateur" value="transformateur" />
                    <Picker.Item label="Exportateur" value="exportateur" />
                  </Picker>
                </View>

                <View style={styles.dynamicSection}>
                  {role === 'agriculteur' ? (
                    <>
                      <Text style={styles.label}>Surface du champ (Hectares)</Text>
                      <TextInput style={styles.input} placeholder="Ex: 2.5" keyboardType="numeric" value={fieldSurface} onChangeText={setFieldSurface} />
                    </>
                  ) : (
                    <>
                      <Text style={styles.label}>{getOrgLabel()}</Text>
                      <TextInput style={styles.input} placeholder="Nom officiel" value={orgName} onChangeText={setOrgName} />
                    </>
                  )}

                  <Text style={styles.label}>
                    {role === 'agriculteur' ? "Localisation du champ" : "Localisation du siège"}
                  </Text>
                  <View style={styles.gpsRow}>
                    <TextInput 
                      style={[styles.input, { flex: 1, marginBottom: 0 }]} 
                      placeholder="Coordonnées GPS" 
                      value={gpsLocation} 
                      editable={false} 
                    />
                    <TouchableOpacity style={[styles.gpsButton, { backgroundColor: brandGreen }]} onPress={getLocation}>
                      <MaterialCommunityIcons name="map-marker-radius" size={24} color="white" />
                    </TouchableOpacity>
                  </View>
                </View>

                <Text style={styles.label}>Mot de passe</Text>
                <View style={styles.passwordInputContainer}>
                  <TextInput 
                    style={styles.flexInput} 
                    placeholder="••••••••" 
                    value={password} 
                    onChangeText={setPassword} 
                    secureTextEntry={!showPassword} 
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                    <MaterialCommunityIcons name={showPassword ? "eye" : "eye-off"} size={22} color="#999" />
                  </TouchableOpacity>
                </View>

                <Text style={styles.label}>Confirmer le mot de passe</Text>
                <View style={styles.passwordInputContainer}>
                  <TextInput 
                    style={styles.flexInput} 
                    placeholder="••••••••" 
                    value={confirmPassword} 
                    onChangeText={setConfirmPassword} 
                    secureTextEntry={!showConfirmPassword} 
                  />
                  <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIcon}>
                    <MaterialCommunityIcons name={showConfirmPassword ? "eye" : "eye-off"} size={22} color="#999" />
                  </TouchableOpacity>
                </View>

                <View style={styles.securitySection}>
                  <Text style={[styles.sectionTitle, { color: brandGreen }]}>Sécurisation du compte</Text>
                  <View style={styles.switchRow}>
                    <View style={styles.switchLabelGroup}>
                      <MaterialCommunityIcons name="fingerprint" size={24} color={brandGreen} />
                      <Text style={styles.switchLabel}>Empreinte digitale</Text>
                    </View>
                    <Switch value={useBiometrics} onValueChange={toggleBiometrics} trackColor={{ false: "#D1D1D1", true: brandGreen }} />
                  </View>

                  <View style={styles.switchRow}>
                    <View style={styles.switchLabelGroup}>
                      <MaterialCommunityIcons name="lock-question" size={24} color={brandGreen} />
                      <Text style={styles.switchLabel}>Code PIN de l'app</Text>
                    </View>
                    <Switch value={usePin} onValueChange={setUsePin} trackColor={{ false: "#D1D1D1", true: brandGreen }} />
                  </View>

                  {usePin && (
                    <View style={styles.pinInputContainer}>
                      <TextInput 
                        style={styles.pinInput} 
                        placeholder="PIN à 4 chiffres" 
                        value={pinCode} 
                        onChangeText={setPinCode} 
                        keyboardType="number-pad" 
                        maxLength={4} 
                        secureTextEntry={!showPin} 
                      />
                      <TouchableOpacity onPress={() => setShowPin(!showPin)} style={styles.eyeIcon}>
                        <MaterialCommunityIcons name={showPin ? "eye" : "eye-off"} size={22} color={brandGreen} />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>

                <TouchableOpacity 
                  style={[styles.registerButton, { backgroundColor: brandGreen }]} 
                  onPress={handleRegister}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text style={styles.registerButtonText}>Créer mon compte</Text>
                  )}
                </TouchableOpacity>

                <View style={styles.footer}>
                  <Text style={styles.footerText}>Déjà inscrit ? </Text>
                  <TouchableOpacity onPress={() => router.back()}>
                    <Text style={[styles.signInText, { color: brandGreen }]}>Se connecter</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  absoluteBackground: { width, height },
  scrollContent: { flexGrow: 1 },
  spacer: { height: height * 0.15 },
  whiteFrame: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopRightRadius: 80, 
    paddingHorizontal: 35,
    paddingTop: 35,
    paddingBottom: 40,
  },
  title: { fontSize: 32, fontWeight: 'bold', marginBottom: 25 },
  form: { width: '100%' },
  label: { fontSize: 11, color: '#666', marginBottom: 8, fontWeight: 'bold', textTransform: 'uppercase' },
  input: { backgroundColor: '#F5F7FA', borderRadius: 12, padding: 14, marginBottom: 15, borderWidth: 1, borderColor: '#E1E8ED' },
  passwordInputContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#F5F7FA', 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: '#E1E8ED', 
    marginBottom: 15 
  },
  flexInput: { flex: 1, padding: 14 },
  pickerContainer: { backgroundColor: '#F5F7FA', borderRadius: 12, borderWidth: 1, borderColor: '#E1E8ED', marginBottom: 15 },
  picker: { height: 55, width: '100%' },
  dynamicSection: { marginBottom: 10, padding: 10, backgroundColor: '#f9f9f9', borderRadius: 15 },
  gpsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  gpsButton: { marginLeft: 10, padding: 12, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  securitySection: { marginVertical: 20, padding: 20, backgroundColor: '#F0F4F0', borderRadius: 20, alignItems: 'center' },
  sectionTitle: { fontSize: 13, fontWeight: 'bold', marginBottom: 15, textTransform: 'uppercase' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 15 },
  switchLabelGroup: { flexDirection: 'row', alignItems: 'center' },
  switchLabel: { marginLeft: 12, fontSize: 14, color: '#333' },
  pinInputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 12, borderWidth: 1, borderColor: '#228B22', width: '100%' },
  pinInput: { flex: 1, padding: 12, textAlign: 'center', fontSize: 16, fontWeight: 'bold' },
  eyeIcon: { padding: 10 },
  registerButton: { borderRadius: 15, padding: 18, alignItems: 'center', marginTop: 15 },
  registerButtonText: { color: '#FFFFFF', fontSize: 17, fontWeight: 'bold' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 25 },
  footerText: { color: '#8e8e8e', fontSize: 14 },
  signInText: { fontSize: 14, fontWeight: 'bold' },
});