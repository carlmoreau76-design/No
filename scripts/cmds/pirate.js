/**
 * @file pirate.js
 * @description Mode de jeu RPG de Piraterie et de Guerres Navales Multicompagnons pour GoatBot v2
 * @version 1.0.0
 * @author Collaborateur IA RPG
 */

const fs = require('fs');
const path = require('path');

// ==========================================
// 📁 COORDONNÉES ET STRUCTURE DU STOCKAGE INFRASTRUCTURE
// ==========================================
const DATA_DIR = path.join(__dirname, 'cache', 'piratesMMO');
const CREWS_FILE = path.join(DATA_DIR, 'crews.json');
const PLAYER_LINKS_FILE = path.join(DATA_DIR, 'player_links.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(CREWS_FILE)) fs.writeFileSync(CREWS_FILE, JSON.stringify({}, null, 2));
if (!fs.existsSync(PLAYER_LINKS_FILE)) fs.writeFileSync(PLAYER_LINKS_FILE, JSON.stringify({}, null, 2));

// ==========================================
// 🚢 CATALOGUE DES NAVIRES AMÉLIORABLES
// ==========================================
const SHIPS_CATALOG = {
  barque: { id: "barque", name: "Barque de Fortune", emoji: "🛶", price: 100000, baseHp: 300, baseDef: 10, baseCanons: 2, capacity: 3, treasureBonus: 0.02 },
  voilier: { id: "voilier", name: "Voilier Léger", emoji: "⛵", price: 350000, baseHp: 650, baseDef: 25, baseCanons: 4, capacity: 5, treasureBonus: 0.05 },
  brick: { id: "brick", name: "Brick de Flibustier", emoji: "🚢", price: 1200000, baseHp: 1500, baseDef: 60, baseCanons: 8, capacity: 10, treasureBonus: 0.10 },
  fregate: { id: "fregate", name: "Frégate de Chasse", emoji: "⚓", price: 4500000, baseHp: 3200, baseDef: 120, baseCanons: 16, capacity: 15, treasureBonus: 0.15 },
  galion: { id: "galion", name: "Galion Royal Imperial", emoji: "🏰", price: 15000000, baseHp: 7500, baseDef: 250, baseCanons: 32, capacity: 25, treasureBonus: 0.22 },
  black_pearl: { id: "black_pearl", name: "Le Maudit Black Pearl", emoji: "🏴‍☠️", price: 50000000, baseHp: 18000, baseDef: 500, baseCanons: 50, capacity: 35, treasureBonus: 0.35 },
  ghost_ship: { id: "ghost_ship", name: "Bateau Fantôme Éthéré", emoji: "👻", price: 120000000, baseHp: 40000, baseDef: 950, baseCanons: 80, capacity: 50, treasureBonus: 0.50 },
  leviathan_ship: { id: "leviathan_ship", name: "Le Souverain Léviathan", emoji: "🐉", price: 300000000, baseHp: 100000, baseDef: 2200, baseCanons: 140, capacity: 80, treasureBonus: 0.75 }
};

// ==========================================
// 👹 DICTIONNAIRE DES BOSS MYTHIQUES DE L'OCÉAN
// ==========================================
const OCEAN_BOSSES = {
  kraken: { name: "Le Kraken des Abysses", emoji: "🐙", hp: 25000, atk: 450, def: 150, rewardGold: 1500000, rep: 250 },
  davy_jones: { name: "Davy Jones du Hollandais Volant", emoji: "💀", hp: 60000, atk: 900, def: 400, rewardGold: 4000000, rep: 500 },
  poseidon: { name: "Poséidon, Dieu des Tempêtes", emoji: "🔱", hp: 150000, atk: 2200, def: 900, rewardGold: 12000000, rep: 1200 },
  roi_pirate: { name: "Le Spectre du Roi Pirate", emoji: "👑", hp: 400000, atk: 5000, def: 2500, rewardGold: 35000000, rep: 3000 }
};

// ==========================================
// 🎲 RÉPERTOIRE DES BUTINS ET LOOTS SECONDAIRES
// ==========================================
const LOOT_ITEMS = {
  perle: { name: "Perle Noire des Lagons", val: 15000, emoji: "🦪" },
  rubis: { name: "Rubis Sang-de-Pigeon", val: 45000, emoji: "♦️" },
  diamant: { name: "Diamant Brut des Caraïbes", val: 120000, emoji: "💎" },
  relique: { name: "Relique Sacrée Inconnue", val: 350000, emoji: "🏺" },
  artefact: { name: "Artefact Temporel Perdu", val: 950000, emoji: "🔮" }
};

// ==========================================
// ROLES & DROITS DE L'ÉQUIPAGE
// ==========================================
const ROLES = {
  CAPTAIN: { name: "Capitaine", power: 3, canManage: true, canWithdraw: true, emoji: "👑" },
  OFFICER: { name: "Officier", power: 2, canManage: true, canWithdraw: false, emoji: "⚔️" },
  SAILOR: { name: "Matelot", power: 1, canManage: false, canWithdraw: false, emoji: "⚓" }
};

// ==========================================
// 🛠️ FONCTIONS UTILITAIRES ET MUTATEURS DE DONNÉES
// ==========================================
function readDB(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { return {}; }
}
function writeDB(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
}

function getPlayerLink(uid) {
  const links = readDB(PLAYER_LINKS_FILE);
  return links[uid] || null;
}

function setPlayerLink(uid, guildId, role) {
  const links = readDB(PLAYER_LINKS_FILE);
  if (guildId === null) {
    delete links[uid];
  } else {
    links[uid] = { crewId: guildId, role: role };
  }
  writeDB(PLAYER_LINKS_FILE, links);
}

// Recalculateur de statistiques du Navire Amélioré
function getShipStats(crew) {
  const base = SHIPS_CATALOG[crew.ship.type] || SHIPS_CATALOG.barque;
  const upgradeLevel = crew.ship.upgradeLevel || 1;
  const factor = 1 + (upgradeLevel - 1) * 0.15; // +15% par niveau d'amélioration

  return {
    name: base.name,
    emoji: base.emoji,
    hp: Math.floor(base.baseHp * factor),
    def: Math.floor(base.baseDef * factor),
    canons: Math.floor(base.baseCanons * (1 + (upgradeLevel - 1) * 0.08)),
    capacity: base.capacity,
    treasureBonus: base.treasureBonus + ((upgradeLevel - 1) * 0.01)
  };
}

const UI = {
  line: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
  boxStart: (title) => `╭───────────── 🏴‍☠️ ─────────────╮\n│ 🦅  ${title.toUpperCase()}\n├───────────────────────────────`,
  boxEnd: () => `╰───────────────────────────────╯`,
  field: (label, val) => `│ ➔ ${label} : ${val}`
};

// ==========================================
// 🛡️ ACCROCHE ET CONFIGURATION GOATBOT V2
// ==========================================
module.exports = {
  config: {
    name: "pirate",
    aliases: ["pirates", "corsaire", "crew", "piraterie"],
    version: "1.0.0",
    author: "Collaborateur IA RPG",
    countDown: 3,
    role: 0,
    description: "Système de piraterie MMORPG ultra premium : Équipages, explorations, guerres navales et chasses aux boss.",
    category: "game",
    guide: { fr: "{p}pirate [sous-commande]", en: "{p}pirate [subcommand]" }
  },

  onStart: async function ({ api, event, args, usersData, message }) {
    const { senderID, threadID, mentions } = event;
    const crews = readDB(CREWS_FILE);
    const userLink = getPlayerLink(senderID);
    const subCommand = args[0]?.toLowerCase();

    // Récupération sécurisée du portefeuille de l'or du joueur
    let userData = await usersData.get(senderID);
    let userMoney = userData.money || 0;

    // ==========================================
    // 📜 INTERFACE : MENU D'AIDE CENTRALISÉ
    // ==========================================
    if (!subCommand) {
      let menu = `╭───────────────────────────────────────╮\n`;
      menu += `│ 🏴‍☠️  𝐒𝐘𝐒𝐓È𝐌𝐄 𝐃𝐄 𝐏𝐈𝐑𝐀𝐓𝐄𝐑𝐈𝐄 𝐌𝐌𝐎𝐑𝐏𝐆\n`;
      menu += `├───────────────────────────────────────┤\n`;
      menu += `│ 🔹 ~pirate crew create <nom> : Fonder votre flotte\n`;
      menu += `│ 🔹 ~pirate invite @joueur : Enrôler un pirate\n`;
      menu += `│ 🔹 ~pirate leave : Déserter votre équipage actuel\n`;
      menu += `│ 🔹 ~pirate kick @joueur : Bannir un matelot du bord\n`;
      menu += `│ 🔹 ~pirate promote @joueur : Élever au rang d'Officier\n`;
      menu += `│ 🔹 ~pirate demote @joueur : Rétrograder un officier\n`;
      menu += `│ 🔹 ~pirate dissolve : Saborder l'équipage (Capitaine)\n`;
      menu += `├───────────────────────────────────────┤\n`;
      menu += `│ 🚢 𝐆𝐄𝐒𝐓𝐈𝐎𝐍 𝐃𝐔 𝐍𝐀𝐕𝐈𝐑𝐄 & 𝐂𝐎𝐅𝐅𝐑𝐄\n`;
      menu += `├───────────────────────────────────────┤\n`;
      menu += `│ 🔹 ~pirate status : Fiche technique de votre flotte\n`;
      menu += `│ 🔹 ~pirate deposit <somme> : Renflouer le coffre commun\n`;
      menu += `│ 🔹 ~pirate shipyard : Acheter/Améliorer votre navire\n`;
      menu += `├───────────────────────────────────────┤\n`;
      menu += `│ 🌊 𝐀𝐕𝐄𝐍𝐓𝐔𝐑𝐄𝐒 & 𝐂𝐎𝐌𝐁𝐀𝐓𝐒\n`;
      menu += `├───────────────────────────────────────┤\n`;
      menu += `│ 🔹 ~pirate explore : Lancer une expédition en mer\n`;
      menu += `│ 🔹 ~pirate battle : Attaquer un équipage PNJ pirate\n`;
      menu += `│ 🔹 ~pirate war <ID_Crew> : Déclarer une guerre navale\n`;
      menu += `│ 🔹 ~pirate boss : Lancer un raid contre un Boss Rare\n`;
      menu += `│ 🔹 ~pirate top : Classement des flibustiers d'élite\n`;
      menu += `╰───────────────────────────────────────╯`;
      return message.reply(menu);
    }

    // ==========================================
    // 🏴‍☠️ SUBCOMMANDE : CREW CREATE (FONDATION DE LA FLOTTE)
    // ==========================================
    if (subCommand === "crew" && args[1]?.toLowerCase() === "create") {
      if (userLink) return message.reply("❌ | Vous appartenez déjà à une faction maritime. Quittez-la avant d'en créer une nouvelle.");
      
      const crewName = args.slice(2).join(" ");
      if (!crewName || crewName.trim() === "") return message.reply("❌ | Veuillez attribuer un nom à votre équipage. Usage: `pirate crew create <nom>`");
      if (crewName.length > 20) return message.reply("❌ | Le nom choisi ne doit pas dépasser 20 caractères.");

      const registrationFee = 500000; // Coût de création : 500 000$
      if (userMoney < registrationFee) return message.reply(`💰 | Créer un équipage coûte **${registrationFee.toLocaleString()}$**. Vos économies sont insuffisantes.`);

      // Facturation
      userMoney -= registrationFee;
      await usersData.set(senderID, { money: userMoney });

      const crewId = "CREW_" + Math.random().toString(36).substring(2, 7).toUpperCase();
      
      // Enregistrement de la nouvelle entité Équipage
      crews[crewId] = {
        id: crewId,
        name: crewName.trim(),
        emoji: "🏴‍☠️",
        captainId: senderID,
        officers: [],
        members: [senderID],
        level: 1,
        xp: 0,
        vault: 0,
        victories: 0,
        failures: 0,
        ship: { type: "barque", upgradeLevel: 1 },
        createdDate: new Date().toLocaleDateString('fr-FR')
      };

      writeDB(CREWS_FILE, crews);
      setPlayerLink(senderID, crewId, "CAPTAIN");

      let creationBox = UI.boxStart("Nouveau Pavillon Levé") + `\n`;
      creationBox += `│ 📜 Équipage : **${crewName.trim()}**\n`;
      creationBox += `│ 🆔 Identifiant Flotte : \`${crewId}\`\n`;
      creationBox += `│ 👑 Capitaine : ${(userData.name || "Vous")}\n`;
      creationBox += `│ 🚢 Navire Initial : 🛶 Barque de Fortune\n`;
      creationBox += `${UI.line}\n│ *Frais de pavillon payés : -${registrationFee.toLocaleString()}$*\n` + UI.boxEnd();
      return message.reply(creationBox);
    }

    // ==========================================
    // ✉️ SUBCOMMANDE : INVITE (RECRUTEMENT DE MATELOTS)
    // ==========================================
    if (subCommand === "invite") {
      if (!userLink) return message.reply("❌ | Vous devez posséder un équipage pour lancer des invitations.");
      const crew = crews[userLink.crewId];
      
      // Seuls le Capitaine et les Officiers ont le pouvoir de recrutement
      if (ROLES[userLink.role].power < 2) return message.reply("❌ | Seuls les Officiers ou le Capitaine peuvent recruter.");

      const targetId = Object.keys(mentions)[0];
      if (!targetId) return message.reply("❌ | Veuillez mentionner le joueur à enrôler : `pirate invite @joueur`");
      
      const targetLink = getPlayerLink(targetId);
      if (targetLink) return message.reply("❌ | Ce joueur navigue déjà sous un autre pavillon.");

      const shipStats = getShipStats(crew);
      if (crew.members.length >= shipStats.capacity) {
        return message.reply(`🚢 | Votre navire actuel (**${shipStats.name}**) est surchargé ! Améliorez-le ou achetez un plus grand vaisseau pour accueillir de nouveaux membres.`);
      }

      // Simulation de signature de contrat (Auto-acceptation par souci de fluidité sur Discord)
      crew.members.push(targetId);
      crews[userLink.crewId] = crew;
      writeDB(CREWS_FILE, crews);
      setPlayerLink(targetId, userLink.crewId, "SAILOR");

      return message.reply(`⚓ | **RECRUTEMENT REUSSI :** L'utilisateur a été enrôlé en tant que **Matelot** au sein de l'équipage **${crew.name}** !`);
    }

    // ==========================================
    // 🥾 SUBCOMMANDE : KICK (BANNISSEMENT DE BORD)
    // ==========================================
    if (subCommand === "kick") {
      if (!userLink) return message.reply("❌ | Vous n'avez pas d'équipage.");
      const crew = crews[userLink.crewId];
      if (ROLES[userLink.role].power < 2) return message.reply("❌ | Autorisations insuffisantes pour expulser un membre.");

      const targetId = Object.keys(mentions)[0];
      if (!targetId) return message.reply("❌ | Spécifiez le membre à exclure via sa mention : `pirate kick @joueur`");

      if (targetId === crew.captainId) return message.reply("❌ | Mutinerie impossible ! On ne peut pas expulser le Capitaine.");

      const targetLink = getPlayerLink(targetId);
      if (!targetLink || targetLink.crewId !== userLink.crewId) return message.reply("❌ | Ce joueur ne fait pas partie de votre flotte.");

      // Retrait des listes
      crew.members = crew.members.filter(id => id !== targetId);
      crew.officers = crew.officers.filter(id => id !== targetId);
      
      crews[userLink.crewId] = crew;
      writeDB(CREWS_FILE, crews);
      setPlayerLink(targetId, null, null);

      return message.reply(`🥾 | **EXPULSION :** Le joueur a été débarqué de force sur l'île déserte la plus proche.`);
    }

    // ==========================================
    // ⚔️ SUBCOMMANDES : PROMOTE & DEMOTE (PROMOTIONS / RETROGRADATIONS)
    // ==========================================
    if (subCommand === "promote") {
      if (!userLink || userLink.role !== "CAPTAIN") return message.reply("❌ | Seul le Capitaine de la flotte détient le pouvoir des nominations.");
      
      const targetId = Object.keys(mentions)[0];
      if (!targetId) return message.reply("❌ | Mentionnez le membre à élever au rang d'officier.");

      const crew = crews[userLink.crewId];
      if (!crew.members.includes(targetId)) return message.reply("❌ | Ce pirate ne figure pas sur le registre de votre équipage.");
      if (crew.officers.includes(targetId)) return message.reply("❌ | Ce membre occupe déjà un poste d'officier de pont.");

      crew.officers.push(targetId);
      crews[userLink.crewId] = crew;
      writeDB(CREWS_FILE, crews);
      setPlayerLink(targetId, userLink.crewId, "OFFICER");

      return message.reply(`⚔️ | **NOMINATION :** Félicitations, le matelot a été élevé au grade d'**Officier** de l'équipage !`);
    }

    if (subCommand === "demote") {
      if (!userLink || userLink.role !== "CAPTAIN") return message.reply("❌ | Seul le Capitaine suprême peut rétrograder ses officiers.");
      
      const targetId = Object.keys(mentions)[0];
      if (!targetId) return message.reply("❌ | Mentionnez l'officier à destituer.");

      const crew = crews[userLink.crewId];
      if (!crew.officers.includes(targetId)) return message.reply("❌ | Ce membre n'est pas officier.");

      crew.officers = crew.officers.filter(id => id !== targetId);
      crews[userLink.crewId] = crew;
      writeDB(CREWS_FILE, crews);
      setPlayerLink(targetId, userLink.crewId, "SAILOR");

      return message.reply(`⚓ | **RÉTROGRADATION :** L'officier a été déchu de ses fonctions et retourne récurer le pont comme **Matelot**.`);
    }

    // ==========================================
    // 🏃 SUBCOMMANDE : LEAVE (DÉSERTION DE BORD)
    // ==========================================
    if (subCommand === "leave") {
      if (!userLink) return message.reply("❌ | Vous n'avez aucun navire à abandonner.");
      const crew = crews[userLink.crewId];

      if (userLink.role === "CAPTAIN") {
        return message.reply("❌ | Un capitaine ne peut pas déserter son navire ! Utilisez `pirate dissolve` pour saborder la flotte ou cédez votre place.");
      }

      crew.members = crew.members.filter(id => id !== senderID);
      crew.officers = crew.officers.filter(id => id !== senderID);

      crews[userLink.crewId] = crew;
      writeDB(CREWS_FILE, crews);
      setPlayerLink(senderID, null, null);

      return message.reply(`🏃 | **DÉSERTION :** Vous avez glissé une barque à la mer à la nuit tombée et quitté définitivement l'équipage **${crew.name}**.`);
    }

    // ==========================================
    // 🔥 SUBCOMMANDE : DISSOLVE (SABORDAGE COMPLET DE LA FLOTTE)
    // ==========================================
    if (subCommand === "dissolve") {
      if (!userLink || userLink.role !== "CAPTAIN") return message.reply("❌ | Seul le Capitaine fondateur peut saborder l'équipage.");

      const crew = crews[userLink.crewId];
      
      // Libération et mise à pied de tous les membres rattachés
      crew.members.forEach(mId => {
        setPlayerLink(mId, null, null);
      });

      delete crews[userLink.crewId];
      writeDB(CREWS_FILE, crews);

      return message.reply(`💥 | **SABORDAGE :** Le Capitaine a ouvert les vannes de fond et fait sauter la soute à munitions. L'équipage **${crew.name}** repose désormais par le fond.`);
  }

    // ==========================================
    // 📊 SUBCOMMANDE : STATUS (FICHE TECHNIQUE DE LA FLOTTE)
    // ==========================================
    if (subCommand === "status") {
      if (!userLink) return message.reply("❌ | Vous n'avez pas d'équipage. Créez-en un via `pirate crew create <nom>`.");
      
      const crew = crews[userLink.crewId];
      const statsShip = getShipStats(crew);
      const nextXpRequired = crew.level * 10000;

      let statusBox = UI.boxStart(`Registre : ${crew.name}`) + `\n`;
      statusBox += `${UI.field("Identifiant Unique", `\`${crew.id}\``)}\n`;
      statusBox += `${UI.field("Date de Création", crew.createdDate)}\n`;
      statusBox += `${UI.field("Niveau de Flotte", `Niv. ${crew.level} (XP: ${crew.xp} / ${nextXpRequired})`)}\n`;
      statusBox += `${UI.field("Trésor de l'Équipage", `💰 ${crew.vault.toLocaleString()}$`)}\n`;
      statusBox += `${UI.field("Membres à Bord", `${crew.members.length} / ${statsShip.capacity} Pirates`)}\n`;
      statusBox += `${UI.field("Bilan des Combats", `🟢 ${crew.victories} Victoires | 🔴 ${crew.failures} Défaites`)}\n`;
      statusBox += `${UI.line}\n`;
      statusBox += `│ 🚢 SPÉCIFICATIONS DU NAVIRE ACTIVÉ :\n`;
      statusBox += `${UI.field("Modèle du Vaisseau", `${statsShip.emoji} ${statsShip.name} (Upgrade Niv. ${crew.ship.upgradeLevel})`)}\n`;
      statusBox += `${UI.field("Points de Structure", `${statsShip.hp} HP`)}\n`;
      statusBox += `${UI.field("Blindage de Coque", `${statsShip.def} DEF`)}\n`;
      statusBox += `${UI.field("Batteries d'Artillerie", `${statsShip.canons} Canons de Bord`)}\n`;
      statusBox += `${UI.field("Bonus de Butin Passif", `+${Math.floor(statsShip.treasureBonus * 100)}% de gains`)}\n`;
      statusBox += UI.boxEnd();

      return message.reply(statusBox);
    }

    // ==========================================
    // 💰 SUBCOMMANDE : DEPOSIT (FINANCEMENT DU COFFRE COMMUN)
    // ==========================================
    if (subCommand === "deposit") {
      if (!userLink) return message.reply("❌ | Vous devez appartenir à un équipage pour approvisionner un coffre commun.");
      
      const amountInput = args[1];
      const crew = crews[userLink.crewId];

      if (!amountInput || isNaN(amountInput) || parseInt(amountInput) <= 0) {
        return message.reply("❌ | Veuillez indiquer une somme d'or valide à transférer : `pirate deposit <montant>`");
      }

      const amountToDeposit = parseInt(amountInput);
      if (userMoney < amountToDeposit) {
        return message.reply(`💰 | Vos finances sont insuffisantes pour faire un don de **${amountToDeposit.toLocaleString()}$**.`);
      }

      // Transfert économique
      userMoney -= amountToDeposit;
      crew.vault += amountToDeposit;

      await usersData.set(senderID, { money: userMoney });
      crews[userLink.crewId] = crew;
      writeDB(CREWS_FILE, crews);

      return message.reply(`🪙 | **DON FINANCIER :** Vous déposez **+${amountToDeposit.toLocaleString()}$** dans le coffre commun. Nouveau solde de la flotte : **${crew.vault.toLocaleString()}$**.`);
    }

    // ==========================================
    // 🏗️ SUBCOMMANDE : SHIPYARD (CHANTIER NAVAL IMPÉRIAL)
    // ==========================================
    if (subCommand === "shipyard") {
      if (!userLink) return message.reply("❌ | Seuls les marins rattachés à une flotte ont accès au Chantier Naval.");
      const crew = crews[userLink.crewId];
      
      const operation = args[1]?.toLowerCase();

      // Catalogue d'achat du Chantier Naval si aucune opération spécifiée
      if (!operation) {
        let yardMsg = `🏗️ **[CHANTIER NAVAL DE L'EMPIRE DES MERS]**\n${UI.line}\n`;
        yardMsg += `*Votre Navire Actuel : ${crew.ship.type.toUpperCase()} (Niv. d'amélioration : ${crew.ship.upgradeLevel})*\n`;
        yardMsg += `Pour améliorer votre navire actuel : \`pirate shipyard upgrade\`\n${UI.line}\n`;
        
        for (const [id, ship] of Object.entries(SHIPS_CATALOG)) {
          yardMsg += `${ship.emoji} **${ship.name}**\n│ 💰 Prix : ${ship.price.toLocaleString()}$ | 👥 Capacité : ${ship.capacity} places\n│ 📊 HP: ${ship.baseHp} | Canons: ${ship.baseCanons}\n│ ➔ \`pirate shipyard buy ${id}\`\n${UI.line}\n`;
        }
        return message.reply(yardMsg);
      }

      // Autorisation administrative requise pour modifier les structures de la flotte
      if (ROLES[userLink.role].power < 2) {
        return message.reply("❌ | Seuls les Officiers ou le Capitaine peuvent commander des travaux navals.");
      }

      // --- OPTION : BUY (ACHAT D'UN NOUVEAU NAVIRE DE RANG SUPÉRIEUR) ---
      if (operation === "buy") {
        const targetShipId = args[2]?.toLowerCase();
        if (!targetShipId || !SHIPS_CATALOG[targetShipId]) {
          return message.reply("❌ | Modèle de navire inconnu ou non répertorié. Consultez la liste via `pirate shipyard`.");
        }

        const selectedShip = SHIPS_CATALOG[targetShipId];
        
        if (crew.vault < selectedShip.price) {
          return message.reply(`❌ | Le coffre de l'équipage ne contient pas les fonds nécessaires (**${selectedShip.price.toLocaleString()}$** requis). Utilisez \`pirate deposit\` pour le renflouer.`);
        }

        if (crew.members.length > selectedShip.capacity) {
          return message.reply(`❌ | Impossible de rétrograder vers ce navire. Votre équipage actuel (${crew.members.length} membres) dépasse la capacité maximale autorisée (${selectedShip.capacity} places).`);
        }

        // Déduction des fonds sur le coffre de guilde et écriture du nouveau type
        crew.vault -= selectedShip.price;
        crew.ship.type = targetShipId;
        crew.ship.upgradeLevel = 1; // Réinitialisation du niveau d'amélioration pour le nouveau modèle

        crews[userLink.crewId] = crew;
        writeDB(CREWS_FILE, crews);

        return message.reply(`🏗️ | **CHANTIER COMPLET :** L'équipage a fait l'acquisition du navire : ${selectedShip.emoji} **${selectedShip.name}** ! Les fonds ont été prélevés du coffre de flotte.`);
      }

      // --- OPTION : UPGRADE (AMÉLIORATION DE LA COUPE ET DE L'ARMEMENT) ---
      if (operation === "upgrade") {
        const currentUpgradeLevel = crew.ship.upgradeLevel || 1;
        const baseShipData = SHIPS_CATALOG[crew.ship.type];
        
        // Formule de calcul du coût de mise à niveau : 30% de la valeur de base du navire par niveau supplémentaire
        const upgradeCost = Math.floor(baseShipData.price * 0.30 * currentUpgradeLevel);

        if (crew.vault < upgradeCost) {
          return message.reply(`❌ | Les améliorations de charpente exigent **${upgradeCost.toLocaleString()}$** prélevés du coffre d'équipage. Solde insuffisant.`);
        }

        // Application de l'ingénierie navale
        crew.vault -= upgradeCost;
        crew.ship.upgradeLevel += 1;

        crews[userLink.crewId] = crew;
        writeDB(CREWS_FILE, crews);

        return message.reply(`🛠️ | **MIGRATION DE STRUCTURE :** Votre ${baseShipData.emoji} **${baseShipData.name}** est élevé au **Niveau d'amélioration ${crew.ship.upgradeLevel}** ! Ses caractéristiques de combat augmentent de **+15%**.`);
      }
    }

    // ==========================================
    // 🗺️ SUBCOMMANDE : EXPLORE (SORTIE EN MER ET ÉVÉNEMENTS)
    // ==========================================
    if (subCommand === "explore") {
      if (!userLink) return message.reply("❌ | Vous devez fonder ou rejoindre un équipage avant de lever l'ancre.");
      const crew = crews[userLink.crewId];
      const stats = getShipStats(crew);

      // Gestion du Cooldown individuel de navigation (5 minutes)
      if (!global.pirateExploreCooldown) global.pirateExploreCooldown = {};
      const lastExplore = global.pirateExploreCooldown[senderID] || 0;
      if (Date.now() - lastExplore < 5 * 60 * 1000) {
        const remaining = Math.ceil((5 * 60 * 1000 - (Date.now() - lastExplore)) / 1000);
        return message.reply(`⏳ | Votre équipage est en train de ravitailler à la taverne. Repartez en mer dans **${remaining} seconde(s)**.`);
      }

      global.pirateExploreCooldown[senderID] = Date.now();

      // Interconnexion : Prise en compte du familier actif (Pet Connection)
      let petTreasureBonus = 0;
      try {
        const petDBFile = path.join(__dirname, 'cache', 'petsMMO', 'player_pets.json');
        if (fs.existsSync(petDBFile)) {
          const petDB = JSON.parse(fs.readFileSync(petDBFile, 'utf8'));
          const playerPetData = petDB[senderID];
          if (playerPetData && playerPetData.activePetId) {
            const activePet = playerPetData.inventory.find(p => p.uniqueId === playerPetData.activePetId);
            // Si le familier est un Kraken ou possède un bonus aux trésors
            if (activePet && activePet.hunger > 20) {
              petTreasureBonus = 0.15; // +15% de chance/butin supplémentaire
            }
          }
        }
      } catch (e) {}

      const totalBonus = 1 + stats.treasureBonus + petTreasureBonus;

      // Table des événements d'exploration RPG
      const events = [
        { type: "treasure", text: "Découverte d'une île déserte renfermant un coffre enfoui !", gold: 250000, xp: 350, item: "perle" },
        { type: "merchant", text: "Rencontre avec un navire marchand de l'Empire. Échange fructueux !", gold: 120000, xp: 150, item: null },
        { type: "storm", text: "Une terrible tempête s'abat sur le navire. Réparations coûteuses...", gold: -80000, xp: 100, item: null },
        { type: "ghost", text: "Un brick fantôme surgit de la brume ! Vous pillez ses cales maudites.", gold: 450000, xp: 600, item: "relique" },
        { type: "empty", text: "Calme plat sur l'océan. Rien à l'horizon pour cette fois.", gold: 0, xp: 50, item: null }
      ];

      const rolledEvent = events[Math.floor(Math.random() * events.length)];
      let finalGold = Math.floor(rolledEvent.gold * (rolledEvent.gold > 0 ? totalBonus : 1));
      let finalXp = rolledEvent.xp;

      // Application des modifications financières
      if (finalGold > 0) {
        userMoney += finalGold;
        await usersData.set(senderID, { money: userMoney });
      } else if (finalGold < 0) {
        userMoney = Math.max(0, userMoney + finalGold);
        await usersData.set(senderID, { money: userMoney });
      }

      // Progression de l'équipage
      crew.xp += finalXp;
      const xpNeeded = crew.level * 10000;
      if (crew.xp >= xpNeeded) {
        crew.xp -= xpNeeded;
        crew.level += 1;
      }
      crews[userLink.crewId] = crew;
      writeDB(CREWS_FILE, crews);

      // Interconnexion : Signalement au module de quêtes (Quest Connection)
      try {
        const questModule = require('./quest.js');
        if (questModule && typeof questModule.incrementProgress === 'function') {
          questModule.incrementProgress(senderID, "pirate_explore", 1);
          if (rolledEvent.type === "treasure") {
            questModule.incrementProgress(senderID, "treasure_find", 1);
          }
        }
      } catch (e) {}

      // Construction de l'interface visuelle
      let expBox = UI.boxStart("Rapport d'Expédition") + `\n`;
      expBox += `│ 🌊 Événement : **${rolledEvent.text}**\n`;
      expBox += `${UI.line}\n`;
      expBox += `│ 💰 Impact Bourse : **${finalGold >= 0 ? "+" : ""}${finalGold.toLocaleString()}$**\n`;
      expBox += `│ ✨ XP Faction : +${finalXp} XP\n`;
      if (rolledEvent.item) {
        const itemData = LOOT_ITEMS[rolledEvent.item];
        expBox += `│ 🦪 Butin Précieux : ${itemData.emoji} **${itemData.name}**\n`;
      }
      expBox += UI.boxEnd();
      return message.reply(expBox);
    }

    // ==========================================
    // ⚔️ SUBCOMMANDE : BATTLE (COMBAT CONTRE FLOTTES PNJ)
    // ==========================================
    if (subCommand === "battle") {
      if (!userLink) return message.reply("❌ | Vous devez posséder un navire de guerre pour engager le combat.");
      const crew = crews[userLink.crewId];
      const myShip = getShipStats(crew);

      // Simulation d'un navire corsaire ennemi
      const enemyHp = Math.floor(myShip.hp * (0.7 + Math.random() * 0.5));
      const enemyAtk = Math.floor((myShip.canons * 45) * (0.8 + Math.random() * 0.4));
      
      let myHp = myShip.hp;
      let curEnemyHp = enemyHp;
      let log = "";

      // Simulation rapide du duel au canon
      let round = 1;
      while (myHp > 0 && curEnemyHp > 0 && round <= 4) {
        let myDmg = Math.max(50, (myShip.canons * 50) - Math.floor(Math.random() * 20));
        curEnemyHp -= myDmg;
        if (curEnemyHp > 0) {
          let enemyDmg = Math.max(30, enemyAtk - myShip.def);
          myHp -= enemyDmg;
        }
        round++;
      }

      const victory = myHp > curEnemyHp;
      let batBox = UI.boxStart("Combat Naval") + `\n`;

      if (victory) {
        const loot = Math.floor(300000 + Math.random() * 400000);
        userMoney += loot;
        await usersData.set(senderID, { money: userMoney });
        crew.victories += 1;
        crew.xp += 1500;
        
        batBox += `│ 🏆 **VICTOIRE NAVALE !**\n│ Vous avez envoyé par le fond les pirates renégats.\n`;
        batBox += `│ 💰 Or pillé : **+${loot.toLocaleString()}$**\n`;
        batBox += `│ ⭐ XP Équipage : +1500 XP\n`;

        // Interconnexion Quêtes
        try {
          const questModule = require('./quest.js');
          if (questModule) questModule.incrementProgress(senderID, "arena_win", 1); 
        } catch(e){}
      } else {
        crew.failures += 1;
        batBox += `│ 💀 **DÉFAITE CRUELLE...**\n│ Votre coque a subi de lourds dégâts. Retrait stratégique effectué.\n`;
      }

      crews[userLink.crewId] = crew;
      writeDB(CREWS_FILE, crews);
      batBox += UI.boxEnd();
      return message.reply(batBox);
    }

    // ==========================================
    // 🏴 SUBCOMMANDE : WAR (GUERRE INTER-ÉQUIPAGES MULTIJOUEUR)
    // ==========================================
    if (subCommand === "war") {
      if (!userLink || userLink.role !== "CAPTAIN") return message.reply("❌ | Seul le Capitaine suprême d'une flotte peut déclarer une guerre navale.");
      
      const enemyCrewId = args[1]?.toUpperCase();
      if (!enemyCrewId || !crews[enemyCrewId]) return message.reply("❌ | Identifiant d'équipage ennemi invalide ou introuvable : `pirate war <ID_Crew>`");
      if (enemyCrewId === userLink.crewId) return message.reply("❌ | Vous ne pouvez pas déclarer la guerre à votre propre flotte.");

      const attackerCrew = crews[userLink.crewId];
      const defenderCrew = crews[enemyCrewId];

      const attackShip = getShipStats(attackerCrew);
      const defendShip = getShipStats(defenderCrew);

      // Calcul de la puissance d'artillerie totale ajustée par le nombre de membres actifs
      const powerA = attackShip.hp + (attackShip.canons * 120) * attackerCrew.members.length;
      const powerB = defendShip.hp + (defendShip.canons * 120) * defenderCrew.members.length;

      let warBox = UI.boxStart("Déclaration de Guerre") + `\n`;
      warBox += `│ ⚔️ **${attackerCrew.name}** vs **${defenderCrew.name}**\n`;
      warBox += `${UI.line}\n`;

      if (powerA > powerB) {
        // Victoire de l'attaquant
        const stolenVault = Math.floor(defenderCrew.vault * 0.20); // Vol de 20% du coffre commun
        attackerCrew.vault += stolenVault;
        defenderCrew.vault -= stolenVault;
        attackerCrew.victories += 1;
        defenderCrew.failures += 1;

        warBox += `│ 🏆 Gagnant : **${attackerCrew.name}**\n`;
        warBox += `│ 💰 Butin de guerre capturé : **+${stolenVault.toLocaleString()}$**\n`;
      } else {
        // Victoire du défenseur
        const stolenVault = Math.floor(attackerCrew.vault * 0.20);
        attackerCrew.vault -= stolenVault;
        defenderCrew.vault += stolenVault;
        attackerCrew.failures += 1;
        defenderCrew.victories += 1;

        warBox += `│ 🏆 Gagnant : **${defenderCrew.name}** (Défense héroïque)\n`;
        warBox += `│ 💰 Réparation de guerre exigée : **+${stolenVault.toLocaleString()}$**\n`;
      }

      crews[userLink.crewId] = attackerCrew;
      crews[enemyCrewId] = defenderCrew;
      writeDB(CREWS_FILE, crews);

      warBox += UI.boxEnd();
      return message.reply(warBox);
    }

    // ==========================================
    // 👹 SUBCOMMANDE : BOSS (RAIDS MYTHIQUES DES MERS)
    // ==========================================
    if (subCommand === "boss") {
      if (!userLink) return message.reply("❌ | Rejoignez un équipage pour participer aux grands raids de l'océan.");
      const crew = crews[userLink.crewId];
      const ship = getShipStats(crew);
      
      const bossKey = args[1]?.toLowerCase();
      if (!bossKey || !OCEAN_BOSSES[bossKey]) {
        let bossList = `👹 **[RAIDS DES MONSTRES ET DIEUX MARINS]**\n${UI.line}\n`;
        for (const [key, b] of Object.entries(OCEAN_BOSSES)) {
          bossList += `${b.emoji} **${b.name}**\n│ ❤️ HP : ${b.hp.toLocaleString()} | ⚔️ ATK : ${b.atk}\n│ 💰 Récompense : ${b.rewardGold.toLocaleString()}$\n│ ➔ \`pirate boss ${key}\`\n${UI.line}\n`;
        }
        return message.reply(bossList);
      }

      const boss = OCEAN_BOSSES[bossKey];
      // Calcul de la force de frappe collective (Canons de base * Nombre de marins à bord)
      const fleetAtk = (ship.canons * 60) * crew.members.length;
      const fleetHp = ship.hp;

      let rounds = 0;
      let curBossHp = boss.hp;
      let curFleetHp = fleetHp;

      while (curBossHp > 0 && curFleetHp > 0) {
        curBossHp -= fleetAtk;
        if (curBossHp > 0) {
          curFleetHp -= Math.max(10, boss.atk - ship.def);
        }
        rounds++;
      }

      let raidBox = UI.boxStart("Raid de Faction") + `\n`;
      if (curFleetHp > curBossHp) {
        // Victoire collective éclatante
        const goldPerMember = Math.file = Math.floor(boss.rewardGold / crew.members.length);
        
        // Distribution immédiate de la prime au portefeuille du capitaine/joueur qui lance l'assaut
        userMoney += goldPerMember;
        await usersData.set(senderID, { money: userMoney });

        crew.vault += Math.floor(boss.rewardGold * 0.30); // 30% bonus versés dans le coffre commun
        crew.xp += 5000;

        raidBox += `│ 🎉 **LÉGENDE ÉTABLIE !**\n│ Vous avez terrassé **${boss.name}** !\n`;
        raidBox += `│ 🪙 Votre part du butin : **+${goldPerMember.toLocaleString()}$**\n`;
        raidBox += `│ 🏦 Bonus coffre commun : +${Math.floor(boss.rewardGold * 0.30).toLocaleString()}$\n`;
        raidBox += `│ ✨ XP Flotte : +5000 XP\n`;
      } else {
        raidBox += `│ 💀 **NAUFRAGE TOTAL...**\n│ ${boss.name} a pulvérisé votre flotte. Vos hommes d'équipage nagent au milieu des débris.\n`;
      }

      crews[userLink.crewId] = crew;
      writeDB(CREWS_FILE, crews);
      raidBox += UI.boxEnd();
      return message.reply(raidBox);
    }

    // ==========================================
    // 📈 SUBCOMMANDE : TOP (TABLEAUX DE CLASSEMENT)
    // ==========================================
    if (subCommand === "top" || subCommand === "leaderboard") {
      let crewList = Object.values(crews);
      if (crewList.length === 0) return message.reply("🏁 | Aucun équipage n'a encore planté son pavillon sur l'océan.");

      // Tri par niveau puis par nombre de victoires
      crewList.sort((a, b) => b.level - a.level || b.victories - a.victories);

      let topMsg = `🏆 **[PANTHÉON DES FLOTTES ET AMIRAUX]**\n${UI.line}\n`;
      crewList.slice(0, 10).forEach((cr, index) => {
        topMsg += `${index + 1}. ${cr.emoji} **${cr.name}** (Niv. ${cr.level})\n│ ➔ 🟩 ${cr.victories} Victoires | 💰 Coffre: ${cr.vault.toLocaleString()}$\n`;
      });

      return message.reply(topMsg);
    }

    return message.reply("❌ | Option inconnue. Entrez la commande brute `~pirate` pour ouvrir le grimoire de bord.");
  }
};
