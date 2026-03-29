// xlsx-logger.js
// Handles all read/write operations to sos_log.xlsx

const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

const XLSX_PATH = path.join(__dirname, 'logs', 'sos_log.xlsx');

// ── Colours ────────────────────────────────────────────────────────
const RED    = { argb: 'FFFF4444' };
const ORANGE = { argb: 'FFFFA500' };
const WHITE  = { argb: 'FFFFFFFF' };

function rowFill(colour) {
  return { type: 'pattern', pattern: 'solid', fgColor: colour };
}

function isNight() {
  const now = new Date();
  // IST = UTC+5:30
  const ist = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
  const h = ist.getUTCHours();
  return h >= 21 || h < 7; // 9pm – 7am
}

// ── Append a row to a named sheet ──────────────────────────────────
async function appendRow(sheetName, values, fillColor) {
  const wb = new ExcelJS.Workbook();

  if (fs.existsSync(XLSX_PATH)) {
    await wb.xlsx.readFile(XLSX_PATH);
  }

  const sheet = wb.getWorksheet(sheetName);
  if (!sheet) throw new Error(`Sheet "${sheetName}" not found in XLSX`);

  const row = sheet.addRow(values);
  row.font = { name: 'Arial', size: 10 };

  if (fillColor) {
    row.eachCell((cell) => {
      cell.fill = rowFill(fillColor);
      cell.font = { name: 'Arial', size: 10, color: WHITE };
    });
  }

  row.alignment = { vertical: 'middle' };
  await wb.xlsx.writeFile(XLSX_PATH);
}

// ── Log a violation to Strikes sheet ──────────────────────────────
async function logStrike({ timestamp, name, number, violationType, strikeCount, contentPreview }) {
  const night = isNight();
  const dayNight = night ? 'NIGHT' : 'DAY';

  let fill;
  if (night) {
    fill = RED; // any night strike → red
  } else {
    fill = strikeCount === 1 ? ORANGE : RED; // day: 1st=orange, 2nd+=red
  }

  await appendRow('Strikes', [
    timestamp,
    name,
    number,
    violationType === 'forwarded_message' ? 'Forwarded Message' : 'Link Shared',
    strikeCount,
    dayNight,
    contentPreview || '',
  ], fill);

  return { night, dayNight };
}

// ── Log every message to Event Log sheet ──────────────────────────
async function logEvent({ timestamp, name, number, msgType, content, mediaType, isForward, isViolation, dayNight }) {
  await appendRow('Event Log', [
    timestamp,
    name,
    number,
    msgType,
    content || '',
    mediaType || '',
    isForward ? 'YES' : 'NO',
    isViolation ? 'YES' : 'NO',
    dayNight,
  ], null);
}

// ── Read top-level admins from Admin Roster sheet ──────────────────
async function getActiveAdmins() {
  const wb = new ExcelJS.Workbook();
  if (!fs.existsSync(XLSX_PATH)) return [];
  await wb.xlsx.readFile(XLSX_PATH);

  const sheet = wb.getWorksheet('Admin Roster');
  if (!sheet) return [];

  const admins = [];
  sheet.eachRow((row, rowNum) => {
    if (rowNum < 2) return; // skip header
    const name   = row.getCell(1).value;
    const number = row.getCell(2).value;
    const active = String(row.getCell(4).value || '').toUpperCase();
    if (number && active === 'YES') {
      admins.push({ name: String(name), number: String(number) });
    }
  });

  return admins;
}

module.exports = { logStrike, logEvent, getActiveAdmins, isNight };
