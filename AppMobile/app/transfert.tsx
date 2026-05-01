import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, Stack, useLocalSearchParams, Redirect } from 'expo-router';
import { useLots } from '@/hooks/use-storage';
import { useAuth } from '@/hooks/use-auth';
import { actorsApi, batchApi, ActorInfo, getApiError, isNetworkError } from '@/services/api';

/** Alignés sur les IDs seed SQL si l’API est hors ligne */
const FALLBACK_ACTORS: ActorInfo[] = [
  { id: 'actor-coop-001', nom: 'Cooperative Plateaux', role: 'cooperative', org_id: 'CooperativeMSP' },
  { id: 'actor-trans-001', nom: 'Usine Cacao Plus', role: 'transformateur', org_id: 'TransformateurMSP' },
  { id: 'actor-dist-001', nom: 'Distrib Export SA', role: 'distributeur', org_id: 'DistributeurMSP' },
];

export default function TransfertScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { lots, updateLot } = useLots();
  const { initialized, isAuthenticated } = useAuth();

  const [actors, setActors] = useState<ActorInfo[]>(FALLBACK_ACTORS);
  const [loadingActors, setLoadingActors] = useState(false);
  const [selectedLotId, setSelectedLotId] = useState((params.lotId as string) || '');
  const [selectedActorId, setSelectedActorId] = useState('');
  const [commentaire, setCommentaire] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'lot' | 'acteur' | 'confirm'>('lot');
  const [lotSearch, setLotSearch] = useState('');

  const foundLot = lots.find(l => l.id === selectedLotId || l.title === selectedLotId);
  const selectedActor = actors.find(a => a.id === selectedActorId);

  // Charger la liste des acteurs depuis l'API
  useEffect(() => {
    (async () => {
      setLoadingActors(true);
      try {
        const { data } = await actorsApi.list();
        const list = data?.actors ?? [];
        if (list.length > 0) setActors(list);
      } catch (_) {
        // Utiliser la liste statique si l'API est indisponible
      } finally {
        setLoadingActors(false);
      }
    })();
  }, []);

  const filteredLots = lots.filter(l =>
    lotSearch === '' ||
    l.title.toLowerCase().includes(lotSearch.toLowerCase()) ||
    l.id.toLowerCase().includes(lotSearch.toLowerCase())
  );

  const handleTransfer = () => {
    if (!foundLot || !selectedActor) return;

    Alert.alert(
      'Confirmer le transfert',
      `Transférer "${foundLot.title}" vers "${selectedActor.nom || selectedActor.name}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Confirmer', onPress: doTransfer },
      ]
    );
  };

  const doTransfer = async () => {
    if (!foundLot || !selectedActor) return;
    setLoading(true);

    const actorName = selectedActor.nom || selectedActor.name || selectedActor.id;
    const toActorId = selectedActor.id;

    // 1. Mettre à jour localement immédiatement
    await updateLot(foundLot.id, {
      destination: actorName,
      acheteur: actorName,
      status: 'En cours',
      synced: false,
    });

    // 2. Tenter l'appel API
    try {
      const { data } = await batchApi.transfer({
        batch_id: foundLot.id,
        to_actor_id: toActorId,
        commentaire: commentaire.trim() || undefined,
      });

      await updateLot(foundLot.id, { synced: true });

      setLoading(false);
      const tx = data.tx_hash || '';
      Alert.alert(
        'Transfert confirmé ✓',
        `Lot "${foundLot.title}" transféré vers "${actorName}".\n\nHash blockchain: ${tx || '—'}`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (e) {
      setLoading(false);

      if (isNetworkError(e)) {
        Alert.alert(
          'Transfert enregistré hors-ligne',
          `Le transfert de "${foundLot.title}" vers "${actorName}" sera synchronisé sur Hyperledger Fabric à la reconnexion.`,
          [{ text: 'OK', onPress: () => router.back() }]
        );
      } else {
        Alert.alert('Erreur API', getApiError(e));
      }
    }
  };

  if (!initialized) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.authGate}>
          <ActivityIndicator size="large" color="#2E7D32" />
        </View>
      </SafeAreaView>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      <LinearGradient colors={['#1B5E20', '#2E7D32', '#43A047']} style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={28} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transférer un lot</Text>
        <View style={{ width: 38 }} />
      </LinearGradient>

      {/* Indicateur d'étapes */}
      <View style={styles.stepBar}>
        <StepDot active={step === 'lot'} done={step !== 'lot'} label="Lot" num={1} />
        <View style={styles.stepLine} />
        <StepDot active={step === 'acteur'} done={step === 'confirm'} label="Destinataire" num={2} />
        <View style={styles.stepLine} />
        <StepDot active={step === 'confirm'} done={false} label="Confirmation" num={3} />
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ÉTAPE 1 : Sélection du lot */}
        {step === 'lot' && (
          <View>
            <Text style={styles.stepTitle}>Quel lot souhaitez-vous transférer ?</Text>

            <View style={styles.searchRow}>
              <MaterialCommunityIcons name="magnify" size={20} color="#999" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.searchInput}
                placeholder="Rechercher par référence..."
                value={lotSearch}
                onChangeText={setLotSearch}
              />
            </View>

            {filteredLots.length === 0 ? (
              <View style={styles.emptyBox}>
                <MaterialCommunityIcons name="clipboard-text-outline" size={50} color="#CCC" />
                <Text style={styles.emptyText}>Aucun lot disponible</Text>
              </View>
            ) : (
              filteredLots.map(lot => (
                <TouchableOpacity
                  key={lot.id}
                  style={[styles.lotCard, selectedLotId === lot.id && styles.lotCardSelected]}
                  onPress={() => setSelectedLotId(lot.id)}
                >
                  <View style={styles.lotCardLeft}>
                    <MaterialCommunityIcons
                      name={selectedLotId === lot.id ? 'check-circle' : 'circle-outline'}
                      size={22}
                      color={selectedLotId === lot.id ? '#2E7D32' : '#CCC'}
                    />
                    <View style={{ marginLeft: 12 }}>
                      <Text style={styles.lotCardTitle}>{lot.title}</Text>
                      <Text style={styles.lotCardSub}>{lot.date} · {lot.poids} kg</Text>
                    </View>
                  </View>
                  <StatusBadge status={lot.status} />
                </TouchableOpacity>
              ))
            )}

            <TouchableOpacity
              style={[styles.nextBtn, !selectedLotId && styles.nextBtnDisabled]}
              onPress={() => selectedLotId && setStep('acteur')}
              disabled={!selectedLotId}
            >
              <Text style={styles.nextBtnText}>Suivant</Text>
              <MaterialCommunityIcons name="arrow-right" size={20} color="white" />
            </TouchableOpacity>
          </View>
        )}

        {/* ÉTAPE 2 : Sélection de l'acteur */}
        {step === 'acteur' && (
          <View>
            <Text style={styles.stepTitle}>À qui transférer ce lot ?</Text>

            {foundLot && (
              <View style={styles.selectedLotBadge}>
                <MaterialCommunityIcons name="package-variant" size={16} color="#2E7D32" />
                <Text style={styles.selectedLotBadgeText}>{foundLot.title} · {foundLot.poids} kg</Text>
              </View>
            )}

            {loadingActors && (
              <ActivityIndicator color="#2E7D32" style={{ marginVertical: 15 }} />
            )}

            {!loadingActors && actors.map(actor => (
              <TouchableOpacity
                key={actor.id}
                style={[styles.actorCard, selectedActorId === actor.id && styles.actorCardSelected]}
                onPress={() => setSelectedActorId(actor.id)}
              >
                <MaterialCommunityIcons
                  name={selectedActorId === actor.id ? 'check-circle' : 'circle-outline'}
                  size={22}
                  color={selectedActorId === actor.id ? '#2E7D32' : '#CCC'}
                />
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text style={styles.actorName}>{actor.nom || actor.name || actor.id}</Text>
                  <Text style={styles.actorRole}>
                    {actor.role} · {actor.orgID || actor.org_id || '—'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}

            <Text style={styles.fieldLabel}>Commentaire (optionnel)</Text>
            <TextInput
              style={styles.commentInput}
              placeholder="Ex: Livraison entrepôt Lomé"
              value={commentaire}
              onChangeText={setCommentaire}
              multiline
              numberOfLines={3}
            />

            <View style={styles.rowBtns}>
              <TouchableOpacity style={styles.backStepBtn} onPress={() => setStep('lot')}>
                <MaterialCommunityIcons name="arrow-left" size={20} color="#2E7D32" />
                <Text style={styles.backStepText}>Retour</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.nextBtn, { flex: 1 }, !selectedActorId && styles.nextBtnDisabled]}
                onPress={() => selectedActorId && setStep('confirm')}
                disabled={!selectedActorId}
              >
                <Text style={styles.nextBtnText}>Suivant</Text>
                <MaterialCommunityIcons name="arrow-right" size={20} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ÉTAPE 3 : Confirmation */}
        {step === 'confirm' && foundLot && selectedActor && (
          <View>
            <Text style={styles.stepTitle}>Vérifiez et confirmez</Text>

            <View style={styles.confirmCard}>
              <ConfirmRow icon="package-variant" label="Lot" value={foundLot.title} />
              <ConfirmRow icon="weight-kilogram" label="Quantité" value={`${foundLot.poids} kg`} />
              <ConfirmRow icon="account-arrow-right" label="Destinataire" value={selectedActor.nom || selectedActor.name || selectedActor.id} />
              <ConfirmRow icon="office-building" label="Organisation" value={selectedActor.orgID || selectedActor.org_id || '—'} />
              {commentaire ? (
                <ConfirmRow icon="comment-text" label="Commentaire" value={commentaire} />
              ) : null}
            </View>

            <View style={styles.signatureNote}>
              <MaterialCommunityIcons name="shield-lock" size={18} color="#1565C0" />
              <Text style={styles.signatureText}>
                La transaction sera signée avec votre JWT et enregistrée via POST /api/v1/batch/transfer sur Hyperledger Fabric.
              </Text>
            </View>

            <View style={styles.rowBtns}>
              <TouchableOpacity style={styles.backStepBtn} onPress={() => setStep('acteur')}>
                <MaterialCommunityIcons name="arrow-left" size={20} color="#2E7D32" />
                <Text style={styles.backStepText}>Retour</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtn, { flex: 1 }]}
                onPress={handleTransfer}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="check-circle" size={20} color="white" />
                    <Text style={styles.confirmBtnText}>Confirmer le transfert</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const StepDot = ({ active, done, label, num }: any) => (
  <View style={stepStyles.wrap}>
    <View style={[stepStyles.dot, active && stepStyles.dotActive, done && stepStyles.dotDone]}>
      {done ? (
        <MaterialCommunityIcons name="check" size={14} color="white" />
      ) : (
        <Text style={[stepStyles.num, active && { color: 'white' }]}>{num}</Text>
      )}
    </View>
    <Text style={[stepStyles.label, active && stepStyles.labelActive]}>{label}</Text>
  </View>
);
const stepStyles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  dot: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#EEE', justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  dotActive: { backgroundColor: '#2E7D32' },
  dotDone: { backgroundColor: '#4CAF50' },
  num: { fontSize: 13, fontWeight: 'bold', color: '#999' },
  label: { fontSize: 10, color: '#999' },
  labelActive: { color: '#2E7D32', fontWeight: 'bold' },
});

const ConfirmRow = ({ icon, label, value }: any) => (
  <View style={confirmStyles.row}>
    <MaterialCommunityIcons name={icon} size={20} color="#2E7D32" />
    <Text style={confirmStyles.label}>{label}</Text>
    <Text style={confirmStyles.value}>{value}</Text>
  </View>
);
const confirmStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0', gap: 10 },
  label: { color: '#888', fontSize: 13, width: 90 },
  value: { flex: 1, fontSize: 15, color: '#333', fontWeight: '500' },
});

const StatusBadge = ({ status }: { status: string }) => {
  let color = '#666';
  if (status === 'Terminé') color = '#2E7D32';
  if (status === 'En cours') color = '#F9A825';
  if (status === 'Problème') color = '#C62828';
  return (
    <View style={[badgeStyles.wrap, { backgroundColor: color + '20', borderColor: color }]}>
      <Text style={[badgeStyles.text, { color }]}>{status}</Text>
    </View>
  );
};
const badgeStyles = StyleSheet.create({
  wrap: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  text: { fontSize: 10, fontWeight: 'bold' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1B5E20' },
  authGate: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FA' },
  header: { height: 70, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 },
  headerTitle: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  backBtn: { padding: 5 },
  stepBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30, paddingVertical: 12, backgroundColor: 'white' },
  stepLine: { flex: 1, height: 2, backgroundColor: '#E0E0E0', marginBottom: 20 },
  body: { flex: 1, backgroundColor: '#F8F9FA' },
  scrollContent: { padding: 20, paddingBottom: 50 },
  stepTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 20 },
  searchRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 12, paddingHorizontal: 12, marginBottom: 15, borderWidth: 1, borderColor: '#E0E0E0' },
  searchInput: { flex: 1, padding: 13, fontSize: 15 },
  lotCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'white', borderRadius: 14, padding: 15, marginBottom: 10, borderWidth: 2, borderColor: 'transparent', elevation: 1 },
  lotCardSelected: { borderColor: '#2E7D32' },
  lotCardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  lotCardTitle: { fontSize: 15, fontWeight: 'bold', color: '#333' },
  lotCardSub: { fontSize: 12, color: '#999', marginTop: 2 },
  actorCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 14, padding: 15, marginBottom: 10, borderWidth: 2, borderColor: 'transparent', elevation: 1 },
  actorCardSelected: { borderColor: '#2E7D32' },
  actorName: { fontSize: 15, fontWeight: 'bold', color: '#333' },
  actorRole: { fontSize: 12, color: '#999', marginTop: 2 },
  fieldLabel: { fontSize: 12, fontWeight: 'bold', color: '#666', textTransform: 'uppercase', marginTop: 15, marginBottom: 8 },
  commentInput: { backgroundColor: 'white', borderRadius: 12, padding: 14, fontSize: 15, borderWidth: 1, borderColor: '#E0E0E0', textAlignVertical: 'top' },
  nextBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#2E7D32', borderRadius: 14, padding: 16, marginTop: 20, gap: 8 },
  nextBtnDisabled: { backgroundColor: '#A5D6A7' },
  nextBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  confirmBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1B5E20', borderRadius: 14, padding: 16, marginTop: 20, gap: 8 },
  confirmBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  backStepBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F5E9', borderRadius: 14, padding: 16, marginTop: 20, marginRight: 10, gap: 6 },
  backStepText: { color: '#2E7D32', fontWeight: 'bold' },
  rowBtns: { flexDirection: 'row', alignItems: 'flex-end' },
  selectedLotBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F5E9', borderRadius: 10, padding: 10, marginBottom: 15, gap: 8 },
  selectedLotBadgeText: { color: '#2E7D32', fontSize: 14, fontWeight: '600' },
  confirmCard: { backgroundColor: 'white', borderRadius: 18, padding: 20, marginBottom: 15, elevation: 2 },
  signatureNote: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E3F2FD', borderRadius: 12, padding: 12, gap: 10, marginBottom: 10 },
  signatureText: { flex: 1, fontSize: 12, color: '#1565C0', lineHeight: 18 },
  emptyBox: { alignItems: 'center', padding: 30 },
  emptyText: { color: '#999', marginTop: 10 },
});
