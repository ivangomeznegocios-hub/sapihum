const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

let count = 0;
['src/app', 'src/components'].forEach(dir => {
  const fullDir = path.join(process.cwd(), dir);
  if (fs.existsSync(fullDir)) {
    walkDir(fullDir, filePath => {
      if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
        let c = fs.readFileSync(filePath, 'utf8');
        let n = c;

        // Replace color prop values passed to ProgressRing and StatCard
        n = n.replace(/color="emerald"/g, 'color="primary"');
        n = n.replace(/color="blue"/g, 'color="primary"');
        n = n.replace(/color="amber"/g, 'color="primary"');
        n = n.replace(/color="purple"/g, 'color="secondary"');
        n = n.replace(/color="rose"/g, 'color="secondary"');
        n = n.replace(/color="indigo"/g, 'color="primary"');

        // Fix StatCard type definition
        n = n.replace(
          /type ColorVariant = 'blue' \| 'emerald' \| 'purple' \| 'amber' \| 'rose' \| 'indigo'/g,
          "type ColorVariant = 'primary' | 'secondary'"
        );

        // Fix StatCard colorConfig object keys
        n = n.replace(/\bemerald: \{/g, 'primary: {');

        // Fix remaining key references like blue: {, purple: {, amber: {, rose: {, indigo: {
        // Only in StatCard context — match inside objects with brands already
        n = n.replace(/'emerald'/g, "'primary'");

        if (n !== c) {
          fs.writeFileSync(filePath, n, 'utf8');
          console.log('Updated:', filePath.replace(process.cwd(), ''));
          count++;
        }
      }
    });
  }
});
console.log(`\nDone! Updated ${count} files.`);
