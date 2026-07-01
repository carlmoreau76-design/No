/**
 * @file quest.js
 * @description Système de Quêtes RPG & Succès MMORPG Ultra Premium interconnecté pour GoatBot v2
 * @version 1.0.0
 * @author Collaborateur IA RPG
 */

const fs = require('fs');
const path = require('path');

// ==========================================
// 📁 COORDONNÉES ET STRUCTURE DU STOCKAGE
// ==========================================
const DATA_DIR = path.join(__dirname, 'cache', 'questsMMO');
const PLAYER_QUESTS_FILE = path.join(DATA_DIR, 'player_quests.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(PLAYER_QUESTS_FILE)) fs.writeFileSync(PLAYER_QUESTS_FILE, JSON.stringify({}, null, 2));

// ==========================================
// 📊 DICTIONNAIRE DES DIFFICULTÉS ET COEFFICIENTS
// ==========================================
const DIFFICULTIES = {
  common: { name: "Commune", color: "⚪", mult: 1.0 },
  rare: { name: "Rare", color: "🔵", mult: 1.5 },
  epic: { name: "Épique", color: "🟣", mult: 2.2 },
  legendary: { name: "Légendaire", color: "🟠", mult: 3.5 },
  mythic: { name: "Mythique", color: "🔴", mult: 5.5 },
  divine: { name: "Divine", color: "🌈", mult: 10.0 }
};

// ==========================================
// 🎯 MODÈLES D'OBJECTIFS DISPONIBLES POUR LA GÉNÉRATION INTERCONNECTÉE
// ==========================================
const OBJECTIVE_TEMPLATES = {
  "arena_win": { text: "Gagner {count} combats dans l'arène", baseCount: 3 },
  "pirate_explore": { text: "Mener {count} explorations avec les pirates", baseCount: 5 },
  "treasure_find": { text: "Déterrer {count} trésors cachés", baseCount: 2 },
  "dice_play": { text: "Jouer {count} parties de Dice", baseCount: 10 },
  "mines_play": { text: "Déminer {count} grilles dans les Mines", baseCount: 4 },
  "slots_play": { text: "Lancer {count} rotations aux Machines à sous", baseCount: 8 },
  "bank_deposit": { text: "Déposer au moins {count}$ à la Banque", baseCount: 50000 },
  "chest_open": { text: "Ouvrir {count} coffres de butin", baseCount: 3 }
};

// ==========================================
// 🏆 REPERTOIRE DES SUCCÈS HISTORIQUES (ACHIEVEMENTS)
// ==========================================
const ACHIEVEMENTS_DB = {
  "aventurier": { name: "Aventurier", desc: "Avoir accompli 10 quêtes au total", req: 10 },
  "heros": { name: "Héros du Royaume", desc: "Avoir accompli 50 quêtes au total", req: 50 },
  "roi_pirate": { name: "Roi Pirate", desc: "Avoir accompli 25 quêtes d'exploration", req: 25 },
  "millionnaire": { name: "Magnat Financier", desc: "Cumuler plus de 10 000 000$ via les quêtes", req: 10000000 },
  "legende": { name: "Légende Vivante", desc: "Avoir accompli 5 quêtes de difficulté Divine", req: 5 }
};

// ==========================================
// 🗺️ BANQUE DE DONNÉES DE LA CAMPAGNE PRINCIPALE (STORY MODE)
// ==========================================
const STORY_LINE = [
  { step: 1, name: "Le Réveil du Mercenaire", type: "arena_win", target: 3, diff: "common", reward: { money: 25000, xp: 100 } },
  { step: 2, name: "L'Appel du Grand Large", type: "pirate_explore", target: 5, diff: "rare", reward: { money: 75000, xp: 300 } },
  { step: 3, name: "Le Pacte du Banquier", type: "bank_deposit", target: 200000, diff: "epic", reward: { money: 150000, xp: 700 } },
  { step: 4, name: "Le Secret des Profondeurs", type: "treasure_find", target: 10, diff: "legendary", reward: { money: 500000, xp: 2000 } }
];

// ==========================================
// 🛠️ UTILITIES ET SYSTÈME DE SYNCHRONISATION DES FICHIERS
// ==========================================
function readDB(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { return {}; }
}
function writeDB(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
}

function getPlayerQuests(uid) {
  const db = readDB(PLAYER_QUESTS_FILE);
  if (!db[uid]) {
    db[uid] = {
      daily: [], weekly: [], storyStep: 1, activeStory: null,
      secret: [], stats: { totalCompleted: 0, totalFailed: 0, totalGoldEarned: 0, divineCompleted: 0, pirateQuests: 0 },
      history: [], achievements: [], lastDailyReset: 0, lastWeeklyReset: 0
    };
    writeDB(PLAYER_QUESTS_FILE, db);
  }
  return db[uid];
}

function savePlayerQuests(uid, data) {
  const db = readDB(PLAYER_QUESTS_FILE);
  db[uid] = data;
  writeDB(PLAYER_QUESTS_FILE, db);
}

// Générateur procédural de quêtes uniques aléatoires
function generateRandomQuest(type, difficultyKey) {
  const templatesKeys = Object.keys(OBJECTIVE_TEMPLATES);
  const selectedType = templatesKeys[Math.floor(Math.random() * templatesKeys.length)];
  const template = OBJECTIVE_TEMPLATES[selectedType];
  const diff = DIFFICULTIES[difficultyKey];

  const targetCount = Math.floor(template.baseCount * diff.mult);
  const goldReward = Math.floor((Math.random() * 50000 + 30000) * diff.mult);
  const xpReward = Math.floor((Math.random() * 200 + 100) * diff.mult);

  return {
    id: Math.random().toString(16).substring(2, 8).toUpperCase(),
    type: selectedType,
    text: template.text.replace("{count}", targetCount.toLocaleString()),
    target: targetCount,
    current: 0,
    difficulty: difficultyKey,
    claimed: false,
    reward: { money: goldReward, xp: xpReward }
  };
}

const UI = {
  line: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
  boxStart: (title) => `╭───────────── 📜 ─────────────╮\n│ 🌟  ${title.toUpperCase()}\n├───────────────────────────────`,
  boxEnd: () => `╰───────────────────────────────╯`,
  field: (label, val) => `│ 🔸 ${label} : ${val}`,
  progressBar: (current, target) => {
    const percent = Math.min(100, Math.floor((current / target) * 100));
    const progress = Math.min(10, Math.floor(percent / 10));
    const bar = "🟩".repeat(progress) + "⬛".repeat(10 - progress);
    return `${bar} (${percent}%)`;
  }
};

// ==========================================
// 🛡️ ACCROCHE DE L'API COMPATIBLE GOATBOT
// ==========================================
module.exports = {
  config: {
    name: "quest",
    aliases: ["quests", "quêtes", "q", "objectifs"],
    version: "1.0.0",
    author: "Collaborateur IA RPG",
    countDown: 2,
    role: 0,
    description: "Système de quêtes MMORPG complet connecté de manière dynamique à toutes vos actions.",
    category: "game",
    guide: { fr: "{p}quest [sous-commande]", en: "{p}quest [subcommand]" }
  },

  onStart: async function ({ api, event, args, usersData, message }) {
    const { senderID, threadID } = event;
    const qData = getPlayerQuests(senderID);
    const subCommand = args[0]?.toLowerCase();

    // ==========================================
    // 📜 INTERFACE : MENU D'AIDE AUTOMATIQUE (SI "quest" UNIQUEMENT)
    // ==========================================
    if (!subCommand) {
      let menu = `╭───────────────────────────────────────╮\n`;
      menu += `│ 📜  𝐒𝐘𝐒𝐓È𝐌𝐄 𝐃𝐄 𝐐𝐔É𝐓𝐄𝐒 𝐌𝐌𝐎𝐑𝐏𝐆\n`;
      menu += `├───────────────────────────────────────┤\n`;
      menu += `│ 🔹 ~quest daily : Vos missions quotidiennes (24h)\n`;
      menu += `│ 🔹 ~quest weekly : Vos objectifs majeurs de la semaine\n`;
      menu += `│ 🔹 ~quest story : Progression dans la campagne narrative\n`;
      menu += `│ 🔹 ~quest secret : Déceler les contrats classifiés\n`;
      menu += `├───────────────────────────────────────┤\n`;
      menu += `│ 💰 𝐑𝐄𝐕𝐄𝐍𝐃𝐈𝐂𝐀𝐓𝐈𝐎𝐍 & 📊 𝐒𝐔𝐈𝐕𝐈\n`;
      menu += `├───────────────────────────────────────┤\n`;
      menu += `│ 🔹 ~quest claim <type> <ID> : Encaisser les récompenses\n`;
      menu += `│ 🔹 ~quest info : Afficher les succès débloqués\n`;
      menu += `│ 🔹 ~quest history : Grand livre des exploits passés\n`;
      menu += `│ 🔹 ~quest leaderboard : Classement mondial des Maîtres\n`;
      menu += `│ 🔹 ~quest refresh : Re-tirer vos quêtes (cooldown)\n`;
      menu += `├───────────────────────────────────────┤\n`;
      menu += `│ 🔄 Ce système suit automatiquement vos performances\n`;
      menu += `│    dans : arena, pirate, bank, slots, dice et mines !\n`;
      menu += `╰───────────────────────────────────────╯`;
      return message.reply(menu);
    }

    // ==========================================
    // ⏰ ENGINE DE RESET ET INSTANCIATION TEMPORELLE
    // ==========================================
    const nowTime = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const oneWeekMs = 7 * 24 * 60 * 60 * 1000;

    // Reset et génération automatique des quêtes quotidiennes (3 quêtes)
    if (nowTime - qData.lastDailyReset >= oneDayMs || qData.daily.length === 0) {
      qData.daily = [
        generateRandomQuest("daily", "common"),
        generateRandomQuest("daily", "rare"),
        generateRandomQuest("daily", "epic")
      ];
      qData.lastDailyReset = nowTime;
      savePlayerQuests(senderID, qData);
    }

    // Reset et génération automatique des quêtes hebdomadaires (2 quêtes lourdes)
    if (nowTime - qData.lastWeeklyReset >= oneWeekMs || qData.weekly.length === 0) {
      qData.weekly = [
        generateRandomQuest("weekly", "legendary"),
        generateRandomQuest("weekly", "mythic")
      ];
      qData.lastWeeklyReset = nowTime;
      savePlayerQuests(senderID, qData);
    }

    // Synchronisation de la quête d'histoire selon le step actuel
    const currentStoryConfig = STORY_LINE.find(s => s.step === qData.storyStep);
    if (currentStoryConfig && (!qData.activeStory || qData.activeStory.step !== qData.storyStep)) {
      qData.activeStory = {
        step: currentStoryConfig.step,
        name: currentStoryConfig.name,
        type: currentStoryConfig.type,
        text: OBJECTIVE_TEMPLATES[currentStoryConfig.type].text.replace("{count}", currentStoryConfig.target.toLocaleString()),
        target: currentStoryConfig.target,
        current: 0,
        difficulty: currentStoryConfig.diff,
        claimed: false,
        reward: currentStoryConfig.reward
      };
      savePlayerQuests(senderID, qData);
    }

    // ==========================================
    // ☀️ SOUS-COMMANDE : DAILY (MISSIONS QUOTIDIENNES)
    // ==========================================
    if (subCommand === "daily") {
      let view = UI.boxStart("Quêtes Quotidiennes") + `\n`;
      const remMs = (qData.lastDailyReset + oneDayMs) - nowTime;
      const hours = Math.floor(remMs / (60 * 60 * 1000));
      const mins = Math.floor((remMs % (60 * 60 * 1000)) / (60 * 1000));
      view += `⏳ Réinitialisation dans : **${hours}h ${mins}min**\n${UI.line}\n`;

      qData.daily.forEach(q => {
        const diff = DIFFICULTIES[q.difficulty];
        const status = q.claimed ? "✅ ENCAISSÉE" : (q.current >= q.target ? "⭐ PRÊTE (claim)" : "⏳ EN COURS");
        view += `📌 [ID: **${q.id}**] Rareté: ${diff.color} **${diff.name}**\n`;
        view += `│ 🎯 Objectif : ${q.text}\n`;
        view += `│ 📊 Progression : ${UI.progressBar(q.current, q.target)} [${q.current}/${q.target}]\n`;
        view += `│ 💰 Gains : +${q.reward.money.toLocaleString()}$ | +${q.reward.xp} XP\n`;
        view += `│ ⚡ État : \`${status}\`\n${UI.line}\n`;
      });

      view += `ℹ️ *Validez votre gain avec : \`quest claim daily <ID>\`*`;
      view += `\n` + UI.boxEnd();
      return message.reply(view);
    }

    // ==========================================
    // 🪐 SOUS-COMMANDE : WEEKLY (OBJECTIFS HEBDOMADAIRES)
    // ==========================================
    if (subCommand === "weekly") {
      let view = UI.boxStart("Quêtes Hebdomadaires") + `\n`;
      const remMs = (qData.lastWeeklyReset + oneWeekMs) - nowTime;
      const days = Math.floor(remMs / (24 * 60 * 60 * 1000));
      const hours = Math.floor((remMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
      view += `⏳ Nouveau cycle dans : **${days}j ${hours}h**\n${UI.line}\n`;

      qData.weekly.forEach(q => {
        const diff = DIFFICULTIES[q.difficulty];
        const status = q.claimed ? "✅ ENCAISSÉE" : (q.current >= q.target ? "⭐ PRÊTE (claim)" : "⏳ EN COURS");
        view += `🏅 [ID: **${q.id}**] Rareté: ${diff.color} **${diff.name}**\n`;
        view += `│ 🎯 Objectif : ${q.text}\n`;
        view += `│ 📊 Progression : ${UI.progressBar(q.current, q.target)} [${q.current}/${q.target}]\n`;
        view += `│ 💰 Gains : +${q.reward.money.toLocaleString()}$ | +${q.reward.xp} XP\n`;
        view += `│ ⚡ État : \`${status}\`\n${UI.line}\n`;
      });

      view += `ℹ️ *Validez votre gain avec : \`quest claim weekly <ID>\`*`;
      view += `\n` + UI.boxEnd();
      return message.reply(view);
    }

    // ==========================================
    // 📖 SOUS-COMMANDE : STORY (CAMPAGNE NARRATIVE)
    // ==========================================
    if (subCommand === "story") {
      if (!qData.activeStory) {
        return message.reply("👑 | Félicitations ! Vous avez achevé la totalité des arcs narratifs de la campagne principale !");
      }

      const q = qData.activeStory;
      const diff = DIFFICULTIES[q.difficulty];
      const status = q.claimed ? "✅ EXPÉDIÉE" : (q.current >= q.target ? "⭐ COMPLÉTÉE (claim)" : "⚔️ ACTIVE");

      let view = UI.boxStart(`Histoire : Chapitre ${q.step}`) + `\n`;
      view += `🎬 Épopée : **${q.name}**\n`;
      view += `${UI.line}\n`;
      view += `│ 🎯 Défi impérial : ${q.text}\n`;
      view += `│ 📊 Avancement : ${UI.progressBar(q.current, q.target)} [${q.current}/${q.target}]\n`;
      view += `│ 🛡️ Difficulté narrative : ${diff.color} **${diff.name}**\n`;
      view += `│ 💰 Dotation royale : +${q.reward.money.toLocaleString()}$ | +${q.reward.xp} XP\n`;
      view += `│ ⚡ Alignement : \`${status}\`\n`;
      view += `${UI.line}\nℹ️ *Encaisser la récompense et passer à la suite : \`quest claim story\`*`;
      view += `\n` + UI.boxEnd();
      return message.reply(view);
    }

    // ==========================================
    // 🕵️ SOUS-COMMANDE : SECRET (CONTRATS CLASSIFIÉS)
    // ==========================================
    if (subCommand === "secret") {
      // Les quêtes secrètes se débloquent à 7% de chance lors des combats arena ou explorations pirate
      if (!qData.secret || qData.secret.length === 0) {
        return message.reply("🕵️ | Aucun document classifié n'est disponible. Poursuivez vos actions dans `arena` et `pirate` pour intercepter un signal crypté.");
      }

      let view = UI.boxStart("Contrats Secrets Résolus") + `\n`;
      qData.secret.forEach(q => {
        const diff = DIFFICULTIES[q.difficulty];
        const status = q.claimed ? "✅ RETIRÉ" : (q.current >= q.target ? "⭐ DECRYPTÉ (claim)" : "📡 EN ÉCOUTE");
        view += `👁️‍🗨️ [ID: **${q.id}**] Priorité : ${diff.color} **${diff.name}**\n`;
        view += `│ 🎯 Opération : ${q.text}\n`;
        view += `│ 📊 État des serveurs : ${UI.progressBar(q.current, q.target)} [${q.current}/${q.target}]\n`;
        view += `│ 💰 Prime d'agent : +${q.reward.money.toLocaleString()}$\n`;
        view += `│ ⚡ Statut : \`${status}\`\n${UI.line}\n`;
      });

      view += `ℹ️ *Évacuer les fonds secrets : \`quest claim secret <ID>\`*`;
      view += `\n` + UI.boxEnd();
      return message.reply(view);
    }

    // ==========================================
    // 💰 SOUS-COMMANDE : CLAIM (ENCAISSEMENT DES PRIMES)
    // ==========================================
    if (subCommand === "claim") {
      const type = args[1]?.toLowerCase();
      const targetId = args[2]?.toUpperCase();

      if (!type || !["daily", "weekly", "story", "secret"].includes(type)) {
        return message.reply("❌ | Spécifiez le registre de la quête : `quest claim <daily|weekly|story|secret> [ID]`");
      }

      let targetQuest = null;

      // Traitement spécifique à la quête narrative (Story) qui n'a pas d'ID aléatoire
      if (type === "story") {
        targetQuest = qData.activeStory;
        if (!targetQuest) return message.reply("❌ | Aucune quête d'histoire n'est active.");
        if (targetQuest.claimed) return message.reply("❌ | Vous avez déjà perçu les récompenses de ce chapitre.");
        if (targetQuest.current < targetQuest.target) {
          return message.reply(`❌ | Objectif inachevé. Finissez le travail : [${targetQuest.current}/${targetQuest.target}]`);
        }

        // Distribution des récompenses
        let userMoney = (await usersData.get(senderID)).money || 0;
        userMoney += targetQuest.reward.money;
        await usersData.set(senderID, { money: userMoney });

        qData.stats.totalCompleted += 1;
        qData.stats.totalGoldEarned += targetQuest.reward.money;
        qData.history.push(`[STORY] Chapitre ${targetQuest.step} - Réussi (+${targetQuest.reward.money}$)`);
        
        // Progression au chapitre suivant
        qData.storyStep += 1;
        qData.activeStory = null; // Sera régénéré au prochain appel

        savePlayerQuests(senderID, qData);
        return message.reply(`🎉 | **ÉPOPÉE ACCOMPLIE :** Vous validez le Chapitre **${targetQuest.step}** ! Vos coffres reçoivent **+${targetQuest.reward.money.toLocaleString()}$**.`);
      }

      // Traitement des quêtes à identifiant unique (daily, weekly, secret)
      if (!targetId) return message.reply("❌ | Veuillez mentionner l'ID de la mission à valider.");
      
      let questArray = qData[type];
      let questIndex = questArray.findIndex(q => q.id === targetId);

      if (questIndex === -1) return message.reply(`❌ | ID unique **${targetId}** introuvable dans votre registre de quêtes ${type}.`);
      targetQuest = questArray[questIndex];

      if (targetQuest.claimed) return message.reply("❌ | Cette prime a déjà été versée sur votre compte bancaire.");
      if (targetQuest.current < targetQuest.target) {
        return message.reply(`❌ | Objectif non atteint. Progression actuelle : [${targetQuest.current}/${targetQuest.target}]`);
      }

      // Interconnexion et application des multiplicateurs de familiers (Pet Connection)
      let petBonusMultiplier = 1.0;
      try {
        const petDBFile = path.join(__dirname, 'cache', 'petsMMO', 'player_pets.json');
        if (fs.existsSync(petDBFile)) {
          const petDB = JSON.parse(fs.readFileSync(petDBFile, 'utf8'));
          const playerPet = petDB[senderID];
          if (playerPet && playerPet.activePetId) {
            const activePetInstance = playerPet.inventory.find(p => p.uniqueId === playerPet.activePetId);
            if (activePetInstance && activePetInstance.hunger > 30) {
              // Si le familier est de la famille dragon (bonus d'XP globale)
              if (activePetInstance.baseId.includes("dragon")) petBonusMultiplier += 0.15;
            }
          }
        }
      } catch (err) { /* Sécurité anti-crash si le fichier pet n'existe pas encore */ }

      // Application financière des gains
      let finalGold = targetQuest.reward.money;
      let finalXp = Math.floor(targetQuest.reward.xp * petBonusMultiplier);

      let userMoney = (await usersData.get(senderID)).money || 0;
      userMoney += finalGold;
      await usersData.set(senderID, { money: userMoney });

      // Archivage des statistiques globales du joueur
      targetQuest.claimed = true;
      qData.stats.totalCompleted += 1;
      qData.stats.totalGoldEarned += finalGold;
      if (targetQuest.difficulty === "divine") qData.stats.divineCompleted += 1;
      if (targetQuest.type === "pirate_explore") qData.stats.pirateQuests += 1;

      qData.history.push(`[${type.toUpperCase()}] ${targetQuest.text} - Réussi (+${finalGold}$)`);

      // Vérification immédiate du déblocage des succès (Achievements Engine)
      Object.entries(ACHIEVEMENTS_DB).forEach(([key, value]) => {
        if (!qData.achievements.includes(key)) {
          if (key === "aventurier" && qData.stats.totalCompleted >= value.req) qData.achievements.push(key);
          if (key === "heros" && qData.stats.totalCompleted >= value.req) qData.achievements.push(key);
          if (key === "roi_pirate" && qData.stats.pirateQuests >= value.req) qData.achievements.push(key);
          if (key === "millionnaire" && qData.stats.totalGoldEarned >= value.req) qData.achievements.push(key);
          if (key === "legende" && qData.stats.divineCompleted >= value.req) qData.achievements.push(key);
        }
      });

      savePlayerQuests(senderID, qData);
      return message.reply(`🏆 | **CONTRAT REMPLI :** Félicitations ! Votre prime de **+${finalGold.toLocaleString()}$** et **+${finalXp} XP** (Bonus Familier inclus) a été octroyée.`);
    }

    // ==========================================
    // 🔄 SOUS-COMMANDE : REFRESH (REOUVERTURE DES BORDEREAUX)
    // ==========================================
    if (subCommand === "refresh") {
      // Cooldown technique de 10 minutes pour éviter le spam réseau
      if (!global.questRefreshCooldown) global.questRefreshCooldown = {};
      const lastRefresh = global.questRefreshCooldown[senderID] || 0;
      if (nowTime - lastRefresh < 10 * 60 * 1000) {
        const remaining = Math.ceil((10 * 60 * 1000 - (nowTime - lastRefresh)) / 1000 / 60);
        return message.reply(`⏳ | Le bureau des contrats est fermé. Revenez dans **${remaining} minute(s)**.`);
      }

      const refreshCost = 75000;
      let userMoney = (await usersData.get(senderID)).money || 0;
      if (userMoney < refreshCost) {
        return message.reply(`💰 | Les frais administratifs de réédition des contrats s'élèvent à **${refreshCost.toLocaleString()}$**.`);
      }

      // Facturation et re-génération immédiate du set quotidien
      userMoney -= refreshCost;
      await usersData.set(senderID, { money: userMoney });

      qData.daily = [
        generateRandomQuest("daily", "common"),
        generateRandomQuest("daily", "rare"),
        generateRandomQuest("daily", "epic")
      ];
      global.questRefreshCooldown[senderID] = nowTime;
      savePlayerQuests(senderID, qData);

      return message.reply(`🔄 | **CAHIER EN COURS DE RÉÉDITION :** Vos quêtes quotidiennes ont été réinitialisées pour **-${refreshCost.toLocaleString()}$**.`);
    }

    // ==========================================
    // 🏅 SOUS-COMMANDE : INFO (SALLE DES SUCCÈS)
    // ==========================================
    if (subCommand === "info" || subCommand === "achievements") {
      let cabinet = UI.boxStart("Panthéon des Succès") + `\n`;
      cabinet += `│ Total Quêtes Accomplies : **${qData.stats.totalCompleted}**\n`;
      cabinet += `│ Richesses Cumulées : **${qData.stats.totalGoldEarned.toLocaleString()}$**\n`;
      cabinet += `${UI.line}\n`;

      Object.entries(ACHIEVEMENTS_DB).forEach(([key, val]) => {
        const unlocked = qData.achievements.includes(key);
        cabinet += `${unlocked ? "🟢" : "🔒"} **${val.name}**\n│ ➔ *${val.desc}*\n`;
      });
      cabinet += UI.boxEnd();
      return message.reply(cabinet);
    }

    // ==========================================
    // 📖 SOUS-COMMANDE : HISTORY (GRAND LIVRE DES EXPLOITS)
    // ==========================================
    if (subCommand === "history") {
      if (!qData.history || qData.history.length === 0) {
        return message.reply("📋 | Votre casier militaire et vos archives d'aventurier sont totalement vierges.");
      }

      let book = `📖 **[ARCHIVES DE VOS EXPLOITS PASSE]**\n${UI.line}\n`;
      // Inversion pour afficher les quêtes terminées les plus récentes au sommet
      qData.history.slice(-12).reverse().forEach((log, index) => {
        book += `${index + 1}. ${log}\n`;
      });
      return message.reply(book);
        }
