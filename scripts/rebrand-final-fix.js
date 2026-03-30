const fs = require('fs');
const path = require('path');

// Map of files and replacements to make
const fixes = [
  {
    file: 'src/components/formations/formation-progress-manager.tsx',
    replacements: [
      ['bg-emerald-600 hover:bg-emerald-600', 'bg-brand-brown hover:bg-brand-brown'],
    ]
  },
  {
    file: 'src/app/(marketing)/formaciones/[slug]/page.tsx',
    replacements: [
      ['from-indigo-900/60 to-slate-900/30', 'from-[#0a0a0a]/80 to-[#111111]/40'],
      ['border-indigo-400 text-indigo-300 gap-2 bg-indigo-500/10', 'border-brand-yellow/40 text-brand-yellow gap-2 bg-brand-yellow/10'],
      ['text-indigo-300', 'text-brand-yellow'],
      ['border-emerald-200 bg-emerald-50 text-emerald-700', 'border-brand-yellow/30 bg-brand-yellow/10 text-brand-yellow'],
      ['bg-indigo-50 text-indigo-700', 'bg-brand-yellow/10 text-brand-yellow'],
    ]
  },
  {
    file: 'src/app/(dashboard)/dashboard/community/page.tsx',
    replacements: [
      ['bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400', 'bg-brand-yellow/20 text-brand-yellow dark:bg-brand-yellow/30 dark:text-brand-yellow'],
    ]
  },
  {
    file: 'src/app/(dashboard)/dashboard/patients/[id]/clinical-tabs.tsx',
    replacements: [
      ['bg-cyan-100 text-cyan-800', 'bg-brand-yellow/20 text-brand-yellow'],
    ]
  },
  {
    file: 'src/app/(dashboard)/dashboard/admin/analytics/page.tsx',
    replacements: [
      ['to-cyan-600', 'to-brand-yellow'],
    ]
  },
];

let filesModified = 0;

fixes.forEach(fix => {
  const filePath = path.join(process.cwd(), fix.file);
  if (!fs.existsSync(filePath)) {
    console.log(`⚠ Not found: ${fix.file}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  fix.replacements.forEach(([from, to]) => {
    if (content.includes(from)) {
      content = content.split(from).join(to);
      modified = true;
    }
  });
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✓ ${fix.file}`);
    filesModified++;
  }
});

console.log(`\nFixed ${filesModified} files.`);
