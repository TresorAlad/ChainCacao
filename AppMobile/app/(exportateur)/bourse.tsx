import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';

import { walletApi, myLotsApi, getApiError } from '@/services/api';

const { width } = Dimensions.get('window');

const chartConfig = {
  backgroundGradientFrom: '#ffffff',
  backgroundGradientTo: '#ffffff',
  color: (opacity = 1) => `rgba(27, 94, 32, ${opacity})`,
  strokeWidth: 2,
  decimalPlaces: 0,
};

export default function BourseScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [balance, setBalance] = useState<number | null>(null);
  const [chartData, setChartData] = useState<number[]>([0, 0, 0, 0, 0, 0]);
  const [modal, setModal] = useState<null | 'depot' | 'retrait'>(null);
  const [pinInput, setPinInput] = useState('');
  const [amountStr, setAmountStr] = useState('');

  const closeModal = () => {
    setModal(null);
    setPinInput('');
    setAmountStr('');
  };

  const submitWallet = async () => {
    const m = parseFloat(amountStr.replace(',', '.'));
    if (!pinInput.trim()) {
      Alert.alert('PIN', 'Saisissez votre code PIN.');
      return;
    }
    if (!m || m <= 0) {
      Alert.alert('Montant', 'Montant invalide.');
      return;
    }
    try {
      if (modal === 'depot') {
        await walletApi.depot({ montant: m, pin: pinInput.trim() });
      } else if (modal === 'retrait') {
        await walletApi.retrait({ montant: m, pin: pinInput.trim() });
      }
      const { data } = await walletApi.solde();
      if (typeof data.balance === 'number') setBalance(data.balance);
      Alert.alert('Succès', modal === 'depot' ? 'Dépôt effectué.' : 'Retrait effectué.');
      closeModal();
    } catch (e) {
      Alert.alert('Erreur', getApiError(e));
    }
  };
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [soldeRes, lotsRes] = await Promise.all([walletApi.solde(), myLotsApi.list()]);
        if (typeof soldeRes.data.balance === 'number') setBalance(soldeRes.data.balance);
        const lots = lotsRes.data.lots ?? [];
        const series = lots.slice(-6).map((b) => Math.min(5000, (b.quantite ?? 0) * 100));
        while (series.length < 6) series.unshift(0);
        setChartData(series.slice(-6));
      } catch (e) {
        console.warn(getApiError(e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="dark-content" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerSubtitle}>Statistiques</Text>
            <Text style={styles.headerTitle}>Marché & Finance</Text>
          </View>
          <TouchableOpacity style={styles.notifBtn}>
            <MaterialCommunityIcons name="bell-outline" size={24} color="#1B5E20" />
          </TouchableOpacity>
        </View>

        <View style={styles.walletCard}>
          <View style={styles.walletTop}>
            <Text style={styles.walletLabel}>Solde total disponible</Text>
            <MaterialCommunityIcons name="wallet-outline" size={24} color="white" />
          </View>
          {loading ? (
            <ActivityIndicator color="white" style={{ marginVertical: 12 }} />
          ) : (
            <Text style={styles.walletBalance}>
              {(balance ?? 0).toLocaleString('fr-FR')} FCFA
            </Text>
          )}
          <View style={styles.walletActions}>
            <ActionBtn icon="plus-circle-outline" label="Dépôt" onPress={() => { setAmountStr('10000'); setModal('depot'); }} />
            <ActionBtn icon="minus-circle-outline" label="Retrait" onPress={() => { setAmountStr('5000'); setModal('retrait'); }} />
            <ActionBtn icon="swap-horizontal" label="Échange" onPress={() => Alert.alert('Bientôt', 'Fonctionnalité à venir.')} />
          </View>
        </View>

        <View style={styles.yieldSection}>
          <Text style={styles.sectionTitle}>Performance Annuelle</Text>
          <View style={styles.yieldCard}>
            <View>
              <Text style={styles.yieldValue}>+12.4%</Text>
              <Text style={styles.yieldSub}>Rendement net 2026</Text>
            </View>
            <View style={styles.yieldIconBg}>
              <MaterialCommunityIcons name="trending-up" size={30} color="#1B5E20" />
            </View>
          </View>
        </View>

        <View style={styles.chartSection}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Volumes lots (aperçu)</Text>
            <View style={styles.liveBadge}>
              <View style={styles.dot} />
              <Text style={styles.liveText}>API</Text>
            </View>
          </View>

          <LineChart
            data={{
              labels: ['M1', 'M2', 'M3', 'M4', 'M5', 'M6'],
              datasets: [{ data: chartData.map((v) => Math.max(0, v)) }],
            }}
            width={width - 40}
            height={200}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />
        </View>

        <View style={styles.historySection}>
          <View style={styles.historyHeader}>
            <Text style={styles.sectionTitle}>Transactions Récentes</Text>
            <TouchableOpacity>
              <Text style={styles.seeMore}>Voir tout</Text>
            </TouchableOpacity>
          </View>

          <TransactionItem title="Vente Lot #402" date="Aujourd'hui, 14:20" amount="+850 000" type="up" />
          <TransactionItem title="Achat Sacs Export" date="Hier, 09:15" amount="-120 000" type="down" />
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <Modal visible={modal !== null} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{modal === 'depot' ? 'Dépôt' : 'Retrait'}</Text>
            <Text style={styles.modalLabel}>Montant (FCFA)</Text>
            <TextInput
              style={styles.modalInput}
              keyboardType="decimal-pad"
              value={amountStr}
              onChangeText={setAmountStr}
            />
            <Text style={styles.modalLabel}>Code PIN</Text>
            <TextInput
              style={styles.modalInput}
              secureTextEntry
              keyboardType="number-pad"
              value={pinInput}
              onChangeText={setPinInput}
            />
            <View style={styles.modalRow}>
              <TouchableOpacity style={styles.modalBtnGhost} onPress={closeModal}>
                <Text>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtnPrimary} onPress={() => void submitWallet()}>
                <Text style={{ color: 'white', fontWeight: '700' }}>Confirmer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={[styles.bottomTab, { paddingBottom: insets.bottom || 5, height: 70 + (insets.bottom || 0) }]}>
        <TabItem icon="home-variant" label="Accueil" onPress={() => router.push('/(exportateur)/accueil')} />
        <TabItem icon="wallet" label="Portefeuille" onPress={() => router.push('/(exportateur)/portefeuille' as any)} />
        <TabItem icon="qrcode-scan" label="Scanner" onPress={() => router.push('/(exportateur)/scanner')} />
        <TabItem icon="package-variant-closed" label="Stock" onPress={() => router.push('/(exportateur)/stock')} />
        <TabItem icon="history" label="Historique" onPress={() => router.push('/(exportateur)/historique')} />
      </View>
    </SafeAreaView>
  );
}

const ActionBtn = ({ icon, label, onPress }: { icon: string; label: string; onPress?: () => void }) => (
  <TouchableOpacity style={styles.actionBtn} onPress={onPress}>
    <View style={styles.actionIconCircle}>
      <MaterialCommunityIcons name={icon as any} size={22} color="#1B5E20" />
    </View>
    <Text style={styles.actionLabel}>{label}</Text>
  </TouchableOpacity>
);

const TabItem = ({ icon, label, active = false, onPress }: any) => (
  <TouchableOpacity style={styles.tabItem} onPress={onPress}>
    <MaterialCommunityIcons name={icon} size={24} color={active ? '#1B5E20' : '#888'} />
    <Text style={[styles.tabLabel, { color: active ? '#1B5E20' : '#888' }]}>{label}</Text>
  </TouchableOpacity>
);

const TransactionItem = ({ title, date, amount, type }: any) => (
  <View style={styles.transactionRow}>
    <View style={[styles.transIcon, { backgroundColor: type === 'up' ? '#E8F5E9' : '#FFEBEE' }]}>
      <MaterialCommunityIcons
        name={type === 'up' ? 'arrow-bottom-left' : 'arrow-top-right'}
        size={20}
        color={type === 'up' ? '#1B5E20' : '#C62828'}
      />
    </View>
    <View style={{ flex: 1, marginLeft: 12 }}>
      <Text style={styles.transTitle}>{title}</Text>
      <Text style={styles.transDate}>{date}</Text>
    </View>
    <Text style={[styles.transAmount, { color: type === 'up' ? '#1B5E20' : '#C62828' }]}>{amount}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  scrollContent: { paddingBottom: 20 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    marginBottom: 20,
  },
  headerSubtitle: { fontSize: 12, color: '#888' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#1B5E20' },
  notifBtn: { padding: 8, backgroundColor: 'white', borderRadius: 12, elevation: 2 },
  walletCard: {
    marginHorizontal: 20,
    backgroundColor: '#1B5E20',
    borderRadius: 25,
    padding: 25,
    marginBottom: 25,
    elevation: 5,
  },
  walletTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  walletLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 13 },
  walletBalance: { color: 'white', fontSize: 32, fontWeight: 'bold', marginTop: 10 },
  walletActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 25 },
  actionBtn: { alignItems: 'center' },
  actionIconCircle: {
    width: 45,
    height: 45,
    borderRadius: 22,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  actionLabel: { color: 'white', fontSize: 11, fontWeight: '600' },
  yieldSection: { paddingHorizontal: 20, marginBottom: 25 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  yieldCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
  },
  yieldValue: { fontSize: 24, fontWeight: 'bold', color: '#1B5E20' },
  yieldSub: { color: '#888', fontSize: 12, marginTop: 4 },
  yieldIconBg: { width: 50, height: 50, borderRadius: 15, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center' },
  chartSection: { paddingHorizontal: 20, marginBottom: 25 },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  chartTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  liveBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F5E9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#1B5E20', marginRight: 6 },
  liveText: { fontSize: 10, color: '#1B5E20', fontWeight: 'bold' },
  chart: { marginVertical: 8, borderRadius: 16 },
  historySection: { paddingHorizontal: 20 },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  seeMore: { color: '#1B5E20', fontSize: 13, fontWeight: 'bold' },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 15,
    marginBottom: 10,
    elevation: 1,
  },
  transIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  transTitle: { fontWeight: 'bold', fontSize: 14, color: '#333' },
  transDate: { fontSize: 11, color: '#999', marginTop: 2 },
  transAmount: { fontWeight: 'bold', fontSize: 15 },
  bottomTab: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 85,
    backgroundColor: 'white',
    flexDirection: 'row',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    elevation: 20,
  },
  tabItem: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 5 },
  tabLabel: { fontSize: 10, marginTop: 5 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16, color: '#1B5E20' },
  modalLabel: { fontSize: 12, color: '#666', marginBottom: 6 },
  modalInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
    fontSize: 16,
  },
  modalRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 8 },
  modalBtnGhost: { paddingVertical: 10, paddingHorizontal: 16 },
  modalBtnPrimary: {
    backgroundColor: '#1B5E20',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
});
