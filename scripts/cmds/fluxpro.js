const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "fluxpro",
    version: "1.0 angel kawaii",
    author: "Christus | Shade Angel Edit ✨",
    countDown: 5,
    role: 0,
    description: {
      fr: "💖 Génération IA FluxPro style Angel kawaii"
    },
    category: "🌸 générateur d'images",
    guide: {
      fr: "{pn} <prompt>"
    },
  },

  onStart: async function ({ message, event, args, api, commandName }) {

    const prefix =
      global.utils?.getPrefix?.(event.threadID) ||
      global.GoatBot?.config?.prefix ||
      "/";

    const prompt = args.join(" ");

    if (!prompt) {
      return message.reply(
`💔🌸 ANGEL FLUXPRO

⚠️ Donne-moi un prompt magique

✨ Exemple :
${prefix}${commandName} samouraï cyberpunk sous la pluie`
      );
    }

    // 💖 REACTION LOADING
    api.setMessageReaction("🎨", event.messageID, () => {}, true);

    const waitingMsg = await message.reply(
`🌸💖 Angel prépare ta vision IA...

⏳ Génération en cours...`
    );

    const encodedPrompt = encodeURIComponent(prompt);

    const url = `https://dev.oculux.xyz/api/flux-1.1-pro?prompt=${encodedPrompt}`;

    const imgPath = path.join(
      __dirname,
      "cache",
      `fluxpro_${event.senderID}.png`
    );

    try {
      const response = await axios.get(url, {
        responseType: "arraybuffer"
      });

      await fs.ensureDir(path.dirname(imgPath));
      fs.writeFileSync(imgPath, response.data);

      // 💖 SUCCESS REACTION
      api.setMessageReaction("✅", event.messageID, () => {}, true);

      await message.reply(
        {
          body:
`💖✨ ANGEL FLUXPRO RESULT

🖋️ Prompt : ${prompt}

🌸 Ton image est prête !`,
          attachment: fs.createReadStream(imgPath)
        },
        () => {
          fs.unlinkSync(imgPath);
          if (waitingMsg?.messageID)
            api.unsendMessage(waitingMsg.messageID);
        }
      );

    } catch (error) {
      console.error("FluxPro error:", error);

      // 💔 ERROR REACTION
      api.setMessageReaction("❌", event.messageID, () => {}, true);

      if (waitingMsg?.messageID)
        api.unsendMessage(waitingMsg.messageID);

      return message.reply(
`💔🌸 ANGEL ERROR

❌ Échec de génération FluxPro

💬 Réessaie plus tard Angel~`
      );
    }
  }
};
