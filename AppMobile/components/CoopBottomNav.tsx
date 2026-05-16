import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type CoopTabId = 'accueil' | 'scanner' | 'lots' | 'historique' | 'profil';

const TABS: { id: CoopTabId; icon: keyof typeof MaterialCommunityIcons.glyphMap; label: string; href: string }[] = [
  { id: 'accueil', icon: 'home-variant', label: 'Accueil', href: '/(cooperative)/accueil' },
  { id: 'scanner', icon: 'qrcode-scan', label: 'Scanner', href: '/(cooperative)/scanner' },
  { id: 'lots', icon: 'package-variant-closed', label: 'Lots', href: '/(cooperative)/lot' },
  { id: 'historique', icon: 'chart-timeline-variant', label: 'Historique', href: '/(cooperative)/historique' },
  { id: 'profil', icon: 'account', label: 'Profil', href: '/(cooperative)/profil' },
];

const brandGreen = '#2E7D32';

function resolveActiveTab(pathname: string): CoopTabId {
  if (pathname.includes('/scanner')) return 'scanner';
  if (pathname.includes('/lot') || pathname.includes('/lots_recus') || pathname.includes('/generation_liste')) {
    return 'lots';
  }
  if (pathname.includes('/historique')) return 'historique';
  if (pathname.includes('/profil')) return 'profil';
  return 'accueil';
}

type Props = {
  /** Force l’onglet actif (ex. écran liste groupée). */
  activeTab?: CoopTabId;
};

export function CoopBottomNav({ activeTab }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const current = activeTab ?? resolveActiveTab(pathname);

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 8), height: 64 + Math.max(insets.bottom, 8) }]}>
      {TABS.map((tab) => {
        const active = current === tab.id;
        return (
          <TouchableOpacity
            key={tab.id}
            style={styles.item}
            activeOpacity={0.7}
            onPress={() => {
              if (!active) router.replace(tab.href as any);
            }}
          >
            <MaterialCommunityIcons name={tab.icon} size={24} color={active ? brandGreen : '#666'} />
            <Text style={[styles.label, active && styles.labelActive]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    ...Platform.select({
      android: { elevation: 8 },
      ios: { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, shadowOffset: { width: 0, height: -2 } },
    }),
  },
  item: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  label: { fontSize: 10, marginTop: 4, color: '#666' },
  labelActive: { color: brandGreen, fontWeight: '700' },
});
