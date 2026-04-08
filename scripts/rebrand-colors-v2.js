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

function replaceColors(content, filePath) {
  let c = content;

  // ═══════════════════════════════════════════════════════
  // 1. HARDCODED HEX VALUES (navy blues from old design)
  // ═══════════════════════════════════════════════════════
  // Dark navy bg → pure black/near-black
  c = c.replace(/bg-\[#0A1628\]/g, 'bg-[#0a0a0a]');
  c = c.replace(/bg-\[#0E1D35\]/g, 'bg-[#111111]');
  c = c.replace(/from-\[#0A1628\]/g, 'from-[#0a0a0a]');
  c = c.replace(/from-\[#0E1D35\]/g, 'from-[#111111]');
  c = c.replace(/via-\[#0E1D35\]/g, 'via-[#111111]');
  c = c.replace(/via-\[#0d2137\]/g, 'via-[#0d0d0d]');
  c = c.replace(/to-\[#0A1628\]/g, 'to-[#0a0a0a]');
  c = c.replace(/text-\[#0A1628\]/g, 'text-[#0a0a0a]');

  // ═══════════════════════════════════════════════════════
  // 2. SLATE → NEUTRAL (removes blue undertone)
  // ═══════════════════════════════════════════════════════
  // Slate text shades (hero subtexts, muted text in dark sections)
  c = c.replace(/\btext-slate-200\b/g, 'text-neutral-200');
  c = c.replace(/\btext-slate-300\b/g, 'text-neutral-400');
  c = c.replace(/\btext-slate-400\b/g, 'text-neutral-500');
  c = c.replace(/\btext-slate-500\b/g, 'text-neutral-500');
  c = c.replace(/\btext-slate-600\b/g, 'text-neutral-600');
  c = c.replace(/\btext-slate-700\b/g, 'text-neutral-700');
  c = c.replace(/\btext-slate-800\b/g, 'text-neutral-800');
  c = c.replace(/\btext-slate-900\b/g, 'text-neutral-900');

  // Slate backgrounds
  c = c.replace(/\bbg-slate-50\b/g, 'bg-neutral-50');
  c = c.replace(/\bbg-slate-100\b/g, 'bg-neutral-100');
  c = c.replace(/\bbg-slate-200\b/g, 'bg-neutral-200');
  c = c.replace(/\bbg-slate-300\b/g, 'bg-neutral-300');
  c = c.replace(/\bbg-slate-800\b/g, 'bg-neutral-800');
  c = c.replace(/\bbg-slate-900\b/g, 'bg-neutral-900');
  c = c.replace(/\bhover:bg-slate-100\b/g, 'hover:bg-neutral-100');
  c = c.replace(/\bhover:bg-slate-200\b/g, 'hover:bg-neutral-200');

  // Slate borders
  c = c.replace(/\bborder-slate-(\d+)\b/g, 'border-neutral-$1');

  // Slate from/to/via (gradients)
  c = c.replace(/\bfrom-slate-(\d+)\b/g, 'from-neutral-$1');
  c = c.replace(/\bto-slate-(\d+)\b/g, 'to-neutral-$1');
  c = c.replace(/\bvia-slate-(\d+)\b/g, 'via-neutral-$1');

  // Ring, divide, etc.
  c = c.replace(/\bring-slate-(\d+)\b/g, 'ring-neutral-$1');
  c = c.replace(/\bdivide-slate-(\d+)\b/g, 'divide-neutral-$1');

  // Dark variants
  c = c.replace(/\bdark:bg-slate-(\d+)\b/g, 'dark:bg-neutral-$1');
  c = c.replace(/\bdark:text-slate-(\d+)\b/g, 'dark:text-neutral-$1');
  c = c.replace(/\bdark:border-slate-(\d+)\b/g, 'dark:border-neutral-$1');
  c = c.replace(/\bdark:from-slate-(\d+)\b/g, 'dark:from-neutral-$1');
  c = c.replace(/\bdark:to-slate-(\d+)\b/g, 'dark:to-neutral-$1');

  // ═══════════════════════════════════════════════════════
  // 3. INDIGO → BRAND-YELLOW (formation badges, links)
  // ═══════════════════════════════════════════════════════
  c = c.replace(/\b(text|bg|border|from|via|to|ring|shadow)-indigo-(\d+)(\/\d+)?\b/g, (m, prefix, shade, opacity) => {
    if (prefix === 'to') return `to-brand-brown${opacity || ''}`;
    return `${prefix}-brand-yellow${opacity || ''}`;
  });
  c = c.replace(/\b(hover|focus|group-hover):(text|bg|border)-indigo-(\d+)(\/\d+)?\b/g, '$1:$2-brand-yellow$4');
  c = c.replace(/\bdark:(text|bg|border)-indigo-(\d+)(\/\d+)?\b/g, 'dark:$1-brand-yellow$3');

  // ═══════════════════════════════════════════════════════
  // 4. SKY → BRAND-YELLOW (learning outcomes)
  // ═══════════════════════════════════════════════════════
  c = c.replace(/\b(text|bg|border|from|via|to|ring|shadow|stroke)-sky-(\d+)(\/\d+)?\b/g, (m, prefix, shade, opacity) => {
    return `${prefix}-brand-yellow${opacity || ''}`;
  });
  c = c.replace(/\bdark:(text|bg|border)-sky-(\d+)(\/\d+)?\b/g, 'dark:$1-brand-yellow$3');

  // ═══════════════════════════════════════════════════════
  // 5. BLUE → BRAND-YELLOW (dashboard metrics, icons)
  // ═══════════════════════════════════════════════════════
  c = c.replace(/\b(text|bg|border|from|via|to|ring|shadow|stroke|fill)-blue-(\d+)(\/\d+)?\b/g, (m, prefix, shade, opacity) => {
    return `${prefix}-brand-yellow${opacity || ''}`;
  });
  c = c.replace(/\b(hover|focus|group-hover):(text|bg|border)-blue-(\d+)(\/\d+)?\b/g, '$1:$2-brand-yellow$4');
  c = c.replace(/\bdark:(text|bg|border|from|to)-blue-(\d+)(\/\d+)?\b/g, 'dark:$1-brand-yellow$3');

  // ═══════════════════════════════════════════════════════
  // 6. VIOLET/PURPLE → BRAND-BROWN (secondary accent)
  // ═══════════════════════════════════════════════════════
  c = c.replace(/\b(text|bg|border|from|via|to|ring|shadow|stroke)-violet-(\d+)(\/\d+)?\b/g, (m, prefix, shade, opacity) => {
    return `${prefix}-brand-brown${opacity || ''}`;
  });
  c = c.replace(/\bdark:(text|bg|border|from|to)-violet-(\d+)(\/\d+)?\b/g, 'dark:$1-brand-brown$3');

  c = c.replace(/\b(text|bg|border|from|via|to|ring|shadow|stroke)-purple-(\d+)(\/\d+)?\b/g, (m, prefix, shade, opacity) => {
    return `${prefix}-brand-brown${opacity || ''}`;
  });
  c = c.replace(/\b(hover|focus|group-hover):(text|bg|border)-purple-(\d+)(\/\d+)?\b/g, '$1:$2-brand-brown$4');
  c = c.replace(/\bdark:(text|bg|border|from|to)-purple-(\d+)(\/\d+)?\b/g, 'dark:$1-brand-brown$3');

  // ═══════════════════════════════════════════════════════
  // 7. ORANGE → BRAND-BROWN (for gradient endpoints)
  // ═══════════════════════════════════════════════════════
  c = c.replace(/\b(from|via|to)-orange-(\d+)\b/g, '$1-brand-brown');
  c = c.replace(/\b(hover:from|hover:to)-orange-(\d+)\b/g, '$1-brand-brown');
  c = c.replace(/\bdark:(from|via|to)-orange-(\d+)(\/\d+)?\b/g, 'dark:$1-brand-brown$3');

  // ═══════════════════════════════════════════════════════
  // 8. AMBER → BRAND-YELLOW (already close but unify)
  //    Exception: Keep amber for system warnings in AudioRecorder
  // ═══════════════════════════════════════════════════════
  if (!filePath.includes('AudioRecorder')) {
    c = c.replace(/\b(text|bg|border|stroke)-amber-(\d+)(\/\d+)?\b/g, (m, prefix, shade, opacity) => {
      return `${prefix}-brand-yellow${opacity || ''}`;
    });
    c = c.replace(/\b(from|via|to)-amber-(\d+)(\/\d+)?\b/g, (m, prefix, shade, opacity) => {
      if (prefix === 'to') return `to-brand-brown${opacity || ''}`;
      return `${prefix}-brand-yellow${opacity || ''}`;
    });
    c = c.replace(/\b(hover|focus):(text|bg|border)-amber-(\d+)(\/\d+)?\b/g, '$1:$2-brand-yellow$4');
    c = c.replace(/\b(hover:from|hover:to)-amber-(\d+)\b/g, (m, prefix) => {
      return prefix.includes('to') ? 'hover:to-brand-brown' : 'hover:from-brand-yellow';
    });
    c = c.replace(/\bdark:(text|bg|border|from|to)-amber-(\d+)(\/\d+)?\b/g, 'dark:$1-brand-yellow$3');
    c = c.replace(/\bdata-\[state=checked\]:bg-amber-\d+\b/g, 'data-[state=checked]:bg-brand-yellow');
    c = c.replace(/\bdata-\[state=checked\]:text-amber-\d+\b/g, 'data-[state=checked]:text-brand-yellow');
  }

  // ═══════════════════════════════════════════════════════
  // 9. ROSE → BRAND (keep for destructive/error indicators)
  //    Only replace decorative uses, not error states
  // ═══════════════════════════════════════════════════════
  // Rose in ProgressRing decorative context
  c = c.replace(/\bstroke-rose-(\d+)(\/\d+)?\b/g, 'stroke-brand-brown$2');
  c = c.replace(/\btext-rose-(\d+)\b/g, 'text-brand-brown');

  return c;
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
        const newContent = replaceColors(originalContent, filePath);
        
        if (newContent !== originalContent) {
          fs.writeFileSync(filePath, newContent, 'utf8');
          const shortPath = filePath.replace(process.cwd(), '');
          console.log(`✓ ${shortPath}`);
          filesModified++;
        }
      }
    });
  }
});

console.log(`\n═══════════════════════════════════════════`);
console.log(`Rebrand V2 complete! Modified ${filesModified} files.`);
console.log(`═══════════════════════════════════════════`);
