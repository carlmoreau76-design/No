const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const supportedDomains = [
  "facebook.com", "fb.watch",
  "youtube.com", "youtu.be",
  "tiktok.com",
  "instagram.com", "instagr.am",
  "likee.com", "likee.video",
  "capcut.com",
  "spotify.com",
  "terabox.com",
  "twitter.com", "x.com",
  "drive.google.com",
  "soundcloud.com",
  "ndown.app",
  "pinterest.com", "pin.it"
];

module.exports = {
  config: {
    name: "autodl",
    version: "2.0",
    author: "Christus ✦ Angel Edit",
    role: 0,
    shortDescription: "🌸 Angel Auto Media Downloader",
    longDescription:
      "👼 Télécharge automatiquement des médias depuis les plateformes supportées",
    category: "angel utility",
    guide: {
      fr: "🌸 Envoie simplement un lien https:// et le bot te répondra automatiquement"
    }
  },

  onStart: async function ({ api, event }) {
    api.sendMessage(
      "👼🌸 𝑨𝑵𝑮𝑬𝑳 𝑨𝑼𝑻𝑶 𝑫𝑶𝑾𝑵𝑳𝑶𝑨𝑫𝑬𝑹 ✧\n\n💖 Envoie un lien (YouTube, TikTok, Facebook, Instagram...) et je le téléchargerai pour toi ✨",
      event.threadID,
      event.messageID
    );
  },

  onChat: async function ({ api, event }) {
    const content = event.body ? event.body.trim() : "";

    if (content.toLowerCase().startsWith("auto")) return;
    if (!content.startsWith("https://")) return;
    if (!supportedDomains.some(domain => content.includes(domain))) return;

    api.setMessageReaction("⌛️", event.messageID, () => {}, true);

    try {
      const API = `https://xsaim8x-xxx-api.onrender.com/api/auto?url=${encodeURIComponent(content)}`;
      const res = await axios.get(API);

      if (!res.data) throw new Error("No response");

      const mediaURL = res.data.high_quality || res.data.low_quality;
      const mediaTitle = res.data.title || "🌸 Angel Media";
      if (!mediaURL) throw new Error("No media found");

      const extension = mediaURL.includes(".mp3") ? "mp3" : "mp4";
      const buffer = (await axios.get(mediaURL, { responseType: "arraybuffer" })).data;

      const filePath = path.join(__dirname, "cache", `angel_${Date.now()}.${extension}`);

      await fs.ensureDir(path.dirname(filePath));
      fs.writeFileSync(filePath, Buffer.from(buffer));

      api.setMessageReaction("💖", event.messageID, () => {}, true);

      const domain = supportedDomains.find(d => content.includes(d)) || "Unknown";
      const platformName = domain.replace(/(\.com|\.app|\.video|\.net)/, "").toUpperCase();

      const infoMsg =
`👼🌸 𝑨𝑵𝑮𝑬𝑳 𝑫𝑶𝑾𝑵𝑳𝑶𝑨𝑫 ✧

✨ Title     : ${mediaTitle}
🌍 Platform  : ${platformName}
💖 Status    : Success
👼 Powered by Angel Bot`;

      api.sendMessage(
        {
          body: infoMsg,
          attachment: fs.createReadStream(filePath)
        },
        event.threadID,
        () => fs.unlinkSync(filePath),
        event.messageID
      );

    } catch (e) {
      api.setMessageReaction("❌", event.messageID, () => {}, true);

      api.sendMessage(
        "💔🌸 Angel Bot n’a pas pu télécharger ce média...\n✨ Vérifie ton lien ou réessaie plus tard",
        event.threadID,
        event.messageID
      );
    }
  }
};
