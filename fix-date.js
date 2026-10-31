const fs = require('fs');

function updateFile(filepath) {
    let content = fs.readFileSync(filepath, 'utf8');
    const today = new Date().toISOString().split('T')[0];
    content = content.replace(/YYYY-MM-DD/, today);
    fs.writeFileSync(filepath, content);
}

updateFile('.jules/sentinel.md');
