/**
 * @file guild.js
 * @description Système de Guilde MMORPG Complet & Autonome pour GoatBot v2
 * @version 2.5.0
 * @author Collaborateur IA RPG
 * @credits Conception Premium MMORPG Engine
 */

const fs = require('fs');
const path = require('path');

// ==========================================
// 📁 CHEMINS DE STOCKAGE DE LA BASE DE DONNÉES
// ==========================================
const DATA_DIR = path.join(__dirname, 'cache', 'guildsMMO');
const GUILDS_FILE = path.join(DATA_DIR, 'guilds_registry.json');
const USERS_FILE = path.join(DATA_DIR, 'users_registry.json');
const WAR_FILE = path.join(DATA_DIR, 'war_state.json');

// Initialisation physique des répertoires et fichiers JSON
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(GUILDS_FILE)) fs.writeFileSync(GUILDS_FILE, JSON.stringify({}, null, 2));
if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, JSON.stringify({}, null, 2));
if (!fs.existsSync(WAR_FILE)) fs.writeFileSync(WAR_FILE, JSON.stringify({ phase: "ended", nextWarTime: Date.now() + 60000 }, null, 2));

// ==========================================
// 🌍 CONFIGURATION ET ATLAS DES TERRITOIRES
// ==========================================
const TERRITORIES_MAP = {
  nord: { id: "nord", name: "Royaume du Nord", emoji: "🏰", tier: 1, money: 15000, xp: 400, chestChance: 0.10 },
  iles: { id: "iles", name: "Îles Perdues", emoji: "🏝", tier: 1, money: 22000, xp: 600, chestChance: 0.15 },
  volcan: { id: "volcan", name: "Terre Volcanique", emoji: "🌋", tier: 2, money: 35000, xp: 900, chestChance: 0.20 },
  foret: { id: "foret", name: "Forêt Antique", emoji: "🌲", tier: 2, money: 48000, xp: 1200, chestChance: 0.22 },
  desert: { id: "desert", name: "Désert d'Or", emoji: "🏜", tier: 3, money: 65000, xp: 1600, chestChance: 0.28 },
  gele: { id: "gele", name: "Royaume Gelé", emoji: "❄", tier: 3, money: 85000, xp: 2100, chestChance: 0.35 },
  celeste: { id: "celeste", name: "Cité Céleste", emoji: "🌌", tier: 4, money: 120000, xp: 3000, chestChance: 0.45 },
  pirate: { id: "pirate", name: "Port Pirate", emoji: "⚓", tier: 4, money: 160000, xp: 4200, chestChance: 0.50 },
  dragon: { id: "dragon", name: "Empire du Dragon", emoji: "🏯", tier: 5, money: 250000, xp: 6000, chestChance: 0.65 },
  ombres: { id: "ombres", name: "Royaume des Ombres", emoji: "🌑", tier: 5, money: 500000, xp: 10000, chestChance: 0.80 }
};

// ==========================================
// 👑 HIÉRARCHIE ET DROITS D'ACCÈS DU JEU
// ==========================================
const ROLES = {
  LEADER: { rank: 4, name: "Leader", emoji: "👑", canInvite: true, canKick: true, canPromote: true, canWithdraw: true, canSettings: true },
  CO_LEADER: { rank: 3, name: "Co-Leader", emoji: "⭐", canInvite: true, canKick: true, canPromote: true, canWithdraw: true, canSettings: false },
  OFFICIER: { rank: 2, name: "Officier", emoji: "🛡", canInvite: true, canKick: false, canPromote: false, canWithdraw: false, canSettings: false },
  MEMBRE: { rank: 1, name: "Membre", emoji: "👤", canInvite: false, canKick: false, canPromote: false, canWithdraw: false, canSettings: false }
};

// ==========================================
// 🛠 Fonctions Entrées/Sorties de données
// ==========================================
function readDB(filePath) {
  try { return JSON.parse(fs.readFileSync(filePath, 'utf8')); }
  catch (e) { return {}; }
}

function writeDB(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

// Générateur d'identifiant hexadécimal à 6 caractères pour les guildes
function generateUID() {
  return Math.random().toString(16).substring(2, 8).toUpperCase();
}

// Récupérer la liaison guilde d'un joueur
function getUserLink(uid) {
  const db = readDB(USERS_FILE);
  return db[uid] || null;
}

// Assigner ou supprimer la liaison guilde d'un joueur
function setUserLink(uid, linkObj) {
  const db = readDB(USERS_FILE);
  if (!linkObj) delete db[uid];
  else db[uid] = linkObj;
  writeDB(USERS_FILE, db);
}

// ==========================================
// 📈 ALGORITHMES DE PROGRESSION ET DE COÛTS
// ==========================================
function getUpgradeCost(level) {
  return Math.floor(1000000 * Math.pow(1.32, level - 1));
}

function getMaxMembers(level) {
  return Math.min(100, 15 + Math.floor(level * 1.75));
}

function getLevelBonus(level) {
  return {
    xpMultiplier: 1 + (level * 0.05), // +5% par niveau
    moneyMultiplier: 1 + (level * 0.04), // +4% par niveau
    warBonus: level * 15 // Dégâts bruts en plus
  };
}

// Système d'enregistrement interne à la guilde (Max 30 entrées)
function addGuildLog(guild, action) {
  const entry = {
    time: new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris' }),
    action: action
  };
  guild.logs.push(entry);
  if (guild.logs.length > 30) guild.logs.shift();
}
