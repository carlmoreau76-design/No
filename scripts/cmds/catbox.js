const axios = require("axios");
const FormData = require("form-data");
const path = require("path");
const mime = require("mime-types");

module.exports = {
  config: {
    name: "catbox",
    aliases: ["cb"],
    version: "2.2.0 Hori Edition",
    author: "Shade × Gemini",
    role: 0,
    category: "download",
    description: "☁️ Upload tes médias sur Catbox et récupère un lien permanent.",
    guide: {
      fr: "Réponds à une image, vidéo ou audio avec : {pn} 🌸"
    }
  },

  onStart: async function ({ api, event }) {
    const attachment = event.messageReply?.attachments?.[0];
    const attachmentUrl = attachment?.url;

    // ❌ SÉCURITÉ : Aucun média détecté
    if (!attachmentUrl) {
      return api.sendMessage(
`✨ 🌸 **[ UPLOAD TERMINAL ]** 🌸 ✨
━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ Action requise : Réponds à une image, une vidéo ou un fichier audio pour l'envoyer vers le serveur d'hébergement.`,
        event.threadID,
        event.messageID
      );
    }

    // 🛠️ Correction : Détermination dynamique et sécurisée de l'extension via le type de pièce jointe Messenger
    let ext = ".bin";
    if (attachment.type === "photo") ext = ".png";
    else if (attachment.type === "video") ext = ".mp4";
    else if (attachment.type === "audio") ext = ".mp3";
    else {
      ext = path.extname(attachmentUrl.split("?")[0]) || ".bin";
    }

    const filename = `hori_upload_${Date.now()}${ext}`;

    // ⏳ Début du traitement
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

        // ✅ Réaction Réussite
        api.setMessageReaction("📩", event.messageID, () => {}, true);

        return api.sendMessage(
`✨ 🌸 **[ CLOUD STORAGE SUCCESS ]** 🌸 ✨
━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 **Statut :** Hébergement terminé [ 100% ]

🔗 **Lien permanent généré :**
${data}
━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 _Le fichier est désormais stocké en ligne de façon définitive._`,
          event.threadID,
          event.messageID
        );

      } catch (err) {
        console.error("Catbox error:", err.message);

        // ❌ Réaction Échec
        api.setMessageReaction("❌", event.messageID, () => {}, true);

        return api.sendMessage(
`✨ 🌸 **[ TRANSFER PROTOCOL FAILED ]** 🌸 ✨
━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ Impossible de transférer le composant vers la base de données.

💡 _Vérifie la taille ou le format de ton média, puis réessaie._`,
          event.threadID,
          event.messageID
        );
      }
    }, true);
  }
};
