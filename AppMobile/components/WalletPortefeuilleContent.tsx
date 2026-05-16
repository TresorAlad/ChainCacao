import React, { useCallback, useEffect, useState, type ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Alert,
  TextInput,
  Modal,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { walletApi, getApiError } from '@/services/api';

const TX_STORAGE_KEY = 'user_transactions';
const SOLDE_STORAGE_KEY = 'user_solde';

export type WalletTransaction = {
  id: string;
  type: 'depot' | 'retrait';
  libelle: string;
  montant: number;
  date: string;
  heure: string;
  isSynced?: boolean;
};

type WalletModal = null | 'depot' | 'retrait';

function fmtFcfa(n: number) {
  return Math.round(n).toLocaleString('fr-FR');
}

type Props = {
  /** Sous-titre optionnel sous le solde (ex. rôle). */
  roleSubtitle?: string;
  showCreditBadge?: boolean;
  creditBadgeText?: string;
  /** Historique local AsyncStorage (agriculteur). */
  persistLocalHistory?: boolean;
  /** Contenu scrollable au-dessus de l’historique (onglets, etc.). */
  footer?: ReactNode;
  refreshControl?: boolean;
};

export function WalletPortefeuilleContent({
  roleSubtitle,
  showCreditBadge,
  creditBadgeText = 'Crédit démo 2 000 000 FCFA',
  persistLocalHistory = false,
  footer,
  refreshControl = true,
}: Props) {
  const [solde, setSolde] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [modal, setModal] = useState<WalletModal>(null);
  const [montant, setMontant] = useState('');
  const [pin, setPin] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadTransactions = useCallback(async () => {
    if (!persistLocalHistory) {
      setTransactions([]);
      return;
    }
    try {
      const raw = await AsyncStorage.getItem(TX_STORAGE_KEY);
      if (raw) setTransactions(JSON.parse(raw) as WalletTransaction[]);
    } catch {
      setTransactions([]);
    }
  }, [persistLocalHistory]);

  const fetchSolde = useCallback(async () => {
    try {
      const { data } = await walletApi.solde();
      if (typeof data.balance === 'number') {
        setSolde(data.balance);
        if (persistLocalHistory) {
          await AsyncStorage.setItem(SOLDE_STORAGE_KEY, JSON.stringify(data.balance));
        }
        return;
      }
    } catch {
      /* repli cache */
    }
    if (persistLocalHistory) {
      const saved = await AsyncStorage.getItem(SOLDE_STORAGE_KEY);
      if (saved) setSolde(JSON.parse(saved) as number);
    }
  }, [persistLocalHistory]);

  const refresh = useCallback(async () => {
    await Promise.all([fetchSolde(), loadTransactions()]);
    setRefreshing(false);
  }, [fetchSolde, loadTransactions]);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      await refresh();
      setLoading(false);
    })();
  }, [refresh]);

  const closeModal = () => {
    setModal(null);
    setMontant('');
    setPin('');
  };

  const pushLocalTx = async (tx: WalletTransaction) => {
    if (!persistLocalHistory) return;
    const next = [tx, ...transactions.filter((t) => t.id !== '1' || tx.id === '1')];
    setTransactions(next);
    await AsyncStorage.setItem(TX_STORAGE_KEY, JSON.stringify(next));
  };

  const openModal = (kind: 'depot' | 'retrait') => {
    setMontant('');
    setPin('');
    setModal(kind);
  };

  const submitAction = async () => {
    const m = parseFloat(montant.replace(',', '.'));
    if (!pin.trim()) {
      Alert.alert('Code PIN', 'Saisissez votre code PIN pour confirmer.');
      return;
    }
    if (!m || m <= 0) {
      Alert.alert('Montant invalide', 'Entrez un montant positif.');
      return;
    }
    if (modal === 'retrait' && solde != null && solde < m) {
      Alert.alert('Solde insuffisant', 'Vous n’avez pas assez de fonds.');
      return;
    }
    setSubmitting(true);
    try {
      const payload = { montant: m, pin: pin.trim() };
      const { data } =
        modal === 'depot' ? await walletApi.depot(payload) : await walletApi.retrait(payload);
      const now = new Date();
      await pushLocalTx({
        id: String(Date.now()),
        type: modal === 'depot' ? 'depot' : 'retrait',
        libelle: data.message ?? (modal === 'depot' ? 'Dépôt' : 'Retrait'),
        montant: modal === 'depot' ? m : -m,
        date: now.toLocaleDateString('fr-FR'),
        heure: now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        isSynced: true,
      });
      await fetchSolde();
      Alert.alert('Succès', modal === 'depot' ? 'Dépôt effectué.' : 'Retrait effectué.');
      closeModal();
    } catch (e) {
      Alert.alert('Erreur', getApiError(e));
    } finally {
      setSubmitting(false);
    }
  };

  const listHeader = (
    <>
      <View style={styles.soldeCard}>
        <Text style={styles.soldeLabel}>Solde disponible</Text>
        {loading ? (
          <ActivityIndicator color="white" style={{ marginTop: 12 }} />
        ) : (
          <Text style={styles.soldeValue}>
            {solde !== null ? `${fmtFcfa(solde)} FCFA` : '— FCFA'}
          </Text>
        )}
        {roleSubtitle ? <Text style={styles.soldeSub}>{roleSubtitle}</Text> : null}
        {showCreditBadge ? (
          <View style={styles.creditBadge}>
            <MaterialCommunityIcons name="shield-check" size={14} color="#A5D6A7" />
            <Text style={styles.creditBadgeText}>{creditBadgeText}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity style={[styles.actionChip, styles.depotChip]} onPress={() => openModal('depot')}>
          <MaterialCommunityIcons name="plus-circle" size={22} color="#1B5E20" />
          <Text style={styles.depotChipText}>Dépôt</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionChip, styles.retraitChip]} onPress={() => openModal('retrait')}>
          <MaterialCommunityIcons name="minus-circle" size={22} color="#C62828" />
          <Text style={styles.retraitChipText}>Retrait</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Historique des transactions</Text>
    </>
  );

  return (
    <>
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={
          <Text style={styles.emptyHistory}>
            {persistLocalHistory
              ? 'Aucune transaction pour le moment.'
              : 'Les dépôts et retraits apparaîtront ici après confirmation.'}
          </Text>
        }
        renderItem={({ item }) => (
          <View style={styles.transactionItem}>
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: item.type === 'depot' ? '#E8F5E9' : '#FFEBEE' },
              ]}
            >
              <MaterialCommunityIcons
                name={item.type === 'depot' ? 'arrow-bottom-left' : 'arrow-top-right'}
                size={20}
                color={item.type === 'depot' ? '#2E7D32' : '#C62828'}
              />
            </View>
            <View style={styles.txInfo}>
              <Text style={styles.txLibelle}>{item.libelle}</Text>
              <Text style={styles.txDate}>
                {item.date} à {item.heure}
              </Text>
            </View>
            <Text
              style={[styles.txMontant, { color: item.type === 'depot' ? '#2E7D32' : '#C62828' }]}
            >
              {item.montant >= 0 ? '+' : ''}
              {fmtFcfa(Math.abs(item.montant))} FCFA
            </Text>
          </View>
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          refreshControl ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                void refresh();
              }}
              colors={['#2E7D32']}
            />
          ) : undefined
        }
      />

      {footer}

      <Modal visible={modal !== null} transparent animationType="fade" onRequestClose={closeModal}>
        <View style={styles.modalBackdrop}>
          <ScrollView contentContainerStyle={styles.modalScroll} keyboardShouldPersistTaps="handled">
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>{modal === 'depot' ? 'Dépôt' : 'Retrait'}</Text>
              <Text style={styles.modalHint}>Saisissez le montant et votre code PIN.</Text>
              <Text style={styles.modalLabel}>Montant (FCFA)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Ex. 10000"
                placeholderTextColor="#999"
                keyboardType="decimal-pad"
                value={montant}
                onChangeText={setMontant}
              />
              <Text style={styles.modalLabel}>Code PIN</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="••••"
                placeholderTextColor="#999"
                secureTextEntry
                keyboardType="number-pad"
                maxLength={6}
                value={pin}
                onChangeText={(t) => setPin(t.replace(/\D/g, '').slice(0, 6))}
              />
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.modalBtnGhost} onPress={closeModal} disabled={submitting}>
                  <Text style={styles.modalBtnGhostText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalBtnPrimary, modal === 'retrait' && styles.modalBtnRetrait]}
                  onPress={() => void submitAction()}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <Text style={styles.modalBtnPrimaryText}>Confirmer</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  listContent: { padding: 16, paddingBottom: 100 },
  soldeCard: {
    backgroundColor: '#1B5E20',
    borderRadius: 20,
    padding: 22,
    alignItems: 'center',
    marginBottom: 16,
  },
  soldeLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 14, fontFamily: 'Montserrat-Regular' },
  soldeValue: { color: 'white', fontSize: 30, fontFamily: 'Montserrat-Bold', marginTop: 8 },
  soldeSub: { color: 'rgba(255,255,255,0.65)', fontSize: 12, marginTop: 6, fontFamily: 'Montserrat-Regular' },
  creditBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 12,
    gap: 6,
  },
  creditBadgeText: { color: '#A5D6A7', fontSize: 12, fontFamily: 'Montserrat-Regular' },
  actionsRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  actionChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  depotChip: { borderColor: '#C8E6C9' },
  retraitChip: { borderColor: '#FFCDD2' },
  depotChipText: { fontFamily: 'Montserrat-Bold', color: '#1B5E20', fontSize: 15 },
  retraitChipText: { fontFamily: 'Montserrat-Bold', color: '#C62828', fontSize: 15 },
  sectionTitle: {
    fontSize: 17,
    fontFamily: 'Montserrat-Bold',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  emptyHistory: {
    textAlign: 'center',
    color: '#888',
    fontFamily: 'Montserrat-Regular',
    fontSize: 14,
    paddingVertical: 24,
  },
  transactionItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  txInfo: { flex: 1, marginLeft: 12 },
  txLibelle: { fontFamily: 'Montserrat-Bold', fontSize: 14, color: '#333' },
  txDate: { fontFamily: 'Montserrat-Regular', fontSize: 11, color: '#999', marginTop: 2 },
  txMontant: { fontFamily: 'Montserrat-Bold', fontSize: 14 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: 20,
  },
  modalScroll: { flexGrow: 1, justifyContent: 'center' },
  modalCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: { fontSize: 20, fontFamily: 'Montserrat-Bold', color: '#1B5E20', marginBottom: 4 },
  modalHint: { fontSize: 13, color: '#666', fontFamily: 'Montserrat-Regular', marginBottom: 16 },
  modalLabel: { fontSize: 12, fontFamily: 'Montserrat-Bold', color: '#444', marginBottom: 6 },
  modalInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    fontSize: 16,
    fontFamily: 'Montserrat-Regular',
    color: '#111',
  },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  modalBtnGhost: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#F5F5F5',
  },
  modalBtnGhostText: { fontFamily: 'Montserrat-Bold', color: '#555' },
  modalBtnPrimary: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#2E7D32',
  },
  modalBtnRetrait: { backgroundColor: '#C62828' },
  modalBtnPrimaryText: { color: 'white', fontFamily: 'Montserrat-Bold' },
});
