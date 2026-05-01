import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CaracteristiqueLotScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const isSynced = params.synced === '1';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      <LinearGradient colors={['#1B5E20', '#2E7D32', '#43A047']} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={28} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Détails du Lot</Text>
        <TouchableOpacity onPress={() => router.push({
          pathname: '/historique',
          params: { lotId: params.lotId || params.title },
        })}>
          <MaterialCommunityIcons name="history" size={24} color="white" />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        {/* Carte récapitulative */}
        <View style={styles.infoCard}>
          <Text style={styles.lotTitle}>{params.title || 'Lot Sans Nom'}</Text>
          <View style={styles.statusRow}>
            <MaterialCommunityIcons
              name={params.status === 'Problème' ? 'alert-circle' : params.status === 'Terminé' ? 'check-circle' : 'clock-outline'}
              size={18}
              color={params.status === 'Problème' ? '#C62828' : params.status === 'Terminé' ? '#2E7D32' : '#F9A825'}
            />
            <Text style={styles.statusText}>{params.status || 'Statut inconnu'}</Text>
          </View>
          {/* Badge blockchain */}
          {isSynced ? (
            <View style={styles.chainBadge}>
              <MaterialCommunityIcons name="check-decagram" size={14} color="#2E7D32" />
              <Text style={styles.chainBadgeText}>Certifié sur Hyperledger Fabric</Text>
            </View>
          ) : (
            <View style={[styles.chainBadge, styles.chainBadgePending]}>
              <MaterialCommunityIcons name="clock-outline" size={14} color="#F9A825" />
              <Text style={[styles.chainBadgeText, { color: '#F57F17' }]}>En attente de confirmation blockchain</Text>
            </View>
          )}
        </View>

        {/* Caractéristiques */}
        <View style={styles.detailsContainer}>
          <DetailItem
            icon="calendar-clock"
            label="Date de Production"
            value={params.dateProd as string || 'Non définie'}
          />
          <DetailItem
            icon="leaf"
            label="Type de Cacao"
            value={params.typeCacao as string || 'Non précisé'}
          />
          <DetailItem
            icon="weight-kilogram"
            label="Poids Total"
            value={`${params.poids || '0'} kg`}
          />
          <DetailItem
            icon="account-cash"
            label="Acheteur"
            value={params.acheteur as string || 'En attente'}
          />
          <DetailItem
            icon="truck-delivery"
            label="Destination"
            value={params.destination as string || 'Non définie'}
            isLast
          />
        </View>

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => router.push({
              pathname: '/historique',
              params: { lotId: params.lotId || params.title },
            })}
          >
            <MaterialCommunityIcons name="history" size={22} color="#2E7D32" />
            <Text style={styles.actionBtnText}>Voir l'historique blockchain</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#CCC" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => router.push({
              pathname: '/transfert',
              params: { lotId: params.lotId || '' },
            })}
          >
            <MaterialCommunityIcons name="transfer" size={22} color="#1565C0" />
            <Text style={[styles.actionBtnText, { color: '#1565C0' }]}>Transférer ce lot</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#CCC" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const DetailItem = ({ icon, label, value, isLast = false }: any) => (
  <View style={[styles.detailItem, !isLast && styles.borderBottom]}>
    <View style={styles.iconCircle}>
      <MaterialCommunityIcons name={icon} size={22} color="#2E7D32" />
    </View>
    <View style={styles.detailTextContent}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1B5E20' },
  header: {
    height: 70,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  headerTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  body: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    elevation: 4,
    marginBottom: 20,
    marginTop: 10,
  },
  lotTitle: { fontSize: 22, fontWeight: 'bold', color: '#1B5E20', textAlign: 'center' },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  statusText: { marginLeft: 5, color: '#666', fontWeight: '600' },
  chainBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginTop: 10,
    gap: 5,
  },
  chainBadgePending: { backgroundColor: '#FFF8E1' },
  chainBadgeText: { fontSize: 11, color: '#2E7D32', fontWeight: '600' },
  detailsContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 15,
    elevation: 2,
    marginBottom: 20,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  iconCircle: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  detailTextContent: { flex: 1 },
  detailLabel: { fontSize: 11, color: '#999', textTransform: 'uppercase', letterSpacing: 0.5 },
  detailValue: { fontSize: 16, color: '#333', fontWeight: '600', marginTop: 2 },
  actionsContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 5,
    elevation: 2,
    marginBottom: 30,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    gap: 12,
  },
  actionBtnText: { flex: 1, fontSize: 15, fontWeight: '500', color: '#333' },
});
