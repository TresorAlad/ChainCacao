import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';

type Props = {
  visible: boolean;
  downloading: boolean;
  onUpdate: () => void;
  onLater?: () => void;
};

/** Popup bloquant de mise à jour OTA (style application de paris). */
export default function UpdateModal({ visible, downloading, onUpdate, onLater }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Image
            source={require('@/assets/images/app-icon.png')}
            style={styles.icon}
            resizeMode="contain"
          />
          <Text style={styles.title}>Mise à jour disponible</Text>
          <Text style={styles.body}>
            Une nouvelle version de ChainCacao est prête. Installez-la maintenant pour profiter des
            dernières améliorations et corrections.
          </Text>
          <TouchableOpacity
            style={[styles.button, downloading && styles.buttonDisabled]}
            onPress={onUpdate}
            disabled={downloading}
            activeOpacity={0.85}
          >
            {downloading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Mettre à jour maintenant</Text>
            )}
          </TouchableOpacity>
          {onLater && !downloading ? (
            <TouchableOpacity style={styles.laterBtn} onPress={onLater} activeOpacity={0.85}>
              <Text style={styles.laterText}>Plus tard</Text>
            </TouchableOpacity>
          ) : null}
          {downloading ? (
            <Text style={styles.hint}>Téléchargement en cours… Ne fermez pas l’application.</Text>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    elevation: 8,
  },
  icon: {
    width: 72,
    height: 72,
    marginBottom: 16,
    borderRadius: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1B5E20',
    marginBottom: 12,
    textAlign: 'center',
  },
  body: {
    fontSize: 15,
    color: '#424242',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#2E7D32',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.85,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  hint: {
    marginTop: 12,
    fontSize: 13,
    color: '#757575',
  },
  laterBtn: { marginTop: 14, paddingVertical: 10 },
  laterText: { fontSize: 15, color: '#757575', fontWeight: '600' },
});
