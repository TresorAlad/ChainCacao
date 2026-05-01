import React, { useEffect } from 'react';
import { View, Text, ImageBackground, StyleSheet, StatusBar, Dimensions, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/use-auth';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
  const router = useRouter();
  const { initialized, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!initialized) return;
    const timer = setTimeout(() => {
      router.replace(isAuthenticated ? '/(tabs)/accueil' : '/login');
    }, 2000);
    return () => clearTimeout(timer);
  }, [initialized, isAuthenticated, router]);

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <ImageBackground
        source={require('../assets/images/accueil.jpg')}
        style={styles.background}
      >
        <View style={styles.overlay}>
          <Text style={styles.title}>ChainCacao</Text>
          <Text style={styles.subtitle}>Traçabilité blockchain agricole</Text>
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
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 55,
    fontFamily: Platform.select({ ios: 'Times New Roman', android: 'serif' }),
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 16,
    marginTop: 10,
    textAlign: 'center',
    letterSpacing: 1,
  },
});
