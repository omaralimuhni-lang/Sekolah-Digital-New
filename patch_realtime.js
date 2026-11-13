const fs = require('fs');
const path = require('path');

function walkSync(currentDirPath, callback) {
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

walkSync('src/views', function(filePath) {
    if (!filePath.endsWith('.tsx')) return;
    let content = fs.readFileSync(filePath, 'utf8');

    // Find custom loadData definitions
    const loadDataMatch = content.match(/const\s+loadData\s*=\s*\([^)]*\)\s*=>\s*{[\s\S]*?};/);
    if (loadDataMatch && !content.includes('localStorageUpdate')) {
        let changed = content.replace(
            /useEffect\(\(\)\s*=>\s*{\s*([^}]*?loadData\(\);?\s*)\s*},\s*\[(.*?)\]\);/g,
            `useEffect(() => {
    $1

    const handleStorageEvent = (e) => {
      loadData();
    };
    const handleCustomStorageUpdate = () => loadData();

    window.addEventListener('storage', handleStorageEvent);
    window.addEventListener('localStorageUpdate', handleCustomStorageUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageEvent);
      window.removeEventListener('localStorageUpdate', handleCustomStorageUpdate);
    };
  }, [$2]);`
        );
        if (changed !== content) {
            fs.writeFileSync(filePath, changed);
            console.log(`Updated ${filePath}`);
        }
    }
});
