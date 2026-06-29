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

// --- MOTEUR DE MISSIONS AUTOMATIQUES DE GUILDE ---
const GUILD_MISSIONS = {
  m1: { id: "m1", text: "Déposer un total de 10M$ dans le Coffre", target: 10000000, type: "donate_total", moneyReward: 500000, xpReward: 1500 },
  m2: { id: "m2", text: "Atteindre un cheptel de 25 membres actifs", target: 25, type: "members_count", moneyReward: 300000, xpReward: 1000 },
  m3: { id: "m3", text: "Remporter 15 Victoires en Guild War", target: 15, type: "war_wins", moneyReward: 1200000, xpReward: 4000 },
  m4: { id: "m4", text: "Conquérir et contrôler 3 Territoires", target: 3, type: "territories_count", moneyReward: 800000, xpReward: 2500 }
};

function checkAndProgressMission(guild, type, currentAmount) {
  for (const [mId, mission] of Object.entries(GUILD_MISSIONS)) {
    if (mission.type === type && !guild.completedMissions.includes(mId)) {
      if (currentAmount >= mission.target) {
        guild.completedMissions.push(mId);
        guild.bank += mission.moneyReward;
        guild.xp += mission.xpReward;
        logGuildAction(guild, `🎯 Mission accomplie : "${mission.text}". +${mission.moneyReward}$, +${mission.xpReward} XP.`);
      }
    }
  }
}

// --- SYSTÈME AUTOMATISÉ DES SUCCÈS (ACHIEVEMENTS) ---
const GUILD_ACHIEVEMENTS = {
  a_first: { id: "a_first", name: "🥉 Première Guilde", desc: "Fonder une guilde officielle", check: (g) => true },
  a_lvl10: { id: "a_lvl10", name: "🥈 Niveau 10", desc: "Élever la guilde au Niveau 10", check: (g) => g.level >= 10 },
  a_lvl25: { id: "a_lvl25", name: "🥇 Niveau 25", desc: "Élever la guilde au Niveau 25", check: (g) => g.level >= 25 },
  a_lvl50: { id: "a_lvl50", name: "👑 Niveau 50", desc: "Atteindre le Niveau Maximal de Guilde (50)", check: (g) => g.level >= 50 },
  a_wins:   { id: "a_wins",   name: "⚔️ Destructeur", desc: "Cumuler 100 victoires de guerre", check: (g) => g.wins >= 100 },
  a_bank:   { id: "a_bank",   name: "💰 Fortune Commune", desc: "Accumuler 100M$ dans le coffre", check: (g) => g.bank >= 100000000 },
  a_zones:  { id: "a_zones",  name: "🌍 Empire Mondial", desc: "Contrôler simultanément 5 territoires", check: (g) => g.territories.length >= 5 }
};

function updateGuildAchievements(guild) {
  for (const [aId, ach] of Object.entries(GUILD_ACHIEVEMENTS)) {
    if (!guild.achievements.includes(aId)) {
      if (ach.check(guild)) {
        guild.achievements.push(aId);
        guild.xp += 2000; // Bonus d'XP fixe pour le déblocage d'un exploit
        logGuildAction(guild, `🏆 Succès Débloqué : [${ach.name}] — ${ach.desc}.`);
      }
    }
  }
}

// ==========================================
// 🛡️ CONTROLEUR D'ENTRÉE GOATBOT V2 (DEBUT)
// ==========================================
module.exports = {
  config: {
    name: "guild",
    version: "2.0.0",
    author: "Gemini Engine RPG",
    countDown: 3,
    role: 0,
    description: "Système de guildes et guerres de territoires MMORPG.",
    category: "economy",
    guide: { fr: "{p}guild [subcommand] (arguments)", en: "{p}guild [subcommand] (arguments)" }
  },

  onStart: async function ({ api, event, args, usersData, message }) {
    const { senderID } = event;
    
    // Cycle Engine : Vérification automatique de l'état de la guerre en cours
    checkAndManageWarCycle();

    const guilds = readJSON(GUILDS_FILE);
    const userLink = getUserGuildLink(senderID);
    const subCommand = args[0]?.toLowerCase();

    // ==========================================
    // 📜 SOU-COMMANDE : CREATE <NOM>
    // ==========================================
    if (subCommand === "create") {
      if (userLink) return message.reply("❌ | Vous appartenez déjà à une faction. Quittez-la d'abord via `guild leave`.");
      
      const guildName = args.slice(1).join(" ");
      if (!guildName || guildName.length > 22) return message.reply("❌ | Indiquez un nom de guilde valide (Max 22 caractères).");

      let uData = await usersData.get(senderID);
      let userMoney = uData.money || 0;
      const creationCost = 2500000; // Coût standard de fondation : 2.5M$

      if (userMoney < creationCost) return message.reply(`💰 | Fonds insuffisants pour fonder une alliance. Coût requis : **${creationCost}$**.`);

      // Déduction financière directe de l'argent personnel
      userMoney -= creationCost;
      await usersData.set(senderID, { money: userMoney });

      const newId = generateGuildID();
      guilds[newId] = {
        id: newId,
        name: guildName,
        emoji: "🛡️",
        description: "Aucune description éditée.",
        leader: senderID,
        createdAt: new Date().toLocaleDateString('fr-FR'),
        level: 1,
        xp: 0,
        bank: 0,
        trophies: 0,
        wins: 0,
        losses: 0,
        members: [{ uid: senderID, role: "LEADER" }],
        territories: [],
        completedMissions: [],
        achievements: [],
        logs: [],
        lastTerritoryCollect: Date.now()
      };

      // Liaison du joueur à sa nouvelle faction
      setUserGuildLink(senderID, { guildId: newId, role: "LEADER" });
      
      // Déclenchement du premier succès automatique
      updateGuildAchievements(guilds[newId]);
      writeJSON(GUILDS_FILE, guilds);

      let res = UI.boxStart("Alliance Fondée");
      res += `\n${UI.field("Nom", guildName)}\n${UI.field("ID Unique", newId)}\n${UI.field("Coût payé", "2,500,000$")}\n${UI.line}\n│ 👑 Bienvenue dans votre nouveau quartier général !\n${UI.boxEnd()}`;
      return message.reply(res);
    }

    // ==========================================
    // 📊 SOUS-COMMANDE : INFO
    // ==========================================
    if (!subCommand || subCommand === "info") {
      let targetId = args[1]?.toUpperCase() || (userLink ? userLink.guildId : null);
      if (!targetId) return message.reply("❌ | Vous ne faites partie d'aucune guilde. Spécifiez l'ID d'une alliance à inspecter : `guild info <ID>`.");

      const g = guilds[targetId];
      if (!g) return message.reply("❌ | Identifiant de guilde introuvable.");

      // Traitement de la récolte territoriale passive lors de la consultation d'info
      const passiveHarvest = processTerritoryEarnings(g);
      writeJSON(GUILDS_FILE, guilds);

      let leaderName = (await usersData.get(g.leader))?.name || "Grand Maître";
      let txt = UI.boxStart(`Faction : ${g.emoji} ${g.name}`);
      txt += `\n${UI.field("ID Faction", g.id)}\n${UI.field("Fondateur / Leader", leaderName)}\n${UI.field("Création", g.createdAt)}`;
      txt += `\n${UI.line}\n${UI.field("Rang / Niveau", `${g.level} / 50 (XP: ${g.xp}/${g.level * 4500})`)}`;
      txt += `\n${UI.field("Membres", `${g.members.length} / ${getMaxMembers(g.level)}`)}`;
      txt += `\n${UI.field("Trésorerie", `${g.bank.toLocaleString()}$`)}\n${UI.field("Trophées", `🏆 ${g.trophies}`)}`;
      txt += `\n${UI.field("Palmarès Guerre", `✅ ${g.wins} Victoires | ❌ ${g.losses} Défaites`)}`;
      txt += `\n${UI.field("Territoires occupés", g.territories.length === 0 ? "Aucun" : g.territories.map(t => TERRITORIES_DB[t]?.emoji).join(" "))}`;
      txt += `\n${UI.line}\n│ 💬 Bio : ${g.description}`;
      if (passiveHarvest) txt += `\n${UI.line}\n📦 [RÉCOLTE] Territoires exploités : +${passiveHarvest.money}$ accumulés !`;
      txt += `\n${UI.boxEnd()}`;

      return message.reply(txt);
    }

    // ==========================================
    // 👥 SOUS-COMMANDE : LIST / SEARCH
    // ==========================================
    if (subCommand === "list" || subCommand === "search") {
      const searchName = args.slice(1).join(" ").toLowerCase();
      let listGuilds = Object.values(guilds);

      if (searchName) {
        listGuilds = listGuilds.filter(g => g.name.toLowerCase().includes(searchName));
      }

      if (listGuilds.length === 0) return message.reply("🔍 | Aucune guilde ne correspond aux critères.");

      let listText = `📋 **[ANNUAIRE ET RECHERCHE DES GUILDES]**\n${UI.line}\n`;
      listGuilds.slice(0, 15).forEach(g => {
        listText += `• [${g.id}] ${g.emoji} **${g.name}** (Niv. ${g.level}) — 👥 ${g.members.length}/${getMaxMembers(g.level)} | 🏆 ${g.trophies}\n`;
      });
      return message.reply(listText);
    }

    // ==========================================
    // 🚪 SOUS-COMMANDE : JOIN <ID>
    // ==========================================
    if (subCommand === "join") {
      if (userLink) return message.reply("❌ | Vous devez quitter votre alliance actuelle avant de postuler ailleurs.");

      const targetId = args[1]?.toUpperCase();
      if (!targetId || !guilds[targetId]) return message.reply("❌ | ID de guilde inexistant.");

      const g = guilds[targetId];
      if (g.members.length >= getMaxMembers(g.level)) return message.reply("❌ | Ce bastion a atteint sa capacité de recrutement maximale.");

      // Intégration par défaut au grade de MEMBRE (Rang 1)
      g.members.push({ uid: senderID, role: "MEMBRE" });
      setUserGuildLink(senderID, { guildId: targetId, role: "MEMBRE" });

      logGuildAction(g, `Recrutement : Un nouveau combattant rejoint nos rangs.`);
      
      // Mise à jour de la mission de recrutement
      checkAndProgressMission(g, "members_count", g.members.length);
      writeJSON(GUILDS_FILE, guilds);

      return message.reply(`🚪 | **RECRUTEMENT :** Vous franchissez les portes fortifiées de la guilde **${g.name}** [${g.id}].`);
    }

    // ==========================================
    // 🚪 SOUS-COMMANDE : LEAVE
    // ==========================================
    if (subCommand === "leave") {
      if (!userLink) return message.reply("❌ | Vous n'avez aucune guilde à abandonner.");
      const g = guilds[userLink.guildId];
      if (!g) return message.reply("❌ | Faction introuvable.");

      if (userLink.role === "LEADER") {
        return message.reply("👑 | Vous êtes le Leader suprême. Vous ne pouvez pas fuir vos hommes. Supprimez la guilde via `guild disband` ou transmettez la couronne.");
      }
      
      // Retrait du tableau des membres
      g.members = g.members.filter(m => m.uid !== senderID);
      setUserGuildLink(senderID, null);

      logGuildAction(g, `Départ : Un membre s'est désengagé de la guilde.`);
      writeJSON(GUILDS_FILE, guilds);

      return message.reply(`🏃‍♂️ | Vous rompez votre serment et quittez l'alliance **${g.name}**.`);
        }
    
    // ==========================================
    // ⚔️ SOUS-COMMANDE : KICK / PROMOTE / DEMOTE
    // ==========================================
    if (subCommand === "kick" || subCommand === "promote" || subCommand === "demote") {
      if (!userLink) return message.reply("❌ | Vous n'avez pas de guilde.");
      const g = guilds[userLink.guildId];
      
      // Vérification des droits hiérarchiques minimums (Officier = Rang 2)
      if (ROLES[userLink.role].rank < 2) return message.reply("❌ | Vos privilèges au sein de la faction sont insuffisants.");

      const targetUid = Object.keys(event.mentions)[0] || args[1];
      if (!targetUid) return message.reply("❌ | Veuillez mentionner (@) le joueur ciblé.");

      const targetMember = g.members.find(m => m.uid === targetUid);
      if (!targetMember) return message.reply("❌ | Ce joueur ne fait pas partie de votre garnison.");

      if (ROLES[userLink.role].rank <= ROLES[targetMember.role].rank && userLink.role !== "LEADER") {
        return message.reply("❌ | Vous ne pouvez pas altérer le statut d'un membre de rang égal ou supérieur au vôtre.");
      }

      if (subCommand === "kick") {
        g.members = g.members.filter(m => m.uid !== targetUid);
        setUserGuildLink(targetUid, null);
        logGuildAction(g, `Exclusion : Le joueur a été expulsé par un officier.`);
        message.reply("🛡️ | Le membre a été définitivement radié de la guilde.");
      } 
      else if (subCommand === "promote") {
        if (targetMember.role === "MEMBRE") {
          targetMember.role = "OFFICIER";
          setUserGuildLink(targetUid, { guildId: g.id, role: "OFFICIER" });
          logGuildAction(g, `Promotion : Membre élevé au rang d'Officier.`);
          message.reply("⭐ | Le membre a été promu au rang d'Officier !");
        } else if (targetMember.role === "OFFICIER" && userLink.role === "LEADER") {
          targetMember.role = "CO_LEADER";
          setUserGuildLink(targetUid, { guildId: g.id, role: "CO_LEADER" });
          logGuildAction(g, `Promotion : Officier élevé au rang de Co-Leader.`);
          message.reply("👑 | L'Officier a été élevé au rang de Co-Leader !");
        } else {
          message.reply("❌ | Impossible de promouvoir davantage ce membre.");
        }
      } 
      else if (subCommand === "demote") {
        if (targetMember.role === "CO_LEADER" && userLink.role === "LEADER") {
          targetMember.role = "OFFICIER";
          setUserGuildLink(targetUid, { guildId: g.id, role: "OFFICIER" });
          logGuildAction(g, `Rétrogradation : Co-Leader destitué au rang d'Officier.`);
          message.reply("📉 | Le Co-Leader a été rétrogradé au rang d'Officier.");
        } else if (targetMember.role === "OFFICIER") {
          targetMember.role = "MEMBRE";
          setUserGuildLink(targetUid, { guildId: g.id, role: "MEMBRE" });
          logGuildAction(g, `Rétrogradation : Officier destitué au rang de Membre.`);
          message.reply("📉 | L'Officier a été rétrogradé au rang de simple Membre.");
        } else {
          message.reply("❌ | Impossible de rétrograder davantage ce membre.");
        }
      }

      writeJSON(GUILDS_FILE, guilds);
      return;
    }

    // ==========================================
    // 💰 SOUS-COMMANDE : DONATE / WITHDRAW
    // ==========================================
    if (subCommand === "donate" || subCommand === "withdraw") {
      if (!userLink) return message.reply("❌ | Vous devez appartenir à une guilde pour manipuler la trésorerie.");
      const g = guilds[userLink.guildId];

      let uData = await usersData.get(senderID);
      let userMoney = uData.money || 0;

      let amountInput = args[1];
      if (amountInput === "all" && subCommand === "donate") {
        amountInput = userMoney;
      } else {
        amountInput = parseInt(amountInput);
      }

      if (isNaN(amountInput) || amountInput <= 0) return message.reply("❌ | Veuillez indiquer un montant numérique valide supérieur à 0.");

      if (subCommand === "donate") {
        if (userMoney < amountInput) return message.reply("💰 | Vous ne possédez pas cette somme sur votre compte personnel.");
        
        userMoney -= amountInput;
        g.bank += amountInput;

        logGuildAction(g, `Dépôt : Un membre a injecté +${amountInput.toLocaleString()}$ dans le coffre.`);
        
        // Progression automatique de la mission correspondante
        checkAndProgressMission(g, "donate_total", g.bank);
        updateGuildAchievements(g);

        await usersData.set(senderID, { money: userMoney });
        writeJSON(GUILDS_FILE, guilds);

        return message.reply(`💰 | **TRÉSORERIE :** Vous déposez **${amountInput.toLocaleString()}$** dans le coffre de la guilde.`);
      }

      if (subCommand === "withdraw") {
        if (ROLES[userLink.role].rank < 3) return message.reply("❌ | Seuls le Leader et les Co-Leaders peuvent prélever de l'or du coffre.");
        if (g.bank < amountInput) return message.reply("❌ | Le solde du coffre de guilde est insuffisant.");

        g.bank -= amountInput;
        userMoney += amountInput;

        logGuildAction(g, `Retrait : Un haut gradé a prélevé -${amountInput.toLocaleString()}$.`);

        await usersData.set(senderID, { money: userMoney });
        writeJSON(GUILDS_FILE, guilds);

        return message.reply(`💰 | **TRÉSORERIE :** Vous retirez **${amountInput.toLocaleString()}$** des réserves de la guilde.`);
      }
    }

    // ==========================================
    // ⬆️ SOUS-COMMANDE : UPGRADE
    // ==========================================
    if (subCommand === "upgrade") {
      if (!userLink) return message.reply("❌ | Pas de guilde détectée.");
      const g = guilds[userLink.guildId];

      if (ROLES[userLink.role].rank < 3) return message.reply("❌ | Seuls les dirigeants peuvent lancer des projets d'extension.");
      if (g.level >= 50) return message.reply("👑 | Votre bastion est déjà au Niveau Maximal (Niv. 50).");

      const cost = getUpgradeCost(g.level);
      if (g.bank < cost) return message.reply(`❌ | Fonds de guilde insuffisants dans le coffre. L'amélioration au Niveau ${g.level + 1} réclame **${cost.toLocaleString()}$**.`);

      g.bank -= cost;
      g.level += 1;

      logGuildAction(g, `Amélioration : Bastion étendu au Niveau ${g.level}.`);
      updateGuildAchievements(g);
      writeJSON(GUILDS_FILE, guilds);

      return message.reply(`🏰 | **PROGRES :** Votre guilde passe au **Niveau ${g.level}** ! Capacité maximale étendue à **${getMaxMembers(g.level)}** membres.`);
    }

    // ==========================================
    // 💬 SOUS-COMMANDE : CHAT <MESSAGE>
    // ==========================================
    if (subCommand === "chat") {
      if (!userLink) return message.reply("❌ | Le canal de discussion crypté requiert une alliance active.");
      const g = guilds[userLink.guildId];

      const chatText = args.slice(1).join(" ");
      if (!chatText) return message.reply("❌ | Contenu du message vide.");

      let senderName = uData.name || "Combattant";
      let formatMsg = `💬 **[CANAL DE GUILDE — ${g.name.toUpperCase()}]**\n🔹 *${ROLES[userLink.role].emoji} ${senderName}* : ${chatText}`;

      // Envoi du message crypté uniquement aux membres en ligne de la guilde
      g.members.forEach(m => {
        if (m.uid !== senderID) {
          api.sendMessage(formatMsg, m.uid);
        }
      });

      return message.reply("🛰️ | Fréquence de guilde synchronisée, message transmis aux membres.");
    }

    // ==========================================
    // ⚔️ SOUS-COMMANDE PRINCIPALE : WAR
    // ==========================================
    if (subCommand === "war") {
      const currentWar = readJSON(WAR_FILE);
      const action = args[1]?.toLowerCase();

      if (!action) {
        // Menu récapitulatif de la guerre en cours
        if (!currentWar.phase || currentWar.phase === "ended") {
          return message.reply("💤 | Aucun conflit majeur n'est déclaré sur le continent en ce moment. Revenez plus tard.");
        }

        const gA = guilds[currentWar.guildA];
        const gB = guilds[currentWar.guildB];
        if (!gA || !gB) return message.reply("❌ | Erreur d'indexation des données de guerre.");

        const timeLeft = Math.max(0, Math.floor((currentWar.phaseEndTime - Date.now()) / 1000));
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;

        let warStatusText = UI.boxStart(`Alerte Conflit — Phase : ${currentWar.phase.toUpperCase()}`);
        warStatusText += `\n🔴 **Alliance A :** ${gA.name} [ID: ${gA.id}] — Inscrits : ${currentWar.participantsA.length}`;
        warStatusText += `\n🔵 **Alliance B :** ${gB.name} [ID: ${gB.id}] — Inscrits : ${currentWar.participantsB.length}`;
        warStatusText += `\n${UI.line}\n📊 **Score des Dommages :**`;
        warStatusText += `\n├─ ${gA.name} : ${currentWar.scores[gA.id]} PTS`;
        warStatusText += `\n└─ ${gB.name} : ${currentWar.scores[gB.id]} PTS`;
        warStatusText += `\n${UI.line}\n⏳ Temps restant avant transition : **${minutes}m ${seconds}s**`;
        if (currentWar.phase === "registration") warStatusText += `\n👉 _Tapez \`guild war join\` pour entrer dans les effectifs._`;
        if (currentWar.phase === "battle") warStatusText += `\n👉 _Tapez \`guild war attack\` pour charger les lignes ennemies !_`;
        warStatusText += `\n${UI.boxEnd()}`;

        return message.reply(warStatusText);
      }

      // Action: Rejoindre la liste des combattants
      if (action === "join") {
        if (!userLink) return message.reply("❌ | Vous devez appartenir à une guilde pour participer.");
        if (currentWar.phase !== "registration") return message.reply("❌ | La phase de recrutement et d'inscription à la guerre est close.");

        if (userLink.guildId === currentWar.guildA) {
          if (currentWar.participantsA.includes(senderID)) return message.reply("🛡️ | Votre nom figure déjà sur le tableau des combattants de l'Alliance A.");
          currentWar.participantsA.push(senderID);
        } else if (userLink.guildId === currentWar.guildB) {
          if (currentWar.participantsB.includes(senderID)) return message.reply("🛡️ | Votre nom figure déjà sur le tableau des combattants de l'Alliance B.");
          currentWar.participantsB.push(senderID);
        } else {
          return message.reply("🦅 | Votre guilde n'est pas mobilisée pour ce conflit. Regardez le combat depuis les gradins !");
        }

        writeJSON(WAR_FILE, currentWar);
        return message.reply("⚔️ | **ENRÔLEMENT REUSSI :** Vous intégrez l'armée de votre guilde pour la prochaine bataille !");
      }

      // Action: Assaut en phase active de combat
      if (action === "attack") {
        if (!userLink) return message.reply("❌ | Non enregistré.");
        if (currentWar.phase !== "battle") return message.reply("❌ | Le signal de charge n'a pas été donné ou le combat est terminé.");

        let isA = currentWar.participantsA.includes(senderID);
        let isB = currentWar.participantsB.includes(senderID);

        if (!isA && !isB) return message.reply("❌ | Vous n'étiez pas enregistré dans la phase d'inscription réglementaire de 30 minutes.");

        const myGuildId = userLink.guildId;
        const myGuild = guilds[myGuildId];
        
        // Algorithme RPG de force : Dégâts basés sur le niveau du joueur + niveau de guilde
        const baseDamage = Math.floor(Math.random() * 400) + 100;
        const levelBonus = (uData.level || 1) * 12;
        const guildBonus = myGuild.level * 15;

        let finalDamage = baseDamage + levelBonus + guildBonus;

        // Modificateurs de combat (Esquive et Taux Critique)
        const isCrit = Math.random() < 0.15;
        if (isCrit) finalDamage = Math.floor(finalDamage * 1.75);

        // Enregistrement des statistiques
        currentWar.scores[myGuildId] = (currentWar.scores[myGuildId] || 0) + finalDamage;
        currentWar.damageDealt[senderID] = (currentWar.damageDealt[senderID] || 0) + finalDamage;
        currentWar.attacksCount[senderID] = (currentWar.attacksCount[senderID] || 0) + 1;

        writeJSON(WAR_FILE, currentWar);

        let attackFeedback = `💥 **[FRAP DE COMBAT PASSIF]**\nVous chargez les positions adverses avec rage !\n`;
        attackFeedback += `» Dégâts causés : **${finalDamage} ${isCrit ? "🔥 CRITIQUE !" : "⚔️"}**\n`;
        attackFeedback += `» Contribution totale de votre faction : **${currentWar.scores[myGuildId]} PTS**`;
        return message.reply(attackFeedback);
      }
    }

    // ==========================================
    // 🌍 SOUS-COMMANDE : TERRITORIES / TERRITORY
    // ==========================================
    if (subCommand === "territories" || subCommand === "territory") {
      let tMsg = `🌍 **[CONTRÔLE ET STATUT DES TERRITOIRES DE L'EMPIRE]**\n${UI.line}\n`;
      
      for (const [id, t] of Object.entries(TERRITORIES_DB)) {
        // Détection de la guilde propriétaire actuelle de la zone
        let ownerGuildName = "Zone Libre / Neutre";
        Object.values(guilds).forEach(g => {
          if (g.territories && g.territories.includes(id)) {
            ownerGuildName = `${g.emoji} ${g.name}`;
          }
        });

        tMsg += `${t.emoji} **${t.name}** (Tier ${t.tier})\n`;
        tMsg += `├─ Rentabilité : +${t.moneyReward}$ / +${t.xpReward} XP\n`;
        tMsg += `└─ Occupant : \`${ownerGuildName}\`\n\n`;
      }
      return message.reply(tMsg);
    }

    // ==========================================
    // 📜 SOUS-COMMANDE : LOGS
    // ==========================================
    if (subCommand === "logs") {
      if (!userLink) return message.reply("❌ | Pas de guilde.");
      const g = guilds[userLink.guildId];

      if (g.logs.length === 0) return message.reply("📋 | Aucun événement marquant n'a été consigné dans le registre.");

      let logText = `📜 **[REGISTRE MILITAIRE ET COMPTABLE — ${g.name.toUpperCase()}]**\n${UI.line}\n`;
      g.logs.slice(-15).reverse().forEach(l => {
        logText += `• [${l.date}] ${l.action}\n`;
      });
      return message.reply(logText);
    }

    // ==========================================
    // 🎁 SOUS-COMMANDE : DAILY
    // ==========================================
    if (subCommand === "daily") {
      if (!userLink) return message.reply("❌ | Intégrez une alliance pour débloquer les rations quotidiennes.");
      const g = guilds[userLink.guildId];

      // Système de cooldown par joueur stocké au niveau global du module
      if (!global.guildDailyCooldown) global.guildDailyCooldown = {};
      const userCd = global.guildDailyCooldown[senderID];
      const cooldownTime = 24 * 60 * 60 * 1000; // 24 Heures

      if (userCd && Date.now() - userCd < cooldownTime) {
        const remaining = cooldownTime - (Date.now() - userCd);
        const hrs = Math.floor(remaining / (1000 * 60 * 60));
        return message.reply(`⏳ | Votre pack d'approvisionnement n'est pas prêt. Revenez dans **${hrs}h**.`);
      }

      // Gain indexé de manière premium sur le niveau de la guilde
      const baseDaily = 40000;
      const finalDailyReward = baseDaily + (g.level * 5000);

      let uData = await usersData.get(senderID);
      let userMoney = uData.money || 0;
      userMoney += finalDailyReward;

      global.guildDailyCooldown[senderID] = Date.now();
      await usersData.set(senderID, { money: userMoney });

      return message.reply(`🎁 | **RATION QUOTIDIENNE :** En tant que membre de **${g.name}**, l'intendant vous remet **${finalDailyReward.toLocaleString()}$** pour l'effort de guerre.`);
    }

    // ==========================================
    // 🎯 SOUS-COMMANDE : MISSIONS / ACHIEVEMENTS
    // ==========================================
    if (subCommand === "missions" || subCommand === "achievements") {
      if (!userLink) return message.reply("❌ | Créez ou rejoignez une faction.");
      const g = guilds[userLink.guildId];

      if (subCommand === "missions") {
        let mMsg = `🎯 **[PROGRESSION DES MISSIONS DE GUILDE]**\n${UI.line}\n`;
        for (const [id, m] of Object.entries(GUILD_MISSIONS)) {
          const done = g.completedMissions.includes(id) ? "✅ COMPLÉTÉE" : "⏳ EN COURS";
          mMsg += `• **${m.text}**\n   Status : [${done}] | Récompense : +${m.moneyReward}$\n\n`;
        }
        return message.reply(mMsg);
      }

      if (subCommand === "achievements") {
        let aMsg = `🏆 **[SUCCÈS HISTORIQUES DE LA FACTION]**\n${UI.line}\n`;
        for (const [id, a] of Object.entries(GUILD_ACHIEVEMENTS)) {
          const unlocked = g.achievements.includes(id) ? "🟢 DÉBLOQUÉ" : "🔒 VERROUILLÉ";
          aMsg += `• **${a.name}** — _${a.desc}_\n   État : [${unlocked}]\n\n`;
        }
        return message.reply(aMsg);
      }
    }

    // ==========================================
    // 🏆 SOUS-COMMANDE : TOP (CLASSEMENTS)
    // ==========================================
    if (subCommand === "top") {
      const sortedGuilds = Object.values(guilds).sort((a, b) => b.trophies - a.trophies).slice(0, 10);
      if (sortedGuilds.length === 0) return message.reply("🏁 | Aucune faction n'est enregistrée pour le moment.");

      let topText = `🏆 **[TOP 10 DES ALLIANCES ET FACTIONS MILITAIRES]**\n${UI.line}\n`;
      sortedGuilds.forEach((g, idx) => {
        topText += `${idx + 1}. ${g.emoji} **${g.name}** [ID: ${g.id}] ➔ Niveau ${g.level} | 🏆 ${g.trophies} Trophées\n`;
      });
      return message.reply(topText);
    }

    // ==========================================
    // 💥 SOUS-COMMANDE : DISBAND (DISSOLUTION)
    // ==========================================
    if (subCommand === "disband") {
      if (!userLink) return message.reply("❌ | Pas de guilde.");
      const g = guilds[userLink.guildId];

      if (userLink.role !== "LEADER") return message.reply("❌ | Seul le détenteur de la couronne suprême peut dissoudre cette alliance.");

      // Libération inconditionnelle de tous les membres rattachés
      g.members.forEach(m => {
        setUserGuildLink(m.uid, null);
      });

      delete guilds[g.id];
      writeJSON(GUILDS_FILE, guilds);

      return message.reply(`💥 | **ALERTE BASTION :** La guilde **${g.name}** a été dissoute. Ses fortifications s'effondrent et ses hommes sont libres de tout engagement.`);
    }

    // Repli de secours pour sous-commande invalide
    return message.reply("❌ | Sous-commande introuvable. Utilisez `{p}guild info` ou consultez le manuel d'utilisation.");
  }
};
