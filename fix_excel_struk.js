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

      // Fix the broken exports
      const re = /(exportToExcel\(wsData,\s*"[^"]+",\s*"[^"]+"\);)\s*\n\s*\};/g;
      if (re.test(content)) {
         content = content.replace(re, '$1\n    });\n  };');
         changed = true;
      }

      if (changed) {
        fs.writeFileSync(fullPath, content);
      }
    }
  }
}

processDir('./src');
