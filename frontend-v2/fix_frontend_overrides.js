const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
pkg.pnpm.overrides['js-cookie@<=3.0.5'] = '^3.0.7';
pkg.pnpm.overrides['brace-expansion@>=5.0.0 <5.0.6'] = '^5.0.6';
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
