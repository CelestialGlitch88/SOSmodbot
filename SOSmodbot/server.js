// server.js — dashboard HTTP server
require('dotenv').config();
const http = require('http');
const fs   = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');

const PORT      = process.env.DASHBOARD_PORT || 3000;
const XLSX_PATH = path.join(__dirname, 'logs', 'sos_log.xlsx');

async function readSheets() {
  if (!fs.existsSync(XLSX_PATH)) return { strikes: [], events: [], admins: [] };

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(XLSX_PATH);

  function sheetToJSON(name) {
    const sheet = wb.getWorksheet(name);
    if (!sheet) return [];
    const rows = [];
    let headers = [];
    sheet.eachRow((row, i) => {
      const vals = row.values.slice(1); // exceljs row.values is 1-indexed
      if (i === 1) { headers = vals; return; }
      const obj = {};
      headers.forEach((h, idx) => { obj[h] = vals[idx] ?? ''; });
      rows.push(obj);
    });
    return rows;
  }

  return {
    strikes: sheetToJSON('Strikes'),
    events:  sheetToJSON('Event Log'),
    admins:  sheetToJSON('Admin Roster'),
  };
}

const server = http.createServer(async (req, res) => {
  const send = (code, type, body) => {
    res.writeHead(code, { 'Content-Type': type, 'Access-Control-Allow-Origin': '*' });
    res.end(body);
  };

  if (req.url === '/api/data') {
    try {
      const data = await readSheets();
      return send(200, 'application/json', JSON.stringify(data));
    } catch (e) {
      return send(500, 'application/json', JSON.stringify({ error: e.message }));
    }
  }

  if (req.url === '/api/download') {
    if (!fs.existsSync(XLSX_PATH)) return send(404, 'text/plain', 'Not found');
    res.writeHead(200, {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="sos_log.xlsx"',
    });
    return fs.createReadStream(XLSX_PATH).pipe(res);
  }

  if (req.url === '/' || req.url === '/index.html') {
    const html = fs.readFileSync(path.join(__dirname, 'dashboard', 'index.html'));
    return send(200, 'text/html', html);
  }

  send(404, 'text/plain', 'Not found');
});

server.listen(PORT, () => {
  console.log(`📊 Dashboard → http://localhost:${PORT}`);
});
