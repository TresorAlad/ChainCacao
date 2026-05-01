import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLots } from '@/hooks/use-storage';
import { useAuth } from '@/hooks/use-auth';

function formatMemberSince(iso?: string): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}

export default function ProfileScreen() {
  const router = useRouter();
  const { lots } = useLots();
  const { logout, user, updateProfile } = useAuth();

  const [editOpen, setEditOpen] = useState(false);
  const [draftNom, setDraftNom] = useState('');
  const [draftGps, setDraftGps] = useState('');
  const [draftSurface, setDraftSurface] = useState('');

  useEffect(() => {
    if (!editOpen || !user) return;
    setDraftNom(user.nom || user.name || '');
    setDraftGps(user.gps_location || '');
    setDraftSurface(user.field_surface || '');
  }, [editOpen, user]);

  const openEdit = () => setEditOpen(true);

  const saveEdit = async () => {
    if (!draftNom.trim()) {
      Alert.alert('Nom requis', 'Indiquez au moins votre nom.');
      return;
    }
    await updateProfile({
      nom: draftNom.trim(),
      name: draftNom.trim(),
      gps_location: draftGps.trim() || undefined,
      field_surface: draftSurface.trim() || undefined,
    });
    setEditOpen(false);
  };

  const defaultHistoryLotId =
    lots.find((l) => l.synced)?.id ?? lots[0]?.id ?? '';

  const surfaceDisplay =
    user?.field_surface?.trim() ?
      `${user.field_surface.trim()} ha` :
      'Non renseignée';

  const userData = {
    nom: user?.nom || user?.name || 'Agriculteur',
    role: user?.role || 'Producteur de Cacao',
    localisation: user?.gps_location?.trim() || 'Non renseignée',
    surface: surfaceDisplay,
    dateInscription: formatMemberSince(user?.created_at),
  };

  const nbLots = lots.length;
  const nbSync = lots.filter(l => l.synced).length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient colors={['#1B5E20', '#2E7D32']} style={styles.header}>
        <Text style={styles.headerTitle}>Mon Profil</Text>
        <TouchableOpacity style={styles.editButton} onPress={openEdit} accessibilityLabel="Modifier le profil">
          <MaterialCommunityIcons name="account-edit" size={26} color="white" />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <MaterialCommunityIcons name="account" size={80} color="#2E7D32" />
          </View>
          <Text style={styles.userName}>{userData.nom}</Text>
          <Text style={styles.userRole}>{userData.role}</Text>
        </View>

        {/* Statistiques */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{nbLots}</Text>
            <Text style={styles.statLbl}>Lots créés</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statNum, { color: '#2E7D32' }]}>{nbSync}</Text>
            <Text style={styles.statLbl}>Confirmés</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statNum, { color: '#F9A825' }]}>{nbLots - nbSync}</Text>
            <Text style={styles.statLbl}>En attente</Text>
          </View>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Informations de l'exploitation</Text>

          <InfoCard
            icon="map-marker-radius"
            label="Localisation (GPS)"
            value={userData.localisation}
          />
          <InfoCard
            icon="texture-box"
            label="Surface exploitée"
            value={userData.surface}
          />
          <InfoCard
            icon="calendar-check"
            label={'Membre depuis (date d\u2019inscription)'}
            value={userData.dateInscription}
          />
        </View>

        <Modal visible={editOpen} animationType="slide" transparent onRequestClose={() => setEditOpen(false)}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalBackdrop}
          >
            <TouchableOpacity style={styles.modalBackdropTouchable} activeOpacity={1} onPress={() => setEditOpen(false)} />
            <View style={styles.modalSheet}>
              <Text style={styles.modalTitle}>Modifier mon profil</Text>
              <Text style={styles.modalHint}>
                Ces informations correspondent à votre inscription (localisation, surface). La date « Membre depuis » reste celle de votre première inscription sur cet appareil.
              </Text>

              <Text style={styles.inputLbl}>Nom complet</Text>
              <TextInput
                style={styles.modalInput}
                value={draftNom}
                onChangeText={setDraftNom}
                placeholder="Nom et prénom"
              />

              <Text style={styles.inputLbl}>Localisation (GPS ou lieu)</Text>
              <TextInput
                style={styles.modalInput}
                value={draftGps}
                onChangeText={setDraftGps}
                placeholder="Ex: 6.9123, 0.5123"
              />

              <Text style={styles.inputLbl}>Surface exploitée (hectares)</Text>
              <TextInput
                style={styles.modalInput}
                value={draftSurface}
                onChangeText={setDraftSurface}
                placeholder="Ex: 2.5"
                keyboardType="decimal-pad"
              />

              <View style={styles.modalActions}>
                <TouchableOpacity style={[styles.modalBtn, styles.modalBtnGhost]} onPress={() => setEditOpen(false)}>
                  <Text style={styles.modalBtnGhostText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalBtn, styles.modalBtnPrimary]} onPress={saveEdit}>
                  <Text style={styles.modalBtnPrimaryText}>Enregistrer</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* Actions */}
        <View style={styles.actionsSection}>
          <ActionRow
            icon="history"
            label="Voir l'historique complet"
            onPress={() =>
              router.push(
                defaultHistoryLotId ?
                  { pathname: '/historique', params: { lotId: defaultHistoryLotId } } :
                  '/historique'
              )
            }
          />
          <ActionRow
            icon="transfer"
            label="Transférer un lot"
            onPress={() => router.push('/transfert')}
          />
          <ActionRow
            icon="shield-check"
            label="Vérifier un lot (public)"
            onPress={() => router.push('/historique')}
          />
        </View>

        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={async () => {
            await logout();
            router.replace('/login');
          }}
        >
          <MaterialCommunityIcons name="logout" size={20} color="#C62828" />
          <Text style={styles.logoutText}>Déconnexion</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const InfoCard = ({ icon, label, value, subValue }: any) => (
  <View style={styles.infoCard}>
    <View style={styles.iconCircle}>
      <MaterialCommunityIcons name={icon as any} size={22} color="#2E7D32" />
    </View>
    <View style={styles.infoTexts}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
      {subValue && <Text style={styles.infoSubValue}>{subValue}</Text>}
    </View>
  </View>
);

const ActionRow = ({ icon, label, onPress }: any) => (
  <TouchableOpacity style={styles.actionRow} onPress={onPress}>
    <MaterialCommunityIcons name={icon} size={22} color="#2E7D32" />
    <Text style={styles.actionLabel}>{label}</Text>
    <MaterialCommunityIcons name="chevron-right" size={22} color="#CCC" />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1B5E20' },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  headerTitle: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  editButton: { padding: 5 },
  body: { flex: 1, backgroundColor: '#F8F9FA', borderTopLeftRadius: 30, borderTopRightRadius: 30 },
  profileHeader: { alignItems: 'center', marginTop: 30, marginBottom: 20 },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    marginBottom: 15,
  },
  userName: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  userRole: { fontSize: 16, color: '#666', marginTop: 5 },
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 15,
    elevation: 2,
  },
  statBox: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  statLbl: { fontSize: 11, color: '#999', marginTop: 4 },
  infoSection: { paddingHorizontal: 20, marginTop: 5 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#999',
    textTransform: 'uppercase',
    marginBottom: 12,
    marginLeft: 5,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
    alignItems: 'center',
    elevation: 1,
  },
  iconCircle: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoTexts: { marginLeft: 15, flex: 1 },
  infoLabel: { fontSize: 12, color: '#888' },
  infoValue: { fontSize: 16, fontWeight: 'bold', color: '#333', marginTop: 2 },
  infoSubValue: { fontSize: 12, color: '#2E7D32', marginTop: 2 },
  actionsSection: { paddingHorizontal: 20, marginTop: 10, marginBottom: 5 },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 14,
    padding: 15,
    marginBottom: 10,
    elevation: 1,
  },
  actionLabel: { flex: 1, marginLeft: 12, fontSize: 15, color: '#333', fontWeight: '500' },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 20,
    padding: 15,
    borderRadius: 15,
    backgroundColor: '#FFEBEE',
    gap: 8,
  },
  logoutText: { color: '#C62828', fontWeight: 'bold', fontSize: 16 },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  modalBackdropTouchable: { flex: 1 },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 34,
    maxHeight: '85%',
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1B5E20', marginBottom: 8 },
  modalHint: { fontSize: 12, color: '#666', marginBottom: 16, lineHeight: 18 },
  inputLbl: { fontSize: 12, fontWeight: 'bold', color: '#555', marginBottom: 6, marginTop: 10 },
  modalInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FAFAFA',
  },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 22 },
  modalBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  modalBtnGhost: { backgroundColor: '#EEE' },
  modalBtnGhostText: { fontWeight: 'bold', color: '#555' },
  modalBtnPrimary: { backgroundColor: '#2E7D32' },
  modalBtnPrimaryText: { fontWeight: 'bold', color: '#fff' },
});
