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
