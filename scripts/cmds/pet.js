/**
 * @file pet.js
 * @description Système de Familiers MMORPG Ultra Premium & Interconnecté pour GoatBot v2
 * @version 1.0.0
 * @author Collaborateur IA RPG
 */

const fs = require('fs');
const path = require('path');

// ==========================================
// 📁 CONFIGURATION ET INFRASTRUCTURE DE STOCKAGE
// ==========================================
const DATA_DIR = path.join(__dirname, 'cache', 'petsMMO');
const PLAYER_PETS_FILE = path.join(DATA_DIR, 'player_pets.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(PLAYER_PETS_FILE)) fs.writeFileSync(PLAYER_PETS_FILE, JSON.stringify({}, null, 2));

// ==========================================
// 🥚 BASE DE DONNÉES DES ŒUFS ET PROBABILITÉS
// ==========================================
const EGGS_DB = {
  common: { id: "common", name: "Common Egg", emoji: "🥚", price: 50000, rates: { common: 0.70, uncommon: 0.25, rare: 0.05, epic: 0, legendary: 0, mythic: 0, divine: 0 } },
  uncommon: { id: "uncommon", name: "Uncommon Egg", emoji: "🟢", price: 150000, rates: { common: 0.20, uncommon: 0.60, rare: 0.15, epic: 0.05, legendary: 0, mythic: 0, divine: 0 } },
  rare: { id: "rare", name: "Rare Egg", emoji: "🔵", price: 500000, rates: { common: 0.05, uncommon: 0.20, rare: 0.55, epic: 0.15, legendary: 0.05, mythic: 0, divine: 0 } },
  epic: { id: "epic", name: "Epic Egg", emoji: "🟣", price: 1500000, rates: { common: 0, uncommon: 0.05, rare: 0.20, epic: 0.55, legendary: 0.15, mythic: 0.05, divine: 0 } },
  legendary: { id: "legendary", name: "Legendary Egg", emoji: "🟠", price: 5000000, rates: { common: 0, uncommon: 0, rare: 0.05, epic: 0.20, legendary: 0.55, mythic: 0.16, divine: 0.04 } },
  mythic: { id: "mythic", name: "Mythic Egg", emoji: "🔴", price: 15000000, rates: { common: 0, uncommon: 0, rare: 0, epic: 0.10, legendary: 0.25, mythic: 0.50, divine: 0.15 } },
  divine: { id: "divine", name: "Divine Egg", emoji: "🌈", price: 50000000, rates: { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0.15, mythic: 0.35, divine: 0.50 } }
};

// ==========================================
// 🌌 BASE DE DONNÉES SÉRIALISÉE DES FAMILIERS (EXTRAIT ET EXTENSIBLE)
// ==========================================
const PETS_REGISTRY = {
  // --- FAMILLE CHIEN ---
  "chien_1": { id: "chien_1", baseName: "Chiot", emoji: "🐶", rarity: "common", talent: "Lucky", baseHp: 120, baseAtk: 15, baseDef: 10, evoLevel: 15, nextEvoId: "chien_2", bonus: { type: "moneyMultiplier", value: 0.05 } },
  "chien_2": { id: "chien_2", baseName: "Chien de Chasse", emoji: "🐕", rarity: "rare", talent: "Lucky", baseHp: 250, baseAtk: 35, baseDef: 22, evoLevel: 35, nextEvoId: "chien_3", bonus: { type: "moneyMultiplier", value: 0.10 } },
  "chien_3": { id: "chien_3", baseName: "Chien Alpha", emoji: "🐺", rarity: "epic", talent: "Lucky", baseHp: 550, baseAtk: 80, baseDef: 55, evoLevel: null, nextEvoId: null, bonus: { type: "moneyMultiplier", value: 0.15 } },

  // --- FAMILLE LOUP ---
  "loup_1": { id: "loup_1", baseName: "Louveteau", emoji: "🐺", rarity: "uncommon", talent: "Assassin", baseHp: 150, baseAtk: 22, baseDef: 12, evoLevel: 20, nextEvoId: "loup_2", bonus: { type: "atkMultiplier", value: 0.06 } },
  "loup_2": { id: "loup_2", baseName: "Loup Hurlant", emoji: "🐺", rarity: "epic", talent: "Assassin", baseHp: 400, baseAtk: 65, baseDef: 38, evoLevel: 40, nextEvoId: "loup_3", bonus: { type: "atkMultiplier", value: 0.12 } },
  "loup_3": { id: "loup_3", baseName: "Loup Fantomatique", emoji: "👁️‍🗨️", rarity: "legendary", talent: "Assassin", baseHp: 950, baseAtk: 160, baseDef: 90, evoLevel: null, nextEvoId: null, bonus: { type: "atkMultiplier", value: 0.20 } },

  // --- FAMILLE DRAGON ---
  "dragon_1": { id: "dragon_1", baseName: "Petit Dragon", emoji: "🦎", rarity: "epic", talent: "Berserker", baseHp: 300, baseAtk: 45, baseDef: 30, evoLevel: 25, nextEvoId: "dragon_2", bonus: { type: "globalXpMultiplier", value: 0.10 } },
  "dragon_2": { id: "dragon_2", baseName: "Dragon de Feu", emoji: "🐉", rarity: "legendary", talent: "Berserker", baseHp: 800, baseAtk: 120, baseDef: 75, evoLevel: 45, nextEvoId: "dragon_3", bonus: { type: "globalXpMultiplier", value: 0.18 } },
  "dragon_3": { id: "dragon_3", baseName: "Dragon Royal", emoji: "👑", rarity: "mythic", talent: "Berserker", baseHp: 1800, baseAtk: 280, baseDef: 170, evoLevel: 60, nextEvoId: "dragon_4", bonus: { type: "globalXpMultiplier", value: 0.25 } },
  "dragon_4": { id: "dragon_4", baseName: "Dragon Divin", emoji: "🐉", rarity: "divine", talent: "Berserker", baseHp: 4500, baseAtk: 650, baseDef: 400, evoLevel: null, nextEvoId: null, bonus: { type: "globalXpMultiplier", value: 0.40 } },

  // --- FAMILLE KRAKEN ---
  "kraken_1": { id: "kraken_1", baseName: "Tentacule Naissant", emoji: "🦑", rarity: "epic", talent: "Pirate", baseHp: 350, baseAtk: 38, baseDef: 35, evoLevel: 30, nextEvoId: "kraken_2", bonus: { type: "treasureChance", value: 0.10 } },
  "kraken_2": { id: "kraken_2", baseName: "Kraken des Abysses", emoji: "🌊", rarity: "legendary", talent: "Pirate", baseHp: 900, baseAtk: 110, baseDef: 95, evoLevel: 50, nextEvoId: "kraken_3", bonus: { type: "treasureChance", value: 0.20 } },
  "kraken_3": { id: "kraken_3", baseName: "Kraken Mythologique", emoji: "🐙", rarity: "mythic", talent: "Pirate", baseHp: 2200, baseAtk: 290, baseDef: 240, evoLevel: null, nextEvoId: null, bonus: { type: "treasureChance", value: 0.35 } }
};

const RARITY_DETAILS = {
  common: { name: "Commun", color: "⚪", crit: 0.05, dodge: 0.05 },
  uncommon: { name: "Inhabituel", color: "🟢", crit: 0.07, dodge: 0.06 },
  rare: { name: "Rare", color: "🔵", crit: 0.10, dodge: 0.08 },
  epic: { name: "Épique", color: "🟣", crit: 0.13, dodge: 0.10 },
  legendary: { name: "Légendaire", color: "🟠", crit: 0.16, dodge: 0.12 },
  mythic: { name: "Mythique", color: "🔴", crit: 0.20, dodge: 0.15 },
  divine: { name: "Divin", color: "🌈", crit: 0.25, dodge: 0.20 }
};

// ==========================================
// 🛠 UTILITIES : ENTRÉES / SORTIES & LOGIQUE RPG
// ==========================================
function readJSON(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { return {}; }
}
function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
}

function getPlayerStorage(uid) {
  const db = readJSON(PLAYER_PETS_FILE);
  if (!db[uid]) {
    db[uid] = { activePetId: null, inventory: [], lastFeed: 0, lastPlay: 0, lastTrain: 0 };
    writeJSON(PLAYER_PETS_FILE, db);
  }
  return db[uid];
}

function savePlayerStorage(uid, data) {
  const db = readJSON(PLAYER_PETS_FILE);
  db[uid] = data;
  writeJSON(PLAYER_PETS_FILE, db);
}

function calculateStats(pet) {
  const spec = PETS_REGISTRY[pet.baseId];
  if (!spec) return {};
  
  // Modificateurs d'état liés à la faim et au bonheur
  let efficiency = 1.0;
  if (pet.hunger < 30) efficiency -= 0.25;
  if (pet.happiness > 80) efficiency += 0.10;

  const levelFactor = 1 + (pet.level - 1) * 0.12;

  return {
    hp: Math.floor(spec.baseHp * levelFactor * efficiency),
    atk: Math.floor(spec.baseAtk * levelFactor * efficiency),
    def: Math.floor(spec.baseDef * levelFactor * efficiency),
    crit: RARITY_DETAILS[spec.rarity].crit + (pet.happiness / 1000),
    dodge: RARITY_DETAILS[spec.rarity].dodge
  };
}

const UI = {
  line: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
  boxStart: (title) => `╭───────────── 🐾 ─────────────╮\n│ 🔮  ${title.toUpperCase()}\n├───────────────────────────────`,
  boxEnd: () => `╰───────────────────────────────╯`,
  field: (label, val) => `│ 🔸 ${label} : ${val}`
};
