const { createCanvas } = require("canvas");
const fs = require("fs");
const path = require("path");

const OWNER_ID = "61573867120837";

module.exports = {
  config: {
    name: "premium",
    version: "3.0",
    author: "Shade",
    countDown: 5,
    role: 2,
    description: {
      en: "🌸 Manage premium users (owner only system)"
    },
    category: "owner",
    guide: {
      en: "{pn} add <userID | @mention | reply>\n{pn} remove <userID | @mention | reply>\n{pn} check <userID>\n{pn} list [page]"
    }
  },

  onStart: async function ({ message, args, event, usersData }) {

    if (!args[0]) return message.reply("🌸 Usage: add / remove / check / list");

    const type = args[0].toLowerCase();
    let targetID;

    // 🌸 GET TARGET USER
    if (Object.keys(event.mentions).length > 0)
      targetID = Object.keys(event.mentions)[0];
    else if (event.messageReply)
      targetID = event.messageReply.senderID;
    else
      targetID = args[1];

    // 💖 AUTO PREMIUM FOR OWNER
    let ownerData = await usersData.get(OWNER_ID) || {};
    ownerData.data = ownerData.data || {};
    ownerData.data.premium = true;
    await usersData.set(OWNER_ID, ownerData);

    // 🔒 ONLY OWNER CAN ADD/REMOVE
    if ((type === "add" || type === "remove") && event.senderID !== OWNER_ID) {
      return message.reply("🌸⛔ Seul le propriétaire peut gérer les premium !");
    }

    // ⚠️ LIST
    if (type === "list") {
      const page = parseInt(args[1]) || 1;
      const perPage = 10;

      const allUsers = await usersData.getAll();
      const premiumUsers = allUsers.filter(u => u?.data?.premium === true);

      if (premiumUsers.length === 0)
        return message.reply("🌸 Aucun utilisateur premium.");

      const totalPages = Math.ceil(premiumUsers.length / perPage);
      if (page > totalPages)
        return message.reply(`🌸 Page invalide. Max: ${totalPages}`);

      const start = (page - 1) * perPage;
      const list = premiumUsers.slice(start, start + perPage);

      const width = 1000;
      const height = 160 + list.length * 70;

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
      ctx.fillText(`🌸 Premium Users (${page}/${totalPages}) 🌸`, width / 2, 70);

      // 📌 USERS
      let y = 130;

      list.forEach((u, i) => {
        ctx.font = "25px Arial";
        ctx.fillStyle = "#fff";
        ctx.textAlign = "left";

        const name = u.name || "Unknown";
        ctx.fillText(`💖 ${i + 1}. ${name}`, 80, y);

        ctx.font = "18px Arial";
        ctx.fillText(`ID: ${u.userID}`, 80, y + 25);

        y += 70;
      });

      const file = path.join(__dirname, `premium_${page}.png`);
      fs.writeFileSync(file, canvas.toBuffer("image/png"));

      return message.reply({
        body: "🌸 Premium list kawaii 💖",
        attachment: fs.createReadStream(file)
      });
    }

    // 🌸 CHECK
    if (type === "check") {
      if (!targetID) return message.reply("🌸 Donne un utilisateur !");

      const data = await usersData.get(targetID) || {};
      const isPremium = data?.data?.premium;

      return message.reply(
        isPremium
          ? "💖 Cet utilisateur est PREMIUM 🌸"
          : "🌸 Cet utilisateur n'est pas premium"
      );
    }

    // 💖 ADD
    if (type === "add") {
      if (!targetID) return message.reply("🌸 Utilisateur manquant");

      let data = await usersData.get(targetID) || {};
      data.data = data.data || {};
      data.data.premium = true;

      await usersData.set(targetID, data);

      return message.reply("💖 Utilisateur ajouté en PREMIUM 🌸");
    }

    // ❌ REMOVE
    if (type === "remove") {
      if (!targetID) return message.reply("🌸 Utilisateur manquant");

      let data = await usersData.get(targetID) || {};
      data.data = data.data || {};
      data.data.premium = false;

      await usersData.set(targetID, data);

      return message.reply("💔 Utilisateur retiré du PREMIUM 🌸");
    }

    return message.reply("🌸 Commande inconnue");
  }
};
