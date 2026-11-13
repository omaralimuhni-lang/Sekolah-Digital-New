import fs from 'fs';
import { execSync } from 'child_process';

const lintOutput = execSync('npm run lint || true', { encoding: 'utf-8' });

const regex = /(.+)\((\d+),(\d+)\): error TS(6133|6196|2686|6192): (?:'(.+?)' is declared but its value is never read\.|'(.+?)' is declared but never used\.|All imports in import declaration are unused\.)/g;

let match;
const edits = {};

while ((match = regex.exec(lintOutput)) !== null) {
  const file = match[1];
  const line = parseInt(match[2], 10);
  const v = match[5] || match[6] || null;
  const isAllImports = match[0].includes('All imports');
  
  if (!edits[file]) edits[file] = [];
  
  if (isAllImports) {
    edits[file].push({ line, type: 'all' });
  } else if (v) {
    edits[file].push({ line, v, type: 'var' });
  }
}

for (const [file, fileEdits] of Object.entries(edits)) {
   const fullPath = file.trim();
   if (!fs.existsSync(fullPath)) continue;
   let lines = fs.readFileSync(fullPath, 'utf8').split('\n');
   
   // Sort in descending order to not mess up lines
   fileEdits.sort((a,b) => b.line - a.line);
   
   for (const edit of fileEdits) {
      if (edit.type === 'all') {
         lines.splice(edit.line - 1, 1);
         continue;
      } 
      if (edit.type === 'var') {
         const l = lines[edit.line - 1];
         if (!l) continue;
         
         if (l.includes('import')) {
            let newL = l.replace(new RegExp(`,\\s*${edit.v}\\b`), '')
                        .replace(new RegExp(`\\b${edit.v}\\s*,`), '')
                        .replace(new RegExp(`{\\s*${edit.v}\\s*}`), '{}');
            if (newL.includes('{}')) continue; // skip removing the whole line so we don't break destructuring, wait wait, if it's {}, we SHOULD remove it
            if (newL.replace(/\s/g, '').includes('import{}from')) {
                lines[edit.line - 1] = '';
                continue;
            }
            lines[edit.line - 1] = newL;
         } else if (l.includes('const [') || l.includes('let [') || l.includes('var [')) {
             // Example: `const [siswaList, setSiswaList] = useState([]);` where user wants to remove `setSiswaList`
            if (l.includes(`[${edit.v}]`)) {
                lines[edit.line - 1] = '';
            } else if (l.includes(`[${edit.v},`)) {
                lines[edit.line - 1] = l.replace(`[${edit.v},`, `[,`);
            } else {
                lines[edit.line - 1] = l.replace(new RegExp(`,\\s*${edit.v}`), '');
                // Try to clean up empty arrays too if `[ ] = `
                if (lines[edit.line-1].includes('const [] =')) {
                    lines[edit.line - 1] = '';
                }
            }
         } else if (l.includes('const {') || l.includes('let {')) {
             let newL = l.replace(new RegExp(`,\\s*${edit.v}\\b(?!\\w)`), '')
                        .replace(new RegExp(`\\b${edit.v}\\s*,`), '')
                        .replace(new RegExp(`{\\s*${edit.v}\\s*}`), '{}');
             if (newL.includes('{}') && newL.includes('= useAppContext();')) {
                newL = ''; 
             }
             lines[edit.line - 1] = newL;
         }
      }
   }
   
   fs.writeFileSync(fullPath, lines.filter(l => l !== '').join('\n'));
}
