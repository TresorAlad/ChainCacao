const fs = require('fs');
const files = [
  'app/(exportateur)/bourse.tsx',
  'app/(exportateur)/portefeuille.tsx',
  'app/(exportateur)/scanner.tsx',
  'app/(exportateur)/stock.tsx',
];

for (const f of files) {
  let content = fs.readFileSync(f, 'utf8');
  content = content.replace(/router\.push\(\\'\/\(exportateur\)\/historique\\'\)/g, "router.push('/(exportateur)/historique')");
  fs.writeFileSync(f, content);
}
console.log('Fixed router.push syntax');
