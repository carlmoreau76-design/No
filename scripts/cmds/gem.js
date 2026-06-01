const axios = require("axios");
const fs = require("fs");
const path = require("path");

const API = "https://gemini-edit-omega.vercel.app/edit";

// 🧠 mémoire simple
const memoryFile = "./gem_memory.json";

let memory = {};

if (fs.existsSync(memoryFile)) {
  try {
    memory = JSON.parse(fs.readFileSync(memoryFile, "utf8"));
  } catch {
    memory = {};
  }
}

function saveMemory() {
  fs.writeFileSync(memoryFile, JSON.stringify(memory, null, 2));
}

module.exports = {
  config: {
    name: "gem",
    version: "1.0",
    author: "Shade",
    role: 0,
    category: "image-edit"
  },

  onStart: async function ({ message, event, args, api }) {

    const userID = event.senderID;
    const prompt = args.join(" ").trim();

    const attachment = event.messageReply?.attachments?.[0];

    if (!attachment || attachment.type !== "photo") {
      return message.reply("🌸 Réponds à une image !");
    }

    if (!prompt) {
      return message.reply("💡 Exemple : !gem ajoute un ciel sombre");
    }

    // init mémoire
    if (!memory[userID]) {
      memory[userID] = {
        image: attachment.url,
        story: ""
      };
    }

    memory[userID].story += `, ${prompt}`;
    saveMemory();

    let loading;

    try {
      api.setMessageReaction("🎨", event.messageID, () => {}, true);

      loading = await message.reply("🎨 édition en cours...");

      const res = await axios.get(API, {
        params: {
          prompt: memory[userID].story,
          imgurl: memory[userID].image
        }
      });

      if (!res.data?.images?.[0]) {
        return message.reply("❌ API n’a rien renvoyé");
      }

      const base64 = res.data.images[0].replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64, "base64");

      const cacheDir = path.join(__dirname, "cache");
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }

      const filePath = path.join(cacheDir, `gem_${Date.now()}.png`);
      fs.writeFileSync(filePath, buffer);

      await api.unsendMessage(loading.messageID);

      api.setMessageReaction("🖼️", event.messageID, () => {}, true);

      return message.reply({
        body: "✨ Image éditée avec succès",
        attachment: fs.createReadStream(filePath)
      });

    } catch (e) {
      console.log("GEM ERROR:", e);

      if (loading) {
        await api.unsendMessage(loading.messageID);
      }

      api.setMessageReaction("❌", event.messageID, () => {}, true);

      return message.reply("💔 erreur gem edit");
    }
  },

  onChat: async function ({ event, message }) {
    const body = event.body?.toLowerCase();

    if (body === "!gem reset") {
      delete memory[event.senderID];
      saveMemory();
      return message.reply("🧠 mémoire reset ✔️");
    }
  }
};
