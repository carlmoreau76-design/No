/**
 * @file pirate.js
 * @description Système RPG Pirate Ultra Premium Multi-Équipages pour GoatBot v2 avec Token Avatar
 * @command pirate
 * @credits Format GoatBot v2 & Canvas Engine Premium
 */

const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

// Chemins de sauvegarde des données
const DATA_DIR = path.join(__dirname, 'cache', 'pirateData');
const CLANS_FILE = path.join(DATA_DIR, 'crews.json');
const PLAYERS_FILE = path.join(DATA_DIR, 'players.json');
const COOLDOWNS_FILE = path.join(DATA_DIR, 'cooldowns.json');

// Création des dossiers si inexistants
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(CLANS_FILE)) fs.writeFileSync(CLANS_FILE, JSON.stringify({}, null, 2));
if (!fs.existsSync(PLAYERS_FILE)) fs.writeFileSync(PLAYERS_FILE, JSON.stringify({}, null, 2));
if (!fs.existsSync(COOLDOWNS_FILE)) fs.writeFileSync(COOLDOWNS_FILE, JSON.stringify({}, null, 2));

// Jeton d'accès Facebook pour les avatars
const FB_TOKEN = "6628568379|c1e620fa708a1d5696fb991c1bde5662";

// Système d'invitations en mémoire volatile
const activeInvites = new Map();

// --- BASES DE DONNÉES DU JEU ---
const SHIPS_DB = {
  barque: { name: "Barque Pourrie", hp: 100, def: 5, speed: 10, maxMembers: 3, canons: 2, treasureChance: 0.05, cost: 0, emoji: "🛶" },
  voilier: { name: "Voilier de Fortune", hp: 250, def: 15, speed: 20, maxMembers: 5, canons: 4, treasureChance: 0.10, cost: 5000, emoji: "⛵" },
  brick: { name: "Brick Agile", hp: 500, def: 30, speed: 35, maxMembers: 8, canons: 8, treasureChance: 0.15, cost: 25000, emoji: "🚢" },
  fregate: { name: "Frégate Tempête", hp: 1000, def: 60, speed: 45, maxMembers: 12, canons: 16, treasureChance: 0.20, cost: 75000, emoji: "🛥️" },
  galion: { name: "Galion Royal", hp: 2500, def: 120, speed: 30, maxMembers: 20, canons: 32, treasureChance: 0.25, cost: 250000, emoji: "🔱" },
  blackpearl: { name: "Black Pearl", hp: 5000, def: 200, speed: 65, maxMembers: 30, canons: 50, treasureChance: 0.35, cost: 750000, emoji: "🏴‍☠️" },
  ghostship: { name: "Vaisseau Fantôme", hp: 8000, def: 300, speed: 55, maxMembers: 35, canons: 60, treasureChance: 0.40, cost: 1500000, emoji: "👻" },
  leviathan_ship: { name: "Léviathan des Mers", hp: 15000, def: 500, speed: 40, maxMembers: 50, canons: 100, treasureChance: 0.50, cost: 5000000, emoji: "🐉" }
};

const BOSS_DB = [
  { name: "Le Kraken Captif", hp: 4000, atk: 180, def: 80, reward: 80000, xp: 500, emoji: "🦑" },
  { name: "Le Spectre de Davy Jones", hp: 7500, atk: 250, def: 150, reward: 150000, xp: 1000, emoji: "💀" },
  { name: "Poséidon Courroucé", hp: 15000, atk: 450, def: 300, reward: 400000, xp: 2500, emoji: "🔱" },
  { name: "Le Roi Pirate Maudit", hp: 25000, atk: 600, def: 450, reward: 1000000, xp: 6000, emoji: "👑" }
];

// --- FONCTIONS INTERNES ---
function readJSON(file) { return JSON.parse(fs.readFileSync(file, 'utf8')); }
function writeJSON(file, data) { fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8'); }

function getPlayer(uid) {
  const players = readJSON(PLAYERS_FILE);
  if (!players[uid]) {
    players[uid] = { uid, crewId: null, level: 1, xp: 0, rank: "Mousse", totalTreasure: 0, rubis: 0, diamants: 0, perles: 0 };
    writeJSON(PLAYERS_FILE, players);
  }
  return players[uid];
}

function updatePlayer(uid, data) {
  const players = readJSON(PLAYERS_FILE);
  players[uid] = { ...getPlayer(uid), ...data };
  writeJSON(PLAYERS_FILE, players);
}

function getCrew(crewId) {
  const crews = readJSON(CLANS_FILE);
  return crews[crewId] || null;
}

function updateCrew(crewId, data) {
  const crews = readJSON(CLANS_FILE);
  if (crews[crewId]) {
    crews[crewId] = { ...crews[crewId], ...data };
    writeJSON(CLANS_FILE, crews);
  }
}

function drawRoundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

// Génération d'une interface néon premium avec intégration du token sécurisé
async function generatePremiumCard(title, subtitle, stats = [], uid = null) {
  const canvas = createCanvas(700, 450);
  const ctx = canvas.getContext('2d');

  // Fond Sombre Cyber-Pirate
  ctx.fillStyle = '#0b0c10';
  ctx.fillRect(0, 0, 700, 450);

  // Grille de fond subtile
  ctx.strokeStyle = 'rgba(255, 0, 0, 0.03)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 700; i += 30) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 450); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(700, i); ctx.stroke();
  }

  // Cadre Néon Rouge / Or Éclatant
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#ff0055';
  ctx.shadowColor = '#ff0055';
  ctx.shadowBlur = 15;
  drawRoundRect(ctx, 20, 20, 660, 410, 20);
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Titre principal
  ctx.fillStyle = '#ffd700'; 
  ctx.font = 'bold 32px sans-serif';
  ctx.fillText(title.toUpperCase(), 50, 70);

  // Sous-titre
  ctx.fillStyle = '#66fcf1';
  ctx.font = 'italic 18px sans-serif';
  ctx.fillText(subtitle, 50, 105);

  // Ligne de séparation
  ctx.strokeStyle = 'rgba(255, 215, 0, 0.4)';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(50, 125); ctx.lineTo(650, 125); ctx.stroke();

  // Affichage des statistiques structurées
  ctx.fillStyle = '#ffffff';
  ctx.font = '18px sans-serif';
  let posY = 170;
  stats.forEach(stat => {
    ctx.fillStyle = '#ffd700';
    ctx.fillText(stat.label + " :", 50, posY);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(stat.value, 220, posY);
    posY += 35;
  });

  // Gestion et affichage de l'avatar avec le Token fourni
  if (uid) {
    try {
      const avatarUrl = `https://graph.facebook.com/${uid}/picture?width=512&height=512&access_token=${encodeURIComponent(FB_TOKEN)}`;
      const avatar = await loadImage(avatarUrl);
      ctx.save();
      ctx.beginPath();
      ctx.arc(540, 240, 80, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(avatar, 460, 160, 160, 160);
      ctx.restore();

      ctx.lineWidth = 3;
      ctx.strokeStyle = '#ffd700';
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(540, 240, 80, 0, Math.PI * 2, true);
      ctx.stroke();
      ctx.shadowBlur = 0;
    } catch (e) {
      // Évite le crash si l'API Facebook ou le token rencontre un problème réseau
    }
  }

  return canvas.toBuffer();
}

module.exports = {
  config: {
    name: "pirate",
    version: "3.1.0",
    author: "Gemini Engine",
    countDown: 3,
    role: 0,
    description: "Système de simulation de piraterie RPG premium multi-équipages.",
    category: "game",
    guide: {
      fr: "{p}pirate crew create <nom> | explore | battle | war <nom_equipage> | info | upgrade",
      en: "{p}pirate crew create <name> | explore | battle | war <crew_name> | info | upgrade"
    }
  },

  onStart: async function ({ api, event, args, usersData, message }) {
    const { threadID, messageID, senderID } = event;
    const subCommand = args[0]?.toLowerCase();
    const action = args[1]?.toLowerCase();

    let player = getPlayer(senderID);
    let uData = await usersData.get(senderID);
    let userMoney = uData.money || 0;

    const cdData = readJSON(COOLDOWNS_FILE);
    const now = Date.now();

    function checkCooldown(type, timeLimit) {
      const key = `${senderID}_${type}`;
      if (cdData[key] && now < cdData[key] + timeLimit) {
        return Math.ceil((cdData[key] + timeLimit - now) / 1000);
      }
      cdData[key] = now;
      writeJSON(COOLDOWNS_FILE, cdData);
      return 0;
                          }
