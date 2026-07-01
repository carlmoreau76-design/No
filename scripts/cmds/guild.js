/**
 * @file guild.js
 * @description Système de Guilde MMORPG Complet & Autonome pour GoatBot v2
 * @version 2.5.0
 * @author Collaborateur IA RPG
 * @credits Conception Premium MMORPG Engine
 */

const fs = require('fs');
const path = require('path');

// ==========================================
// 📁 CHEMINS DE STOCKAGE DE LA BASE DE DONNÉES
// ==========================================
const DATA_DIR = path.join(__dirname, 'cache', 'guildsMMO');
const GUILDS_FILE = path.join(DATA_DIR, 'guilds_registry.json');
const USERS_FILE = path.join(DATA_DIR, 'users_registry.json');
const WAR_FILE = path.join(DATA_DIR, 'war_state.json');

// Initialisation physique des répertoires et fichiers JSON
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(GUILDS_FILE)) fs.writeFileSync(GUILDS_FILE, JSON.stringify({}, null, 2));
if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, JSON.stringify({}, null, 2));
if (!fs.existsSync(WAR_FILE)) fs.writeFileSync(WAR_FILE, JSON.stringify({ phase: "ended", nextWarTime: Date.now() + 60000 }, null, 2));

// ==========================================
// 🌍 CONFIGURATION ET ATLAS DES TERRITOIRES
// ==========================================
const TERRITORIES_MAP = {
  nord: { id: "nord", name: "Royaume du Nord", emoji: "🏰", tier: 1, money: 15000, xp: 400, chestChance: 0.10 },
  iles: { id: "iles", name: "Îles Perdues", emoji: "🏝", tier: 1, money: 22000, xp: 600, chestChance: 0.15 },
  volcan: { id: "volcan", name: "Terre Volcanique", emoji: "🌋", tier: 2, money: 35000, xp: 900, chestChance: 0.20 },
  foret: { id: "foret", name: "Forêt Antique", emoji: "🌲", tier: 2, money: 48000, xp: 1200, chestChance: 0.22 },
  desert: { id: "desert", name: "Désert d'Or", emoji: "🏜", tier: 3, money: 65000, xp: 1600, chestChance: 0.28 },
  gele: { id: "gele", name: "Royaume Gelé", emoji: "❄", tier: 3, money: 85000, xp: 2100, chestChance: 0.35 },
  celeste: { id: "celeste", name: "Cité Céleste", emoji: "🌌", tier: 4, money: 120000, xp: 3000, chestChance: 0.45 },
  pirate: { id: "pirate", name: "Port Pirate", emoji: "⚓", tier: 4, money: 160000, xp: 4200, chestChance: 0.50 },
  dragon: { id: "dragon", name: "Empire du Dragon", emoji: "🏯", tier: 5, money: 250000, xp: 6000, chestChance: 0.65 },
  ombres: { id: "ombres", name: "Royaume des Ombres", emoji: "🌑", tier: 5, money: 500000, xp: 10000, chestChance: 0.80 }
};

// ==========================================
// 👑 HIÉRARCHIE ET DROITS D'ACCÈS DU JEU
// ==========================================
const ROLES = {
  LEADER: { rank: 4, name: "Leader", emoji: "👑", canInvite: true, canKick: true, canPromote: true, canWithdraw: true, canSettings: true },
  CO_LEADER: { rank: 3, name: "Co-Leader", emoji: "⭐", canInvite: true, canKick: true, canPromote: true, canWithdraw: true, canSettings: false },
  OFFICIER: { rank: 2, name: "Officier", emoji: "🛡", canInvite: true, canKick: false, canPromote: false, canWithdraw: false, canSettings: false },
  MEMBRE: { rank: 1, name: "Membre", emoji: "👤", canInvite: false, canKick: false, canPromote: false, canWithdraw: false, canSettings: false }
};

// ==========================================
// 🛠 Fonctions Entrées/Sorties de données
// ==========================================
function readDB(filePath) {
  try { return JSON.parse(fs.readFileSync(filePath, 'utf8')); }
  catch (e) { return {}; }
}

function writeDB(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

// Générateur d'identifiant hexadécimal à 6 caractères pour les guildes
function generateUID() {
  return Math.random().toString(16).substring(2, 8).toUpperCase();
}

// Récupérer la liaison guilde d'un joueur
function getUserLink(uid) {
  const db = readDB(USERS_FILE);
  return db[uid] || null;
}

// Assigner ou supprimer la liaison guilde d'un joueur
function setUserLink(uid, linkObj) {
  const db = readDB(USERS_FILE);
  if (!linkObj) delete db[uid];
  else db[uid] = linkObj;
  writeDB(USERS_FILE, db);
}

// ==========================================
// 📈 ALGORITHMES DE PROGRESSION ET DE COÛTS
// ==========================================
function getUpgradeCost(level) {
  return Math.floor(1000000 * Math.pow(1.32, level - 1));
}

function getMaxMembers(level) {
  return Math.min(100, 15 + Math.floor(level * 1.75));
}

function getLevelBonus(level) {
  return {
    xpMultiplier: 1 + (level * 0.05), // +5% par niveau
    moneyMultiplier: 1 + (level * 0.04), // +4% par niveau
    warBonus: level * 15 // Dégâts bruts en plus
  };
}

// Système d'enregistrement interne à la guilde (Max 30 entrées)
function addGuildLog(guild, action) {
  const entry = {
    time: new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris' }),
    action: action
  };
  guild.logs.push(entry);
  if (guild.logs.length > 30) guild.logs.shift();
}

// ==========================================
// ⚔️ ENGINE : CRON / AUTOMATION DU CYCLE DE GUERRE
// ==========================================
function updateWarCycleEngine() {
  const warState = readDB(WAR_FILE);
  const guilds = readDB(GUILDS_FILE);
  const now = Date.now();

  // 1. Initialisation d'une nouvelle guerre si le délai de 18h est expiré
  if (!warState.nextWarTime || now >= warState.nextWarTime) {
    const activeGuildIds = Object.keys(guilds);
    
    // Une guerre nécessite au moins 2 guildes enregistrées sur le serveur
    if (activeGuildIds.length < 2) return;

    let gA_id = activeGuildIds[Math.floor(Math.random() * activeGuildIds.length)];
    let gB_id = activeGuildIds[Math.floor(Math.random() * activeGuildIds.length)];
    
    // Sécurité contre l'auto-confrontation
    while (gA_id === gB_id) {
      gB_id = activeGuildIds[Math.floor(Math.random() * activeGuildIds.length)];
    }

    // Sécurité historique : Éviter que les deux mêmes guildes se réaffrontent immédiatement
    if (warState.lastMatchup && (warState.lastMatchup.includes(gA_id) && warState.lastMatchup.includes(gB_id))) {
      // Re-tirage de secours rapide si le catalogue le permet
      if (activeGuildIds.length > 2) {
        while (gA_id === warState.lastMatchup[0] || gA_id === warState.lastMatchup[1]) {
          gA_id = activeGuildIds[Math.floor(Math.random() * activeGuildIds.length)];
        }
        while (gB_id === gA_id || gB_id === warState.lastMatchup[0] || gB_id === warState.lastMatchup[1]) {
          gB_id = activeGuildIds[Math.floor(Math.random() * activeGuildIds.length)];
        }
      }
    }

    // Mutation vers la phase d'inscription règlementaire de 30 minutes
    warState.guildA = gA_id;
    warState.guildB = gB_id;
    warState.phase = "registration";
    warState.phaseEndTime = now + (30 * 60 * 1000); // 30 Minutes
    warState.nextWarTime = now + (18 * 60 * 60 * 1000); // Récurrence toutes les 18 heures
    warState.participantsA = [];
    warState.participantsB = [];
    warState.scores = { [gA_id]: 0, [gB_id]: 0 };
    warState.damageDealt = {};
    warState.attacksCount = {};
    warState.lastMatchup = [gA_id, gB_id];

    writeDB(WAR_FILE, warState);
    return;
  }

  // 2. Transition de la phase d'inscription (Registration) vers le combat actif (Battle)
  if (warState.phase === "registration" && now >= warState.phaseEndTime) {
    const hasParticipantsA = warState.participantsA.length > 0;
    const hasParticipantsB = warState.participantsB.length > 0;

    // Gestion technique des forfaits si une ou deux équipes manquent à l'appel
    if (!hasParticipantsA || !hasParticipantsB) {
      resolveWarForfeit(warState, hasParticipantsA, hasParticipantsB);
      return;
    }

    // Lancement officiel des hostilités pour une durée de 30 minutes
    warState.phase = "battle";
    warState.phaseEndTime = now + (30 * 60 * 1000); // 30 Minutes de combat intensif
    writeDB(WAR_FILE, warState);
    return;
  }

  // 3. Clôture de la phase de combat et distribution des gains
  if (warState.phase === "battle" && now >= warState.phaseEndTime) {
    resolveWarEnd(warState);
    return;
  }
}

// ==========================================
// ❌ RÉSOLUTION DES CAS DE FORFAIT AUTOMATIQUE
// ==========================================
function resolveWarForfeit(warState, hasA, hasB) {
  const guilds = readDB(GUILDS_FILE);
  const guildA = guilds[warState.guildA];
  const guildB = guilds[warState.guildB];

  if (!hasA && hasB && guildA) {
    // Faction A forfait, Faction B déclarée vainqueur
    applyForfeitPenalties(guildA, guildB);
  } else if (hasA && !hasB && guildB) {
    // Faction B forfait, Faction A déclarée vainqueur
    applyForfeitPenalties(guildB, guildA);
  } else {
    // Double forfait généralisé du serveur
    if (guildA) applyForfeitPenalties(guildA, null);
    if (guildB) applyForfeitPenalties(guildB, null);
  }

  warState.phase = "ended";
  writeDB(WAR_FILE, warState);
  writeDB(GUILDS_FILE, guilds);
}

function applyForfeitPenalties(loser, winner) {
  // Pénalité stricte de 5% du coffre plafonnée à 5,000,000$ max sans toucher au solde des joueurs
  const penaltyMoney = Math.min(5000000, Math.floor(loser.bank * 0.05));
  loser.bank = Math.max(0, loser.bank - penaltyMoney);
  loser.trophies = Math.max(0, loser.trophies - 20);
  loser.xp = Math.max(0, loser.xp - 1000);
  loser.losses += 1;
  addGuildLog(loser, `❌ Défaite par forfait logistique. Perte de -${penaltyMoney.toLocaleString()}$, -20 Trophées.`);

  if (winner) {
    winner.bank += penaltyMoney + 1000000; // Bonus forfait complémentaire de base
    winner.trophies += 30;
    winner.xp += 2500;
    winner.wins += 1;
    addGuildLog(winner, `🏆 Victoire par forfait adverse ! +${(penaltyMoney + 1000000).toLocaleString()}$, +30 Trophées.`);
    checkAndProgressMission(winner, "war_wins", winner.wins);
  }
}

// ==========================================
// 🏆 RÉSOLUTION FINALE D'UN COMBAT ACCOMPLI (FIN DE GUERRE)
// ==========================================
function resolveWarEnd(warState) {
  const guilds = readDB(GUILDS_FILE);
  const gA = guilds[warState.guildA];
  const gB = guilds[warState.guildB];

  if (!gA || !gB) return;

  const scoreA = warState.scores[gA.id] || 0;
  const scoreB = warState.scores[gB.id] || 0;

  let winner = null;
  let loser = null;

  if (scoreA > scoreB) { winner = gA; loser = gB; }
  else if (scoreB > scoreA) { winner = gB; loser = gA; }

  if (winner && loser) {
    const rewards = getLevelBonus(winner.level);
    const winGold = Math.floor(3000000 * rewards.moneyMultiplier);
    const winXp = Math.floor(5000 * rewards.xpMultiplier);

    winner.wins += 1;
    winner.bank += winGold;
    winner.xp += winXp;
    winner.trophies += 50;
    addGuildLog(winner, `⚔️ Victoire militaire éclatante face à ${loser.name} (${scoreA.toLocaleString()} vs ${scoreB.toLocaleString()}). Recette: +${winGold.toLocaleString()}$, +50 Trophées.`);
    
    loser.losses += 1;
    loser.trophies = Math.max(0, loser.trophies - 25);
    loser.xp += Math.floor(1200 * getLevelBonus(loser.level).xpMultiplier); // Lot de consolation XP
    addGuildLog(loser, `⚔️ Défaite lors de l'affrontement contre ${winner.name} (${scoreB.toLocaleString()} vs ${scoreA.toLocaleString()}). -25 Trophées.`);

    // Algorithme de pillage/conquête de territoire (40% de chance si le perdant possède du terrain)
    if (loser.territories.length > 0 && Math.random() < 0.40) {
      const index = Math.floor(Math.random() * loser.territories.length);
      const conqueredId = loser.territories.splice(index, 1)[0];
      winner.territories.push(conqueredId);
      
      addGuildLog(winner, `🌍 CONQUÊTE : Le territoire [${TERRITORIES_MAP[conqueredId].name}] a été annexé suite à la victoire !`);
      addGuildLog(loser, `🌍 PERTE : Le territoire [${TERRITORIES_MAP[conqueredId].name}] a été cédé à l'ennemi suite à la défaite.`);
      
      checkAndProgressMission(winner, "territories_count", winner.territories.length);
    }

    // Traitement des paliers d'XP de la guilde victorieuse et perdante
    processGuildXpGain(winner);
    processGuildXpGain(loser);
    
    checkAndProgressMission(winner, "war_wins", winner.wins);
  } else {
    // Scénario rarissime d'égalité pure aux points
    gA.xp += 1500; gB.xp += 1500;
    addGuildLog(gA, `⚔️ Match nul contre ${gB.name}. Statu quo sur le champ de bataille.`);
    addGuildLog(gB, `⚔️ Match nul contre ${gA.name}. Statu quo sur le champ de bataille.`);
  }

  // Archivage et compilation du profil MVP de la session de combat
  warState.phase = "ended";
  warState.finalResults = {
    scoreA,
    scoreB,
    winnerName: winner ? winner.name : "Égalité",
    mvp: compileWarMVP(warState)
  };

  writeDB(WAR_FILE, warState);
  writeDB(GUILDS_FILE, guilds);
}

function compileWarMVP(warState) {
  let highestDmg = -1;
  let mvpUserId = "Aucun";
  
  for (const [uid, damage] of Object.entries(warState.damageDealt)) {
    if (damage > highestDmg) {
      highestDmg = damage;
      mvpUserId = uid;
    }
  }

  return {
    uid: mvpUserId,
    damage: highestDmg,
    attacks: warState.attacksCount[mvpUserId] || 0,
    contribution: highestDmg > 0 ? Math.floor(Math.random() * 20) + 80 : 0 // Facteur de performance textuelle
  };
}

function processGuildXpGain(guild) {
  let requiredXp = guild.level * 6000;
  while (guild.xp >= requiredXp && guild.level < 50) {
    guild.xp -= requiredXp;
    guild.level += 1;
    addGuildLog(guild, `🏰 ÉVOLUTION : Le bastion passe au Niveau ${guild.level} ! Capacité d'infrastructure augmentée.`);
    updateGuildAchievements(guild);
    requiredXp = guild.level * 6000;
  }
}

// ==========================================
// 🌍 GESTION ADMINISTRATIVE DES RÉCOLTES TERRITORIALES PASSIVES
// ==========================================
function executeTerritoryHarvest(guild) {
  const now = Date.now();
  if (!guild.lastTerritoryCollect) guild.lastTerritoryCollect = 0;

  // Fréquence stricte de récolte automatique toutes les 12 heures
  if (now - guild.lastTerritoryCollect >= 12 * 60 * 60 * 1000) {
    let profitGold = 0;
    let profitXp = 0;
    let totalChests = 0;

    guild.territories.forEach(tId => {
      const zone = TERRITORIES_MAP[tId];
      if (zone) {
        profitGold += zone.money;
        profitXp += zone.xp;
        if (Math.random() < zone.chestChance) totalChests += 1;
      }
    });

    if (profitGold > 0) {
      // Application des coefficients multiplicateurs de niveau de guilde
      const modifiers = getLevelBonus(guild.level);
      const finalGold = Math.floor(profitGold * modifiers.moneyMultiplier);
      const finalXp = Math.floor(profitXp * modifiers.xpMultiplier);

      guild.bank += finalGold;
      guild.xp += finalXp;
      guild.chests = (guild.chests || 0) + totalChests;
      guild.lastTerritoryCollect = now;

      addGuildLog(guild, `📦 COLOSSAL : Extraction passive des terres. Récupération de +${finalGold.toLocaleString()}$, +${finalXp} XP, +${totalChests} Coffre(s) de Guerre.`);
      processGuildXpGain(guild);
      return { gold: finalGold, xp: finalXp, chests: totalChests };
    }
  }
  return null;
}

// ==========================================
// 🎯 MISSIONS CONTEXTUELLES & SUCCÈS HISTORIQUES
// ==========================================
const GUILD_MISSIONS_DB = {
  m_don: { id: "m_don", text: "Déposer au moins 10,000,000$ dans le coffre", target: 10000000, type: "donate_total", moneyReward: 750000, xpReward: 2000, chests: 1 },
  m_mem: { id: "m_mem", text: "Recruter un contingent de 10 membres actifs", target: 10, type: "members_count", moneyReward: 400000, xpReward: 1500, chests: 1 },
  m_win: { id: "m_win", text: "Remporter 15 victoires écrasantes en Guild War", target: 15, type: "war_wins", moneyReward: 2000000, xpReward: 5000, chests: 3 },
  m_ter: { id: "m_ter", text: "Conquérir et sécuriser 3 territoires de la carte", target: 3, type: "territories_count", moneyReward: 1200000, xpReward: 3500, chests: 2 }
};

function checkAndProgressMission(guild, type, value) {
  for (const [id, mission] of Object.entries(GUILD_MISSIONS_DB)) {
    if (mission.type === type && !guild.completedMissions.includes(id)) {
      if (value >= mission.target) {
        guild.completedMissions.push(id);
        guild.bank += mission.moneyReward;
        guild.xp += mission.xpReward;
        guild.chests = (guild.chests || 0) + mission.chests;
        addGuildLog(guild, `🎯 QUÊTE ACCOMPLIE : "${mission.text}". +${mission.moneyReward.toLocaleString()}$, +${mission.xpReward} XP, +${mission.chests} Coffre(s).`);
        processGuildXpGain(guild);
      }
    }
  }
}

const GUILD_ACHIEVEMENTS_DB = {
  a_fond: { id: "a_fond", name: "🥉 Première Guilde", desc: "Fonder une alliance officielle dans l'empire.", evalFn: (g) => true },
  a_n10:  { id: "a_n10",  name: "🥈 Niveau 10", desc: "Élever l'infrastructure au Niveau 10.", evalFn: (g) => g.level >= 10 },
  a_n25:  { id: "a_n25",  name: "🥇 Niveau 25", desc: "Propulser l'infrastructure au Niveau 25.", evalFn: (g) => g.level >= 25 },
  a_n50:  { id: "a_n50",  name: "👑 Niveau 50", desc: "Atteindre la perfection absolue : Bastion Niveau 50.", evalFn: (g) => g.level >= 50 },
  a_w100: { id: "a_w100", name: "⚔️ Centurion Flamboyant", desc: "Décrocher 100 victoires officielles en Guild War.", evalFn: (g) => g.wins >= 100 },
  a_b100: { id: "a_b100", name: "💰 Trésor Impérial", desc: "Accumuler plus de 100,000,000$ dans le coffre.", evalFn: (g) => g.bank >= 100000000 },
  a_t5:   { id: "a_t5",   name: "🌍 Conquérant Suprême", desc: "Soumettre et régner sur 5 territoires simultanément.", evalFn: (g) => g.territories.length >= 5 }
};

function updateGuildAchievements(guild) {
  for (const [id, ach] of Object.entries(GUILD_ACHIEVEMENTS_DB)) {
    if (!guild.achievements.includes(id) && ach.evalFn(guild)) {
      guild.achievements.push(id);
      guild.xp += 3000; // Injection massive d'XP de complétion
      guild.chests = (guild.chests || 0) + 1;
      addGuildLog(guild, `🏆 SUCCÈS DÉBLOQUÉ : [${ach.name}] — ${ach.desc}`);
    }
  }
      }
