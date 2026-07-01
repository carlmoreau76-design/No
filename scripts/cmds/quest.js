/**
 * @file quest.js
 * @description Système de Quêtes RPG & Succès MMORPG Ultra Premium interconnecté pour GoatBot v2
 * @version 1.0.0
 * @author Collaborateur IA RPG
 */

const fs = require('fs');
const path = require('path');

// ==========================================
// 📁 COORDONNÉES ET STRUCTURE DU STOCKAGE
// ==========================================
const DATA_DIR = path.join(__dirname, 'cache', 'questsMMO');
const PLAYER_QUESTS_FILE = path.join(DATA_DIR, 'player_quests.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(PLAYER_QUESTS_FILE)) fs.writeFileSync(PLAYER_QUESTS_FILE, JSON.stringify({}, null, 2));

// ==========================================
// 📊 DICTIONNAIRE DES DIFFICULTÉS ET COEFFICIENTS
// ==========================================
const DIFFICULTIES = {
  common: { name: "Commune", color: "⚪", mult: 1.0 },
  rare: { name: "Rare", color: "🔵", mult: 1.5 },
  epic: { name: "Épique", color: "🟣", mult: 2.2 },
  legendary: { name: "Légendaire", color: "🟠", mult: 3.5 },
  mythic: { name: "Mythique", color: "🔴", mult: 5.5 },
  divine: { name: "Divine", color: "🌈", mult: 10.0 }
};

// ==========================================
// 🎯 MODÈLES D'OBJECTIFS DISPONIBLES POUR LA GÉNÉRATION INTERCONNECTÉE
// ==========================================
const OBJECTIVE_TEMPLATES = {
  "arena_win": { text: "Gagner {count} combats dans l'arène", baseCount: 3 },
  "pirate_explore": { text: "Mener {count} explorations avec les pirates", baseCount: 5 },
  "treasure_find": { text: "Déterrer {count} trésors cachés", baseCount: 2 },
  "dice_play": { text: "Jouer {count} parties de Dice", baseCount: 10 },
  "mines_play": { text: "Déminer {count} grilles dans les Mines", baseCount: 4 },
  "slots_play": { text: "Lancer {count} rotations aux Machines à sous", baseCount: 8 },
  "bank_deposit": { text: "Déposer au moins {count}$ à la Banque", baseCount: 50000 },
  "chest_open": { text: "Ouvrir {count} coffres de butin", baseCount: 3 }
};

// ==========================================
// 🏆 REPERTOIRE DES SUCCÈS HISTORIQUES (ACHIEVEMENTS)
// ==========================================
const ACHIEVEMENTS_DB = {
  "aventurier": { name: "Aventurier", desc: "Avoir accompli 10 quêtes au total", req: 10 },
  "heros": { name: "Héros du Royaume", desc: "Avoir accompli 50 quêtes au total", req: 50 },
  "roi_pirate": { name: "Roi Pirate", desc: "Avoir accompli 25 quêtes d'exploration", req: 25 },
  "millionnaire": { name: "Magnat Financier", desc: "Cumuler plus de 10 000 000$ via les quêtes", req: 10000000 },
  "legende": { name: "Légende Vivante", desc: "Avoir accompli 5 quêtes de difficulté Divine", req: 5 }
};

// ==========================================
// 🗺️ BANQUE DE DONNÉES DE LA CAMPAGNE PRINCIPALE (STORY MODE)
// ==========================================
const STORY_LINE = [
  { step: 1, name: "Le Réveil du Mercenaire", type: "arena_win", target: 3, diff: "common", reward: { money: 25000, xp: 100 } },
  { step: 2, name: "L'Appel du Grand Large", type: "pirate_explore", target: 5, diff: "rare", reward: { money: 75000, xp: 300 } },
  { step: 3, name: "Le Pacte du Banquier", type: "bank_deposit", target: 200000, diff: "epic", reward: { money: 150000, xp: 700 } },
  { step: 4, name: "Le Secret des Profondeurs", type: "treasure_find", target: 10, diff: "legendary", reward: { money: 500000, xp: 2000 } }
];

// ==========================================
// 🛠️ UTILITIES ET SYSTÈME DE SYNCHRONISATION DES FICHIERS
// ==========================================
function readDB(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { return {}; }
}
function writeDB(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
}

function getPlayerQuests(uid) {
  const db = readDB(PLAYER_QUESTS_FILE);
  if (!db[uid]) {
    db[uid] = {
      daily: [], weekly: [], storyStep: 1, activeStory: null,
      secret: [], stats: { totalCompleted: 0, totalFailed: 0, totalGoldEarned: 0, divineCompleted: 0, pirateQuests: 0 },
      history: [], achievements: [], lastDailyReset: 0, lastWeeklyReset: 0
    };
    writeDB(PLAYER_QUESTS_FILE, db);
  }
  return db[uid];
}

function savePlayerQuests(uid, data) {
  const db = readDB(PLAYER_QUESTS_FILE);
  db[uid] = data;
  writeDB(PLAYER_QUESTS_FILE, db);
}

// Générateur procédural de quêtes uniques aléatoires
function generateRandomQuest(type, difficultyKey) {
  const templatesKeys = Object.keys(OBJECTIVE_TEMPLATES);
  const selectedType = templatesKeys[Math.floor(Math.random() * templatesKeys.length)];
  const template = OBJECTIVE_TEMPLATES[selectedType];
  const diff = DIFFICULTIES[difficultyKey];

  const targetCount = Math.floor(template.baseCount * diff.mult);
  const goldReward = Math.floor((Math.random() * 50000 + 30000) * diff.mult);
  const xpReward = Math.floor((Math.random() * 200 + 100) * diff.mult);

  return {
    id: Math.random().toString(16).substring(2, 8).toUpperCase(),
    type: selectedType,
    text: template.text.replace("{count}", targetCount.toLocaleString()),
    target: targetCount,
    current: 0,
    difficulty: difficultyKey,
    claimed: false,
    reward: { money: goldReward, xp: xpReward }
  };
}

const UI = {
  line: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
  boxStart: (title) => `╭───────────── 📜 ─────────────╮\n│ 🌟  ${title.toUpperCase()}\n├───────────────────────────────`,
  boxEnd: () => `╰───────────────────────────────╯`,
  field: (label, val) => `│ 🔸 ${label} : ${val}`,
  progressBar: (current, target) => {
    const percent = Math.min(100, Math.floor((current / target) * 100));
    const progress = Math.min(10, Math.floor(percent / 10));
    const bar = "🟩".repeat(progress) + "⬛".repeat(10 - progress);
    return `${bar} (${percent}%)`;
  }
};

// ==========================================
// 🛡️ ACCROCHE DE L'API COMPATIBLE GOATBOT
// ==========================================
module.exports = {
  config: {
    name: "quest",
    aliases: ["quests", "quêtes", "q", "objectifs"],
    version: "1.0.0",
    author: "Collaborateur IA RPG",
    countDown: 2,
    role: 0,
    description: "Système de quêtes MMORPG complet connecté de manière dynamique à toutes vos actions.",
    category: "jeux",
    guide: { fr: "{p}quest [sous-commande]", en: "{p}quest [subcommand]" }
  },

  onStart: async function ({ api, event, args, usersData, message }) {
    const { senderID, threadID } = event;
    const qData = getPlayerQuests(senderID);
    const subCommand = args[0]?.toLowerCase();

    // ==========================================
    // 📜 INTERFACE : MENU D'AIDE AUTOMATIQUE (SI "quest" UNIQUEMENT)
    // ==========================================
    if (!subCommand) {
      let menu = `╭───────────────────────────────────────╮\n`;
      menu += `│ 📜  𝐒𝐘𝐒𝐓È𝐌𝐄 𝐃𝐄 𝐐𝐔É𝐓𝐄𝐒 𝐌𝐌𝐎𝐑𝐏𝐆\n`;
      menu += `├───────────────────────────────────────┤\n`;
      menu += `│ 🔹 ~quest daily : Vos missions quotidiennes (24h)\n`;
      menu += `│ 🔹 ~quest weekly : Vos objectifs majeurs de la semaine\n`;
      menu += `│ 🔹 ~quest story : Progression dans la campagne narrative\n`;
      menu += `│ 🔹 ~quest secret : Déceler les contrats classifiés\n`;
      menu += `├───────────────────────────────────────┤\n`;
      menu += `│ 💰 𝐑𝐄𝐕𝐄𝐍𝐃𝐈𝐂𝐀𝐓𝐈𝐎𝐍 & 📊 𝐒𝐔𝐈𝐕𝐈\n`;
      menu += `├───────────────────────────────────────┤\n`;
      menu += `│ 🔹 ~quest claim <type> <ID> : Encaisser les récompenses\n`;
      menu += `│ 🔹 ~quest info : Afficher les succès débloqués\n`;
      menu += `│ 🔹 ~quest history : Grand livre des exploits passés\n`;
      menu += `│ 🔹 ~quest leaderboard : Classement mondial des Maîtres\n`;
      menu += `│ 🔹 ~quest refresh : Re-tirer vos quêtes (cooldown)\n`;
      menu += `├───────────────────────────────────────┤\n`;
      menu += `│ 🔄 Ce système suit automatiquement vos performances\n`;
      menu += `│    dans : arena, pirate, bank, slots, dice et mines !\n`;
      menu += `╰───────────────────────────────────────╯`;
      return message.reply(menu);
    }
