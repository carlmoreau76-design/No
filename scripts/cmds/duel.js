/**
 * @file duel.js
 * @description Système PvP Premium entre joueurs avec Rangs, Paris, Bonus Aléatoires et Mode Spectateur pour GoatBot v2
 * @version 1.0.0
 * @author Collaborateur IA RPG
 */

const fs = require('fs');
const path = require('path');

// ==========================================
// 📁 CONFIGURATION ET PERSISTANCE DES DONNÉES
// ==========================================
const DATA_DIR = path.join(__dirname, 'cache', 'duelPvP');
const STATS_FILE = path.join(DATA_DIR, 'player_stats.json');
const HISTORY_FILE = path.join(DATA_DIR, 'global_history.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(STATS_FILE)) fs.writeFileSync(STATS_FILE, JSON.stringify({}, null, 2));
if (!fs.existsSync(HISTORY_FILE)) fs.writeFileSync(HISTORY_FILE, JSON.stringify([], null, 2));

// Global Memory State for active fights (Anti-cheat & Spectator Mode)
if (!global.pvpActiveFights) global.pvpActiveFights = new Map(); 
if (!global.pvpPendingDefis) global.pvpPendingDefis = new Map();

// ==========================================
// 🏅 ÉCHELLE DES RANGS PVP & SUCCÈS
// ==========================================
const PVP_RANKS = [
  { name: "Débutant", minPoints: 0, dailyReward: 5000 },
  { name: "Bronze", minPoints: 100, dailyReward: 12000 },
  { name: "Argent", minPoints: 300, dailyReward: 25000 },
  { name: "Or", minPoints: 600, dailyReward: 50000 },
  { name: "Platine", minPoints: 1000, dailyReward: 100000 },
  { name: "Diamant", minPoints: 1500, dailyReward: 200000 },
  { name: "Maître", minPoints: 2200, dailyReward: 400000 },
  { name: "Grand Maître", minPoints: 3000, dailyReward: 750000 },
  { name: "Légende", minPoints: 4000, dailyReward: 1500000 },
  { name: "GOAT", minPoints: 5500, dailyReward: 3000000 }
];

const ACHIEVEMENTS = {
  first: { name: "🔰 Premier Duel", desc: "Prendre part à son premier combat" },
  v10: { name: "🥊 10 Victoires", desc: "Terrasser 10 adversaires" },
  v50: { name: "⚔️ 50 Victoires", desc: "Terrasser 50 adversaires" },
  v100: { name: "🏆 100 Victoires", desc: "Atteindre les 100 victoires" },
  champion: { name: "🥇 Champion", desc: "Atteindre le rang Diamant" },
  invincible: { name: "🔥 Invincible", desc: "Avoir une série de 7 victoires" },
  goat_fighter: { name: "👑 GOAT Fighter", desc: "Atteindre le rang maximal GOAT" }
};

// ==========================================
// 🛠️ UTILITIES DE SYNCHRONISATION
// ==========================================
function readDB(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { return {}; }
}
function writeDB(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
}

function getPlayerStats(uid, name = "Guerrier") {
  const db = readDB(STATS_FILE);
  if (!db[uid]) {
    db[uid] = {
      name: name,
      points: 0,
      totalCombats: 0,
      wins: 0,
      losses: 0,
      streak: 0,
      maxStreak: 0,
      maxGain: 0,
      lastDaily: 0,
      achievements: []
    };
    writeDB(STATS_FILE, db);
  }
  return db[uid];
}

function getRankName(points) {
  let currentRank = PVP_RANKS[0].name;
  for (const r of PVP_RANKS) {
    if (points >= r.minPoints) currentRank = r.name;
  }
  return currentRank;
}

const UI = {
  line: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
  boxStart: (title) => `╭───────────── ⚔️ ─────────────╮\n│ 🏟️  ${title.toUpperCase()}\n├───────────────────────────────`,
  boxEnd: () => `╰───────────────────────────────╯`,
  field: (label, val) => `│ ➔ ${label} : ${val}`
};

// ==========================================
// 🛡️ ACCROCHE ET CONFIGURATION GOATBOT V2
// ==========================================
module.exports = {
  config: {
    name: "duel",
    aliases: ["fight", "pvp", "defier"],
    version: "1.0.0",
    author: "Collaborateur IA RPG",
    countDown: 2,
    role: 0,
    description: "Système complet de duels PvP synchronisés avec mises, modificateurs et mode spectateur.",
    category: "jeux",
    guide: { fr: "{p}duel [@user] [mise]", en: "{p}duel [@user] [bet]" }
  },

  onStart: async function ({ api, event, args, usersData, message }) {
    const { senderID, threadID, mentions } = event;
    const subCommand = args[0]?.toLowerCase();

    let userData = await usersData.get(senderID);
    let pStats = getPlayerStats(senderID, userData.name);

    // ==========================================
    // 📜 INTERFACE : MENU D'AIDE CENTRALISÉ
    // ==========================================
    if (!subCommand || (subCommand && isNaN(subCommand) && !["accept", "decline", "stats", "top", "leaderboard", "history", "rank", "daily", "spectate"].includes(subCommand) && Object.keys(mentions).length === 0)) {
      let menu = `╭───────────────────────────────────────╮\n`;
      menu += `│ ⚔️  𝐀𝐑È𝐍𝐄 𝐃𝐄 𝐃𝐔𝐄𝐋 𝐏𝐕𝐏 𝐏𝐑𝐄𝐌𝐈𝐔𝐌\n`;
      menu += `├───────────────────────────────────────┤\n`;
      menu += `│ 🔹 ~duel @user <mise> : Défier un joueur avec enjeu\n`;
      menu += `│ 🔹 ~duel accept : Accepter le défi reçu\n`;
      menu += `│ 🔹 ~duel decline : Refuser le défi reçu\n`;
      menu += `│ 🔹 ~duel spectate : Suivre le combat en cours\n`;
      menu += `├───────────────────────────────────────┤\n`;
      menu += `│ 📊 𝐒𝐓𝐀𝐓𝐈𝐒𝐓𝐈𝐐𝐔𝐄𝐒 & 𝐂𝐋𝐀𝐒𝐒𝐄𝐌𝐄𝐍𝐓𝐒\n`;
      menu += `├───────────────────────────────────────┤\n`;
      menu += `│ 🔹 ~duel stats : Consulter votre fiche PvP\n`;
      menu += `│ 🔹 ~duel rank : Voir la liste des Rangs PvP\n`;
      menu += `│ 🔹 ~duel top : Liste des meilleurs duellistes\n`;
      menu += `│ 🔹 ~duel history : 20 derniers duels du serveur\n`;
      menu += `│ 🔹 ~duel daily : Récompense d'or liée à votre rang\n`;
      menu += `├───────────────────────────────────────┤\n`;
      menu += `│ 🛑 Taxe d'arène : 5% sur le pot global du vainqueur\n`;
      menu += `│ 👑 Rang Actuel : **${getRankName(pStats.points)}** (${pStats.points} pts)\n`;
      menu += `╰───────────────────────────────────────╯`;
      return message.reply(menu);
    }
