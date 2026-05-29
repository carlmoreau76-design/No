const fs = require("fs");
const path = require("path");
const { createCanvas } = require("canvas");

const OWNER_ID = "61573867120837";
const DB_FILE = path.join(__dirname, "premium_codes.json");

// 💎 SAFE LOAD
function loadCodes() {
  if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, "{}");
  return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
}

// 💎 SAFE SAVE
function saveCodes(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

module.exports = {
  config: {
    name: "premium",
    version: "5.1",
    author: "Shade",
    role: 2,
    category: "owner"
  },

  onStart: async function ({ message, args, event, usersData }) {

    if (!args[0]) {
      return message.reply("🌸 add / remove / check / list / redeem");
    }

    const type = args[0].toLowerCase();

    let targetID =
      event.mentions && Object.keys(event.mentions || {}).length
        ? Object.keys(event.mentions)[0]
        : event.messageReply
        ? event.messageReply.senderID
        : args[1];

    if (!targetID && type !== "list") {
      return message.reply("🌸 utilisateur introuvable");
    }

    // 💎 SAFE USER DATA
    let data = await usersData.get(targetID);
    if (!data) data = { data: {} };
    if (!data.data) data.data = {};

    // 👑 OWNER AUTO PREMIUM
    if (event.senderID === OWNER_ID) {
      let me = await usersData.get(OWNER_ID);
      if (!me) me = { data: {} };
      if (!me.data) me.data = {};
      me.data.premium = true;
      await usersData.set(OWNER_ID, me);
    }

    // 🔒 OWNER ONLY
    if ((type === "add" || type === "remove") && event.senderID !== OWNER_ID) {
      return message.reply("🌸⛔ Owner only !");
    }

    // 💎 ADD
    if (type === "add") {
      const days = parseInt(args[2]) || 7;

      data.data.premium = true;
      data.data.premiumUntil = Date.now() + days * 24 * 60 * 60 * 1000;

      await usersData.set(targetID, data);

      return message.reply(`💖 ${targetID} est PREMIUM pour ${days} jours 🌸`);
    }

    // ❌ REMOVE
    if (type === "remove") {
      data.data.premium = false;
      data.data.premiumUntil = null;

      await usersData.set(targetID, data);

      return message.reply("💔 Premium retiré 🌸");
    }

    // 🌸 CHECK
    if (type === "check") {
      const now = Date.now();

      const isPremium =
        data?.data?.premium &&
        (!data?.data?.premiumUntil || data.data.premiumUntil > now);

      return message.reply(
        isPremium
          ? "💖 Cet utilisateur est PREMIUM 🌸"
          : "🌸 Pas premium"
      );
    }

    // 📋 LIST (SAFE VERSION SANS CRASH)
    if (type === "list") {

      let all = [];

      try {
        all = await usersData.getAll?.() || [];
      } catch {
        return message.reply("💔 impossible de charger la liste");
      }

      const list = all.filter(u =>
        u?.data?.premium &&
        (!u?.data?.premiumUntil || u.data.premiumUntil > Date.now())
      );

      if (!list.length) {
        return message.reply("🌸 Aucun premium");
      }

      // 💥 SAFE CANVAS (fallback sécurisé)
      const width = 900;
      const height = 120 + list.length * 60;

      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext("2d");

      ctx.fillStyle = "#1a1a2e";
      ctx.fillRect(0, 0, width, height);

      ctx.font = "bold 40px Arial";
      ctx.fillStyle = "#fff";
      ctx.textAlign = "center";
      ctx.fillText("💎 PREMIUM USERS 🌸", width / 2, 60);

      let y = 120;

      list.forEach((u, i) => {

        const name = u.name || "Unknown";

        ctx.font = "26px Arial";
        ctx.fillStyle = "#fff";
        ctx.textAlign = "left";

        ctx.fillText(`💎 ${i + 1}. ${name}`, 50, y);

        y += 60;
      });

      const file = path.join(__dirname, "premium_list.png");
      fs.writeFileSync(file, canvas.toBuffer("image/png"));

      return message.reply({
        body: "💖 Premium list 🌸",
        attachment: fs.createReadStream(file)
      });
    }

    // 🎟️ REDEEM
    if (type === "redeem") {

      const code = args[1];
      if (!code) return message.reply("🌸 Code manquant");

      let codes = loadCodes();

      if (!codes[code]) {
        return message.reply("💔 Code invalide");
      }

      const days = codes[code];

      data.data.premium = true;
      data.data.premiumUntil = Date.now() + days * 86400000;

      await usersData.set(event.senderID, data);

      delete codes[code];
      saveCodes(codes);

      return message.reply(`💖 +${days} jours PREMIUM 🌸`);
    }

    return message.reply("🌸 Commande inconnue");
  }
};
