/**
 * @file pet.js
 * @description Système de Familiers MMORPG Ultra Premium & Interconnecté pour GoatBot v2
 * @version 1.0.0
 * @author Collaborateur IA RPG
 */

const fs = require('fs');
const path = require('path');

// ==========================================
// 📁 CONFIGURATION ET INFRASTRUCTURE DE STOCKAGE
// ==========================================
const DATA_DIR = path.join(__dirname, 'cache', 'petsMMO');
const PLAYER_PETS_FILE = path.join(DATA_DIR, 'player_pets.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(PLAYER_PETS_FILE)) fs.writeFileSync(PLAYER_PETS_FILE, JSON.stringify({}, null, 2));

// ==========================================
// 🥚 BASE DE DONNÉES DES ŒUFS ET PROBABILITÉS
// ==========================================
const EGGS_DB = {
  common: { id: "common", name: "Common Egg", emoji: "🥚", price: 50000, rates: { common: 0.70, uncommon: 0.25, rare: 0.05, epic: 0, legendary: 0, mythic: 0, divine: 0 } },
  uncommon: { id: "uncommon", name: "Uncommon Egg", emoji: "🟢", price: 150000, rates: { common: 0.20, uncommon: 0.60, rare: 0.15, epic: 0.05, legendary: 0, mythic: 0, divine: 0 } },
  rare: { id: "rare", name: "Rare Egg", emoji: "🔵", price: 500000, rates: { common: 0.05, uncommon: 0.20, rare: 0.55, epic: 0.15, legendary: 0.05, mythic: 0, divine: 0 } },
  epic: { id: "epic", name: "Epic Egg", emoji: "🟣", price: 1500000, rates: { common: 0, uncommon: 0.05, rare: 0.20, epic: 0.55, legendary: 0.15, mythic: 0.05, divine: 0 } },
  legendary: { id: "legendary", name: "Legendary Egg", emoji: "🟠", price: 5000000, rates: { common: 0, uncommon: 0, rare: 0.05, epic: 0.20, legendary: 0.55, mythic: 0.16, divine: 0.04 } },
  mythic: { id: "mythic", name: "Mythic Egg", emoji: "🔴", price: 15000000, rates: { common: 0, uncommon: 0, rare: 0, epic: 0.10, legendary: 0.25, mythic: 0.50, divine: 0.15 } },
  divine: { id: "divine", name: "Divine Egg", emoji: "🌈", price: 50000000, rates: { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0.15, mythic: 0.35, divine: 0.50 } }
};

// ==========================================
// 🌌 BASE DE DONNÉES SÉRIALISÉE DES FAMILIERS (EXTRAIT ET EXTENSIBLE)
// ==========================================
const PETS_REGISTRY = {
  // --- FAMILLE CHIEN ---
  "chien_1": { id: "chien_1", baseName: "Chiot", emoji: "🐶", rarity: "common", talent: "Lucky", baseHp: 120, baseAtk: 15, baseDef: 10, evoLevel: 15, nextEvoId: "chien_2", bonus: { type: "moneyMultiplier", value: 0.05 } },
  "chien_2": { id: "chien_2", baseName: "Chien de Chasse", emoji: "🐕", rarity: "rare", talent: "Lucky", baseHp: 250, baseAtk: 35, baseDef: 22, evoLevel: 35, nextEvoId: "chien_3", bonus: { type: "moneyMultiplier", value: 0.10 } },
  "chien_3": { id: "chien_3", baseName: "Chien Alpha", emoji: "🐺", rarity: "epic", talent: "Lucky", baseHp: 550, baseAtk: 80, baseDef: 55, evoLevel: null, nextEvoId: null, bonus: { type: "moneyMultiplier", value: 0.15 } },

  // --- FAMILLE LOUP ---
  "loup_1": { id: "loup_1", baseName: "Louveteau", emoji: "🐺", rarity: "uncommon", talent: "Assassin", baseHp: 150, baseAtk: 22, baseDef: 12, evoLevel: 20, nextEvoId: "loup_2", bonus: { type: "atkMultiplier", value: 0.06 } },
  "loup_2": { id: "loup_2", baseName: "Loup Hurlant", emoji: "🐺", rarity: "epic", talent: "Assassin", baseHp: 400, baseAtk: 65, baseDef: 38, evoLevel: 40, nextEvoId: "loup_3", bonus: { type: "atkMultiplier", value: 0.12 } },
  "loup_3": { id: "loup_3", baseName: "Loup Fantomatique", emoji: "👁️‍🗨️", rarity: "legendary", talent: "Assassin", baseHp: 950, baseAtk: 160, baseDef: 90, evoLevel: null, nextEvoId: null, bonus: { type: "atkMultiplier", value: 0.20 } },

  // --- FAMILLE DRAGON ---
  "dragon_1": { id: "dragon_1", baseName: "Petit Dragon", emoji: "🦎", rarity: "epic", talent: "Berserker", baseHp: 300, baseAtk: 45, baseDef: 30, evoLevel: 25, nextEvoId: "dragon_2", bonus: { type: "globalXpMultiplier", value: 0.10 } },
  "dragon_2": { id: "dragon_2", baseName: "Dragon de Feu", emoji: "🐉", rarity: "legendary", talent: "Berserker", baseHp: 800, baseAtk: 120, baseDef: 75, evoLevel: 45, nextEvoId: "dragon_3", bonus: { type: "globalXpMultiplier", value: 0.18 } },
  "dragon_3": { id: "dragon_3", baseName: "Dragon Royal", emoji: "👑", rarity: "mythic", talent: "Berserker", baseHp: 1800, baseAtk: 280, baseDef: 170, evoLevel: 60, nextEvoId: "dragon_4", bonus: { type: "globalXpMultiplier", value: 0.25 } },
  "dragon_4": { id: "dragon_4", baseName: "Dragon Divin", emoji: "🐉", rarity: "divine", talent: "Berserker", baseHp: 4500, baseAtk: 650, baseDef: 400, evoLevel: null, nextEvoId: null, bonus: { type: "globalXpMultiplier", value: 0.40 } },

  // --- FAMILLE KRAKEN ---
  "kraken_1": { id: "kraken_1", baseName: "Tentacule Naissant", emoji: "🦑", rarity: "epic", talent: "Pirate", baseHp: 350, baseAtk: 38, baseDef: 35, evoLevel: 30, nextEvoId: "kraken_2", bonus: { type: "treasureChance", value: 0.10 } },
  "kraken_2": { id: "kraken_2", baseName: "Kraken des Abysses", emoji: "🌊", rarity: "legendary", talent: "Pirate", baseHp: 900, baseAtk: 110, baseDef: 95, evoLevel: 50, nextEvoId: "kraken_3", bonus: { type: "treasureChance", value: 0.20 } },
  "kraken_3": { id: "kraken_3", baseName: "Kraken Mythologique", emoji: "🐙", rarity: "mythic", talent: "Pirate", baseHp: 2200, baseAtk: 290, baseDef: 240, evoLevel: null, nextEvoId: null, bonus: { type: "treasureChance", value: 0.35 } }
};

const RARITY_DETAILS = {
  common: { name: "Commun", color: "⚪", crit: 0.05, dodge: 0.05 },
  uncommon: { name: "Inhabituel", color: "🟢", crit: 0.07, dodge: 0.06 },
  rare: { name: "Rare", color: "🔵", crit: 0.10, dodge: 0.08 },
  epic: { name: "Épique", color: "🟣", crit: 0.13, dodge: 0.10 },
  legendary: { name: "Légendaire", color: "🟠", crit: 0.16, dodge: 0.12 },
  mythic: { name: "Mythique", color: "🔴", crit: 0.20, dodge: 0.15 },
  divine: { name: "Divin", color: "🌈", crit: 0.25, dodge: 0.20 }
};

// ==========================================
// 🛠 UTILITIES : ENTRÉES / SORTIES & LOGIQUE RPG
// ==========================================
function readJSON(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { return {}; }
}
function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
}

function getPlayerStorage(uid) {
  const db = readJSON(PLAYER_PETS_FILE);
  if (!db[uid]) {
    db[uid] = { activePetId: null, inventory: [], lastFeed: 0, lastPlay: 0, lastTrain: 0 };
    writeJSON(PLAYER_PETS_FILE, db);
  }
  return db[uid];
}

function savePlayerStorage(uid, data) {
  const db = readJSON(PLAYER_PETS_FILE);
  db[uid] = data;
  writeJSON(PLAYER_PETS_FILE, db);
}

function calculateStats(pet) {
  const spec = PETS_REGISTRY[pet.baseId];
  if (!spec) return {};
  
  // Modificateurs d'état liés à la faim et au bonheur
  let efficiency = 1.0;
  if (pet.hunger < 30) efficiency -= 0.25;
  if (pet.happiness > 80) efficiency += 0.10;

  const levelFactor = 1 + (pet.level - 1) * 0.12;

  return {
    hp: Math.floor(spec.baseHp * levelFactor * efficiency),
    atk: Math.floor(spec.baseAtk * levelFactor * efficiency),
    def: Math.floor(spec.baseDef * levelFactor * efficiency),
    crit: RARITY_DETAILS[spec.rarity].crit + (pet.happiness / 1000),
    dodge: RARITY_DETAILS[spec.rarity].dodge
  };
}

const UI = {
  line: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
  boxStart: (title) => `╭───────────── 🐾 ─────────────╮\n│ 🔮  ${title.toUpperCase()}\n├───────────────────────────────`,
  boxEnd: () => `╰───────────────────────────────╯`,
  field: (label, val) => `│ 🔸 ${label} : ${val}`
};

// ==========================================
// 🛡️ CONFIGURATION ET INTERFACE DU MODULE GOATBOT
// ==========================================
module.exports = {
  config: {
    name: "pet",
    aliases: ["familiers", "pets", "companion"],
    version: "1.0.0",
    author: "Collaborateur IA RPG",
    countDown: 2,
    role: 0,
    description: "Système de familiers MMORPG complet connecté aux modules économiques et de combat.",
    category: "game",
    guide: { fr: "{p}pet [sous-commande]", en: "{p}pet [subcommand]" }
  },

  onStart: async function ({ api, event, args, usersData, message }) {
    const { senderID, threadID } = event;
    const player = getPlayerStorage(senderID);
    const subCommand = args[0]?.toLowerCase();

    // Récupération sécurisée du solde monétaire du joueur via le middleware de GoatBot
    let userData = await usersData.get(senderID);
    let userMoney = userData.money || 0;

    // ==========================================
    // 📜 INTERFACE : MENU D'AIDE AUTOMATIQUE (SI "pet" UNIQUEMENT)
    // ==========================================
    if (!subCommand) {
      let menu = `╭───────────────────────────────────────╮\n`;
      menu += `│ 🐾  𝐒𝐘𝐒𝐓È𝐌𝐄 𝐃𝐄 𝐅𝐀𝐌𝐈𝐋𝐈𝐄𝐑𝐒 𝐌𝐌𝐎𝐑𝐏𝐆\n`;
      menu += `├───────────────────────────────────────┤\n`;
      menu += `│ 🔹 ~pet buy <type> : Acheter un œuf du catalogue\n`;
      menu += `│ 🔹 ~pet adopt : Éclore un œuf de votre inventaire\n`;
      menu += `│ 🔹 ~pet hatch : Synonyme d'adoption et d'éclosion\n`;
      menu += `│ 🔹 ~pet info [index] : Examiner la fiche d'un familier\n`;
      menu += `│ 🔹 ~pet list : Consulter votre ménagerie complète\n`;
      menu += `│ 🔹 ~pet equip <index> : Assigner le familier actif\n`;
      menu += `│ 🔹 ~pet unequip : Renvoyer le familier actif au ranch\n`;
      menu += `├───────────────────────────────────────┤\n`;
      menu += `│ 🍖 𝐒𝐎𝐈𝐍𝐒 & 𝐏𝐑𝐎𝐆𝐑𝐄𝐒𝐒𝐈𝐎𝐍\n`;
      menu += `├───────────────────────────────────────┤\n`;
      menu += `│ 🔹 ~pet feed : Nourrir pour restaurer la faim (+25)\n`;
      menu += `│ 🔹 ~pet play : Jouer pour restaurer le bonheur (+20)\n`;
      menu += `│ 🔹 ~pet train : Entraîner au combat (+XP & Fatigue)\n`;
      menu += `│ 🔹 ~pet evolve <index> : Déclencher une mutation de rang\n`;
      menu += `│ 🔹 ~pet rename <index> <nom> : Personnaliser le patronyme\n`;
      menu += `│ 🔹 ~pet sell <index> : Revendre un familier contre de l'or\n`;
      menu += `├───────────────────────────────────────┤\n`;
      menu += `│ 🏆 ⚔️  𝐂𝐎𝐌𝐏É𝐓𝐈𝐓𝐈𝐎𝐍 & 𝐂𝐋𝐀𝐒𝐒𝐄𝐌𝐄𝐍𝐓𝐒\n`;
      menu += `├───────────────────────────────────────┤\n`;
      menu += `│ 🔹 ~pet battle : Lancer un duel sauvage synchrone\n`;
      menu += `│ 🔹 ~pet leaderboard : Consulter le Panthéon des Maîtres\n`;
      menu += `├───────────────────────────────────────┤\n`;
      menu += `│ ✨ Les familiers actifs s'interconnectent et agissent\n`;
      menu += `│    dans : arena, pirate, quest, bank & mining !\n`;
      menu += `╰───────────────────────────────────────╯`;
      return message.reply(menu);
    }

    // ==========================================
    // 🛒 SOUS-COMMANDE : BUY (ACHAT D'ŒUFS DANS LA BOUTIQUE)
    // ==========================================
    if (subCommand === "buy") {
      const typeInput = args[1]?.toLowerCase();
      if (!typeInput || !EGGS_DB[typeInput]) {
        let shopMsg = `🛒 **[MARCHÉ AUX ŒUFS DE L'EMPIRE]**\n${UI.line}\n`;
        for (const [id, egg] of Object.entries(EGGS_DB)) {
          shopMsg += `${egg.emoji} **${egg.name}** ➔ 💰 ${egg.price.toLocaleString()}$ (~pet buy ${id})\n`;
        }
        return message.reply(shopMsg);
      }

      const selectedEgg = EGGS_DB[typeInput];
      if (userMoney < selectedEgg.price) {
        return message.reply(`💰 | Vos finances personnelles sont insuffisantes. Cet œuf requiert **${selectedEgg.price.toLocaleString()}$**.`);
      }

      // Transaction financière
      userMoney -= selectedEgg.price;
      await usersData.set(senderID, { money: userMoney });

      // Initialisation de la réserve d'œufs si inexistante
      if (!player.eggsInventory) player.eggsInventory = {};
      player.eggsInventory[selectedEgg.id] = (player.eggsInventory[selectedEgg.id] || 0) + 1;

      savePlayerStorage(senderID, player);
      return message.reply(`📦 | **ACHAT EFFECTUÉ :** Vous obtenez un ${selectedEgg.emoji} **${selectedEgg.name}**. Utilisez \`pet hatch\` ou \`pet adopt\` pour briser sa coquille !`);
    }

    // ==========================================
    // 🐣 SOUS-COMMANDES : ADOPT & HATCH (MÉCANIQUE GACHA D'ÉCLOSION)
    // ==========================================
    if (subCommand === "adopt" || subCommand === "hatch") {
      if (!player.eggsInventory || Object.values(player.eggsInventory).every(v => v === 0)) {
        return message.reply("❌ | Votre réserve est vide. Visitez d'abord la boutique impériale via `pet buy`.");
      }

      // Sélection automatique du premier œuf disponible en stock
      let availableEggKey = Object.keys(player.eggsInventory).find(k => player.eggsInventory[k] > 0);
      const targetEgg = EGGS_DB[availableEggKey];

      // Consommation de l'objet dans l'inventaire joueur
      player.eggsInventory[availableEggKey] -= 1;

      // Algorithme de sélection de rareté par distribution de probabilités (Gacha Core)
      const roll = Math.random();
      let accumulatedProbability = 0;
      let selectedRarity = "common";

      for (const [rarity, rate] of Object.entries(targetEgg.rates)) {
        accumulatedProbability += rate;
        if (roll <= accumulatedProbability) {
          selectedRarity = rarity;
          break;
        }
      }

      // Extraction des familiers correspondants à la rareté tirée dans le catalogue global
      const matchingIds = Object.keys(PETS_REGISTRY).filter(id => {
        // On ne fait éclore que les formes de base (Niveau 1)
        return PETS_REGISTRY[id].rarity === selectedRarity && id.endsWith("_1");
      });

      // Secours technique si catalogue incomplet sur une rareté spécifique
      const finalPetId = matchingIds.length > 0 
        ? matchingIds[Math.floor(Math.random() * matchingIds.length)]
        : "chien_1";

      const petSpec = PETS_REGISTRY[finalPetId];
      const rarityData = RARITY_DETAILS[petSpec.rarity];

      // Génération de la nouvelle instance de familier avec statistiques individuelles de départ
      const newPetInstance = {
        uniqueId: generateUID(),
        baseId: petSpec.id,
        customName: null,
        level: 1,
        xp: 0,
        hunger: 100,
        happiness: 100,
        birthday: new Date().toLocaleDateString('fr-FR'),
        age: 0
      };

      player.inventory.push(newPetInstance);
      
      // Auto-équipement si aucun familier n'est actif sur le profil du joueur
      if (!player.activePetId) {
        player.activePetId = newPetInstance.uniqueId;
      }

      savePlayerStorage(senderID, player);

      let hatchBox = UI.boxStart("Éclosion Réussie !") + `\n`;
      hatchBox += `│ Coquille brisée : ${targetEgg.emoji} ${targetEgg.name}\n`;
      hatchBox += `${UI.line}\n`;
      hatchBox += `│ 🎉 Créature : ${petSpec.emoji} **${petSpec.baseName}**\n`;
      hatchBox += `│ ✨ Rareté : ${rarityData.color} **${rarityData.name}**\n`;
      hatchBox += `│ 💠 Talent Inné : \`${petSpec.talent}\`\n`;
      hatchBox += `│ 📊 Statut Initial : Niv.1 | ❤️ HP: ${petSpec.baseHp} | ⚔️ ATK: ${petSpec.baseAtk}\n`;
      hatchBox += `${UI.line}\n│ *Ce familier a rejoint votre collection et a été assigné par défaut !*\n` + UI.boxEnd();
      return message.reply(hatchBox);
    }

    // ==========================================
    // 📊 SOUS-COMMANDE : INFO (FICHE DE STATISTIQUES RPG)
    // ==========================================
    if (subCommand === "info") {
      const indexInput = parseInt(args[1]) - 1;
      let petInstance = null;

      // Si aucun index n'est fourni, on cible le familier équipé par défaut
      if (isNaN(indexInput)) {
        if (!player.activePetId) return message.reply("❌ | Vous n'avez aucun familier actif. Équipez-en un ou spécifiez son index : `pet info 1`.");
        petInstance = player.inventory.find(p => p.uniqueId === player.activePetId);
      } else {
        petInstance = player.inventory[indexInput];
      }

      if (!petInstance) return message.reply("❌ | Aucun familier ne correspond à cet index dans votre collection.");

      const spec = PETS_REGISTRY[petInstance.baseId];
      const rarityData = RARITY_DETAILS[spec.rarity];
      const stats = calculateStats(petInstance);
      const nextXp = petInstance.level * 1200;

      let card = UI.boxStart(`Profil : ${petInstance.customName || spec.baseName}`) + `\n`;
      card += `${UI.field("Espèce Originelle", spec.baseName)}\n`;
      card += `${UI.field("Rareté d'Origine", `${rarityData.color} ${rarityData.name}`)}\n`;
      card += `${UI.field("Âge / Naissance", `${petInstance.age} jours (${petInstance.birthday})`)}\n`;
      card += `${UI.field("Statut d'Attache", player.activePetId === petInstance.uniqueId ? "⚔️ ÉQUIPÉ (Actif)" : "💤 Au Ranch")}\n`;
      card += `${UI.line}\n`;
      card += `${UI.field("Niveau", `Niv. ${petInstance.level} (XP: ${petInstance.xp} / ${nextXp})`)}\n`;
      card += `${UI.field("Ration / Faim", `${petInstance.hunger} / 100 🍖`)}\n`;
      card += `${UI.field("Affection / Bonheur", `${petInstance.happiness} / 100 ❤️`)}\n`;
      card += `${UI.line}\n`;
      card += `│  📊 STATISTIQUES COMBAT AUTOMATIQUES :\n`;
      card += `${UI.field("Points de Vie (HP)", stats.hp)}\n`;
      card += `${UI.field("Puissance (ATK)", stats.atk)}\n`;
      card += `${UI.field("Robustesse (DEF)", stats.def)}\n`;
      card += `${UI.field("Coup Critique", `${Math.floor(stats.crit * 100)}%`)}\n`;
      card += `${UI.field("Esquive Tactique", `${Math.floor(stats.dodge * 100)}%`)}\n`;
      card += `${UI.line}\n`;
      card += `${UI.field("Talent Passif", `\`${spec.talent}\``)}\n`;
      
      let bonusDesc = "Aucun";
      if (spec.bonus.type === "moneyMultiplier") bonusDesc = `+${Math.floor(spec.bonus.value * 100)}% Or gagné`;
      if (spec.bonus.type === "atkMultiplier") bonusDesc = `+${Math.floor(spec.bonus.value * 100)}% DMG globaux`;
      if (spec.bonus.type === "globalXpMultiplier") bonusDesc = `+${Math.floor(spec.bonus.value * 100)}% XP globale`;
      if (spec.bonus.type === "treasureChance") bonusDesc = `+${Math.floor(spec.bonus.value * 100)}% Butins Pirate`;
      card += `${UI.field("Effet Interconnecté", bonusDesc)}\n`;
      card += UI.boxEnd();

      return message.reply(card);
    }

    // ==========================================
    // 📋 SOUS-COMMANDE : LIST (PANORAMA DE LA MÉNAGERIE)
    // ==========================================
    if (subCommand === "list") {
      if (player.inventory.length === 0) {
        return message.reply("🐾 | Votre ménagerie est totalement vide. Éclairez votre route en achetant un œuf via `pet buy`.");
      }

      let listMsg = `🐾 **[VOTRE MÉNAGERIE — COLLECTION PRIVÉE]**\n`;
      if (player.eggsInventory) {
        let eggsStr = "";
        for (const [eId, count] of Object.entries(player.eggsInventory)) {
          if (count > 0) eggsStr += `${EGGS_DB[eId].emoji}x${count} `;
        }
        if (eggsStr) listMsg += `🥚 Stock d'œufs : ${eggsStr}\n`;
      }
      listMsg += `${UI.line}\n`;

      player.inventory.forEach((p, idx) => {
        const spec = PETS_REGISTRY[p.baseId];
        const isEquipped = player.activePetId === p.uniqueId ? "⚔️ [ACTIF]" : "💤";
        const displayName = p.customName ? `${p.customName} (${spec.baseName})` : spec.baseName;
        listMsg += `${idx + 1}. ${isEquipped} ${spec.emoji} **${displayName}** | Niv. ${p.level} | 🍖 ${p.hunger}% | ❤️ ${p.happiness}%\n`;
      });

      listMsg += `${UI.line}\nℹ️ *Pour interagir ou équiper : \`pet equip ${player.inventory.length}\` / \`pet info ${player.inventory.length}\`*`;
      return message.reply(listMsg);
    }

    // ==========================================
    // ⚔️ SOUS-COMMANDES : EQUIP & UNEQUIP (AFFECTATION DU COMPAGNON)
    // ==========================================
    if (subCommand === "equip") {
      const indexInput = parseInt(args[1]) - 1;
      if (isNaN(indexInput) || !player.inventory[indexInput]) {
        return message.reply("❌ | Index manquant ou invalide. Utilisation : `pet equip <numéro de la liste>`");
      }

      const targetPet = player.inventory[indexInput];
      if (player.activePetId === targetPet.uniqueId) {
        return message.reply("❌ | Ce familier est déjà à vos côtés sur le champ de bataille.");
      }

      player.activePetId = targetPet.uniqueId;
      savePlayerStorage(senderID, player);

      const spec = PETS_REGISTRY[targetPet.baseId];
      return message.reply(`⚔️ | **DEPLOIEMENT REUSSI :** ${spec.emoji} **${targetPet.customName || spec.baseName}** est désormais votre compagnon de combat officiel.`);
    }

    if (subCommand === "unequip") {
      if (!player.activePetId) {
        return message.reply("❌ | Vous n'avez aucun familier actuellement équipé à vos côtés.");
      }

      player.activePetId = null;
      savePlayerStorage(senderID, player);
      return message.reply("💤 | **RANCH :** Votre compagnon a été retiré du front et renvoyé se reposer dans vos écuries.");
    }

    // ==========================================
    // ✒️ SOUS-COMMANDE : RENAME (PERSONNALISATION EMBLEMATHIQUE)
    // ==========================================
    if (subCommand === "rename") {
      const indexInput = parseInt(args[1]) - 1;
      const newName = args.slice(2).join(" ");

      if (isNaN(indexInput) || !player.inventory[indexInput]) {
        return message.reply("❌ | Index de familier requis. Usage : `pet rename <index> <nouveau nom>`");
      }
      if (!newName || newName.trim() === "") {
        return message.reply("❌ | Veuillez spécifier un nom digne de ce nom pour votre créature.");
      }
      if (newName.length > 16) {
        return message.reply("❌ | Le nom choisi est trop long (Maximum 16 caractères).");
      }

      player.inventory[indexInput].customName = newName.trim();
      savePlayerStorage(senderID, player);

      const spec = PETS_REGISTRY[player.inventory[indexInput].baseId];
      return message.reply(`✒️ | **BAPTÊME :** Votre ${spec.emoji} **${spec.baseName}** s'appelle désormais officiellement **${newName}** !`);
    }

    // ==========================================
    // 💰 SOUS-COMMANDE : SELL (COMMERCE ET REVENTE)
    // ==========================================
    if (subCommand === "sell") {
      const indexInput = parseInt(args[1]) - 1;
      if (isNaN(indexInput) || !player.inventory[indexInput]) {
        return message.reply("❌ | Veuillez indiquer l'index du familier à licencier : `pet sell <index>`");
      }

      const targetPet = player.inventory[indexInput];
      if (player.activePetId === targetPet.uniqueId) {
        return message.reply("❌ | Impossible de marchander un familier équipé. Veuillez le déséquiper via `pet unequip` au préalable.");
      }

      const spec = PETS_REGISTRY[targetPet.baseId];
      
      // Algorithme d'estimation marchande indexé sur le niveau et le palier d'œuf
      const baseValues = { common: 15000, uncommon: 45000, rare: 150000, epic: 450000, legendary: 1500000, mythic: 4500000, divine: 15000000 };
      const baseVal = baseValues[spec.rarity] || 10000;
      const finalSellPrice = Math.floor(baseVal * (1 + (targetPet.level - 1) * 0.08));

      // Retrait définitif du tableau
      player.inventory.splice(indexInput, 1);
      
      // Crédit monétaire
      userMoney += finalSellPrice;
      await usersData.set(senderID, { money: userMoney });
      savePlayerStorage(senderID, player);

      return message.reply(`💰 | **CONTRAT COMMERCIAL :** Vous vendez votre ${spec.emoji} **${targetPet.customName || spec.baseName}** (Niv. ${targetPet.level}) au marché noir pour **+${finalSellPrice.toLocaleString()}$**.`);
        }
