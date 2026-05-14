import React, { useEffect, useState } from 'react';
import { View, Text, ImageBackground, StyleSheet, StatusBar, Dimensions, Platform, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import * as Font from 'expo-font'; // Import indispensable

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
  const router = useRouter();
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    // 1. Charger les polices
    async function prepare() {
      try {
        await Font.loadAsync({
          'Montserrat-Bold': require('../../assets/fonts/Montserrat-Bold.ttf'),
          'Montserrat-Regular': require('../../assets/fonts/Montserrat-Regular.ttf'),
        });
      } catch (e) {
        console.warn(e);
      } finally {
        setFontsLoaded(true);
      }
    }

    prepare();

    // 2. Navigation automatique après 3 secondes
    const timer = setTimeout(() => {
      router.replace('/login');
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  // Si les polices ne sont pas prêtes, on affiche un écran vide ou un loader discret
  if (!fontsLoaded) {
    return (
      <View style={[styles.container, { backgroundColor: '#1B5E20', justifyContent: 'center' }]}>
        <ActivityIndicator color="white" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <ImageBackground 
        source={require('../../assets/images/accueil.jpg')} 
        style={styles.background}
      >
        <View style={styles.overlay}>
          {/* Application de Montserrat-Bold ici */}
          <Text style={styles.title}>ChainCacao</Text>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  background: { width, height, flex: 1 },
  overlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.3)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  title: {
    color: '#FFFFFF',
    fontSize: 55,
    // On remplace le Platform.select par notre nouvelle police
    fontFamily: 'Montserrat-Bold', 
    textAlign: 'center',
    // Note : On retire fontWeight: 'bold' car Montserrat-Bold l'est déjà
  },
});