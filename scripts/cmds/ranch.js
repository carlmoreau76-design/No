/**
 * @file ranch.js
 * @description Simulateur d'Élevage RPG Ultra Premium Multi-Ressources pour GoatBot v2
 * @command ranch
 * @credits Format GoatBot v2 & Canvas Engine Premium
 */

const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

// Chemins de sauvegarde du Ranch
const DATA_DIR = path.join(__dirname, 'cache', 'ranchData');
const RANCH_FILE = path.join(DATA_DIR, 'ranchers.json');
const COOLDOWNS_FILE = path.join(DATA_DIR, 'cooldowns.json');

// Création des dossiers si inexistants
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(RANCH_FILE)) fs.writeFileSync(RANCH_FILE, JSON.stringify({}, null, 2));
if (!fs.existsSync(COOLDOWNS_FILE)) fs.writeFileSync(COOLDOWNS_FILE, JSON.stringify({}, null, 2));

// Jeton d'accès Facebook pour les avatars HD (Synchronisé)
const FB_TOKEN = "6628568379|c1e620fa708a1d5696fb991c1bde5662";

// --- BASE DE DONNÉES DES ANIMAUX ---
const ANIMALS_DB = {
  poulet: { id: "poulet", name: "Poulet", emoji: "🐔", cost: 500, rarity: "commune", product: "oeuf", basePrice: 50, time: 60, expGiven: 10 },
  canard: { id: "canard", name: "Canard", emoji: "🦆", cost: 1200, rarity: "commune", product: "plumes", basePrice: 130, time: 120, expGiven: 18 },
  lapin: { id: "lapin", name: "Lapin", emoji: "🐇", cost: 2500, rarity: "commune", product: "laine_douce", basePrice: 280, time: 180, expGiven: 25 },
  mouton: { id: "mouton", name: "Mouton", emoji: "🐑", cost: 6000, rarity: "rare", product: "laine", basePrice: 700, time: 300, expGiven: 50 },
  chevre: { id: "chevre", name: "Chèvre", emoji: "🐐", cost: 9500, rarity: "rare", product: "fromage", basePrice: 1100, time: 420, expGiven: 75 },
  cochon: { id: "cochon", name: "Cochon", emoji: "🐖", cost: 15000, rarity: "rare", product: "truffes", basePrice: 1900, time: 600, expGiven: 110 },
  vache: { id: "vache", name: "Vache", emoji: "🐄", cost: 32000, rarity: "epique", product: "lait", basePrice: 4200, time: 900, expGiven: 220 },
  cheval: { id: "cheval", name: "Cheval", emoji: "🐎", cost: 55000, rarity: "epique", product: "fer_or", basePrice: 7500, time: 1200, expGiven: 350 },
  lama: { id: "lama", name: "Lama", emoji: "🦙", cost: 85000, rarity: "epique", product: "fourrure_imperiale", basePrice: 12500, time: 1800, expGiven: 500 },
  bison: { id: "bison", name: "Bison", emoji: "🦬", cost: 160000, rarity: "legendaire", product: "corne_bison", basePrice: 26000, time: 2700, expGiven: 1000 },
  cerf: { id: "cerf", name: "Cerf", emoji: "🦌", cost: 240000, rarity: "legendaire", product: "bois_magique", basePrice: 41000, time: 3600, expGiven: 1600 },
  elephant: { id: "elephant", name: "Éléphant", emoji: "🐘", cost: 500000, rarity: "legendaire", product: "ivoire_ancien", basePrice: 95000, time: 5400, expGiven: 3000 },
  licorne: { id: "licorne", name: "Licorne", emoji: "🦄", cost: 1500000, rarity: "legendaire", product: "corne_arc_en_ciel", basePrice: 320000, time: 7200, expGiven: 7000 },
  dragon: { id: "dragon", name: "Dragon", emoji: "🐉", cost: 5000000, rarity: "mythique", product: "ecaille_feu", basePrice: 1200000, time: 14400, expGiven: 20000 },
  dragon_divin: { id: "dragon_divin", name: "Dragon Divin", emoji: "🐲", cost: 15000000, rarity: "divine", product: "essence_cosmique", basePrice: 4500000, time: 28800, expGiven: 60000 }
};

// --- BASE DE DONNÉES DES INFRASTRUCTURES ---
const UPGRADES_DB = [
  { level: 1, name: "Petite Ferme", maxAnimals: 5, cost: 0, mult: 1.0 },
  { level: 2, name: "Grande Ferme", maxAnimals: 12, cost: 25000, mult: 1.2 },
  { level: 3, name: "Ranch Spacieux", maxAnimals: 25, cost: 150000, mult: 1.5 },
  { level: 4, name: "Domaine de l'Éleveur", maxAnimals: 50, cost: 750000, mult: 2.0 },
  { level: 5, name: "Ferme Royale", maxAnimals: 100, cost: 3500000, mult: 3.0 },
  { level: 6, name: "Ranch Mythique", maxAnimals: 250, cost: 12000000, mult: 5.0 }
];

// --- TYPES DE NOURRITURE ---
const FOOD_DB = {
  herbe: { name: "Herbe Fraîche", cost: 15, hungerRestore: 20, joyRestore: 5, emoji: "🌿" },
  ble: { name: "Blé Doré", cost: 40, hungerRestore: 45, joyRestore: 10, emoji: "🌾" },
  mais: { name: "Maïs Sucré", cost: 90, hungerRestore: 70, joyRestore: 15, emoji: "🌽" },
  carotte: { name: "Carottes Croquantes", cost: 180, hungerRestore: 90, joyRestore: 25, emoji: "🥕" },
  premium: { name: "Nourriture Premium", cost: 500, hungerRestore: 100, joyRestore: 60, emoji: "🍱" }
};

// --- CONFIGURATION DES RARETÉS ---
const RARITIES = {
  commune: { name: "Commune", color: "#b0b0b0", statMult: 1.0 },
  rare: { name: "Rare", color: "#00cf64", statMult: 1.4 },
  epique: { name: "Épique", color: "#00bfff", statMult: 2.0 },
  legendaire: { name: "Légendaire", color: "#ff0055", statMult: 3.2 },
  mythique: { name: "Mythique", color: "#a020f0", statMult: 5.5 },
  divine: { name: "Divine", color: "#ffd700", statMult: 10.0 }
};

// --- FONCTIONS DE PERSISTANCE ---
function readJSON(file) { return JSON.parse(fs.readFileSync(file, 'utf8')); }
function writeJSON(file, data) { fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8'); }

function getRanch(uid) {
  const data = readJSON(RANCH_FILE);
  if (!data[uid]) {
    data[uid] = {
      uid: uid,
      rankLevel: 1,
      animals: [],
      warehouse: {},
      foodStorage: { herbe: 10, ble: 0, mais: 0, carotte: 0, premium: 0 },
      totals: { collected: 0, earnings: 0, bred: 0 }
    };
    writeJSON(RANCH_FILE, data);
  }
  return data[uid];
}

function updateRanch(uid, obj) {
  const data = readJSON(RANCH_FILE);
  data[uid] = obj;
  writeJSON(RANCH_FILE, data);
}
