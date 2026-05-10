const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "welcome",
    version: "2.0",
    author: "Angel System",
    category: "events"
  },

  onStart: async function ({ api, event }) {
    if (event.logMessageType !== "log:subscribe") return;

    const { threadID, logMessageData } = event;
    const newUsers = logMessageData.addedParticipants;
    const botID = api.getCurrentUserID();

    if (newUsers.some(u => u.userFbId === botID)) return;

    const threadInfo = await api.getThreadInfo(threadID);
    const groupName = threadInfo.threadName;
    const memberCount = threadInfo.participantIDs.length;

    for (const user of newUsers) {
      const userId = user.userFbId;
      const fullName = user.fullName;

      try {
        const timeStr = new Date().toLocaleString("en-BD", {
          timeZone: "Asia/Dhaka",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          weekday: "long",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour12: true,
        });

        const apiUrl = `https://xsaim8x-xxx-api.onrender.com/api/welcome?name=${encodeURIComponent(fullName)}&uid=${userId}&threadname=${encodeURIComponent(groupName)}&members=${memberCount}`;

        const tmp = path.join(__dirname, "..", "cache");
        await fs.ensureDir(tmp);

        const imagePath = path.join(tmp, `welcome_${userId}.png`);

        const response = await axios.get(apiUrl, { responseType: "arraybuffer" });
        fs.writeFileSync(imagePath, response.data);

        const msg =
`╭ ◜◝ ͡ ◜◝ ͡ ◝╮
♡ 𝘼𝙣𝙜𝙚𝙡 𝘽𝙤𝙩 ♡
╰ ◟◞ ͜ ◟◞ ╯

꒰ა ✦ 𝐖𝐞𝐥𝐜𝐨𝐦𝐞 ✦ ໒꒱

✧ 𝐇𝐞𝐥𝐥𝐨 ${fullName}
✧ 𝐖𝐞𝐥𝐜𝐨𝐦𝐞 𝐭𝐨 ${groupName}
✧ 𝐌𝐞𝐦𝐛𝐞𝐫 𝐍𝐨: ${memberCount}

✦ 𝐄𝐧𝐣𝐨𝐲 𝐭𝐡𝐞 𝐠𝐫𝐨𝐮𝐩 ✦
━━━━━━━━━━━━━━
⏰ ${timeStr}`;

        await api.sendMessage({
          body: msg,
          attachment: fs.createReadStream(imagePath),
          mentions: [{ tag: fullName, id: userId }]
        }, threadID);

        fs.unlinkSync(imagePath);

      } catch (err) {
        console.error("❌ Error sending welcome message:", err);
      }
    }
  }
};
