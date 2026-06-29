/**
 * @file ranch.js
 * @description Simulateur d'Élevage RPG Ultra Premium Multi-Ressources pour GoatBot v2
 * @command ranch
 * @credits Format GoatBot v2 & Canvas Engine Premium
 */

const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

// Chemins de sauvegarde du Ranch
const DATA_DIR = path.join(__dirname, 'cache', 'ranchData');
const RANCH_FILE = path.join(DATA_DIR, 'ranchers.json');
const COOLDOWNS_FILE = path.join(DATA_DIR, 'cooldowns.json');

// Création des dossiers si inexistants
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(RANCH_FILE)) fs.writeFileSync(RANCH_FILE, JSON.stringify({}, null, 2));
if (!fs.existsSync(COOLDOWNS_FILE)) fs.writeFileSync(COOLDOWNS_FILE, JSON.stringify({}, null, 2));

// Jeton d'accès Facebook pour les avatars HD (Synchronisé)
const FB_TOKEN = "6628568379|c1e620fa708a1d5696fb991c1bde5662";

// --- BASE DE DONNÉES DES ANIMAUX ---
const ANIMALS_DB = {
  poulet: { id: "poulet", name: "Poulet", emoji: "🐔", cost: 500, rarity: "commune", product: "oeuf", basePrice: 50, time: 60, expGiven: 10 },
  canard: { id: "canard", name: "Canard", emoji: "🦆", cost: 1200, rarity: "commune", product: "plumes", basePrice: 130, time: 120, expGiven: 18 },
  lapin: { id: "lapin", name: "Lapin", emoji: "🐇", cost: 2500, rarity: "commune", product: "laine_douce", basePrice: 280, time: 180, expGiven: 25 },
  mouton: { id: "mouton", name: "Mouton", emoji: "🐑", cost: 6000, rarity: "rare", product: "laine", basePrice: 700, time: 300, expGiven: 50 },
  chevre: { id: "chevre", name: "Chèvre", emoji: "🐐", cost: 9500, rarity: "rare", product: "fromage", basePrice: 1100, time: 420, expGiven: 75 },
  cochon: { id: "cochon", name: "Cochon", emoji: "🐖", cost: 15000, rarity: "rare", product: "truffes", basePrice: 1900, time: 600, expGiven: 110 },
  vache: { id: "vache", name: "Vache", emoji: "🐄", cost: 32000, rarity: "epique", product: "lait", basePrice: 4200, time: 900, expGiven: 220 },
  cheval: { id: "cheval", name: "Cheval", emoji: "🐎", cost: 55000, rarity: "epique", product: "fer_or", basePrice: 7500, time: 1200, expGiven: 350 },
  lama: { id: "lama", name: "Lama", emoji: "🦙", cost: 85000, rarity: "epique", product: "fourrure_imperiale", basePrice: 12500, time: 1800, expGiven: 500 },
  bison: { id: "bison", name: "Bison", emoji: "🦬", cost: 160000, rarity: "legendaire", product: "corne_bison", basePrice: 26000, time: 2700, expGiven: 1000 },
  cerf: { id: "cerf", name: "Cerf", emoji: "🦌", cost: 240000, rarity: "legendaire", product: "bois_magique", basePrice: 41000, time: 3600, expGiven: 1600 },
  elephant: { id: "elephant", name: "Éléphant", emoji: "🐘", cost: 500000, rarity: "legendaire", product: "ivoire_ancien", basePrice: 95000, time: 5400, expGiven: 3000 },
  licorne: { id: "licorne", name: "Licorne", emoji: "🦄", cost: 1500000, rarity: "legendaire", product: "corne_arc_en_ciel", basePrice: 320000, time: 7200, expGiven: 7000 },
  dragon: { id: "dragon", name: "Dragon", emoji: "🐉", cost: 5000000, rarity: "mythique", product: "ecaille_feu", basePrice: 1200000, time: 14400, expGiven: 20000 },
  dragon_divin: { id: "dragon_divin", name: "Dragon Divin", emoji: "🐲", cost: 15000000, rarity: "divine", product: "essence_cosmique", basePrice: 4500000, time: 28800, expGiven: 60000 }
};

// --- BASE DE DONNÉES DES INFRASTRUCTURES ---
const UPGRADES_DB = [
  { level: 1, name: "Petite Ferme", maxAnimals: 5, cost: 0, mult: 1.0 },
  { level: 2, name: "Grande Ferme", maxAnimals: 12, cost: 25000, mult: 1.2 },
  { level: 3, name: "Ranch Spacieux", maxAnimals: 25, cost: 150000, mult: 1.5 },
  { level: 4, name: "Domaine de l'Éleveur", maxAnimals: 50, cost: 750000, mult: 2.0 },
  { level: 5, name: "Ferme Royale", maxAnimals: 100, cost: 3500000, mult: 3.0 },
  { level: 6, name: "Ranch Mythique", maxAnimals: 250, cost: 12000000, mult: 5.0 }
];

// --- TYPES DE NOURRITURE ---
const FOOD_DB = {
  herbe: { name: "Herbe Fraîche", cost: 15, hungerRestore: 20, joyRestore: 5, emoji: "🌿" },
  ble: { name: "Blé Doré", cost: 40, hungerRestore: 45, joyRestore: 10, emoji: "🌾" },
  mais: { name: "Maïs Sucré", cost: 90, hungerRestore: 70, joyRestore: 15, emoji: "🌽" },
  carotte: { name: "Carottes Croquantes", cost: 180, hungerRestore: 90, joyRestore: 25, emoji: "🥕" },
  premium: { name: "Nourriture Premium", cost: 500, hungerRestore: 100, joyRestore: 60, emoji: "🍱" }
};

// --- CONFIGURATION DES RARETÉS ---
const RARITIES = {
  commune: { name: "Commune", color: "#b0b0b0", statMult: 1.0 },
  rare: { name: "Rare", color: "#00cf64", statMult: 1.4 },
  epique: { name: "Épique", color: "#00bfff", statMult: 2.0 },
  legendaire: { name: "Légendaire", color: "#ff0055", statMult: 3.2 },
  mythique: { name: "Mythique", color: "#a020f0", statMult: 5.5 },
  divine: { name: "Divine", color: "#ffd700", statMult: 10.0 }
};

// --- FONCTIONS DE PERSISTANCE ---
function readJSON(file) { return JSON.parse(fs.readFileSync(file, 'utf8')); }
function writeJSON(file, data) { fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8'); }

function getRanch(uid) {
  const data = readJSON(RANCH_FILE);
  if (!data[uid]) {
    data[uid] = {
      uid: uid,
      rankLevel: 1,
      animals: [],
      warehouse: {},
      foodStorage: { herbe: 10, ble: 0, mais: 0, carotte: 0, premium: 0 },
      totals: { collected: 0, earnings: 0, bred: 0 }
    };
    writeJSON(RANCH_FILE, data);
  }
  return data[uid];
}

function updateRanch(uid, obj) {
  const data = readJSON(RANCH_FILE);
  data[uid] = obj;
  writeJSON(RANCH_FILE, data);
}

// --- DESSIN DES FORMES AVEC BORDURES ARRONDIES ---
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

// --- RENDU CANVAS : CARTE D'INTERFACE DU RANCH ---
async function drawRanchCard(title, rData, uid) {
  const canvas = createCanvas(850, 550);
  const ctx = canvas.getContext('2d');
  const infra = UPGRADES_DB[rData.rankLevel - 1] || UPGRADES_DB[0];

  // Fond Sombre Cyber-Ranch
  ctx.fillStyle = '#090a0f';
  ctx.fillRect(0, 0, 850, 550);

  // Grille technologique néon rouge
  ctx.strokeStyle = 'rgba(255, 0, 60, 0.02)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 850; i += 30) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 550); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(850, i); ctx.stroke();
  }

  // Cadre double néon Rouge Impérial et Or
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#ff003c';
  ctx.shadowColor = '#ff003c';
  ctx.shadowBlur = 18;
  drawRoundRect(ctx, 25, 25, 800, 500, 18);
  ctx.stroke();
  ctx.shadowBlur = 0;

  ctx.lineWidth = 2;
  ctx.strokeStyle = '#ffd700';
  drawRoundRect(ctx, 32, 32, 786, 486, 14);
  ctx.stroke();

  // En-tête de l'interface
  ctx.fillStyle = '#ffd700';
  ctx.font = 'bold 38px sans-serif';
  ctx.fillText(title.toUpperCase(), 60, 90);

  ctx.fillStyle = '#66fcf1';
  ctx.font = 'italic 18px sans-serif';
  ctx.fillText(`Structure : ${infra.name} (Niv. ${infra.level})`, 60, 125);

  // Ligne de séparation ornementale
  ctx.strokeStyle = 'rgba(255, 215, 0, 0.3)';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(60, 145); ctx.lineTo(790, 145); ctx.stroke();

  // Statistiques Générales du Domaine
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText(`📊 STATS DU DOMAINE :`, 60, 195);
  
  ctx.font = '18px sans-serif';
  ctx.fillText(`• Population : ${rData.animals.length} / ${infra.maxAnimals} animaux`, 80, 230);
  ctx.fillText(`• Multiplicateur de gains : x${infra.mult.toFixed(1)}`, 80, 260);
  ctx.fillText(`• Produits en stock : ${Object.values(rData.warehouse).reduce((a, b) => a + b, 0)} unités`, 80, 290);
  ctx.fillText(`• Naissances enregistrées : ${rData.totals.bred} bébés`, 80, 320);

  // --- REFUGE ALIMENTAIRE (STOCK DE NOURRITURE) ---
  ctx.fillStyle = '#ffd700';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText(`🌾 SILO DE NOURRITURE :`, 60, 380);

  ctx.fillStyle = '#ffffff';
  ctx.font = '16px sans-serif';
  let posX = 80;
  for (const [key, amount] of Object.entries(rData.foodStorage)) {
    const foodItem = FOOD_DB[key];
    ctx.fillText(`${foodItem.emoji} ${foodItem.name} : x${amount}`, posX, 420);
    posX += 140;
  }

  // --- RENDU PROGRESSION CAPACITÉ ---
  const fillPct = Math.min(100, (rData.animals.length / infra.maxAnimals) * 100);
  ctx.fillStyle = '#14151f';
  drawRoundRect(ctx, 60, 465, 450, 25, 6);
  ctx.fill();

  if (fillPct > 0) {
    const grad = ctx.createLinearGradient(60, 465, 60 + (450 * (fillPct / 100)), 465);
    grad.addColorStop(0, '#8b0000');
    grad.addColorStop(1, '#ff003c');
    ctx.fillStyle = grad;
    drawRoundRect(ctx, 60, 465, 450 * (fillPct / 100), 25, 6);
    ctx.fill();
  }
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText(`Occupation des Terres : ${fillPct.toFixed(0)}%`, 80, 482);

  // --- INTÉGRATION DE L'AVATAR VIA FB_TOKEN ---
  if (uid) {
    try {
      const avatarUrl = `https://graph.facebook.com/${uid}/picture?width=512&height=512&access_token=${encodeURIComponent(FB_TOKEN)}`;
      const avatar = await loadImage(avatarUrl);
      ctx.save();
      ctx.beginPath();
      ctx.arc(680, 270, 85, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(avatar, 595, 185, 170, 170);
      ctx.restore();

      // Cercle d'or
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#ffd700';
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(680, 270, 85, 0, Math.PI * 2, true);
      ctx.stroke();
      ctx.shadowBlur = 0;
    } catch (e) {
      // Évite le blocage si l'avatar échoue à charger
    }
  }

  return canvas.toBuffer();
}

// --- RENDU CANVAS : FOCUS SUR UN ANIMAL SÉLECTIONNÉ ---
async function drawAnimalFocusCard(animal, index) {
  const canvas = createCanvas(700, 320);
  const ctx = canvas.getContext('2d');
  const rar = RARITIES[animal.rarity] || RARITIES.commune;

  ctx.fillStyle = '#0c0d14';
  ctx.fillRect(0, 0, 700, 320);

  // Bordure Néon de rareté
  ctx.lineWidth = 4;
  ctx.strokeStyle = rar.color;
  ctx.shadowColor = rar.color;
  ctx.shadowBlur = 12;
  drawRoundRect(ctx, 20, 20, 660, 280, 12);
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Identité
  ctx.fillStyle = '#ffd700';
  ctx.font = 'bold 30px sans-serif';
  ctx.fillText(`${animal.emoji} ${animal.customName || animal.name} [Slot #${index + 1}]`, 40, 65);

  ctx.fillStyle = rar.color;
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText(`CLASSIFICATION : ${rar.name.toUpperCase()}`, 40, 95);

  // Statistiques vitaux
  ctx.fillStyle = '#ffffff';
  ctx.font = '18px sans-serif';
  ctx.fillText(`• Niveau Évolutif : ${animal.level} (Âge : ${animal.age} cycles)`, 40, 140);
  ctx.fillText(`• ❤️ Santé : ${animal.health} / 100`, 40, 175);
  ctx.fillText(`• 🍖 Faim : ${animal.hunger} / 100`, 40, 210);
  ctx.fillText(`• 😊 Bonheur : ${animal.joy} / 100`, 40, 245);

  // Valeur marchande à droite
  ctx.fillStyle = '#ffd700';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText(`💵 ESTIMATION`, 480, 140);
  ctx.fillStyle = '#ffffff';
  ctx.font = '18px sans-serif';
  ctx.fillText(`Valeur : ${animal.sellValue}$`, 480, 175);
  ctx.fillText(`Revenus : ${animal.revenue}$/h`, 480, 210);

  return canvas.toBuffer();
              }

// --- ALGORITHME DE REPRODUCTION (BREEDING ENGINE) ---
function executeBreeding(parent1, parent2) {
  // Détermination de la rareté du bébé avec bonus si les parents sont rares
  const roll = Math.random();
  let finalRarity = "commune";
  
  let bonusChance = 0;
  if (parent1.rarity === "rare" || parent2.rarity === "rare") bonusChance += 0.10;
  if (parent1.rarity === "epique" || parent2.rarity === "epique") bonusChance += 0.20;
  if (parent1.rarity === "legendaire" || parent2.rarity === "legendaire") bonusChance += 0.35;

  if (roll + bonusChance > 0.98) finalRarity = "divine";
  else if (roll + bonusChance > 0.92) finalRarity = "mythique";
  else if (roll + bonusChance > 0.78) finalRarity = "legendaire";
  else if (roll + bonusChance > 0.55) finalRarity = "epique";
  else if (roll + bonusChance > 0.30) finalRarity = "rare";

  // Le bébé hérite du type de l'un des deux parents de manière équitable
  const chosenTemplateKey = Math.random() > 0.5 ? parent1.id : parent2.id;
  const template = ANIMALS_DB[chosenTemplateKey];
  const rarOpt = RARITIES[finalRarity];

  // Calcul des valeurs initiales indexées sur la rareté obtenue
  const initialValue = Math.floor(template.cost * 0.4 * rarOpt.statMult);
  const calculatedRevenue = Math.floor(template.basePrice * 0.5 * rarOpt.statMult);

  return {
    id: template.id,
    name: template.name,
    emoji: template.emoji,
    customName: `Bébé ${template.name}`,
    level: 1,
    rarity: finalRarity,
    health: 100,
    joy: 100,
    hunger: 60,
    age: 0,
    sellValue: initialValue,
    revenue: calculatedRevenue,
    lastCollected: Date.now(),
    product: template.product
  };
}

// --- SIMULATEUR D'ÉVÉNEMENTS ALÉATOIRES IMMERSIFS ---
function triggerRandomEvent(ranchData, message, usersData) {
  const roll = Math.random();
  
  // 1. L'Animal Brillant (Shiny) - Chance: 4%
  if (roll < 0.04 && ranchData.animals.length > 0) {
    const idx = Math.floor(Math.random() * ranchData.animals.length);
    const target = ranchData.animals[idx];
    if (!target.customName?.includes("✨")) {
      target.customName = `✨ ${target.customName || target.name} ✨`;
      target.sellValue = Math.floor(target.sellValue * 2);
      target.revenue = Math.floor(target.revenue * 1.5);
      message.reply(`🌈 | **ÉVÉNEMENT MAGIQUE :** Un de vos animaux a interagi avec une lueur mystique ! Votre **Slot #${idx + 1}** devient un animal **Brillant** ! Sa valeur marchande double.`);
      return true;
    }
  }

  // 2. Le Renard Voleur - Chance: 3% (Événement Malus)
  if (roll >= 0.04 && roll < 0.07 && ranchData.animals.length > 2) {
    const idx = Math.floor(Math.random() * ranchData.animals.length);
    const removed = ranchData.animals[idx];
    // Protection si l'animal est de rang divin ou mythique
    if (removed.rarity !== "divine" && removed.rarity !== "mythique") {
      ranchData.animals.splice(idx, 1);
      message.reply(`🦊 | **ALERTE RANCH :** Un renard sournois s'est infiltré de nuit et a enlevé votre **${removed.name}** (Slot #${idx + 1}). Renforcez vos clôtures au shop !`);
      return true;
    }
  }

  // 3. La Tempête Dévastatrice - Chance: 3% (Événement Malus)
  if (roll >= 0.07 && roll < 0.10 && ranchData.animals.length > 0) {
    ranchData.animals.forEach(ani => {
      ani.health = Math.max(10, ani.health - Math.floor(Math.random() * 40 + 10));
      ani.joy = Math.max(10, ani.joy - 30);
    });
    message.reply(`🌪️ | **TEMPÊTE VIOLENTE :** Un cyclone a traversé votre domaine. Tous vos animaux perdent de la santé et du bonheur. Pensez à les soigner et les nourrir !`);
    return true;
  }

  // 4. Le Fermier Mystérieux ou Marchand Ambulant - Chance: 5% (Bonus)
  if (roll >= 0.10 && roll < 0.15) {
    const seedKeys = Object.keys(FOOD_DB);
    const randomSeed = seedKeys[Math.floor(Math.random() * seedKeys.length)];
    ranchData.foodStorage[randomSeed] += 5;
    message.reply(`👨‍🌾 | **VISITEUR INATTENDU :** Un vieux fermier itinérant passe sur vos terres et vous offre amicalement **x5 ${FOOD_DB[randomSeed].emoji} ${FOOD_DB[randomSeed].name}** !`);
    return true;
  }

  // 5. La Pluie Bénéfique - Chance: 5% (Bonus)
  if (roll >= 0.15 && roll < 0.20 && ranchData.animals.length > 0) {
    ranchData.animals.forEach(ani => {
      ani.health = Math.min(100, ani.health + 20);
      ani.joy = Math.min(100, ani.joy + 15);
    });
    message.reply(`🌧️ | **PLUIE BÉNÉFIQUE :** Une ondée rafraîchissante nettoie les pâturages. Vos bêtes reprennent des forces (+20 ❤️ Santé / +15 😊 Bonheur).`);
    return true;
  }

  return false;
}

// --- ACTUALISATION PAR CYCLE DE PRODUCTION ---
function processCycleUpdate(ranchData) {
  const now = Date.now();
  let productionCounter = 0;

  ranchData.animals.forEach(ani => {
    const template = ANIMALS_DB[ani.id] || ANIMALS_DB.poulet;
    const elapsedSeconds = Math.floor((now - ani.lastCollected) / 1000);
    
    // Calcul du nombre de cycles de production achevés depuis le dernier relevé
    if (elapsedSeconds >= template.time) {
      const completedCycles = Math.floor(elapsedSeconds / template.time);
      if (completedCycles > 0) {
        // Ajout au stockage du hangar
        const prodKey = ani.product;
        ranchData.warehouse[prodKey] = (ranchData.warehouse[prodKey] || 0) + completedCycles;
        ranchData.totals.collected += completedCycles;
        productionCounter += completedCycles;

        // Dégradation progressive de la faim, de la santé et du bonheur par cycle de travail
        ani.hunger = Math.max(0, ani.hunger - (completedCycles * 5));
        ani.joy = Math.max(0, ani.joy - (completedCycles * 3));
        
        if (ani.hunger <= 20) {
          ani.health = Math.max(0, ani.health - (completedCycles * 8));
        }

        // Gain d'expérience de l'animal
        ani.age += completedCycles;
        const totalExp = template.expGiven * completedCycles;
        ani.level += Math.floor((ani.age) / 25); // Évolution de niveau tous les 25 cycles achevés

        // Recalcul des courbes de valeur dynamiques de l'animal
        const rarOpt = RARITIES[ani.rarity] || RARITIES.commune;
        ani.sellValue = Math.floor(template.cost * 0.4 * rarOpt.statMult * (1 + ani.level * 0.1));
        ani.revenue = Math.floor(template.basePrice * 0.5 * rarOpt.statMult * (1 + ani.level * 0.15));

        ani.lastCollected = now;
      }
    }
  });

  return productionCounter;
                                }
