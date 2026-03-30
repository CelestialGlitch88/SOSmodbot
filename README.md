# SOSmodbot
# 

WhatsApp moderation bot for SOS volunteer groups.

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
| 🟣 Purple | Night violation → DMs sent |
| 🟠 Orange | Day 1st strike (silent) |
| 🔴 Red | Day 2nd+ strike → DMs sent |
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
cd to your directory
```

### 2. Install
```bash
npm install
```

### 3. Run
```bash
npm start
```

On first run, a **setup wizard** will appear in the terminal asking for admin names and phone numbers. Fill these in and the XLSX is created automatically. After that, scan the QR with the bot's WhatsApp account.

---

## Adding to GitHub

```bash
git init
git add .
git commit -m "SOS bot v3"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/sos-group-bot.git
git push -u origin main
```

> ✅ `logs/` is gitignored — your XLSX data stays local.

---

## Managing admins

Open `logs/sos_log.xlsx` → **Admin Roster** tab at any time to:
- Add new admins (set Active to YES)
- Deactivate admins (set Active to NO)
- Edit roles or numbers

Changes take effect immediately — no restart needed.

---

## Hosting

### Any Linux VPS (Hetzner, DigitalOcean, Oracle)
```bash
npm install -g pm2
pm2 start run.js --name sos-bot
pm2 save && pm2 startup
```

### Updating after code changes
```bash
git pull
pm2 restart sos-bot
```
