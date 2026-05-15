const fs = require('fs');

const files = [
  'app/(cooperative)/generation_liste.tsx',
  'app/(cooperative)/lot.tsx',
  'app/(exportateur)/bourse.tsx',
  'app/(exportateur)/parametre.tsx',
  'app/(exportateur)/scanner.tsx',
  'app/(exportateur)/stock.tsx',
];

for (const f of files) {
  let content = fs.readFileSync(f, 'utf8');
  if (content.includes('useSafeAreaInsets') && !content.includes("import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets }")) {
    if (content.includes("import { SafeAreaView } from 'react-native-safe-area-context';")) {
        content = content.replace("import { SafeAreaView } from 'react-native-safe-area-context';", "import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';");
    } else if (content.includes("import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';")) {
        content = content.replace("import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';", "import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';");
    } else {
        content = "import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';\n" + content;
    }
  }
  
  // Fix parametre.tsx location
  if (f.includes('parametre.tsx')) {
      content = content.replace("const userLocation = user?.location", "const userLocation = user?.adresse");
  }
  
  fs.writeFileSync(f, content);
}
console.log('Fixed imports and location type');
