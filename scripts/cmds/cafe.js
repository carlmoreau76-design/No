const fs = require("fs-extra");
const path = require("path");

const dataPath = path.join(__dirname, "cache", "cafe_data.json");
const ALLOWED_GROUP_ID = "1805560450788598"; // ID unique du groupe autorisé

// Structure ultra-complète de la base de données du café
const defaultData = {
  caisse: 10000,
  reputation: 50, // Sur 100
  level: 1,
  xp: 0,
  ouvert: true,
  serveuses: [], // IDs des serveuses
  candidatures: [], // [{ userID, name }]
  historiqueJournal: [], // [{ date, type, desc }]
  stock: {
  cafe: 50,
  lait: 30,
  sucre: 40,
  glacons: 50,
  fruits: 20,

  chocolat: 25,
  the: 25,
  citron: 20,
  caramel: 15,
  miel: 15,
  vanille: 20,
  cannelle: 15,
  menthe: 15,
  noixCoco: 15,
  creme: 20,
  siropFraise: 15,
  siropVanille: 15,
  siropCaramel: 15,
  orange: 20,
  pomme: 20,
  banane: 20,
  mangue: 20,
  fraise: 20,
  ananas: 20,
  kiwi: 20,
  pasteque: 20,
  raisin: 20,
  riz: 20,

  whisky: 10,
  vodka: 10,
  rhum: 10,
  gin: 10,
  tequila: 10,
  champagne: 8,
  sake: 10,
  vinRouge: 15,
  vinBlanc: 15,
  biere: 20,
  cognac: 8,
  liqueur: 12
},

prixIngredients: {
  cafe: 5,
  lait: 3,
  sucre: 2,
  glacons: 1,
  fruits: 8,

  chocolat: 7,
  the: 4,
  citron: 5,
  caramel: 8,
  miel: 9,
  vanille: 8,
  cannelle: 6,
  menthe: 4,
  noixCoco: 9,
  creme: 7,
  siropFraise: 6,
  siropVanille: 6,
  siropCaramel: 7,
  orange: 5,
  pomme: 5,
  banane: 5,
  mangue: 8,
  fraise: 9,
  ananas: 8,
  kiwi: 10,
  pasteque: 7,
  raisin: 10,
  riz: 6,

  whisky: 120,
  vodka: 100,
  rhum: 110,
  gin: 130,
  tequila: 150,
  champagne: 300,
  sake: 180,
  vinRouge: 80,
  vinBlanc: 85,
  biere: 40,
  cognac: 250,
  liqueur: 90
},
  menu: [
    { id: 1, name: "Espresso Serré", price: 50, req: { cafe: 1 }, level: 1 },
    { id: 2, name: "Cappuccino Onctueux", price: 80, req: { cafe: 1, lait: 1, sucre: 1 }, level: 1 },
    { id: 3, name: "Jus de Fruits Frais", price: 120, req: { fruits: 2 }, level: 1 },
    { id: 4, name: "Iced Latte Gourmand", price: 150, req: { cafe: 1, lait: 1, glacons: 2, sucre: 1 }, level: 2 },
    { id: 5, name: "Cocktail Délice du Chef", price: 250, req: { fruits: 3, glacons: 2, sucre: 2 }, level: 3 },
    { id: 6, name: "Moka Chocolaté", price: 180, req: { cafe: 1, lait: 1, chocolat: 2 }, level: 2 },
    { id: 7, name: "Chocolat Chaud", price: 140, req: { lait: 2, chocolat: 2 }, level: 1 },
    { id: 8, name: "Thé Vert", price: 90, req: { the: 1 }, level: 1 },
    { id: 9, name: "Thé au Citron", price: 110, req: { the: 1, citron: 1 }, level: 2 },
    { id: 10, name: "Smoothie Tropical", price: 220, req: { fruits: 4, glacons: 2 }, level: 3 },
    { id: 11, name: "Milkshake Vanille", price: 200, req: { lait: 2, sucre: 2 }, level: 2 },
    { id: 12, name: "Milkshake Chocolat", price: 230, req: { lait: 2, chocolat: 2 }, level: 3 },
    { id: 13, name: "Latte Caramel", price: 240, req: { cafe: 1, lait: 2, caramel: 1 }, level: 3 },
    { id: 14, name: "Macchiato", price: 160, req: { cafe: 2, lait: 1 }, level: 2 },
    { id: 15, name: "Americano", price: 100, req: { cafe: 2 }, level: 1 },
    { id: 16, name: "Frappé Café", price: 260, req: { cafe: 1, lait: 1, glacons: 3 }, level: 4 },
    { id: 17, name: "Frappé Chocolat", price: 280, req: { chocolat: 2, lait: 2, glacons: 3 }, level: 4 },
    { id: 18, name: "Limonade Maison", price: 130, req: { citron: 2, sucre: 1 }, level: 2 },
    { id: 19, name: "Orange Pressée", price: 150, req: { fruits: 2 }, level: 2 },
    { id: 20, name: "Jus de Mangue", price: 170, req: { fruits: 3 }, level: 2 },
    { id: 21, name: "Bubble Tea", price: 320, req: { the: 1, lait: 1, sucre: 2 }, level: 5 },
    { id: 22, name: "Matcha Latte", price: 350, req: { the: 2, lait: 2 }, level: 5 },
    { id: 23, name: "Café Viennois", price: 300, req: { cafe: 2, lait: 2, sucre: 1 }, level: 4 },
    { id: 24, name: "Affogato", price: 330, req: { cafe: 2, lait: 1 }, level: 5 },
    { id: 25, name: "Mocha Glacé", price: 340, req: { cafe: 1, chocolat: 2, glacons: 3 }, level: 5 },
    { id: 26, name: "Punch Exotique", price: 380, req: { fruits: 5, glacons: 2 }, level: 6 },
    { id: 27, name: "Cocktail Paradise", price: 420, req: { fruits: 6, sucre: 2 }, level: 6 },
    { id: 28, name: "Golden Latte", price: 450, req: { lait: 2, miel: 2 }, level: 6 },
    { id: 29, name: "Espresso Royal", price: 400, req: { cafe: 3 }, level: 6 },
    { id: 30, name: "Café Noisette", price: 260, req: { cafe: 2, lait: 1 }, level: 4 },
    { id: 31, name: "Smoothie Fraise", price: 300, req: { fruits: 4 }, level: 5 },
    { id: 32, name: "Smoothie Banane", price: 290, req: { fruits: 4, lait: 1 }, level: 5 },
    { id: 33, name: "Jus Détox", price: 360, req: { fruits: 5, citron: 1 }, level: 6 },
    { id: 34, name: "Milkshake Oreo", price: 420, req: { lait: 2, chocolat: 2 }, level: 7 },
    { id: 35, name: "Café Glacé Premium", price: 450, req: { cafe: 2, glacons: 4 }, level: 7 },
    { id: 36, name: "Latte Signature", price: 500, req: { cafe: 2, lait: 3 }, level: 8 },
    { id: 37, name: "Caramel Frappuccino", price: 550, req: { cafe: 2, caramel: 2, glacons: 4 }, level: 8 },
    { id: 38, name: "Thé Royal", price: 470, req: { the: 3, miel: 2 }, level: 8 },
    { id: 39, name: "Cocktail Arc-en-ciel", price: 620, req: { fruits: 7, glacons: 3 }, level: 9 },
    { id: 40, name: "Boisson Émeraude", price: 700, req: { fruits: 8, sucre: 2 }, level: 9 },
    { id: 41, name: "Café Impérial", price: 800, req: { cafe: 4, lait: 2 }, level: 10 },
    { id: 42, name: "Latte Diamant", price: 900, req: { cafe: 4, lait: 3, caramel: 2 }, level: 10 },
    { id: 43, name: "Milkshake Galaxy", price: 950, req: { lait: 3, chocolat: 3 }, level: 10 },
    { id: 44, name: "Smoothie Dragon", price: 1000, req: { fruits: 10 }, level: 11 },
    { id: 45, name: "Cocktail Légendaire", price: 1100, req: { fruits: 10, glacons: 5 }, level: 11 },
    { id: 46, name: "Élixir des Baristas", price: 1250, req: { cafe: 5, lait: 3, miel: 2 }, level: 12 },
    { id: 47, name: "Boisson Cosmique", price: 1400, req: { fruits: 12, sucre: 3 }, level: 12 },
    { id: 48, name: "Nectar Céleste", price: 1600, req: { fruits: 14, miel: 3 }, level: 13 },
    { id: 49, name: "Café Divin", price: 1800, req: { cafe: 6, lait: 4, chocolat: 3 }, level: 14 },
    { id: 50, name: "Ambroisie Suprême", price: 2500, req: { cafe: 8, lait: 5, chocolat: 5, caramel: 3, miel: 3, glacons: 5 }, level: 15 },
    { id: 51, name: "Verre de Vin Rouge", price: 300, req: { raisin: 3 }, level: 4 },
    { id: 52, name: "Verre de Vin Blanc", price: 320, req: { raisin: 3 }, level: 4 },
    { id: 53, name: "Champagne Prestige", price: 1200, req: { raisin: 6 }, level: 8 },
    { id: 54, name: "Whisky Écossais", price: 800, req: { whisky: 1, glacons: 2 }, level: 7 },
    { id: 55, name: "Whisky Premium 18 Ans", price: 1800, req: { whisky: 2, glacons: 3 }, level: 12 },
    { id: 56, name: "Saké Traditionnel", price: 650, req: { riz: 3 }, level: 6 },
    { id: 57, name: "Saké Impérial", price: 1400, req: { riz: 6 }, level: 11 },
    { id: 58, name: "Vodka Glacée", price: 700, req: { vodka: 1, glacons: 3 }, level: 6 },
    { id: 59, name: "Rhum Ambré", price: 750, req: { rhum: 1 }, level: 7 },
    { id: 60, name: "Tequila Gold", price: 900, req: { tequila: 1, citron: 1 }, level: 8 },
    { id: 61, name: "Gin Tonic", price: 850, req: { gin: 1, citron: 1, glacons: 2 }, level: 8 },
    { id: 62, name: "Mojito", price: 950, req: { rhum: 1, citron: 1, sucre: 1, glacons: 2 }, level: 9 },
    { id: 63, name: "Piña Colada", price: 1100, req: { rhum: 1, lait: 1, fruits: 3 }, level: 10 },
    { id: 64, name: "Martini", price: 1300, req: { gin: 1 }, level: 10 },
    { id: 65, name: "Cocktail Royal", price: 2500, req: { champagne: 1, fruits: 5 }, level: 15 }
  ],
  tables: [
    { id: 1, statut: "Libre", occupePar: null },
    { id: 2, statut: "Libre", occupePar: null },
    { id: 3, statut: "Libre", occupePar: null },
    { id: 4, statut: "Libre", occupePar: null }
  ],
  pnjClients: [], // Liste des clients PNJ actifs en attente [{ id, nom, commandeId, tempsRestant }]
  quetesQuotidiennes: [
    { id: 1, desc: "Servir 3 boissons", requis: 3, progression: {}, recompense: 200 },
    { id: 2, desc: "Nettoyer le café", requis: 1, progression: {}, recompense: 100 }
  ],
  dernierNettoyage: 0,
  propreness: 100 // Sur 100
};

// Fonctions utilitaires
function loadCafeData() {
  try {
    if (!fs.existsSync(dataPath)) {
      fs.ensureDirSync(path.dirname(dataPath));
      fs.writeJsonSync(dataPath, defaultData, { spaces: 2 });
      return defaultData;
    }
    const data = fs.readJsonSync(dataPath);
    // Fusionner avec defaultData au cas où de nouveaux champs sont ajoutés
    return { ...defaultData, ...data };
  } catch (e) {
    console.error("Erreur de lecture des données Café :", e);
    return defaultData;
  }
}

function saveCafeData(data) {
  try {
    fs.writeJsonSync(dataPath, data, { spaces: 2 });
  } catch (e) {
    console.error("Erreur d'écriture des données Café :", e);
  }
}

const safeNumber = (val) => {
  if (val === null || val === undefined) return 0;
  const num = Number(val);
  return Number.isFinite(num) && !Number.isNaN(num) ? Math.round(num) : 0;
};

// Ajoute un log au journal
function ajouterJournal(data, type, desc) {
  const dateStr = new Date().toLocaleString("fr-FR", { timeZone: "Europe/Paris" });
  data.historiqueJournal.unshift({ date: dateStr, type, desc });
  if (data.historiqueJournal.length > 50) data.historiqueJournal.pop();
}

// Génère un nom de PNJ aléatoire
function genererNomPNJ() {
  const prenoms = ["Arthur", "Sophie", "Lucas", "Emma", "Julien", "Chloé", "Marc", "Léa", "Thomas", "Camille"];
  const titres = ["l'étudiant", "le businessman", "la cliente pressée", "l'artiste", "le voyageur"];
  return `${prenoms[Math.floor(Math.random() * prenoms.length)]} ${titres[Math.floor(Math.random() * titres.length)]}`;
}

module.exports = {
  config: {
    name: "cafe",
    aliases: ["coffee", "bar", "caferp"],
    version: "2.0.0",
    author: "Malika",
    countDown: 2,
    role: 0,
    category: "economy",
    guide: {
      fr: "{p}cafe [sous-commande]"
    }
  },

  // 1. Événement d'accueil et d'automatisation des PNJ / Cycles
  onEvent: async function ({ api, event, usersData }) {
    if (String(event.threadID) !== ALLOWED_GROUP_ID) return;

    // --- ACCUEIL DES NOUVEAUX ---
    if (event.logMessageType === "log:subscribe") {
      const addedParticipants = event.logMessageData.addedParticipants;
      for (const participant of addedParticipants) {
        const userID = participant.userFbId;
        const userInfo = await usersData.get(userID) || {};
        const userName = userInfo.name || "Nouvel Invité";

        // Attribution auto du rôle de Client et bonus de bienvenue
        if (userInfo) {
          userInfo.money = safeNumber(userInfo.money) + 500; // Bonus de 500$
          await usersData.set(userID, userInfo);
        }

        const welcomeMsg = 
          `🌸 ✨ ━━━━━━━ 𝐖𝐄𝐋𝐂𝐎𝐌𝐄 𝐀𝐔 𝐂𝐀𝐅𝐄́ 𝐌𝐀𝐋𝐈𝐊𝐀 ━━━━━━━ ✨ 🌸\n` +
          `✨ ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬ ✨\n` +
          `Bonjour à toi, @${userName} ! 🎉\n\n` +
          `Bienvenue dans notre havre de paix et de gourmandise.\n` +
          `Tu reçois automatiquement le rôle de **Client** de notre établissement !\n` +
          `🎁 Un cadeau de bienvenue de **500$** vient d'être crédité sur ton compte.\n\n` +
          `📜 **📋 GUIDE DE DÉMARRAGE RAPIDE :**\n` +
          `◽ \`cafe menu\` : Consulter notre carte des boissons.\n` +
          `◽ \`cafe commander [ID]\` : Te délecter d'une boisson chaude ou fraîche.\n` +
          `◽ \`cafe postuler\` : Rejoindre l'équipe des serveuses.\n` +
          `◽ \`cafe aide\` : Voir la totalité des 25 commandes RP !\n\n` +
          `⚠️ *Veille à respecter l'équipe et les autres clients. Bon séjour !* ☕🍰\n` +
          `✨ ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬ ✨`;

        api.sendMessage({ body: welcomeMsg, mentions: [{ tag: `@${userName}`, id: userID }] }, event.threadID);
      }
    }
  },

  // 2. Logique principale des commandes
  onStart: async function ({ api, event, args, usersData, message }) {
    const { senderID, threadID } = event;

    // Restriction stricte au groupe autorisé
    if (String(threadID) !== ALLOWED_GROUP_ID) {
      return message.reply("⚠️ L'accès à l'établissement du Café RP est strictement privé et réservé à son groupe officiel.");
    }

    const data = loadCafeData();
    const subCommand = args[0]?.toLowerCase();

    // Récupération sécurisée du profil utilisateur
    const senderInfo = await usersData.get(senderID);
    if (!senderInfo) return message.reply("❌ Impossible de charger votre profil de joueur.");
    senderInfo.money = safeNumber(senderInfo.money);

    // Fonction de niveau du café
    const xpNecessaire = data.level * 500;
    const verifierLevelUp = () => {
      if (data.xp >= xpNecessaire) {
        data.level += 1;
        data.xp = 0;
        ajouterJournal(data, "LEVELUP", `Le Café est passé au Niveau ${data.level} !`);
        api.sendMessage(`🎉 𝐄𝐕𝐄́𝐍𝐄𝐌𝐄𝐍𝐓 : Le Café monte en grade et atteint le **Niveau ${data.level}** ! De nouvelles boissons sont désormais déblocables. 🚀`, threadID);
      }
    };

    // --- ENTRAINE LES CLIENTS PNJ ET EVENEMENTS ALEATOIRES PAR CYCLE DE COMMANDE ---
    // Simule la vie du café à chaque interaction
    if (data.ouvert && Math.random() < 0.25) {
      // Un PNJ arrive
      if (data.pnjClients.length < 4) {
        const randomDrink = data.menu[Math.floor(Math.random() * data.menu.length)];
        const nouveauPnj = {
          id: Date.now(),
          nom: genererNomPNJ(),
          commandeId: randomDrink.id,
          tempsRestant: 5 // 5 tours d'interactions de commandes avant de partir fâché
        };
        data.pnjClients.push(nouveauPnj);
        saveCafeData(data);
        api.sendMessage(`🔔 **𝐍𝐎𝐔𝐕𝐄𝐀𝐔 𝐂𝐋𝐈𝐄𝐍𝐓 (𝐏𝐍𝐉) !**\n🙋‍♂️ **${nouveauPnj.nom}** vient de s'installer à une table libre !\n🛒 Il souhaite commander : **${randomDrink.name}**.\n💡 *Utilisez \`cafe servir\` pour vous occuper de lui !*`, threadID);
      }
    }

    // Événement aléatoire inattendu (1 chance sur 15)
    if (Math.random() < 0.08) {
      const events = [
        {
          titre: "🚨 INSPECTION SANITAIRE 🚨",
          desc: "Un inspecteur d'hygiène débarque sans prévenir !",
          action: () => {
            if (data.propreness < 50) {
              const amende = 1500;
              data.caisse = Math.max(0, data.caisse - amende);
              data.reputation = Math.max(0, data.reputation - 15);
              return `🤢 Le café est jugé trop sale (${data.propreness}% de propreté). Vous écopez d'une amende de **${amende}$** et perdez **15% de réputation**.`;
            } else {
              data.reputation = Math.min(100, data.reputation + 5);
              return `✨ Félicitations ! Le café est d'une propreté impeccable (${data.propreness}%). Vous gagnez **5% de réputation** additionnelle !`;
            }
          }
        },
        {
          titre: "🌟 VISITE D'UNE CÉLÉBRITÉ 🌟",
          desc: "Un influenceur mondialement connu franchit les portes du café !",
          action: () => {
            data.reputation = Math.min(100, data.reputation + 15);
            data.caisse += 1000;
            return `📸 La star a posté une story de votre établissement ! La réputation grimpe de **15%** et un afflux de pourboires génère **1000$** supplémentaires en caisse.`;
          }
        },
        {
          titre: "🔧 PANNE DE MACHINE À CAFÉ 🔧",
          desc: "La machine principale émet un bruit d'explosion et s'arrête.",
          action: () => {
            data.caisse = Math.max(0, data.caisse - 500);
            return `💥 Des frais de réparation de urgence s'élèvent à **500$** pour remettre les percolateurs en route.`;
          }
        }
      ];

      const ev = events[Math.floor(Math.random() * events.length)];
      const resMsg = ev.action();
      saveCafeData(data);
      api.sendMessage(`📢 ━━━━━━━━ 𝐄𝐕𝐄́𝐍𝐄𝐌𝐄𝐍𝐓 𝐀𝐋𝐄́𝐀𝐓𝐎𝐈𝐑𝐄 ━━━━━━━━ 📢\n\n**${ev.titre}**\n_${ev.desc}_\n\n👉 ${resMsg}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`, threadID);
    }

    // Décompte de patience des PNJ
    if (data.pnjClients.length > 0) {
      data.pnjClients.forEach(p => p.tempsRestant -= 1);
      const partis = data.pnjClients.filter(p => p.tempsRestant <= 0);
      if (partis.length > 0) {
        data.pnjClients = data.pnjClients.filter(p => p.tempsRestant > 0);
        data.reputation = Math.max(0, data.reputation - (partis.length * 4));
        saveCafeData(data);
        api.sendMessage(`😡 **Clients mécontents !** ${partis.length} client(s) PNJ sont partis sans être servis à cause de l'attente. Votre réputation baisse !`, threadID);
      }
    }


    // --- SYSTÈME DE COMMANDE (25 SOUS-COMMANDES) ---

    // 1. HELP / AIDE
    if (!subCommand || subCommand === "aide" || subCommand === "help") {
      const listAide = 
        `☕ ━━━━━━━ 𝐌𝐄𝐍𝐔 𝐃𝐄𝐒 𝐂𝐎𝐌𝐌𝐀𝐍𝐃𝐄𝐒 𝐂𝐀𝐅𝐄́ 𝐌𝐀𝐋𝐈𝐊𝐀 ━━━━━━━ ☕\n` +
        `✨ Utilisez : \`cafe [option]\`\n` +
        `◽ ━━━━━━━━━ CLIENT ━━━━━━━━━ ◽\n` +
        `• \`menu\` : Consulter la carte des délicieuses boissons\n` +
        `• \`commander [ID]\` : Commander une boisson fraîche ou chaude\n` +
        `• \`postuler\` : Soumettre votre candidature pour être serveuse\n` +
        `• \`serveuses\` : Afficher l'ensemble des serveuses qualifiées\n` +
        `• \`reserver [table]\` : Réserver une table spécifique\n` +
        `• \`table\` : Regarder l'état d'occupation des tables\n` +
        `• \`classement\` : Voir le classement de l'équipe de choc\n\n` +
        `◽ ━━━━━━━━ SERVEUSE ━━━━━━━━ ◽\n` +
        `• \`travailler\` : Prendre son service et accomplir des quêtes\n` +
        `• \`servir\` : Servir un client PNJ en attente\n` +
        `• \`salaire\` : Réclamer votre paie méritée\n` +
        `• \`pourboire\` : Tenter de glaner des pourboires généreux\n` +
        `• \`nettoyer\` : Entretenir et désinfecter la salle\n` +
        `• \`cuisine\` : Visualiser l'avancement de la préparation\n` +
        `• \`quetes\` : Regarder les missions journalières actives\n` +
        `• \`defi\` : Lancer le défi spécial de la journée\n\n` +
        `◽ ━━━━━━━━ GESTION/STOCK ━━━━━━━━ ◽\n` +
        `• \`caisse\` : Vérifier le capital financier commun\n` +
        `• \`inventaire\` : Voir votre équipement et vos possessions\n` +
        `• \`stock\` : Inspecter le stock d'ingrédients du café\n` +
        `• \`acheter [ingredient] [qte]\` : Réapprovisionner le café\n` +
        `• \`reputation\` : Voir la renommée actuelle du commerce\n` +
        `• \`clients\` : Afficher la file d'attente des clients PNJ\n` +
        `• \`journal\` : Parcourir l'historique des opérations\n` +
        `• \`ouvrir\` / \`fermer\` : Ouvrir ou fermer l'établissement\n` +
        `• \`staff\` : Commandes pour les administrateurs du café`;
      return message.reply(listAide);
    }

    // 2. MENU
    if (subCommand === "menu") {
      let msg = `📋 ━━━━━━━ 𝐌𝐄𝐍𝐔 𝐃𝐔 𝐂𝐀𝐅𝐄́ 𝐌𝐀𝐋𝐈𝐊𝐀 ━━━━━━━ 📋\n` +
                `✨ Niveau du café requis pour commander indiqué.\n\n`;
      data.menu.forEach(d => {
        msg += `◽ **[ ${d.id} ]** ${d.name} : **${d.price}$** *(Req: Nv.${d.level})*\n` +
               `   ↳ Composants : ${Object.entries(d.req).map(([k, v]) => `${v}x ${k}`).join(", ")}\n\n`;
      });
      msg += `💡 *Pour savourer une de ces boissons, tapez : \`cafe commander [ID]\`*`;
      return message.reply(msg);
    }

    // 3. COMMANDER
    if (subCommand === "commander") {
      if (!data.ouvert) return message.reply("💤 Le café est actuellement fermé ! Repassez pendant les heures d'ouverture.");
      const drinkId = parseInt(args[1]);
      if (isNaN(drinkId)) return message.reply("❌ Précisez l'identifiant numérique de la boisson ! Exemple: `cafe commander 2`");

      const boisson = data.menu.find(d => d.id === drinkId);
      if (!boisson) return message.reply("❌ Cette boisson ne figure pas sur notre carte.");
      if (data.level < boisson.level) return message.reply(`🔒 Vous devez atteindre le niveau de café **${boisson.level}** pour débloquer cette boisson.`);

      // Vérification des stocks d'ingrédients du café
      for (const [ing, qte] of Object.entries(boisson.req)) {
        if ((data.stock[ing] || 0) < qte) {
          return message.reply(`⚠️ Le café est en rupture d'ingrédients (**${ing}**) pour concocter cette boisson !`);
        }
      }

      if (senderInfo.money < boisson.price) {
        return message.reply(`💸 Vous ne possédez pas les fonds nécessaires (**${boisson.price}$**).`);
      }

      // Consommation et paiement
      senderInfo.money -= boisson.price;
      data.caisse += boisson.price;
      data.xp += 15;
      data.propreness = Math.max(0, data.propreness - 2); // Un peu de saleté en cuisine

      for (const [ing, qte] of Object.entries(boisson.req)) {
        data.stock[ing] -= qte;
      }

      await usersData.set(senderID, senderInfo);
      ajouterJournal(data, "VENTE", `${senderInfo.name} a commandé un ${boisson.name}.`);
      verifierLevelUp();
      saveCafeData(data);

      const ticket = 
        `🧾 ━━━━━━━ 𝐓𝐈𝐂𝐊𝐄𝐓 𝐃𝐄 𝐂𝐀𝐈𝐒𝐒𝐄 ━━━━━━━ 🧾\n` +
        `👤 **Client :** ${senderInfo.name}\n` +
        `☕ **Boisson :** ${boisson.name}\n` +
        `💵 **Prix :** ${boisson.price}$\n` +
        `👛 **Nouveau Solde :** ${senderInfo.money}$\n` +
        `✨ *Merci pour votre fidélité et bonne dégustation !* ✨`;
      return message.reply(ticket);
    }

    // 4. POSTULER
    if (subCommand === "postuler") {
      if (data.serveuses.includes(senderID)) return message.reply("👩‍🍳 Vous faites déjà partie de notre brigade de serveuses !");
      if (data.candidatures.some(c => c.userID === senderID)) return message.reply("⏳ Votre candidature est déjà à l'étude par la direction.");

      data.candidatures.push({ userID: senderID, name: senderInfo.name });
      saveCafeData(data);
      return message.reply("📝 Votre demande de recrutement a été déposée. Les administrateurs de l'établissement vont l'étudier d'ici peu !");
    }

    // 5. SERVEUSES
    if (subCommand === "serveuses") {
      if (data.serveuses.length === 0) return message.reply("🧹 L'établissement n'a actuellement aucune serveuse officielle d'engagée.");
      let m = `👩‍🍳 ━━━━━━━ 𝐄𝐐𝐔𝐈𝐏𝐄 𝐃𝐄𝐒 𝐒𝐄𝐑𝐕𝐄𝐔𝐒𝐄𝐒 ━━━━━━━ 👩‍🍳\n\n`;
      for (const id of data.serveuses) {
        const u = await usersData.get(id);
        m += `⭐ **${u ? u.name : "Employée modèle"}**\n`;
      }
      return message.reply(m);
    }

    // 6. TRAVAILLER
    if (subCommand === "travailler") {
      if (!data.serveuses.includes(senderID)) return message.reply("❌ Seules les serveuses acceptées peuvent prendre leur service ! Utilisez `cafe postuler`.");
      if (!data.ouvert) return message.reply("💤 Le café est fermé, impossible de prendre votre service !");

      // Gain d'argent pour la serveuse et le café
      const gainCaisse = 150;
      const gainServeuse = 100;

      data.caisse += gainCaisse;
      senderInfo.money += gainServeuse;
      data.xp += 10;
      data.propreness = Math.max(0, data.propreness - 4);

      // Progression quête
      data.quetesQuotidiennes.forEach(q => {
        if (q.id === 1) { // Servir/Travailler
          q.progression[senderID] = (q.progression[senderID] || 0) + 1;
        }
      });

      await usersData.set(senderID, senderInfo);
      ajouterJournal(data, "TRAVAIL", `${senderInfo.name} a effectué son service.`);
      verifierLevelUp();
      saveCafeData(data);

      return message.reply(`🛠️ 👩‍🍳 **𝐒𝐄𝐑𝐕𝐈𝐂𝐄 𝐀𝐂𝐂𝐎𝐌𝐏𝐋𝐈 !**\n\nVous avez nettoyé les tables et servi des boissons chaudes.\n💵 Salaire d'activité reçu : **+${gainServeuse}$**\n💰 Ajouté à la caisse du café : **+${gainCaisse}$**\n🧼 L'activité a sali le café (-4% Propreté).`);
    }

    // 7. SERVIR (Servir un client PNJ)
    if (subCommand === "servir") {
      if (!data.serveuses.includes(senderID)) return message.reply("❌ Seul le personnel de salle peut servir les clients !");
      if (data.pnjClients.length === 0) return message.reply("🤷‍♂️ Il n'y a aucun client PNJ en attente d'être servi pour le moment.");

      const client = data.pnjClients[0]; // Sert le premier de la file d'attente
      const boisson = data.menu.find(d => d.id === client.commandeId);

      // Vérification ingrédients
      for (const [ing, qte] of Object.entries(boisson.req)) {
        if ((data.stock[ing] || 0) < qte) {
          return message.reply(`⚠️ Stock insuffisant de **${ing}** pour servir la commande de ${client.nom} !`);
        }
      }

      // Consommation ingrédients
      for (const [ing, qte] of Object.entries(boisson.req)) {
        data.stock[ing] -= qte;
      }

      // Gains
      const gainTotal = boisson.price + 50; // Bonus pour service rapide
      data.caisse += gainTotal;
      senderInfo.money += 40; // Prime pour la serveuse
      data.reputation = Math.min(100, data.reputation + 2);

      data.pnjClients.shift(); // Retire le PNJ servi

      await usersData.set(senderID, senderInfo);
      ajouterJournal(data, "SERVICE_PNJ", `${senderInfo.name} a servi ${client.nom}.`);
      saveCafeData(data);

      return message.reply(`✨ 🙋‍♂️ **𝐂𝐋𝐈𝐄𝐍𝐓 𝐒𝐄𝐑𝐕𝐈 𝐀𝐕𝐄𝐂 𝐒𝐔𝐂𝐂𝐄̀𝐒 !**\n\nVous avez apporté un succulent **${boisson.name}** à **${client.nom}**.\n💰 **+${gainTotal}$** ajoutés à la caisse !\n💵 Vous recevez une prime de service de **+40$**.`);
    }

    // 8. SALAIRE
    if (subCommand === "salaire") {
      if (!data.serveuses.includes(senderID)) return message.reply("❌ Vous n'êtes pas sur les registres du personnel pour prétendre à un salaire !");
      const salaire = 300;

      if (data.caisse < salaire) {
        return message.reply("💸 Les caisses de l'établissement sont trop vides pour honorer votre fiche de paie !");
      }

      data.caisse -= salaire;
      senderInfo.money += salaire;

      await usersData.set(senderID, senderInfo);
      saveCafeData(data);

      return message.reply(`💵 **𝐅𝐈𝐂𝐇𝐄 𝐃𝐄 𝐏𝐀𝐈𝐄 !**\nVotre dévouement est récompensé. Vous retirez **${salaire}$** de la caisse commune !`);
    }

    // 9. POURBOIRE
    if (subCommand === "pourboire") {
      if (!data.serveuses.includes(senderID)) return message.reply("❌ Seules les serveuses collectent des pourboires !");
      const chance = Math.random();
      if (chance < 0.4) {
        return message.reply("💨 Les clients ont été radins sur ce coup. Pas de pourboire.");
      }
      const tips = Math.floor(Math.random() * 80) + 20;
      senderInfo.money += tips;
      await usersData.set(senderID, senderInfo);
      return message.reply(`👛 **𝐆𝐄́𝐍𝐄́𝐑𝐄𝐔𝐗 𝐂𝐋𝐈𝐄𝐍𝐓 !**\nVous obtenez un pourboire de **${tips}$** pour votre amabilité.`);
    }

    // 10. CAISSE
    if (subCommand === "caisse") {
      return message.reply(`💰 **𝐂𝐀𝐈𝐒𝐒𝐄 𝐂𝐎𝐌𝐌𝐔𝐍𝐄 :**\n\nL'établissement possède actuellement un capital de **${data.caisse.toLocaleString()}$**.`);
    }

    // 11. INVENTAIRE
    if (subCommand === "inventaire") {
      return message.reply(`💼 **𝐈𝐍𝐕𝐄𝐍𝐓𝐀𝐈𝐑𝐄 :**\n\n👤 **Joueur :** ${senderInfo.name}\n💵 **Portefeuille :** ${senderInfo.money}$\n🎭 **Rôle :** ${data.serveuses.includes(senderID) ? "Serveuse Étoilée" : "Client Fidèle"}`);
    }

    // 12. STOCK
    if (subCommand === "stock") {
      let st = `📦 **𝐒𝐓𝐎𝐂𝐊 𝐃'𝐈𝐍𝐆𝐑𝐄́𝐃𝐈𝐄𝐍𝐓𝐒 :**\n━━━━━━━━━━━━━━━━━━━━\n`;
      for (const [ing, qte] of Object.entries(data.stock)) {
        st += `◽ **${ing.toUpperCase()} :** ${qte} unité(s) *(Achat : ${data.prixIngredients[ing]}$/u)*\n`;
      }
      st += `━━━━━━━━━━━━━━━━━━━━\n💡 *Achetez du stock avec \`cafe acheter [ingrédient] [quantité]\`*`;
      return message.reply(st);
    }

    // 13. ACHETER (Achat d'ingrédients pour le café)
    if (subCommand === "acheter") {
      const ing = args[1]?.toLowerCase();
      const qte = parseInt(args[2]);

      if (!ing || isNaN(qte) || qte <= 0) {
        return message.reply("❌ Syntaxe incorrecte. Exemple: `cafe acheter cafe 10` (achète 10 unités de café).");
      }

      if (!(ing in data.stock)) {
        return message.reply(`❌ Ingrédient inconnu. Liste disponible : ${Object.keys(data.stock).join(", ")}`);
      }

      const coutTotal = data.prixIngredients[ing] * qte;
      if (data.caisse < coutTotal) {
        return message.reply(`💸 Le café ne dispose pas de fonds suffisants en caisse pour cet achat (${coutTotal}$ requis).`);
      }

      data.caisse -= coutTotal;
      data.stock[ing] += qte;
      saveCafeData(data);

      return message.reply(`📦 **𝐑𝐄́𝐀𝐏𝐏𝐑𝐎𝐕𝐈𝐒𝐈𝐎𝐍𝐍𝐄𝐌𝐄𝐍𝐓 !**\nVous avez acheté **${qte}x ${ing}** pour un coût total de **${coutTotal}$** payé par la caisse.`);
    }

    // 14. CUISINE
    if (subCommand === "cuisine") {
      return message.reply(`🍳 **𝐋𝐀 𝐂𝐔𝐈𝐒𝐈𝐍𝐄 :**\n\n🧁 Propreté des fourneaux : **${data.propreness}%**\n🔥 Les cafetières tournent à plein régime.\n🧼 N'oubliez pas d'utiliser \`cafe nettoyer\` pour éviter les contrôles d'hygiène ratés !`);
    }

    // 15. NETTOYER
    if (subCommand === "nettoyer") {
      if (!data.serveuses.includes(senderID)) return message.reply("❌ Le ménage est réservé à l'équipe de service !");
      if (data.propreness >= 100) return message.reply("✨ Les tables brillent déjà de mille feux, inutile de frotter !");

      data.propreness = Math.min(100, data.propreness + 30);
      data.xp += 5;

      // Progression quête quotidienne
      data.quetesQuotidiennes.forEach(q => {
        if (q.id === 2) { // Nettoyer
          q.progression[senderID] = (q.progression[senderID] || 0) + 1;
        }
      });

      saveCafeData(data);
      return message.reply(`🧹 **𝐌𝐄́𝐍𝐀𝐆𝐄 𝐄𝐅𝐅𝐄𝐂𝐓𝐔𝐄́ !**\nVous avez passé la serpillière et astiqué le zinc. Propreté remontée à **${data.propreness}%** !`);
    }

    // 16. REPUTATION
    if (subCommand === "reputation") {
      let etoiles = "⭐".repeat(Math.round(data.reputation / 20)) || "⭐";
      return message.reply(`🏆 **𝐑𝐄́𝐏𝐔𝐓𝐀𝐓𝐈𝐎𝐍 𝐃𝐔 𝐂𝐀𝐅𝐄́ :**\n\n⭐ Prestige : [${etoiles}] (${data.reputation}/100)\n📈 Un score élevé attire plus de clients PNJ et augmente la valeur des pourboires !`);
    }

    // 17. CLIENTS
    if (subCommand === "clients") {
      if (data.pnjClients.length === 0) return message.reply("🌸 Le café est calme, aucun client PNJ ne patiente pour l'instant.");
      let m = `🙋‍♂️ **𝐂𝐋𝐈𝐄𝐍𝐓𝐒 𝐏𝐍𝐉 𝐄𝐍 𝐒𝐀𝐋𝐋𝐄 :**\n━━━━━━━━━━━━━━━━━━━━\n\n`;
      data.pnjClients.forEach((p, idx) => {
        const d = data.menu.find(b => b.id === p.commandeId);
        m += `[${idx + 1}] **${p.nom}**\n🛒 Commande : **${d?.name}**\n⏳ Patience restante : ${p.tempsRestant} tour(s)\n\n`;
      });
      m += `👉 *Servez-les en utilisant la commande : \`cafe servir\`*`;
      return message.reply(m);
    }

    // 18. RESERVER
    if (subCommand === "reserver") {
      const tableId = parseInt(args[1]);
      if (isNaN(tableId) || tableId < 1 || tableId > data.tables.length) {
        return message.reply("❌ Numéro de table inexistant. Utilisez `cafe table` pour voir les tables.");
      }

      const table = data.tables.find(t => t.id === tableId);
      if (table.statut !== "Libre") return message.reply(`🔒 La table numéro ${tableId} est déjà réservée.`);

      table.statut = "Réservée";
      table.occupePar = senderInfo.name;
      saveCafeData(data);

      return message.reply(`📌 **𝐑𝐄́𝐒𝐄𝐑𝐕𝐀𝐓𝐈𝐎𝐍 𝐂𝐎𝐍𝐅𝐈𝐑𝐌𝐄́𝐄 !**\nLa table numéro **${tableId}** est désormais bloquée pour **${senderInfo.name}**.`);
    }

    // 19. TABLE
    if (subCommand === "table") {
      let tb = `🪑 **𝐄́𝐓𝐀𝐓 𝐃𝐄𝐒 𝐓𝐀𝐁𝐋𝐄𝐒 :**\n━━━━━━━━━━━━━━━━━━━━\n\n`;
      data.tables.forEach(t => {
        tb += `◽ **Table ${t.id} :** ${t.statut === "Libre" ? "🟢 Libre" : `🔴 Occupée par ${t.occupePar}`}\n`;
      });
      return message.reply(tb);
    }

    // 20. JOURNAL
    if (subCommand === "journal") {
      if (data.historiqueJournal.length === 0) return message.reply("📖 Aucun événement majeur n'a été consigné aujourd'hui.");
      let j = `📖 **𝐉𝐎𝐔𝐑𝐍𝐀𝐋 𝐃𝐄𝐒 𝐀𝐂𝐓𝐈𝐕𝐈𝐓𝐄́𝐒 :**\n━━━━━━━━━━━━━━━━━━━━\n\n`;
      data.historiqueJournal.slice(0, 10).forEach(l => {
        j += `⏱️ [${l.date}] [${l.type}] - ${l.desc}\n`;
      });
      return message.reply(j);
    }

    // 21. QUETES
    if (subCommand === "quetes") {
      let qm = `🎯 **𝐐𝐔𝐄̂𝐓𝐄𝐒 𝐐𝐔𝐎𝐓𝐈𝐃𝐈𝐄𝐍𝐍𝐄𝐒 :**\n━━━━━━━━━━━━━━━━━━━━\n\n`;
      data.quetesQuotidiennes.forEach(q => {
        const prog = q.progression[senderID] || 0;
        const complete = prog >= q.requis;
        qm += `◽ **${q.desc}**\n   Progression : **${prog}/${q.requis}** ${complete ? "✅ (Terminée)" : "⏳"}\n   Récompense : **+${q.recompense}$**\n\n`;
      });
      qm += `💡 *Si une quête est terminée, elle s'ajoute automatiquement à vos fonds.*`;
      return message.reply(qm);
    }

    // 22. DEFI
    if (subCommand === "defi") {
      return message.reply(`🏆 **𝐃𝐄́𝐅𝐈 𝐃𝐔 𝐉𝐎𝐔𝐑 :**\n\nServir le plus grand nombre de clients PNJ aujourd'hui !\nLa serveuse du jour recevra une prime de **500$** en fin de soirée.`);
    }

    // 23. CLASSEMENT
    if (subCommand === "classement") {
      let cl = `🏆 **𝐂𝐋𝐀𝐒𝐒𝐄𝐌𝐄𝐍𝐓 𝐃𝐄𝐒 𝐌𝐄𝐈𝐋𝐋𝐄𝐔𝐑𝐄𝐒 𝐒𝐄𝐑𝐕𝐄𝐔𝐒𝐄𝐒 :**\n━━━━━━━━━━━━━━━━━━━━\n\n`;
      if (data.serveuses.length === 0) return message.reply("Le classement est vide.");
      // Simulé par rapport à l'argent en portefeuille des serveuses pour démo
      const leaders = [];
      for (const id of data.serveuses) {
        const u = await usersData.get(id);
        if (u) leaders.push(u);
      }
      leaders.sort((a, b) => safeNumber(b.money) - safeNumber(a.money));
      leaders.forEach((l, idx) => {
        cl += `${idx + 1}. **${l.name}** : ${safeNumber(l.money).toLocaleString()}$\n`;
      });
      return message.reply(cl);
    }

    // 24. OUVRIR
    if (subCommand === "ouvrir") {
      if (!global.config?.adminBot?.includes(senderID) && !data.serveuses.includes(senderID)) {
        return message.reply("❌ Vous ne faites pas partie de l'équipe de direction pour ouvrir le café.");
      }
      data.ouvert = true;
      saveCafeData(data);
      return message.reply("☀️ **𝐋'𝐄́𝐓𝐀𝐁𝐋𝐈𝐒𝐒𝐄𝐌𝐄𝐍𝐓 𝐄𝐒𝐓 𝐎𝐔𝐕𝐄𝐑𝐓 !**\nLes premiers clients arrivent. À vos postes ! ☕🍰");
    }

    // 25. FERMER
    if (subCommand === "fermer") {
      if (!global.config?.adminBot?.includes(senderID) && !data.serveuses.includes(senderID)) {
        return message.reply("❌ Autorisation refusée.");
      }
      data.ouvert = false;
      data.pnjClients = [];
      saveCafeData(data);
      return message.reply("🌙 **𝐋'𝐄́𝐓𝐀𝐁𝐋𝐈𝐒𝐒𝐄𝐌𝐄𝐍𝐓 𝐄𝐒𝐓 𝐅𝐄𝐑𝐌𝐄́ !**\nLes tables sont nettoyées, rendez-vous demain à l'aube.");
    }

    // --- SECTION ADMINISTRATION : STAFF ---
    if (subCommand === "staff") {
      const adminIDs = global.config?.adminBot || global.configMain?.adminBot || [];
      const isAdmin = adminIDs.map(id => String(id)).includes(String(senderID));
      if (!isAdmin) return message.reply("❌ Vous n'êtes pas administrateur général du bot pour gérer ce module.");

      const action = args[1]?.toLowerCase();

      if (action === "candidatures" || action === "list") {
        if (data.candidatures.length === 0) return message.reply("📩 Aucune candidature d'employée n'est en attente.");
        let candMsg = `📩 **𝐂𝐀𝐍𝐃𝐈𝐃𝐀𝐓𝐔𝐑𝐄𝐒 𝐄𝐍 𝐀𝐓𝐓𝐄𝐍𝐓𝐄 :**\n━━━━━━━━━━━━━━━━━━━━\n\n`;
        data.candidatures.forEach((c, idx) => {
          candMsg += `[${idx}] **${c.name}** (ID: ${c.userID})\n`;
        });
        candMsg += `\n💡 *Acceptez via : \`cafe staff accepter [index]\`*`;
        return message.reply(candMsg);
      }

      if (action === "accepter" || action === "accept") {
        const idx = parseInt(args[2]);
        if (isNaN(idx) || idx < 0 || idx >= data.candidatures.length) return message.reply("❌ Index invalide.");

        const candidate = data.candidatures[idx];
        data.serveuses.push(candidate.userID);
        data.candidatures.splice(idx, 1);
        saveCafeData(data);

        api.sendMessage(`🎉 **𝐄𝐌𝐁𝐀𝐔𝐂𝐇𝐄 !**\nLa direction accepte la candidature de **${candidate.name}** ! Bienvenue dans la brigade officielle ! 👩‍🍳`, threadID);
        return message.reply(`✅ Candidature validée et enregistrée.`);
      }

      if (action === "refuser" || action === "reject") {
        const idx = parseInt(args[2]);
        if (isNaN(idx) || idx < 0 || idx >= data.candidatures.length) return message.reply("❌ Index invalide.");

        const candidate = data.candidatures[idx];
        data.candidatures.splice(idx, 1);
        saveCafeData(data);
        return message.reply(`❌ Candidature de **${candidate.name}** rejetée.`);
      }

      if (action === "add" || action === "ajouter") {
        const price = parseInt(args[2]);
        const name = args.slice(3).join(" ");
        if (isNaN(price) || !name) return message.reply("❌ Format : `cafe staff add [prix] [nom]`");

        const nextId = data.menu.length > 0 ? Math.max(...data.menu.map(d => d.id)) + 1 : 1;
        data.menu.push({ id: nextId, name, price, req: { cafe: 1 }, level: 1 });
        saveCafeData(data);
        return message.reply(`✅ Boisson **${name}** intégrée à la carte au prix de **${price}$**.`);
      }

      return message.reply(
        `🛠️ **𝐆𝐄𝐒𝐓𝐈𝐎𝐍 𝐇𝐈𝐄́𝐑𝐀𝐑𝐐𝐔𝐈𝐐𝐔𝐄 :**\n━━━━━━━━━━━━━━━━━━━━\n` +
        `• \`cafe staff candidatures\` : Examiner les recrutements\n` +
        `• \`cafe staff accepter [index]\` : Recruter la candidate\n` +
        `• \`cafe staff refuser [index]\` : Rejeter le dossier\n` +
        `• \`cafe staff add [prix] [nom]\` : Ajouter une recette`
      );
    }

    return message.reply("❓ Commande RP inconnue. Écrivez `cafe aide` pour explorer les possibilités de l'établissement.");
  }
};
