const fs = require("fs");

const OWNER_UID = "61573867120837";
const FILE_PATH = "./scripts/cmds/cache/bot_status.json";

// créer fichier si pas existant
if (!fs.existsSync(FILE_PATH)) {
  fs.writeFileSync(FILE_PATH, JSON.stringify({ sleep: false }, null, 2));
}

// lire état
function getStatus() {
  return JSON.parse(fs.readFileSync(FILE_PATH));
}

// sauvegarder état
function setStatus(data) {
  fs.writeFileSync(FILE_PATH, JSON.stringify(data, null, 2));
}

module.exports = {
  config: {
    name: "sleepbot",
    version: "1.0",
    author: "Shade",
    role: 0,
    shortDescription: "Activer le mode sommeil du bot",
    category: "system"
  },

  onStart: async function ({ message, event }) {
    if (event.senderID !== OWNER_UID) {
      return message.reply("❌ Tu n'as pas le droit.");
    }

    const data = getStatus();
    data.sleep = true;
    setStatus(data);

    message.reply("😴 Angel s'endort... elle ne répondra plus...");
  }
};
