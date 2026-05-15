import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ImageBackground,
  StyleSheet,
  StatusBar,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Font from 'expo-font';
import { useAuth } from '@/hooks/use-auth';
import { homePathForActor } from '@/lib/home-path';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
  const router = useRouter();
  const { initialized, canAccessApp, needsPinUnlock, user } = useAuth();
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        await Font.loadAsync({
          'Montserrat-Bold': require('../assets/fonts/Montserrat-Bold.ttf'),
          'Montserrat-Regular': require('../assets/fonts/Montserrat-Regular.ttf'),
        });
      } catch (e) {
        console.warn(e);
      } finally {
        setFontsLoaded(true);
      }
    }
    prepare();
  }, []);

  useEffect(() => {
    if (!fontsLoaded || !initialized) return;
    const delayMs = canAccessApp && user ? 400 : needsPinUnlock ? 200 : 2000;
    const timer = setTimeout(() => {
      if (needsPinUnlock) {
        router.replace('/pin-unlock');
      } else if (canAccessApp && user) {
        router.replace(homePathForActor(user));
      } else {
        router.replace('/login');
      }
    }, delayMs);
    return () => clearTimeout(timer);
  }, [fontsLoaded, initialized, canAccessApp, needsPinUnlock, user, router]);

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
      <ImageBackground source={require('../assets/images/accueil.jpg')} style={styles.background}>
        <View style={styles.overlay}>
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
    alignItems: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 55,
    fontFamily: 'Montserrat-Bold',
    textAlign: 'center',
  },
});
