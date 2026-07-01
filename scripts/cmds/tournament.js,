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
      menu += `│ 🔹 ~tournament buy ticket : Acheter des tickets d'entrée\n`;
      menu += `├───────────────────────────────────────┤\n`;
      menu += `│ ⏱️ Inscriptions ouvertes pendant 1 heure dès l'annonce.\n`;
      menu += `│ 🏟️ Saison en cours : **Saison ${sys.currentSeason}**\n`;
      menu += `╰───────────────────────────────────────╯`;
      return message.reply(menu);
    }
