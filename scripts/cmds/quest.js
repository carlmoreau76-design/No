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

// --- GÉNÉRATEUR ALÉATOIRE DE QUÊTES ---
function generateRandomQuest(type, difficultyOverride = null) {
  // Détermination de la difficulté selon les probabilités structurelles
  let diffKey = "commune";
  if (difficultyOverride) {
    diffKey = difficultyOverride;
  } else {
    const roll = Math.random();
    let cumulative = 0;
    for (const [key, opt] of Object.entries(DIFFICULTIES)) {
      cumulative += opt.chance;
      if (roll <= cumulative) {
        diffKey = key;
        break;
      }
    }
  }

  const diffOpt = DIFFICULTIES[diffKey];
  // Sélection aléatoire d'une typologie d'objectif
  const objTemplate = OBJECTIVE_TYPES[Math.floor(Math.random() * OBJECTIVE_TYPES.length)];
  
  // Ajustement des coefficients multiplicateurs selon l'alignement temporel
  let typeMult = 1.0;
  if (type === "weekly") typeMult = 4.0;
  if (type === "story") typeMult = 6.0;
  if (type === "secret") typeMult = 10.0;

  const targetValue = Math.floor(objTemplate.base * diffOpt.mult * typeMult) || 1;

  // Calcul structurel des récompenses indexées
  const goldReward = Math.floor(15000 * diffOpt.mult * typeMult * (0.8 + Math.random() * 0.4));
  const xpReward = Math.floor(800 * diffOpt.mult * typeMult);
  
  let lootReward = null;
  if (diffKey === "legendaire" || diffKey === "mythique" || diffKey === "divine") {
    const loots = ["Artefact Sacré", "Clé Primordiale", "Carte des abysses", "Fragment d'Âme Corrompue"];
    lootReward = loots[Math.floor(Math.random() * loots.length)];
  }

  return {
    id: "q_" + Math.random().toString(36).substr(2, 9),
    type: type,
    key: objTemplate.key,
    text: objTemplate.text.replace("X", targetValue),
    target: targetValue,
    current: 0,
    difficulty: diffKey,
    claimed: false,
    rewards: {
      money: goldReward,
      xp: xpReward,
      loot: lootReward
    }
  };
}

// --- SYSTÈME DE VÉRIFICATION ET RAFAÎCHISSEMENT TEMPOREL (RESET) ---
function checkAndResetQuests(uid) {
  const pQuests = getPlayerQuests(uid);
  const now = Date.now();
  
  const ONE_DAY = 24 * 60 * 60 * 1000;
  const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;
  let hasChanged = false;

  // Cycle Quotidien
  if (now - pQuests.lastDailyReset >= ONE_DAY || pQuests.daily.length === 0) {
    pQuests.daily = [
      generateRandomQuest("daily"),
      generateRandomQuest("daily"),
      generateRandomQuest("daily")
    ];
    pQuests.lastDailyReset = now;
    hasChanged = true;
  }

  // Cycle Hebdomadaire
  if (now - pQuests.lastWeeklyReset >= ONE_WEEK || pQuests.weekly.length === 0) {
    pQuests.weekly = [
      generateRandomQuest("weekly"),
      generateRandomQuest("weekly")
    ];
    pQuests.lastWeeklyReset = now;
    hasChanged = true;
  }

  // Initialisation de la trame narrative principale (Story)
  if (pQuests.story.length === 0) {
    pQuests.story = [generateRandomQuest("story", "epique")];
    hasChanged = true;
  }

  // Génération sporadique de quêtes secrètes (5% de chance par itération de contrôle)
  if (!pQuests.secret || pQuests.secret.length === 0) {
    if (Math.random() < 0.05) {
      pQuests.secret = [generateRandomQuest("secret", "mythique")];
    } else {
      pQuests.secret = [];
    }
    hasChanged = true;
  }

  if (hasChanged) {
    updatePlayerQuests(uid, pQuests);
  }
  return pQuests;
}

// --- INTERCEPTIONS DES ACTIONS LIÉES AUX AUTRES COMMANDES ---
// Permet la liaison directe avec arena, pirate, bank, slots, dice etc.
function listenRpgEvents(uid, eventKey, quantity = 1) {
  const pQuests = getPlayerQuests(uid);
  let updated = false;

  const lists = ["daily", "weekly", "story", "secret"];
  lists.forEach(listType => {
    if (pQuests[listType] && Array.isArray(pQuests[listType])) {
      pQuests[listType].forEach(quest => {
        if (quest.key === eventKey && !quest.claimed && quest.current < quest.target) {
          quest.current += quantity;
          if (quest.current > quest.target) quest.current = quest.target;
          updated = true;
        }
      });
    }
  });

  if (updated) {
    updatePlayerQuests(uid, pQuests);
  }
}

// --- LOGIQUE DE DÉBLOCAGE DES SUCCÈS AUTOMATIQUES ---
async function verifyAchievements(uid, message) {
  const stats = getPlayerStats(uid);
  const currentTitles = stats.titles || [];
  let unblockedCount = 0;

  for (const [key, ach] of Object.entries(ACHIEVEMENTS_DB)) {
    if (!currentTitles.includes(ach.title) && stats.completed >= ach.req) {
      stats.titles.push(ach.title);
      stats.moneyEarned += ach.reward;
      unblockedCount++;

      // Génération graphique du diplôme de succès accompli
      try {
        const achBuffer = await drawAchievementCard(ach.title, `Accomplir ${ach.req} quêtes légendaires au cours de votre périple.`, ach.badge, uid);
        const achPath = path.join(DATA_DIR, `ach_${uid}_${key}.png`);
        fs.writeFileSync(achPath, achBuffer);

        message.reply({
          body: `🏆 **SUCCÈS EXTRAORDINAIRE DEBLOQUÉ** 🏆\n🎖️ Titre : **${ach.title}**\n💰 Prime Royale : +${ach.reward}$`,
          attachment: fs.createReadStream(achPath)
        });
      } catch (e) {
        message.reply(`🏆 **SUCCÈS DEBLOQUÉ** : ${ach.badge} **${ach.title}** ! (+${ach.reward}$)`);
      }
    }
  }

  if (unblockedCount > 0) {
    updatePlayerStats(uid, stats);
  }
    }

module.exports = {
  config: {
    name: "quest",
    version: "2.5.0",
    author: "Gemini Engine RPG",
    countDown: 2,
    role: 0,
    description: "Système de quêtes MMORPG connectant l'ensemble de l'écosystème du serveur.",
    category: "game",
    guide: {
      fr: "{p}quest [daily | weekly | story | secret] | {p}quest claim <id> | {p}quest refresh | {p}quest leaderboard | {p}quest history",
      en: "{p}quest [daily | weekly | story | secret] | {p}quest claim <id> | {p}quest refresh | {p}quest leaderboard | {p}quest history"
    }
  },

  // Injection globale pour traquer l'ensemble des requêtes du serveur en arrière-plan
  onChat: async function ({ event }) {
    const { senderID, body } = event;
    if (!body || !senderID) return;

    // Analyse lexicale sommaire pour lier les déclenchements de commandes externes aux objectifs de quêtes
    const lowerBody = body.toLowerCase();
    if (lowerBody.startsWith("pirate explore")) listenRpgEvents(senderID, "pirate_explore");
    if (lowerBody.startsWith("pirate battle") || lowerBody.startsWith("pirate boss")) listenRpgEvents(senderID, "boss_defeat");
    if (lowerBody.startsWith("arena")) listenRpgEvents(senderID, "arena_win");
    if (lowerBody.startsWith("treasure")) listenRpgEvents(senderID, "find_treasure");
    if (lowerBody.startsWith("dice")) listenRpgEvents(senderID, "play_dice");
    if (lowerBody.startsWith("mines")) listenRpgEvents(senderID, "play_mines");
    if (lowerBody.startsWith("slots")) listenRpgEvents(senderID, "play_slots");
    if (lowerBody.startsWith("bank deposit")) listenRpgEvents(senderID, "bank_deposit");
    if (lowerBody.startsWith("bank withdraw")) listenRpgEvents(senderID, "bank_withdraw");
    if (lowerBody.startsWith("transfer")) listenRpgEvents(senderID, "transfer_money");
    if (lowerBody.startsWith("chest")) listenRpgEvents(senderID, "chest_open");
  },

  onStart: async function ({ api, event, args, usersData, message }) {
    const { senderID } = event;
    
    // Initialisation / Contrôle temporel automatique
    const playerActiveQuests = checkAndResetQuests(senderID);
    const stats = getPlayerStats(senderID);
    
    const subCommand = args[0]?.toLowerCase();

    // ==========================================
    // 📋 AFFICHAGE DES CATEGORIES DE QUÊTES
    // ==========================================
    if (!subCommand || ["daily", "weekly", "story", "secret"].includes(subCommand)) {
      const typeFilter = subCommand || "daily";
      const targetList = playerActiveQuests[typeFilter];

      if (!targetList || targetList.length === 0) {
        return message.reply(`🔮 | Aucune quête active dans la catégorie **${typeFilter.toUpperCase()}** pour le moment.`);
      }

      // Construction du catalogue textuel d'accompagnement
      let textMenu = `📜 [CONCORDANCE DES QUÊTES - ${typeFilter.toUpperCase()}]\n\n`;
      targetList.forEach((q, index) => {
        const status = q.claimed ? "✅ Réclamée" : (q.current >= q.target ? "🌟 Prête à valider" : "⚔️ En cours");
        textMenu += `${index + 1}. [${status}] Id: ${q.id}\n`;
        textMenu += `🎯 ${q.text}\n`;
        textMenu += `📊 Progression : ${q.current}/${q.target}\n`;
        textMenu += `💰 Prime : +${q.rewards.money}$ | +${q.rewards.xp} XP\n`;
        textMenu += `-------------------------\n`;
      });
      textMenu += `👉 Tapez \`quest claim <id_quete>\` pour toucher vos récompenses d'or !`;

      // Génération de la première quête de la liste sous format Canvas Premium
      try {
        const mainQuest = targetList[0]; 
        const cardBuffer = await drawQuestDetailsCard(
          `Quêtes ${typeFilter}`,
          `Grimoire officiel de l'aventurier`,
          mainQuest,
          senderID
        );
        const cachePath = path.join(DATA_DIR, `list_${senderID}_${typeFilter}.png`);
        fs.writeFileSync(cachePath, cardBuffer);

        return message.reply({ body: textMenu, attachment: fs.createReadStream(cachePath) });
      } catch (err) {
        return message.reply(textMenu);
      }
    }

    // ==========================================
    // 💰 RECLAMATION DES RECOMPENSES (CLAIM)
    // ==========================================
    if (subCommand === "claim") {
      const targetId = args[1];
      if (!targetId) return message.reply("❌ | Spécifiez l'ID de la quête à valider. Exemple : `quest claim q_a1b2c3d4`");

      let foundQuest = null;
      let categoryFound = null;

      const categories = ["daily", "weekly", "story", "secret"];
      for (const cat of categories) {
        if (playerActiveQuests[cat]) {
          const match = playerActiveQuests[cat].find(q => q.id === targetId);
          if (match) {
            foundQuest = match;
            categoryFound = cat;
            break;
          }
        }
      }

      if (!foundQuest) return message.reply("❌ | Cet identifiant de quête est inexistant ou a expiré.");
      if (foundQuest.claimed) return message.reply("🔒 | Les récompenses de cette quête ont déjà été versées dans votre coffre.");
      if (foundQuest.current < foundQuest.target) {
        return message.reply(`⚔️ | Objectif incomplet ! Vous êtes à (${foundQuest.current}/${foundQuest.target}) pour cette quête.`);
      }

      // Traitement financier avec usersData
      let uData = await usersData.get(senderID);
      let userMoney = uData.money || 0;
      userMoney += foundQuest.rewards.money;
      await usersData.set(senderID, { money: userMoney });

      // Archivage et mise à jour des statistiques RPG
      foundQuest.claimed = true;
      updatePlayerQuests(senderID, playerActiveQuests);

      stats.completed += 1;
      stats.moneyEarned += foundQuest.rewards.money;
      stats.xpEarned += foundQuest.rewards.xp;
      stats.history.push({
        id: foundQuest.id,
        text: foundQuest.text,
        date: new Date().toLocaleDateString('fr-FR'),
        reward: foundQuest.rewards.money
      });
      updatePlayerStats(senderID, stats);

      message.reply(`🎉 | **QUÊTE ACCOMPLIE !**\n\nVous empochez **+${foundQuest.rewards.money}$ d'or** et **+${foundQuest.rewards.xp} points d'expérience** !`);
      
      // Lancement de la vérification asynchrone des titres honorifiques
      await verifyAchievements(senderID, message);
      return;
    }

    // ==========================================
    // ⚙️ FORCE REFRESH (Selon Cooldown)
    // ==========================================
    if (subCommand === "refresh") {
      // Autorise un rafraîchissement forcé immédiat du cycle quotidien contre 15,000$ d'or
      let uData = await usersData.get(senderID);
      let userMoney = uData.money || 0;

      if (userMoney < 15000) return message.reply("💰 | Réinitialiser votre tableau des quêtes quotidien vous coûte **15 000$**. Solde insuffisant.");

      userMoney -= 15000;
      await usersData.set(senderID, { money: userMoney });

      playerActiveQuests.daily = [
        generateRandomQuest("daily"),
        generateRandomQuest("daily"),
        generateRandomQuest("daily")
      ];
      playerActiveQuests.lastDailyReset = Date.now();
      updatePlayerQuests(senderID, playerActiveQuests);

      return message.reply("🔄 | Votre grimoire quotidien a été réinitialisé par les sorciers des tavernes. (-15,000$)");
    }

    // ==========================================
    // 📊 LEADERBOARD (Classement des Aventuriers)
    // ==========================================
    if (subCommand === "leaderboard" || subCommand === "lb") {
      const allStats = readJSON(STATS_FILE);
      const sorted = Object.entries(allStats)
        .map(([uid, data]) => ({ uid, completed: data.completed || 0 }))
        .sort((a, b) => b.completed - a.completed)
        .slice(0, 10);

      if (sorted.length === 0) return message.reply("🏁 | Aucun aventurier n'a encore validé de contrat de quête.");

      let lbText = "🏆 [CLASSEMENT DES LEGENDES DU SERVEUR]\n\n";
      for (let i = 0; i < sorted.length; i++) {
        let nameUser = (await usersData.get(sorted[i].uid)).name || "Aventurier Anonyme";
        lbText += `${i + 1}. ${nameUser} — ${sorted[i].completed} quêtes résolues\n`;
      }
      return message.reply(lbText);
    }

    // ==========================================
    // 📖 HISTORIQUE & STATISTIQUES DU JOUEUR
    // ==========================================
    if (subCommand === "history" || subCommand === "info") {
      let histText = `📊 [STATISTIQUES DE CARRIÈRE RPG]\n\n`;
      histText += `• Quêtes terminées au total : ${stats.completed}\n`;
      histText += `• Or accumulé via les quêtes : +${stats.moneyEarned}$\n`;
      histText += `• Expérience générale gagnée : +${stats.xpEarned} XP\n`;
      histText += `• Titres possédés : [ ${stats.titles.join(", ") || "Aucun"} ]\n\n`;
      histText += `📜 Dernières entrées du journal de bord :\n`;
      
      const lastEntries = stats.history.slice(-3).reverse();
      if (lastEntries.length === 0) {
        histText += "— Aucune archive récente.";
      } else {
        lastEntries.forEach(h => {
          histText += `• [${h.date}] — ${h.text} (+${h.reward}$)\n`;
        });
      }

      return message.reply(histText);
    }
  }
};
