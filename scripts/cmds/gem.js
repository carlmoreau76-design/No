const axios = require("axios");
const fs = require("fs");
const path = require("path");

const API = "https://gemini-edit-omega.vercel.app/edit";

// 🧠 MEMORY IMAGE
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
    version: "2.0",
    author: "Shade",
    role: 0,
    category: "🎨 édit image"
  },

  onStart: async function ({ message, event, args, api }) {

    const userID = event.senderID;

    const attachment = event.messageReply?.attachments?.[0];

    if (!attachment || attachment.type !== "photo") {
      return message.reply("🌸 Réponds à une image !");
    }

    const prompt = args.join(" ").trim();

    if (!prompt) {
      return message.reply("💡 Exemple : !gem gojo apparaît");
    }

    // 🧠 INIT MEMORY
    if (!memory[userID]) {
      memory[userID] = {
        image: null,
        story: ""
      };
    }

    // 🧠 FIRST IMAGE SAVE
    if (!memory[userID].image) {
      memory[userID].image = attachment.url;
    }

    // 🧠 ADD PROMPT TO STORY
    memory[userID].story += `, ${prompt}`;

    saveMemory();

    let loading;

    try {

      api.setMessageReaction("🎨", event.messageID, () => {}, true);

      loading = await message.reply("🎨 génération en cours... 🌸");

      const res = await axios.get(API, {
        params: {
          prompt: memory[userID].story,
          imgurl: memory[userID].image
        }
      });

      if (!res.data?.images?.[0]) {
        throw new Error("no image");
      }

      const base64 = res.data.images[0]
        .replace(/^data:image\/\w+;base64,/, "");

      const buffer = Buffer.from(base64, "base64");

      const cacheDir = path.join(__dirname, "cache");

if (!fs.existsSync(cacheDir)) {
  fs.mkdirSync(cacheDir, { recursive: true });
}

const filePath = path.join(
  cacheDir,
  `gem_${Date.now()}.png`
);

      fs.writeFileSync(filePath, buffer);

      await api.unsendMessage(loading.messageID);

      api.setMessageReaction("🖼️", event.messageID, () => {}, true);

      return message.reply({
        body: "✨ Image mise à jour avec mémoire",
        attachment: fs.createReadStream(filePath)
      });

    } catch (e) {

  console.log("====== GEM ERROR ======");
  console.log("USER:", userID);
  console.log("IMAGE URL:", memory[userID]?.image);

  if (e.response) {
    console.log("API RESPONSE:");
    console.log(e.response.data);
  }

  console.log("ERROR:");
  console.log(e.message || e);

  console.log("=======================");

  if (loading) {
    await api.unsendMessage(loading.messageID);
  }

  api.setMessageReaction("❌", event.messageID, () => {}, true);

  return message.reply(
  "💔 Gem Memory a rencontré une erreur.\n📜 Vérifie la console du bot."
);
}
},

// ♻️ RESET MEMORY
onChat: async function ({ event, message }) {

    const body = event.body?.trim();

    if (!body) return;

    if (body.toLowerCase() === "!gem reset") {

      delete memory[event.senderID];
      saveMemory();

      return message.reply("🧠 mémoire image reset ✔️");
    }
  }
};
