import React, { useEffect } from 'react';
import { View, Text, ImageBackground, StyleSheet, StatusBar, Dimensions, Platform } from 'react-native';
import { useRouter } from 'expo-router'; // Import du moteur de navigation

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    // On attend 3 secondes (3000ms) avant de changer de page
    const timer = setTimeout(() => {
      router.replace('/login'); // .replace empêche de revenir au splash en faisant "retour"
    }, 3000);

    return () => clearTimeout(timer); // Nettoyage du timer si on quitte l'écran
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <ImageBackground source={require('../../assets/images/accueil.jpg')} style={styles.background}>
        <View style={styles.overlay}>
          <Text style={styles.title}>ChainCacao</Text>
        </View>
      </ImageBackground>
    </View>
  );
}

// ... gardez les mêmes styles qu'avant ...
const styles = StyleSheet.create({
  container: { flex: 1 },
  background: { width, height, flex: 1 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  title: {
    color: '#FFFFFF',
    fontSize: 55,
    fontFamily: Platform.select({ ios: 'Times New Roman', android: 'serif' }),
    fontWeight: 'bold',
    textAlign: 'center',
  },
});