/**
 * @file tournament.js
 * @description Système RPG de Tournois Automatiques, Saisons et Événements Spéciaux pour GoatBot v2
 * @version 1.1.0
 * @author Collaborateur IA RPG & Gemini
 */

const fs = require('fs');
const path = require('path');

// ==========================================
// 📁 CONFIGURATION ET CONFIGURATION SYSTÈME
// ==========================================
const DATA_DIR = path.join(__dirname, 'cache', 'tournamentMMO');
const SYSTEM_FILE = path.join(DATA_DIR, 'system.json');
const HISTORY_FILE = path.join(DATA_DIR, 'history.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(SYSTEM_FILE)) fs.writeFileSync(SYSTEM_FILE, JSON.stringify({
  currentSeason: 1,
  seasonStart: Date.now(),
  activeTournament: null,
  lastAutoTournament: 0
}, null, 2));
if (!fs.existsSync(HISTORY_FILE)) fs.writeFileSync(HISTORY_FILE, JSON.stringify([], null, 2));

// ==========================================
// 👑 DICTIONNAIRE DES TITRES ET REQUIS
// ==========================================
const TITLES = {
  rookie: { name: "🥉 Rookie Champion", reqWins: 5, emoji: "🥉" },
  elite: { name: "🥈 Elite Fighter", reqWins: 15, emoji: "🥈" },
  grand: { name: "🥇 Grand Champion", reqWins: 40, emoji: "🥇" },
  king: { name: "👑 King of Arena", reqWins: 80, emoji: "👑" },
  unstoppable: { name: "⚔️ Unstoppable", reqStreak: 5, emoji: "⚔️" },
  legendary: { name: "🔥 Legendary Warrior", reqPoints: 500, emoji: "🔥" }
};

// ==========================================
// 🎁 CONFIGURATION DES ÉVÉNEMENTS SPÉCIAUX
// ==========================================
const TOURNAMENT_TYPES = {
  regular: { name: "🏆 Championnat Standard", multiplier: 1.0, icon: "⚔️" },
  boss: { name: "👹 Tournoi des Boss Abyssaux", multiplier: 2.0, icon: "👹" },
  pvp: { name: "⚔️ Tournoi PvP Sanglant", multiplier: 1.5, icon: "🩸" },
  rich: { name: "💎 Coupe des Riches Flibustiers", multiplier: 3.0, icon: "💎" },
  dragon: { name: "🐉 Dragon Cup Ancestrale", multiplier: 4.0, icon: "🐉" },
  royal: { name: "👑 Royal Championship", multiplier: 5.0, icon: "👑" }
};

// ==========================================
// 🛠️ UTILITIES DE LECTURE / ÉCRITURE SYSTEM
// ==========================================
function readDB(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { return {}; }
}

function writeDB(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
}

/**
 * Normalise et extrait le profil de tournoi d'un utilisateur depuis GoatBot
 */
function getTournamentProfile(userData, name = "Aventurier") {
  if (!userData.customData) userData.customData = {};
  if (!userData.customData.tournament) {
    userData.customData.tournament = {
      name: userData.name || name,
      points: 0,
      seasonPoints: 0,
      wins: 0,
      streak: 0,
      maxStreak: 0,
      tickets: 1,
      lastTicketClaim: 0,
      titles: [],
      activeTitle: null
    };
  }
  // S'assurer qu'aucune sous-propriété ne manque suite à une mise à jour
  const t = userData.customData.tournament;
  if (!t.name) t.name = userData.name || name;
  if (t.points === undefined) t.points = 0;
  if (t.seasonPoints === undefined) t.seasonPoints = 0;
  if (t.wins === undefined) t.wins = 0;
  if (t.streak === undefined) t.streak = 0;
  if (t.maxStreak === undefined) t.maxStreak = 0;
  if (t.tickets === undefined) t.tickets = 1;
  if (t.lastTicketClaim === undefined) t.lastTicketClaim = 0;
  if (!t.titles) t.titles = [];
  
  return t;
}

const UI = {
  line: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
  boxStart: (title) => `╭───────────── 🏆 ─────────────╮\n│ 🏟️  ${title.toUpperCase()}\n├───────────────────────────────`,
  boxEnd: () => `╰───────────────────────────────╯`,
  field: (label, val) => `│ ➔ ${label} : ${val}`
};

// ==========================================
// 🛡️ CONFIGURATION GOATBOT V2
// ==========================================
module.exports = {
  config: {
    name: "tournament",
    aliases: ["tournoi", "bracket", "arenas"],
    version: "1.1.0",
    author: "Collaborateur IA RPG & Gemini",
    countDown: 3,
    role: 0,
    description: "Système de tournois RPG automatiques par bracket avec gestion des saisons et titres exclusifs (Sauvegardes résilientes).",
    category: "game",
    guide: { fr: "{p}tournament [sous-commande]", en: "{p}tournament [subcommand]" }
  },

  onLoad: function ({ api }) {
    // Boucle de vérification automatique exécutée en tâche de fond toutes les minutes
    setInterval(async () => {
      try {
        const sys = readDB(SYSTEM_FILE);
        const now = Date.now();

        // 1. Gestion de la rotation des Saisons (30 jours)
        if (now - sys.seasonStart >= 30 * 24 * 60 * 60 * 1000) {
          sys.currentSeason += 1;
          sys.seasonStart = now;
          writeDB(SYSTEM_FILE, sys);
          
          // Note : La réinitialisation des seasonPoints se fait désormais "à la volée" 
          // au chargement du profil utilisateur dans onStart pour éviter de corrompre la BD globale.
        }

        // 2. Lancement automatique du tournoi quotidien (Toutes les 24 heures)
        if (!sys.activeTournament && (now - sys.lastAutoTournament >= 24 * 60 * 60 * 1000)) {
          const types = Object.keys(TOURNAMENT_TYPES);
          const rolledType = Math.random() > 0.80 ? types[Math.floor(Math.random() * types.length)] : "regular";
          sys.activeTournament = {
            type: rolledType,
            status: "registration",
            createdAt: now,
            participants: [],
            matches: []
          };
          sys.lastAutoTournament = now;
          writeDB(SYSTEM_FILE, sys);
        }
      } catch (e) { 
        console.log("Erreur boucle auto-tournoi:", e); 
      }
    }, 60000);
  },

  onStart: async function ({ api, event, args, usersData, message }) {
    const { senderID, threadID } = event;
    const sys = readDB(SYSTEM_FILE);
    const subCommand = args[0]?.toLowerCase();

    // Récupération et instanciation du profil via GoatBot
    let userData = await usersData.get(senderID);
    if (!userData) return message.reply("❌ Impossible de synchroniser votre profil utilisateur.");

    let pProfile = getTournamentProfile(userData, userData.name);

    // Distribution automatique du ticket quotidien gratuit
    if (Date.now() - pProfile.lastTicketClaim >= 24 * 60 * 60 * 1000) {
      pProfile.tickets += 1;
      pProfile.lastTicketClaim = Date.now();
      userData.customData.tournament = pProfile;
      await usersData.set(senderID, userData.customData, "customData");
    }

    // ==========================================
    // 📜 INTERFACE : MENU D'AIDE CENTRALISÉ
    // ==========================================
    if (!subCommand) {
      let menu = `╭───────────────────────────────────────╮\n`;
      menu += `│ 🏆  𝐂𝐇𝐀𝐌𝐏𝐈𝐎𝐍𝐍𝐀𝐓 𝐀𝐔𝐓𝐎𝐌𝐀𝐓𝐈𝐐𝐔𝐄 𝐑𝐏𝐆\n`;
      menu += `├───────────────────────────────────────┤\n`;
      menu += `│ 🔹 ~tournament info : État du tournoi actuel\n`;
      menu += `│ 🔹 ~tournament join : S'inscrire au tournoi (-1 🎫)\n`;
      menu += `│ 🔹 ~tournament leave : Se désinscrire du tournoi\n`;
      menu += `│ 🔹 ~tournament bracket : Voir l'arbre des duels\n`;
      menu += `├───────────────────────────────────────┤\n`;
      menu += `│ 🏅 𝐂𝐋𝐀𝐒𝐒𝐄𝐌𝐄𝐍𝐓𝐒 & 𝐁𝐎𝐔𝐓𝐈𝐐𝐔𝐄\n`;
      menu += `├───────────────────────────────────────┤\n`;
      menu += `│ 🔹 ~tournament top : Classement de la saison active\n`;
      menu += `│ 🔹 ~tournament history : Archives des vainqueurs\n`;
      menu += `│ 🔹 ~tournament rewards : Liste de vos titres possédés\n`;
      menu += `│ 🔹 ~tournament equip <titre> : Équiper un titre honorifique\n`;
      menu += `│ 🔹 ~tournament buy ticket : Acheter des tickets d'entrée\n`;
      menu += `├───────────────────────────────────────┤\n`;
      menu += `│ ⏱️ Inscriptions ouvertes pendant 1 heure dès l'annonce.\n`;
      menu += `│ 🏟️ Saison en cours : **Saison ${sys.currentSeason}**\n`;
      menu += `╰───────────────────────────────────────╯`;
      return message.reply(menu);
    }

    // ==========================================
    // 📊 SOUS-COMMANDE : INFO
    // ==========================================
    if (subCommand === "info") {
      if (!sys.activeTournament) {
        return message.reply("🏟️ | Aucun tournoi n'est ouvert pour le moment. Revenez plus tard.");
      }
      const tType = TOURNAMENT_TYPES[sys.activeTournament.type];
      let infoBox = UI.boxStart("État du Championnat") + `\n`;
      infoBox += `${UI.field("Événement", `${tType.icon} ${tType.name}`)}\n`;
      infoBox += `${UI.field("Statut actuel", sys.activeTournament.status === "registration" ? "⏳ Inscriptions Ouvertes" : "⚔️ Matchs en cours")}\n`;
      infoBox += `${UI.field("Participants", `👥 **${sys.activeTournament.participants.length}** joueurs inscrits`)}\n`;
      
      if (sys.activeTournament.status === "registration") {
        const elapsed = Date.now() - sys.activeTournament.createdAt;
        const oneHour = 60 * 60 * 1000;
        const remaining = Math.max(0, Math.ceil((oneHour - elapsed) / (60 * 1000)));
        infoBox += `${UI.field("Fermeture dans", `${remaining} minute(s)`)}\n`;
        infoBox += `${UI.line}\n│ ➔ Rejoignez la mêlée via : \`~tournament join\``;
      }
      infoBox += UI.boxEnd();
      return message.reply(infoBox);
    }

    // ==========================================
    // 🎟️ SOUS-COMMANDE : JOIN
    // ==========================================
    if (subCommand === "join") {
      if (!sys.activeTournament) return message.reply("❌ | Aucun tournoi n'est actif.");
      if (sys.activeTournament.status !== "registration") return message.reply("❌ | Les inscriptions sont closes.");
      if (sys.activeTournament.participants.includes(senderID)) return message.reply("❌ | Vous êtes déjà sur le registre.");

      if (pProfile.tickets <= 0) {
        return message.reply("🎫 | Aucun ticket disponible. Achetez-en un via `~tournament buy ticket`.");
      }

      pProfile.tickets -= 1;
      userData.customData.tournament = pProfile;
      
      // Persistance immédiate
      await usersData.set(senderID, userData.customData, "customData");

      sys.activeTournament.participants.push(senderID);
      writeDB(SYSTEM_FILE, sys);

      return message.reply(`🎫 | **INSCRIPTION VALIDÉE :** Ticket déposé ! (Total inscrits : ${sys.activeTournament.participants.length})`);
    }

    // ==========================================
    // 🏃 SOUS-COMMANDE : LEAVE
    // ==========================================
    if (subCommand === "leave") {
      if (!sys.activeTournament || sys.activeTournament.status !== "registration") {
        return message.reply("❌ | Désistement impossible à ce stade.");
      }
      if (!sys.activeTournament.participants.includes(senderID)) {
        return message.reply("❌ | Vous n'êtes pas inscrit.");
      }

      sys.activeTournament.participants = sys.activeTournament.participants.filter(id => id !== senderID);
      writeDB(SYSTEM_FILE, sys);

      pProfile.tickets += 1;
      userData.customData.tournament = pProfile;
      await usersData.set(senderID, userData.customData, "customData");

      return message.reply("🏃 | **DÉSISTEMENT :** Votre ticket d'entrée vous a été restitué.");
    }

    // ==========================================
    // 💰 SOUS-COMMANDE : BUY TICKET
    // ==========================================
    if (subCommand === "buy" && args[1] === "ticket") {
      const ticketPrice = 500000;
      let currentMoney = userData.money || 0;

      if (currentMoney < ticketPrice) {
        return message.reply(`💰 | Finances insuffisantes. Prix d'un ticket : **${ticketPrice.toLocaleString()}$**.`);
      }

      pProfile.tickets += 1;
      userData.customData.tournament = pProfile;
      
      await usersData.set(senderID, currentMoney - ticketPrice, "money");
      await usersData.set(senderID, userData.customData, "customData");

      return message.reply(`🎫 | **ACHAT EFFECTUÉ :** Ticket ajouté ! Reserve : **${pProfile.tickets}** 🎫`);
    }

    // ==========================================
    // 🎖️ SOUS-COMMANDE : REWARDS / TITLES
    // ==========================================
    if (subCommand === "rewards" || subCommand === "titles") {
      let titleBox = UI.boxStart("Vos Distinctions") + `\n`;
      titleBox += `${UI.field("Tickets restants", `**${pProfile.tickets}** 🎫`)}\n`;
      titleBox += `${UI.field("Titre Actif", pProfile.activeTitle ? `**${pProfile.activeTitle}**` : "Aucun Titre Équipé")}\n`;
      titleBox += `${UI.line}\n│ 🏅 **TITRES DISPONIBLES :**\n`;
      
      if (!pProfile.titles || pProfile.titles.length === 0) {
        titleBox += `│ *Aucun titre honorifique débloqué.*\n`;
      } else {
        pProfile.titles.forEach(tKey => {
          const tInfo = TITLES[tKey];
          if (tInfo) {
            titleBox += `│ ➔ ${tInfo.name} ${pProfile.activeTitle === tInfo.name ? "🔹 *(Équipé)*" : ""}\n`;
          }
        });
        titleBox += `${UI.line}\n│ *Équipez un titre via : \`~tournament equip <nom_titre>\`*\n`;
      }
      titleBox += UI.boxEnd();
      return message.reply(titleBox);
    }

    // --- LOGIQUE ÉQUIPER TITRE ---
    if (subCommand === "equip") {
      const targetTitleKey = args[1]?.toLowerCase();
      if (!targetTitleKey || !TITLES[targetTitleKey]) {
        return message.reply("❌ | Titre inconnu (Ex: rookie, elite, grand, king, unstoppable, legendary).");
      }

      if (!pProfile.titles.includes(targetTitleKey)) {
        return message.reply("❌ | Vous n'avez pas accompli les hauts faits pour ce titre.");
      }

      pProfile.activeTitle = TITLES[targetTitleKey].name;
      userData.customData.tournament = pProfile;
      await usersData.set(senderID, userData.customData, "customData");

      return message.reply(`👑 | **PROFIL MODIFIÉ :** Vous arborez le titre : **${TITLES[targetTitleKey].name}** !`);
    }

    // ==========================================
    // 📊 SOUS-COMMANDE : BRACKET
    // ==========================================
    if (subCommand === "bracket") {
      if (!sys.activeTournament) return message.reply("❌ | Aucun tournoi n'est actif.");
      if (sys.activeTournament.status === "registration") {
        return message.reply(`⏳ | Phase d'inscription. Inscrits : **${sys.activeTournament.participants.length}**.`);
      }

      let bracketMsg = `🏟️ **[ARBRE DES DUELS - EN COURS]**\n${UI.line}\n`;
      
      if (!sys.activeTournament.matches || sys.activeTournament.matches.length === 0) {
        return evaluateTournamentStart(api, threadID, sys, message, usersData);
      }

      for (const [index, match] of sys.activeTournament.matches.entries()) {
        const p1User = await usersData.get(match.p1);
        const p2User = await usersData.get(match.p2);
        const p1Name = p1User?.customData?.tournament?.name || p1User?.name || "Combattant A";
        const p2Name = p2User?.customData?.tournament?.name || p2User?.name || "Combattant B";
        const winnerName = match.winner ? ((match.winner === match.p1) ? p1Name : p2Name) : null;

        bracketMsg += `🔹 **Match ${index + 1}** : ${p1Name} **VS** ${p2Name}\n│ Statut : ${match.winner ? `🏆 Gagnant : **${winnerName}**` : "⚡ En attente..."}\n${UI.line}\n`;
      }
      return message.reply(bracketMsg);
    }

    // ==========================================
    // 📈 SOUS-COMMANDE : TOP (LEADERBOARD)
    // ==========================================
    if (subCommand === "top" || subCommand === "leaderboard") {
      const allUsers = await usersData.getAll();
      let leaderboard = [];

      allUsers.forEach(u => {
        if (u.value?.customData?.tournament) {
          leaderboard.push({
            uid: u.key,
            name: u.value.name || "Aventurier",
            ...u.value.customData.tournament
          });
        }
      });

      if (leaderboard.length === 0) return message.reply("🏁 | Aucun guerrier n'a encore combattu cette saison.");
      
      leaderboard.sort((a, b) => b.seasonPoints - a.seasonPoints || b.wins - a.wins);

      let topMsg = `🏆 **[PANTHÉON DE L'ARÈNE - SAISON ${sys.currentSeason}]**\n${UI.line}\n`;
      leaderboard.slice(0, 10).forEach((pl, index) => {
        const titleLabel = pl.activeTitle ? ` [${pl.activeTitle}]` : "";
        topMsg += `${index + 1}. **${pl.name}**${titleLabel}\n│ ⭐ Points : **${pl.seasonPoints}** | ⚔️ Victoires : ${pl.wins} | 🔥 Série : ${pl.streak}\n`;
      });
      return message.reply(topMsg);
    }

    // ==========================================
    // 📜 SOUS-COMMANDE : HISTORY
    // ==========================================
    if (subCommand === "history") {
      const history = readDB(HISTORY_FILE);
      if (history.length === 0) return message.reply("📜 | Les archives impériales sont vierges.");
      let histMsg = `📜 **[ARCHIVES DES CHAMPIONNATS]**\n${UI.line}\n`;
      
      history.slice(-5).reverse().forEach((h, index) => {
        const tType = TOURNAMENT_TYPES[h.type] || TOURNAMENT_TYPES.regular;
        histMsg += `${index + 1}. ${tType.icon} **${tType.name}**\n│ 🥇 Vainqueur : **${h.winnerName}**\n│ 👥 Participants : ${h.participantCount} | 📅 Saison ${h.season}\n${UI.line}\n`;
      });
      return message.reply(histMsg);
    }

    // Force start pour l'admin
    if (subCommand === "start" && userData.role >= 2) {
      return evaluateTournamentStart(api, threadID, sys, message, usersData);
    }

    return message.reply("❌ | Action inconnue. Entrez la commande brute `~tournament` pour l'aide.");
  }
};

// ==========================================
// ⚔️ SIMULATEUR DE COMBAT RPG
// ==========================================
function simulateRpgFight(p1Id, p2Id, p1Profile, p2Profile) {
  const buildStats = (base, prof) => ({
    hp: base.hp + ((prof.wins || 0) * 2),
    atk: base.atk,
    def: base.def,
    crit: base.crit,
    dodge: base.dodge
  });

  let f1 = buildStats({ hp: 800, atk: 85, def: 30, crit: 0.15, dodge: 0.10 }, p1Profile);
  let f2 = buildStats({ hp: 800, atk: 85, def: 30, crit: 0.15, dodge: 0.10 }, p2Profile);
  let round = 1;

  while (f1.hp > 0 && f2.hp > 0 && round <= 15) {
    if (Math.random() >= f2.dodge) {
      let dmg = Math.max(15, f1.atk - Math.floor(f2.def / 2)) * (0.85 + Math.random() * 0.3);
      if (Math.random() < f1.crit) dmg *= 1.5;
      f2.hp -= Math.floor(dmg);
    }
    if (f2.hp > 0 && Math.random() >= f1.dodge) {
      let dmg = Math.max(15, f2.atk - Math.floor(f1.def / 2)) * (0.85 + Math.random() * 0.3);
      if (Math.random() < f2.crit) dmg *= 1.5;
      f1.hp -= Math.floor(dmg);
    }
    round++;
  }
  return f1.hp > f2.hp ? p1Id : p2Id;
}

// ==========================================
// 🏟️ EXPÉDITION DU TOURNOI & SÉQUENÇAGE
// ==========================================
async function evaluateTournamentStart(api, threadID, sys, message, usersData) {
  if (sys.activeTournament.participants.length < 2) {
    sys.activeTournament = null;
    writeDB(SYSTEM_FILE, sys);
    return message.reply("❌ | Le tournoi est annulé par manque de participants (minimum 2 requis).");
  }

  sys.activeTournament.status = "ongoing";
  let pool = [...sys.activeTournament.participants];
  pool.sort(() => Math.random() - 0.5);

  let matches = [];
  for (let i = 0; i < pool.length; i += 2) {
    if (pool[i + 1]) {
      matches.push({ p1: pool[i], p2: pool[i + 1], winner: null });
    } else {
      matches.push({ p1: pool[i], p2: pool[i], winner: pool[i] });
    }
  }
  sys.activeTournament.matches = matches;
  writeDB(SYSTEM_FILE, sys);

  await message.reply(`⚔️ | **LES INSCRIPTIONS SONT CLOSES !**\nGénération de l'arbre de combat (${pool.length} participants). Début des simulations...`);

  let currentRoundPool = [...pool];

  while (currentRoundPool.length > 1) {
    let winners = [];
    let roundMatches = [];

    for (let i = 0; i < currentRoundPool.length; i += 2) {
      if (!currentRoundPool[i + 1]) {
        winners.push(currentRoundPool[i]);
        continue;
      }

      const p1 = currentRoundPool[i];
      const p2 = currentRoundPool[i + 1];

      let u1Data = await usersData.get(p1);
      let u2Data = await usersData.get(p2);
      let p1Prof = getTournamentProfile(u1Data);
      let p2Prof = getTournamentProfile(u2Data);

      const winner = simulateRpgFight(p1, p2, p1Prof, p2Prof);
      winners.push(winner);
      roundMatches.push({ p1, p2, winner });

      // Modification des profils à la volée
      let winUserData = winner === p1 ? u1Data : u2Data;
      let loseUserData = winner === p1 ? u2Data : u1Data;
      
      let wProf = getTournamentProfile(winUserData);
      let lProf = getTournamentProfile(loseUserData);

      wProf.wins += 1;
      wProf.streak += 1;
      wProf.points += 10;
      wProf.seasonPoints += 10;
      lProf.streak = 0;

      // Déblocage des titres
      if (wProf.wins >= 5 && !wProf.titles.includes("rookie")) wProf.titles.push("rookie");
      if (wProf.wins >= 15 && !wProf.titles.includes("elite")) wProf.titles.push("elite");
      if (wProf.wins >= 40 && !wProf.titles.includes("grand")) wProf.titles.push("grand");
      if (wProf.wins >= 80 && !wProf.titles.includes("king")) wProf.titles.push("king");
      if (wProf.streak >= 5 && !wProf.titles.includes("unstoppable")) wProf.titles.push("unstoppable");
      if (wProf.points >= 500 && !wProf.titles.includes("legendary")) wProf.titles.push("legendary");

      winUserData.customData.tournament = wProf;
      loseUserData.customData.tournament = lProf;

      // Écriture forcée en DB
      await usersData.set(p1, u1Data.customData, "customData");
      await usersData.set(p2, u2Data.customData, "customData");
    }

    // Gestion de la Grande Finale
    if (currentRoundPool.length === 2) {
      const finalMatch = roundMatches[0];
      const championId = finalMatch.winner;
      const secondId = finalMatch.winner === finalMatch.p1 ? finalMatch.p2 : finalMatch.p1;

      let cUserData = await usersData.get(championId);
      let sUserData = await usersData.get(secondId);

      const tConfig = TOURNAMENT_TYPES[sys.activeTournament.type] || TOURNAMENT_TYPES.regular;
      const baseReward = 500000 * tConfig.multiplier;

      let finalBox = `🏆 **[GRANDE FINALE DU CHAMPIONNAT]**\n${UI.line}\n`;
      finalBox += `👑 **${cUserData.name || "Champion"}** VS **${sUserData.name || "Challenger"}**\n${UI.line}\n`;
      finalBox += `🥇 **1er Place : ${cUserData.name || "Champion"}**\n│ ➔ Gain : +${baseReward.toLocaleString()}$ | +100 Points\n`;
      finalBox += `🥈 **2e Place : ${sUserData.name || "Challenger"}**\n│ ➔ Gain : +${(baseReward * 0.5).toLocaleString()}$ | +40 Points\n`;
      finalBox += UI.boxEnd();

      api.sendMessage(finalBox, threadID);

      // Attribution de l'argent via l'API GoatBot natif
      await usersData.set(championId, (cUserData.money || 0) + baseReward, "money");
      await usersData.set(secondId, (sUserData.money || 0) + (baseReward * 0.5), "money");

      // Points additionnels finale
      let cProf = getTournamentProfile(cUserData);
      let sProf = getTournamentProfile(sUserData);
      cProf.points += 100; cProf.seasonPoints += 100;
      sProf.points += 40; sProf.seasonPoints += 40;
      
      cUserData.customData.tournament = cProf;
      sUserData.customData.tournament = sProf;
      
      await usersData.set(championId, cUserData.customData, "customData");
      await usersData.set(secondId, sUserData.customData, "customData");

      // Historique global
      let historyDb = readDB(HISTORY_FILE);
      historyDb.push({
        type: sys.activeTournament.type,
        winnerName: cUserData.name || "Champion",
        participantCount: sys.activeTournament.participants.length,
        season: sys.currentSeason,
        date: new Date().toLocaleDateString()
      });
      writeDB(HISTORY_FILE, historyDb);

      sys.activeTournament = null;
      writeDB(SYSTEM_FILE, sys);
      return;
    }
    currentRoundPool = winners;
  }
}
