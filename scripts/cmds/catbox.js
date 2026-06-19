const axios = require("axios");
const FormData = require("form-data");
const path = require("path");
const mime = require("mime-types");

module.exports = {
  config: {
    name: "catbox",
    aliases: ["cb"],
    version: "Angel-2.1",
    author: "Shade ✨ Angel Edition",
    role: 0,
    category: "download",
    description: "☁️ Upload tes médias sur Catbox et récupère un lien magique ✨",
    guide: {
      fr: "Réponds à une image, vidéo ou audio puis utilise : catbox 🌸"
    }
  },

  onStart: async function ({ api, event }) {
    const attachment = event.messageReply?.attachments?.[0];
    const attachmentUrl = attachment?.url;

    // ❌ NO FILE
    if (!attachmentUrl) {
      return api.sendMessage(
`🌸💔 𝐀𝐍𝐆𝐄𝐋 𝐂𝐀𝐓𝐁𝐎𝐗 💔🌸

✨ Réponds à une image, vidéo ou audio
pour que les anges puissent l’envoyer ☁️💖`,
        event.threadID,
        event.messageID
      );
    }

    const ext = path.extname(attachmentUrl.split("?")[0]) || ".bin";
    const filename = "upload" + ext;

    // ⏳ PROCESS START
    api.setMessageReaction("⏳", event.messageID, async () => {
      try {
        const fileRes = await axios.get(attachmentUrl, {
          responseType: "stream"
        });

        const form = new FormData();
        form.append("reqtype", "fileupload");
        form.append("fileToUpload", fileRes.data, {
          filename: filename,
          contentType: mime.lookup(ext) || "application/octet-stream"
        });

        const { data } = await axios.post(
          "https://catbox.moe/user/api.php",
          form,
          { headers: form.getHeaders() }
        );

        // 📩 SUCCESS REACTION
        api.setMessageReaction("📩", event.messageID, () => {}, true);

        return api.sendMessage(
`🌸☁️ 𝐀𝐍𝐆𝐄𝐋 𝐂𝐀𝐓𝐁𝐎𝐗 ☁️🌸

✨ Upload terminé avec succès

🔗 Lien magique :
${data}

💖 Ton fichier est maintenant dans les nuages des anges ☁️`,
          event.threadID,
          event.messageID
        );

      } catch (err) {
        console.error("Catbox error:", err.message);

        // 💔 ERROR REACTION
        api.setMessageReaction("💔", event.messageID, () => {}, true);

        return api.sendMessage(
`💔☁️ 𝐀𝐍𝐆𝐄𝐋 𝐂𝐀𝐓𝐁𝐎𝐗 ☁️💔

Les anges n’ont pas pu envoyer ton fichier...

✨ Vérifie le média et réessaie`,
          event.threadID,
          event.messageID
        );
      }
    }, true);
  }
};
