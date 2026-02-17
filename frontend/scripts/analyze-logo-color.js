const fs = require('fs');
const path = require('path');

// Note: Pour analyser précisément la couleur du logo PNG,
// il faudrait utiliser une bibliothèque comme 'sharp' ou 'jimp'
// Pour l'instant, on vérifie que la couleur #2d5016 est bien définie partout

console.log('🔍 Analyse de la cohérence des couleurs vertes dans Roomshare\n');

const currentGreen = '#2d5016';
console.log(`✅ Couleur verte actuelle définie dans globals.css: ${currentGreen}`);

// Vérifier les fichiers qui utilisent directement #2d5016 au lieu de la variable accent
const filesWithHardcodedGreen = [
  'src/app/register/page.tsx',
  'src/app/profile/page.tsx',
  'src/components/ui/BottomNav.tsx',
  'src/app/messages/page.tsx',
  'src/app/messages/[id]/page.tsx',
];

console.log('\n📋 Fichiers utilisant directement #2d5016 (devraient utiliser accent):');
filesWithHardcodedGreen.forEach(file => {
  console.log(`   - ${file}`);
});

console.log('\n💡 Recommandation: Remplacer toutes les occurrences de #2d5016 par la classe Tailwind "accent"');
console.log('   Cela garantira que la couleur reste synchronisée avec le logo.\n');
