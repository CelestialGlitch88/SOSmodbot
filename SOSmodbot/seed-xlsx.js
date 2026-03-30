// scripts/seed-xlsx.js
// Run once to create the initial sos_log.xlsx with all 3 sheets
// Usage: node scripts/seed-xlsx.js

const { execSync } = require('child_process');
const path = require('path');

try {
  execSync(`python3 ${path.join(__dirname, 'seed-xlsx.py')}`, { stdio: 'inherit' });
} catch (e) {
  console.error('Python3 not found. Please install Python 3 or run: pip3 install openpyxl');
}
