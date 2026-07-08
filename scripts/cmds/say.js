const fs = require("fs");
const axios = require("axios");
const googleTTS = require("google-tts-api");

module.exports = {
  config: {
    name: "say",
    aliases: ["speak"],
    version: "1.0",
    author: "Shade",
    countDown: 5,
    role: 0,
    usePrefix: true,
    shortDescription: {
      en: "Convert text to French voice",
      fr: "Convertit du texte en voix française"
    },
    longDescription: {
      en: "Bot will speak your text in French using Google TTS",
      fr: "Le bot va prononcer votre texte en français via Google TTS"
    },
    category: "media",
    guide: {
      en: "{pn} <your French text> → e.g. {pn} Bonjour tout le monde",
      fr: "{pn} <votre texte en français> → ex: {pn} Bonjour tout le monde"
    }
  },

  onStart: async function ({ args, message }) {
    const text = args.join(" ").trim();
    if (!text) return message.reply("⚠️ Veuillez fournir du texte à prononcer !");

    try {
      // Modification de la langue de 'bn' (Bengali) vers 'fr' (Français)
      const url = googleTTS.getAudioUrl(text, {
        lang: 'fr',
        slow: false,
        host: 'https://translate.google.com'
      });

      const tempPath = `${__dirname}/voice.mp3`;
      const res = await axios.get(url, { responseType: 'arraybuffer' });
      fs.writeFileSync(tempPath, Buffer.from(res.data));

      await message.reply({
        body: `🔊 Message vocal : ${text}`,
        attachment: fs.createReadStream(tempPath)
      });

      fs.unlinkSync(tempPath);
    } catch (err) {
      console.error("❌ Say command error:", err);
      message.reply("❌ Impossible de générer la voix !");
    }
  }
};
