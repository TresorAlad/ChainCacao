import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

/**
 * L’API `POST /api/v1/lot/:id/confirmer` est réservée aux rôles transformateur / exportateur / admin.
 * Les coopératives utilisent d’autres flux (listes groupées, etc.).
 */
export default function PaiementCooperativeInfoScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ title: 'Paiement lot', headerShown: true }} />
      <View style={styles.box}>
        <Text style={styles.title}>Information</Text>
        <Text style={styles.body}>
          La confirmation de paiement d’un lot côté acheteur (PIN) est disponible pour les comptes
          exportateur ou transformateur. Contactez votre partenaire ou utilisez les écrans dédiés côté
          exportateur.
        </Text>
        <TouchableOpacity style={styles.btn} onPress={() => router.back()}>
          <Text style={styles.btnText}>Retour</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  box: { margin: 20, padding: 20, backgroundColor: 'white', borderRadius: 12, elevation: 2 },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 12, color: '#1B5E20' },
  body: { fontSize: 14, color: '#444', lineHeight: 22 },
  btn: { marginTop: 20, backgroundColor: '#1B5E20', padding: 14, borderRadius: 10, alignItems: 'center' },
  btnText: { color: 'white', fontWeight: 'bold' },
});
