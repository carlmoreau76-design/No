/**
 * @file ranch.js
 * @description Simulateur d'Élevage RPG & Gestion de Domaine Agricole pour GoatBot v2
 * @version 1.0.0
 * @author Collaborateur IA RPG
 */

const fs = require('fs');
const path = require('path');

// ==========================================
// 📁 CONFIGURATION ET PERSISTANCE DES DONNÉES
// ==========================================
const DATA_DIR = path.join(__dirname, 'cache', 'ranchMMO');
const RANCH_FILE = path.join(DATA_DIR, 'player_ranches.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(RANCH_FILE)) fs.writeFileSync(RANCH_FILE, JSON.stringify({}, null, 2));

// ==========================================
// 🧬 ENCYCLOPÉDIE DES ANIMAUX ET RARÈTÉS
// ==========================================
const RARITIES = {
  common: { name: "Commun", color: "⚪", mult: 1.0 },
  rare: { name: "Rare", color: "🔵", mult: 1.8 },
  epic: { name: "Épique", color: "🟣", mult: 2.8 },
  legendary: { name: "Légendaire", color: "🟠", mult: 4.5 },
  mythic: { name: "Mythique", color: "🔴", mult: 8.0 },
  divine: { name: "Divin Ultimate", color: "🌈", mult: 15.0 }
};

const ANIMAL_TEMPLATES = {
  poulet: { id: "poulet", name: "Poulet", emoji: "🐔", cost: 5000, rarity: "common", prodTime: 60, product: "🥚 Œuf de Ferme", baseValue: 150 },
  canard: { id: "canard", name: "Canard", emoji: "🦆", cost: 12000, rarity: "common", prodTime: 90, product: "🪶 Plume Soyeuse", baseValue: 400 },
  lapin: { id: "lapin", name: "Lapin", emoji: "🐇", cost: 25000, rarity: "common", prodTime: 120, product: "🧶 Fourrure Douce", baseValue: 900 },
  mouton: { id: "mouton", name: "Mouton", emoji: "🐑", cost: 60000, rarity: "common", prodTime: 180, product: "🧶 Pelote de Laine", baseValue: 2200 },
  chevre: { id: "chevre", name: "Chèvre", emoji: "🐐", cost: 130000, rarity: "rare", prodTime: 240, product: "🧀 Fromage de Chèvre", baseValue: 5500 },
  cochon: { id: "cochon", name: "Cochon", emoji: "🐖", cost: 280000, rarity: "rare", prodTime: 300, product: "🍖 Viande de Qualité", baseValue: 12000 },
  vache: { id: "vache", name: "Vache", emoji: "🐄", cost: 650000, rarity: "rare", prodTime: 360, product: "🥛 Litre de Lait", baseValue: 28000 },
  cheval: { id: "cheval", name: "Cheval", emoji: "🐎", cost: 1500000, rarity: "epic", prodTime: 420, product: "🐎 Fer de Chance", baseValue: 70000 },
  lama: { id: "lama", name: "Lama", emoji: "🦙", cost: 3500000, rarity: "epic", prodTime: 480, product: "🧶 Laine de Lama Alpaga", baseValue: 180000 },
  bison: { id: "bison", name: "Bison", emoji: "🦬", cost: 8000000, rarity: "epic", prodTime: 600, product: "🦬 Cuir Épais", baseValue: 450000 },
  cerf: { id: "cerf", name: "Cerf des Forêts", emoji: "🦌", cost: 18000000, rarity: "legendary", prodTime: 720, product: "🦌 Bois Sacré", baseValue: 1100000 },
  elephant: { id: "elephant", name: "Éléphant", emoji: "🐘", cost: 45000000, rarity: "legendary", prodTime: 900, product: "🏺 Relique d'Ivoire", baseValue: 3000000 },
  licorne: { id: "licorne", name: "Licorne Majestueuse", emoji: "🦄", cost: 120000000, rarity: "legendary", prodTime: 1200, product: "🔮 Crine Luminescent", baseValue: 9500000 },
  dragon: { id: "dragon", name: "Dragon Antique", emoji: "🐉", cost: 350000000, rarity: "mythic", prodTime: 1800, product: "🔥 Écaille de Soufre", baseValue: 32000000 },
  dragon_divin: { id: "dragon_divin", name: "Dragon Céleste Divin", emoji: "🐲", cost: 1000000000, rarity: "divine", prodTime: 3600, product: "💎 Essence d'Éternité", baseValue: 110000000 }
};

// ==========================================
// 🏡 STRUCTURES DE RANCH EVOLUTIVES
// ==========================================
const RANCH_UPGRADES = [
  { level: 1, name: "Petite Ferme", capacity: 4, cost: 0, speedBonus: 1.0 },
  { level: 2, name: "Grande Ferme", capacity: 8, cost: 250000, speedBonus: 1.05 },
  { level: 3, name: "Ranch Professionnel", capacity: 15, cost: 1500000, speedBonus: 1.15 },
  { level: 4, name: "Domaine Agricole", capacity: 30, cost: 10000000, speedBonus: 1.30 },
  { level: 5, name: "Ferme Royale", capacity: 60, cost: 75000000, speedBonus: 1.50 },
  { level: 6, name: "Ranch Mythique Interdimensionnel", capacity: 120, cost: 500000000, speedBonus: 2.00 }
];

// ==========================================
// 🌾 NOURRITURE ET COMPOSANTS DU SILO
// ==========================================
const FOOD_TYPES = {
  herbe: { name: "Herbe Fraîche", cost: 100, restore: 15 },
  ble: { name: "Blé Doré", cost: 250, restore: 30 },
  mais: { name: "Maïs Sucré", cost: 600, restore: 50 },
  carotte: { name: "Carotte Juteuse", cost: 1500, restore: 75 },
  premium: { name: "Croquettes Alpha Premium", cost: 5000, restore: 100 }
};

// ==========================================
// 🛠️ OUTILS ET UTILITIES DE SYNCHRONISATION
// ==========================================
function readDB(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { return {}; }
}
function writeDB(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
}

function getPlayerRanch(uid) {
  const db = readDB(RANCH_FILE);
  if (!db[uid]) {
    db[uid] = {
      level: 1,
      animals: [],
      storage: {}, // Produits récoltés en attente de vente
      silo: { herbe: 10, ble: 5, mais: 0, carotte: 0, premium: 0 },
      stats: { totalCollected: 0, totalEarnings: 0, successfulBreeds: 0 }
    };
    writeDB(RANCH_FILE, db);
  }
  return db[uid];
}

function savePlayerRanch(uid, data) {
  const db = readDB(RANCH_FILE);
  db[uid] = data;
  writeDB(RANCH_FILE, db);
}

const UI = {
  line: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
  boxStart: (title) => `╭───────────── 🚜 ─────────────╮\n│ 🌾  ${title.toUpperCase()}\n├───────────────────────────────`,
  boxEnd: () => `╰───────────────────────────────╯`,
  bar: (current, max, filledEmoji = "🟩", emptyEmoji = "⬛") => {
    const progress = Math.min(10, Math.max(0, Math.round((current / max) * 10)));
    return filledEmoji.repeat(progress) + emptyEmoji.repeat(10 - progress);
  }
};

// ==========================================
// 🛡️ ACCROCHE ET CONFIGURATION GOATBOT V2
// ==========================================
module.exports = {
  config: {
    name: "ranch",
    aliases: ["ferme", "elevage", "ranching", "farm"],
    version: "1.0.0",
    author: "Collaborateur IA RPG",
    countDown: 2,
    role: 0,
    description: "Simulateur complet de ranching RPG : Élevage, reproduction, cultures, récoltes et commerce.",
    category: "economy",
    guide: { fr: "{p}ranch [sous-commande]", en: "{p}ranch [subcommand]" }
  },

  onStart: async function ({ api, event, args, usersData, message }) {
    const { senderID, threadID } = event;
    const rData = getPlayerRanch(senderID);
    const subCommand = args[0]?.toLowerCase();

    let userData = await usersData.get(senderID);
    let userMoney = userData.money || 0;

    // ==========================================
    // 📜 INTERFACE : MENU D'AIDE CENTRALISÉ
    // ==========================================
    if (!subCommand) {
      let menu = `╭───────────────────────────────────────╮\n`;
      menu += `│ 🚜  𝐒𝐘𝐒𝐓È𝐌𝐄 𝐃𝐄 𝐑𝐀𝐍𝐂𝐇𝐈𝐍𝐆 𝐑𝐏𝐆\n`;
      menu += `├───────────────────────────────────────┤\n`;
      menu += `│ 🔹 ~ranch info : Bilan général de votre domaine\n`;
      menu += `│ 🔹 ~ranch inventory : Consulter votre bétail\n`;
      menu += `│ 🔹 ~ranch shop : Commander des animaux & semences\n`;
      menu += `│ 🔹 ~ranch buy <animal|nourriture> <nom> : Achats\n`;
      menu += `├───────────────────────────────────────┤\n`;
      menu += `│ 🥩 𝐋𝐎𝐆𝐈𝐒𝐓𝐈𝐐𝐔𝐄 & 𝐏𝐑𝐎𝐃𝐔𝐂𝐓𝐈𝐎𝐍\n`;
      menu += `├───────────────────────────────────────┤\n`;
      menu += `│ 🔹 ~ranch feed <index|all> <aliment> : Nourrir\n`;
      menu += `│ 🔹 ~ranch collect : Récolter la production laitière/œufs\n`;
      menu += `│ 🔹 ~ranch sell : Liquider le stock au marché local\n`;
      menu += `│ 🔹 ~ranch breed <index1> <index2> : Lancer une gestation\n`;
      menu += `│ 🔹 ~ranch upgrade : Agrandir vos infrastructures\n`;
      menu += `│ 🔹 ~ranch leaderboard : Classement des gros exploitants\n`;
      menu += `├───────────────────────────────────────┤\n`;
      menu += `│ 🔄 Vos gains financiers alimentent usersData.money\n`;
      menu += `│ 🔗 Connecté au module dynamique quest.js !\n`;
      menu += `╰───────────────────────────────────────╯`;
      return message.reply(menu);
        }
