const axios = require("axios");
const fs = require("fs");
const path = require("path");

// 💎 NEW API (remplace ancien)
const API = "https://gem-tw6a.onrender.com/api/generate";

// 📁 memory file
const memoryFile = path.join(__dirname, "gem_memory.json");

let memory = {};

// 🔄 load memory safe
if (fs.existsSync(memoryFile)) {
  try {
    memory = JSON.parse(fs.readFileSync(memoryFile, "utf8"));
  } catch {
    memory = {};
  }
}

// 💾 save memory
function saveMemory() {
  fs.writeFileSync(memoryFile, JSON.stringify(memory, null, 2));
}

// 🔁 retry function (IMPORTANT FIX)
async function generateImage(payload) {
  try {
    return await axios.get(API, {
      timeout: 60000,
      params: payload
    });
  } catch (err) {
    console.log("🔁 retry API...");
    return await axios.get(API, {
      timeout: 60000,
      params: payload
    });
  }
}

module.exports = {
  config: {
    name: "gem",
    version: "4.0 PRO ULTRA",
    author: "Shade ✨ Angel Edit",
    role: 0,
    category: "ai"
  },

  onStart: async function ({ message, event, args, api }) {

    const userID = event.senderID;
    const prompt = args.join(" ").trim();

    const attachment = event.messageReply?.attachments?.[0];

    // ❌ image check
    if (!attachment || attachment.type !== "photo") {
      return message.reply("🌸 Réponds à une image !");
    }

    if (!prompt) {
      return message.reply("💡 Exemple : !gem ajoute un ciel sombre");
    }

    // 🧠 INIT MEMORY
    if (!memory[userID]) {
      memory[userID] = {
        image: attachment.url,
        story: ""
      };
    }

    // ⚡ update image safe
    memory[userID].image = attachment.url;

    // 🧠 story update
    memory[userID].story += `, ${prompt}`;
    saveMemory();

    let loading;

    try {

      api.setMessageReaction("🎨", event.messageID, () => {}, true);

      loading = await message.reply("🎨 GEM PRO génération...");

      // 🚀 CALL API SAFE + RETRY
      const res = await generateImage({
        prompt: memory[userID].story,
        imgurl: memory[userID].image
      });

      const img = res.data?.images?.[0];

      if (!img) {
        throw new Error("EMPTY_API_RESPONSE");
      }

      // 🧠 base64 clean
      const base64 = img.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64, "base64");

      const cacheDir = path.join(__dirname, "cache");
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }

      const filePath = path.join(
        cacheDir,
        `gem_${userID}_${Date.now()}.png`
      );

      fs.writeFileSync(filePath, buffer);

      if (loading?.messageID) {
        await api.unsendMessage(loading.messageID);
      }

      api.setMessageReaction("🖼️", event.messageID, () => {}, true);

      return message.reply({
        body: "✨ GEM PRO ULTRA terminé avec succès",
        attachment: fs.createReadStream(filePath)
      });

    } catch (e) {

      console.log("====== GEM PRO ERROR ======");
      console.log("USER:", userID);
      console.log("ERROR:", e.message || e);

      if (loading?.messageID) {
        await api.unsendMessage(loading.messageID);
      }

      api.setMessageReaction("❌", event.messageID, () => {}, true);

      return message.reply(
        "💔 GEM PRO erreur\n🔁 Réessaie ou change d’image"
      );
    }
  },

  // ♻️ RESET MEMORY
  onChat: async function ({ event, message }) {

    const body = event.body?.toLowerCase();

    if (body === "!gem reset") {

      memory[event.senderID] = {
        image: null,
        story: ""
      };

      saveMemory();

      return message.reply("🧠 GEM PRO mémoire reset ✔️");
    }
  }
};
