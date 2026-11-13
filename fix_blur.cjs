const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      processFile(fullPath);
    }
  }
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // Replace backdrop-blur-(sm|md|lg|xl) with backdrop-blur-2xl or backdrop-blur-3xl
  // For most UI elements, backdrop-blur-md -> 2xl, xl -> 3xl
  if (content.match(/backdrop-blur-(md|lg|xl)/)) {
    content = content.replace(/backdrop-blur-md/g, 'backdrop-blur-2xl');
    content = content.replace(/backdrop-blur-lg/g, 'backdrop-blur-2xl');
    content = content.replace(/backdrop-blur-xl/g, 'backdrop-blur-3xl');
    changed = true;
  }

  // Replace old border colors with border-white/20 for glassmorphism
  if (content.match(/border-white\/(30|40|50|60)/)) {
    content = content.replace(/border-white\/(30|40|50|60)/g, 'border-white/20');
    changed = true;
  }
  
  if (content.match(/dark:border-white\/(30|40|50|60)/)) {
    content = content.replace(/dark:border-white\/(30|40|50|60)/g, 'dark:border-white/20');
    changed = true;
  }

  // Add more depth with shadow-[0_8px_32px_rgba(0,0,0,0.12)]
  if (content.match(/shadow-sm/)) {
     // careful with buttons
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed', filePath);
  }
}

processDir('src');
