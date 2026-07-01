/**
 * @file ranch.js
 * @description Simulateur d'Élevage RPG & Gestion de Domaine Agricole pour GoatBot v2
 * @version 1.0.0
 * @author Collaborateur IA RPG
 */

const fs = require('fs');
const path = require('path');

// ==========================================
// 📁 CONFIGURATION ET PERSISTANCE DES DONNÉES
// ==========================================
const DATA_DIR = path.join(__dirname, 'cache', 'ranchMMO');
const RANCH_FILE = path.join(DATA_DIR, 'player_ranches.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(RANCH_FILE)) fs.writeFileSync(RANCH_FILE, JSON.stringify({}, null, 2));

// ==========================================
// 🧬 ENCYCLOPÉDIE DES ANIMAUX ET RARÈTÉS
// ==========================================
const RARITIES = {
  common: { name: "Commun", color: "⚪", mult: 1.0 },
  rare: { name: "Rare", color: "🔵", mult: 1.8 },
  epic: { name: "Épique", color: "🟣", mult: 2.8 },
  legendary: { name: "Légendaire", color: "🟠", mult: 4.5 },
  mythic: { name: "Mythique", color: "🔴", mult: 8.0 },
  divine: { name: "Divin Ultimate", color: "🌈", mult: 15.0 }
};

const ANIMAL_TEMPLATES = {
  poulet: { id: "poulet", name: "Poulet", emoji: "🐔", cost: 5000, rarity: "common", prodTime: 60, product: "🥚 Œuf de Ferme", baseValue: 150 },
  canard: { id: "canard", name: "Canard", emoji: "🦆", cost: 12000, rarity: "common", prodTime: 90, product: "🪶 Plume Soyeuse", baseValue: 400 },
  lapin: { id: "lapin", name: "Lapin", emoji: "🐇", cost: 25000, rarity: "common", prodTime: 120, product: "🧶 Fourrure Douce", baseValue: 900 },
  mouton: { id: "mouton", name: "Mouton", emoji: "🐑", cost: 60000, rarity: "common", prodTime: 180, product: "🧶 Pelote de Laine", baseValue: 2200 },
  chevre: { id: "chevre", name: "Chèvre", emoji: "🐐", cost: 130000, rarity: "rare", prodTime: 240, product: "🧀 Fromage de Chèvre", baseValue: 5500 },
  cochon: { id: "cochon", name: "Cochon", emoji: "🐖", cost: 280000, rarity: "rare", prodTime: 300, product: "🍖 Viande de Qualité", baseValue: 12000 },
  vache: { id: "vache", name: "Vache", emoji: "🐄", cost: 650000, rarity: "rare", prodTime: 360, product: "🥛 Litre de Lait", baseValue: 28000 },
  cheval: { id: "cheval", name: "Cheval", emoji: "🐎", cost: 1500000, rarity: "epic", prodTime: 420, product: "🐎 Fer de Chance", baseValue: 70000 },
  lama: { id: "lama", name: "Lama", emoji: "🦙", cost: 3500000, rarity: "epic", prodTime: 480, product: "🧶 Laine de Lama Alpaga", baseValue: 180000 },
  bison: { id: "bison", name: "Bison", emoji: "🦬", cost: 8000000, rarity: "epic", prodTime: 600, product: "🦬 Cuir Épais", baseValue: 450000 },
  cerf: { id: "cerf", name: "Cerf des Forêts", emoji: "🦌", cost: 18000000, rarity: "legendary", prodTime: 720, product: "🦌 Bois Sacré", baseValue: 1100000 },
  elephant: { id: "elephant", name: "Éléphant", emoji: "🐘", cost: 45000000, rarity: "legendary", prodTime: 900, product: "🏺 Relique d'Ivoire", baseValue: 3000000 },
  licorne: { id: "licorne", name: "Licorne Majestueuse", emoji: "🦄", cost: 120000000, rarity: "legendary", prodTime: 1200, product: "🔮 Crine Luminescent", baseValue: 9500000 },
  dragon: { id: "dragon", name: "Dragon Antique", emoji: "🐉", cost: 350000000, rarity: "mythic", prodTime: 1800, product: "🔥 Écaille de Soufre", baseValue: 32000000 },
  dragon_divin: { id: "dragon_divin", name: "Dragon Céleste Divin", emoji: "🐲", cost: 1000000000, rarity: "divine", prodTime: 3600, product: "💎 Essence d'Éternité", baseValue: 110000000 }
};

// ==========================================
// 🏡 STRUCTURES DE RANCH EVOLUTIVES
// ==========================================
const RANCH_UPGRADES = [
  { level: 1, name: "Petite Ferme", capacity: 4, cost: 0, speedBonus: 1.0 },
  { level: 2, name: "Grande Ferme", capacity: 8, cost: 250000, speedBonus: 1.05 },
  { level: 3, name: "Ranch Professionnel", capacity: 15, cost: 1500000, speedBonus: 1.15 },
  { level: 4, name: "Domaine Agricole", capacity: 30, cost: 10000000, speedBonus: 1.30 },
  { level: 5, name: "Ferme Royale", capacity: 60, cost: 75000000, speedBonus: 1.50 },
  { level: 6, name: "Ranch Mythique Interdimensionnel", capacity: 120, cost: 500000000, speedBonus: 2.00 }
];

// ==========================================
// 🌾 NOURRITURE ET COMPOSANTS DU SILO
// ==========================================
const FOOD_TYPES = {
  herbe: { name: "Herbe Fraîche", cost: 100, restore: 15 },
  ble: { name: "Blé Doré", cost: 250, restore: 30 },
  mais: { name: "Maïs Sucré", cost: 600, restore: 50 },
  carotte: { name: "Carotte Juteuse", cost: 1500, restore: 75 },
  premium: { name: "Croquettes Alpha Premium", cost: 5000, restore: 100 }
};

// ==========================================
// 🛠️ OUTILS ET UTILITIES DE SYNCHRONISATION
// ==========================================
function readDB(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { return {}; }
}
function writeDB(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
}

function getPlayerRanch(uid) {
  const db = readDB(RANCH_FILE);
  if (!db[uid]) {
    db[uid] = {
      level: 1,
      animals: [],
      storage: {}, // Produits récoltés en attente de vente
      silo: { herbe: 10, ble: 5, mais: 0, carotte: 0, premium: 0 },
      stats: { totalCollected: 0, totalEarnings: 0, successfulBreeds: 0 }
    };
    writeDB(RANCH_FILE, db);
  }
  return db[uid];
}

function savePlayerRanch(uid, data) {
  const db = readDB(RANCH_FILE);
  db[uid] = data;
  writeDB(RANCH_FILE, db);
}

const UI = {
  line: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
  boxStart: (title) => `╭───────────── 🚜 ─────────────╮\n│ 🌾  ${title.toUpperCase()}\n├───────────────────────────────`,
  boxEnd: () => `╰───────────────────────────────╯`,
  bar: (current, max, filledEmoji = "🟩", emptyEmoji = "⬛") => {
    const progress = Math.min(10, Math.max(0, Math.round((current / max) * 10)));
    return filledEmoji.repeat(progress) + emptyEmoji.repeat(10 - progress);
  }
};

// ==========================================
// 🛡️ ACCROCHE ET CONFIGURATION GOATBOT V2
// ==========================================
module.exports = {
  config: {
    name: "ranch",
    aliases: ["ferme", "elevage", "ranching", "farm"],
    version: "1.0.0",
    author: "Collaborateur IA RPG",
    countDown: 2,
    role: 0,
    description: "Simulateur complet de ranching RPG : Élevage, reproduction, cultures, récoltes et commerce.",
    category: "economy",
    guide: { fr: "{p}ranch [sous-commande]", en: "{p}ranch [subcommand]" }
  },

  onStart: async function ({ api, event, args, usersData, message }) {
    const { senderID, threadID } = event;
    const rData = getPlayerRanch(senderID);
    const subCommand = args[0]?.toLowerCase();

    let userData = await usersData.get(senderID);
    let userMoney = userData.money || 0;

    // ==========================================
    // 📜 INTERFACE : MENU D'AIDE CENTRALISÉ
    // ==========================================
    if (!subCommand) {
      let menu = `╭───────────────────────────────────────╮\n`;
      menu += `│ 🚜  𝐒𝐘𝐒𝐓È𝐌𝐄 𝐃𝐄 𝐑𝐀𝐍𝐂𝐇𝐈𝐍𝐆 𝐑𝐏𝐆\n`;
      menu += `├───────────────────────────────────────┤\n`;
      menu += `│ 🔹 ~ranch info : Bilan général de votre domaine\n`;
      menu += `│ 🔹 ~ranch inventory : Consulter votre bétail\n`;
      menu += `│ 🔹 ~ranch shop : Commander des animaux & semences\n`;
      menu += `│ 🔹 ~ranch buy <animal|nourriture> <nom> : Achats\n`;
      menu += `├───────────────────────────────────────┤\n`;
      menu += `│ 🥩 𝐋𝐎𝐆𝐈𝐒𝐓𝐈𝐐𝐔𝐄 & 𝐏𝐑𝐎𝐃𝐔𝐂𝐓𝐈𝐎𝐍\n`;
      menu += `├───────────────────────────────────────┤\n`;
      menu += `│ 🔹 ~ranch feed <index|all> <aliment> : Nourrir\n`;
      menu += `│ 🔹 ~ranch collect : Récolter la production laitière/œufs\n`;
      menu += `│ 🔹 ~ranch sell : Liquider le stock au marché local\n`;
      menu += `│ 🔹 ~ranch breed <index1> <index2> : Lancer une gestation\n`;
      menu += `│ 🔹 ~ranch upgrade : Agrandir vos infrastructures\n`;
      menu += `│ 🔹 ~ranch leaderboard : Classement des gros exploitants\n`;
      menu += `├───────────────────────────────────────┤\n`;
      menu += `│ 🔄 Vos gains financiers alimentent usersData.money\n`;
      menu += `│ 🔗 Connecté au module dynamique quest.js !\n`;
      menu += `╰───────────────────────────────────────╯`;
      return message.reply(menu);
        }

    // ==========================================
    // 📊 SOUS-COMMANDE : INFO (BILAN DU DOMAINE)
    // ==========================================
    if (subCommand === "info") {
      const currentConfig = RANCH_UPGRADES.find(u => u.level === rData.level) || RANCH_UPGRADES[0];
      
      let infoBox = UI.boxStart(`Exploitation de : ${(userData.name || "Fermier")}`) + `\n`;
      infoBox += `${UI.field("Rang du Domaine", `Niv.${rData.level} - **${currentConfig.name}**`)}\n`;
      infoBox += `${UI.field("Occupation des étables", `📋 ${rData.animals.length} / ${currentConfig.capacity} Animaux`)}\n`;
      infoBox += `${UI.field("Multiplicateur de vitesse", `⚡ x${currentConfig.speedBonus.toFixed(2)}`)}\n`;
      infoBox += `${UI.line}\n`;
      infoBox += `🌾 **RÉSERVES DU SILO (ALIMENTS) :**\n`;
      Object.entries(rData.silo).forEach(([key, qty]) => {
        infoBox += `│ ➔ ${FOOD_TYPES[key].name} : **${qty}** unités\n`;
      });
      infoBox += `${UI.line}\n`;
      infoBox += `📦 **STOCK DE MARCHANDISES EN ENTREPÔT :**\n`;
      if (Object.keys(rData.storage).length === 0) {
        infoBox += `│ *Aucun produit en stock. Attendez la récolte.*\n`;
      } else {
        Object.entries(rData.storage).forEach(([prodName, qty]) => {
          if (qty > 0) infoBox += `│ ➔ ${prodName} : **x${qty}**\n`;
        });
      }
      infoBox += `${UI.line}\n`;
      infoBox += `📈 **ARCHIVES HISTORIQUES :**\n`;
      infoBox += `${UI.field("Produits récoltés", rData.stats.totalCollected)}\n`;
      infoBox += `${UI.field("Chiffre d'affaires", `${rData.stats.totalEarnings.toLocaleString()}$`)}\n`;
      infoBox += UI.boxEnd();

      return message.reply(infoBox);
    }

    // ==========================================
    // 🔎 SOUS-COMMANDE : INVENTORY (REGISTRE DU BÉTAIL)
    // ==========================================
    if (subCommand === "inventory" || subCommand === "inv") {
      if (rData.animals.length === 0) {
        return message.reply("🌾 | Vos étables sont totalement vides. Visitez le marché via `~ranch shop` pour acquérir votre premier animal.");
      }

      let invBox = `📋 **[REGISTRE DE VOS ANIMAUX D'ÉLEVAGE]**\n${UI.line}\n`;
      const now = Date.now();

      rData.animals.forEach((ani, index) => {
        const template = ANIMAL_TEMPLATES[ani.baseId];
        const rarityInfo = RARITIES[ani.rarity || "common"];
        
        // Simulation dynamique d'usure de la faim basée sur le temps écoulé (ex: perd 3% de faim par minute)
        const minutesElapsed = Math.floor((now - ani.lastFed) / (60 * 1000));
        ani.hunger = Math.max(0, 100 - (minutesElapsed * 3));
        
        // Le bonheur chute si l'animal est affamé
        if (ani.hunger < 30) {
          ani.happiness = Math.max(0, ani.happiness - 5);
          ani.health = Math.max(10, ani.health - 2);
        }

        // Calcul du temps restant avant production
        const currentConfig = RANCH_UPGRADES.find(u => u.level === rData.level) || RANCH_UPGRADES[0];
        const actualProdTimeMs = (template.prodTime * 60 * 1000) / currentConfig.speedBonus;
        const timePassedSinceCollect = now - ani.lastCollect;
        const readyCount = Math.floor(timePassedSinceCollect / actualProdTimeMs);

        invBox += `[**ID: ${index + 1}**] ${template.emoji} **${ani.customName || template.name}** | Niv.**${ani.level}**\n`;
        invBox += `│ 🧬 Rareté : ${rarityInfo.color} **${rarityInfo.name}**\n`;
        invBox += `│ ❤️ Santé : ${UI.bar(ani.health, 100, "❤️", "🖤")} [${ani.health}/100]\n`;
        invBox += `│ 🍖 Faim  : ${UI.bar(ani.hunger, 100, "🍗", "⬛")} [${Math.floor(ani.hunger)}/100]\n`;
        invBox += `│ 😊 Joie  : ${UI.bar(ani.happiness, 100, "😊", "⚫")} [${ani.happiness}/100]\n`;
        invBox += `│ 📦 Prêt à la récolte : **x${readyCount}** ${template.product}\n`;
        invBox += `${UI.line}\n`;
      });

      // Sauvegarde des altérations de faim calculées à la volée
      savePlayerRanch(senderID, rData);
      return message.reply(invBox);
    }

    // ==========================================
    // 🛒 SOUS-COMMANDE : SHOP (CATALOGUE AGRO-FOURNITURES)
    // ==========================================
    if (subCommand === "shop") {
      let shopBox = `🛒 **[MARCHÉ CENTRALE ET CENTRALE D'ACHATS]**\n${UI.line}\n`;
      shopBox += `Pour acheter, tapez : \`~ranch buy animal <nom>\` ou \`~ranch buy food <nom> [quantité]\`\n\n`;
      
      shopBox += `🌱 **SECTION 1 : ANIMAUX ET CHEPTEL**\n${UI.line}\n`;
      Object.values(ANIMAL_TEMPLATES).forEach(ani => {
        const rar = RARITIES[ani.rarity];
        shopBox += `${ani.emoji} **${ani.name}** (${rar.color} ${rar.name})\n│ 💰 Coût : **${ani.cost.toLocaleString()}$** | 📦 Produit : ${ani.product}\n│ ⏱️ Cycle : ${ani.prodTime} min\n${UI.line}\n`;
      });

      shopBox += `\n🌾 **SECTION 2 : SILO & GRAINES (NOURRITURE)**\n${UI.line}\n`;
      Object.entries(FOOD_TYPES).forEach(([id, food]) => {
        shopBox += `🔸 **${food.name}** (id: \`${id}\`)\n│ 💰 Prix Unitaire : **${food.cost}$** | 🍖 Restaure : **+${food.restore} Faim**\n${UI.line}\n`;
      });

      return message.reply(shopBox);
    }

    // ==========================================
    // 🛍️ SOUS-COMMANDE : BUY (LOGIQUE TRANSACTIONNELLE)
    // ==========================================
    if (subCommand === "buy") {
      const type = args[1]?.toLowerCase();
      const targetId = args[2]?.toLowerCase();

      if (!type || !["animal", "food"].includes(type) || !targetId) {
        return message.reply("❌ | Paramètres invalides. Usage : `~ranch buy animal <nom>` ou `~ranch buy food <id_aliment> [quantité]`");
      }

      // --- BRANCHE D'ACHAT : ANIMAL ---
      if (type === "animal") {
        const template = ANIMAL_TEMPLATES[targetId];
        if (!template) return message.reply("❌ | Cet animal n'existe pas dans le catalogue du marché.");

        const currentConfig = RANCH_UPGRADES.find(u => u.level === rData.level) || RANCH_UPGRADES[0];
        if (rData.animals.length >= currentConfig.capacity) {
          return message.reply(`❌ | Vos étables sont pleines (**${rData.animals.length}/${currentConfig.capacity}**). Améliorez votre ranch via \`~ranch upgrade\`.`);
        }

        if (userMoney < template.cost) {
          return message.reply(`💰 | Vous n'avez pas les fonds nécessaires pour cet animal (Requis : **${template.cost.toLocaleString()}$**).`);
        }

        // Facturation et intégration au cheptel
        userMoney -= template.cost;
        await usersData.set(senderID, { money: userMoney });

        rData.animals.push({
          baseId: template.id,
          customName: null,
          level: 1,
          xp: 0,
          rarity: template.rarity,
          health: 100,
          hunger: 100,
          happiness: 100,
          lastFed: Date.now(),
          lastCollect: Date.now()
        });

        savePlayerRanch(senderID, rData);
        return message.reply(`🎉 | **ACHAT REUSSI :** Un magnifique **${template.name}** a rejoint vos étables ! (-${template.cost.toLocaleString()}$)`);
      }

      // --- BRANCHE D'ACHAT : NOURRITURE ---
      if (type === "food") {
        const food = FOOD_TYPES[targetId];
        if (!food) return message.reply("❌ | Cet aliment n'est pas répertorié au silo central.");

        const quantity = parseInt(args[3]) || 1;
        if (quantity <= 0) return message.reply("❌ | Veuillez spécifier une quantité valide supérieure à 0.");

        const totalCost = food.cost * quantity;
        if (userMoney < totalCost) {
          return message.reply(`💰 | Vos finances ne permettent pas d'acheter **x${quantity} ${food.name}** (Coût : **${totalCost.toLocaleString()}$**).`);
        }

        userMoney -= totalCost;
        await usersData.set(senderID, { money: userMoney });

        rData.silo[targetId] = (rData.silo[targetId] || 0) + quantity;
        savePlayerRanch(senderID, rData);

        return message.reply(`🌾 | **APPROVISIONNEMENT :** Vous achetez **x${quantity} ${food.name}** pour vos silos. (-${totalCost.toLocaleString()}$)`);
      }
    }

    // ==========================================
    // 🍖 SOUS-COMMANDE : FEED (ALIMENTATION DU CHEPTEL)
    // ==========================================
    if (subCommand === "feed") {
      const targetIndexInput = args[1]; // Index numérique "1", "2" ou "all"
      const foodId = args[2]?.toLowerCase();

      if (!targetIndexInput || !foodId || !FOOD_TYPES[foodId]) {
        return message.reply("❌ | Usage : `~ranch feed <index_animal|all> <id_nourriture>` (Ex: `~ranch feed 1 herbe`)");
      }

      if ((rData.silo[foodId] || 0) <= 0) {
        return message.reply(`❌ | Votre réserve de **${FOOD_TYPES[foodId].name}** est totalement épuisée. Ravitaillez-vous au marché.`);
      }

      const foodEffect = FOOD_TYPES[foodId];

      // --- ACTION : NOURRIR TOUT LE MONDE (ALL) ---
      if (targetIndexInput.toLowerCase() === "all") {
        if (rData.animals.length === 0) return message.reply("❌ | Aucun animal à nourrir.");
        
        let fedCount = 0;
        for (let ani of rData.animals) {
          if ((rData.silo[foodId] || 0) > 0 && ani.hunger < 95) {
            rData.silo[foodId]--;
            ani.hunger = Math.min(100, ani.hunger + foodEffect.restore);
            ani.health = Math.min(100, ani.health + 5);
            ani.happiness = Math.min(100, ani.happiness + 10);
            ani.lastFed = Date.now();
            fedCount++;
          }
        }

        if (fedCount === 0) return message.reply("🌾 | Vos animaux n'ont pas suffisamment faim pour gaspiller vos précieuses rations.");
        
        savePlayerRanch(senderID, rData);
        return message.reply(`🍖 | **DISTRIBUTION GLOBALE :** Vous avez distribué du **${foodEffect.name}** à **${fedCount}** animaux de vos granges.`);
      }

      // --- ACTION : NOURRIR UN ANIMAL UNIQUE PAR INDEX ---
      const idx = parseInt(targetIndexInput) - 1;
      if (isNaN(idx) || idx < 0 || idx >= rData.animals.length) {
        return message.reply("❌ | Index d'animal introuvable dans votre registre.");
      }

      let targetAnimal = rData.animals[idx];
      rData.silo[foodId]--;
      targetAnimal.hunger = Math.min(100, targetAnimal.hunger + foodEffect.restore);
      targetAnimal.health = Math.min(100, targetAnimal.health + 10);
      targetAnimal.happiness = Math.min(100, targetAnimal.happiness + 15);
      targetAnimal.lastFed = Date.now();

      savePlayerRanch(senderID, rData);
      return message.reply(`🍖 | **ALIMENTATION :** Vous donnez **${foodEffect.name}** à votre **${ANIMAL_TEMPLATES[targetAnimal.baseId].name}** (ID: ${idx + 1}). Faim restaurée !`);
    }

    // ==========================================
    // 🧺 SOUS-COMMANDE : COLLECT (RÉCOLTE ET ÉVÉNEMENTS RPG)
    // ==========================================
    if (subCommand === "collect") {
      if (rData.animals.length === 0) return message.reply("❌ | Rien à récolter, votre domaine est vide.");

      const now = Date.now();
      let totalCollectedThisTime = 0;
      let summaryLogs = "";
      
      // Facteur d'accélération lié aux structures de la ferme
      const currentConfig = RANCH_UPGRADES.find(u => u.level === rData.level) || RANCH_UPGRADES[0];

      rData.animals.forEach((ani) => {
        const template = ANIMAL_TEMPLATES[ani.baseId];
        const actualProdTimeMs = (template.prodTime * 60 * 1000) / currentConfig.speedBonus;
        const timePassed = now - ani.lastCollect;
        
        // Nombre d'unités empilées prêtes à être récupérées
        let unitsReady = Math.floor(timePassed / actualProdTimeMs);

        if (unitsReady > 0) {
          // Gestion du bonus d'XP par récolte pour l'animal
          ani.xp += unitsReady * 15;
          const xpForNextLevel = ani.level * 150;
          if (ani.xp >= xpForNextLevel) {
            ani.xp -= xpForNextLevel;
            ani.level += 1;
            summaryLogs += `✨ **LEVEL UP !** Votre ${template.emoji} ${template.name} passe au **Niveau ${ani.level}** !\n`;
          }

          // Remplissage de l'entrepôt temporaire du joueur
          rData.storage[template.product] = (rData.storage[template.product] || 0) + unitsReady;
          totalCollectedThisTime += unitsReady;
          ani.lastCollect = now;
        }
      });

      if (totalCollectedThisTime === 0) {
        return message.reply("⏱️ | Vos animaux n'ont pas encore fini leur cycle de production actuel. Revenez plus tard.");
      }

      rData.stats.totalCollected += totalCollectedThisTime;
      
      // 🎁 MOTEUR D'ÉVÉNEMENTS ALÉATOIRES IMMERSIFS (18% de chance lors des grandes récoltes)
      let eventAlert = "";
      if (Math.random() < 0.18) {
        const randEvent = Math.random();

        if (randEvent < 0.25) {
          // Événement Positif : Le Fermier Mystérieux double une marchandise
          const productsInStorage = Object.keys(rData.storage);
          if (productsInStorage.length > 0) {
            const chosenProd = productsInStorage[Math.floor(Math.random() * productsInStorage.length)];
            rData.storage[chosenProd] *= 2;
            eventAlert = `\n👨‍🌾 **ÉVÉNEMENT : Un Fermier Mystérieux** visite vos hangars et double votre stock de **${chosenProd}** !`;
          }
        } else if (randEvent < 0.50) {
          // Événement Négatif : Attaque du Renard voleur
          if (rData.animals.length > 1) {
            const removed = rData.animals.shift(); // Un animal au hasard s'enfuit
            eventAlert = `\n🦊 **CATASTROPHE : Un renard rusé** a profité de la nuit pour dérober votre **${ANIMAL_TEMPLATES[removed.baseId].name}** !`;
          }
        } else if (randEvent < 0.75) {
          // Événement Positif : Trésor trouvé dans la paille
          const bonusGold = Math.floor(150000 + Math.random() * 300000);
          userMoney += bonusGold;
          await usersData.set(senderID, { money: userMoney });
          eventAlert = `\n🌈 **ÉVÉNEMENT : Trésor caché !** En nettoyant la litière, vous déterrez une vieille cassette contenant **+${bonusGold.toLocaleString()}$** !`;
        } else {
          // Événement Neutre/Bénéfique : Une pluie magique rend les bêtes heureuses
          rData.animals.forEach(a => { a.happiness = 100; a.health = 100; });
          eventAlert = `\n🌧️ **ÉVÉNEMENT : Pluie Bénéfique !** Une ondée céleste purifie vos pâturages, restaurant la santé et la joie de tout votre bétail.`;
        }
      }

      savePlayerRanch(senderID, rData);

      // Interconnexion : Notification automatique au module d'objectifs de quêtes (Quest Connection)
      try {
        const questModule = require('./quest.js');
        if (questModule) questModule.incrementProgress(senderID, "ranch_collect", totalCollectedThisTime);
      } catch (e) {}

      let collectBox = UI.boxStart("Grandes Récoltes") + `\n`;
      collectBox += `│ 🧺 Vous avez rassemblé **${totalCollectedThisTime}** ressources agricoles.\n`;
      collectBox += `│ Consultez votre entrepôt mis à jour via : \`~ranch info\`\n`;
      if (summaryLogs) collectBox += `${UI.line}\n${summaryLogs}`;
      if (eventAlert) collectBox += `${UI.line}${eventAlert}\n`;
      collectBox += UI.boxEnd();

      return message.reply(collectBox);
        }
