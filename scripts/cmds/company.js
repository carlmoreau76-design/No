/**
 * @file company.js
 * @description Système RPG de gestion d'entreprises avec revenus passifs pour GoatBot v2
 * @command company
 * @credits Format GoatBot v2 & Business Engine
 */

const fs = require('fs');
const path = require('path');

// --- CONFIGURATION ET STOCKAGE ---
const DATA_DIR = path.join(__dirname, 'cache', 'companyData');
const COMP_FILE = path.join(DATA_DIR, 'player_companies.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(COMP_FILE)) fs.writeFileSync(COMP_FILE, JSON.stringify({}, null, 2));

// --- BASE DE DONNÉES DES TYPES D'ENTREPRISES ---
const COMPANY_TYPES = {
  restaurant: { id: "restaurant", name: "Restaurant Fast-Food", emoji: "🍕", baseCost: 150000, baseRevenue: 8000, cooldown: 4 }, // toutes les 4 heures
  garage: { id: "garage", name: "Garage Automobile", emoji: "🚗", baseCost: 500000, baseRevenue: 30000, cooldown: 6 },
  banque: { id: "banque", name: "Banque d'Affaires", emoji: "🏦", baseCost: 2500000, baseRevenue: 180000, cooldown: 12 },
  casino: { id: "casino", name: "Casino Impérial", emoji: "🎰", baseCost: 10000000, baseRevenue: 850000, cooldown: 24 }
};

// --- LOGIQUE PERSISTANCE DONNÉES ---
function readJSON(file) { return JSON.parse(fs.readFileSync(file, 'utf8')); }
function writeJSON(file, data) { fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8'); }

function getPlayerCompanies(uid) {
  const data = readJSON(COMP_FILE);
  if (!data[uid]) {
    data[uid] = { companies: {} };
    writeJSON(COMP_FILE, data);
  }
  return data[uid];
}

// --- UTILS : INTERFACE TEXTUELLE ---
const UI = {
  line: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
  boxStart: (title) => `╭────────────── 💼 ──────────────╮\n│ 🏬  ${title.toUpperCase()}\n├───────────────────────────────────────`,
  boxEnd: () => `╰───────────────────────────────────────╯`,
  field: (label, val) => `│ 🔹 ${label} : ${val}`
};

module.exports = {
  config: {
    name: "company",
    aliases: ["comp", "entreprise"],
    version: "1.0.0",
    author: "Gemini Engine RPG",
    countDown: 3,
    role: 0,
    description: "Fondez une entreprise et générez des revenus passifs importants.",
    category: "economy",
    guide: {
      fr: "{p}company info | {p}company catalog | {p}company buy <type> | {p}company upgrade <type> | {p}company hire <type> | {p}company claim",
      en: "{p}company info | {p}company catalog | {p}company buy <type> | {p}company upgrade <type> | {p}company hire <type> | {p}company claim"
    }
  },

  onStart: async function ({ event, args, usersData, message }) {
    const { senderID } = event;
    const pData = getPlayerCompanies(senderID);
    const subCommand = args[0]?.toLowerCase();

    let uData = await usersData.get(senderID);
    let userMoney = uData.money || 0;

    // ==========================================
    // 📊 BASE : STATUT DE VOS ENTREPRISES
    // ==========================================
    if (!subCommand || subCommand === "info") {
      const owned = Object.values(pData.companies);
      if (owned.length === 0) {
        return message.reply("💼 | Vous ne possédez aucune entreprise pour le moment. Tapez `company catalog` pour investir !");
      }

      let infoMsg = UI.boxStart("Vos Actifs Financiers");
      owned.forEach(c => {
        const type = COMPANY_TYPES[c.id];
        const nextClaim = c.lastClaim + (type.cooldown * 60 * 60 * 1000);
        const ready = Date.now() >= nextClaim ? "✅ DISPONIBLE" : "⏳ EN PRODUCTION";
        
        infoMsg += `\n${type.emoji} **${type.name}** (Niv. ${c.level})\n`;
        infoMsg += `${UI.field("Employés", `${c.employees}/10`)}\n`;
        infoMsg += `${UI.field("Rendement", `${c.currentRevenue.toLocaleString()}$`)}\n`;
        infoMsg += `${UI.field("Statut", ready)}\n`;
      });
      infoMsg += `\n${UI.line}\n👉 _Récupérez vos profits globaux avec \`company claim\` !_\n${UI.boxEnd()}`;
      return message.reply(infoMsg);
    }

    // ==========================================
    // 🛒 CATALOGUE DES FONDS DE COMMERCE
    // ==========================================
    if (subCommand === "catalog" || subCommand === "market") {
      let catMsg = UI.boxStart("Marché des Entreprises");
      for (const [key, c] of Object.entries(COMPANY_TYPES)) {
        catMsg += `\n${c.emoji} **\`company buy ${key}\`**\n`;
        catMsg += `${UI.field("Nom", c.name)}\n`;
        catMsg += `${UI.field("Prix d'Achat", `${c.baseCost.toLocaleString()}$`)}\n`;
        catMsg += `${UI.field("Revenu Initial", `+${c.baseRevenue.toLocaleString()}$ / ${c.cooldown}h`)}\n`;
      }
      catMsg += `\n${UI.boxEnd()}`;
      return message.reply(catMsg);
    }

    // ==========================================
    // 🔑 ACHAT D'UNE STRUCTURE
    // ==========================================
    if (subCommand === "buy") {
      const typeKey = args[1]?.toLowerCase();
      const template = COMPANY_TYPES[typeKey];

      if (!template) return message.reply("❌ | Ce type d'entreprise n'est pas répertorié dans le catalogue.");
      if (pData.companies[typeKey]) return message.reply("❌ | Vous possédez déjà cette franchise de commerce.");

      if (userMoney < template.baseCost) {
        return message.reply(`💰 | Fonds insuffisants. L'investissement initial requiert **${template.baseCost.toLocaleString()}$**.`);
      }

      // Déduction financière
      userMoney -= template.baseCost;
      await usersData.set(senderID, { money: userMoney });

      // Instanciation de l'entreprise
      pData.companies[typeKey] = {
        id: template.id,
        level: 1,
        employees: 0,
        currentRevenue: template.baseRevenue,
        lastClaim: Date.now()
      };

      const data = readJSON(COMP_FILE);
      data[senderID] = pData;
      writeJSON(COMP_FILE, data);

      return message.reply(`🎉 | **FÉLICITATIONS :** Vous venez d'acquérir votre **${template.name}** pour **${template.baseCost.toLocaleString()}$** !`);
    }

    // ==========================================
    // ⬆️ MISE À NIVEAU (UPGRADE INFRASTRUCTURE)
    // ==========================================
    if (subCommand === "upgrade") {
      const typeKey = args[1]?.toLowerCase();
      const myComp = pData.companies[typeKey];

      if (!myComp) return message.reply("❌ | Vous ne possédez pas ce commerce.");

      const template = COMPANY_TYPES[typeKey];
      const upgradeCost = Math.floor(template.baseCost * 0.6 * myComp.level);

      if (userMoney < upgradeCost) {
        return message.reply(`💰 | Il vous faut **${upgradeCost.toLocaleString()}$** pour moderniser cette structure.`);
      }

      userMoney -= upgradeCost;
      await usersData.set(senderID, { money: userMoney });

      myComp.level += 1;
      // Hausse du rendement : +40% par niveau d'infrastructure
      myComp.currentRevenue = Math.floor(myComp.currentRevenue * 1.4);

      const data = readJSON(COMP_FILE);
      data[senderID] = pData;
      writeJSON(COMP_FILE, data);

      return message.reply(`⬆️ | **PROGRÈS :** Votre **${template.name}** passe au **Niveau ${myComp.level}** ! Nouveau rendement : **${myComp.currentRevenue.toLocaleString()}$**.`);
    }

    // ==========================================
    // 👥 RECRUTEMENT DE PERSONNEL (HIRE)
    // ==========================================
    if (subCommand === "hire") {
      const typeKey = args[1]?.toLowerCase();
      const myComp = pData.companies[typeKey];

      if (!myComp) return message.reply("❌ | Vous ne possédez pas ce commerce.");
      if (myComp.employees >= 10) return message.reply("❌ | Cette entreprise tourne à plein régime (Maximum 10 employés).");

      const template = COMPANY_TYPES[typeKey];
      const hireCost = Math.floor(template.baseCost * 0.15 * (myComp.employees + 1));

      if (userMoney < hireCost) {
        return message.reply(`💰 | Le recrutement d'un expert demande **${hireCost.toLocaleString()}$**.`);
      }

      userMoney -= hireCost;
      await usersData.set(senderID, { money: userMoney });

      myComp.employees += 1;
      // Hausse du rendement : +15% de bonus par employé actif
      myComp.currentRevenue = Math.floor(myComp.currentRevenue * 1.15);

      const data = readJSON(COMP_FILE);
      data[senderID] = pData;
      writeJSON(COMP_FILE, data);

      return message.reply(`👥 | **RECRUTEMENT :** Nouvel employé engagé dans votre **${template.name}** (${myComp.employees}/10). Production accrue !`);
    }

    // ==========================================
    // 💰 COLLECTE DES REVENUS SÉCURISÉE (CLAIM)
    // ==========================================
    if (subCommand === "claim" || subCommand === "harvest") {
      const owned = Object.values(pData.companies);
      if (owned.length === 0) return message.reply("❌ | Vous n'avez aucun actif à récolter.");

      let totalHarvested = 0;
      let count = 0;
      const now = Date.now();

      owned.forEach(c => {
        const type = COMPANY_TYPES[c.id];
        const nextClaim = c.lastClaim + (type.cooldown * 60 * 60 * 1000);

        if (now >= nextClaim) {
          totalHarvested += c.currentRevenue;
          c.lastClaim = now;
          count++;
        }
      });

      if (count === 0) {
        return message.reply("⏳ | Vos entreprises sont toujours en cours de production. Revenez plus tard.");
      }

      userMoney += totalHarvested;
      await usersData.set(senderID, { money: userMoney });

      const data = readJSON(COMP_FILE);
      data[senderID] = pData;
      writeJSON(COMP_FILE, data);

      return message.reply(`💰 | **REVENUS PASSÉ SÉCURISÉS :** Vous passez à la caisse et collectez un total de **+${totalHarvested.toLocaleString()}$** générés par vos établissements !`);
    }

    return message.reply("❌ | Sous-commande introuvable. Utilisez `company info` ou consultez le manuel.");
  }
};
