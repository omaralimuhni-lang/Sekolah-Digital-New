import fs from 'fs';
import { execSync } from 'child_process';

const lintOutput = execSync('npm run lint || true', { encoding: 'utf-8' });

const regex = /(.+)\((\d+),(\d+)\): error TS2686/g;

let match;
const filesToFix = new Set();

while ((match = regex.exec(lintOutput)) !== null) {
  filesToFix.add(match[1].trim());
}

for (const file of filesToFix) {
   if (!fs.existsSync(file)) continue;
   let lines = fs.readFileSync(file, 'utf8').split('\n');
   
   // Check if `import React` already exists
   if (!lines.some(l => l.includes("import React "))) {
       lines.unshift("import React from 'react';");
   }
   
   fs.writeFileSync(file, lines.join('\n'));
}

