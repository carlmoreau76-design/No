/**
 * @file tournament.js
 * @description Système RPG de Tournois Automatiques, Saisons et Événements Spéciaux pour GoatBot v2
 * @version 1.0.0
 * @author Collaborateur IA RPG
 */

const fs = require('fs');
const path = require('path');

// ==========================================
// 📁 CONFIGURATION ET PERSISTANCE DES DONNÉES
// ==========================================
const DATA_DIR = path.join(__dirname, 'cache', 'tournamentMMO');
const PLAYER_FILE = path.join(DATA_DIR, 'players.json');
const SYSTEM_FILE = path.join(DATA_DIR, 'system.json');
const HISTORY_FILE = path.join(DATA_DIR, 'history.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(PLAYER_FILE)) fs.writeFileSync(PLAYER_FILE, JSON.stringify({}, null, 2));
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
// 🛠️ UTILITIES ET CLOCK DE SYNCHRONISATION
// ==========================================
function readDB(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { return {}; }
}
function writeDB(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
}

function getPlayerProfile(uid, name = "Aventurier") {
  const db = readDB(PLAYER_FILE);
  if (!db[uid]) {
    db[uid] = {
      name: name,
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
    writeDB(PLAYER_FILE, db);
  }
  return db[uid];
}

const UI = {
  line: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
  boxStart: (title) => `╭───────────── 🏆 ─────────────╮\n│ 🏟️  ${title.toUpperCase()}\n├───────────────────────────────`,
  boxEnd: () => `╰───────────────────────────────╯`,
  field: (label, val) => `│ ➔ ${label} : ${val}`
};

// ==========================================
// 🛡️ ACCROCHE ET CONFIGURATION GOATBOT V2
// ==========================================
module.exports = {
  config: {
    name: "tournament",
    aliases: ["tournoi", "bracket", "arenas"],
    version: "1.0.0",
    author: "Collaborateur IA RPG",
    countDown: 3,
    role: 0,
    description: "Système de tournois RPG automatiques par bracket avec gestion des saisons et titres exclusifs.",
    category: "game",
    guide: { fr: "{p}tournament [sous-commande]", en: "{p}tournament [subcommand]" }
  },

  onLoad: function ({ api }) {
    // Boucle de vérification automatique (S'exécute en tâche de fond toutes les minutes)
    setInterval(() => {
      try {
        const sys = readDB(SYSTEM_FILE);
        const now = Date.now();

        // 1. Gestion de la rotation des Saisons (30 jours)
        if (now - sys.seasonStart >= 30 * 24 * 60 * 60 * 1000) {
          sys.currentSeason += 1;
          sys.seasonStart = now;
          writeDB(SYSTEM_FILE, sys);
          
          // Réinitialisation des points de saison des joueurs
          const players = readDB(PLAYER_FILE);
          Object.keys(players).forEach(uid => {
            players[uid].seasonPoints = 0;
          });
          writeDB(PLAYER_FILE, players);
        }

        // 2. Lancement automatique du tournoi quotidien (Toutes les 24 heures)
        if (!sys.activeTournament && (now - sys.lastAutoTournament >= 24 * 60 * 60 * 1000)) {
          const types = Object.keys(TOURNAMENT_TYPES);
          // Événement spécial rare si le sort est favorable
          const rolledType = Math.random() > 0.80 ? types[Math.floor(Math.random() * types.length)] : "regular";

          sys.activeTournament = {
            type: rolledType,
            status: "registration",
            createdAt: now,
            participants: []
          };
          sys.lastAutoTournament = now;
          writeDB(SYSTEM_FILE, sys);
        }
      } catch (e) { console.log("Erreur boucle auto-tournoi:", e); }
    }, 60000);
  },

  onStart: async function ({ api, event, args, usersData, message }) {
    const { senderID, threadID } = event;
    const sys = readDB(SYSTEM_FILE);
    const subCommand = args[0]?.toLowerCase();

    let userData = await usersData.get(senderID);
    let userMoney = userData.money || 0;
    let pProfile = getPlayerProfile(senderID, userData.name);

    // Distribution automatique du ticket quotidien gratuit
    if (Date.now() - pProfile.lastTicketClaim >= 24 * 60 * 60 * 1000) {
      pProfile.tickets += 1;
      pProfile.lastTicketClaim = Date.now();
      writeDB(PLAYER_FILE, readDB(PLAYER_FILE));
    }

    // ==========================================
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
    // 📊 SOUS-COMMANDE : INFO (ÉTAT DU TOURNOI ACTUEL)
    // ==========================================
    if (subCommand === "info") {
      if (!sys.activeTournament) {
        return message.reply("🏟️ | Aucun tournoi n'est ouvert pour le moment. Revenez plus tard ou attendez le lancement automatique.");
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
    // 🎟️ SOUS-COMMANDE : JOIN (INSCRIPTION AU TOURNOI)
    // ==========================================
    if (subCommand === "join") {
      if (!sys.activeTournament) {
        return message.reply("❌ | Aucun tournoi n'est actif pour le moment.");
      }
      if (sys.activeTournament.status !== "registration") {
        return message.reply("❌ | Trop tard ! Les inscriptions sont closes et les duels ont déjà commencé.");
      }
      if (sys.activeTournament.participants.includes(senderID)) {
        return message.reply("❌ | Inscription invalide : Votre nom figure déjà sur le registre des combattants.");
      }

      // Vérification et prélèvement du ticket d'entrée
      const fullPlayers = readDB(PLAYER_FILE);
      let playerProf = fullPlayers[senderID] || getPlayerProfile(senderID, userData.name);

      if (playerProf.tickets <= 0) {
        return message.reply("🎫 | Vous n'avez plus de ticket de tournoi. Achetez-en un via `~tournament buy ticket` (50,000$).");
      }

      // Consommation du ticket et enregistrement
      playerProf.tickets -= 1;
      fullPlayers[senderID] = playerProf;
      writeDB(PLAYER_FILE, fullPlayers);

      sys.activeTournament.participants.push(senderID);
      writeDB(SYSTEM_FILE, sys);

      return message.reply(`🎫 | **INSCRIPTION VALIDÉE :** Vous avez déposé votre ticket d'entrée. Bonne chance pour cette **Saison ${sys.currentSeason}** ! (Inscrits : ${sys.activeTournament.participants.length})`);
    }

    // ==========================================
    // 🏃 SOUS-COMMANDE : LEAVE (SE DÉSINSCRIRE)
    // ==========================================
    if (subCommand === "leave") {
      if (!sys.activeTournament || sys.activeTournament.status !== "registration") {
        return message.reply("❌ | Impossible de vous désister à ce stade du championnat.");
      }
      if (!sys.activeTournament.participants.includes(senderID)) {
        return message.reply("❌ | Vous n'êtes pas inscrit à ce tournoi.");
      }

      // Retrait de la liste et restitution du ticket
      sys.activeTournament.participants = sys.activeTournament.participants.filter(id => id !== senderID);
      writeDB(SYSTEM_FILE, sys);

      const fullPlayers = readDB(PLAYER_FILE);
      if (fullPlayers[senderID]) {
        fullPlayers[senderID].tickets += 1;
        writeDB(PLAYER_FILE, fullPlayers);
      }

      return message.reply("🏃 | **DÉSISTEMENT :** Vous retirez votre candidature. Votre ticket d'entrée vous a été restitué.");
    }

    // ==========================================
    // 💰 SOUS-COMMANDE : BUY TICKET (ACHAT DE TICKET)
    // ==========================================
    if (subCommand === "buy" && args[1] === "ticket") {
      const ticketPrice = 500000; // 500 000$ le ticket supplémentaire
      if (userMoney < ticketPrice) {
        return message.reply(`💰 | Vos finances sont insuffisantes. Un ticket d'arène coûte **${ticketPrice.toLocaleString()}$**.`);
      }

      userMoney -= ticketPrice;
      await usersData.set(senderID, { money: userMoney });

      const fullPlayers = readDB(PLAYER_FILE);
      let playerProf = fullPlayers[senderID] || getPlayerProfile(senderID, userData.name);
      playerProf.tickets += 1;
      fullPlayers[senderID] = playerProf;
      writeDB(PLAYER_FILE, fullPlayers);

      return message.reply(`🎫 | **ACHAT EFFECTUÉ :** Vous achetez un ticket de tournoi. (-${ticketPrice.toLocaleString()}$) | Total en réserve : **${playerProf.tickets}** 🎫`);
    }

    // ==========================================
    // 🎖️ SOUS-COMMANDE : REWARDS (PROFIL DES TITRES DE COMBAT)
    // ==========================================
    if (subCommand === "rewards" || subCommand === "titles") {
      let titleBox = UI.boxStart("Vos Distinctions") + `\n`;
      titleBox += `${UI.field("Tickets restants", `**${pProfile.tickets}** 🎫`)}\n`;
      titleBox += `${UI.field("Titre Actif", pProfile.activeTitle ? `**${pProfile.activeTitle}**` : "Aucun Titre Équipé")}\n`;
      titleBox += `${UI.line}\n│ 🏅 **TITRES DISPONIBLES / DÉBLOQUÉS :**\n`;

      if (!pProfile.titles || pProfile.titles.length === 0) {
        titleBox += `│ *Aucun titre honorifique débloqué pour le moment.*\n`;
      } else {
        pProfile.titles.forEach(tKey => {
          const tInfo = TITLES[tKey];
          titleBox += `│ ➔ ${tInfo.name} ${pProfile.activeTitle === tInfo.name ? "🔹 *(Équipé)*" : ""}\n`;
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
        return message.reply("❌ | Titre inconnu. Indiquez la clé du titre (ex: rookie, elite, grand, king, unstoppable, legendary).");
      }

      const fullPlayers = readDB(PLAYER_FILE);
      let playerProf = fullPlayers[senderID];

      if (!playerProf.titles.includes(targetTitleKey)) {
        return message.reply("❌ | Vous n'avez pas encore accompli les hauts faits requis pour arborer ce titre.");
      }

      playerProf.activeTitle = TITLES[targetTitleKey].name;
      fullPlayers[senderID] = playerProf;
      writeDB(PLAYER_FILE, fullPlayers);

      return message.reply(`👑 | **PROFIL MODIFIÉ :** Vous arborez fièrement le titre honorifique : **${TITLES[targetTitleKey].name}** !`);
    }

    // ==========================================
    // 📊 SOUS-COMMANDE : BRACKET (ARBRE DES DUELS EN DIRECT)
    // ==========================================
    if (subCommand === "bracket") {
      if (!sys.activeTournament) return message.reply("❌ | Aucun tournoi n'est actif pour le moment.");
      if (sys.activeTournament.status === "registration") {
        return message.reply(`⏳ | Le tournoi est en phase d'inscription. Débute automatiquement dès la fin du compte à rebours ou via un lancement système. Total inscrits : **${sys.activeTournament.participants.length}**.`);
      }

      const players = readDB(PLAYER_FILE);
      let bracketMsg = `🏟️ **[ARBRE DES DUELS - TOURNOI EN COURS]**\n${UI.line}\n`;
      
      if (!sys.activeTournament.matches || sys.activeTournament.matches.length === 0) {
        // Lancement forcé ou automatique des brackets si les inscriptions sont closes
        return evaluateTournamentStart(api, threadID, sys, message);
      }

      sys.activeTournament.matches.forEach((match, index) => {
        const p1Name = players[match.p1]?.name || "Combattant A";
        const p2Name = players[match.p2]?.name || "Combattant B";
        bracketMsg += `🔹 **Match ${index + 1}** : ${p1Name} **VS** ${p2Name}\n│ Statut : ${match.winner ? `🏆 Gagnant : **${players[match.winner].name}**` : "⚡ En attente du signal..."}\n${UI.line}\n`;
      });

      return message.reply(bracketMsg);
    }

    // ==========================================
    // 📈 SOUS-COMMANDE : TOP (PANTHÉON DE LA SAISON)
    // ==========================================
    if (subCommand === "top" || subCommand === "leaderboard") {
      const fullPlayers = readDB(PLAYER_FILE);
      let leaderboard = Object.entries(fullPlayers).map(([uid, data]) => ({ uid, ...data }));

      if (leaderboard.length === 0) return message.reply("🏁 | Aucun guerrier n'a encore combattu dans l'arène cette saison.");

      // Tri par points de saison, puis par victoires totales
      leaderboard.sort((a, b) => b.seasonPoints - a.seasonPoints || b.wins - a.wins);

      let topMsg = `🏆 **[PANTHÉON DE L'ARÈNE - SAISON ${sys.currentSeason}]**\n${UI.line}\n`;
      leaderboard.slice(0, 10).forEach((pl, index) => {
        const titleLabel = pl.activeTitle ? ` [${pl.activeTitle}]` : "";
        topMsg += `${index + 1}. **${pl.name}**${titleLabel}\n│ ⭐ Points : **${pl.seasonPoints}** | ⚔️ Victoires : ${pl.wins} | 🔥 Série : ${pl.streak}\n`;
      });

      return message.reply(topMsg);
    }

    // ==========================================
    // 📜 SOUS-COMMANDE : HISTORY (ARCHIVES DES TOURNOIS)
    // ==========================================
    if (subCommand === "history") {
      const history = readDB(HISTORY_FILE);
      if (history.length === 0) return message.reply("📜 | Les archives impériales sont vierges. Aucun tournoi n'a encore été complété.");

      let histMsg = `📜 **[ARCHIVES DES DERNIERS CHAMPIONNATS]**\n${UI.line}\n`;
      // Affichage des 5 derniers tournois
      history.slice(-5).reverse().forEach((h, index) => {
        const tType = TOURNAMENT_TYPES[h.type] || TOURNAMENT_TYPES.regular;
        histMsg += `${index + 1}. ${tType.icon} **${tType.name}**\n│ 🥇 Vainqueur : **${h.winnerName}**\n│ 👥 Participants : ${h.participantCount} | 📅 Saison ${h.season}\n${UI.line}\n`;
      });

      return message.reply(histMsg);
    }

    // Commande cachée d'administration ou de force-start manuel
    if (subCommand === "start" && ROLES[userLink?.role || "GUEST"]?.power >= 2) {
      return evaluateTournamentStart(api, threadID, sys, message);
    }

    return message.reply("❌ | Action inconnue. Entrez la commande brute `~tournament` pour ouvrir l'aide.");
  }
};

// ==========================================
// ⚔️ CORE LOGIC : SIMULATEUR DE COMBAT RPG AUTOMATIQUE
// ==========================================
function simulateRpgFight(p1, p2, p1Data, p2Data) {
  // Définition des statistiques de base ajustées
  const buildStats = (base, prof) => ({
    name: prof.name,
    hp: base.hp + (prof.wins * 2), // Petite progression passive selon l'expérience
    maxHp: base.hp + (prof.wins * 2),
    atk: base.atk,
    def: base.def,
    crit: base.crit,
    dodge: base.dodge
  });

  let f1 = buildStats({ hp: 800, atk: 85, def: 30, crit: 0.15, dodge: 0.10 }, p1Data);
  let f2 = buildStats({ hp: 800, atk: 85, def: 30, crit: 0.15, dodge: 0.10 }, p2Data);

  let round = 1;
  while (f1.hp > 0 && f2.hp > 0 && round <= 15) {
    // Étape 1 : Attaque de f1 sur f2
    if (Math.random() >= f2.dodge) {
      let dmg = Math.max(15, f1.atk - Math.floor(f2.def / 2)) * (0.85 + Math.random() * 0.3);
      if (Math.random() < f1.crit) dmg *= 1.5;
      f2.hp -= Math.floor(dmg);
    }
    // Étape 2 : Riposte de f2 sur f1 (si encore en vie)
    if (f2.hp > 0 && Math.random() >= f1.dodge) {
      let dmg = Math.max(15, f2.atk - Math.floor(f1.def / 2)) * (0.85 + Math.random() * 0.3);
      if (Math.random() < f2.crit) dmg *= 1.5;
      f1.hp -= Math.floor(dmg);
    }
    round++;
  }
  return f1.hp > f2.hp ? p1 : p2;
}

// ==========================================
// 🏟️ EXPÉDITION DU TOURNOI & SÉQUENÇAGE DES BRACKETS
// ==========================================
async function evaluateTournamentStart(api, threadID, sys, message) {
  if (sys.activeTournament.participants.length < 2) {
    sys.activeTournament = null;
    writeDB(SYSTEM_FILE, sys);
    return message.reply("❌ | Le tournoi est annulé par manque de participants (minimum 2 gladiateurs requis).");
  }

  sys.activeTournament.status = "ongoing";
  let pool = [...sys.activeTournament.participants];
  
  // Mélange aléatoire (Shuffle)
  pool.sort(() => Math.random() - 0.5);

  const players = readDB(PLAYER_FILE);
  let matches = [];

  // Création des paires initiales
  for (let i = 0; i < pool.length; i += 2) {
    if (pool[i + 1]) {
      matches.push({ p1: pool[i], p2: pool[i + 1], winner: null });
    } else {
      // Joueur exempt (Bye) qui passe directement au tour suivant si nombre impair
      matches.push({ p1: pool[i], p2: pool[i], winner: pool[i] });
    }
  }

  sys.activeTournament.matches = matches;
  writeDB(SYSTEM_FILE, sys);

  await message.reply(`⚔️ | **LES INSCRIPTIONS SONT CLOSES !**\nGénération de l'arbre de combat avec **${pool.length} participants**. Début des simulations automatiques...`);

  // Résolution progressive des duels
  let currentRoundPool = [...pool];
  let roundCount = 1;

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
      
      // Simulation RPG pure
      const winner = simulateRpgFight(p1, p2, players[p1], players[p2]);
      winners.push(winner);
      roundMatches.push({ p1, p2, winner });

      // Mise à jour de l'historique de combat des joueurs
      players[winner].wins += 1;
      players[winner].streak += 1;
      players[winner].points += 10;
      players[winner].seasonPoints += 10;

      const loser = winner === p1 ? p2 : p1;
      players[loser].streak = 0; // Perte de la série de victoires

      // Déblocage automatique des titres honorifiques
      if (players[winner].wins >= 5 && !players[winner].titles.includes("rookie")) players[winner].titles.push("rookie");
      if (players[winner].wins >= 15 && !players[winner].titles.includes("elite")) players[winner].titles.push("elite");
      if (players[winner].wins >= 40 && !players[winner].titles.includes("grand")) players[winner].titles.push("grand");
      if (players[winner].wins >= 80 && !players[winner].titles.includes("king")) players[winner].titles.push("king");
      if (players[winner].streak >= 5 && !players[winner].titles.includes("unstoppable")) players[winner].titles.push("unstoppable");
      if (players[winner].points >= 500 && !players[winner].titles.includes("legendary")) players[winner].titles.push("legendary");
    }

    // Si nous arrivons au dernier duel, c'est la Grande Finale !
    if (currentRoundPool.length === 2) {
      const finalMatch = roundMatches[0];
      const championId = finalMatch.winner;
      const secondId = finalMatch.winner === finalMatch.p1 ? finalMatch.p2 : finalMatch.p1;

      // Distribution des récompenses financières
      const tConfig = TOURNAMENT_TYPES[sys.activeTournament.type] || TOURNAMENT_TYPES.regular;
      const baseReward = 500000 * tConfig.multiplier;

      // Envoi du rapport de la Grande Finale
      let finalBox = `🏆 **[GRANDE FINALE DU CHAMPIONNAT]**\n${UI.line}\n`;
      finalBox += `👑 **${players[championId].name}** VS **${players[secondId].name}**\n${UI.line}\n`;
      finalBox += `🥇 **1er Place : ${players[championId].name}**\n│ ➔ Gain : +${(baseReward).toLocaleString()}$ | +100 Points\n`;
      finalBox += `🥈 **2e Place : ${players[secondId].name}**\n│ ➔ Gain : +${(baseReward * 0.5).toLocaleString()}$ | +40 Points\n`;
      finalBox += UI.boxEnd();
      
      api.sendMessage(finalBox, threadID);

      // Attribution des gains financiers sur les profils des joueurs
      try {
        const usersData = api.usersData; // Récupération sécurisée du gestionnaire global
        if (usersData) {
          let cData = await usersData.get(championId);
          let sData = await usersData.get(secondId);
          await usersData.set(championId, { money: (cData.money || 0) + baseReward });
          await usersData.set(secondId, { money: (sData.money || 0) + (baseReward * 0.5) });
        }
      } catch (e) {}

      // Archivage historique
      let historyDb = readDB(HISTORY_FILE);
      historyDb.push({
        type: sys.activeTournament.type,
        winnerName: players[championId].name,
        participantCount: sys.activeTournament.participants.length,
        season: sys.currentSeason,
        date: new Date().toLocaleDateString()
      });
      writeDB(HISTORY_FILE, historyDb);

      // Fermeture du tournoi actif
      sys.activeTournament = null;
      writeDB(SYSTEM_FILE, sys);
      writeDB(PLAYER_FILE, players);
      return;
    }

    currentRoundPool = winners;
    roundCount++;
  }
        }
