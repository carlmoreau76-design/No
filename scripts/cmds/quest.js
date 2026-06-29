/**
 * @file quest.js
 * @description Système MMORPG de Quêtes Dynamiques Premium pour GoatBot v2
 * @command quest
 * @credits Format GoatBot v2 & Canvas Engine Premium
 */

const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

// Chemins de stockage
const DATA_DIR = path.join(__dirname, 'cache', 'questData');
const PLAYER_QUESTS_FILE = path.join(DATA_DIR, 'player_quests.json');
const STATS_FILE = path.join(DATA_DIR, 'player_stats.json');

// Création des structures de fichiers si inexistantes
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(PLAYER_QUESTS_FILE)) fs.writeFileSync(PLAYER_QUESTS_FILE, JSON.stringify({}, null, 2));
if (!fs.existsSync(STATS_FILE)) fs.writeFileSync(STATS_FILE, JSON.stringify({}, null, 2));

// Jeton d'accès Facebook pour les avatars HD (Synchronisé avec pirate.js)
const FB_TOKEN = "6628568379|c1e620fa708a1d5696fb991c1bde5662";

// --- CONFIGURATION DU SYSTÈME DE DIFFICULTÉ ---
const DIFFICULTIES = {
  commune: { name: "Commune", color: "#b0b0b0", mult: 1.0, chance: 0.50 },
  rare: { name: "Rare", color: "#00cf64", mult: 1.5, chance: 0.25 },
  epique: { name: "Épique", color: "#00bfff", mult: 2.2, chance: 0.15 },
  legendaire: { name: "Légendaire", color: "#ff0055", mult: 3.5, chance: 0.06 },
  mythique: { name: "Mythique", color: "#a020f0", mult: 5.5, chance: 0.03 },
  divine: { name: "Divine", color: "#ffd700", mult: 10.0, chance: 0.01 }
};

// --- CONFIGURATION DES SUCCÈS (ACHIEVEMENTS) ---
const ACHIEVEMENTS_DB = {
  aventurier: { title: "Aventurier Novice", req: 5, reward: 5000, badge: "🧭" },
  heros: { title: "Héros des Tavernes", req: 25, reward: 30000, badge: "⚔️" },
  chasseur: { title: "Chasseur de Dragons", req: 75, reward: 150000, badge: "🐉" },
  roi_pirate: { title: "Roi Pirate", req: 150, reward: 500000, badge: "🏴‍☠️" },
  millionnaire: { title: "Sultan Éternel", req: 300, reward: 2000000, badge: "👑" },
  legende: { title: "Légende Vivante des Mers", req: 600, reward: 10000000, badge: "🌌" }
};

// --- TYPES D'OBJECTIFS DISPONIBLES ---
const OBJECTIVE_TYPES = [
  { key: "arena_win", text: "Gagner X combats dans l'arène", base: 3, action: "arena" },
  { key: "pirate_explore", text: "Explorer X fois avec la commande pirate", base: 5, action: "explore" },
  { key: "find_treasure", text: "Trouver X trésors cachés", base: 2, action: "treasure" },
  { key: "play_dice", text: "Jouer X parties de dés (dice)", base: 8, action: "dice" },
  { key: "play_mines", text: "Déminer X grilles dans le mines", base: 4, action: "mines" },
  { key: "play_slots", text: "Lancer X fois la machine à sous (slots)", base: 10, action: "slots" },
  { key: "casino_profit", text: "Gagner X$ cumulés au casino", base: 25000, action: "casino" },
  { key: "bank_deposit", text: "Déposer X$ d'or à la banque", base: 50000, action: "bank" },
  { key: "bank_withdraw", text: "Retirer X$ de votre compte bancaire", base: 20000, action: "bank" },
  { key: "transfer_money", text: "Effectuer un virement d'argent", base: 1, action: "transfer" },
  { key: "boss_defeat", text: "Battre X boss de raid avec votre équipage", base: 1, action: "battle" },
  { key: "chest_open", text: "Ouvrir X coffres au trésor", base: 3, action: "chest" }
];

// --- FONCTIONS AUXILIAIRES DE PERSISTANCE ---
function readJSON(file) { return JSON.parse(fs.readFileSync(file, 'utf8')); }
function writeJSON(file, data) { fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8'); }

function getPlayerQuests(uid) {
  const data = readJSON(PLAYER_QUESTS_FILE);
  if (!data[uid]) {
    data[uid] = { daily: [], weekly: [], story: [], secret: [], lastDailyReset: 0, lastWeeklyReset: 0 };
    writeJSON(PLAYER_QUESTS_FILE, data);
  }
  return data[uid];
}

function getPlayerStats(uid) {
  const data = readJSON(STATS_FILE);
  if (!data[uid]) {
    data[uid] = { completed: 0, failed: 0, moneyEarned: 0, xpEarned: 0, titles: [], history: [] };
    writeJSON(STATS_FILE, data);
  }
  return data[uid];
}

function updatePlayerQuests(uid, obj) {
  const data = readJSON(PLAYER_QUESTS_FILE);
  data[uid] = obj;
  writeJSON(PLAYER_QUESTS_FILE, data);
}

function updatePlayerStats(uid, obj) {
  const data = readJSON(STATS_FILE);
  data[uid] = obj;
  writeJSON(STATS_FILE, data);
}
