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
    category: "game",
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
  { name: "Bandit de Grand Chemin", emoji: "🕴️", difficulty: "Facile", hp: 120, atk: 18, def: 5, crit: 0.10, dodge: 0.08, mult: 1.5, weight: 40 },
  { name: "Gobelin Voleur", emoji: "👺", difficulty: "Facile", hp: 100, atk: 16, def: 4, crit: 0.08, dodge: 0.10, mult: 1.4, weight: 38 },
  { name: "Loup Sauvage", emoji: "🐺", difficulty: "Facile", hp: 110, atk: 19, def: 5, crit: 0.09, dodge: 0.12, mult: 1.5, weight: 36 },
  { name: "Squelette Guerrier", emoji: "💀", difficulty: "Facile", hp: 130, atk: 17, def: 7, crit: 0.08, dodge: 0.06, mult: 1.5, weight: 35 },
  { name: "Zombie Infecté", emoji: "🧟", difficulty: "Facile", hp: 145, atk: 15, def: 8, crit: 0.05, dodge: 0.03, mult: 1.6, weight: 33 },
  { name: "Pirate Maudit", emoji: "🏴‍☠️", difficulty: "Facile", hp: 135, atk: 20, def: 6, crit: 0.11, dodge: 0.07, mult: 1.6, weight: 32 },
  { name: "Ninja Débutant", emoji: "🥷", difficulty: "Facile", hp: 115, atk: 22, def: 5, crit: 0.12, dodge: 0.15, mult: 1.7, weight: 30 },
  { name: "Soldat Rebelle", emoji: "🪖", difficulty: "Facile", hp: 150, atk: 18, def: 10, crit: 0.08, dodge: 0.05, mult: 1.7, weight: 28 },
  { name: "Golem de Pierre", emoji: "🪨", difficulty: "Normal", hp: 220, atk: 14, def: 20, crit: 0.05, dodge: 0.02, mult: 1.8, weight: 25 },
  { name: "Robot Prototype", emoji: "🤖", difficulty: "Normal", hp: 160, atk: 24, def: 12, crit: 0.15, dodge: 0.10, mult: 2.0, weight: 24 },
  { name: "Chevalier Noir", emoji: "⚔️", difficulty: "Normal", hp: 200, atk: 23, def: 15, crit: 0.12, dodge: 0.08, mult: 2.0, weight: 23 },
  { name: "Mage Élémentaire", emoji: "🧙", difficulty: "Normal", hp: 170, atk: 28, def: 9, crit: 0.18, dodge: 0.08, mult: 2.1, weight: 22 },
  { name: "Samouraï", emoji: "⚔️", difficulty: "Normal", hp: 180, atk: 26, def: 11, crit: 0.18, dodge: 0.14, mult: 2.1, weight: 21 },
  { name: "Orc Berserker", emoji: "👹", difficulty: "Normal", hp: 240, atk: 25, def: 10, crit: 0.15, dodge: 0.05, mult: 2.2, weight: 20 },
  { name: "Tigre Géant", emoji: "🐅", difficulty: "Normal", hp: 175, atk: 29, def: 8, crit: 0.18, dodge: 0.14, mult: 2.2, weight: 19 },
  { name: "Sorcier Noir", emoji: "🔮", difficulty: "Normal", hp: 165, atk: 30, def: 9, crit: 0.20, dodge: 0.10, mult: 2.3, weight: 18 },
  { name: "Robot Assassin", emoji: "🤖", difficulty: "Normal", hp: 180, atk: 31, def: 10, crit: 0.20, dodge: 0.16, mult: 2.4, weight: 17 },
  { name: "Garde Royal", emoji: "🛡️", difficulty: "Normal", hp: 230, atk: 22, def: 18, crit: 0.10, dodge: 0.08, mult: 2.3, weight: 16 },
  { name: "Démon du Néant", emoji: "😈", difficulty: "Difficile", hp: 200, atk: 32, def: 15, crit: 0.20, dodge: 0.12, mult: 2.5, weight: 15 },
  { name: "Hydre", emoji: "🐍", difficulty: "Difficile", hp: 290, atk: 31, def: 18, crit: 0.18, dodge: 0.10, mult: 2.6, weight: 14 },
  { name: "Phénix", emoji: "🔥", difficulty: "Difficile", hp: 240, atk: 36, def: 14, crit: 0.22, dodge: 0.18, mult: 2.8, weight: 13 },
  { name: "Titan", emoji: "🗿", difficulty: "Difficile", hp: 330, atk: 34, def: 22, crit: 0.15, dodge: 0.04, mult: 2.9, weight: 12 },
  { name: "Liche", emoji: "☠️", difficulty: "Difficile", hp: 250, atk: 38, def: 13, crit: 0.25, dodge: 0.12, mult: 3.0, weight: 11 },
  { name: "Dragon Noir", emoji: "🐉", difficulty: "Difficile", hp: 340, atk: 42, def: 20, crit: 0.23, dodge: 0.10, mult: 3.2, weight: 10 },
  { name: "Ange Déchu", emoji: "😇", difficulty: "Difficile", hp: 280, atk: 40, def: 18, crit: 0.25, dodge: 0.18, mult: 3.3, weight: 9 },
  { name: "Gardien des Abysses", emoji: "🌊", difficulty: "Difficile", hp: 310, atk: 39, def: 21, crit: 0.22, dodge: 0.10, mult: 3.4, weight: 8 },
  { name: "Seigneur Vampire", emoji: "🧛", difficulty: "Difficile", hp: 270, atk: 41, def: 17, crit: 0.24, dodge: 0.16, mult: 3.5, weight: 7 },
  { name: "Dragon Ancestral", emoji: "🐉", difficulty: "LÉGENDAIRE", hp: 350, atk: 45, def: 25, crit: 0.25, dodge: 0.15, mult: 4.0, weight: 6 },
  { name: "Roi Démon", emoji: "👑", difficulty: "LÉGENDAIRE", hp: 420, atk: 50, def: 30, crit: 0.28, dodge: 0.15, mult: 4.3, weight: 5 },
  { name: "Dieu de la Foudre", emoji: "⚡", difficulty: "LÉGENDAIRE", hp: 400, atk: 54, def: 24, crit: 0.30, dodge: 0.20, mult: 4.5, weight: 5 },
  { name: "Empereur Dragon", emoji: "🐲", difficulty: "LÉGENDAIRE", hp: 450, atk: 52, def: 30, crit: 0.30, dodge: 0.16, mult: 4.8, weight: 4 },
  { name: "Titan Primordial", emoji: "🗿", difficulty: "LÉGENDAIRE", hp: 520, atk: 48, def: 38, crit: 0.18, dodge: 0.08, mult: 5.0, weight: 4 },
  { name: "Gardien Cosmique", emoji: "🌌", difficulty: "LÉGENDAIRE", hp: 470, atk: 56, def: 30, crit: 0.30, dodge: 0.18, mult: 5.2, weight: 3 },
  { name: "Roi des Ombres", emoji: "🌑", difficulty: "LÉGENDAIRE", hp: 440, atk: 58, def: 28, crit: 0.35, dodge: 0.22, mult: 5.5, weight: 3 },
  { name: "Leviathan", emoji: "🐋", difficulty: "LÉGENDAIRE", hp: 550, atk: 55, def: 35, crit: 0.22, dodge: 0.10, mult: 5.7, weight: 2 },
  { name: "Dieu du Chaos", emoji: "🦹", difficulty: "MYTHIQUE", hp: 620, atk: 65, def: 40, crit: 0.35, dodge: 0.20, mult: 6.5, weight: 2 },
  { name: "Créateur des Mondes", emoji: "✨", difficulty: "MYTHIQUE", hp: 700, atk: 70, def: 45, crit: 0.38, dodge: 0.22, mult: 7.0, weight: 1 },
  { name: "GOAT SHADE", emoji: "🐐👑", difficulty: "ULTIME", hp: 999, atk: 99, def: 60, crit: 0.50, dodge: 0.35, mult: 10.0, weight: 1 },
  { name: "Renard Mystique", emoji: "🦊", difficulty: "Normal", hp: 180, atk: 25, def: 12, crit: 0.18, dodge: 0.20, mult: 2.3, weight: 12 },
  { name: "Kraken", emoji: "🐙", difficulty: "Difficile", hp: 370, atk: 40, def: 24, crit: 0.20, dodge: 0.08, mult: 3.6, weight: 7 },
  { name: "Yéti", emoji: "❄️", difficulty: "Normal", hp: 260, atk: 27, def: 18, crit: 0.10, dodge: 0.05, mult: 2.5, weight: 15 },
  { name: "Cyclope", emoji: "👁️", difficulty: "Normal", hp: 250, atk: 30, def: 16, crit: 0.12, dodge: 0.05, mult: 2.6, weight: 14 },
  { name: "Minotaure", emoji: "🐂", difficulty: "Difficile", hp: 320, atk: 38, def: 20, crit: 0.18, dodge: 0.08, mult: 3.1, weight: 10 },
  { name: "Esprit Ancien", emoji: "👻", difficulty: "Difficile", hp: 230, atk: 42, def: 10, crit: 0.30, dodge: 0.25, mult: 3.2, weight: 8 },
  { name: "Gardien Céleste", emoji: "☁️", difficulty: "LÉGENDAIRE", hp: 480, atk: 52, def: 28, crit: 0.28, dodge: 0.20, mult: 5.0, weight: 3 },
  { name: "Robot Suprême", emoji: "🤖", difficulty: "LÉGENDAIRE", hp: 500, atk: 58, def: 32, crit: 0.30, dodge: 0.15, mult: 5.3, weight: 2 },
  { name: "Dragon de Cristal", emoji: "💎", difficulty: "MYTHIQUE", hp: 650, atk: 68, def: 42, crit: 0.35, dodge: 0.20, mult: 6.8, weight: 1 },
  { name: "Seigneur du Temps", emoji: "⏳", difficulty: "MYTHIQUE", hp: 720, atk: 72, def: 48, crit: 0.40, dodge: 0.25, mult: 7.5, weight: 1 }
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
