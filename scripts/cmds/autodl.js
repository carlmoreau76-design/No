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
  "pinterest.com", "pin.it", // 🛠️ Correction : Virgule ajoutée ici
  "suno.com"
];

module.exports = {
  config: {
    name: "autodl",
    version: "2.1.0 Hori Edition",
    author: "Christus × Shade × Gemini",
    role: 0,
    shortDescription: "🌸 Auto Media Downloader Hori Style",
    longDescription: "👼 Télécharge automatiquement des médias depuis les plateformes supportées avec une interface stylisée.",
    category: "download",
    guide: {
      fr: "🌸 Envoie simplement un lien https:// et le bot le téléchargera automatiquement."
    }
  },

  onStart: async function ({ api, event }) {
    api.sendMessage(
      "✨ 🌸 **[ AUTOMATIC DOWNLOADER ]** 🌸 ✨\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n💖 Envoie un lien valide (YouTube, TikTok, Facebook, Instagram...) et je m'occupe de le récupérer instantanément !",
      event.threadID,
      event.messageID
    );
  },

  onChat: async function ({ api, event }) {
    const content = event.body ? event.body.trim() : "";

    if (content.toLowerCase().startsWith("auto")) return;
    if (!content.startsWith("https://")) return;
    if (!supportedDomains.some(domain => content.includes(domain))) return;

    api.setMessageReaction("📥", event.messageID, () => {}, true);

    try {
      const API = `https://xsaim8x-xxx-api.onrender.com/api/auto?url=${encodeURIComponent(content)}`;
      const res = await axios.get(API);

      if (!res.data) throw new Error("No response from server API");

      const mediaURL = res.data.high_quality || res.data.low_quality;
      const mediaTitle = res.data.title || "Média Sans Titre";
      if (!mediaURL) throw new Error("No download link found");

      const extension = mediaURL.includes(".mp3") ? "mp3" : "mp4";
      const buffer = (await axios.get(mediaURL, { responseType: "arraybuffer" })).data;

      const filePath = path.join(__dirname, "cache", `hori_dl_${Date.now()}.${extension}`);

      await fs.ensureDir(path.dirname(filePath));
      fs.writeFileSync(filePath, Buffer.from(buffer));

      api.setMessageReaction("✅", event.messageID, () => {}, true);

      const domain = supportedDomains.find(d => content.includes(d)) || "Unknown";
      const platformName = domain.replace(/(\.com|\.app|\.video|\.net|\.it)/, "").toUpperCase();

      // Nouveau visuel textuel Hori Style
      const infoMsg =
`✨ 🌸 **[ EXTRACTION RÉUSSIE ]** 🌸 ✨
━━━━━━━━━━━━━━━━━━━━━━━━━━
🎬 **Titre :** ${mediaTitle}
🌍 **Plateforme :** ${platformName}
📈 **Statut :** Opérationnel [ 100% ]
━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 _Fichier converti et traité par le système._`;

      api.sendMessage(
        {
          body: infoMsg,
          attachment: fs.createReadStream(filePath)
        },
        event.threadID,
        () => {
          try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch (e) {}
        },
        event.messageID
      );

    } catch (e) {
      console.error(e);
      api.setMessageReaction("❌", event.messageID, () => {}, true);

      api.sendMessage(
        "✨ 🌸 **[ SYNC FLOP / INTERRUMPUR ]** 🌸 ✨\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n❌ Impossible de récupérer le contenu de ce terminal.\n\n💡 _Vérifie la validité de ton URL ou réessaie ultérieurement._",
        event.threadID,
        event.messageID
      );
    }
  } // 🛠️ Correction : Fermeture correcte de la fonction onChat incluse
};
