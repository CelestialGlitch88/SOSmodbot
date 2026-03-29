// find-group-id.js — run once to find all WhatsApp group IDs
// Usage: node find-group-id.js

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const client = new Client({ authStrategy: new LocalAuth() });

client.on('qr', (qr) => {
  console.log('\n📱 Scan QR with the BOT account to list all groups:\n');
  qrcode.generate(qr, { small: true });
});

client.on('ready', async () => {
  const chats = await client.getChats();
  const groups = chats.filter(c => c.isGroup);
  console.log('\n📋 Your WhatsApp Groups:\n');
  groups.forEach(g => {
    console.log(`Name : ${g.name}`);
    console.log(`ID   : ${g.id._serialized}`);
    console.log('─'.repeat(40));
  });
  console.log('\n→ Add admin numbers to sos_log.xlsx (Admin Roster tab)');
  process.exit(0);
});

client.initialize();
