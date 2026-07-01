/**
 * @file pirate.js
 * @description Mode de jeu RPG de Piraterie et de Guerres Navales Multicompagnons pour GoatBot v2
 * @version 1.0.0
 * @author Collaborateur IA RPG
 */

const fs = require('fs');
const path = require('path');

// ==========================================
// 📁 COORDONNÉES ET STRUCTURE DU STOCKAGE INFRASTRUCTURE
// ==========================================
const DATA_DIR = path.join(__dirname, 'cache', 'piratesMMO');
const CREWS_FILE = path.join(DATA_DIR, 'crews.json');
const PLAYER_LINKS_FILE = path.join(DATA_DIR, 'player_links.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(CREWS_FILE)) fs.writeFileSync(CREWS_FILE, JSON.stringify({}, null, 2));
if (!fs.existsSync(PLAYER_LINKS_FILE)) fs.writeFileSync(PLAYER_LINKS_FILE, JSON.stringify({}, null, 2));

// ==========================================
// 🚢 CATALOGUE DES NAVIRES AMÉLIORABLES
// ==========================================
const SHIPS_CATALOG = {
  barque: { id: "barque", name: "Barque de Fortune", emoji: "🛶", price: 100000, baseHp: 300, baseDef: 10, baseCanons: 2, capacity: 3, treasureBonus: 0.02 },
  voilier: { id: "voilier", name: "Voilier Léger", emoji: "⛵", price: 350000, baseHp: 650, baseDef: 25, baseCanons: 4, capacity: 5, treasureBonus: 0.05 },
  brick: { id: "brick", name: "Brick de Flibustier", emoji: "🚢", price: 1200000, baseHp: 1500, baseDef: 60, baseCanons: 8, capacity: 10, treasureBonus: 0.10 },
  fregate: { id: "fregate", name: "Frégate de Chasse", emoji: "⚓", price: 4500000, baseHp: 3200, baseDef: 120, baseCanons: 16, capacity: 15, treasureBonus: 0.15 },
  galion: { id: "galion", name: "Galion Royal Imperial", emoji: "🏰", price: 15000000, baseHp: 7500, baseDef: 250, baseCanons: 32, capacity: 25, treasureBonus: 0.22 },
  black_pearl: { id: "black_pearl", name: "Le Maudit Black Pearl", emoji: "🏴‍☠️", price: 50000000, baseHp: 18000, baseDef: 500, baseCanons: 50, capacity: 35, treasureBonus: 0.35 },
  ghost_ship: { id: "ghost_ship", name: "Bateau Fantôme Éthéré", emoji: "👻", price: 120000000, baseHp: 40000, baseDef: 950, baseCanons: 80, capacity: 50, treasureBonus: 0.50 },
  leviathan_ship: { id: "leviathan_ship", name: "Le Souverain Léviathan", emoji: "🐉", price: 300000000, baseHp: 100000, baseDef: 2200, baseCanons: 140, capacity: 80, treasureBonus: 0.75 }
};

// ==========================================
// 👹 DICTIONNAIRE DES BOSS MYTHIQUES DE L'OCÉAN
// ==========================================
const OCEAN_BOSSES = {
  kraken: { name: "Le Kraken des Abysses", emoji: "🐙", hp: 25000, atk: 450, def: 150, rewardGold: 1500000, rep: 250 },
  davy_jones: { name: "Davy Jones du Hollandais Volant", emoji: "💀", hp: 60000, atk: 900, def: 400, rewardGold: 4000000, rep: 500 },
  poseidon: { name: "Poséidon, Dieu des Tempêtes", emoji: "🔱", hp: 150000, atk: 2200, def: 900, rewardGold: 12000000, rep: 1200 },
  roi_pirate: { name: "Le Spectre du Roi Pirate", emoji: "👑", hp: 400000, atk: 5000, def: 2500, rewardGold: 35000000, rep: 3000 }
};

// ==========================================
// 🎲 RÉPERTOIRE DES BUTINS ET LOOTS SECONDAIRES
// ==========================================
const LOOT_ITEMS = {
  perle: { name: "Perle Noire des Lagons", val: 15000, emoji: "🦪" },
  rubis: { name: "Rubis Sang-de-Pigeon", val: 45000, emoji: "♦️" },
  diamant: { name: "Diamant Brut des Caraïbes", val: 120000, emoji: "💎" },
  relique: { name: "Relique Sacrée Inconnue", val: 350000, emoji: "🏺" },
  artefact: { name: "Artefact Temporel Perdu", val: 950000, emoji: "🔮" }
};

// ==========================================
// ROLES & DROITS DE L'ÉQUIPAGE
// ==========================================
const ROLES = {
  CAPTAIN: { name: "Capitaine", power: 3, canManage: true, canWithdraw: true, emoji: "👑" },
  OFFICER: { name: "Officier", power: 2, canManage: true, canWithdraw: false, emoji: "⚔️" },
  SAILOR: { name: "Matelot", power: 1, canManage: false, canWithdraw: false, emoji: "⚓" }
};

// ==========================================
// 🛠️ FONCTIONS UTILITAIRES ET MUTATEURS DE DONNÉES
// ==========================================
function readDB(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { return {}; }
}
function writeDB(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
}

function getPlayerLink(uid) {
  const links = readDB(PLAYER_LINKS_FILE);
  return links[uid] || null;
}

function setPlayerLink(uid, guildId, role) {
  const links = readDB(PLAYER_LINKS_FILE);
  if (guildId === null) {
    delete links[uid];
  } else {
    links[uid] = { crewId: guildId, role: role };
  }
  writeDB(PLAYER_LINKS_FILE, links);
}

// Recalculateur de statistiques du Navire Amélioré
function getShipStats(crew) {
  const base = SHIPS_CATALOG[crew.ship.type] || SHIPS_CATALOG.barque;
  const upgradeLevel = crew.ship.upgradeLevel || 1;
  const factor = 1 + (upgradeLevel - 1) * 0.15; // +15% par niveau d'amélioration

  return {
    name: base.name,
    emoji: base.emoji,
    hp: Math.floor(base.baseHp * factor),
    def: Math.floor(base.baseDef * factor),
    canons: Math.floor(base.baseCanons * (1 + (upgradeLevel - 1) * 0.08)),
    capacity: base.capacity,
    treasureBonus: base.treasureBonus + ((upgradeLevel - 1) * 0.01)
  };
}

const UI = {
  line: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
  boxStart: (title) => `╭───────────── 🏴‍☠️ ─────────────╮\n│ 🦅  ${title.toUpperCase()}\n├───────────────────────────────`,
  boxEnd: () => `╰───────────────────────────────╯`,
  field: (label, val) => `│ ➔ ${label} : ${val}`
};
