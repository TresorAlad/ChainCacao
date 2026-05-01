import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import NetInfo from '@react-native-community/netinfo';
import { useLots } from '@/hooks/use-storage';

export default function AccueilScreen() {
  const router = useRouter();
  const { lots, loading } = useLots();
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(!!state.isConnected);
    });
    return () => unsubscribe();
  }, []);

  const totalKilosTermines = lots
    .filter(lot => lot.status === 'Terminé')
    .reduce((acc, lot) => acc + (parseFloat(lot.poids) || 0), 0);

  const nbLotsTermines = lots.filter(lot => lot.status === 'Terminé').length;
  const nbTotalLots = lots.length;
  const nbEnAttente = lots.filter(lot => !lot.synced).length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" />

      <LinearGradient colors={['#1B5E20', '#2E7D32', '#43A047']} style={styles.header}>
        <Text style={styles.brandText}>Chaincacao</Text>
        {!isOnline ? (
          <View style={styles.offlineBadge}>
            <MaterialCommunityIcons name="wifi-off" size={15} color="white" />
            <Text style={styles.offlineBadgeText}>Hors ligne</Text>
          </View>
        ) : (
          <MaterialCommunityIcons name="bell-outline" size={26} color="white" />
        )}
      </LinearGradient>

      <View style={styles.body}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

          {/* Bannière hors-ligne */}
          {!isOnline && (
            <View style={styles.offlineBanner}>
              <MaterialCommunityIcons name="cloud-off-outline" size={18} color="#E65100" />
              <Text style={styles.offlineBannerText}>
                Mode hors-ligne — {nbEnAttente} lot(s) en attente de synchronisation
              </Text>
            </View>
          )}

          {/* Bannière sync en attente (même si en ligne) */}
          {isOnline && nbEnAttente > 0 && (
            <View style={[styles.offlineBanner, { backgroundColor: '#FFF8E1', borderColor: '#F9A825' }]}>
              <MaterialCommunityIcons name="sync" size={18} color="#F9A825" />
              <Text style={[styles.offlineBannerText, { color: '#F57F17' }]}>
                {nbEnAttente} lot(s) en attente de confirmation blockchain
              </Text>
            </View>
          )}

          <Text style={styles.welcomeText}>Tableau de bord</Text>

          {/* Carte statistiques */}
          <View style={styles.statsCard}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{totalKilosTermines.toLocaleString()} kg</Text>
              <Text style={styles.statLabel}>Kilos validés</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{nbLotsTermines} / {nbTotalLots}</Text>
              <Text style={styles.statLabel}>Lots validés</Text>
            </View>
            {nbEnAttente > 0 && (
              <>
                <View style={styles.divider} />
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: '#F9A825' }]}>{nbEnAttente}</Text>
                  <Text style={styles.statLabel}>En attente</Text>
                </View>
              </>
            )}
          </View>

          {/* Actions rapides */}
          <Text style={styles.sectionTitle}>Actions rapides</Text>
          <View style={styles.actionsGrid}>
            <QuickAction
              icon="plus-circle"
              label="Nouveau lot"
              color="#2E7D32"
              onPress={() => router.push('/creationlot')}
            />
            <QuickAction
              icon="qrcode-scan"
              label="Scanner"
              color="#1565C0"
              onPress={() => router.push('/(tabs)/scan')}
            />
            <QuickAction
              icon="transfer"
              label="Transférer"
              color="#6A1B9A"
              onPress={() => router.push('/transfert')}
            />
            <QuickAction
              icon="history"
              label="Historique"
              color="#00695C"
              onPress={() => router.push('/historique')}
            />
          </View>

          {/* Derniers lots */}
          {lots.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Derniers lots</Text>
              {lots.slice(0, 3).map(lot => (
                <TouchableOpacity
                  key={lot.id}
                  style={styles.lotRow}
                  onPress={() => router.push({
                    pathname: '/caracteristiqueslot',
                    params: {
                      title: lot.title,
                      status: lot.status,
                      dateProd: lot.date,
                      poids: lot.poids,
                      acheteur: lot.acheteur || 'En attente',
                      destination: lot.destination || 'Non définie',
                    }
                  })}
                >
                  <View style={styles.lotRowLeft}>
                    <MaterialCommunityIcons
                      name={lot.synced ? 'check-circle' : 'clock-outline'}
                      size={20}
                      color={lot.synced ? '#2E7D32' : '#F9A825'}
                    />
                    <View style={{ marginLeft: 12 }}>
                      <Text style={styles.lotRowTitle}>{lot.title}</Text>
                      <Text style={styles.lotRowSub}>{lot.date} · {lot.poids} kg</Text>
                    </View>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={20} color="#CCC" />
                </TouchableOpacity>
              ))}
            </>
          )}

          {loading && (
            <Text style={styles.loadingText}>Chargement...</Text>
          )}

        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const QuickAction = ({ icon, label, color, onPress }: any) => (
  <TouchableOpacity style={styles.quickAction} onPress={onPress}>
    <View style={[styles.quickActionIcon, { backgroundColor: color + '18' }]}>
      <MaterialCommunityIcons name={icon} size={28} color={color} />
    </View>
    <Text style={styles.quickActionLabel}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1B5E20' },
  header: {
    height: 80,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  brandText: { color: 'white', fontSize: 22, fontWeight: 'bold' },
  offlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  offlineBadgeText: { color: 'white', fontSize: 12, marginLeft: 5, fontWeight: '600' },
  body: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -10,
  },
  content: { padding: 20, paddingBottom: 30 },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#FFCC80',
  },
  offlineBannerText: { marginLeft: 8, color: '#E65100', fontSize: 13, flex: 1 },
  welcomeText: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  statsCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    marginBottom: 25,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: 'bold', color: '#2E7D32' },
  statLabel: { fontSize: 11, color: '#999', marginTop: 6, textAlign: 'center', fontWeight: '600' },
  divider: { width: 1, backgroundColor: '#EEE', marginHorizontal: 8 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 25,
    gap: 12,
  },
  quickAction: {
    width: '46%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionLabel: { fontSize: 13, fontWeight: '600', color: '#333' },
  lotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    elevation: 1,
  },
  lotRowLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  lotRowTitle: { fontSize: 15, fontWeight: '600', color: '#333' },
  lotRowSub: { fontSize: 12, color: '#999', marginTop: 2 },
  loadingText: { textAlign: 'center', color: '#999', marginTop: 20 },
});
