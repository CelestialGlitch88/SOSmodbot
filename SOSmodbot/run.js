// run.js — SOS Bot entry point with first-run setup wizard
const fs   = require('fs');
const path = require('path');
const readline = require('readline');
const ExcelJS  = require('exceljs');

const XLSX_PATH = path.join(__dirname, 'logs', 'sos_log.xlsx');
const LOGS_DIR  = path.join(__dirname, 'logs');

// ── Colours ────────────────────────────────────────────────────────
const WHITE  = { argb: 'FFFFFFFF' };
const HEADER = { argb: 'FF1A1A2E' };
const RED    = { argb: 'FFFF4444' };
const ORANGE = { argb: 'FFFFA500' };
const PURPLE = { argb: 'FF7C3AED' };

function ask(rl, question) {
  return new Promise(resolve => rl.question(question, resolve));
}

function hdrStyle(cell, text) {
  cell.value     = text;
  cell.font      = { bold: true, color: WHITE, name: 'Arial', size: 10 };
  cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: HEADER };
  cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
}

function colWidths(sheet, widths) {
  widths.forEach((w, i) => { sheet.getColumn(i + 1).width = w; });
}

async function createXLSX(admins) {
  if (!fs.existsSync(LOGS_DIR)) fs.mkdirSync(LOGS_DIR);

  const wb = new ExcelJS.Workbook();

  // ── Strikes ───────────────────────────────────────────────────────
  const s1 = wb.addWorksheet('Strikes');
  s1.getRow(1).height = 30;
  ['Timestamp','Name','Phone Number','Violation Type','Strike #','Day/Night','Content Preview']
    .forEach((h, i) => hdrStyle(s1.getCell(1, i + 1), h));
  colWidths(s1, [22,18,16,20,10,10,45]);
  s1.views = [{ state: 'frozen', ySplit: 1 }];

  // ── Event Log ─────────────────────────────────────────────────────
  const s2 = wb.addWorksheet('Event Log');
  s2.getRow(1).height = 30;
  ['Timestamp','Name','Phone Number','Message Type','Content / Caption','Media Type','Is Forward','Is Violation','Day/Night']
    .forEach((h, i) => hdrStyle(s2.getCell(1, i + 1), h));
  colWidths(s2, [22,18,16,14,48,14,12,12,10]);
  s2.views = [{ state: 'frozen', ySplit: 1 }];

  // ── Admin Roster ──────────────────────────────────────────────────
  const s3 = wb.addWorksheet('Admin Roster');
  s3.getRow(1).height = 30;
  ['Name','Phone Number (with country code)','Role','Active (YES/NO)','Notes']
    .forEach((h, i) => hdrStyle(s3.getCell(1, i + 1), h));
  colWidths(s3, [22,28,20,16,35]);
  s3.views = [{ state: 'frozen', ySplit: 1 }];

  admins.forEach((admin, idx) => {
    const row = s3.getRow(idx + 2);
    row.values = [admin.name, admin.number, admin.role, 'YES', ''];
    row.font   = { name: 'Arial', size: 10 };
    row.getCell(4).font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF16A34A' } };
  });

  // Legend
  const legendStart = admins.length + 3;
  s3.getCell(`A${legendStart}`).value = 'COLOUR LEGEND';
  s3.getCell(`A${legendStart}`).font  = { bold: true, name: 'Arial', size: 10 };

  [
    [PURPLE, '🌙 Night violation — any strike → DMs all admins'],
    [ORANGE, '☀️ Day violation — 1st strike (silent)'],
    [RED,    '🔴 Day violation — 2nd+ strike → DMs all admins'],
  ].forEach(([colour, txt], i) => {
    const c = s3.getCell(`A${legendStart + 1 + i}`);
    c.value = txt;
    c.fill  = { type: 'pattern', pattern: 'solid', fgColor: colour };
    c.font  = { name: 'Arial', size: 10, color: WHITE };
  });

  await wb.xlsx.writeFile(XLSX_PATH);
}

async function runSetupWizard() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  console.log('\n┌─────────────────────────────────────┐');
  console.log('│   🛡️  SOS BOT — FIRST TIME SETUP    │');
  console.log('└─────────────────────────────────────┘\n');
  console.log('No log file found. Set up your admin roster first.\n');

  const admins = [];
  let addMore  = true;

  while (addMore) {
    const name   = await ask(rl, '👤 Admin name: ');
    const number = await ask(rl, '📱 Phone (with country code, e.g. 919876543210): ');
    const role   = await ask(rl, '🏷️  Role (e.g. Head Admin, Building A Rep): ');
    admins.push({ name: name.trim(), number: number.trim(), role: role.trim() });

    const more = await ask(rl, '\nAdd another admin? (y/n): ');
    addMore = more.trim().toLowerCase() === 'y';
    if (addMore) console.log('');
  }

  rl.close();

  console.log('\n⏳ Creating logs/sos_log.xlsx...');
  await createXLSX(admins);
  console.log(`✅ Done! ${admins.length} admin(s) added to roster.`);
  console.log('📝 You can edit admins anytime in logs/sos_log.xlsx → Admin Roster tab\n');
  console.log('Starting bot...\n');
}

async function main() {
  if (!fs.existsSync(XLSX_PATH)) {
    await runSetupWizard();
  }
  require('./server.js');
  require('./index.js');
}

main().catch(err => {
  console.error('Startup error:', err.message);
  process.exit(1);
});
