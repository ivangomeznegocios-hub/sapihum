const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        fs.statSync(dirPath).isDirectory() ? walk(dirPath, callback) : callback(dirPath);
    });
}

const fixPatterns = [
    // 1. Text gradients fading to dark on dark backgrounds
    { from: /to-brand-dark/g, to: 'to-white' },
    { from: /bg-gradient-to-r from-brand-yellow via-brand-brown to-brand-brown/g, to: 'bg-gradient-to-r from-brand-yellow to-white' },
    
    // 2. Eliminate all slate colors entirely
    { from: /slate-50/g, to: 'white' }, // bg-slate-50 -> bg-white
    { from: /slate-100/g, to: 'neutral-100' },
    { from: /slate-200/g, to: 'neutral-200' },
    { from: /slate-300/g, to: 'neutral-300' },
    { from: /slate-400/g, to: 'neutral-400' },
    { from: /slate-500/g, to: 'neutral-500' },
    { from: /slate-600/g, to: 'neutral-600' },
    { from: /slate-700/g, to: 'neutral-700' },
    { from: /slate-800/g, to: 'neutral-800' },
    { from: /slate-900/g, to: 'black' }, // Dark borders/backgrounds
    { from: /slate-950/g, to: 'black' },
    
    // 3. Specific visibility fixes
    // Badge that is brown on brown
    { from: /bg-brand-brown text-brand-brown/g, to: 'bg-brand-yellow/20 text-brand-yellow' },
    { from: /border-brand-brown bg-brand-brown text-brand-brown hover:bg-brand-brown/g, to: 'border-brand-yellow bg-brand-yellow text-black hover:bg-brand-yellow/90' },
    
    // Button from brand-yellow to brand-dark
    { from: /to-brand-dark/g, to: 'to-brand-brown' }, // For buttons
];

const pathsToScan = [
    path.join(process.cwd(), 'src/app/(marketing)'),
    path.join(process.cwd(), 'src/components/pricing')
];

let filesChanged = 0;

pathsToScan.forEach(dir => {
    if (fs.existsSync(dir)) {
        walk(dir, filePath => {
            if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
                let content = fs.readFileSync(filePath, 'utf8');
                let originalContent = content;
                
                fixPatterns.forEach(pattern => {
                    content = content.replace(pattern.from, pattern.to);
                });
                
                // Extra contrast pass for Heros (making things white instead of neutral-400 where applicable)
                // Let's just rely on the replacements above for slate to neutral, but let's make sure
                // hero text isn't black. 
                if (filePath.includes('nosotros\\page.tsx')) {
                    content = content.replace(/text-black/g, 'text-white');
                }

                if (content !== originalContent) {
                    fs.writeFileSync(filePath, content, 'utf8');
                    console.log(`Updated: ${filePath.replace(process.cwd(), '')}`);
                    filesChanged++;
                }
            }
        });
    }
});

console.log(`\nCompleted. Changed ${filesChanged} files.`);
