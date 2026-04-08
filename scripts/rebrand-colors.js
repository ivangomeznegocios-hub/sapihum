const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      walkDir(dirPath, callback);
    } else {
      callback(path.join(dir, f));
    }
  });
}

function replaceColors(content) {
  let newContent = content;
  
  // Teal -> brand-yellow
  newContent = newContent.replace(/\b(text|bg|border|from|via|to|ring|shadow|fill|stroke|decoration|outline)-teal-\d{2,3}(\/\d{1,3})?\b/g, (match, prefix, opacity) => {
    if (prefix === 'to') return `to-brand-brown${opacity || ''}`;
    return `${prefix}-brand-yellow${opacity || ''}`;
  });

  newContent = newContent.replace(/\b(hover|focus|active|group-hover):text-teal-\d{2,3}(\/\d{1,3})?\b/g, '$1:text-brand-yellow$2');
  newContent = newContent.replace(/\b(hover|focus|active|group-hover):bg-teal-\d{2,3}(\/\d{1,3})?\b/g, '$1:bg-brand-yellow$2');
  newContent = newContent.replace(/\b(hover|focus|active|group-hover):border-teal-\d{2,3}(\/\d{1,3})?\b/g, '$1:border-brand-yellow$2');
  newContent = newContent.replace(/\b(hover|focus|active|group-hover):ring-teal-\d{2,3}(\/\d{1,3})?\b/g, '$1:ring-brand-yellow$2');
  
  // Emerald -> brand-brown
  newContent = newContent.replace(/\b(text|bg|border|from|via|to|ring|shadow|fill|stroke|decoration|outline)-emerald-\d{2,3}(\/\d{1,3})?\b/g, (match, prefix, opacity) => {
    if (prefix === 'to') return `to-brand-dark${opacity || ''}`;
    return `${prefix}-brand-brown${opacity || ''}`;
  });
  
  newContent = newContent.replace(/\b(hover|focus|active|group-hover):text-emerald-\d{2,3}(\/\d{1,3})?\b/g, '$1:text-brand-brown$2');
  newContent = newContent.replace(/\b(hover|focus|active|group-hover):bg-emerald-\d{2,3}(\/\d{1,3})?\b/g, '$1:bg-brand-brown$2');
  newContent = newContent.replace(/\b(hover|focus|active|group-hover):border-emerald-\d{2,3}(\/\d{1,3})?\b/g, '$1:border-brand-brown$2');
  newContent = newContent.replace(/\b(hover|focus|active|group-hover):ring-emerald-\d{2,3}(\/\d{1,3})?\b/g, '$1:ring-brand-brown$2');

  // Hardcoded hex colors of the old brand (e.g. #00d4aa or #10b981) might be in the code, though less common.
  newContent = newContent.replace(/#00[dD]4[aA]{2}/g, '#f6ae02'); // old custom teal
  newContent = newContent.replace(/#10[bB]981/g, '#7a5602'); // emerald-500 equivalent

  return newContent;
}

const targetDirs = [
  'src/app',
  'src/components',
  'src/lib'
];

let filesModified = 0;

targetDirs.forEach(dir => {
  const fullDir = path.join(process.cwd(), dir);
  if (fs.existsSync(fullDir)) {
    walkDir(fullDir, filePath => {
      if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
        const originalContent = fs.readFileSync(filePath, 'utf8');
        const newContent = replaceColors(originalContent);
        
        if (newContent !== originalContent) {
          fs.writeFileSync(filePath, newContent, 'utf8');
          console.log(`Updated: ${filePath.replace(process.cwd(), '')}`);
          filesModified++;
        }
      }
    });
  }
});

console.log(`\nRebrand complete! Modifed ${filesModified} files.`);
