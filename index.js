const { Client, GatewayIntentBits } = require('discord.js');
const { joinVoiceChannel, VoiceConnectionStatus, entersState } = require('@discordjs/voice');
const express = require('express');

// --- 1. WEB SERVER UNTUK UPTIMEROBOT ---
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Bot Voice Stay Online!');
});

app.listen(PORT, () => {
  console.log(`Web server berjalan di port ${PORT}`);
});

// --- 2. CONFIGURASI BOT DISCORD ---
const TOKEN = process.env.DISCORD_TOKEN;
const GUILD_ID = '1447441820324855929'; 
const CHANNEL_ID = '1447441821432021036'; 

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

// Fungsi untuk join Voice Channel
function connectToVoice() {
  const guild = client.guilds.cache.get(GUILD_ID);
  if (!guild) return console.log('Guild/Server tidak ditemukan!');

  const channel = guild.channels.cache.get(CHANNEL_ID);
  if (!channel) return console.log('Voice Channel tidak ditemukan!');

  const connection = joinVoiceChannel({
    channelId: channel.id,
    guildId: guild.id,
    adapterCreator: guild.voiceAdapterCreator,
    selfDeaf: true,  // Auto-deafen biar hemat bandwidth
    selfMute: true,  // Auto-mute
  });

  // Fitur Auto-Reconnect kalau koneksi putus
  connection.on(VoiceConnectionStatus.Disconnected, async () => {
    try {
      await Promise.race([
        entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
        entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
      ]);
    } catch (error) {
      console.log('Koneksi terputus, mencoba connect ulang...');
      connection.destroy();
      connectToVoice();
    }
  });
}

client.once('ready', () => {
  console.log(`Bot berhasil login sebagai ${client.user.tag}`);
  connectToVoice(); // Otomatis masuk VC saat bot nyala
});

client.login(TOKEN);