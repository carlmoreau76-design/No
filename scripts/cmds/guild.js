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

// ==========================================
// 🛡️ CONFIGURATION ET INTERFACE DU MODULE GOATBOT
// ==========================================
module.exports = {
  config: {
    name: "guild",
    aliases: ["g", "faction"],
    version: "2.5.0",
    author: "Collaborateur IA RPG",
    countDown: 2,
    role: 0,
    description: "Système de Guilde MMORPG Complet (Guerres, Territoires, Économie, Quêtes).",
    category: "game",
    guide: { fr: "{p}guild [sous-commande]", en: "{p}guild [subcommand]" }
  },

  onStart: async function ({ api, event, args, usersData, message }) {
    const { senderID, threadID } = event;

    // Mise à jour synchrone et sécurisée des horloges de guerre à chaque interaction
    updateWarCycleEngine();

    const guilds = readDB(GUILDS_FILE);
    const userLink = getUserLink(senderID);
    const subCommand = args[0]?.toLowerCase();

    // ==========================================
    // 📜 INTERFACE : MENU D'AIDE AUTOMATIQUE (SI "guild" UNIQUEMENT)
    // ==========================================
    if (!subCommand) {
      let menu = `╭───────────────────────────────────────╮\n`;
      menu += `│ ⚔️  𝐒𝐘𝐒𝐓È𝐌𝐄 𝐃𝐄 𝐆𝐔𝐈𝐋𝐃𝐄𝐒 𝐌𝐌𝐎𝐑𝐏𝐆\n`;
      menu += `├───────────────────────────────────────┤\n`;
      menu += `│ 🔹 ~guild create <nom> : Fonder votre empire\n`;
      menu += `│ 🔹 ~guild info [ID] : Afficher la fiche de faction\n`;
      menu += `│ 🔹 ~guild list : Parcourir l'annuaire général\n`;
      menu += `│ 🔹 ~guild search <nom> : Filtrer les alliances\n`;
      menu += `│ 🔹 ~guild join <ID> : Intégrer un bastion\n`;
      menu += `│ 🔹 ~guild leave : Déserter les rangs actuels\n`;
      menu += `│ 🔹 ~guild invite @user : Enrôler un combattant\n`;
      menu += `│ 🔹 ~guild members : Voir l'effectif complet\n`;
      menu += `├───────────────────────────────────────┤\n`;
      menu += `│ 💰 𝐁𝐀𝐍𝐐𝐔𝐄 & 𝐈𝐍𝐅𝐑𝐀𝐒𝐓𝐑𝐔𝐂𝐓𝐔𝐑𝐄\n`;
      menu += `├───────────────────────────────────────┤\n`;
      menu += `│ 🔹 ~guild donate <montant/all> : Verser au coffre\n`;
      menu += `│ 🔹 ~guild withdraw <montant> : Retrait de fonds\n`;
      menu += `│ 🔹 ~guild upgrade : Élever le niveau du bastion\n`;
      menu += `│ 🔹 ~guild daily : Toucher l'allocation de guilde\n`;
      menu += `│ 🔹 ~guild settings : Éditer le profil (Emoji/Bio)\n`;
      menu += `│ 🔹 ~guild logs : Consulter le grand livre des comptes\n`;
      menu += `├───────────────────────────────────────┤\n`;
      menu += `│ 👑 𝐇𝐈𝐑𝐀𝐑𝐂𝐇𝐈𝐄 & 𝐎𝐅𝐅𝐈𝐂𝐈𝐄𝐑𝐒\n`;
      menu += `├───────────────────────────────────────┤\n`;
      menu += `│ 🔹 ~guild promote @user : Graduer un soldat\n`;
      menu += `│ 🔹 ~guild demote @user : Rétrograder un gradé\n`;
      menu += `│ 🔹 ~guild kick @user : Bannir un subordonné\n`;
      menu += `│ 🔹 ~guild disband : Atomiser la guilde (Leader)\n`;
      menu += `├───────────────────────────────────────┤\n`;
      menu += `│ 🏆 ⚔️  𝐂𝐎𝐌𝐏É𝐓𝐈𝐓𝐈𝐎𝐍, 𝐌𝐈𝐒𝐒𝐈𝐎𝐍𝐒 & 𝐙𝐎𝐍𝐄𝐒\n`;
      menu += `├───────────────────────────────────────┤\n`;
      menu += `│ 🔹 ~guild war : Statut du conflit planétaire\n`;
      menu += `│ 🔹 ~guild war join : S'enrôler dans le peloton\n`;
      menu += `│ 🔹 ~guild war attack : Frapper les lignes ennemies\n`;
      menu += `│ 🔹 ~guild territories : Statut de la carte globale\n`;
      menu += `│ 🔹 ~guild territory : Synonyme de carte globale\n`;
      menu += `│ 🔹 ~guild missions : Tableau des quêtes d'alliance\n`;
      menu += `│ 🔹 ~guild achievements : Panthéon des succès acquis\n`;
      menu += `│ 🔹 ~guild top : Classement des factions d'élite\n`;
      menu += `│ 🔹 ~guild chat <msg> : Relayer un ordre crypté\n`;
      menu += `├───────────────────────────────────────┤\n`;
      menu += `│ ⭐ Paliers : Niv. 1 à 50 | Cycle de guerre : 18h\n`;
      menu += `│ 📦 Récolte passive des territoires : Toutes les 12h\n`;
      menu += `╰───────────────────────────────────────╯`;
      return message.reply(menu);
    }

    // Récupération sécurisée du profil monétaire du joueur via usersData de GoatBot
    let senderData = await usersData.get(senderID);
    let senderMoney = senderData.money || 0;

    // ==========================================
    // 🏗️ SOUS-COMMANDE : CREATE (FONDATION D'ALLIANCE)
    // ==========================================
    if (subCommand === "create") {
      if (userLink) return message.reply("❌ | Vous appartenez déjà à une guilde active. Désertez-la avant d'en créer une.");
      
      const gName = args.slice(1).join(" ");
      if (!gName || gName.trim() === "") return message.reply("❌ | Syntaxe erronée. Usage : `guild create <Nom de la guilde>`");
      if (gName.length > 22) return message.reply("❌ | Le nom de votre faction est trop long (Maximum 22 caractères).");

      const creationCost = 5000000; // Coût réglementaire d'investissement
      if (senderMoney < creationCost) return message.reply(`💰 | Trésor insuffisant. Fonder une guilde nécessite un apport initial de **${creationCost.toLocaleString()}$**.`);

      // Déduction financière immédiate
      senderMoney -= creationCost;
      await usersData.set(senderID, { money: senderMoney });

      const gId = generateUID();
      guilds[gId] = {
        id: gId,
        name: gName,
        emoji: "🛡️",
        description: "Aucune biographie rédigée pour le moment.",
        leader: senderID,
        createdAt: new Date().toLocaleDateString('fr-FR'),
        level: 1,
        xp: 0,
        bank: 0,
        trophies: 0,
        wins: 0,
        losses: 0,
        chests: 0,
        territories: [],
        completedMissions: [],
        achievements: [],
        logs: [],
        lastTerritoryCollect: Date.now()
      };

      setUserLink(senderID, { guildId: gId, role: "LEADER" });
      guilds[gId].members = [{ uid: senderID, role: "LEADER" }];
      
      addGuildLog(guilds[gId], `🏗️ Fondation de l'alliance par le Leader.`);
      updateGuildAchievements(guilds[gId]);
      
      writeDB(GUILDS_FILE, guilds);

      let box = UI.boxStart("Alliance Enregistrée") + `\n`;
      box += `${UI.field("Dénomination", gName)}\n`;
      box += `${UI.field("Identifiant Unique", gId)}\n`;
      box += `${UI.field("Investissement", `${creationCost.toLocaleString()}$`)}\n`;
      box += `${UI.line}\n│ 👑 Les armées attendent vos ordres, Commandant !\n` + UI.boxEnd();
      return message.reply(box);
    }

    // ==========================================
    // 📊 SOUS-COMMANDE : INFO (FICHE SIGNALÉTIQUE ET RÉCOLTE)
    // ==========================================
    if (subCommand === "info") {
      let targetGuildId = args[1]?.toUpperCase() || (userLink ? userLink.guildId : null);
      if (!targetGuildId) return message.reply("❌ | Veuillez spécifier l'ID d'une guilde à examiner : `guild info <ID>`.");

      const g = guilds[targetGuildId];
      if (!g) return message.reply("❌ | Aucun dossier militaire ne correspond à cet identifiant de guilde.");

      // Déclenchement automatique et transparent de la récolte de territoires sur consultation d'info
      const harvestReport = executeTerritoryHarvest(g);
      writeDB(GUILDS_FILE, guilds);

      let leaderName = (await usersData.get(g.leader))?.name || "Grand Maître";
      
      let card = UI.boxStart(`Faction : ${g.emoji} ${g.name}`) + `\n`;
      card += `${UI.field("ID Faction", g.id)}\n`;
      card += `${UI.field("Commandant en Chef", leaderName)}\n`;
      card += `${UI.field("Création Impériale", g.createdAt)}\n`;
      card += `${UI.line}\n`;
      card += `${UI.field("Niveau Global", `${g.level} / 50 (XP: ${g.xp.toLocaleString()} / ${(g.level * 6000).toLocaleString()})`)}\n`;
      card += `${UI.field("Contingent Militaire", `${g.members.length} / ${getMaxMembers(g.level)} soldats`)}\n`;
      card += `${UI.field("Coffre de Guilde", `${g.bank.toLocaleString()}$`)}\n`;
      card += `${UI.field("Coffre(s) de Guerre", `${g.chests || 0} unité(s)`)}\n`;
      card += `${UI.field("Trophées de Gloire", `🏆 ${g.trophies.toLocaleString()}`)}\n`;
      card += `${UI.field("Bilan des Campagnes", `✅ ${g.wins} Victoires | ❌ ${g.losses} Défaites`)}\n`;
      
      const territoriesString = g.territories.length === 0 
        ? "Aucune terre sous contrôle" 
        : g.territories.map(tKey => `${TERRITORIES_MAP[tKey].emoji} ${TERRITORIES_MAP[tKey].name}`).join(", ");
      card += `${UI.field("Domaines Soumis", territoriesString)}\n`;
      card += `${UI.line}\n│ 💬 Devise : ${g.description}\n`;
      
      if (harvestReport) {
        card += `${UI.line}\n📦 [RÉCOLTE AUTOMATIQUE] Terres exploitées :\n│ 💰 +${harvestReport.gold.toLocaleString()}$ injectés dans le coffre\n│ ⭐ +${harvestReport.xp} XP de faction générés\n│ 🎁 +${harvestReport.chests} coffre(s) de guerre trouvés\n`;
      }
      card += UI.boxEnd();
      return message.reply(card);
    }

    // ==========================================
    // 📋 SOUS-COMMANDES : LIST & SEARCH (ANNUAIRE ET RECHERCHE)
    // ==========================================
    if (subCommand === "list" || subCommand === "search") {
      let arrayGuilds = Object.values(guilds);
      
      if (subCommand === "search") {
        const query = args.slice(1).join(" ").toLowerCase();
        if (!query) return message.reply("❌ | Veuillez introduire un terme de recherche : `guild search <nom>`");
        arrayGuilds = arrayGuilds.filter(g => g.name.toLowerCase().includes(query));
      }

      if (arrayGuilds.length === 0) return message.reply("🔍 | Aucun registre de guilde ne correspond à votre requête.");

      // Tri automatique basé sur les trophées acquis
      arrayGuilds.sort((a, b) => b.trophies - a.trophies);

      let output = `📋 **[ANNUAIRE DU ROYAUME - TOP ALLIANCES]**\n${UI.line}\n`;
      arrayGuilds.slice(0, 15).forEach((g, index) => {
        output += `${index + 1}. [**${g.id}**] ${g.emoji} **${g.name}** (Niv. ${g.level}) ➔ 👥 ${g.members.length}/${getMaxMembers(g.level)} | 🏆 ${g.trophies.toLocaleString()}\n`;
      });
      return message.reply(output);
    }

    // ==========================================
    // 🚪 SOUS-COMMANDES : JOIN & LEAVE (ADHÉSION ET DÉSERTION)
    // ==========================================
    if (subCommand === "join") {
      if (userLink) return message.reply("❌ | Erreur de déploiement. Vous devez briser votre allégeance actuelle via `guild leave`.");
      
      const targetId = args[1]?.toUpperCase();
      if (!targetId || !guilds[targetId]) return message.reply("❌ | ID manquant ou introuvable. Exemple : `guild join F34B8E`");

      const g = guilds[targetId];
      if (g.members.length >= getMaxMembers(g.level)) return message.reply("❌ | Recrutement clos. Ce bastion a atteint sa capacité maximale de garnison.");

      g.members.push({ uid: senderID, role: "MEMBRE" });
      setUserLink(senderID, { guildId: targetId, role: "MEMBRE" });
      
      addGuildLog(g, `👤 Recrutement : Un nouveau soldat intègre la garnison.`);
      checkAndProgressMission(g, "members_count", g.members.length);
      
      writeDB(GUILDS_FILE, guilds);
      return message.reply(`🚪 | Allégeance jurée ! Vous faites officiellement partie de la guilde **${g.name}** [${g.id}].`);
    }

    if (subCommand === "leave") {
      if (!userLink) return message.reply("❌ | Opération avortée. Vous n'avez prêté aucun serment d'allégeance à une guilde.");
      
      const g = guilds[userLink.guildId];
      if (userLink.role === "LEADER") return message.reply("👑 | Désertion impossible ! Un Leader ne peut pas abandonner ses troupes. Dissolvez la faction (`guild disband`) ou transférez la couronne.");

      g.members = g.members.filter(m => m.uid !== senderID);
      setUserLink(senderID, null);
      
      addGuildLog(g, `🏃 Désertion : Un membre a rompu ses engagements et a fui la faction.`);
      
      writeDB(GUILDS_FILE, guilds);
      return message.reply(`🏃‍♂️ | Vous venez de plier bagage et de quitter définitivement l'alliance **${g.name}**.`);
    }

    // ==========================================
    // 👥 SOUS-COMMANDE : MEMBERS (AFFICHAGE DE L'EFFECTIF)
    // ==========================================
    if (subCommand === "members") {
      if (!userLink) return message.reply("❌ | Vous n'avez pas de guilde.");
      const g = guilds[userLink.guildId];

      let roster = `╭────────────── 👥 ──────────────╮\n│  EFFECTIF MILITAIRE DE ${g.name.toUpperCase()}\n├───────────────────────────────────────\n`;
      for (const m of g.members) {
        let uProfile = await usersData.get(m.uid);
        let name = uProfile?.name || "Soldat Inconnu";
        let rankData = ROLES[m.role];
        roster += `│ ${rankData.emoji} [${rankData.name}] ${name}\n`;
      }
      roster += `╰───────────────────────────────────────╯`;
      return message.reply(roster);
  }

    // ==========================================
    // ✉️ SOUS-COMMANDE : INVITE (ENRÔLEMENT DE SOLDATS)
    // ==========================================
    if (subCommand === "invite") {
      if (!userLink) return message.reply("❌ | Opération impossible. Vous devez posséder une guilde pour inviter des recrues.");
      const g = guilds[userLink.guildId];
      
      // Validation des privilèges de l'appelant
      if (!ROLES[userLink.role].canInvite) {
        return message.reply("❌ | Privilège insuffisant. Seuls les Officiers et les dirigeants peuvent émettre des invitations.");
      }

      if (g.members.length >= getMaxMembers(g.level)) {
        return message.reply("❌ | Votre garnison est saturée. Améliorez le niveau du bastion pour débloquer des places.");
      }

      const targetUid = Object.keys(event.mentions)[0] || args[1];
      if (!targetUid) return message.reply("❌ | Veuillez mentionner le joueur à enrôler : `guild invite @user`");

      if (getUserLink(targetUid)) {
        return message.reply("❌ | Ce guerrier est déjà sous les drapeaux d'une autre faction du royaume.");
      }

      // Enrôlement direct automatique
      g.members.push({ uid: targetUid, role: "MEMBRE" });
      setUserLink(targetUid, { guildId: g.id, role: "MEMBRE" });
      
      addGuildLog(g, `🛡️ Recrutement : Un nouveau combattant a été invité et intégré aux effectifs.`);
      checkAndProgressMission(g, "members_count", g.members.length);
      
      writeDB(GUILDS_FILE, guilds);
      return message.reply(`🎉 | Recrutement validé ! Le joueur a rejoint les rangs de **${g.name}**.`);
    }

    // ==========================================
    // ❌ SOUS-COMMANDE : KICK (EXPULSION DISCIPLINAIRE)
    // ==========================================
    if (subCommand === "kick") {
      if (!userLink) return message.reply("❌ | Vous n'avez pas de guilde.");
      const g = guilds[userLink.guildId];

      if (!ROLES[userLink.role].canKick) {
        return message.reply("❌ | Action interdite. Votre grade ne vous donne pas le droit d'exclure des membres.");
      }

      const targetUid = Object.keys(event.mentions)[0] || args[1];
      if (!targetUid) return message.reply("❌ | Veuillez mentionner le subordonné à chasser : `guild kick @user`");

      if (targetUid === senderID) return message.reply("❌ | Vous ne pouvez pas vous exclure vous-même. Utilisez `guild leave`.");

      const targetMember = g.members.find(m => m.uid === targetUid);
      if (!targetMember) return message.reply("❌ | Ce joueur ne figure pas sur le registre de votre contingent.");

      // Sécurité hiérarchique : On ne peut bannir qu'un rang inférieur au sien
      if (ROLES[userLink.role].rank <= ROLES[targetMember.role].rank && userLink.role !== "LEADER") {
        return message.reply("❌ | Violation protocolaire. Vous ne pouvez pas expulser un frère d'armes de grade équivalent ou supérieur.");
      }

      // Destitution logistique
      g.members = g.members.filter(m => m.uid !== targetUid);
      setUserLink(targetUid, null);
      
      addGuildLog(g, `🚪 Expulsion : Un membre a été banni de la garnison de force.`);
      checkAndProgressMission(g, "members_count", g.members.length);
      
      writeDB(GUILDS_FILE, guilds);
      return message.reply("🛡️ | Sanction appliquée. Le joueur a été éjecté de la guilde.");
    }

    // ==========================================
    // ⬆️ SOUS-COMMANDES : PROMOTE & DEMOTE (GESTION DES RANGS)
    // ==========================================
    if (subCommand === "promote" || subCommand === "demote") {
      if (!userLink) return message.reply("❌ | Vous n'avez pas de guilde.");
      const g = guilds[userLink.guildId];

      if (!ROLES[userLink.role].canPromote) {
        return message.reply("❌ | Gestion des grades bloquée. Votre rang actuel ne vous permet pas de modifier la hiérarchie.");
      }

      const targetUid = Object.keys(event.mentions)[0] || args[1];
      if (!targetUid) return message.reply(`❌ | Veuillez mentionner la cible : \`guild ${subCommand} @user\``);

      const targetMember = g.members.find(m => m.uid === targetUid);
      if (!targetMember) return message.reply("❌ | Ce joueur n'appartient pas à votre bastion.");

      if (targetUid === senderID) return message.reply("❌ | Vous ne pouvez pas altérer vos propres privilèges militaires.");

      if (subCommand === "promote") {
        if (targetMember.role === "MEMBRE") {
          targetMember.role = "OFFICIER";
          setUserLink(targetUid, { guildId: g.id, role: "OFFICIER" });
          addGuildLog(g, `📈 Promotion : Un membre s'élève au rang d'Officier.`);
          writeDB(GUILDS_FILE, guilds);
          return message.reply("🛡️ | Élévation approuvée ! Le soldat est désormais **Officier**.");
        } 
        else if (targetMember.role === "OFFICIER") {
          if (userLink.role !== "LEADER") return message.reply("❌ | Seul le Leader en titre peut nommer un Co-Leader.");
          targetMember.role = "CO_LEADER";
          setUserLink(targetUid, { guildId: g.id, role: "CO_LEADER" });
          addGuildLog(g, `⭐ Haute Promotion : Un Officier est élevé au rang de Co-Leader.`);
          writeDB(GUILDS_FILE, guilds);
          return message.reply("⭐ | Promotion Suprême ! L'Officier devient **Co-Leader**.");
        } 
        else {
          return message.reply("❌ | Ce gradé a déjà atteint le plafond hiérarchique accessible par promotion standard.");
        }
      } 
      
      if (subCommand === "demote") {
        if (ROLES[userLink.role].rank <= ROLES[targetMember.role].rank && userLink.role !== "LEADER") {
          return message.reply("❌ | Opération impossible. Vous ne surpassez pas la cible dans la chaîne de commandement.");
        }

        if (targetMember.role === "CO_LEADER") {
          targetMember.role = "OFFICIER";
          setUserLink(targetUid, { guildId: g.id, role: "OFFICIER" });
          addGuildLog(g, `📉 Rétrogradation : Un Co-Leader a été destitué au rang d'Officier.`);
          writeDB(GUILDS_FILE, guilds);
          return message.reply("📉 | Sanction hiérarchique. Le Co-Leader est rétrogradé au rang d'**Officier**.");
        } 
        else if (targetMember.role === "OFFICIER") {
          targetMember.role = "MEMBRE";
          setUserLink(targetUid, { guildId: g.id, role: "MEMBRE" });
          addGuildLog(g, `📉 Rétrogradation : Un Officier a été destitué au rang de simple Membre.`);
          writeDB(GUILDS_FILE, guilds);
          return message.reply("📉 | Sanction hiérarchique. L'Officier est déchu et redevient simple **Membre**.");
        } 
        else {
          return message.reply("❌ | Ce membre occupe déjà l'échelon le plus bas de la hiérarchie.");
        }
      }
    }

    // ==========================================
    // 🎨 SOUS-COMMANDE : SETTINGS (ÉDITION DU PROFIL)
    // ==========================================
    if (subCommand === "settings") {
      if (!userLink) return message.reply("❌ | Vous n'avez pas de guilde.");
      const g = guilds[userLink.guildId];

      if (!ROLES[userLink.role].canSettings) {
        return message.reply("❌ | Droits administratifs insuffisants. Seul le Leader détient les clés de configuration.");
      }

      const mode = args[1]?.toLowerCase();
      const payload = args.slice(2).join(" ");

      if (mode === "emoji" || mode === "logo") {
        if (!payload || payload.length > 4) return message.reply("❌ | Indiquez un seul emoji valide pour illustrer la faction.");
        g.emoji = payload;
        addGuildLog(g, `🎨 Édition : L'armoirie visuelle de la guilde a été mise à jour.`);
        writeDB(GUILDS_FILE, guilds);
        return message.reply(`✅ | Emblème modifié avec succès : [${payload}]`);
      } 
      else if (mode === "desc" || mode === "description" || mode === "bio") {
        if (!payload || payload.length > 150) return message.reply("❌ | La biographie doit comporter entre 1 et 150 caractères maximum.");
        g.description = payload;
        addGuildLog(g, `🎨 Édition : La description officielle de la guilde a été réécrite.`);
        writeDB(GUILDS_FILE, guilds);
        return message.reply("✅ | Manifeste et description de guilde mis à jour !");
      } 
      else {
        return message.reply("ℹ️ | Guide technique : \n• `guild settings emoji <Emoji>`\n• `guild settings desc <Votre texte de présentation>`");
      }
    }

    // ==========================================
    // 💥 SOUS-COMMANDE : DISBAND (DISSOLUTION FINALE)
    // ==========================================
    if (subCommand === "disband") {
      if (!userLink) return message.reply("❌ | Vous n'avez pas de guilde.");
      const g = guilds[userLink.guildId];

      if (userLink.role !== "LEADER") {
        return message.reply("❌ | Crime de lèse-majesté ! Seul le Leader Suprême de la faction détient l'autorité de dissolution.");
      }

      // Purge absolue de la totalité des liaisons joueurs affiliées à cette guilde
      g.members.forEach(member => {
        setUserLink(member.uid, null);
      });

      // Annihilation de l'entrée dans le registre central
      delete guilds[g.id];
      writeDB(GUILDS_FILE, guilds);

      return message.reply(`💥 | **ANNIHILATION COMPLETE :** La guilde **${g.name}** a été rayée de la carte. Tous ses soldats sont redevenus des mercenaires sans attache.`);
        }

    // ==========================================
    // 💰 SOUS-COMMANDES : DONATE & WITHDRAW (FINANCES COMMUNES)
    // ==========================================
    if (subCommand === "donate" || subCommand === "withdraw") {
      if (!userLink) return message.reply("❌ | Opération financière avortée. Vous devez posséder une guilde.");
      const g = guilds[userLink.guildId];
      
      let amountInput = (args[1] === "all" && subCommand === "donate") ? senderMoney : parseInt(args[1]);

      if (isNaN(amountInput) || amountInput <= 0) {
        return message.reply(`❌ | Montant invalide. Exemple : \`guild ${subCommand} 2500000\``);
      }

      if (subCommand === "donate") {
        if (senderMoney < amountInput) {
          return message.reply("💰 | Votre bourse personnelle est insuffisante pour effectuer ce versement.");
        }

        // Mutation des capitaux vers la banque
        senderMoney -= amountInput;
        g.bank += amountInput;
        
        await usersData.set(senderID, { money: senderMoney });
        addGuildLog(g, `💰 Dépôt : Un membre a versé +${amountInput.toLocaleString()}$ dans la trésorerie.`);
        
        checkAndProgressMission(g, "donate_total", g.bank);
        updateGuildAchievements(g);
        writeDB(GUILDS_FILE, guilds);

        return message.reply(`✅ | Contribution validée ! **+${amountInput.toLocaleString()}$** injectés dans la banque commune.`);
      } 
      
      if (subCommand === "withdraw") {
        if (!ROLES[userLink.role].canWithdraw) {
          return message.reply("❌ | Accès refusé. Seuls le Leader et les Co-Leaders disposent de la signature bancaire.");
        }

        if (g.bank < amountInput) {
          return message.reply("❌ | Solde bancaire insuffisant. Le coffre de la guilde ne contient pas cette somme.");
        }

        // Mutation des capitaux vers l'officier
        g.bank -= amountInput;
        senderMoney += amountInput;
        
        await usersData.set(senderID, { money: senderMoney });
        addGuildLog(g, `💰 Retrait : Un haut gradé a retiré -${amountInput.toLocaleString()}$ de la trésorerie.`);
        
        writeDB(GUILDS_FILE, guilds);
        return message.reply(`🏦 | Retrait approuvé ! **+${amountInput.toLocaleString()}$** transférés sur votre compte personnel.`);
      }
    }

    // ==========================================
    // ⬆️ SOUS-COMMANDE : UPGRADE (ÉVOLUTION DU BASTION)
    // ==========================================
    if (subCommand === "upgrade") {
      if (!userLink) return message.reply("❌ | Vous n'avez pas de guilde.");
      const g = guilds[userLink.guildId];

      if (userLink.role !== "LEADER" && userLink.role !== "CO_LEADER") {
        return message.reply("❌ | Ordre d'architecture refusé. Seul le haut commandement peut valider des extensions.");
      }

      if (g.level >= 50) return message.reply("👑 | Splendeur maximale ! Votre guilde a déjà atteint le Niveau 50.");

      const directCost = getUpgradeCost(g.level);
      if (g.bank < directCost) {
        return message.reply(`❌ | Fonds de guilde insuffisants. La mise à niveau nécessite **${directCost.toLocaleString()}$** présents dans le coffre.`);
      }

      // Consommation des ressources de banque et up de niveau
      g.bank -= directCost;
      g.level += 1;
      
      addGuildLog(g, `🏰 Évolution : Les structures ont été modernisées. Faction Niveau ${g.level}.`);
      updateGuildAchievements(g);
      writeDB(GUILDS_FILE, guilds);

      let upText = UI.boxStart(`Bastion Évolué — Niveau ${g.level}`) + `\n`;
      upText += `│ 👥 Capacité max : ${getMaxMembers(g.level)} soldats\n`;
      upText += `│ 💰 Rendement économique : +${Math.floor(g.level * 4)}%\n`;
      upText += `│ ⭐ Multiplicateur d'XP : +${Math.floor(g.level * 5)}%\n`;
      upText += `│ ⚔️ Bonus offensif brut : +${g.level * 15} DMG\n`;
      upText += UI.boxEnd();
      return message.reply(upText);
    }

    // ==========================================
    // 📜 SOUS-COMMANDE : LOGS (HISTORIQUE DES ACTIONS)
    // ==========================================
    if (subCommand === "logs") {
      if (!userLink) return message.reply("❌ | Vous n'avez pas de guilde.");
      const g = guilds[userLink.guildId];

      if (g.logs.length === 0) return message.reply("📋 | Le grand livre de sécurité est vierge pour le moment.");

      let ledger = `📜 **[GRAND LIVRE DES COMPTES — ${g.name.toUpperCase()}]**\n${UI.line}\n`;
      // Inversion pour afficher les actions les plus récentes au sommet
      g.logs.slice(-15).reverse().forEach(entry => {
        ledger += `• [${entry.time}] ${entry.action}\n`;
      });
      return message.reply(ledger);
    }

    // ==========================================
    // 🎁 SOUS-COMMANDE : DAILY (RATION QUOTIDIENNE MILITAIRE)
    // ==========================================
    if (subCommand === "daily") {
      if (!userLink) return message.reply("❌ | Ravitaillement impossible. Vous devez posséder une alliance.");
      const g = guilds[userLink.guildId];

      // Initialisation de la mémoire cache volatile pour l'horloge journalière
      if (!global.guildDailyCooldown) global.guildDailyCooldown = {};
      
      const lastClaim = global.guildDailyCooldown[senderID];
      const cycleLength = 24 * 60 * 60 * 1000; // 24 Heures règlementaires

      if (lastClaim && (Date.now() - lastClaim < cycleLength)) {
        const remainingMs = cycleLength - (Date.now() - lastClaim);
        const remHours = Math.floor(remainingMs / (60 * 60 * 1000));
        const remMins = Math.floor((remainingMs % (60 * 60 * 1000)) / (60 * 1000));
        return message.reply(`⏳ | Allocation indisponible. Vos rations ont été distribuées. Revenez dans **${remHours}h ${remMins}min**.`);
      }

      // Équation mathématique d'allocation indexée sur le niveau de la guilde
      const basePay = 100000;
      const finalAllocation = Math.floor(basePay * getLevelBonus(g.level).moneyMultiplier);

      senderMoney += finalAllocation;
      global.guildDailyCooldown[senderID] = Date.now();
      
      await usersData.set(senderID, { money: senderMoney });
      return message.reply(`🎁 | Intendance : Allocation quotidienne récupérée ! Vos bonus de faction vous rapportent **+${finalAllocation.toLocaleString()}$**.`);
    }
