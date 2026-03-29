# SOSmodbot
Whatsapp moderator bot for Volunteer SOS groups
# 🛡️ SOS Group Bot v2

WhatsApp moderation bot for Apartment SOS volunteer groups.

## What it does

- 🔍 Detects **forwarded messages** and **links** via regex
- 🗑️ **Deletes violations instantly** (bot must be a group admin)
- 📊 Logs **every single message** to `sos_log.xlsx` → Event Log sheet
- 🎯 Tracks **per-member strikes** in the Strikes sheet with colour coding
- 🌙 **Night violations (9pm–7am IST)** → DMs every active top-level admin directly
- ☀️ **Day violations** → silent log only (orange = 1st strike, red = 2nd+)
- 👑 **Admins are whitelisted** — their messages are never touched
- 📋 **Admin Roster** managed directly in the XLSX file — no code changes needed

## Colour coding in sos_log.xlsx

| Colour | Meaning |
|--------|---------|
| 🔴 Red | Night violation (any strike) OR day 2nd+ strike |
| 🟠 Orange | Day violation, 1st strike |
| No highlight | Clean message |

## Requirements

- [Node.js 18+](https://nodejs.org)
- [Python 3 + openpyxl](https://pypi.org/project/openpyxl/) (for initial XLSX setup only)
- A dedicated WhatsApp number for the bot
- Bot must be added as **admin** to the SOS group

---

## Setup

### 1. Clone
```bash
git clone https://github.com/YOUR_USERNAME/sos-group-bot.git
cd sos-group-bot
```

### 2. Install
```bash
npm install
pip3 install openpyxl   # one-time only
```

### 3. Create the XLSX log file
```bash
node scripts/seed-xlsx.js
```
This creates `logs/sos_log.xlsx` with all 3 sheets pre-formatted.

### 4. Add top-level admins
Open `logs/sos_log.xlsx` → go to **Admin Roster** tab → fill in admin names and phone numbers (with country code, e.g. `919876543210`). Set Active column to `YES`.

### 5. Configure
```bash
cp .env.example .env
```
No extra config needed — admin numbers come from the XLSX.

### 6. Run
```bash
npm start
```
Scan QR with the bot's WhatsApp account. Open `http://localhost:3000` for the dashboard.

---

## Adding to GitHub

```bash
git init
git add .
git commit -m "SOS bot v2"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/sos-group-bot.git
git push -u origin main
```

> ✅ `.env` and `logs/` are gitignored — your data and secrets stay local.

---

## Hosting for 24/7 uptime

### Railway (easiest cloud option)
1. Push to GitHub
2. [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Set `DASHBOARD_PORT=3000` in Railway environment variables

### Old Android + Termux (free, always on)
```bash
pkg install nodejs python git
pip install openpyxl
git clone https://github.com/YOUR_USERNAME/sos-group-bot.git
cd sos-group-bot && npm install
node scripts/seed-xlsx.js
npm start
```
Plug in the phone, disable sleep. Done.
