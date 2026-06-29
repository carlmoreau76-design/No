/**
 * @file pet.js
 * @description Système RPG de Familiers (Pets) Ultra Premium interconnecté pour GoatBot v2
 * @command pet
 * @credits Format GoatBot v2 & Canvas Engine Premium
 */

const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

// Chemins de stockage
const DATA_DIR = path.join(__dirname, 'cache', 'petData');
const PETS_FILE = path.join(DATA_DIR, 'player_pets.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(PETS_FILE)) fs.writeFileSync(PETS_FILE, JSON.stringify({}, null, 2));

// Jeton d'accès Facebook pour les avatars HD
const FB_TOKEN = "6628568379|c1e620fa708a1d5696fb991c1bde5662";

// --- TABLE DES OEUFS ET PROBABILITÉS D'OBTENTION ---
const EGGS_DB = {
  common: { name: "Common Egg", emoji: "🥚", cost: 1500, rates: { commune: 0.70, uncommon: 0.25, rare: 0.05, epic: 0.00, legendary: 0.00, mythic: 0.00, divine: 0.00 } },
  uncommon: { name: "Uncommon Egg", emoji: "🟢", cost: 5000, rates: { commune: 0.20, uncommon: 0.60, rare: 0.15, epic: 0.05, legendary: 0.00, mythic: 0.00, divine: 0.00 } },
  rare: { name: "Rare Egg", emoji: "🔵", cost: 15000, rates: { commune: 0.05, uncommon: 0.20, rare: 0.55, epic: 0.15, legendary: 0.05, mythic: 0.00, divine: 0.00 } },
  epic: { name: "Epic Egg", emoji: "🟣", cost: 45000, rates: { commune: 0.00, uncommon: 0.05, rare: 0.20, epic: 0.60, legendary: 0.12, mythic: 0.03, divine: 0.00 } },
  legendary: { name: "Legendary Egg", emoji: "🟠", cost: 150000, rates: { commune: 0.00, uncommon: 0.00, rare: 0.08, epic: 0.22, legendary: 0.58, mythic: 0.10, divine: 0.02 } },
  mythic: { name: "Mythic Egg", emoji: "🔴", cost: 600000, rates: { commune: 0.00, uncommon: 0.00, rare: 0.00, epic: 0.10, legendary: 0.25, mythic: 0.55, divine: 0.10 } },
  divine: { name: "Divine Egg", emoji: "🌈", cost: 2500000, rates: { commune: 0.00, uncommon: 0.00, rare: 0.00, epic: 0.00, legendary: 0.15, mythic: 0.35, divine: 0.50 } }
};

// --- TABLE DE CONFIGURATION DES RARETÉS ---
const RARITIES = {
  commune: { name: "Commune", color: "#b0b0b0", mult: 1.0 },
  uncommon: { name: "Peu Commune", color: "#1ce31c", mult: 1.3 },
  rare: { name: "Rare", color: "#00bfff", mult: 1.7 },
  epic: { name: "Épique", color: "#a020f0", mult: 2.3 },
  legendary: { name: "Légendaire", color: "#ff0055", mult: 3.5 },
  mythic: { name: "Mythique", color: "#ffaa00", mult: 5.0 },
  divine: { name: "Divine", color: "#ffd700", mult: 9.0 }
};

// --- NOURRITURE POUR FAMILIERS ---
const PET_FOOD = {
  croquette: { name: "Croquettes Basiques", cost: 100, restore: 25, joy: 5 },
  paté: { name: "Pâté de Viande", cost: 350, restore: 50, joy: 15 },
  delice: { name: "Délice du Chasseur", cost: 1000, restore: 85, joy: 30 },
  ambroisie: { name: "Ambroisie Céleste", cost: 5000, restore: 100, joy: 70 }
};

// --- BASE DE DONNÉES DES FAMILIERS & ÉVOLUTIONS (STRUCTURE ARBORESCENTE) ---
const PETS_DB = {
  // --- FAMILIERS STANDARD ---
  chien: { id: "chien", name: "Chiot Chien", emoji: "🐶", rarity: "commune", hp: 120, atk: 15, def: 10, crit: 5, dodge: 5, talent: "Guardian", skill: "Aboiement Protecteur", next: "loup_domestique", levelReq: 20 },
  chat: { id: "chat", name: "Chaton Malin", emoji: "🐱", rarity: "commune", hp: 90, atk: 18, def: 6, crit: 12, dodge: 10, talent: "Lucky", skill: "Griffure Critique", next: "lynx_furtif", levelReq: 20 },
  renard: { id: "renard", name: "Renardeau", emoji: "🦊", rarity: "uncommon", hp: 110, atk: 22, def: 8, crit: 10, dodge: 12, talent: "Treasure Hunter", skill: "Fouille Rapide", next: "renard_mystique", levelReq: 25 },
  ours: { id: "ours", name: "Ourson", emoji: "🐻", rarity: "rare", hp: 200, atk: 25, def: 20, crit: 4, dodge: 2, talent: "Tank", skill: "Écrasement Lourd", next: "ours_grizzly", levelReq: 30 },
  aigle: { id: "aigle", name: "Aiglon", emoji: "🦅", rarity: "rare", hp: 130, atk: 28, def: 10, crit: 15, dodge: 15, talent: "Assassin", skill: "Piqué Foudroyant", next: "aigle_imperial", levelReq: 30 },
  hibou: { id: "hibou", name: "Chouette", emoji: "🦉", rarity: "uncommon", hp: 100, atk: 16, def: 12, crit: 8, dodge: 8, talent: "Banker", skill: "Sagesse Lucrative", next: "hibou_cosmique", levelReq: 25 },
  requin: { id: "requin", name: "Petit Requin", emoji: "🦈", rarity: "epic", hp: 180, atk: 35, def: 15, crit: 18, dodge: 6, talent: "Berserker", skill: "Morsure Sanglante", next: "megalodon", levelReq: 35 },

  // --- FORMES ÉVOLUÉES ÉTAPE 2 ---
  loup_domestique: { id: "loup_domestique", name: "Loup Alpha", emoji: "🐺", rarity: "rare", hp: 250, atk: 38, def: 22, crit: 12, dodge: 8, talent: "Guardian", skill: "Hurlement de Meute", next: "fenrir", levelReq: 50 },
  lynx_furtif: { id: "lynx_furtif", name: "Lynx Ombral", emoji: "🐯", rarity: "rare", hp: 210, atk: 42, def: 16, crit: 22, dodge: 18, talent: "Assassin", skill: "Assaut Fantôme", next: "tigre_ombre", levelReq: 50 },
  renard_mystique: { id: "renard_mystique", name: "Renard Céleste", emoji: "🦊", rarity: "epic", hp: 240, atk: 45, def: 18, crit: 15, dodge: 25, talent: "Treasure Hunter", skill: "Illusion Dorée", next: "kitsune", levelReq: 55 },
  ours_grizzly: { id: "ours_grizzly", name: "Grizzly Blindé", emoji: "🐻", rarity: "epic", hp: 450, atk: 55, def: 45, crit: 8, dodge: 4, talent: "Tank", skill: "Forteresse de Fourrure", next: "yeti_colossal", levelReq: 60 },
  aigle_imperial: { id: "aigle_imperial", name: "Aigle Tempête", emoji: "🦅", rarity: "epic", hp: 280, atk: 62, def: 20, crit: 25, dodge: 22, talent: "Pirate", skill: "Rafale Océanique", next: "garouda", levelReq: 60 },

  // --- CRÉATURES MYTHIQUES ET ULTIMES (ÉTAPES FINALES OU DIRECTES) ---
  dragon: { id: "dragon", name: "Petit Dragon", emoji: "🐉", rarity: "legendary", hp: 500, atk: 80, def: 60, crit: 15, dodge: 8, talent: "Berserker", skill: "Souffle de Flammes", next: "dragon_royal", levelReq: 40 },
  dragon_royal: { id: "dragon_royal", name: "Dragon Royal", emoji: "🐉", rarity: "mythic", hp: 1200, atk: 180, def: 130, crit: 22, dodge: 12, talent: "Berserker", skill: "Colère Impériale", next: "dragon_divin", levelReq: 75 },
  dragon_divin: { id: "dragon_divin", name: "Dragon Divin Apocalypse", emoji: "🐲", rarity: "divine", hp: 5000, atk: 750, def: 550, crit: 35, dodge: 25, talent: "Berserker", skill: "Jugement Ultime du Cosmos", next: null },
  
  licorne: { id: "licorne", name: "Licorne Pure", emoji: "🦄", rarity: "legendary", hp: 450, atk: 50, def: 50, crit: 10, dodge: 20, talent: "Healer", skill: "Bénédiction de Lumière", next: "licorne_cosmique", levelReq: 50 },
  licorne_cosmique: { id: "licorne_cosmique", name: "Licorne Stellaire", emoji: "🦄", rarity: "mythic", hp: 1100, atk: 110, def: 110, crit: 18, dodge: 30, talent: "Healer", skill: "Prière Astral", next: null },

  phenix: { id: "phenix", name: "Phénix Éternel", emoji: "🔥", rarity: "mythic", hp: 1500, atk: 210, def: 100, crit: 30, dodge: 24, talent: "Healer", skill: "Renaissance Céleste", next: null },
  kraken: { id: "kraken", name: "Kraken des Abysses", emoji: "🌊", rarity: "mythic", hp: 2200, atk: 190, def: 160, crit: 15, dodge: 10, talent: "Pirate", skill: "Étreinte Profonde", next: null },
  esprit_foudre: { id: "esprit_foudre", name: "Raijin", emoji: "⚡", rarity: "legendary", hp: 400, atk: 95, def: 40, crit: 28, dodge: 28, talent: "Assassin", skill: "Orage Cataclysmique", next: null },
  gardien_cosmique: { id: "gardien_cosmique", name: "Gardien Cosmique", emoji: "🌌", rarity: "divine", hp: 6000, atk: 600, def: 700, crit: 25, dodge: 20, talent: "Guardian", skill: "Trou Noir Protecteur", next: null }
};

// --- TALENTS ET LEUR IMPACT SUR L'ÉCOSYSTÈME ---
const TALENTS_EFFECTS = {
  Lucky: { desc: "+15% Chance de Critique & Chance de gains Casino", stat: "crit", bonus: 15 },
  Tank: { desc: "+30% Points de Vie totaux et Défense augmentée", stat: "hp", bonus: 30 },
  Berserker: { desc: "+25% Dégâts d'Attaque purs", stat: "atk", bonus: 25 },
  "Treasure Hunter": { desc: "+20% Chance de déterrer des reliques/trésors", stat: "treasure", bonus: 20 },
  Guardian: { desc: "+25% encaissement de barrière défensive", stat: "def", bonus: 25 },
  Healer: { desc: "Restaure 15% de vie après chaque tour de combat", stat: "heal", bonus: 15 },
  Assassin: { desc: "+20% d'Esquive au combat", stat: "dodge", bonus: 20 },
  Banker: { desc: "+10% d'intérêts sur les livrets de banque", stat: "bank", bonus: 10 },
  Farmer: { desc: "+15% Rendement de récolte passive Ranch", stat: "ranch", bonus: 15 },
  Pirate: { desc: "+20% Or rapporté des explorations Pirate", stat: "pirate", bonus: 20 }
};

// --- COMPORTEMENT PERSISTANCE DONNÉES ---
function readJSON(file) { return JSON.parse(fs.readFileSync(file, 'utf8')); }
function writeJSON(file, data) { fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8'); }

function getPlayerPets(uid) {
  const data = readJSON(PETS_FILE);
  if (!data[uid]) {
    data[uid] = { activePetId: null, collection: [], foodStorage: { croquette: 5, paté: 0, delice: 0, ambroisie: 0 } };
    writeJSON(PETS_FILE, data);
  }
  return data[uid];
}

function updatePlayerPets(uid, obj) {
  const data = readJSON(PETS_FILE);
  data[uid] = obj;
  writeJSON(PETS_FILE, data);
    }
