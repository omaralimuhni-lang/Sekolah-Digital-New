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

      const strukRegex = /<div className="[^"]*text-center[^"]*border-b[^"]*border-dashed[^"]*">\s*([A-Z &]+)\s*<\/div>/g;
      if (strukRegex.test(content)) {
        content = content.replace(strukRegex, '<StrukHeader title="$1" />');
        if (!content.includes("from '../../utils/kopHelper'")) {
            content = "import { StrukHeader } from '../../utils/kopHelper';\n" + content;
        } else if (!content.includes('StrukHeader')) {
             content = content.replace(/import {([^}]+)} from '\.\.\/\.\.\/utils\/kopHelper';/, "import { $1, StrukHeader } from '../../utils/kopHelper';");
        }
        changed = true;
      }

      const strukRegex2 = /<div className="text-center font-bold text-lg border-b border-dashed border-slate-300 dark:border-slate-600 pb-3 mb-3 text-slate-800 dark:text-white">\s*([A-Z &]+)\s*<\/div>/g;
      if (strukRegex2.test(content)) {
        content = content.replace(strukRegex2, '<StrukHeader title="$1" />');
        changed = true;
      }

      if (changed) {
        fs.writeFileSync(fullPath, content);
      }
    }
  }
}

processDir('./src');
