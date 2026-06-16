const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const PRISON_DB = new Map();

// 👑 SEUL LE OWNER PEUT JAIL
const OWNER_ID = "61573867120837";

// ⏳ 3 jours
const THREE_DAYS = 3 * 24 * 60 * 60 * 1000;

module.exports = {
  config: {
    name: "prison",
    aliases: ["jail"],
    version: "7.0 ultra final",
    author: "Shade × ChatGPT",
    role: 0,
    category: "game"
  },

  onStart: async function ({
    event,
    message,
    args,
    api,
    usersData,
    Currencies
  }) {
    const threadID = event.threadID;
    const senderID = event.senderID;
    const action = args[0];

    if (!PRISON_DB.has(threadID)) PRISON_DB.set(threadID, {});
    const db = PRISON_DB.get(threadID);

    // =========================
    // 🔒 BLOCK PRISON CHAT ACCESS
    // =========================
    if (db[senderID]) {
      const allowed = ["pay", "play"];

      if (!action || !allowed.includes(action)) {
        return message.reply("⛓️ ACCÈS INTERDIT : TU ES EN PRISON !");
      }
    }

    // =========================
    // 🚔 ADD PRISON (OWNER ONLY)
    // =========================
    if (action === "add") {
      if (senderID !== OWNER_ID)
        return message.reply("⛔ Seul le boss peut envoyer en prison.");

      const targetID =
        Object.keys(event.mentions)[0] ||
        event.messageReply?.senderID;

      if (!targetID)
        return message.reply("Tag quelqu’un !");

      db[targetID] = {
        jailed: true,
        start: Date.now(),
        paid: false,
        miniGame: Math.random() < 0.5 ? "🪓 casse-mur" : "🎲 chance"
      };

      return message.reply("🚔 PERSONNE EN PRISON !");
    }

    // =========================
    // 💰 PAY (100K FROM BAL)
    // =========================
    if (action === "pay") {
      const targetID = senderID;

      if (!db[targetID])
        return message.reply("Tu n’es pas en prison.");

      const fine = 100000;

      const userData = await Currencies.getData(targetID);
      const money = userData.money || 0;

      if (money < fine)
        return message.reply("💔 Pas assez d'argent (100,000$ requis).");

      await Currencies.setData(targetID, {
        money: money - fine
      });

      db[targetID].paid = true;
      delete db[targetID];

      return message.reply("🚪 TU AS PAYÉ 100,000$ ET TU ES LIBRE !");
    }

    // =========================
    // 🎮 MINI GAME
    // =========================
    if (action === "play") {
      const user = db[senderID];
      if (!user) return message.reply("Tu n’es pas en prison.");

      const win = Math.random() < 0.4;

      if (win) {
        db[senderID].paid = true;
        delete db[senderID];
        return message.reply("💥 TU ES LIBRE ! TU AS FUI LA PRISON !");
      }

      return message.reply("❌ ÉCHEC ! TU RESTES EN PRISON.");
    }

    // =========================
    // ⏳ AUTO EXPULSION 3 JOURS
    // =========================
    for (const uid in db) {
      const data = db[uid];

      if (Date.now() - data.start > THREE_DAYS && !data.paid) {
        delete db[uid];

        try {
          await api.removeUserFromGroup(uid, threadID);
        } catch (e) {}
      }
    }

    // =========================
    // 📜 LIST PRISON
    // =========================
    if (action === "list") {
      let text = "🚔 PRISON LIST\n\n";

      for (const uid in db) {
        const name = await usersData.getName(uid);
        text += `⛓️ ${name}\n`;
      }

      return message.reply(text || "Vide");
    }

    // =========================
    // 🚔 IMAGE PRISON
    // =========================
    const targetID =
      Object.keys(event.mentions)[0] ||
      event.messageReply?.senderID ||
      senderID;

    const name = await usersData.getName(targetID);
    const avatar = await usersData.getAvatarUrl(targetID);

    const filePath = path.join(__dirname, "tmp", `${targetID}.png`);

    const img = await axios.get(
      `https://api.popcat.xyz/jail?image=${encodeURIComponent(avatar)}`,
      { responseType: "arraybuffer" }
    );

    await fs.outputFile(filePath, img.data);

    return message.reply({
      body: `🚔 ${name} EST EN PRISON`,
      attachment: fs.createReadStream(filePath)
    });
  }
};
