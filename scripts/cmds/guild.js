/**
 * @file guild.js
 * @description Système de Guildes MMORPG Ultra Premium Interconnecté pour GoatBot v2
 * @command guild
 * @credits Format GoatBot v2 & MMORPG Engine
 */

const fs = require('fs');
const path = require('path');

// --- CONSTANTES ET PERSISTANCE DE STOCKAGE ---
const DATA_DIR = path.join(__dirname, 'cache', 'guildData');
const GUILDS_FILE = path.join(DATA_DIR, 'guilds.json');
const USERS_GUILD_FILE = path.join(DATA_DIR, 'users_guilds.json');
const WAR_FILE = path.join(DATA_DIR, 'current_war.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(GUILDS_FILE)) fs.writeFileSync(GUILDS_FILE, JSON.stringify({}, null, 2));
if (!fs.existsSync(USERS_GUILD_FILE)) fs.writeFileSync(USERS_GUILD_FILE, JSON.stringify({}, null, 2));
if (!fs.existsSync(WAR_FILE)) fs.writeFileSync(WAR_FILE, JSON.stringify({}, null, 2));

// --- BASE DE DONNÉES DES TERRITOIRES ---
const TERRITORIES_DB = {
  nord: { id: "nord", name: "Royaume du Nord", emoji: "🏰", moneyReward: 5000, xpReward: 200, tier: 1 },
  iles: { id: "iles", name: "Îles Perdues", emoji: "🏝", moneyReward: 8000, xpReward: 350, tier: 1 },
  volcan: { id: "volcan", name: "Terre Volcanique", emoji: "🌋", moneyReward: 12000, xpReward: 500, tier: 2 },
  foret: { id: "foret", name: "Forêt Antique", emoji: "🌲", moneyReward: 15000, xpReward: 650, tier: 2 },
  desert: { id: "desert", name: "Désert d'Or", emoji: "🏜", moneyReward: 20000, xpReward: 900, tier: 3 },
  gele: { id: "gele", name: "Royaume Gelé", emoji: "❄", moneyReward: 25000, xpReward: 1200, tier: 3 },
  celeste: { id: "celeste", name: "Cité Céleste", emoji: "🌌", moneyReward: 35000, xpReward: 1800, tier: 4 },
  pirate: { id: "pirate", name: "Port Pirate", emoji: "⚓", moneyReward: 45000, xpReward: 2400, tier: 4 },
  dragon: { id: "dragon", name: "Empire du Dragon", emoji: "🏯", moneyReward: 60000, xpReward: 3500, tier: 5 },
  ombres: { id: "ombres", name: "Royaume des Ombres", emoji: "🌑", moneyReward: 100000, xpReward: 5000, tier: 5 }
};

// --- CONFIGURATION DE LA HIÉRARCHIE (ROLES) ---
const ROLES = {
  LEADER: { rank: 4, name: "Leader", emoji: "👑" },
  CO_LEADER: { rank: 3, name: "Co-Leader", emoji: "⭐" },
  OFFICIER: { rank: 2, name: "Officier", emoji: "🛡" },
  MEMBRE: { rank: 1, name: "Membre", emoji: "👤" }
};

// --- FONCTIONS LOGIQUES DE LECTURE / ÉCRITURE ---
function readJSON(file) { return JSON.parse(fs.readFileSync(file, 'utf8')); }
function writeJSON(file, data) { fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8'); }

// Générateur d'ID unique à 6 caractères hexadécimaux
function generateGuildID() {
  return Math.random().toString(16).substring(2, 8).toUpperCase();
}

// Récupérer le lien d'un joueur à sa guilde
function getUserGuildLink(uid) {
  const users = readJSON(USERS_GUILD_FILE);
  return users[uid] || null; // { guildId: "XXXXXX", role: "MEMBRE" }
}

function setUserGuildLink(uid, linkObj) {
  const users = readJSON(USERS_GUILD_FILE);
  if (linkObj === null) {
    delete users[uid];
  } else {
    users[uid] = linkObj;
  }
  writeJSON(USERS_GUILD_FILE, users);
}

// Calculer le coût d'amélioration du niveau de guilde (1 à 50)
function getUpgradeCost(currentLevel) {
  return Math.floor(500000 * Math.pow(1.28, currentLevel));
}

// Calculer la capacité max de membres selon le niveau
function getMaxMembers(level) {
  return Math.min(100, 10 + Math.floor(level * 1.8));
}

// --- LOGS DE GUILDE INTERNES ---
function logGuildAction(guild, actionText) {
  const logEntry = {
    date: new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris' }),
    action: actionText
  };
  guild.logs.push(logEntry);
  if (guild.logs.length > 40) guild.logs.shift(); // Nettoyage régulier des anciens logs
}

// --- UTILS : COMPOSITEUR D'INTERFACES TEXTUELLES ---
const UI = {
  line: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
  boxStart: (title) => `╭────────────── 🌟 ──────────────╮\n│ ⚔️  ${title.toUpperCase()}\n├───────────────────────────────────────`,
  boxEnd: () => `╰───────────────────────────────────────╯`,
  field: (label, val) => `│ 🔹 ${label} : ${val}`
};

// --- MOTEUR DE GUERRE AUTOMATIQUE (GUILD WAR ENGINE) ---
function checkAndManageWarCycle() {
  const currentWar = readJSON(WAR_FILE);
  const now = Date.now();
  const guilds = readJSON(GUILDS_FILE);

  // Si aucune guerre n'est configurée ou si le cycle complet de 18 heures est dépassé, on relance une guerre
  if (!currentWar.nextWarTime || now >= currentWar.nextWarTime) {
    const guildIds = Object.keys(guilds);
    if (guildIds.length < 2) return; // Il faut au moins 2 guildes enregistrées sur le bot

    // Tirage au sort de deux guildes différentes (en évitant la dernière confrontation si possible)
    let g1 = guildIds[Math.floor(Math.random() * guildIds.length)];
    let g2 = guildIds[Math.floor(Math.random() * guildIds.length)];
    while (g1 === g2) {
      g2 = guildIds[Math.floor(Math.random() * guildIds.length)];
    }

    if (currentWar.lastMatch && ((currentWar.lastMatch.includes(g1) && currentWar.lastMatch.includes(g2)))) {
      // Re-tirage secondaire pour casser la récurrence directe
      g1 = guildIds[Math.floor(Math.random() * guildIds.length)];
      g2 = guildIds[Math.floor(Math.random() * guildIds.length)];
    }

    // Configuration des phases : 30 min d'inscription, 30 min de combat
    currentWar.guildA = g1;
    currentWar.guildB = g2;
    currentWar.phase = "registration"; 
    currentWar.startedAt = now;
    currentWar.phaseEndTime = now + (30 * 60 * 1000); // 30 minutes
    currentWar.nextWarTime = now + (18 * 60 * 60 * 1000); // Prochaine guerre dans 18h
    currentWar.participantsA = [];
    currentWar.participantsB = [];
    currentWar.scores = { [g1]: 0, [g2]: 0 };
    currentWar.damageDealt = {}; // Suivi individuel des dégâts pour le MVP
    currentWar.attacksCount = {};
    currentWar.lastMatch = [g1, g2];

    writeJSON(WAR_FILE, currentWar);
    return;
  }

  // Passage automatique de la phase d'inscription à la phase de combat
  if (currentWar.phase === "registration" && now >= currentWar.phaseEndTime) {
    // Si l'une des deux guildes n'a aucun inscrit : déclaration de forfait
    const hasA = currentWar.participantsA.length > 0;
    const hasB = currentWar.participantsB.length > 0;

    if (!hasA || !hasB) {
      resolveWarForfeit(currentWar, hasA, hasB);
      return;
    }

    currentWar.phase = "battle";
    currentWar.phaseEndTime = now + (30 * 60 * 1000); // 30 minutes de combat
    writeJSON(WAR_FILE, currentWar);
    return;
  }

  // Clôture et calcul des résultats à la fin du temps de combat
  if (currentWar.phase === "battle" && now >= currentWar.phaseEndTime) {
    resolveWarEnd(currentWar);
    return;
  }
}

// --- GESTION DU FORFAIT (SANS RETRAIT D'ARGENT PERSONNEL) ---
function resolveWarForfeit(currentWar, hasA, hasB) {
  const guilds = readJSON(GUILDS_FILE);
  
  if (!hasA && hasB) {
    applyForfeitPenalties(guilds[currentWar.guildA], guilds[currentWar.guildB]);
  } else if (hasA && !hasB) {
    applyForfeitPenalties(guilds[currentWar.guildB], guilds[currentWar.guildA]);
  } else {
    // Les deux guildes font forfait
    if (guilds[currentWar.guildA]) applyForfeitPenalties(guilds[currentWar.guildA], null);
    if (guilds[currentWar.guildB]) applyForfeitPenalties(guilds[currentWar.guildB], null);
  }

  currentWar.phase = "ended";
  writeJSON(WAR_FILE, currentWar);
  writeJSON(GUILDS_FILE, guilds);
}

function applyForfeitPenalties(loserGuild, winnerGuild) {
  if (!loserGuild) return;
  // Perte de 5% du coffre de guilde (plafonné à 2,000,000$) - L'argent personnel n'est JAMAIS touché
  const lossAmount = Math.min(2000000, Math.floor(loserGuild.bank * 0.05));
  loserGuild.bank -= lossAmount;
  loserGuild.xp = Math.max(0, loserGuild.xp - 500);
  loserGuild.trophies = Math.max(0, loserGuild.trophies - 15);
  loserGuild.losses += 1;
  logGuildAction(loserGuild, ` Forfait en Guild War. -${lossAmount}$ du coffre, -15 Trophées.`);

  if (winnerGuild) {
    winnerGuild.bank += lossAmount;
    winnerGuild.xp += 1000;
    winnerGuild.trophies += 25;
    winnerGuild.wins += 1;
    logGuildAction(winnerGuild, `Victoire par forfait de l'adversaire. +${lossAmount}$ récupérés, +25 Trophées.`);
  }
}

// --- CLÔTURE DE LA BATAILLE ET DÉSIGNATION DU MVP ---
function resolveWarEnd(currentWar) {
  const guilds = readJSON(GUILDS_FILE);
  const gA = guilds[currentWar.guildA];
  const gB = guilds[currentWar.guildB];

  if (!gA || !gB) return;

  const scoreA = currentWar.scores[gA.id] || 0;
  const scoreB = currentWar.scores[gB.id] || 0;

  let winner = null;
  let loser = null;

  if (scoreA > scoreB) { winner = gA; loser = gB; }
  else if (scoreB > scoreA) { winner = gB; loser = gA; }

  // Enregistrement des résultats et distribution des récompenses de guilde
  if (winner && loser) {
    winner.wins += 1;
    winner.xp += 3000;
    winner.trophies += 50;
    winner.bank += 1500000; // Bonus financier au coffre

    loser.losses += 1;
    loser.xp += 500;
    loser.trophies = Math.max(0, loser.trophies - 20);

    logGuildAction(winner, `Victoire éclatante contre ${loser.name} (${scoreA} vs ${scoreB}). +1.5M$, +50 Trophées.`);
    logGuildAction(loser, `Défaite contre ${winner.name} (${scoreB} vs ${scoreA}). -20 Trophées.`);

    // Conquête de territoire : Transfert aléatoire d'une zone possédée par le perdant
    if (loser.territories.length > 0 && Math.random() < 0.40) {
      const lostTerritoryId = loser.territories.splice(Math.floor(Math.random() * loser.territories.length), 1)[0];
      winner.territories.push(lostTerritoryId);
      logGuildAction(winner, `Conquête territoriale ! Nous avons capturé le territoire [${lostTerritoryId.toUpperCase()}] à l'ennemi.`);
      logGuildAction(loser, `Désastre ! L'ennemi a annexé notre territoire [${lostTerritoryId.toUpperCase()}].`);
    }
  }

  // Sauvegarde du rapport final de guerre pour affichage
  currentWar.phase = "ended";
  currentWar.finalResults = {
    scoreA, scoreB,
    winnerName: winner ? winner.name : "Égalité parfaite",
    mvp: findWarMVP(currentWar)
  };

  writeJSON(WAR_FILE, currentWar);
  writeJSON(GUILDS_FILE, guilds);
}

function findWarMVP(currentWar) {
  let maxDmg = -1;
  let mvpId = "Aucun";
  for (const [uid, dmg] of Object.entries(currentWar.damageDealt)) {
    if (dmg > maxDmg) {
      maxDmg = dmg;
      mvpId = uid;
    }
  }
  return {
    uid: mvpId,
    damage: maxDmg,
    attacks: currentWar.attacksCount[mvpId] || 0
  };
}

// --- COLLECTE AUTOMATIQUE DES TERRITOIRES (TOUTES LES 12 HEURES) ---
function processTerritoryEarnings(guild) {
  const now = Date.now();
  if (!guild.lastTerritoryCollect) guild.lastTerritoryCollect = 0;
  
  // 12 heures en millisecondes = 43200000
  if (now - guild.lastTerritoryCollect >= 43200000) {
    let totalMoney = 0;
    let totalXp = 0;

    guild.territories.forEach(tId => {
      const dbConfig = TERRITORIES_DB[tId];
      if (dbConfig) {
        totalMoney += dbConfig.moneyReward;
        totalXp += dbConfig.xpReward;
      }
    });

    if (totalMoney > 0) {
      guild.bank += totalMoney;
      guild.xp += totalXp;
      guild.lastTerritoryCollect = now;
      logGuildAction(guild, `Récolte des territoires : +${totalMoney}$ dans le coffre, +${totalXp} XP Guilde.`);
      return { money: totalMoney, xp: totalXp };
    }
  }
  return null;
}
