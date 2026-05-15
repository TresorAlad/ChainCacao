import os
import re

directories = ['app/(exportateur)', 'app/(cooperative)', 'app/(agriculteur)']
for d in directories:
    if not os.path.isdir(d):
        continue
    for filename in os.listdir(d):
        if not filename.endswith('.tsx'):
            continue
        filepath = os.path.join(d, filename)
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        changed = False

        # Replace Rapport / Certification / Conformite with Historique
        if 'Rapport' in content or 'rapport' in content:
            content = re.sub(
                r'<TabItem\s+icon="file-document-outline"\s+label="Rapport"\s+onPress=\{.*?\}\s*/>',
                r'<TabItem icon="history" label="Historique" onPress={() => router.push(\'/' + d.split('/')[-1] + r'/historique\')} />',
                content
            )
            changed = True
            
        # If it was active on the old rapport page, it shouldn't be here since we deleted it, but just in case
        
        # We need to make sure we import useSafeAreaInsets
        if 'useSafeAreaInsets' not in content and 'SafeAreaProvider' in content:
            content = content.replace('SafeAreaProvider, SafeAreaView } from \'react-native-safe-area-context\'', 'SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from \'react-native-safe-area-context\'')
            content = content.replace(' SafeAreaView } from \'react-native-safe-area-context\'', ' SafeAreaView, useSafeAreaInsets } from \'react-native-safe-area-context\'')
            changed = True
            
        # Inject const insets = useSafeAreaInsets(); inside the main export default function
        if 'useSafeAreaInsets' in content and 'const insets =' not in content:
            content = re.sub(r'(export default function [a-zA-Z0-9_]+\(\)\s*\{)', r'\1\n  const insets = useSafeAreaInsets();', content)
            changed = True

        # Update styles for bottomTab to use insets (Inline styles)
        if '<View style={styles.bottomTab}>' in content and 'insets.bottom' not in content:
            content = content.replace(
                '<View style={styles.bottomTab}>',
                '<View style={[styles.bottomTab, { paddingBottom: insets.bottom || 5, height: 70 + (insets.bottom || 0) }]}>'
            )
            changed = True

        if changed:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Updated {filepath}")
