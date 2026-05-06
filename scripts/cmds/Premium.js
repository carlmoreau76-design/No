const fs = require("fs");
const path = require("path");
const { createCanvas } = require("canvas");

const OWNER_ID = "61573867120837";
const DB_FILE = path.join(__dirname, "premium_codes.json");

// 💎 LOAD / SAVE CODES
function loadCodes() {
  if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, "{}");
  return JSON.parse(fs.readFileSync(DB_FILE));
}

function saveCodes(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

module.exports = {
  config: {
    name: "premium",
    version: "5.0",
    author: "Shade",
    role: 2,
    category: "owner",
    description: { en: "🌸 Premium system with kawaii canvas list" }
  },

  onStart: async function ({ message, args, event, usersData }) {

    if (!args[0])
      return message.reply("🌸 add / remove / check / list / redeem");

    const type = args[0].toLowerCase();
    let targetID;

    if (event.mentions && Object.keys(event.mentions).length)
      targetID = Object.keys(event.mentions)[0];
    else if (event.messageReply)
      targetID = event.messageReply.senderID;
    else
      targetID = args[1];

    let data = await usersData.get(targetID) || {};
    data.data = data.data || {};

    // 💖 AUTO OWNER PREMIUM
    if (event.senderID === OWNER_ID) {
      let me = await usersData.get(OWNER_ID) || {};
      me.data = me.data || {};
      me.data.premium = true;
      await usersData.set(OWNER_ID, me);
    }

    // 🔒 OWNER ONLY
    if ((type === "add" || type === "remove") && event.senderID !== OWNER_ID)
      return message.reply("🌸⛔ Owner only !");

    // 💎 ADD PREMIUM
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

    // 📋 LIST (CANVAS 🌸)
    if (type === "list") {
      const all = await usersData.getAll();

      const list = all.filter(u =>
        u?.data?.premium &&
        (!u?.data?.premiumUntil || u.data.premiumUntil > Date.now())
      );

      if (!list.length)
        return message.reply("🌸 Aucun premium");

      const width = 1000;
      const height = 140 + list.length * 70;

      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext("2d");

      // 🌈 BACKGROUND
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, "#ffb6ff");
      grad.addColorStop(1, "#7b2cff");

      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // 💖 TITLE
      ctx.font = "bold 40px Arial";
      ctx.fillStyle = "#fff";
      ctx.textAlign = "center";
      ctx.fillText("🌸 PREMIUM USERS 🌸", width / 2, 70);

      // 📌 USERS
      let y = 130;

      list.forEach((u, i) => {
        ctx.font = "28px Arial";
        ctx.fillStyle = "#fff";
        ctx.textAlign = "left";

        const name = u.name || "Unknown";

        ctx.fillText(`💎 ${i + 1}. ${name}`, 80, y);

        ctx.font = "18px Arial";
        ctx.fillText(`ID: ${u.userID}`, 80, y + 25);

        y += 70;
      });

      const file = path.join(__dirname, `premium_list.png`);
      fs.writeFileSync(file, canvas.toBuffer("image/png"));

      return message.reply({
        body: "💖 Premium list kawaii 🌸",
        attachment: fs.createReadStream(file)
      });
    }

    // 🎟️ REDEEM
    if (type === "redeem") {
      const code = args[1];
      if (!code) return message.reply("🌸 Code manquant");

      let codes = loadCodes();

      if (!codes[code])
        return message.reply("💔 Code invalide");

      const days = codes[code];

      data.data.premium = true;
      data.data.premiumUntil = Date.now() + days * 24 * 60 * 60 * 1000;

      await usersData.set(event.senderID, data);

      delete codes[code];
      saveCodes(codes);

      return message.reply(`💖 +${days} jours PREMIUM 🌸`);
    }

    return message.reply("🌸 Commande inconnue");
  }
};
