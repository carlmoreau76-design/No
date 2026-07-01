/**
 * @file arena.js
 * @description Module de combat RPG PvE Premium avec système de mise financière pour GoatBot v2
 * @version 1.0.0
 * @author Collaborateur IA RPG
 */

const fs = require('fs');
const path = require('path');

// ==========================================
// 🛠️ CONFIGURATION DES ENNEMIS ET DIFFICULTÉS
// ==========================================
const MONSTERS_POOL = [
  { name: "Bandit de Grand Chemin", emoji: "🥷", difficulty: "Facile", mult: 1.5, hp: 400, atk: 45, def: 15, crit: 0.10, dodge: 0.05 },
  { name: "Ninja de l'Ombre", emoji: "🗡️", difficulty: "Moyen", mult: 1.8, hp: 550, atk: 65, def: 25, crit: 0.25, dodge: 0.20 },
  { name: "Automate de Combat", emoji: "🤖", difficulty: "Moyen", mult: 2.0, hp: 700, atk: 55, def: 45, crit: 0.05, dodge: 0.02 },
  { name: "Démon Primordial", emoji: "👹", difficulty: "Difficile", mult: 2.4, hp: 950, atk: 90, def: 55, crit: 0.15, dodge: 0.08 },
  { name: "Archi-Liche Immortelle", emoji: "🧙‍♂️", difficulty: "Difficile", mult: 2.8, hp: 1200, atk: 110, def: 60, crit: 0.20, dodge: 0.12 },
  { name: "Dragon Ancestral", emoji: "🐉", difficulty: "Légendaire", mult: 3.5, hp: 1800, atk: 160, def: 90, crit: 0.18, dodge: 0.05 },
  { name: "Dieu Déchu du Colisée", emoji: "👑", difficulty: "Mythique (Rare)", mult: 5.0, hp: 2500, atk: 220, def: 130, crit: 0.30, dodge: 0.15 }
];

// Cooldown anti-spam (en millisecondes)
const ARENA_COOLDOWN = 45 * 1000; // 45 secondes

const UI = {
  line: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
  boxStart: (title) => `╭───────────── ⚔️ ─────────────╮\n│ 🏟️  ${title.toUpperCase()}\n├───────────────────────────────`,
  boxEnd: () => `╰───────────────────────────────╯`,
  renderHpBar: (current, max) => {
    const percent = Math.max(0, Math.min(100, Math.floor((current / max) * 100)));
    const filled = Math.round(percent / 10);
    return "🟩".repeat(filled) + "⬛".repeat(10 - filled) + ` [${current}/${max}]`;
  }
};

module.exports = {
  config: {
    name: "arena",
    aliases: ["colisee", "fight", "combat"],
    version: "1.0.0",
    author: "Collaborateur IA RPG",
    countDown: 5,
    role: 0,
    description: "Affrontez des monstres et boss légendaires de l'arène en misant votre or !",
    category: "game",
    guide: { fr: "{p}arena <mise>", en: "{p}arena <bet>" }
  },

  onStart: async function ({ api, event, args, usersData, message }) {
    const { senderID, threadID, messageID } = event;

    // ==========================================
    // ⏳ GESTION DU COOLDOWN ANTI-SPAM
    // ==========================================
    if (!global.arenaCooldowns) global.arenaCooldowns = {};
    const lastFight = global.arenaCooldowns[senderID] || 0;
    if (Date.now() - lastFight < ARENA_COOLDOWN) {
      const remaining = Math.ceil((ARENA_COOLDOWN - (Date.now() - lastFight)) / 1000);
      return message.reply(`⏳ | Vos muscles sont engourdis. Attendez **${remaining} seconde(s)** avant de retourner dans l'arène.`);
    }

    // ==========================================
    // 💰 ANALYSE ET ENREGISTREMENT DE LA MISE
    // ==========================================
    let userData = await usersData.get(senderID);
    let userMoney = userData.money || 0;
    const betInput = args[0];

    if (!betInput) {
      return message.reply("❌ | Saisie incorrecte. Usage : `arena <montant de la mise>` ou `arena all`.");
    }

    let betAmount = 0;
    if (betInput.toLowerCase() === "all") {
      betAmount = userMoney;
    } else {
      betAmount = parseInt(betInput);
    }

    if (isNaN(betAmount) || betAmount <= 0) {
      return message.reply("❌ | Veuillez spécifier une mise financière valide et supérieure à 0$.");
    }

    if (betAmount < 1000) {
      return message.reply("❌ | La mise minimale requise pour entrer dans l'arène impériale est de **1 000$**.");
    }

    if (userMoney < betAmount) {
      return message.reply(`💰 | Vos réserves d'or sont insuffisantes pour honorer cette mise (${userMoney.toLocaleString()}$ possédés).`);
    }

    // Prélèvement conservatoire de la mise
    userMoney -= betAmount;
    await usersData.set(senderID, { money: userMoney });
    global.arenaCooldowns[senderID] = Date.now();

    // ==========================================
    // 👾 GÉNÉRATION DE L'ADVERSAIRE ET STATS RPG
    // ==========================================
    // Sélection aléatoire pondérée implicitement par la rareté (optionnel via array, ici équiprobable structuré)
    const monsterTemplate = MONSTERS_POOL[Math.floor(Math.random() * MONSTERS_POOL.length)];
    
    // Instanciation de l'adversaire (Légère fluctuation des stats d'une instance à l'autre pour le réalisme)
    const enemy = {
      name: monsterTemplate.name,
      emoji: monsterTemplate.emoji,
      difficulty: monsterTemplate.difficulty,
      multiplier: monsterTemplate.mult,
      maxHp: monsterTemplate.hp,
      hp: monsterTemplate.hp,
      atk: monsterTemplate.atk,
      def: monsterTemplate.def,
      crit: monsterTemplate.crit,
      dodge: monsterTemplate.dodge
    };

    // Instanciation du Joueur (Basée sur un profil de base évolutif)
    const player = {
      name: userData.name || "Aventurier",
      maxHp: 800,
      hp: 800,
      atk: 85,
      def: 30,
      crit: 0.15,
      dodge: 0.10
    };

    // Interconnexion optionnelle avec le module de familiers (Pet Connection)
    // Ajoute un bonus statistique si un familier actif est détecté
    try {
      const petDBFile = path.join(__dirname, 'cache', 'petsMMO', 'player_pets.json');
      if (fs.existsSync(petDBFile)) {
        const petDB = JSON.parse(fs.readFileSync(petDBFile, 'utf8'));
        const playerPetData = petDB[senderID];
        if (playerPetData && playerPetData.activePetId) {
          const activePet = playerPetData.inventory.find(p => p.uniqueId === playerPetData.activePetId);
          if (activePet && activePet.hunger > 20) {
            player.atk = Math.floor(player.atk * 1.12); // +12% ATK globale passive
            player.maxHp += 150;
            player.hp += 150;
          }
        }
      }
    } catch (e) { /* Protection silencieuse si le fichier pet n'existe pas */ }

    // Send initial loading message
    const initialMsg = await message.reply("🚪 | *Ouverture des portes des cellules... Les grilles se lèvent sous les clameurs de la foule !*");
    const msgID = initialMsg.messageID;

    // ==========================================
    // ⚔️ BOUCLE DU MOTEUR DE COMBAT AUTOMATIQUE
    // ==========================================
    let round = 1;
    let combatLog = "Le duel commence ! Préparez vos armes.\n";

    const combatInterval = setInterval(async () => {
      // Condition d'arrêt si l'un des combattants meurt ou si le nombre max de tours est dépassé
      if (player.hp <= 0 || enemy.hp <= 0 || round > 6) {
        clearInterval(combatInterval);
        return resolveCombat(api, threadID, msgID, senderID, player, enemy, betAmount, usersData);
      }

      let currentTurnLog = `👉 **[TOUR ${round}]**\n`;

      // ─── TOUR DU JOUEUR ───
      let playerDmgMsg = "";
      // Vérification Esquive de l'ennemi
      if (Math.random() < enemy.dodge) {
        playerDmgMsg = `💨 ${enemy.emoji} ${enemy.name} esquive l'assaut avec agilité !`;
      } else {
        // Calcul des dégâts de base avec une variance de +/- 15%
        const variance = 0.85 + Math.random() * 0.30;
        let finalPlayerAtk = Math.floor(player.atk * variance);
        
        // Atténuation par la défense de la cible
        let netDmg = Math.max(15, finalPlayerAtk - Math.floor(enemy.def / 2));
        
        // Coup critique ?
        if (Math.random() < player.crit) {
          netDmg = Math.floor(netDmg * 1.5);
          playerDmgMsg = `💥 **COUP CRITIQUE !** Vous infligez **${netDmg}** points de dégâts !`;
        } else {
          playerDmgMsg = `⚔️ Vous portez un coup et infligez **${netDmg}** points de dégâts.`;
        }
        enemy.hp = Math.max(0, enemy.hp - netDmg);
      }
      currentTurnLog += `│ ${playerDmgMsg}\n`;

      // ─── TOUR DE L'ENNEMI (Si encore en vie) ───
      if (enemy.hp > 0) {
        let enemyDmgMsg = "";
        if (Math.random() < player.dodge) {
          enemyDmgMsg = `🛡️ Vous effectuez une roulade tactique et esquivez la riposte !`;
        } else {
          const variance = 0.85 + Math.random() * 0.30;
          let finalEnemyAtk = Math.floor(enemy.atk * variance);
          let netEnemyDmg = Math.max(10, finalEnemyAtk - Math.floor(player.def / 2));

          if (Math.random() < enemy.crit) {
            netEnemyDmg = Math.floor(netEnemyDmg * 1.5);
            enemyDmgMsg = `🩸 **AÏE ! CRITIQUE !** ${enemy.emoji} vous inflige **${netEnemyDmg}** dégâts !`;
          } else {
            enemyDmgMsg = `💥 ${enemy.emoji} riposte violemment et vous inflige **${netEnemyDmg}** dégâts.`;
          }
          player.hp = Math.max(0, player.hp - netEnemyDmg);
        }
        currentTurnLog += `│ ${enemyDmgMsg}\n`;
      }

      // Construction de la trame visuelle mise à jour
      let turnFrame = UI.boxStart(`Combat : Round ${round}`) + `\n`;
      turnFrame += `│ 👤 **${player.name}** (Vous)\n`;
      turnFrame += `│ ❤️ HP : ${UI.renderHpBar(player.hp, player.maxHp)}\n`;
      turnFrame += `${UI.line}\n`;
      turnFrame += `│ ${enemy.emoji} **${enemy.name}** [${enemy.difficulty}]\n`;
      turnFrame += `│ ❤️ HP : ${UI.renderHpBar(enemy.hp, enemy.maxHp)}\n`;
      turnFrame += `${UI.line}\n`;
      turnFrame += `${currentTurnLog}`;
      turnFrame += UI.boxEnd();

      // Édition dynamique du message Discord
      try {
        await api.editMessage(turnFrame, msgID, threadID);
      } catch (err) {
        clearInterval(combatInterval); // Arrêt de secours si le message a été supprimé
      }

      round++;
    }, 2500); // Latence de 2.5 secondes par tour pour permettre la lecture des animations
  }
};

// ==========================================
// 🏆 RÉSOLUTION DU COMBAT ET VERSEMENTS
// ==========================================
async function resolveCombat(api, threadID, msgID, uid, player, enemy, betAmount, usersData) {
  let userData = await usersData.get(uid);
  let currentMoney = userData.money || 0;
  
  const isPlayerVictorious = player.hp > enemy.hp;
  let finalResultBox = UI.boxStart("Fin du Combat") + `\n`;

  if (isPlayerVictorious) {
    // Calcul des gains de victoire indexés sur le multiplicateur de difficulté
    const grossWinnings = Math.floor(betAmount * enemy.multiplier);
    currentMoney += grossWinnings;
    await usersData.set(uid, { money: currentMoney });

    finalResultBox += `🏆 **VICTOIRE ÉCLATANTE !**\n`;
    finalResultBox += `│ Vous terrassez le ${enemy.name} sous les hourras de la foule !\n`;
    finalResultBox += `│ 💰 Gain Total : **+${grossWinnings.toLocaleString()}$** (Mise multipliée x${enemy.multiplier})\n`;
    finalResultBox += `│ 👑 Statut de votre solde : ${currentMoney.toLocaleString()}$\n`;

    // 🔗 INTERCONNEXION EXTÉRIEURE AVEC LE MODULE DE QUÊTES (Quest Connection)
    try {
      const questModule = require('./quest.js');
      if (questModule && typeof questModule.incrementProgress === 'function') {
        // Met à jour l'objectif global "arena_win" de l'utilisateur
        questModule.incrementProgress(uid, "arena_win", 1);
      }
    } catch (e) {
      // Liaison transparente s'exécutant sans erreur si quest.js n'est pas déployé
    }

  } else {
    // Défaite de l'utilisateur (La mise a déjà été retirée au début)
    finalResultBox += `💀 **DÉFAITE CRUELLE...**\n`;
    finalResultBox += `│ Votre corps inanimé est traîné hors du sable de l'arène.\n`;
    finalResultBox += `│ 💸 Vous perdez l'intégralité de votre mise : **-${betAmount.toLocaleString()}$**\n`;
    finalResultBox += `│ 🛡️ Entraînez-vous et retentez votre chance à la prochaine session.\n`;
  }

  finalResultBox += UI.boxEnd();
  
  try {
    await api.editMessage(finalResultBox, msgID, threadID);
  } catch (err) {
    // En cas d'erreur de modification, envoi d'un message de secours standard
    api.sendMessage(finalResultBox, threadID);
  }
        }
