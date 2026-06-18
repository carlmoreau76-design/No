const fs = require("fs");
const path = require("path");
const { createCanvas } = require("canvas");

const cacheDir = path.join(__dirname, "cache");
if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

// 🎨 IMAGE LISTE D'ATTENTE
function createPendingImage(list) {
  const canvas = createCanvas(900, 500);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#0d0d0d";
  ctx.fillRect(0, 0, 900, 500);

  ctx.strokeStyle = "#00ffcc";
  ctx.lineWidth = 4;
  ctx.strokeRect(20, 20, 860, 460);

  ctx.fillStyle = "#00ffcc";
  ctx.font = "bold 40px Arial";
  ctx.fillText("📋 PENDING LIST", 260, 80);

  ctx.fillStyle = "#fff";
  ctx.font = "20px Arial";
  ctx.fillText(`Total: ${list.length}`, 50, 130);

  let y = 180;
  list.slice(0, 6).forEach((g, i) => {
    ctx.fillText(`${i + 1}. ${g.threadName || g.name || "Groupe sans nom"}`, 60, y);
    ctx.fillText(`ID: ${g.threadID || g.id}`, 60, y + 20);
    y += 60;
  });

  const file = path.join(cacheDir, `pending_${Date.now()}.png`);
  fs.writeFileSync(file, canvas.toBuffer());
  return file;
}

// 🎨 IMAGE DE BIENVENUE
function createWelcomeImage(groupName) {
  const canvas = createCanvas(900, 400);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#0d0d0d";
  ctx.fillRect(0, 0, 900, 400);

  ctx.strokeStyle = "#00ffcc";
  ctx.lineWidth = 4;
  ctx.strokeRect(20, 20, 860, 360);

  ctx.fillStyle = "#00ffcc";
  ctx.font = "bold 40px Arial";
  ctx.fillText("🤖 BOT CONNECTED", 240, 120);

  ctx.fillStyle = "#ffffff";
  ctx.font = "25px Arial";
  ctx.fillText(`Welcome: ${groupName}`, 60, 220);
  ctx.fillText("Type .help to see commands", 60, 270);

  const file = path.join(cacheDir, `welcome_${Date.now()}.png`);
  fs.writeFileSync(file, canvas.toBuffer());
  return file;
}

// 📦 EXPORTATION STANDARD GOATBOT
module.exports = {
  config: {
    name: "pending",
    version: "1.1.0",
    author: "Shade",
    countDown: 5,
    role: 2, // Réservé au Owner/Admins du bot
    shortDescription: { en: "Gère les groupes en attente d'approbation" },
    category: "admin",
    guide: { en: "pending" }
  },

  // 📋 LANCEMENT DE LA COMMANDE
  onStart: async function ({ api, event }) {
    const { threadID, messageID, senderID } = event;

    // Récupération des groupes en attente via l'instance globale du bot
    const groups = global.client?.pendingThreads || global.pendingThreads || [];

    if (!groups.length) {
      return api.sendMessage("📋 Aucun groupe en attente d'approbation.", threadID, messageID);
    }

    const img = createPendingImage(groups);

    const msg = `📋 » PENDING SYSTEM «\n━━━━━━━━━━━━\n👉 Répondez à ce message avec :\n• g[numéro] → Pour approuver (ex: g1)\n• c[numéro] → Pour refuser (ex: c1)\n━━━━━━━━━━━━`;

    return api.sendMessage(
      { body: msg, attachment: fs.createReadStream(img) },
      threadID,
      (err, info) => {
        if (err) return;
        
        // Enregistrement de la session de réponse (Format natif GoatBot)
        global.GoatBot?.onReply?.set(info.messageID, {
          commandName: "pending",
          author: senderID,
          groups: groups
        });
        
        try { fs.unlinkSync(img); } catch(e) {}
      },
      messageID
    );
  },

  // 🔄 GESTION DES RÉPONSES (onReply remplace handleReply)
  onReply: async function ({ api, event, Reply }) {
    const { body, threadID, senderID, messageID } = event;

    // Sécurité : seul l'auteur de la commande originale peut valider
    if (senderID !== Reply.author) return;

    const match = body.match(/([gc])(\d+)/i);
    if (!match) return;

    const action = match[1].toLowerCase();
    const index = parseInt(match[2]) - 1;

    const group = Reply.groups[index];
    if (!group) {
      return api.sendMessage("❌ Numéro de groupe introuvable dans la liste.", threadID, messageID);
    }

    const targetID = group.threadID || group.id;
    const targetName = group.threadName || group.name || "Sans nom";

    // Nettoyage des listes d'attente globales
    if (global.client?.pendingThreads) {
      global.client.pendingThreads = global.client.pendingThreads.filter(g => (g.threadID || g.id) !== targetID);
    }
    if (global.pendingThreads) {
      global.pendingThreads = global.pendingThreads.filter(g => (g.threadID || g.id) !== targetID);
    }

    // ✔ CAS 1 : APPROUVER LE GROUPE (Action: g)
    if (action === "g") {
      try {
        const imgWelcome = createWelcomeImage(targetName);

        await api.sendMessage(
          {
            body: `👋 𝐁𝐈𝐄𝐍𝐕𝐄𝐍𝐔𝐄 𝐃𝐀𝐍𝐒 𝐋𝐄 𝐆𝐑𝐎𝐔𝐏𝐄 !\n\n🤖 Bot activé avec succès par l'administrateur.\n📌 Utilisez le préfixe actif pour voir mes commandes.`,
            attachment: fs.createReadStream(imgWelcome)
          },
          targetID
        );
        
        try { fs.unlinkSync(imgWelcome); } catch(e) {}
      } catch (e) {
        console.error("Erreur envoi bienvenue:", e);
      }

      return api.sendMessage(`✅ **GROUPE APPROUVÉ**\n📌 Nom: ${targetName}\n🆔 ID: ${targetID}`, threadID, messageID);
    }

    // ❌ CAS 2 : REFUSER ET QUITTE LE GROUPE (Action: c)
    if (action === "c") {
      try {
        await api.removeUserFromGroup(api.getCurrentUserID(), targetID);
      } catch (e) {
        console.error("Erreur pour quitter le groupe:", e);
      }

      return api.sendMessage(`❌ **GROUPE REFUSÉ**\n📌 Nom: ${targetName}\n🆔 ID: ${targetID}`, threadID, messageID);
    }
  }
};
