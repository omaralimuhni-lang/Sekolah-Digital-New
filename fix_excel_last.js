import fs from 'fs';
import path from 'path';

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;

      // Ensure Excel fixes are applied
      const re = /const XLSX = require\('xlsx'\);\s*\n\s*const ws = XLSX\.utils\.json_to_sheet\(([^)]+)\);\s*\n\s*const wb = XLSX\.utils\.book_new\(\);\s*\n\s*XLSX\.utils\.book_append_sheet\(wb, ws, "([^"]+)"\);\s*\n\s*XLSX\.writeFile\(wb, `([^$]+)\$\{new Date\(\)\.getTime\(\)\}\.xlsx`\);/g;
      
      if (re.test(content)) {
         content = content.replace(re, `import('../../utils/kopHelper').then(({ exportToExcel }) => {
      exportToExcel($1, "$3", "$2".toUpperCase());
    });`);
         changed = true;
      }
      
      const re2 = /const ws = XLSX\.utils\.json_to_sheet\(([^)]+)\);\s*\n\s*const wb = XLSX\.utils\.book_new\(\);\s*\n\s*XLSX\.utils\.book_append_sheet\(wb, ws, "([^"]+)"\);\s*\n\s*XLSX\.writeFile\(wb, `([^$]+)\$\{new Date\(\)\.getTime\(\)\}\.xlsx`\);/g;
      
      if (re2.test(content)) {
         content = content.replace(re2, `import('../../utils/kopHelper').then(({ exportToExcel }) => {
      exportToExcel($1, "$3", "$2".toUpperCase());
    });`);
         changed = true;
      }

      if (changed) {
        fs.writeFileSync(fullPath, content);
      }
    }
  }
}

processDir('./src');
