import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

function firstParam(v: string | string[] | undefined): string {
  if (v === undefined || v === null) return '';
  return Array.isArray(v) ? String(v[0] ?? '') : String(v);
}

export default function CaracteristiquesLotScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const title = firstParam(params.title as string | string[] | undefined) || '—';
  const status = firstParam(params.status as string | string[] | undefined) || '—';
  const dateProd = firstParam(params.dateProd as string | string[] | undefined) || '—';
  const poids = firstParam(params.poids as string | string[] | undefined) || '—';
  const acheteur = firstParam(params.acheteur as string | string[] | undefined) || '—';
  const destination = firstParam(params.destination as string | string[] | undefined) || '—';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={26} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Caractéristiques du lot</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.card}>
          <Row icon="tag-outline" label="Titre" value={title} />
          <Row icon="information-outline" label="Statut" value={status} />
          <Row icon="calendar" label="Date" value={dateProd} />
          <Row icon="weight-kilogram" label="Poids (kg)" value={poids} />
          <Row icon="account-outline" label="Acheteur" value={acheteur} />
          <Row icon="map-marker-outline" label="Destination" value={destination} />
        </View>

        <Text style={styles.hint}>
          Pour une vérification blockchain, ouvrez l’historique depuis un lot synchronisé (écran Mes lots) avec son identifiant serveur.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.row}>
      <MaterialCommunityIcons name={icon as any} size={22} color="#1B5E20" />
      <View style={styles.rowText}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 14,
    backgroundColor: '#1B5E20',
  },
  backBtn: { padding: 8 },
  headerTitle: { flex: 1, textAlign: 'center', color: 'white', fontSize: 17, fontWeight: '700' },
  body: { padding: 20 },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    marginBottom: 20,
  },
  row: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  rowText: { marginLeft: 12, flex: 1 },
  rowLabel: { fontSize: 12, color: '#888', marginBottom: 4 },
  rowValue: { fontSize: 15, color: '#333', fontWeight: '600' },
  hint: { fontSize: 13, color: '#666', lineHeight: 20, paddingHorizontal: 4 },
});
