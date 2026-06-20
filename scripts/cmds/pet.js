const fs = require("fs");
const path = require("path");

const DATA_PATH = path.join(__dirname, "cache", "pets.json");
if (!fs.existsSync(path.dirname(DATA_PATH))) fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true });
if (!fs.existsSync(DATA_PATH)) fs.writeFileSync(DATA_PATH, "{}");

function loadPets() {
  return JSON.parse(fs.readFileSync(DATA_PATH, "utf-8"));
}
function savePets(data) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
}
function getPet(data, id) {
  if (!data[id]) {
    data[id] = {
      name: "Non nommé",
      type: "Inconnu",
      rarity: "Commun",
      level: 1,
      xp: 0,
      hunger: 100,
      lastDaily: 0,
      lastFeed: 0,
      streak: 0
    };
  }
  return data[id];
}

// Obtenir l'emoji évolutif selon le niveau du Pet
function getPetEmoji(level) {
  if (level < 5) return "🐣";
  if (level < 15) return "🦊";
  if (level < 30) return "🦁";
  return "🐉";
}

// Multiplicateur de gains selon la rareté
function getRarityMultiplier(rarity) {
  switch (rarity) {
    case "Mythique 👑": return 3.0;
    case "Légendaire 💎": return 2.0;
    case "Rare ✨": return 1.5;
    default: return 1.0;
  }
}

module.exports.config = {
  name: "pet",
  version: "3.0.0",
  hasPermssion: 0,
  author: "Shade & AI",
  description: "Système de Pet cool et évolutif lié directement au TOP richesse !",
  commandCategory: "economy",
  usages: "[adopt|feed|daily|stats|rename]",
  cooldowns: 3
};

module.exports.run = async function ({ api, event, args, usersData }) {
  const { threadID, messageID, senderID } = event;

  const pets = loadPets();
  const pet = getPet(pets, senderID);
  const sub = (args[0] || "stats").toLowerCase();

  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  // Récupération des données utilisateur globales (pour la compatibilité top.js)
  let userData = await usersData.get(senderID);
  if (!userData) userData = {};
  if (!userData.data) userData.data = {};
  let currentMoney = userData.money !== undefined ? userData.money : (userData.data.money || 0);

  // 🐣 ADOPT (Avec attribution d'une race et d'une rareté unique)
  if (sub === "adopt") {
    if (pet.type !== "Inconnu") {
      return api.sendMessage("🐾 Tu as déjà un compagnon d'aventure !", threadID, messageID);
    }

    const types = ["Phénix", "Dragon Noir", "Kitsune", "Loup Céleste", "Grillon Doré", "Slime Royal"];
    const rarities = ["Commun", "Rare ✨", "Légendaire 💎", "Mythique 👑"];
    
    // Calcul de rareté aléatoire
    const rand = Math.random();
    let rarity = rarities[0];
    if (rand < 0.05) rarity = rarities[3]; // 5% Mythique
    else if (rand < 0.20) rarity = rarities[2]; // 15% Légendaire
    else if (rand < 0.50) rarity = rarities[1]; // 30% Rare

    pet.name = "Bébé " + types[Math.floor(Math.random() * types.length)];
    pet.type = types[Math.floor(Math.random() * types.length)];
    pet.rarity = rarity;
    pet.level = 1;
    pet.xp = 0;
    pet.hunger = 100;
    pet.streak = 0;

    savePets(pets);

    return api.sendMessage(
      `🐣 𝗙𝗘́𝗟𝗜𝗖𝗜𝗧𝗔𝗧𝗜𝗢𝗡𝗦 !\n━━━━━━━━━━━━━━\n` +
      `Tu viens d'adopter un œuf mystérieux !\n` +
      `🧬 **Espèce :** ${pet.type}\n` +
      `💎 **Rareté :** ${pet.rarity}\n\n` +
      `Utilise \`!pet stats\` pour voir ton nouveau partenaire !`, 
      threadID, messageID
    );
  }

  // 🍖 FEED (Faire manger + rapporte un petit bonus financier direct au portefeuille)
  if (sub === "feed") {
    if (pet.type === "Inconnu") return api.sendMessage("🐣 Tu n'as pas encore de pet. Fais `!pet adopt` !", threadID, messageID);
    if (now - pet.lastFeed < 60000) {
      return api.sendMessage("⏳ Ton compagnon digère encore, attends 1 minute !", threadID, messageID);
    }

    const mult = getRarityMultiplier(pet.rarity);
    const cashGained = Math.floor((Math.floor(Math.random() * 5000) + 2000) * mult);

    pet.lastFeed = now;
    pet.hunger = Math.min(100, pet.hunger + 25);
    pet.xp += Math.floor(15 * mult);

    // Injection directe de l'argent dans l'économie globale (u.money)
    userData.money = currentMoney + cashGained;
    await usersData.set(senderID, userData);

    let levelUpText = "";
    const needXP = pet.level * 100;
    if (pet.xp >= needXP) {
      pet.xp -= needXP;
      pet.level++;
      levelUpText = `\n🎉 **LEVEL UP !** Ton compagnon évolue et passe au **Niveau ${pet.level}** ${getPetEmoji(pet.level)} !`;
    }

    savePets(pets);

    return api.sendMessage(
      `${getPetEmoji(pet.level)} **${pet.name}** a adoré son repas !\n` +
      `━━━━━━━━━━━━━━\n` +
      `🍖 **Faim :** ${pet.hunger}%\n` +
      `⚡ **XP :** ${pet.xp}/${needXP}\n` +
      `💰 **Trouvaille :** +${cashGained.toLocaleString()} $ (Ajoutés à ton portefeuille !)${levelUpText}`,
      threadID, messageID
    );
  }

  // 💰 DAILY (Gains massifs envoyés directement vers le TOP)
  if (sub === "daily") {
    if (pet.type === "Inconnu") return api.sendMessage("🐣 Tu n'as pas encore de pet. Fais `!pet adopt` !", threadID, messageID);
    if (now - pet.lastDaily < day) {
      const left = Math.ceil((day - (now - pet.lastDaily)) / 3600000);
      return api.sendMessage(`⏰ Ton compagnon se repose. Reviens dans **${left}h** !`, threadID, messageID);
    }

    if (now - pet.lastDaily > day * 2) pet.streak = 0;

    pet.streak++;
    pet.lastDaily = now;

    const mult = getRarityMultiplier(pet.rarity);
    const reward = Math.floor((3500000 + (pet.streak - 1) * 500000) * mult);
    const bonus = Math.random() < 0.25 ? Math.floor(Math.random() * 1000000) : 0;
    const totalReward = reward + bonus;

    // 🌟 SYNC AVEC LE TOP : Sauvegarde directe dans usersData.money
    userData.money = currentMoney + totalReward;
    await usersData.set(senderID, userData);

    pet.hunger = Math.min(100, pet.hunger + 40);
    pet.xp += 25;

    const needXP = pet.level * 100;
    if (pet.xp >= needXP) {
      pet.xp -= needXP;
      pet.level++;
    }

    savePets(pets);

    return api.sendMessage(
      `${getPetEmoji(pet.level)} 𝗥𝗘́𝗖𝗢𝗠𝗣𝗘𝗡𝗦𝗘 𝗗𝗨 𝗖𝗢𝗠𝗣𝗔𝗚𝗡𝗢𝗡 💰\n` +
      `━━━━━━━━━━━━━━\n` +
      `🔥 **Série actuelle :** ${pet.streak} jours\n` +
      `💎 **Rareté multiplier :** x${mult}\n` +
      `💰 **Gains :** +${totalReward.toLocaleString()} $\n` +
      `${bonus ? "🎁 **JACKPOT DE CHASSE :** Trouvaille bonus incluse !\n" : ""}` +
      `━━━━━━━━━━━━━━\n` +
      `🍖 Faim: ${pet.hunger}% | ⚡ +25 XP\n\n` +
      `➡ *Ces gains ont été injectés directement dans ton portefeuille et mis à jour sur le !top riche.*`,
      threadID, messageID
    );
  }

  // 📝 RENAME (Pour personnaliser le pet)
  if (sub === "rename") {
    if (pet.type === "Inconnu") return api.sendMessage("🐣 Tu n'as pas de pet à renommer !", threadID, messageID);
    const newName = args.slice(1).join(" ");
    if (!newName) return api.sendMessage("❌ Utilisation : !pet rename [nouveau nom]", threadID, messageID);
    
    pet.name = newName;
    savePets(pets);
    return api.sendMessage(`✨ Ton compagnon s'appelle désormais : **${newName}** !`, threadID, messageID);
  }

  // 📊 STATS (Affichage graphique soigné)
  if (sub === "stats") {
    if (pet.type === "Inconnu") {
      return api.sendMessage("🐣 Tu n'as aucun animal domestique actuellement. Tape `!pet adopt` !", threadID, messageID);
    }
    const hungerBar = "█".repeat(Math.floor(pet.hunger / 10)) + "░".repeat(10 - Math.floor(pet.hunger / 10));

    return api.sendMessage(
      `${getPetEmoji(pet.level)} 𝗜𝗡𝗙𝗢𝗦 𝗗𝗨 𝗖𝗢𝗠𝗣𝗔𝗚𝗡𝗢𝗡\n` +
      `━━━━━━━━━━━━━━\n` +
      `📝 **Nom :** ${pet.name}\n` +
      `🧬 **Race :** ${pet.type} (${pet.rarity})\n` +
      `⭐ **Niveau :** ${pet.level}\n` +
      `⚡ **XP :** ${pet.xp} / ${pet.level * 100}\n` +
      `🍖 **Faim :** [${hungerBar}] ${pet.hunger}%\n` +
      `🔥 **Fidélité :** ${pet.streak} jours consécutifs\n` +
      `━━━━━━━━━━━━━━\n` +
      `💡 *Astuce : Nourris-le ou récupère sa récompense pour grimper dans le classement !*`,
      threadID, messageID
    );
  }
};
