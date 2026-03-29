// index.js — SOS Group Bot v2
require('dotenv').config();
const { Client, LocalAuth, MessageTypes } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { logStrike, logEvent, getActiveAdmins, isNight } = require('./xlsx-logger');

// ── Regex ─────────────────────────────────────────────────────────
const LINK_REGEX = /https?:\/\/[^\s]+|www\.[^\s]+|[^\s]+\.(com|net|org|io|in|co|xyz|info|app|dev)[^\s]*/gi;

// ── In-memory strike counter (backed by XLSX) ──────────────────────
const strikeMap = {}; // { "number": count }

function getStrikeCount(number) {
  return strikeMap[number] || 0;
}

function incrementStrike(number) {
  strikeMap[number] = (strikeMap[number] || 0) + 1;
  return strikeMap[number];
}

// ── Media type label ───────────────────────────────────────────────
function mediaLabel(type) {
  const map = {
    [MessageTypes.IMAGE]:         'Image',
    [MessageTypes.VIDEO]:         'Video',
    [MessageTypes.AUDIO]:         'Audio',
    [MessageTypes.VOICE]:         'Voice Note',
    [MessageTypes.DOCUMENT]:      'Document',
    [MessageTypes.STICKER]:       'Sticker',
    [MessageTypes.LOCATION]:      'Location',
    [MessageTypes.CONTACT_CARD]:  'Contact Card',
    [MessageTypes.TEXT]:          '',
  };
  return map[type] || type || '';
}

// ── WhatsApp client ────────────────────────────────────────────────
const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  },
});

client.on('qr', (qr) => {
  console.log('\n📱 Scan this QR with the BOT WhatsApp account:\n');
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  console.log('✅ SOS Bot v2 is live.');
  console.log('📊 Dashboard → http://localhost:' + (process.env.DASHBOARD_PORT || 3000));
});

client.on('message_create', async (msg) => {
  try {
    // Only act in groups
    if (!msg.from.endsWith('@g.us')) return;

    const chat    = await msg.getChat();
    const contact = await msg.getContact();
    const name    = contact.pushname || contact.number || 'Unknown';
    const number  = contact.number  || msg.author?.replace('@c.us', '') || 'unknown';

    const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    const night     = isNight();
    const dayNight  = night ? 'NIGHT' : 'DAY';

    // ── Detect media type & content ─────────────────────────────
    const msgType   = msg.type || MessageTypes.TEXT;
    const isText    = msgType === MessageTypes.TEXT;
    const media     = mediaLabel(msgType);
    const body      = msg.body || '';
    const caption   = msg.caption || '';
    const content   = isText ? body : (caption || `[${media}]`);

    // ── Admin bypass ────────────────────────────────────────────
    const participants = chat.participants || [];
    const sender = participants.find(
      (p) => p.id._serialized === (msg.author || msg.from)
    );
    const senderIsAdmin = sender?.isAdmin || sender?.isSuperAdmin || false;

    // ── Detect violations ────────────────────────────────────────
    LINK_REGEX.lastIndex = 0;
    const hasLink    = LINK_REGEX.test(body) || LINK_REGEX.test(caption);
    const isForward  = !!msg.isForwarded;
    const isViolation = !senderIsAdmin && (isForward || hasLink);
    const violationType = isForward ? 'forwarded_message' : 'link_shared';

    // ── Log EVERY message to Event Log ──────────────────────────
    await logEvent({
      timestamp,
      name,
      number,
      msgType:    isText ? 'Text' : (media || 'Unknown'),
      content:    content.slice(0, 200), // cap at 200 chars
      mediaType:  media,
      isForward,
      isViolation,
      dayNight,
    });

    // ── If no violation, we're done ──────────────────────────────
    if (!isViolation) return;

    // ── Delete the message ───────────────────────────────────────
    try {
      await msg.delete(true);
    } catch (e) {
      console.warn('Could not delete message (bot may not be admin):', e.message);
    }

    // ── Log strike to XLSX ───────────────────────────────────────
    const strikeCount = incrementStrike(number);
    const preview     = (isText ? body : caption).slice(0, 80);

    await logStrike({
      timestamp,
      name,
      number,
      violationType,
      strikeCount,
      contentPreview: preview,
    });

    console.log(`⚠️  [${dayNight}] ${name} (+${number}) — ${violationType} — Strike #${strikeCount}`);

    // ── Night-time: DM every top-level admin ─────────────────────
    if (night) {
      const admins = await getActiveAdmins();

      if (admins.length === 0) {
        console.warn('⚠️  Night violation but Admin Roster is empty — add admins to sos_log.xlsx');
        return;
      }

      const violationLabel = isForward ? '📨 Forwarded Message' : '🔗 Link Shared';
      const dmText =
        `🚨 *SOS BOT — NIGHT ALERT*\n\n` +
        `A violation occurred while the group should be quiet.\n\n` +
        `👤 *Member:* ${name} (+${number})\n` +
        `⚠️ *Violation:* ${violationLabel}\n` +
        `🎯 *Strike:* #${strikeCount}\n` +
        `🕐 *Time:* ${timestamp}\n` +
        (preview ? `📝 *Preview:* _${preview}_\n` : '') +
        `\n_Message has been deleted. Please review._`;

      for (const admin of admins) {
        try {
          const adminContact = `${admin.number}@c.us`;
          await client.sendMessage(adminContact, dmText);
          console.log(`  → DM sent to ${admin.name} (+${admin.number})`);
        } catch (e) {
          console.warn(`  → Failed to DM ${admin.name}:`, e.message);
        }
      }
    }
    // Day-time: silent — XLSX log only, no pings

  } catch (err) {
    console.error('Bot error:', err.message);
  }
});

client.initialize();

module.exports = { strikeMap };
