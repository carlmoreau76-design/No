/**
 * @file pirate.js
 * @description Système RPG Pirate Ultra Premium Multi-Équipages pour GoatBot v2 avec Token Avatar
 * @command pirate
 * @credits Format GoatBot v2 & Canvas Engine Premium
 */

const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

// Chemins de sauvegarde des données
const DATA_DIR = path.join(__dirname, 'cache', 'pirateData');
const CLANS_FILE = path.join(DATA_DIR, 'crews.json');
const PLAYERS_FILE = path.join(DATA_DIR, 'players.json');
const COOLDOWNS_FILE = path.join(DATA_DIR, 'cooldowns.json');

// Création des dossiers si inexistants
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(CLANS_FILE)) fs.writeFileSync(CLANS_FILE, JSON.stringify({}, null, 2));
if (!fs.existsSync(PLAYERS_FILE)) fs.writeFileSync(PLAYERS_FILE, JSON.stringify({}, null, 2));
if (!fs.existsSync(COOLDOWNS_FILE)) fs.writeFileSync(COOLDOWNS_FILE, JSON.stringify({}, null, 2));

// Jeton d'accès Facebook pour les avatars
const FB_TOKEN = "6628568379|c1e620fa708a1d5696fb991c1bde5662";

// Système d'invitations en mémoire volatile
const activeInvites = new Map();

// --- BASES DE DONNÉES DU JEU ---
const SHIPS_DB = {
  barque: { name: "Barque Pourrie", hp: 100, def: 5, speed: 10, maxMembers: 3, canons: 2, treasureChance: 0.05, cost: 0, emoji: "🛶" },
  voilier: { name: "Voilier de Fortune", hp: 250, def: 15, speed: 20, maxMembers: 5, canons: 4, treasureChance: 0.10, cost: 5000, emoji: "⛵" },
  brick: { name: "Brick Agile", hp: 500, def: 30, speed: 35, maxMembers: 8, canons: 8, treasureChance: 0.15, cost: 25000, emoji: "🚢" },
  fregate: { name: "Frégate Tempête", hp: 1000, def: 60, speed: 45, maxMembers: 12, canons: 16, treasureChance: 0.20, cost: 75000, emoji: "🛥️" },
  galion: { name: "Galion Royal", hp: 2500, def: 120, speed: 30, maxMembers: 20, canons: 32, treasureChance: 0.25, cost: 250000, emoji: "🔱" },
  blackpearl: { name: "Black Pearl", hp: 5000, def: 200, speed: 65, maxMembers: 30, canons: 50, treasureChance: 0.35, cost: 750000, emoji: "🏴‍☠️" },
  ghostship: { name: "Vaisseau Fantôme", hp: 8000, def: 300, speed: 55, maxMembers: 35, canons: 60, treasureChance: 0.40, cost: 1500000, emoji: "👻" },
  leviathan_ship: { name: "Léviathan des Mers", hp: 15000, def: 500, speed: 40, maxMembers: 50, canons: 100, treasureChance: 0.50, cost: 5000000, emoji: "🐉" }
};

const BOSS_DB = [
  { name: "Le Kraken Captif", hp: 4000, atk: 180, def: 80, reward: 80000, xp: 500, emoji: "🦑" },
  { name: "Le Spectre de Davy Jones", hp: 7500, atk: 250, def: 150, reward: 150000, xp: 1000, emoji: "💀" },
  { name: "Poséidon Courroucé", hp: 15000, atk: 450, def: 300, reward: 400000, xp: 2500, emoji: "🔱" },
  { name: "Le Roi Pirate Maudit", hp: 25000, atk: 600, def: 450, reward: 1000000, xp: 6000, emoji: "👑" }
];

// --- FONCTIONS INTERNES ---
function readJSON(file) { return JSON.parse(fs.readFileSync(file, 'utf8')); }
function writeJSON(file, data) { fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8'); }

function getPlayer(uid) {
  const players = readJSON(PLAYERS_FILE);
  if (!players[uid]) {
    players[uid] = { uid, crewId: null, level: 1, xp: 0, rank: "Mousse", totalTreasure: 0, rubis: 0, diamants: 0, perles: 0 };
    writeJSON(PLAYERS_FILE, players);
  }
  return players[uid];
}

function updatePlayer(uid, data) {
  const players = readJSON(PLAYERS_FILE);
  players[uid] = { ...getPlayer(uid), ...data };
  writeJSON(PLAYERS_FILE, players);
}

function getCrew(crewId) {
  const crews = readJSON(CLANS_FILE);
  return crews[crewId] || null;
}

function updateCrew(crewId, data) {
  const crews = readJSON(CLANS_FILE);
  if (crews[crewId]) {
    crews[crewId] = { ...crews[crewId], ...data };
    writeJSON(CLANS_FILE, crews);
  }
}

function drawRoundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

// Génération d'une interface néon premium avec intégration du token sécurisé
async function generatePremiumCard(title, subtitle, stats = [], uid = null) {
  const canvas = createCanvas(700, 450);
  const ctx = canvas.getContext('2d');

  // Fond Sombre Cyber-Pirate
  ctx.fillStyle = '#0b0c10';
  ctx.fillRect(0, 0, 700, 450);

  // Grille de fond subtile
  ctx.strokeStyle = 'rgba(255, 0, 0, 0.03)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 700; i += 30) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 450); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(700, i); ctx.stroke();
  }

  // Cadre Néon Rouge / Or Éclatant
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#ff0055';
  ctx.shadowColor = '#ff0055';
  ctx.shadowBlur = 15;
  drawRoundRect(ctx, 20, 20, 660, 410, 20);
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Titre principal
  ctx.fillStyle = '#ffd700'; 
  ctx.font = 'bold 32px sans-serif';
  ctx.fillText(title.toUpperCase(), 50, 70);

  // Sous-titre
  ctx.fillStyle = '#66fcf1';
  ctx.font = 'italic 18px sans-serif';
  ctx.fillText(subtitle, 50, 105);

  // Ligne de séparation
  ctx.strokeStyle = 'rgba(255, 215, 0, 0.4)';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(50, 125); ctx.lineTo(650, 125); ctx.stroke();

  // Affichage des statistiques structurées
  ctx.fillStyle = '#ffffff';
  ctx.font = '18px sans-serif';
  let posY = 170;
  stats.forEach(stat => {
    ctx.fillStyle = '#ffd700';
    ctx.fillText(stat.label + " :", 50, posY);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(stat.value, 220, posY);
    posY += 35;
  });

  // Gestion et affichage de l'avatar avec le Token fourni
  if (uid) {
    try {
      const avatarUrl = `https://graph.facebook.com/${uid}/picture?width=512&height=512&access_token=${encodeURIComponent(FB_TOKEN)}`;
      const avatar = await loadImage(avatarUrl);
      ctx.save();
      ctx.beginPath();
      ctx.arc(540, 240, 80, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(avatar, 460, 160, 160, 160);
      ctx.restore();

      ctx.lineWidth = 3;
      ctx.strokeStyle = '#ffd700';
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(540, 240, 80, 0, Math.PI * 2, true);
      ctx.stroke();
      ctx.shadowBlur = 0;
    } catch (e) {
      // Évite le crash si l'API Facebook ou le token rencontre un problème réseau
    }
  }

  return canvas.toBuffer();
}

module.exports = {
  config: {
    name: "pirate",
    version: "3.1.0",
    author: "Gemini Engine",
    countDown: 3,
    role: 0,
    description: "Système de simulation de piraterie RPG premium multi-équipages.",
    category: "economy",
    guide: {
      fr: "{p}pirate crew create <nom> | explore | battle | war <nom_equipage> | info | upgrade",
      en: "{p}pirate crew create <name> | explore | battle | war <crew_name> | info | upgrade"
    }
  },

  onStart: async function ({ api, event, args, usersData, message }) {
    const { threadID, messageID, senderID } = event;
    const subCommand = args[0]?.toLowerCase();
    const action = args[1]?.toLowerCase();

    let player = getPlayer(senderID);
    let uData = await usersData.get(senderID);
    let userMoney = uData.money || 0;

    const cdData = readJSON(COOLDOWNS_FILE);
    const now = Date.now();

    function checkCooldown(type, timeLimit) {
      const key = `${senderID}_${type}`;
      if (cdData[key] && now < cdData[key] + timeLimit) {
        return Math.ceil((cdData[key] + timeLimit - now) / 1000);
      }
      cdData[key] = now;
      writeJSON(COOLDOWNS_FILE, cdData);
      return 0;
                          }

  // ==========================================
    // 🛠️ SUB-COMMAND: CREW (Gestion Équipage)
    // ==========================================
    if (subCommand === "crew") {
      const crews = readJSON(CLANS_FILE);

      if (action === "create") {
        if (player.crewId) return message.reply("🏴‍☠️ | Vous faites déjà partie d'un équipage ! Quittez-le d'abord.");
        const crewName = args.slice(2).join(" ");
        if (!crewName || crewName.length < 3) return message.reply("❌ | Spécifiez un nom d'équipage valide (3 caractères min).");

        const nameExists = Object.values(crews).some(c => c.name.toLowerCase() === crewName.toLowerCase());
        if (nameExists) return message.reply("❌ | Ce nom d'équipage est déjà déposé par un autre capitaine.");

        if (userMoney < 10000) return message.reply("💰 | Créer un équipage coûte **10 000$**. Vous n'avez pas les fonds nécessaires.");

        userMoney -= 10000;
        await usersData.set(senderID, { money: userMoney });

        const newCrewId = "crew_" + Date.now();
        crews[newCrewId] = {
          id: newCrewId,
          name: crewName,
          emoji: "🏴‍☠️",
          captain: senderID,
          officers: [],
          members: [senderID],
          level: 1,
          xp: 0,
          vault: 0,
          ship: "barque",
          wins: 0,
          losses: 0,
          created: new Date().toLocaleDateString('fr-FR')
        };

        writeJSON(CLANS_FILE, crews);
        player.crewId = newCrewId;
        player.rank = "Capitaine";
        updatePlayer(senderID, player);

        return message.reply(`🎉 | **Félicitations Capitaine !** L'équipage **[${crews[newCrewId].emoji}] ${crewName}** est officiellement né.`);
      }

      if (action === "invite") {
        if (!player.crewId) return message.reply("❌ | Vous n'avez pas d'équipage.");
        const crew = crews[player.crewId];
        if (crew.captain !== senderID && !crew.officers.includes(senderID)) {
          return message.reply("❌ | Seuls le Capitaine ou les Officiers peuvent recruter.");
        }

        const mentionID = Object.keys(event.mentions)[0];
        if (!mentionID) return message.reply("👤 | Veuillez mentionner (@) le joueur à inviter.");

        const targetPlayer = getPlayer(mentionID);
        if (targetPlayer.crewId) return message.reply("❌ | Ce joueur fait déjà partie d'un équipage.");

        const shipLimit = SHIPS_DB[crew.ship].maxMembers;
        if (crew.members.length >= shipLimit) return message.reply(`🚢 | Votre bateau actuel est plein ! Améliorez votre navire.`);

        activeInvites.set(mentionID, crew.id);
        const targetName = event.mentions[mentionID].replace("@", "");
        return message.reply(`✉️ | **${targetName}**, vous êtes invité à rejoindre l'équipage **${crew.name}** !\nTapez \`pirate crew accept\`.`);
      }

      if (action === "accept") {
        if (!activeInvites.has(senderID)) return message.reply("❌ | Vous n'avez aucune invitation active.");
        const cId = activeInvites.get(senderID);
        const crew = crews[cId];

        if (!crew) {
          activeInvites.delete(senderID);
          return message.reply("❌ | Cet équipage n'existe plus.");
        }

        player.crewId = cId;
        player.rank = "Pirate";
        updatePlayer(senderID, player);

        crew.members.push(senderID);
        writeJSON(CLANS_FILE, crews);
        activeInvites.delete(senderID);

        return message.reply(`⚓ | Bienvenue à bord matelot ! Vous avez rejoint l'équipage de **${crew.name}**.`);
      }

      if (action === "leave") {
        if (!player.crewId) return message.reply("❌ | Vous n'êtes dans aucun équipage.");
        const crew = crews[player.crewId];
        if (crew.captain === senderID) return message.reply("👑 | Un capitaine ne peut pas quitter sans dissoudre ou transférer.");

        crew.members = crew.members.filter(m => m !== senderID);
        crew.officers = crew.officers.filter(o => o !== senderID);
        writeJSON(CLANS_FILE, crews);

        player.crewId = null;
        player.rank = "Mousse";
        updatePlayer(senderID, player);

        return message.reply(`🏃‍♂️ | Vous avez quitté l'équipage **${crew.name}**.`);
      }

      if (action === "promote") {
        if (!player.crewId) return message.reply("❌ | Aucun équipage.");
        const crew = crews[player.crewId];
        if (crew.captain !== senderID) return message.reply("❌ | Seul le Capitaine peut promouvoir.");

        const mentionID = Object.keys(event.mentions)[0];
        if (!mentionID || !crew.members.includes(mentionID)) return message.reply("❌ | Mentionnez un membre valide.");
        if (mentionID === senderID) return message.reply("❌ | Action impossible.");

        if (crew.officers.includes(mentionID)) return message.reply("❌ | Déjà Officier.");

        crew.officers.push(mentionID);
        writeJSON(CLANS_FILE, crews);

        const targetPlayer = getPlayer(mentionID);
        targetPlayer.rank = "Officier";
        updatePlayer(mentionID, targetPlayer);

        return message.reply(`⚔️ | Ce pirate s'est distingué. Il est promu au rang d'**Officier** !`);
      }

      if (action === "donate") {
        if (!player.crewId) return message.reply("❌ | Rejoignez un équipage d'abord.");
        const amount = parseInt(args[2]);
        if (isNaN(amount) || amount <= 0) return message.reply("❌ | Montant du don invalide.");

        if (userMoney < amount) return message.reply("❌ | Vous ne possédez pas cette somme.");

        userMoney -= amount;
        await usersData.set(senderID, { money: userMoney });

        const crew = crews[player.crewId];
        crew.vault += amount;
        writeJSON(CLANS_FILE, crews);

        return message.reply(`💰 | Vous déposez **${amount}$** dans le coffre commun. Solde actuel : **${crew.vault}$**.`);
      }

      if (action === "dissolve") {
        if (!player.crewId) return message.reply("❌ | Aucun équipage.");
        const crew = crews[player.crewId];
        if (crew.captain !== senderID) return message.reply("❌ | Seul le capitaine peut faire cela.");

        crew.members.forEach(mUid => {
          const mPlayer = getPlayer(mUid);
          mPlayer.crewId = null;
          mPlayer.rank = "Mousse";
          updatePlayer(mUid, mPlayer);
        });

        delete crews[player.crewId];
        writeJSON(CLANS_FILE, crews);

        return message.reply(`💥 | L'équipage **${crew.name}** a été dissous.`);
      }

      return message.reply("💡 | Menus Équipages :\n• `pirate crew create <nom>`\n• `pirate crew invite @user`\n• `pirate crew accept`\n• `pirate crew donate <somme>`\n• `pirate crew leave`\n• `pirate crew dissolve`");
    }

    // ==========================================
    // 🗺️ SUB-COMMAND: EXPLORE (Exploration)
    // ==========================================
    if (subCommand === "explore") {
      const cdTime = checkCooldown("explore", 60000); 
      if (cdTime > 0) return message.reply(`⏳ | Cooldown actif ! Revenez dans **${cdTime}s**.`);

      const roll = Math.random();
      let logResult = "";
      let rewardsText = "";

      if (roll < 0.30) {
        const goldGain = Math.floor(Math.random() * 8000) + 2000;
        const rubisGain = Math.random() < 0.4 ? 1 : 0;
        
        userMoney += goldGain;
        await usersData.set(senderID, { money: userMoney });

        if (rubisGain > 0) player.rubis += rubisGain;
        player.totalTreasure += 1;
        updatePlayer(senderID, player);

        logResult = `🏝️ **Découverte !** Vous accostez sur une île vierge et déterrez un vieux coffre espagnol !`;
        rewardsText = `💰 +${goldGain}$` + (rubisGain > 0 ? ` 💎 +${rubisGain} Rubis` : "");
      } 
      else if (roll < 0.55) {
        logResult = `⛈️ **Tempête !** Les éclairs frappent vos mâts. Votre équipage subit des avaries.`;
        const repairCost = Math.min(userMoney, Math.floor(Math.random() * 3000) + 500);
        
        userMoney -= repairCost;
        await usersData.set(senderID, { money: userMoney });
        rewardsText = `💸 Réparations : -${repairCost}$`;
      } 
      else if (roll < 0.80) {
        logResult = `🚢 **Marchand Ambulant !** Contre un peu d'or, il accepte de vous céder des perles rares.`;
        if (userMoney >= 5000) {
          userMoney -= 5000;
          player.perles += 2;
          await usersData.set(senderID, { money: userMoney });
          updatePlayer(senderID, player);
          rewardsText = `💸 Achat : -5000$ | 🔮 +2 Perles des Mers`;
        } else {
          rewardsText = `Fonds insuffisants (5000$).`;
        }
      } 
      else {
        const winChance = player.level * 0.1 + 0.5;
        if (Math.random() < winChance) {
          const loot = Math.floor(Math.random() * 12000) + 4000;
          userMoney += loot;
          player.xp += 150;
          if (player.xp >= player.level * 1000) {
            player.level += 1;
          }
          await usersData.set(senderID, { money: userMoney });
          updatePlayer(senderID, player);

          logResult = `⚔️ **Bataille Navale !** Un brick renégat est envoyé par le fond !`;
          rewardsText = `💰 +${loot}$ | 📈 +150 XP`;
        } else {
          const loss = Math.floor(userMoney * 0.1);
          userMoney -= loss;
          await usersData.set(senderID, { money: userMoney });
          logResult = `⚔️ **Défaite navale !** Des pirates d'élite vous pillent.`;
          rewardsText = `💸 Pertes : -${loss}$`;
        }
      }

      const statsCard = [
        { label: "Événement maritime", value: "Exploration Libre" },
        { label: "Bilan financier", value: rewardsText },
        { label: "Niveau Pirate", value: `${player.level} (${player.xp} XP)` }
      ];

      const imgBuffer = await generatePremiumCard("Rapport d'Exploration", logResult, statsCard, senderID);
      const cachePath = path.join(DATA_DIR, `explore_${senderID}.png`);
      fs.writeFileSync(cachePath, imgBuffer);

      return message.reply({ body: `🏴‍☠️ [JOURNAL DE BORD]\n${logResult}\n\n👉 Résultats : ${rewardsText}`, attachment: fs.createReadStream(cachePath) });
    }

    // ==========================================
    // 👹 SUB-COMMAND: BATTLE (Boss de Raid)
    // ==========================================
    if (subCommand === "battle") {
      const cdTime = checkCooldown("battle", 300000); 
      if (cdTime > 0) return message.reply(`👹 | Canons en surchauffe ! Attendez **${Math.ceil(cdTime/60)} min**.`);

      const boss = BOSS_DB[Math.floor(Math.random() * BOSS_DB.length)];
      
      let playerHp = 300 + (player.level * 50);
      let playerAtk = 40 + (player.level * 10);
      let playerDef = 20;

      if (player.crewId) {
        const crew = getCrew(player.crewId);
        if (crew) {
          const shipStats = SHIPS_DB[crew.ship];
          playerHp += shipStats.hp;
          playerDef += shipStats.def;
        }
      }

      let bossHp = boss.hp;
      let turn = 1;

      while (playerHp > 0 && bossHp > 0 && turn <= 10) {
        let dmg = Math.max(10, playerAtk - boss.def + Math.floor(Math.random() * 20));
        bossHp -= dmg;
        if (bossHp > 0) {
          let bDmg = Math.max(10, boss.atk - playerDef + Math.floor(Math.random() * 20));
          playerHp -= bDmg;
        }
        turn++;
      }

      let outcomeTitle = "";
      let outcomeSummary = "";
      if (bossHp <= 0) {
        userMoney += boss.reward;
        player.xp += boss.xp;
        player.diamants += 1;
        await usersData.set(senderID, { money: userMoney });
        updatePlayer(senderID, player);

        outcomeTitle = "🚨 VICTOIRE LÉGENDAIRE 🚨";
        outcomeSummary = `Vous avez terrassé ${boss.name} !\n🎁 +${boss.reward}$ | +${boss.xp} XP | 💎 +1 Diamant`;
      } else {
        const lossCost = Math.floor(userMoney * 0.05);
        userMoney -= lossCost;
        await usersData.set(senderID, { money: userMoney });

        outcomeTitle = "💀 NAUFRAGE COMPLET 💀";
        outcomeSummary = `L'entité ${boss.name} a pulvérisé votre navire.\n💸 Sauvetage : -${lossCost}$`;
      }

      const statsCard = [
        { label: "Boss maritime", value: `${boss.emoji} ${boss.name}` },
        { label: "Tours de combat", value: `${turn - 1} rounds` },
        { label: "Statut final", value: bossHp <= 0 ? "Vainqueur" : "Échoué" }
      ];

      const imgBuffer = await generatePremiumCard(outcomeTitle, outcomeSummary, statsCard, senderID);
      const cachePath = path.join(DATA_DIR, `boss_${senderID}.png`);
      fs.writeFileSync(cachePath, imgBuffer);

      return message.reply({ body: `⚔️ [RAID BOSS]\n${outcomeSummary}`, attachment: fs.createReadStream(cachePath) });
    }

    // ==========================================
    // 🏴 SUB-COMMAND: WAR (Guerre des Équipages)
    // ==========================================
    if (subCommand === "war") {
      if (!player.crewId) return message.reply("❌ | Vous devez posséder un équipage !");
      const myCrew = getCrew(player.crewId);

      if (myCrew.captain !== senderID) return message.reply("👑 | Seul le capitaine déclare les guerres.");

      const targetInput = args.slice(1).join(" ");
      if (!targetInput) return message.reply("🏴 | Entrez l'équipage cible : \`pirate war <Nom>\`");

      const allCrews = readJSON(CLANS_FILE);
      const enemyCrew = Object.values(allCrews).find(c => c.name.toLowerCase() === targetInput.toLowerCase());

      if (!enemyCrew) return message.reply("❌ | Équipage cible introuvable.");
      if (enemyCrew.id === myCrew.id) return message.reply("❌ | Action invalide.");

      const myPower = (myCrew.level * 300) + SHIPS_DB[myCrew.ship].hp + (SHIPS_DB[myCrew.ship].canons * 50);
      const enemyPower = (enemyCrew.level * 300) + SHIPS_DB[enemyCrew.ship].hp + (SHIPS_DB[enemyCrew.ship].canons * 50);

      const winChance = myPower / (myPower + enemyPower);
      let warResultTitle = "";
      let warDesc = "";

      if (Math.random() < winChance) {
        const stolenVault = Math.floor(enemyCrew.vault * 0.30);
        enemyCrew.vault -= stolenVault;
        myCrew.vault += stolenVault;
        myCrew.wins += 1;
        enemyCrew.losses += 1;
        myCrew.xp += 500;

        warResultTitle = "🏆 GUERRE REMPORTÉE !";
        warDesc = `Victoire éclatante face à ${enemyCrew.name} !\n💰 Coffre d'équipage : +${stolenVault}$`;
      } else {
        const lostVault = Math.floor(myCrew.vault * 0.20);
        myCrew.vault -= lostVault;
        enemyCrew.vault += lostVault;
        myCrew.losses += 1;
        enemyCrew.wins += 1;

        warResultTitle = "🔥 DÉFAITE NAVALE";
        warDesc = `Votre flotte a sombré face à ${enemyCrew.name}.\n💸 Indemnités : -${lostVault}$`;
      }

      updateCrew(myCrew.id, myCrew);
      updateCrew(enemyCrew.id, enemyCrew);

      const statsCard = [
        { label: "Puissance Alliée", value: `${myPower} PTS` },
        { label: "Puissance Ennemie", value: `${enemyPower} PTS` },
        { label: "Statistiques globales", value: "Bataille d'armadas simulée" }
      ];

      const imgBuffer = await generatePremiumCard(warResultTitle, warDesc, statsCard, null);
      const cachePath = path.join(DATA_DIR, `war_${myCrew.id}.png`);
      fs.writeFileSync(cachePath, imgBuffer);

      return message.reply({ body: `🏴 [CONFLIT] ${warDesc}`, attachment: fs.createReadStream(cachePath) });
    }

    // ==========================================
    // 🚢 SUB-COMMAND: UPGRADE (Amélioration Navire)
    // ==========================================
    if (subCommand === "upgrade") {
      if (!player.crewId) return message.reply("❌ | Vous n'avez pas d'équipage.");
      const crews = readJSON(CLANS_FILE);
      const crew = crews[player.crewId];

      if (crew.captain !== senderID) return message.reply("👑 | Réservé au capitaine.");

      const shipKeys = Object.keys(SHIPS_DB);
      const currentIdx = shipKeys.indexOf(crew.ship);
      const nextIdx = currentIdx + 1;

      if (nextIdx >= shipKeys.length) return message.reply("👑 | Vous possédez déjà le navire ultime !");

      const nextShip = SHIPS_DB[shipKeys[nextIdx]];

      if (crew.vault < nextShip.cost) {
        return message.reply(`💰 | Le chantier naval réclame **${nextShip.cost}$** dans le coffre commun pour un **${nextShip.name}**.\nSolde actuel : **${crew.vault}$**.`);
      }

      crew.vault -= nextShip.cost;
      crew.ship = shipKeys[nextIdx];
      writeJSON(CLANS_FILE, crews);

      return message.reply(`🎉 | Navire amélioré avec succès : **${nextShip.emoji} ${nextShip.name}** !`);
    }

    // ==========================================
    // 📊 SUB-COMMAND: INFO / PROFILE (Fiche d'identité)
    // ==========================================
    if (!subCommand || subCommand === "info" || subCommand === "profile") {
      let crewNameText = "Pirate Solitaire";
      let shipText = "Aucun";
      let vaultText = "0$";

      if (player.crewId) {
        const myCrew = getCrew(player.crewId);
        if (myCrew) {
          crewNameText = `[${myCrew.emoji}] ${myCrew.name} (${player.rank})`;
          shipText = `${SHIPS_DB[myCrew.ship].emoji} ${SHIPS_DB[myCrew.ship].name}`;
          vaultText = `${myCrew.vault}$`;
        }
      }

      const statsCard = [
        { label: "Grade Pirate", value: `${player.rank} (Niv. ${player.level})` },
        { label: "Équipage Actuel", value: crewNameText },
        { label: "Navire équipé", value: shipText },
        { label: "Coffre de Clan", value: vaultText },
        { label: "Trésors Trouvés", value: `${player.totalTreasure} coffres` },
        { label: "Joyaux précieux", value: `🔮 ${player.perles} P | 💎 ${player.diamants} D | 🩸 ${player.rubis} R` }
      ];

      const imgBuffer = await generatePremiumCard(`Profil de ${uData.name || "Pirate"}`, "Fiche d'identité numérique des Caraïbes", statsCard, senderID);
      const cachePath = path.join(DATA_DIR, `profile_${senderID}.png`);
      fs.writeFileSync(cachePath, imgBuffer);

      return message.reply({ body: `🏴‍☠️ [INFORMATIONS PIRATE]\n• Niveau : ${player.level}\n• Équipage : ${crewNameText}\n• Navire : ${shipText}`, attachment: fs.createReadStream(cachePath) });
    }
  }
};
