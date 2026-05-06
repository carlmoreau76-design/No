const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

const OWNER_ID = "61573867120837";

module.exports = {
  config: {
    name: "hug",
    version: "2.0",
    author: "Shade",
    countDown: 5,
    role: 0,
    description: "🌸 Angel Hug system with VIP mode 👑",
    category: "love",
    guide: {
      en: "{pn} @tag or reply 🌸"
    }
  },

  langs: {
    en: {
      noTag: "🌸 Please tag someone or reply to hug them 💞",
      fail: "💔 Hug failed… try again later 🌸"
    }
  },

  onStart: async function ({ event, message, usersData, getLang }) {

    const uid1 = event.senderID;
    let uid2 = Object.keys(event.mentions || {})[0];

    if (!uid2 && event.messageReply?.senderID)
      uid2 = event.messageReply.senderID;

    if (!uid2)
      return message.reply(getLang("noTag"));

    try {
      const [name1, name2] = await Promise.all([
        usersData.getName(uid1).catch(() => "Angel"),
        usersData.getName(uid2).catch(() => "Angel")
      ]);

      const [avatar1, avatar2] = await Promise.all([
        usersData.getAvatarUrl(uid1),
        usersData.getAvatarUrl(uid2)
      ]);

      const GITHUB_RAW = "https://raw.githubusercontent.com/Saim-x69x/sakura/main/ApiUrl.json";
      const rawRes = await axios.get(GITHUB_RAW);
      const apiBase = rawRes.data.apiv1;

      // 🌸 NORMAL API
      const normalURL = `${apiBase}/api/hug?boy=${encodeURIComponent(avatar1)}&girl=${encodeURIComponent(avatar2)}`;

      // 👑 VIP IMAGE SI OWNER
      let finalImageBuffer;

      if (uid1 === OWNER_ID || uid2 === OWNER_ID) {

        // 💖 ANGEL VIP IMAGE (tu peux changer ce lien)
        const vipImage = "https://i.imgur.com/your_angel_vip_image.jpg";

        const vipRes = await axios.get(vipImage, { responseType: "arraybuffer" });
        finalImageBuffer = vipRes.data;

      } else {

        const res = await axios.get(normalURL, { responseType: "arraybuffer" });
        finalImageBuffer = res.data;
      }

      // 📁 SAVE IMAGE TEMP
      const savePath = path.join(__dirname, "tmp");
      await fs.ensureDir(savePath);

      const imgPath = path.join(savePath, `${uid1}_${uid2}_angelhug.jpg`);
      await fs.writeFile(imgPath, finalImageBuffer);

      // 💖 TEXT NORMAL VS VIP
      let text;

      if (uid1 === OWNER_ID || uid2 === OWNER_ID) {
        text =
          `🌸👑 *ANGEL VIP HUG ACTIVATED* 👑🌸\n\n` +
          `💖 A divine hug between legends 💎\n` +
          `✨ The world feels softer around them 🌟\n` +
          `🤍 ${name1} × ${name2} = Eternal Angel Bond 💞`;
      } else {
        text =
          `🌸💞 *Angel Hug Activated* 💞🌸\n\n` +
          `🤗 ${name1} softly hugs ${name2} 💖\n` +
          `✨ A warm feeling spreads between them 🌸`;
      }

      await message.reply({
        body: text,
        attachment: fs.createReadStream(imgPath)
      });

      setTimeout(() => {
        if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
      }, 5000);

    } catch (err) {
      console.error("Hug error:", err);
      return message.reply(getLang("fail"));
    }
  }
};
