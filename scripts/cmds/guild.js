/**
 * @file guild.js
 * @description Système de Guildes MMORPG Ultra Premium Interconnecté pour GoatBot v2
 * @command guild
 * @credits Format GoatBot v2 & MMORPG Engine
 */

const fs = require('fs');
const path = require('path');

// --- CONSTANTES ET PERSISTANCE DE STOCKAGE ---
const DATA_DIR = path.join(__dirname, 'cache', 'guildData');
const GUILDS_FILE = path.join(DATA_DIR, 'guilds.json');
const USERS_GUILD_FILE = path.join(DATA_DIR, 'users_guilds.json');
const WAR_FILE = path.join(DATA_DIR, 'current_war.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(GUILDS_FILE)) fs.writeFileSync(GUILDS_FILE, JSON.stringify({}, null, 2));
if (!fs.existsSync(USERS_GUILD_FILE)) fs.writeFileSync(USERS_GUILD_FILE, JSON.stringify({}, null, 2));
if (!fs.existsSync(WAR_FILE)) fs.writeFileSync(WAR_FILE, JSON.stringify({}, null, 2));

// --- BASE DE DONNÉES DES TERRITOIRES ---
const TERRITORIES_DB = {
  nord: { id: "nord", name: "Royaume du Nord", emoji: "🏰", moneyReward: 5000, xpReward: 200, tier: 1 },
  iles: { id: "iles", name: "Îles Perdues", emoji: "🏝", moneyReward: 8000, xpReward: 350, tier: 1 },
  volcan: { id: "volcan", name: "Terre Volcanique", emoji: "🌋", moneyReward: 12000, xpReward: 500, tier: 2 },
  foret: { id: "foret", name: "Forêt Antique", emoji: "🌲", moneyReward: 15000, xpReward: 650, tier: 2 },
  desert: { id: "desert", name: "Désert d'Or", emoji: "🏜", moneyReward: 20000, xpReward: 900, tier: 3 },
  gele: { id: "gele", name: "Royaume Gelé", emoji: "❄", moneyReward: 25000, xpReward: 1200, tier: 3 },
  celeste: { id: "celeste", name: "Cité Céleste", emoji: "🌌", moneyReward: 35000, xpReward: 1800, tier: 4 },
  pirate: { id: "pirate", name: "Port Pirate", emoji: "⚓", moneyReward: 45000, xpReward: 2400, tier: 4 },
  dragon: { id: "dragon", name: "Empire du Dragon", emoji: "🏯", moneyReward: 60000, xpReward: 3500, tier: 5 },
  ombres: { id: "ombres", name: "Royaume des Ombres", emoji: "🌑", moneyReward: 100000, xpReward: 5000, tier: 5 }
};

// --- CONFIGURATION DE LA HIÉRARCHIE (ROLES) ---
const ROLES = {
  LEADER: { rank: 4, name: "Leader", emoji: "👑" },
  CO_LEADER: { rank: 3, name: "Co-Leader", emoji: "⭐" },
  OFFICIER: { rank: 2, name: "Officier", emoji: "🛡" },
  MEMBRE: { rank: 1, name: "Membre", emoji: "👤" }
};

// --- FONCTIONS LOGIQUES DE LECTURE / ÉCRITURE ---
function readJSON(file) { return JSON.parse(fs.readFileSync(file, 'utf8')); }
function writeJSON(file, data) { fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8'); }

// Générateur d'ID unique à 6 caractères hexadécimaux
function generateGuildID() {
  return Math.random().toString(16).substring(2, 8).toUpperCase();
}

// Récupérer le lien d'un joueur à sa guilde
function getUserGuildLink(uid) {
  const users = readJSON(USERS_GUILD_FILE);
  return users[uid] || null; // { guildId: "XXXXXX", role: "MEMBRE" }
}

function setUserGuildLink(uid, linkObj) {
  const users = readJSON(USERS_GUILD_FILE);
  if (linkObj === null) {
    delete users[uid];
  } else {
    users[uid] = linkObj;
  }
  writeJSON(USERS_GUILD_FILE, users);
}

// Calculer le coût d'amélioration du niveau de guilde (1 à 50)
function getUpgradeCost(currentLevel) {
  return Math.floor(500000 * Math.pow(1.28, currentLevel));
}

// Calculer la capacité max de membres selon le niveau
function getMaxMembers(level) {
  return Math.min(100, 10 + Math.floor(level * 1.8));
}

// --- LOGS DE GUILDE INTERNES ---
function logGuildAction(guild, actionText) {
  const logEntry = {
    date: new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris' }),
    action: actionText
  };
  guild.logs.push(logEntry);
  if (guild.logs.length > 40) guild.logs.shift(); // Nettoyage régulier des anciens logs
}

// --- UTILS : COMPOSITEUR D'INTERFACES TEXTUELLES ---
const UI = {
  line: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
  boxStart: (title) => `╭────────────── 🌟 ──────────────╮\n│ ⚔️  ${title.toUpperCase()}\n├───────────────────────────────────────`,
  boxEnd: () => `╰───────────────────────────────────────╯`,
  field: (label, val) => `│ 🔹 ${label} : ${val}`
};
