const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const ownerInfo = {
  name: "ヾ Kαɪ.夜",
  facebook: "https://www.facebook.com/shade.userX",
  instagram : "x.shade108",
  supportGroup: "꒰ა 𝘚𝘶𝘱𝘱𝘰𝘳𝘵 𝘣𝘪𝘦𝘯𝘵𝘰̂𝘵 𝘥𝘪𝘴𝘱𝘰𝘯𝘪𝘣𝘭𝘦 ໒꒱"
};

module.exports = {
  config: {
    name: "botjoin",
    version: "2.1",
    author: "Angel System",
    category: "events"
  },

  onStart: async function ({ event, api }) {
    if (event.logMessageType !== "log:subscribe") return;

    const { threadID, logMessageData } = event;
    const botID = api.getCurrentUserID();
    const addedUsers = logMessageData.addedParticipants;

    const isBotAdded = addedUsers.some(u => u.userFbId === botID);
    if (!isBotAdded) return;

    const prefix = global.utils.getPrefix(threadID);
    const nickNameBot = global.GoatBot.config.nickNameBot || "Angel Bot ✨";

    try {
      await api.changeNickname(nickNameBot, threadID, botID);
    } catch (e) {}

    try {
      const API = "https://xsaim8x-xxx-api.onrender.com/api/botjoin";
      const url = `${API}?botuid=${botID}&prefix=${encodeURIComponent(prefix)}`;

      const cacheDir = path.join(__dirname, "..", "cache");
      await fs.ensureDir(cacheDir);

      const imgPath = path.join(cacheDir, `join_${threadID}.png`);

      const res = await axios.get(url, { responseType: "arraybuffer" });
      fs.writeFileSync(imgPath, res.data);

      const msg = `
╭ ◜◝ ͡ ◜◝ ͡ ◝╮
♡ 𝘼𝙣𝙜𝙚𝙡 𝘽𝙤𝙩 ♡
╰ ◟◞ ͜ ◟◞ ╯

🎀 𝐓𝐡𝐚𝐧𝐤 𝐲𝐨𝐮 𝐟𝐨𝐫 𝐢𝐧𝐯𝐢𝐭𝐢𝐧𝐠 𝐦𝐞

🔹 𝐏𝐫𝐞𝐟𝐢𝐱 : ${prefix}
🔸 𝐔𝐬𝐞 : ${prefix}help

💫 𝐈’𝐦 𝐀𝐧𝐠𝐞𝐥 𝐁𝐨𝐭

╭══════════════╮
👑 𝐎𝐰𝐧𝐞𝐫 : ${ownerInfo.name}
🌐 𝐅𝐚𝐜𝐞𝐛𝐨𝐨𝐤 : ${ownerInfo.facebook}
✈️ 𝐈𝐧𝐬𝐭𝐚𝐠𝐫𝐚𝐦 : ${ownerInfo.instagram}
🤖 𝐒𝐮𝐩𝐩𝐨𝐫𝐭 : ${ownerInfo.supportGroup}
╰══════════════╯

✨ 𝐀𝐥𝐰𝐚𝐲𝐬 𝐚𝐜𝐭𝐢𝐯𝐞 • 𝐒𝐭𝐚𝐲 𝐜𝐮𝐭𝐞 ✨
`;

      await api.sendMessage({
        body: msg,
        attachment: fs.createReadStream(imgPath)
      }, threadID);

      fs.unlinkSync(imgPath);

    } catch (err) {
      const fallback = `
╭ ◜◝ ͡ ◜◝ ͡ ◝╮
♡ 𝘼𝙣𝙜𝙚𝙡 𝘽𝙤𝙩 ♡
╰ ◟◞ ͜ ◟◞ ╯

❌ 𝐈𝐦𝐚𝐠𝐞 𝐮𝐧𝐚𝐯𝐚𝐢𝐥𝐚𝐛𝐥𝐞

🎀 𝐓𝐫𝐲 𝐚𝐠𝐚𝐢𝐧 𝐥𝐚𝐭𝐞𝐫

╭══════════════╮
👑 𝐎𝐰𝐧𝐞𝐫 : ${ownerInfo.name}
🌐 𝐅𝐚𝐜𝐞𝐛𝐨𝐨𝐤 : ${ownerInfo.facebook}
✈️ 𝐈𝐧𝐬𝐭𝐚𝐠𝐫𝐚𝐦 : ${ownerInfo.instagram}
╰══════════════╯
`;
      api.sendMessage(fallback, threadID);
    }
  }
};
