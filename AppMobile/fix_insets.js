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
  if (content.includes('insets.bottom') && !content.includes('const insets = useSafeAreaInsets();')) {
    // Inject at the beginning of the default export component
    content = content.replace(/(export default function [a-zA-Z0-9_]+\(\)\s*\{)/, "$1\n  const insets = useSafeAreaInsets();");
  }
  fs.writeFileSync(f, content);
}
console.log('Fixed insets missing');
