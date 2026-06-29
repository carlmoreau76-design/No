/**
 * @file arena.js
 * @description Système de combat RPG PvE premium pour GoatBot v2 (Node.js)
 * @command battle <mise>
 * @credits Format GoatBot v2
 */

const cooldowns = new Map();

module.exports = {
  config: {
    name: "arena",
    version: "2.5.0",
    author: "Gemini AI",
    countDown: 5,
    role: 0, // 0: Tous les utilisateurs, 1: Admins, etc.
    description: "Affrontez un monstre dans l'arène RPG et tentez de multiplier votre mise !",
    category: "jeux",
    guide: {
      en: "{p}arena <mise> - Lance un combat dans l'arène.",
      vi: "{p}arena <mise> - Trận đấu đấu trường."
    }
  },

  onStart: async function ({ api, event, args, usersData, message }) {
    const { threadID, messageID, senderID } = event;
    
    // 1. Gestion du Cooldown Anti-Spam (30 secondes)
    const now = Date.now();
    const cooldownAmount = 30000; 
    if (cooldowns.has(senderID)) {
      const expirationTime = cooldowns.get(senderID) + cooldownAmount;
      if (now < expirationTime) {
        const timeLeft = ((expirationTime - now) / 1000).toFixed(1);
        return message.reply(`⏳ | **${await usersData.getName(senderID)}**, vos guerriers se reposent. Attendez **${timeLeft}s** avant de retourner dans l'arène !`);
      }
    }

    // 2. Validation de la mise
    const betInput = args[0];
    if (!betInput) {
      return message.reply("⚔️ | **Arène de Combat**\nUtilisation : `arena <mise>` ou `arena all` (Mise minimum : 50$).");
    }

    // Récupération des données du joueur
    let userData = await usersData.get(senderID);
    let userMoney = userData.money || 0;

    let bet = 0;
    if (betInput.toLowerCase() === "all") {
      bet = userMoney;
    } else {
      bet = parseInt(betInput);
    }

    if (isNaN(bet) || bet < 50) {
      return message.reply("❌ | Le montant de votre mise doit être un nombre valide et supérieur ou égal à **50$**.");
    }

    if (userMoney < bet) {
      return message.reply(`❌ | Vous n'avez pas assez d'argent ! Votre solde actuel est de **${userMoney}$**.`);
    }

    // Activer le cooldown immédiatement après validation
    cooldowns.set(senderID, now);

    // Déduire la mise du compte du joueur
    userMoney -= bet;
    await usersData.set(senderID, { money: userMoney });

    // 3. Configuration de la base de données des monstres (RPG Stats avec système de poids)
    const monsterDatabase = [
      { name: "Bandit de Grand Chemin", emoji: "🥷", difficulty: "Facile", hp: 120, atk: 18, def: 5, crit: 0.10, dodge: 0.08, mult: 1.5, weight: 40 },
      { name: "Golem de Pierre", emoji: "🪨", difficulty: "Normal", hp: 220, atk: 14, def: 20, crit: 0.05, dodge: 0.02, mult: 1.8, weight: 25 },
      { name: "Robot de Combat Prototype", emoji: "🤖", difficulty: "Normal", hp: 160, atk: 24, def: 12, crit: 0.15, dodge: 0.10, mult: 2.0, weight: 15 },
      { name: "Démon du Néant", emoji: "😈", difficulty: "Difficile", hp: 200, atk: 32, def: 15, crit: 0.20, dodge: 0.12, mult: 2.5, weight: 12 },
      { name: "Dragon Ancestral", emoji: "🐉", difficulty: "LÉGENDAIRE", hp: 350, atk: 45, def: 25, crit: 0.25, dodge: 0.15, mult: 4.0, weight: 8 }
    ];

    // Sélection pondérée (Les monstres légendaires sont plus rares)
    let totalWeight = monsterDatabase.reduce((sum, m) => sum + m.weight, 0);
    let randomWeight = Math.random() * totalWeight;
    let enemyTemplate = monsterDatabase[0];

    for (const monster of monsterDatabase) {
      randomWeight -= monster.weight;
      if (randomWeight <= 0) {
        enemyTemplate = monster;
        break;
      }
    }

    // 4. Initialisation des Combattants
    const userName = await usersData.getName(senderID);
    const player = {
      name: userName,
      emoji: "🛡️",
      hp: 200,
      maxHp: 200,
      atk: 25,
      def: 10,
      crit: 0.15, // 15% de chance de coup critique
      dodge: 0.10 // 10% de chance d'esquive
    };

    const enemy = {
      name: enemyTemplate.name,
      emoji: enemyTemplate.emoji,
      difficulty: enemyTemplate.difficulty,
      hp: enemyTemplate.hp,
      maxHp: enemyTemplate.hp,
      atk: enemyTemplate.atk,
      def: enemyTemplate.def,
      crit: enemyTemplate.crit,
      dodge: enemyTemplate.dodge,
      mult: enemyTemplate.mult
    };

    // Fonction de génération de barre de vie visuelle (10 blocs)
    function generateHPBar(hp, maxHp) {
      const percentage = Math.max(0, Math.min(1, hp / maxHp));
      const filledLength = Math.round(percentage * 10);
      const emptyLength = 10 - filledLength;
      const filledBar = "🟩".repeat(filledLength);
      const emptyBar = "⬛".repeat(emptyLength);
      return `${filledBar}${emptyBar} (${Math.max(0, hp)}/${maxHp} HP)`;
    }

    // Message d'introduction du combat
    let introText = `🏟️ **BIENVENUE DANS L'ARÈNE DES GLADIATEURS** 🏟️\n`;
    introText += `━━━━━━━━━━━━━━━━━━\n`;
    introText += `👤 **Joueur :** ${player.name}\n💰 **Mise engagée :** ${bet}$\n\n`;
    introText += `⚔️ **Adversaire généré :** ${enemy.emoji} **${enemy.name}**\n`;
    introText += `🔴 **Difficulté :** [ ${enemy.difficulty} ]\n`;
    introText += `🎁 **Multiplicateur de gain :** x${enemy.mult}\n`;
    introText += `━━━━━━━━━━━━━━━━━━\n`;
    introText += `*Le combat va commencer dans quelques instants...*`;

    const battleMsg = await message.reply(introText);
    const battleMsgID = battleMsg.messageID;

    let round = 1;
    let logs = [];

    function delay(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Boucle de combat au tour par tour (synchrone avec édition)
    while (player.hp > 0 && enemy.hp > 0 && round <= 20) {
      await delay(2500); // 2.5s d'attente pour que l'utilisateur lise chaque action
      logs = [];

      // --- TOUR DU JOUEUR ---
      logs.push(`👉 **Tour ${round} : À ton tour !**`);
      
      if (Math.random() < enemy.dodge) {
        logs.push(`💨 ${enemy.emoji} **${enemy.name}** a esquivé ton attaque avec agilité !`);
      } else {
        let baseDmg = player.atk + Math.floor(Math.random() * 9) - 4; // Atk de base ± 4
        let isCrit = Math.random() < player.crit;
        if (isCrit) baseDmg = Math.floor(baseDmg * 1.5);
        
        let finalDmg = Math.max(3, baseDmg - enemy.def); // Réduction par la défense (min 3)
        enemy.hp -= finalDmg;
        
        logs.push(`${isCrit ? "💥 **COUP CRITIQUE !** " : "⚔️ "}${player.name} inflige **${finalDmg}** points de dégâts à l'ennemi.`);
      }

      if (enemy.hp <= 0) {
        enemy.hp = 0;
        logs.push(`💀 ${enemy.emoji} **${enemy.name}** s'effondre au sol !`);
        break;
      }

      // --- TOUR DE L'ENNEMI ---
      logs.push(`\n👈 **Le monstre contre-attaque !**`);
      
      if (Math.random() < player.dodge) {
        logs.push(`💨🛡️ Tu as superbement esquivé l'attaque de **${enemy.name}** !`);
      } else {
        let baseDmgEnemy = enemy.atk + Math.floor(Math.random() * 7) - 3;
        let isCritEnemy = Math.random() < enemy.crit;
        if (isCritEnemy) baseDmgEnemy = Math.floor(baseDmgEnemy * 1.5);

        let finalDmgEnemy = Math.max(3, baseDmgEnemy - player.def);
        player.hp -= finalDmgEnemy;

        logs.push(`${isCritEnemy ? "🩸 **BRUTAL !** " : "💥 "}${enemy.emoji} **${enemy.name}** te flanque **${finalDmgEnemy}** points de dégâts.`);
      }

      if (player.hp <= 0) {
        player.hp = 0;
        logs.push(`💀 Tu as succombé aux blessures du combat...`);
        break;
      }

      // Formatage visuel du tour de jeu actuel
      let roundTemplate = `🏟️ **ARÈNE - TOUR ${round}** 🏟️\n`;
      roundTemplate += `━━━━━━━━━━━━━━━━━━\n`;
      roundTemplate += `👤 **${player.name}** (Toi)\n`;
      roundTemplate += `${generateHPBar(player.hp, player.maxHp)}\n\n`;
      roundTemplate += `${enemy.emoji} **${enemy.name}** (Niveau: ${enemy.difficulty})\n`;
      roundTemplate += `${generateHPBar(enemy.hp, enemy.maxHp)}\n`;
      roundTemplate += `━━━━━━━━━━━━━━━━━━\n`;
      roundTemplate += `📜 **Actions du tour :**\n${logs.join("\n")}`;

      // Édition en direct de l'état du combat
      try {
        await api.editMessage(roundTemplate, battleMsgID);
      } catch (err) {
        await message.reply(roundTemplate);
      }

      round++;
    }

    // 5. Fin du match et distribution de l'argent via usersData
    await delay(2500);
    let finalUserData = await usersData.get(senderID);
    let currentMoney = finalUserData.money || 0;

    let endTemplate = "";
    if (player.hp > 0 && enemy.hp === 0) {
      // Calcul de la récompense
      const winnings = Math.floor(bet * enemy.mult);
      currentMoney += winnings;
      await usersData.set(senderID, { money: currentMoney });

      endTemplate += `👑 **VICTOIRE ÉPIQUE DANS L'ARÈNE !** 👑\n`;
      endTemplate += `━━━━━━━━━━━━━━━━━━\n`;
      endTemplate += `🥳 Félicitations **${player.name}**, tu as terrassé l'infâme **${enemy.name}** au bout de **${round - 1}** tours intenses !\n\n`;
      endTemplate += `💰 **Mise initiale :** ${bet}$\n`;
      endTemplate += `🏆 **Gain net remporté (x${enemy.mult}) :** +${winnings}$\n`;
      endTemplate += `💳 **Nouveau solde :** ${currentMoney}$\n`;
      endTemplate += `━━━━━━━━━━━━━━━━━━\n`;
      endTemplate += `✨ Rentrez au village en héros ! ✨`;
    } else {
      endTemplate += `💀 **DÉFAITE CUISANTE...** 💀\n`;
      endTemplate += `━━━━━━━━━━━━━━━━━━\n`;
      endTemplate += `🩸 Tragique destin ! **${player.name}** a été terrassé par le **${enemy.name}**.\n`;
      endTemplate += `L'arène réclame ton corps et ton or...\n\n`;
      endTemplate += `💸 **Mise perdue :** -${bet}$\n`;
      endTemplate += `💳 **Nouveau solde :** ${currentMoney}$\n`;
      endTemplate += `━━━━━━━━━━━━━━━━━━\n`;
      endTemplate += `💪 Entraînez-vous, améliorez votre équipement et revenez plus fort !`;
    }

    try {
      await api.editMessage(endTemplate, battleMsgID);
    } catch (err) {
      await message.reply(endTemplate);
    }
  }
};
