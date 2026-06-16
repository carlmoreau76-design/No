const fs = require("fs");
const path = require("path");
const { createCanvas } = require("canvas");

const cacheDir = path.join(__dirname, "cache");
if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

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
    ctx.fillText(`${i + 1}. ${g.name}`, 60, y);
    ctx.fillText(`ID: ${g.id}`, 60, y + 20);
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

// 📦 CONFIG
module.exports.config = {
  name: "pending",
  version: "1.0",
  role: 2,
  author: "Shade",
  category: "owner"
};

// 📋 AFFICHER LISTE
module.exports.run = async function ({ api, event }) {
  const { threadID, messageID, senderID } = event;

  const groups = global.pendingThreads || [];

  if (!groups.length) {
    return api.sendMessage("📋 Aucun groupe en attente.", threadID, messageID);
  }

  const img = createPendingImage(groups);

  const msg = `📋 » PENDING SYSTEM «
━━━━━━━━━━━━
g1 g2 → approve
c1 c2 → cancel
━━━━━━━━━━━━`;

  api.sendMessage(
    { body: msg, attachment: fs.createReadStream(img) },
    threadID,
    (err, info) => {
      if (err) return;
      global.pendingReply = {
        messageID: info.messageID,
        author: senderID,
        groups
      };
    },
    messageID
  );
};

// 🔄 GESTION DES RÉPONSES (APPROBATION / REFUS)
module.exports.handleReply = async function ({ api, event }) {
  const { body, threadID, senderID } = event;

  if (!global.pendingReply) return;

  // 🔒 Sécurité: seul celui qui a lancé la commande peut répondre
  if (senderID !== global.pendingReply.author) return;

  const match = body.match(/([gc])(\d+)/i);
  if (!match) return;

  const action = match[1].toLowerCase();
  const index = parseInt(match[2]) - 1;

  const group = global.pendingReply.groups[index];
  if (!group) {
    return api.sendMessage("❌ Groupe introuvable.", threadID);
  }

  // ❌ Retirer de la liste d'attente globale
  global.pendingThreads = (global.pendingThreads || []).filter(
    g => g.id !== group.id
  );

  // ✔ APPROUVER LE GROUPE
  if (action === "g") {
    try {
      const img = createWelcomeImage(group.name);

      await api.sendMessage(
        {
          body: `👋 𝐁𝐈𝐄𝐍𝐕𝐄𝐍𝐔𝐄 𝐃𝐀𝐍𝐒 𝐋𝐄 𝐆𝐑𝐎𝐔𝐏𝐄 !\n\n🤖 Bot activé avec succès\n📌 Prefix actif\n⚙️ Système pending validé`,
          attachment: fs.createReadStream(img)
        },
        group.id
      );
    } catch (e) {
      console.error("Erreur lors de l'envoi du message de bienvenue:", e);
    }

    return api.sendMessage(
      `✅ APPROVED\n📌 ${group.name}\n🆔 ${group.id}`,
      threadID
    );
  }

  // ❌ REFUSER / QUITTER LE GROUPE
  if (action === "c") {
    try {
      await api.removeUserFromGroup(api.getCurrentUserID(), group.id);
    } catch (e) {
      console.error("Impossible de quitter le groupe:", e);
    }

    return api.sendMessage(
      `❌ 𝐑𝐄𝐅𝐔𝐒𝐄𝐃\n📌 ${group.name}\n🆔 ${group.id}`,
      threadID
    );
  }
};
