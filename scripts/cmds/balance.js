const { createCanvas, loadImage } = require("canvas");
const fs = require("fs");
const path = require("path");
const axios = require("axios");

// 💖 Format argent
const formatMoney = (amount) => {
  if (isNaN(amount)) return "0$";
  amount = Number(amount);
  const scales = [
    { value: 1e15, suffix: 'Q' },
    { value: 1e12, suffix: 'T' },
    { value: 1e9, suffix: 'B' },
    { value: 1e6, suffix: 'M' },
    { value: 1e3, suffix: 'K' }
  ];
  const scale = scales.find(s => amount >= s.value);
  if (scale) return `${(amount / scale.value).toFixed(1)}${scale.suffix}$`;
  return `${amount.toLocaleString()}$`;
};

// 🌸 Avatar safe
const fetchAvatar = async (userID) => {
  try {
    const url = `https://graph.facebook.com/${userID}/picture?width=512&height=512`;
    const res = await axios.get(url, { responseType: "arraybuffer" });
    return await loadImage(Buffer.from(res.data));
  } catch {
    const c = createCanvas(100, 100);
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#ffb6ff";
    ctx.fillRect(0, 0, 100, 100);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 40px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("♡", 50, 50);
    return c;
  }
};

module.exports = {
  config: {
    name: "balance",
    aliases: ["bal", "$", "cash"],
    version: "🌸 6.0 ANGEL",
    author: "Shade x Angel Style",
    countDown: 3,
    role: 0,
    description: "💖 Carte de solde style Angel kawaii + transfert",
    category: "economy",
  },

  onStart: async function ({ message, event, args, usersData }) {
    const { senderID, mentions, messageReply } = event;

    // 💸 TRANSFERT
    if (args[0]?.toLowerCase() === "t") {
      const targetID = Object.keys(mentions)[0] || messageReply?.senderID;
      const amount = parseInt(args.find(a => !isNaN(a)));

      if (!targetID || !amount)
        return message.reply("🌸 Utilisation : bal t @user montant");

      const sender = await usersData.get(senderID);
      const receiver = await usersData.get(targetID);

      if (!receiver) return message.reply("💔 Utilisateur introuvable");

      const tax = Math.ceil(amount * 0.05);
      const total = amount + tax;

      if (sender.money < total)
        return message.reply("💸 Pas assez d'argent mon ange...");

      await usersData.set(senderID, {
        ...sender,
        money: sender.money - total
      });

      await usersData.set(targetID, {
        ...receiver,
        money: receiver.money + amount
      });

      const name = await usersData.getName(targetID);

      return message.reply(
        `🌸 ✦ Transfert Angel réussi ✦ 🌸\n\n` +
        `💌 Vers : ${name}\n` +
        `💰 Montant : ${formatMoney(amount)}\n` +
        `🍥 Taxe : ${formatMoney(tax)}\n` +
        `💎 Total : ${formatMoney(total)}`
      );
    }

    // 💖 BALANCE CARD
    const targetID =
      Object.keys(mentions)[0] ||
      messageReply?.senderID ||
      senderID;

    const name = await usersData.getName(targetID);
    const money = await usersData.get(targetID, "money") || 0;
    const avatar = await fetchAvatar(targetID);

    const width = 720;
    const height = 380;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // 🌈 Background angel gradient
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, "#ffb6ff");
    grad.addColorStop(0.5, "#cdb4ff");
    grad.addColorStop(1, "#bde0fe");

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // 💖 Glass card
    ctx.fillStyle = "rgba(255,255,255,0.15)";
    ctx.fillRect(30, 30, width - 60, height - 60);

    // ✨ border glow
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 3;
    ctx.strokeRect(30, 30, width - 60, height - 60);

    // 🌸 Avatar circle
    const size = 110;
    ctx.save();
    ctx.beginPath();
    ctx.arc(120, 190, size / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatar, 65, 135, size, size);
    ctx.restore();

    // 💎 Title
    ctx.fillStyle = "#fff";
    ctx.font = "bold 32px Arial";
    ctx.textAlign = "center";
    ctx.fillText("🌸 Angel Balance Card 🌸", width / 2, 70);

    // 👤 Name
    ctx.textAlign = "left";
    ctx.font = "bold 28px Arial";
    ctx.fillStyle = "#fff";
    ctx.fillText(`💖 ${name}`, 220, 170);

    // 🆔 ID
    ctx.font = "20px Arial";
    ctx.fillStyle = "#fff";
    ctx.fillText(`🆔 ${targetID}`, 220, 210);

    // 💰 Money
    ctx.font = "bold 42px Arial";
    ctx.fillStyle = "#fff";
    ctx.fillText(`💎 ${formatMoney(money)}`, 220, 280);

    // save
    const file = path.join(__dirname, "angel_balance.png");
    fs.writeFileSync(file, canvas.toBuffer("image/png"));

    return message.reply({
      body: `🌸💖 Voici ta carte Angel 💖🌸`,
      attachment: fs.createReadStream(file)
    });
  }
};
