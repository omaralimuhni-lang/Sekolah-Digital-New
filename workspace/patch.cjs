const fs = require('fs');
const path = require('path');

function walkSync(currentDirPath, callback) {
    if (!fs.existsSync(currentDirPath)) return;
    fs.readdirSync(currentDirPath).forEach(function (name) {
        var filePath = path.join(currentDirPath, name);
        var stat = fs.statSync(filePath);
        if (stat.isFile()) {
            callback(filePath, stat);
        } else if (stat.isDirectory()) {
            walkSync(filePath, callback);
        }
    });
}

walkSync(path.join(process.cwd(), 'src/views'), function(filePath) {
    if (!filePath.endsWith('.tsx')) return;
    let content = fs.readFileSync(filePath, 'utf8');

    // Case 1: has loadData() but doesn't have custom localStorageUpdate listener
    if (content.includes('loadData') && !content.includes('localStorageUpdate')) {
        let changed = content.replace(
            /useEffect\(\(\)\s*=>\s*{\s*([^}]*?loadData\(\);?\s*)\s*},\s*\[(.*?)\]\);/g,
            `useEffect(() => {
    $1

    const handleCustomStorageUpdate = () => loadData();
    window.addEventListener('storage', handleCustomStorageUpdate);
    window.addEventListener('localStorageUpdate', handleCustomStorageUpdate);

    return () => {
      window.removeEventListener('storage', handleCustomStorageUpdate);
      window.removeEventListener('localStorageUpdate', handleCustomStorageUpdate);
    };
  }, [$2]);`
        );
        
        // Sometimes loadData is inside the useEffect
        if(changed === content) {
          changed = content.replace(
            /useEffect\(\(\)\s*=>\s*{\s*const\s+loadData\s*=\s*\([^)]*\)\s*=>\s*{([\s\S]*?)};\s*loadData\(\);\s*},\s*\[(.*?)\]\);/g,
            `useEffect(() => {
    const loadData = () => {$1};
    loadData();

    const handleCustomStorageUpdate = () => loadData();
    window.addEventListener('storage', handleCustomStorageUpdate);
    window.addEventListener('localStorageUpdate', handleCustomStorageUpdate);

    return () => {
      window.removeEventListener('storage', handleCustomStorageUpdate);
      window.removeEventListener('localStorageUpdate', handleCustomStorageUpdate);
    };
  }, [$2]);`
          )
        }

        if (changed !== content) {
            fs.writeFileSync(filePath, changed);
            console.log(`Updated ${filePath}`);
        }
    }
});
