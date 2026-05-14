import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator 
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Font from 'expo-font';

// Définition du type d'action pour le style
type ActionType = 'LOT_RECUE' | 'LOT_ENVOYE' | 'TRANSACTION' | 'PROFIL' | 'SAUVEGARDE';

interface HistoryItem {
  id: string;
  type: ActionType;
  titre: string;
  description: string;
  date: string;
  heure: string;
  montant?: string; // Optionnel pour les transactions
}

export default function HistoriqueScreen() {
  const router = useRouter();
  const [fontsLoaded, setFontsLoaded] = useState(false);

  // Données simulées (À remplacer par un appel SQLite ou API plus tard)
  const historyData: HistoryItem[] = [
    {
      id: '1',
      type: 'LOT_RECUE',
      titre: 'Lot Reçu',
      description: 'Réception de 50kg de cacao de Koffi Mensah',
      date: '12 Mai 2026',
      heure: '14:20',
    },
    {
      id: '2',
      type: 'TRANSACTION',
      titre: 'Paiement Effectué',
      description: 'Achat de lot groupé',
      date: '12 Mai 2026',
      heure: '10:05',
      montant: '-45.000 FCFA',
    },
    {
      id: '3',
      type: 'SAUVEGARDE',
      titre: 'Lot Sauvegardé',
      description: 'Brouillon de lot #TR-902 enregistré',
      date: '11 Mai 2026',
      heure: '18:45',
    },
    {
      id: '4',
      type: 'PROFIL',
      titre: 'Profil Modifié',
      description: 'Mise à jour du numéro de téléphone',
      date: '10 Mai 2026',
      heure: '09:15',
    },
    {
      id: '5',
      type: 'LOT_ENVOYE',
      titre: 'Lot Envoyé',
      description: 'Expédition de 200kg vers le port de Lomé',
      date: '09 Mai 2026',
      heure: '16:30',
    },
  ];

  useEffect(() => {
    async function loadFonts() {
      try {
        await Font.loadAsync({
          'Montserrat-Bold': require('../../assets/fonts/Montserrat-Bold.ttf'),
          'Montserrat-Regular': require('../../assets/fonts/Montserrat-Regular.ttf'),
        });
      } finally {
        setFontsLoaded(true);
      }
    }
    loadFonts();
  }, []);

  // Fonction pour obtenir l'icône et la couleur selon le type
  const getActionStyle = (type: ActionType) => {
    switch (type) {
      case 'LOT_RECUE': return { icon: 'package-down', color: '#2E7D32' };
      case 'LOT_ENVOYE': return { icon: 'truck-delivery', color: '#1565C0' };
      case 'TRANSACTION': return { icon: 'cash-multiple', color: '#F9A825' };
      case 'PROFIL': return { icon: 'account-cog', color: '#6A1B9A' };
      case 'SAUVEGARDE': return { icon: 'content-save-outline', color: '#546E7A' };
      default: return { icon: 'bell-outline', color: '#333' };
    }
  };

  const renderItem = ({ item }: { item: HistoryItem }) => {
    const style = getActionStyle(item.type);
    
    return (
      <View style={styles.historyCard}>
        <View style={[styles.iconContainer, { backgroundColor: style.color + '15' }]}>
          <MaterialCommunityIcons name={style.icon as any} size={24} color={style.color} />
        </View>
        
        <View style={styles.infoContainer}>
          <View style={styles.topRow}>
            <Text style={styles.actionTitle}>{item.titre}</Text>
            <Text style={styles.timeText}>{item.heure}</Text>
          </View>
          
          <Text style={styles.descriptionText} numberOfLines={2}>{item.description}</Text>
          
          <View style={styles.footerRow}>
            <Text style={styles.dateText}>{item.date}</Text>
            {item.montant && (
              <Text style={[styles.amountText, { color: item.montant.startsWith('-') ? '#C62828' : '#2E7D32' }]}>
                {item.montant}
              </Text>
            )}
          </View>
        </View>
      </View>
    );
  };

  if (!fontsLoaded) return <ActivityIndicator style={{ flex: 1 }} />;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="chevron-left" size={32} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Historique d'activités</Text>
        <View style={{ width: 32 }} />
      </View>

      <FlatList
        data={historyData}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="history" size={80} color="#DDD" />
            <Text style={styles.emptyText}>Aucune activité enregistrée</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1B5E20' },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
  },
  headerTitle: { color: 'white', fontSize: 20, fontFamily: 'Montserrat-Bold' },
  backBtn: { padding: 5 },
  listContent: { 
    padding: 20, 
    backgroundColor: '#F8F9FA', 
    borderTopLeftRadius: 30, 
    borderTopRightRadius: 30,
    flexGrow: 1,
    paddingBottom: 100 
  },
  historyCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 18,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: { flex: 1, marginLeft: 15 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  actionTitle: { fontSize: 16, fontFamily: 'Montserrat-Bold', color: '#333' },
  timeText: { fontSize: 12, color: '#999', fontFamily: 'Montserrat-Regular' },
  descriptionText: { fontSize: 14, color: '#666', fontFamily: 'Montserrat-Regular', marginVertical: 4 },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 5 },
  dateText: { fontSize: 12, color: '#BBB', fontFamily: 'Montserrat-Regular' },
  amountText: { fontSize: 14, fontFamily: 'Montserrat-Bold' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 },
  emptyText: { marginTop: 15, color: '#999', fontFamily: 'Montserrat-Regular' }
});