/**
 * @file pet.js
 * @description Système RPG de Familiers (Pets) Ultra Premium interconnecté pour GoatBot v2
 * @command pet
 * @credits Format GoatBot v2 & Canvas Engine Premium
 */

const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

// Chemins de stockage
const DATA_DIR = path.join(__dirname, 'cache', 'petData');
const PETS_FILE = path.join(DATA_DIR, 'player_pets.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(PETS_FILE)) fs.writeFileSync(PETS_FILE, JSON.stringify({}, null, 2));

// Jeton d'accès Facebook pour les avatars HD
const FB_TOKEN = "6628568379|c1e620fa708a1d5696fb991c1bde5662";

// --- TABLE DES OEUFS ET PROBABILITÉS D'OBTENTION ---
const EGGS_DB = {
  common: { name: "Common Egg", emoji: "🥚", cost: 1500, rates: { commune: 0.70, uncommon: 0.25, rare: 0.05, epic: 0.00, legendary: 0.00, mythic: 0.00, divine: 0.00 } },
  uncommon: { name: "Uncommon Egg", emoji: "🟢", cost: 5000, rates: { commune: 0.20, uncommon: 0.60, rare: 0.15, epic: 0.05, legendary: 0.00, mythic: 0.00, divine: 0.00 } },
  rare: { name: "Rare Egg", emoji: "🔵", cost: 15000, rates: { commune: 0.05, uncommon: 0.20, rare: 0.55, epic: 0.15, legendary: 0.05, mythic: 0.00, divine: 0.00 } },
  epic: { name: "Epic Egg", emoji: "🟣", cost: 45000, rates: { commune: 0.00, uncommon: 0.05, rare: 0.20, epic: 0.60, legendary: 0.12, mythic: 0.03, divine: 0.00 } },
  legendary: { name: "Legendary Egg", emoji: "🟠", cost: 150000, rates: { commune: 0.00, uncommon: 0.00, rare: 0.08, epic: 0.22, legendary: 0.58, mythic: 0.10, divine: 0.02 } },
  mythic: { name: "Mythic Egg", emoji: "🔴", cost: 600000, rates: { commune: 0.00, uncommon: 0.00, rare: 0.00, epic: 0.10, legendary: 0.25, mythic: 0.55, divine: 0.10 } },
  divine: { name: "Divine Egg", emoji: "🌈", cost: 2500000, rates: { commune: 0.00, uncommon: 0.00, rare: 0.00, epic: 0.00, legendary: 0.15, mythic: 0.35, divine: 0.50 } }
};

// --- TABLE DE CONFIGURATION DES RARETÉS ---
const RARITIES = {
  commune: { name: "Commune", color: "#b0b0b0", mult: 1.0 },
  uncommon: { name: "Peu Commune", color: "#1ce31c", mult: 1.3 },
  rare: { name: "Rare", color: "#00bfff", mult: 1.7 },
  epic: { name: "Épique", color: "#a020f0", mult: 2.3 },
  legendary: { name: "Légendaire", color: "#ff0055", mult: 3.5 },
  mythic: { name: "Mythique", color: "#ffaa00", mult: 5.0 },
  divine: { name: "Divine", color: "#ffd700", mult: 9.0 }
};

// --- NOURRITURE POUR FAMILIERS ---
const PET_FOOD = {
  croquette: { name: "Croquettes Basiques", cost: 100, restore: 25, joy: 5 },
  paté: { name: "Pâté de Viande", cost: 350, restore: 50, joy: 15 },
  delice: { name: "Délice du Chasseur", cost: 1000, restore: 85, joy: 30 },
  ambroisie: { name: "Ambroisie Céleste", cost: 5000, restore: 100, joy: 70 }
};

// --- BASE DE DONNÉES DES FAMILIERS & ÉVOLUTIONS (STRUCTURE ARBORESCENTE) ---
const PETS_DB = {
  // --- FAMILIERS STANDARD ---
  chien: { id: "chien", name: "Chiot Chien", emoji: "🐶", rarity: "commune", hp: 120, atk: 15, def: 10, crit: 5, dodge: 5, talent: "Guardian", skill: "Aboiement Protecteur", next: "loup_domestique", levelReq: 20 },
  chat: { id: "chat", name: "Chaton Malin", emoji: "🐱", rarity: "commune", hp: 90, atk: 18, def: 6, crit: 12, dodge: 10, talent: "Lucky", skill: "Griffure Critique", next: "lynx_furtif", levelReq: 20 },
  renard: { id: "renard", name: "Renardeau", emoji: "🦊", rarity: "uncommon", hp: 110, atk: 22, def: 8, crit: 10, dodge: 12, talent: "Treasure Hunter", skill: "Fouille Rapide", next: "renard_mystique", levelReq: 25 },
  ours: { id: "ours", name: "Ourson", emoji: "🐻", rarity: "rare", hp: 200, atk: 25, def: 20, crit: 4, dodge: 2, talent: "Tank", skill: "Écrasement Lourd", next: "ours_grizzly", levelReq: 30 },
  aigle: { id: "aigle", name: "Aiglon", emoji: "🦅", rarity: "rare", hp: 130, atk: 28, def: 10, crit: 15, dodge: 15, talent: "Assassin", skill: "Piqué Foudroyant", next: "aigle_imperial", levelReq: 30 },
  hibou: { id: "hibou", name: "Chouette", emoji: "🦉", rarity: "uncommon", hp: 100, atk: 16, def: 12, crit: 8, dodge: 8, talent: "Banker", skill: "Sagesse Lucrative", next: "hibou_cosmique", levelReq: 25 },
  requin: { id: "requin", name: "Petit Requin", emoji: "🦈", rarity: "epic", hp: 180, atk: 35, def: 15, crit: 18, dodge: 6, talent: "Berserker", skill: "Morsure Sanglante", next: "megalodon", levelReq: 35 },

  // --- FORMES ÉVOLUÉES ÉTAPE 2 ---
  loup_domestique: { id: "loup_domestique", name: "Loup Alpha", emoji: "🐺", rarity: "rare", hp: 250, atk: 38, def: 22, crit: 12, dodge: 8, talent: "Guardian", skill: "Hurlement de Meute", next: "fenrir", levelReq: 50 },
  lynx_furtif: { id: "lynx_furtif", name: "Lynx Ombral", emoji: "🐯", rarity: "rare", hp: 210, atk: 42, def: 16, crit: 22, dodge: 18, talent: "Assassin", skill: "Assaut Fantôme", next: "tigre_ombre", levelReq: 50 },
  renard_mystique: { id: "renard_mystique", name: "Renard Céleste", emoji: "🦊", rarity: "epic", hp: 240, atk: 45, def: 18, crit: 15, dodge: 25, talent: "Treasure Hunter", skill: "Illusion Dorée", next: "kitsune", levelReq: 55 },
  ours_grizzly: { id: "ours_grizzly", name: "Grizzly Blindé", emoji: "🐻", rarity: "epic", hp: 450, atk: 55, def: 45, crit: 8, dodge: 4, talent: "Tank", skill: "Forteresse de Fourrure", next: "yeti_colossal", levelReq: 60 },
  aigle_imperial: { id: "aigle_imperial", name: "Aigle Tempête", emoji: "🦅", rarity: "epic", hp: 280, atk: 62, def: 20, crit: 25, dodge: 22, talent: "Pirate", skill: "Rafale Océanique", next: "garouda", levelReq: 60 },

  // --- CRÉATURES MYTHIQUES ET ULTIMES (ÉTAPES FINALES OU DIRECTES) ---
  dragon: { id: "dragon", name: "Petit Dragon", emoji: "🐉", rarity: "legendary", hp: 500, atk: 80, def: 60, crit: 15, dodge: 8, talent: "Berserker", skill: "Souffle de Flammes", next: "dragon_royal", levelReq: 40 },
  dragon_royal: { id: "dragon_royal", name: "Dragon Royal", emoji: "🐉", rarity: "mythic", hp: 1200, atk: 180, def: 130, crit: 22, dodge: 12, talent: "Berserker", skill: "Colère Impériale", next: "dragon_divin", levelReq: 75 },
  dragon_divin: { id: "dragon_divin", name: "Dragon Divin Apocalypse", emoji: "🐲", rarity: "divine", hp: 5000, atk: 750, def: 550, crit: 35, dodge: 25, talent: "Berserker", skill: "Jugement Ultime du Cosmos", next: null },
  
  licorne: { id: "licorne", name: "Licorne Pure", emoji: "🦄", rarity: "legendary", hp: 450, atk: 50, def: 50, crit: 10, dodge: 20, talent: "Healer", skill: "Bénédiction de Lumière", next: "licorne_cosmique", levelReq: 50 },
  licorne_cosmique: { id: "licorne_cosmique", name: "Licorne Stellaire", emoji: "🦄", rarity: "mythic", hp: 1100, atk: 110, def: 110, crit: 18, dodge: 30, talent: "Healer", skill: "Prière Astral", next: null },

  phenix: { id: "phenix", name: "Phénix Éternel", emoji: "🔥", rarity: "mythic", hp: 1500, atk: 210, def: 100, crit: 30, dodge: 24, talent: "Healer", skill: "Renaissance Céleste", next: null },
  kraken: { id: "kraken", name: "Kraken des Abysses", emoji: "🌊", rarity: "mythic", hp: 2200, atk: 190, def: 160, crit: 15, dodge: 10, talent: "Pirate", skill: "Étreinte Profonde", next: null },
  esprit_foudre: { id: "esprit_foudre", name: "Raijin", emoji: "⚡", rarity: "legendary", hp: 400, atk: 95, def: 40, crit: 28, dodge: 28, talent: "Assassin", skill: "Orage Cataclysmique", next: null },
  gardien_cosmique: { id: "gardien_cosmique", name: "Gardien Cosmique", emoji: "🌌", rarity: "divine", hp: 6000, atk: 600, def: 700, crit: 25, dodge: 20, talent: "Guardian", skill: "Trou Noir Protecteur", next: null }
};

// --- TALENTS ET LEUR IMPACT SUR L'ÉCOSYSTÈME ---
const TALENTS_EFFECTS = {
  Lucky: { desc: "+15% Chance de Critique & Chance de gains Casino", stat: "crit", bonus: 15 },
  Tank: { desc: "+30% Points de Vie totaux et Défense augmentée", stat: "hp", bonus: 30 },
  Berserker: { desc: "+25% Dégâts d'Attaque purs", stat: "atk", bonus: 25 },
  "Treasure Hunter": { desc: "+20% Chance de déterrer des reliques/trésors", stat: "treasure", bonus: 20 },
  Guardian: { desc: "+25% encaissement de barrière défensive", stat: "def", bonus: 25 },
  Healer: { desc: "Restaure 15% de vie après chaque tour de combat", stat: "heal", bonus: 15 },
  Assassin: { desc: "+20% d'Esquive au combat", stat: "dodge", bonus: 20 },
  Banker: { desc: "+10% d'intérêts sur les livrets de banque", stat: "bank", bonus: 10 },
  Farmer: { desc: "+15% Rendement de récolte passive Ranch", stat: "ranch", bonus: 15 },
  Pirate: { desc: "+20% Or rapporté des explorations Pirate", stat: "pirate", bonus: 20 }
};

// --- COMPORTEMENT PERSISTANCE DONNÉES ---
function readJSON(file) { return JSON.parse(fs.readFileSync(file, 'utf8')); }
function writeJSON(file, data) { fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8'); }

function getPlayerPets(uid) {
  const data = readJSON(PETS_FILE);
  if (!data[uid]) {
    data[uid] = { activePetId: null, collection: [], foodStorage: { croquette: 5, paté: 0, delice: 0, ambroisie: 0 } };
    writeJSON(PETS_FILE, data);
  }
  return data[uid];
}

function updatePlayerPets(uid, obj) {
  const data = readJSON(PETS_FILE);
  data[uid] = obj;
  writeJSON(PETS_FILE, data);
    }

// --- UTILITAIRE DE TRACÉ DES COINS ARRONDIS AVEC EFFET NÉON ---
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

// --- RENDU CANVAS : INTERFACE INDIVIDUELLE DU FAMILIER (PET INFO) ---
async function drawPetCard(title, pet, uid) {
  const canvas = createCanvas(800, 500);
  const ctx = canvas.getContext('2d');
  const rarOpt = RARITIES[pet.rarity] || RARITIES.commune;

  // Fond d'écran MMORPG Cyber-Gothique Sombre
  ctx.fillStyle = '#0b0c10';
  ctx.fillRect(0, 0, 800, 500);

  // Tracé d'une grille technologique subtile
  ctx.strokeStyle = 'rgba(255, 215, 0, 0.015)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 800; i += 25) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 500); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(800, i); ctx.stroke();
  }

  // Double cadre d'interface : Lueur néon calée sur la rareté de la créature
  ctx.lineWidth = 4;
  ctx.strokeStyle = rarOpt.color;
  ctx.shadowColor = rarOpt.color;
  ctx.shadowBlur = 15;
  drawRoundRect(ctx, 25, 25, 750, 450, 16);
  ctx.stroke();
  ctx.shadowBlur = 0; // Reset ombre pour ne pas impacter les textes

  ctx.lineWidth = 2;
  ctx.strokeStyle = '#ffd700';
  drawRoundRect(ctx, 32, 32, 736, 436, 12);
  ctx.stroke();

  // --- EN-TÊTE ---
  ctx.fillStyle = '#ffd700';
  ctx.font = 'bold 36px sans-serif';
  ctx.fillText(title.toUpperCase(), 60, 85);

  ctx.fillStyle = rarOpt.color;
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText(`CLASSIFICATION : RARETÉ ${rarOpt.name.toUpperCase()} (x${rarOpt.mult.toFixed(1)})`, 60, 120);

  // Séparateur horizontal ornemental
  ctx.strokeStyle = 'rgba(255, 215, 0, 0.25)';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(60, 138); ctx.lineTo(740, 138); ctx.stroke();

  // --- STATISTIQUES VITAUX ET CARACTÉRISTIQUES DE COMBAT ---
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText(`📊 ATTRIBUTS RPG :`, 60, 180);

  ctx.font = '18px sans-serif';
  ctx.fillText(`• Niveau Évolutif : ${pet.level} (XP : ${pet.xp} / ${pet.level * 500})`, 80, 215);
  ctx.fillText(`• ❤️ Énergie Vitale (HP) : ${pet.hp}`, 80, 245);
  ctx.fillText(`• ⚔️ Puissance d'Attaque : ${pet.atk}`, 80, 275);
  ctx.fillText(`• 🛡️ Résistance / Défense : ${pet.def}`, 80, 305);
  ctx.fillText(`• 🔥 Taux Critique : ${pet.crit}%  |  💨 Esquive : ${pet.dodge}%`, 80, 335);

  // --- TALENT ET COMPÉTENCE UNIQUE ---
  ctx.fillStyle = '#ffd700';
  ctx.font = 'bold 18px sans-serif';
  const talentDesc = TALENTS_EFFECTS[pet.talent]?.desc || "Aucun bonus passif détecté.";
  ctx.fillText(`✨ TALENT PASSIF : ${pet.talent}`, 60, 385);
  
  ctx.fillStyle = '#a0a0ab';
  ctx.font = 'italic 16px sans-serif';
  ctx.fillText(`↳ Effet : ${talentDesc}`, 80, 410);

  ctx.fillStyle = '#ff003c';
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText(`💥 Compétence Spéciale Arène : ${pet.skill}`, 60, 445);

  // --- BARRES DE PROGRESSION ÉNERGÉTIQUES (DROITE) ---
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText(`🍖 SATIÉTÉ : ${pet.hunger}/100`, 500, 330);
  ctx.fillStyle = '#1a1a24';
  drawRoundRect(ctx, 500, 340, 240, 15, 4);
  ctx.fill();
  ctx.fillStyle = pet.hunger > 30 ? '#00cf64' : '#ff003c';
  drawRoundRect(ctx, 500, 340, 240 * (pet.hunger / 100), 15, 4);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.fillText(`😊 BONHEUR : ${pet.joy}/100`, 500, 380);
  ctx.fillStyle = '#1a1a24';
  drawRoundRect(ctx, 500, 390, 240, 15, 4);
  ctx.fill();
  ctx.fillStyle = '#00bfff';
  drawRoundRect(ctx, 500, 390, 240 * (pet.joy / 100), 15, 4);
  ctx.fill();

  // --- CADRE PHOTO ET INTEGRATION AVATAR SÉCURISÉ ---
  if (uid) {
    try {
      const avatarUrl = `https://graph.facebook.com/${uid}/picture?width=512&height=512&access_token=${encodeURIComponent(FB_TOKEN)}`;
      const avatar = await loadImage(avatarUrl);
      ctx.save();
      ctx.beginPath();
      ctx.arc(620, 210, 75, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(avatar, 545, 135, 150, 150);
      ctx.restore();

      // Halo protecteur ornemental
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#ffd700';
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(620, 210, 75, 0, Math.PI * 2, true);
      ctx.stroke();
      ctx.shadowBlur = 0;
    } catch (e) {
      // Contour neutre si défaillance de la passerelle Facebook graph API
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(620, 210, 75, 0, Math.PI * 2, true);
      ctx.stroke();
    }
  }

  return canvas.toBuffer();
}

// --- RENDU CANVAS : SPECTACLE DE L'ÉCLOSION D'UN OEUF (HATCH ANIMATION) ---
async function drawHatchCard(eggName, pet, rarColor) {
  const canvas = createCanvas(650, 350);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#07080c';
  ctx.fillRect(0, 0, 650, 350);

  // Cadre néon d'éclosion
  ctx.lineWidth = 5;
  ctx.strokeStyle = rarColor;
  ctx.shadowColor = rarColor;
  ctx.shadowBlur = 18;
  drawRoundRect(ctx, 20, 20, 610, 310, 14);
  ctx.stroke();
  ctx.shadowBlur = 0;

  ctx.fillStyle = '#ffd700';
  ctx.font = 'bold 28px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`⚡ ÉCLOSION MAGIQUE DE L'${eggName.toUpperCase()} ⚡`, 325, 70);

  ctx.fillStyle = '#ffffff';
  ctx.font = '22px sans-serif';
  ctx.fillText(`La coquille se brise... Un compagnon légendaire s'éveille !`, 325, 125);

  ctx.fillStyle = rarColor;
  ctx.font = 'bold 32px sans-serif';
  ctx.fillText(`${pet.emoji} ${pet.name.toUpperCase()} ${pet.emoji}`, 325, 200);

  ctx.fillStyle = '#a0a0ab';
  ctx.font = '18px sans-serif';
  ctx.fillText(`Talent d'héritage : [${pet.talent}] | Spécialité : ${pet.skill}`, 325, 260);
  ctx.textAlign = 'start';

  return canvas.toBuffer();
    }

// --- GÉNÉRATEUR INDIVIDUEL DE FAMILIER (LOGIQUE D'ÉCLOSION) ---
function generatePetFromEgg(eggKey) {
  const egg = EGGS_DB[eggKey];
  if (!egg) return null;

  // 1. Détermination de la rareté finale selon les probabilités de l'œuf
  const roll = Math.random();
  let selectedRarity = "commune";
  let cumulative = 0;

  for (const [rarityKey, rate] of Object.entries(egg.rates)) {
    cumulative += rate;
    if (roll <= cumulative) {
      selectedRarity = rarityKey;
      break;
    }
  }

  // 2. Sélection d'un modèle de familier correspondant à la rareté obtenue
  const matchingTemplates = Object.values(PETS_DB).filter(p => p.rarity === selectedRarity && p.id.indexOf("loup_domestique") === -1 && p.id.indexOf("lynx_furtif") === -1 && p.id.indexOf("renard_mystique") === -1 && p.id.indexOf("ours_grizzly") === -1 && p.id.indexOf("aigle_imperial") === -1 && p.id.indexOf("dragon_royal") === -1 && p.id.indexOf("dragon_divin") === -1 && p.id.indexOf("licorne_cosmique") === -1);
  
  // Repli de sécurité si aucune créature directe n'est filtrée
  const template = matchingTemplates.length > 0 
    ? matchingTemplates[Math.floor(Math.random() * matchingTemplates.length)]
    : PETS_DB.chien;

  // 3. Attribution aléatoire d'un Talent Passif MMORPG parmi la base de données
  const talentsList = Object.keys(TALENTS_EFFECTS);
  const randomTalent = talentsList[Math.floor(Math.random() * talentsList.length)];

  const rarOpt = RARITIES[selectedRarity] || RARITIES.commune;

  // 4. Indexation et instanciation des statistiques de combat sur la rareté
  return {
    id: template.id,
    name: template.name,
    customName: null,
    rarity: selectedRarity,
    level: 1,
    xp: 0,
    hp: Math.floor(template.hp * rarOpt.mult),
    atk: Math.floor(template.atk * rarOpt.mult),
    def: Math.floor(template.def * rarOpt.mult),
    crit: template.crit,
    dodge: template.dodge,
    hunger: 100,
    joy: 100,
    age: 0,
    talent: randomTalent,
    skill: template.skill
  };
}

// --- SYSTÈME AUTOMATISÉ D'INJECTION EXP (MONTER DE NIVEAU) ---
function gainPetExperience(playerData, petIndex, amount, message) {
  const pet = playerData.collection[petIndex];
  if (!pet) return;

  // Malus d'expérience si le familier est affamé (Faim <= 20)
  let actualXp = amount;
  if (pet.hunger <= 20) {
    actualXp = Math.floor(amount * 0.4);
  }

  pet.xp += actualXp;
  const xpRequired = pet.level * 500;

  if (pet.xp >= xpRequired) {
    pet.xp -= xpRequired;
    pet.level += 1;
    pet.age += 1;

    // Augmentation organique des statistiques de combat à chaque niveau (+8%)
    pet.hp = Math.floor(pet.hp * 1.08);
    pet.atk = Math.floor(pet.atk * 1.08);
    pet.def = Math.floor(pet.def * 1.08);

    message.reply(`✨ | **UPGRADE COMPAGNON :** Votre familier **${pet.customName || pet.name}** passe au **Niveau ${pet.level}** ! Ses statistiques augmentent.`);
  }
}

// --- LOGIQUE TRANSFORMATIONNELLE (ÉVOLUTION) ---
function executePetEvolution(pet) {
  const template = PETS_DB[pet.id];
  if (!template || !template.next) return { success: false, reason: "Ce familier a atteint sa forme d'évolution maximale." };

  if (pet.level < template.levelReq) {
    return { success: false, reason: `Niveau insuffisant. Votre familier doit être **Niveau ${template.levelReq}** (Actuel : Niv. ${pet.level}).` };
  }

  const nextTemplate = PETS_DB[template.next];
  if (!nextTemplate) return { success: false, reason: "L'arbre d'évolution supérieure est introuvable." };

  // Mutation structurelle de la créature en conservant le niveau et le talent
  const oldName = pet.customName || pet.name;
  pet.id = nextTemplate.id;
  pet.name = nextTemplate.name;
  pet.rarity = nextTemplate.rarity;
  pet.skill = nextTemplate.skill;

  // Recalcul des attributs physiques indexés sur le nouveau rang de rareté
  const rarOpt = RARITIES[pet.rarity] || RARITIES.commune;
  pet.hp = Math.floor(nextTemplate.hp * rarOpt.mult * (1 + pet.level * 0.05));
  pet.atk = Math.floor(nextTemplate.atk * rarOpt.mult * (1 + pet.level * 0.05));
  pet.def = Math.floor(nextTemplate.def * rarOpt.mult * (1 + pet.level * 0.05));

  return { success: true, oldName: oldName, newName: pet.name };
}

// --- PASSERELLE INTER-COMMANDES (HOOKS ÉCOSYSTÈME) ---
// Cette fonction permet à vos autres fichiers (arena.js, pirate.js etc.) de lire les bonus passifs du familier actif du joueur.
function getActivePetBonus(uid, hookType) {
  const pData = getPlayerPets(uid);
  if (!pData.activePetId) return null;

  const activePet = pData.collection.find(p => p.id === pData.activePetId || (p.customName && p.customName === pData.activePetId));
  if (!activePet) return null;

  // Si l'animal meurt de faim ou de tristesse, ses passifs s'annulent
  if (activePet.hunger <= 10 || activePet.joy <= 10) return null;

  const talentConfig = TALENTS_EFFECTS[activePet.talent];
  if (!talentConfig) return null;

  // Association des hooks avec les fonctionnalités demandées
  if (hookType === "arena" && ["Berserker", "Tank", "Guardian", "Healer"].includes(activePet.talent)) {
    return { talent: activePet.talent, bonus: talentConfig.bonus, pet: activePet };
  }
  if (hookType === "pirate" && activePet.talent === "Pirate") return talentConfig.bonus;
  if (hookType === "casino" && activePet.talent === "Lucky") return talentConfig.bonus;
  if (hookType === "treasure" && activePet.talent === "Treasure Hunter") return talentConfig.bonus;
  if (hookType === "bank" && activePet.talent === "Banker") return talentConfig.bonus;
  if (hookType === "ranch" && activePet.talent === "Farmer") return talentConfig.bonus;

  return null;
    }

module.exports = {
  config: {
    name: "pet",
    version: "2.5.0",
    author: "Gemini Engine RPG",
    countDown: 2,
    role: 0,
    description: "Système de familiers (Pets) MMORPG interconnecté à tout le serveur.",
    category: "economy",
    guide: {
      fr: "{p}pet info | {p}pet shop | {p}pet adopt <oeuf> | {p}pet hatch <oeuf> | {p}pet feed <slot> <nourriture> | {p}pet equip <slot> | {p}pet list | {p}pet evolve <slot> | {p}pet rename <slot> <nom>",
      en: "{p}pet info | {p}pet shop | {p}pet adopt <egg> | {p}pet hatch <egg> | {p}pet feed <slot> <food> | {p}pet equip <slot> | {p}pet list | {p}pet evolve <slot> | {p}pet rename <slot> <name>"
    }
  },

  onStart: async function ({ api, event, args, usersData, message }) {
    const { senderID } = event;
    const playerData = getPlayerPets(senderID);
    
    let uData = await usersData.get(senderID);
    let userMoney = uData.money || 0;

    const subCommand = args[0]?.toLowerCase();

    // ==========================================
    // 📊 BASE : FICHE TECHNIQUE COMPAGNON ACTIF
    // ==========================================
    if (!subCommand || subCommand === "info") {
      if (!playerData.activePetId) {
        return message.reply("🐾 | Vous n'avez aucun familier équipé actuellement. Utilisez `{p}pet list` puis `{p}pet equip <slot>`.");
      }

      const activePet = playerData.collection.find(p => p.id === playerData.activePetId || p.customName === playerData.activePetId);
      if (!activePet) return message.reply("❌ | Votre familier équipé est introuvable dans votre ménagerie.");

      try {
        const cardTitle = activePet.customName ? `${activePet.customName} (${activePet.name})` : activePet.name;
        const cardBuffer = await drawPetCard(cardTitle, activePet, senderID);
        const cachePath = path.join(DATA_DIR, `pet_${senderID}.png`);
        fs.writeFileSync(cachePath, cardBuffer);

        return message.reply({
          body: `🔮 | **[STATUT DE VOTRE COMPAGNON DE ROUTE]**\n» Utilisez \`pet play\` ou \`pet feed\` pour vous en occuper.`,
          attachment: fs.createReadStream(cachePath)
        });
      } catch (err) {
        return message.reply(`🐾 **${activePet.customName || activePet.name}** (Niv. ${activePet.level})\n❤️ HP: ${activePet.hp} | ⚔️ ATK: ${activePet.atk}\n🍖 Faim: ${activePet.hunger}% | 😊 Joie: ${activePet.joy}%`);
      }
    }

    // ==========================================
    // 🥚 COUVOIR / BOUTIQUE DES OEUFS (SHOP)
    // ==========================================
    if (subCommand === "shop") {
      let shopMsg = `🛒 **[MARCHÉ AUX OEUFS ET NOURRITURE POUR FAMILIERS]**\n\n🔹 **NIDS D'OEUFS DISPONIBLES :**\n`;
      for (const [key, egg] of Object.entries(EGGS_DB)) {
        shopMsg += `${egg.emoji} \`pet adopt ${key}\` ➔ **${egg.name}** : ${egg.cost}$\n`;
      }
      shopMsg += `\n🔹 **RATIONS DE NOURRITURE :**\n`;
      for (const [key, food] of Object.entries(PET_FOOD)) {
        shopMsg += `🍖 \`pet buy food ${key}\` ➔ **${food.name}** : ${food.cost}$ (+${food.restore} Faim)\n`;
      }
      return message.reply(shopMsg);
    }

    // ==========================================
    // 🥚 ADOPTION & ACHATS (ADOPT / BUY)
    // ==========================================
    if (subCommand === "adopt" || subCommand === "buy") {
      const type = args[1]?.toLowerCase();
      if (!type) return message.reply("❌ | Précisez ce que vous désirez acquérir. Exemple : `pet adopt common`.");

      // Achat Nourriture
      if (type === "food") {
        const foodKey = args[2]?.toLowerCase();
        const foodItem = PET_FOOD[foodKey];
        if (!foodItem) return message.reply("❌ | Cet aliment n'existe pas.");

        if (userMoney < foodItem.cost) return message.reply(`💰 | Fonds insuffisants. Il vous faut ${foodItem.cost}$.`);

        userMoney -= foodItem.cost;
        await usersData.set(senderID, { money: userMoney });

        playerData.foodStorage[foodKey] = (playerData.foodStorage[foodKey] || 0) + 1;
        updatePlayerPets(senderID, playerData);

        return message.reply(`🍱 | Vous achetez : **${foodItem.name}** pour **${foodItem.cost}$**.`);
      }

      // Achat et éclosion immédiate d'un œuf
      const eggTemplate = EGGS_DB[type];
      if (!eggTemplate) return message.reply("❌ | Cet œuf n'est pas disponible au couvoir.");

      if (userMoney < eggTemplate.cost) return message.reply(`💰 | Fonds insuffisants. Prix de cet œuf : **${eggTemplate.cost}$.**`);

      userMoney -= eggTemplate.cost;
      await usersData.set(senderID, { money: userMoney });

      // Éclosion
      const newPet = generatePetFromEgg(type);
      playerData.collection.push(newPet);

      // Si c'est le premier familier, on l'équipe automatiquement
      if (!playerData.activePetId) {
        playerData.activePetId = newPet.customName || newPet.name;
      }

      updatePlayerPets(senderID, playerData);

      try {
        const rarOpt = RARITIES[newPet.rarity] || RARITIES.commune;
        const hatchBuffer = await drawHatchCard(eggTemplate.name, newPet, rarOpt.color);
        const cacheHatchPath = path.join(DATA_DIR, `hatch_${senderID}.png`);
        fs.writeFileSync(cacheHatchPath, hatchBuffer);

        return message.reply({
          body: `✨ | L'œuf éclate sous vos yeux !`,
          attachment: fs.createReadStream(cacheHatchPath)
        });
      } catch (e) {
        return message.reply(`🥚 | **ÉCLOSION :** Félicitations ! Votre ${eggTemplate.name} donne naissance à un **${newPet.name}** de rareté **[${newPet.rarity.toUpperCase()}]** !`);
      }
    }

    // ==========================================
    // 📜 LISTE DE LA MENAGERIE (COLLECTION)
    // ==========================================
    if (subCommand === "list") {
      if (playerData.collection.length === 0) return message.reply("🐾 | Votre ménagerie est vide. Achetez votre premier œuf via `pet shop` !");

      let listMsg = `📜 **[MÉNAGERIE DE FAMILIERS ET CRÉATURES]**\n\n`;
      playerData.collection.forEach((p, idx) => {
        const isEquipped = (p.id === playerData.activePetId || p.customName === playerData.activePetId) ? "👑 [ÉQUIPÉ]" : "";
        listMsg += `\`[Slot ${idx + 1}]\` ${p.emoji} **${p.customName || p.name}** (Niv. ${p.level}) — ${p.rarity.toUpperCase()} ${isEquipped}\n`;
      });
      listMsg += `\n👉 _Équipez un familier en faisant : \`pet equip <num_slot>\`_`;
      return message.reply(listMsg);
    }

    // ==========================================
    // 👑 ÉQUIPER UN FAMILIER (EQUIP)
    // ==========================================
    if (subCommand === "equip") {
      const slot = parseInt(args[1]) - 1;
      if (isNaN(slot) || slot < 0 || slot >= playerData.collection.length) return message.reply("❌ | Numéro de slot invalide.");

      const selectedPet = playerData.collection[slot];
      playerData.activePetId = selectedPet.customName || selectedPet.name;
      updatePlayerPets(senderID, playerData);

      return message.reply(`👑 | Compagnon assigné ! **${selectedPet.customName || selectedPet.name}** combat désormais à vos côtés.`);
    }

    // ==========================================
    // 🍖 ALIMENTATION (FEED)
    // ==========================================
    if (subCommand === "feed") {
      if (!playerData.activePetId) return message.reply("❌ | Équipez d'abord un familier pour le nourrir.");
      const activePet = playerData.collection.find(p => p.id === playerData.activePetId || p.customName === playerData.activePetId);

      const foodKey = args[1]?.toLowerCase();
      if (!foodKey || !PET_FOOD[foodKey]) return message.reply("❌ | Indiquez une nourriture valide : `croquette`, `paté`, `delice`, `ambroisie`.");

      if ((playerData.foodStorage[foodKey] || 0) <= 0) return message.reply(`❌ | Vous ne possédez pas de **${PET_FOOD[foodKey].name}** en réserve.`);

      playerData.foodStorage[foodKey] -= 1;
      activePet.hunger = Math.min(100, activePet.hunger + PET_FOOD[foodKey].restore);
      activePet.joy = Math.min(100, activePet.joy + PET_FOOD[foodKey].joy);

      // Petite injection d'XP bonus lors d'un repas de qualité
      gainPetExperience(playerData, playerData.collection.indexOf(activePet), 40, message);
      updatePlayerPets(senderID, playerData);

      return message.reply(`🍖 | **${activePet.customName || activePet.name}** déguste sa ration avec joie ! (+${PET_FOOD[foodKey].restore} Faim).`);
    }

    // ==========================================
    // 😊 JOUER ET DIVERTIR (PLAY)
    // ==========================================
    if (subCommand === "play") {
      if (!playerData.activePetId) return message.reply("❌ | Aucun familier actif.");
      const activePet = playerData.collection.find(p => p.id === playerData.activePetId || p.customName === playerData.activePetId);

      activePet.joy = Math.min(100, activePet.joy + 25);
      activePet.hunger = Math.max(10, activePet.hunger - 10); // Jouer donne faim !

      gainPetExperience(playerData, playerData.collection.indexOf(activePet), 60, message);
      updatePlayerPets(senderID, playerData);

      return message.reply(`🎾 | Vous lancez une balle magique. **${activePet.customName || activePet.name}** s'amuse comme un fou ! (+25% Bonheur / +60 XP).`);
    }

    // ==========================================
    // 🧬 ENTRAÎNEMENT AU MANEGE (TRAIN)
    // ==========================================
    if (subCommand === "train") {
      if (!playerData.activePetId) return message.reply("❌ | Aucun familier actif.");
      const activePet = playerData.collection.find(p => p.id === playerData.activePetId || p.customName === playerData.activePetId);

      if (userMoney < 800) return message.reply("💰 | Une séance d'entraînement au dojo des bêtes requiert **800$**.");
      if (activePet.hunger <= 25) return message.reply("⏳ | Votre familier est trop exténué ou affamé pour s'entraîner. Nourrissez-le.");

      userMoney -= 800;
      await usersData.set(senderID, { money: userMoney });

      activePet.hunger -= 20;
      activePet.joy -= 10;
      
      // Gain massif d'XP
      gainPetExperience(playerData, playerData.collection.indexOf(activePet), 250, message);
      updatePlayerPets(senderID, playerData);

      return message.reply(`⚔️ | **ENTRAÎNEMENT INTENSIF :** Votre familier s'exerce au combat ! (+250 XP / -800$).`);
    }

    // ==========================================
    // 🧬 RECONSTRUIRE ET MUTATION (EVOLVE)
    // ==========================================
    if (subCommand === "evolve") {
      const slot = parseInt(args[1]) - 1;
      if (isNaN(slot) || slot < 0 || slot >= playerData.collection.length) return message.reply("❌ | Veuillez indiquer un numéro de slot valide.");

      const targetPet = playerData.collection[slot];
      const evolutionResult = executePetEvolution(targetPet);

      if (!evolutionResult.success) {
        return message.reply(`❌ | Évolution impossible : ${evolutionResult.reason}`);
      }

      // Si l'animal possédait un ancien nom customisé, on adapte l'identifiant actif
      if (playerData.activePetId === evolutionResult.oldName) {
        playerData.activePetId = targetPet.customName || targetPet.name;
      }

      updatePlayerPets(senderID, playerData);
      return message.reply(`🔥 | **MÉTAMORPHOSE RPG !** Votre ancien **${evolutionResult.oldName}** accumule une force titanesque et évolue en un puissant **${evolutionResult.newName}** !`);
    }

    // ==========================================
    // 🏷️ BAPTÊME / RENOMMER LE COMPAGNON (RENAME)
    // ==========================================
    if (subCommand === "rename") {
      const slot = parseInt(args[1]) - 1;
      const newName = args.slice(2).join(" ");

      if (isNaN(slot) || slot < 0 || slot >= playerData.collection.length) return message.reply("❌ | Slot invalide.");
      if (!newName || newName.length > 20) return message.reply("❌ | Veuillez spécifier un nom (20 caractères max).");

      const targetPet = playerData.collection[slot];
      const wasActive = (playerData.activePetId === targetPet.customName || playerData.activePetId === targetPet.name);

      targetPet.customName = newName;
      if (wasActive) playerData.activePetId = newName;

      updatePlayerPets(senderID, playerData);
      return message.reply(`🏷️ | Votre familier au slot #${slot + 1} s'appelle désormais : **${newName}** !`);
    }
    
    // ==========================================
    // 🏆 CLASSEMENT DES FAUNES (LEADERBOARD)
    // ==========================================
    if (subCommand === "leaderboard" || subCommand === "lb") {
      const allData = readJSON(PETS_FILE);
      const leaders = [];

      Object.entries(allData).forEach(([uid, pObj]) => {
        if (pObj.collection && pObj.collection.length > 0) {
          pObj.collection.forEach(pet => {
            leaders.push({ uid, name: pet.name, cName: pet.customName, lvl: pet.level });
          });
        }
      });

      const sorted = leaders.sort((a, b) => b.lvl - a.lvl).slice(0, 10);
      if (sorted.length === 0) return message.reply("🏁 | Aucun familier n'a encore foulé les terres de ce serveur.");

      let lbText = `🏆 **[CLASSEMENT DES FAMILIERS LES PLUS SAGE ET PUISSANTS]**\n\n`;
      for (let i = 0; i < sorted.length; i++) {
        const uName = (await usersData.get(sorted[i].uid)).name || "Aventurier";
        const displayName = sorted[i].cName ? `${sorted[i].cName} (${sorted[i].name})` : sorted[i].name;
        lbText += `${i + 1}. **${displayName}** — Propriétaire : ${uName} [Niv. ${sorted[i].lvl}]\n`;
      }
      return message.reply(lbText);
    }
  }
};
