import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ImageBackground, 
  StatusBar, 
  Dimensions, 
  ActivityIndicator,
  Alert
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Font from 'expo-font';

const { width, height } = Dimensions.get('window');

type UserRole = 'agriculteur' | 'exportateur' | 'cooperative';

export default function LoginScreen() {
  const router = useRouter();
  const [role, setRole] = useState<UserRole>('agriculteur');
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        await Font.loadAsync({
          'Montserrat-Bold': require('../assets/fonts/Montserrat-Bold.ttf'),
          'Montserrat-Regular': require('../assets/fonts/Montserrat-Regular.ttf'),
        });
      } catch (e) {
        console.warn("Erreur polices");
      } finally {
        setFontsLoaded(true);
      }
    }
    prepare();
  }, []);

  const handleLogin = () => {
    // Tentative de navigation vers le groupe de dossiers spécifique
    // Note : Dans Expo Router, on utilise souvent le chemin sans les parenthèses dans le code, 
    // car elles sont "invisibles" pour l'URL, mais on va forcer le chemin absolu ici.
    
    try {
      // Option 1 : Chemin explicite avec le groupe
      const groupPath = `/(${role})/accueil` as any;
      
      console.log("Navigation vers :", groupPath);
      router.replace(groupPath);
      
    } catch (error) {
      // Option 2 : Sécurité si le groupe n'est pas reconnu par le routeur comme faisant partie du segment
      console.log("Échec Option 1, tentative Option 2");
      router.replace(`/${role}/accueil` as any);
    }
  };

  if (!fontsLoaded) return <ActivityIndicator size="large" style={{flex:1}} color="#1B5E20" />;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      <ImageBackground source={require('../assets/images/accueil.jpg')} style={styles.background}>
        <View style={styles.topSpace} />

        <View style={styles.loginFrame}>
          <View style={styles.content}>
            <Text style={styles.title}>Connexion</Text>
            <Text style={styles.subtitle}>Espace sécurisé ChainCacao</Text>

            {/* SÉLECTEUR DE RÔLE */}
            <View style={styles.roleGrid}>
              <RoleButton 
                label="Agriculteur" 
                active={role === 'agriculteur'} 
                onPress={() => setRole('agriculteur')} 
                icon="leaf" 
              />
              <RoleButton 
                label="Exportateur" 
                active={role === 'exportateur'} 
                onPress={() => setRole('exportateur')} 
                icon="ship-wheel" 
              />
              <RoleButton 
                label="Coopérative" 
                active={role === 'cooperative'} 
                onPress={() => setRole('cooperative')} 
                icon="home-group" 
              />
            </View>

            <View style={styles.form}>
              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons name="email-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput 
                  style={styles.input} 
                  placeholder="Email" 
                  placeholderTextColor="#999" 
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons name="lock-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput 
                  style={styles.input} 
                  placeholder="Mot de passe" 
                  placeholderTextColor="#999" 
                  secureTextEntry 
                />
              </View>
            </View>

            <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
              <Text style={styles.loginButtonText}>Se connecter</Text>
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Nouveau ? </Text>
              <TouchableOpacity onPress={() => router.push('/register' as any)}>
                <Text style={styles.registerLink}>Créer un compte</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
}

const RoleButton = ({ label, active, onPress, icon }: any) => (
  <TouchableOpacity 
    style={[styles.roleBox, active && styles.roleBoxActive]} 
    onPress={onPress}
    activeOpacity={0.7}
  >
    <MaterialCommunityIcons name={icon} size={24} color={active ? 'white' : '#1B5E20'} />
    <Text style={[styles.roleText, active && styles.roleTextActive]}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  background: { width: width, height: height },
  topSpace: { height: height * 0.15 },
  loginFrame: { 
    flex: 1, 
    backgroundColor: '#FFF', 
    borderTopLeftRadius: 60, 
    paddingHorizontal: 30,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10
  },
  content: { flex: 1, justifyContent: 'center', paddingBottom: 20 },
  title: { fontSize: 30, fontFamily: 'Montserrat-Bold', color: '#1B5E20', textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#777', fontFamily: 'Montserrat-Regular', marginBottom: 30, textAlign: 'center' },
  roleGrid: { flexDirection: 'row', gap: 10, marginBottom: 25 },
  roleBox: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 15, 
    borderRadius: 15, 
    backgroundColor: '#F5F5F5', 
    borderWidth: 1, 
    borderColor: '#EEE' 
  },
  roleBoxActive: { backgroundColor: '#1B5E20', borderColor: '#1B5E20' },
  roleText: { fontSize: 10, fontFamily: 'Montserrat-Bold', color: '#1B5E20', marginTop: 5 },
  roleTextActive: { color: 'white' },
  form: { marginBottom: 25 },
  inputWrapper: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#F9F9F9', 
    borderWidth: 1, 
    borderColor: '#EEE', 
    borderRadius: 15, 
    marginBottom: 15, 
    paddingHorizontal: 15 
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, paddingVertical: 15, fontSize: 16, fontFamily: 'Montserrat-Regular' },
  loginButton: { backgroundColor: '#1B5E20', borderRadius: 15, padding: 18, alignItems: 'center' },
  loginButtonText: { color: 'white', fontSize: 18, fontFamily: 'Montserrat-Bold' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 25 },
  footerText: { color: '#888', fontFamily: 'Montserrat-Regular' },
  registerLink: { color: '#1B5E20', fontFamily: 'Montserrat-Bold' }
});