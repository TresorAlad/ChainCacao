import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import * as Font from 'expo-font';

import { CoopBottomNav } from '@/components/CoopBottomNav';
import { myLotsApi, getApiError, type BatchResponse } from '@/services/api';
import { mapStatut } from '@/utils/lot-status';

export default function HistoriqueCooperativeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [lots, setLots] = useState<BatchResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'Tous' | 'Transferts' | 'Paiements'>('Tous');

  useEffect(() => {
    Font.loadAsync({
      'Montserrat-Bold': require('../../assets/fonts/Montserrat-Bold.ttf'),
      'Montserrat-Regular': require('../../assets/fonts/Montserrat-Regular.ttf'),
    })
      .catch(() => {})
      .finally(() => setFontsLoaded(true));
  }, []);

  const loadData = useCallback(async () => {
    try {
      const { data } = await myLotsApi.list({ limit: 200 });
      const list = data.lots ?? [];
      list.sort((a, b) => new Date(b.timestamp ?? 0).getTime() - new Date(a.timestamp ?? 0).getTime());
      setLots(list);
    } catch (e) {
      console.warn(getApiError(e));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (!fontsLoaded) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#1B5E20" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top']}>
        <Stack.Screen options={{ headerShown: false }} />
        <StatusBar barStyle="light-content" />

        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={28} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Historique & Traçabilité</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.filterContainer}>
          {(['Tous', 'Transferts', 'Paiements'] as const).map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[styles.filterBtn, activeFilter === filter && styles.filterBtnActive]}
              onPress={() => setActiveFilter(filter)}
            >
              <Text style={[styles.filterText, activeFilter === filter && styles.filterTextActive]}>
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.body}>
          {loading ? (
            <ActivityIndicator size="large" color="#2E7D32" style={{ marginTop: 40 }} />
          ) : (
            <ScrollView
              contentContainerStyle={[styles.content, { paddingBottom: 100 + insets.bottom }]}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} />
              }
            >
              {lots.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <MaterialCommunityIcons name="history" size={60} color="#DDD" />
                  <Text style={styles.emptyText}>Aucune transaction trouvée.</Text>
                </View>
              ) : (
                lots.map((lot, index) => {
                  const statusInfo = mapStatut(lot.statut);
                  let iconName = "package-variant-closed";
                  let iconColor = "#1B5E20";
                  let title = `Création du lot ${lot.culture || 'Cacao'}`;
                  
                  if (lot.statut?.includes('transfer')) {
                    iconName = "truck-delivery";
                    iconColor = "#E65100";
                    title = `Transfert du lot`;
                  } else if (lot.statut?.includes('pay')) {
                    iconName = "cash-check";
                    iconColor = "#2E7D32";
                    title = `Paiement effectué`;
                  }

                  if (activeFilter === 'Transferts' && !lot.statut?.includes('transfer')) return null;
                  if (activeFilter === 'Paiements' && !lot.statut?.includes('pay')) return null;

                  return (
                    <TouchableOpacity
                      key={lot.id + index}
                      style={styles.timelineItem}
                      activeOpacity={0.85}
                      onPress={() =>
                        router.push({
                          pathname: '/historique',
                          params: { lotId: lot.id ?? '' },
                        } as any)
                      }
                    >
                      <View style={styles.timelineLeft}>
                        <View style={[styles.iconCircle, { backgroundColor: iconColor + '20' }]}>
                          <MaterialCommunityIcons name={iconName as any} size={20} color={iconColor} />
                        </View>
                        {index !== lots.length - 1 && <View style={styles.timelineLine} />}
                      </View>
                      
                      <View style={styles.timelineContent}>
                        <View style={styles.timelineHeader}>
                          <Text style={styles.timelineTitle}>{title}</Text>
                          <Text style={styles.timelineDate}>
                            {lot.timestamp ? new Date(lot.timestamp).toLocaleDateString('fr-FR') : 'Date inconnue'}
                          </Text>
                        </View>
                        
                        <View style={styles.timelineDetailsCard}>
                          <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>ID Lot:</Text>
                            <Text style={styles.detailValue} numberOfLines={1}>{lot.id}</Text>
                          </View>
                          <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Quantité:</Text>
                            <Text style={styles.detailValue}>{lot.quantite} kg</Text>
                          </View>
                          <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Statut:</Text>
                            <Text style={[styles.detailValue, { color: statusInfo.color }]}>
                              {statusInfo.label}
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.viewHistoryHint}>Voir l&apos;historique blockchain →</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          )}
        </View>

        <CoopBottomNav activeTab="historique" />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1B5E20' },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    height: 60,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  backBtn: { width: 40, alignItems: 'flex-start' },
  headerTitle: { color: 'white', fontSize: 18, fontFamily: 'Montserrat-Bold' },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 15,
    gap: 10,
  },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  filterBtnActive: {
    backgroundColor: 'white',
  },
  filterText: {
    color: 'white',
    fontSize: 13,
    fontFamily: 'Montserrat-Bold',
  },
  filterTextActive: {
    color: '#1B5E20',
  },
  body: { flex: 1, backgroundColor: '#F8F9FA', borderTopLeftRadius: 30, borderTopRightRadius: 30 },
  content: { padding: 20, paddingTop: 30 },
  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: '#888', marginTop: 10, fontSize: 14 },
  
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  timelineLeft: {
    width: 40,
    alignItems: 'center',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E0E0E0',
    marginTop: 5,
    marginBottom: -20,
  },
  timelineContent: {
    flex: 1,
    marginLeft: 15,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  timelineTitle: {
    fontSize: 15,
    fontFamily: 'Montserrat-Bold',
    color: '#333',
  },
  timelineDate: {
    fontSize: 12,
    color: '#888',
  },
  timelineDetailsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    elevation: 2,
  },
  viewHistoryHint: {
    marginTop: 8,
    fontSize: 11,
    fontFamily: 'Montserrat-Bold',
    color: '#2E7D32',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 12,
    color: '#666',
  },
  detailValue: {
    fontSize: 12,
    fontFamily: 'Montserrat-Bold',
    color: '#333',
    maxWidth: '70%',
  },

});
