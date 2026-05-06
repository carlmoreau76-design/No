const fs = require("fs");

const OWNER_UID = "61573867120837";
const FILE_PATH = "./scripts/cmds/cache/bot_status.json";

function getStatus() {
  return JSON.parse(fs.readFileSync(FILE_PATH));
}

function setStatus(data) {
  fs.writeFileSync(FILE_PATH, JSON.stringify(data, null, 2));
}

module.exports = {
  config: {
    name: "wakebot",
    version: "1.0",
    author: "Shade",
    role: 0,
    shortDescription: "Réveiller le bot",
    category: "system"
  },

  onStart: async function ({ message, event }) {
    if (event.senderID !== OWNER_UID) {
      return message.reply("❌ Tu n'as pas le droit.");
    }

    const data = getStatus();
    data.sleep = false;
    setStatus(data);

    message.reply("🌸 Angel se réveille... prête à parler...");
  }
};
