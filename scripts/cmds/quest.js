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

// --- FONCTION DE TRACÉ DES COINS ARRONDIS ---
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

// --- RENDU CANVAS : CARTE INDIVIDUELLE DE QUÊTE ---
async function drawQuestDetailsCard(title, subtitle, quest, uid) {
  const canvas = createCanvas(800, 500);
  const ctx = canvas.getContext('2d');
  const diffOpt = DIFFICULTIES[quest.difficulty] || DIFFICULTIES.commune;

  // Fond d'écran MMORPG Cyber-Gothique
  ctx.fillStyle = '#0a0a0c';
  ctx.fillRect(0, 0, 800, 500);

  // Grille cyber subtile rouge atténuée
  ctx.strokeStyle = 'rgba(255, 0, 40, 0.02)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 800; i += 25) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 500); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(800, i); ctx.stroke();
  }

  // Double cadre néon rouge sang et or
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#ff003c';
  ctx.shadowColor = '#ff003c';
  ctx.shadowBlur = 15;
  drawRoundRect(ctx, 25, 25, 750, 450, 16);
  ctx.stroke();
  ctx.shadowBlur = 0;

  ctx.lineWidth = 2;
  ctx.strokeStyle = '#ffd700';
  drawRoundRect(ctx, 30, 30, 740, 440, 12);
  ctx.stroke();

  // En-tête : Titre et Type de Quête
  ctx.fillStyle = '#ffd700';
  ctx.font = 'bold 36px sans-serif';
  ctx.fillText(title.toUpperCase(), 60, 85);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'italic 18px sans-serif';
  ctx.fillText(subtitle, 60, 120);

  // Séparateur horizontal ornemental
  ctx.strokeStyle = 'rgba(255, 215, 0, 0.3)';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(60, 140); ctx.lineTo(740, 140); ctx.stroke();

  // Descriptif de l'objectif
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText(`🎯 Objectif : ${quest.text}`, 60, 190);

  // Badge de Difficulté stylisé
  ctx.fillStyle = diffOpt.color;
  drawRoundRect(ctx, 60, 215, 160, 35, 6);
  ctx.fill();
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(diffOpt.name.toUpperCase(), 140, 238);
  ctx.textAlign = 'start';

  // --- BARRE DE PROGRESSION RPG ANIMÉE ---
  const pct = Math.min(100, Math.floor((quest.current / quest.target) * 100));
  ctx.fillStyle = '#1a1a24';
  drawRoundRect(ctx, 60, 280, 450, 30, 8);
  ctx.fill();

  // Remplissage gradient néon rouge
  if (pct > 0) {
    const grad = ctx.createLinearGradient(60, 280, 60 + (450 * (pct / 100)), 280);
    grad.addColorStop(0, '#8b0000');
    grad.addColorStop(1, '#ff003c');
    ctx.fillStyle = grad;
    drawRoundRect(ctx, 60, 280, 450 * (pct / 100), 30, 8);
    ctx.fill();
  }

  // Texte sur la barre de progression
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText(`Progression : ${quest.current} / ${quest.target} (${pct}%)`, 80, 302);

  // --- RÉCOMPENSES ---
  ctx.fillStyle = '#ffd700';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText(`🎁 Récompenses :`, 60, 355);

  ctx.fillStyle = '#ffffff';
  ctx.font = '18px sans-serif';
  ctx.fillText(`• Pièces d'or : +${quest.rewards.money}$`, 80, 390);
  ctx.fillText(`• Expérience : +${quest.rewards.xp} XP`, 80, 420);
  if (quest.rewards.loot) {
    ctx.fillStyle = '#00cf64';
    ctx.fillText(`• Relique : ${quest.rewards.loot}`, 80, 450);
  }

  // --- INTEGRATION DE L'AVATAR VIA FB_TOKEN ---
  if (uid) {
    try {
      const avatarUrl = `https://graph.facebook.com/${uid}/picture?width=512&height=512&access_token=${encodeURIComponent(FB_TOKEN)}`;
      const avatar = await loadImage(avatarUrl);
      ctx.save();
      ctx.beginPath();
      ctx.arc(640, 280, 75, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(avatar, 565, 205, 150, 150);
      ctx.restore();

      // Halo doré d'avatar
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#ffd700';
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(640, 280, 75, 0, Math.PI * 2, true);
      ctx.stroke();
      ctx.shadowBlur = 0;
    } catch (e) {
      // Ignorer l'erreur d'avatar en cas de restriction réseau
    }
  }

  return canvas.toBuffer();
}

// --- RENDU CANVAS : RECONNAISSANCE DE SUCCÈS (ACHIEVEMENT) ---
async function drawAchievementCard(title, description, badge, uid) {
  const canvas = createCanvas(700, 250);
  const ctx = canvas.getContext('2d');

  // Fond Premium
  ctx.fillStyle = '#0d0d13';
  ctx.fillRect(0, 0, 700, 250);

  // Bordure dorée luminescente
  ctx.lineWidth = 5;
  ctx.strokeStyle = '#ffd700';
  ctx.shadowColor = '#ffd700';
  ctx.shadowBlur = 12;
  drawRoundRect(ctx, 15, 15, 670, 220, 12);
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Titre et Icône
  ctx.fillStyle = '#ff003c';
  ctx.font = 'bold 28px sans-serif';
  ctx.fillText(`🏆 SUCCÈS DÉBLOQUÉ !`, 50, 65);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText(`${badge} ${title}`, 50, 120);

  ctx.fillStyle = '#a0a0ab';
  ctx.font = '18px sans-serif';
  ctx.fillText(description, 50, 165);

  return canvas.toBuffer();
  }
