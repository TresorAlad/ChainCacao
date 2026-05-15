const fs = require('fs');

const files = [
  'app/(exportateur)/bourse.tsx',
  'app/(exportateur)/parametre.tsx',
  'app/(exportateur)/scanner.tsx',
  'app/(exportateur)/stock.tsx',
];

for (const f of files) {
  let content = fs.readFileSync(f, 'utf8');
  
  // Remove SafeAreaView from react-native imports if it's already in react-native-safe-area-context
  if (content.includes("import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';")) {
      content = content.replace(/,\s*SafeAreaView\b/g, (match, offset, string) => {
          if (string.substring(0, offset).includes("'react-native'")) {
              return "";
          }
          if (string.substring(0, offset).includes("react-native-safe-area-context")) {
             return match;
          }
          return "";
      });
      // Just do a simple regex replace for react-native
      content = content.replace(/SafeAreaView,\s*(?=.*from 'react-native')/g, "");
      content = content.replace(/,\s*SafeAreaView(?=.*from 'react-native')/g, "");
  }
  
  if (f.includes('parametre.tsx')) {
      content = content.replace("user?.adresse", "user?.gps_location");
  }
  
  fs.writeFileSync(f, content);
}
console.log('Fixed duplicates');
