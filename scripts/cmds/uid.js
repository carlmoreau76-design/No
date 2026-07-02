const fs = require("fs-extra");
const axios = require("axios");
const { createCanvas, loadImage } = require("canvas");
const path = require("path");

module.exports = {
  config: {
    name: "uid",
    version: "1.2",
    author: "Samycharles × Gemini",
    role: 0,
    shortDescription: "Carte UID avec avatar (supporte le reply)",
    category: "utility"
  },

  onStart: async function ({ api, event, usersData }) {
    // Détermination de l'UID ciblé (soit la personne à qui on répond, soit l'auteur du message)
    const uid = event.type === "message_reply" ? event.messageReply.senderID : event.senderID;
    
    const cacheDir = path.join(__dirname, "cache");
    
    // Création sécurisée du dossier cache si inexistant
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

    // Chemins uniques par utilisateur pour éviter les conflits de fichiers simultanés
    const avatarPath = path.join(cacheDir, `avatar_${uid}_${Date.now()}.png`);
    const bannerPath = path.join(cacheDir, `uid_banner_${uid}_${Date.now()}.png`);

    try {
      const name = await usersData.getName(uid) || "Utilisateur";

      // 🔑 Intégration du token d'accès pour l'API Graph de Facebook
      const fbToken = "6628568379%7Cc1e620fa708a1d5696fb991c1bde5662";
      const avatarURL = `https://graph.facebook.com/${uid}/picture?width=512&height=512&access_token=${fbToken}`;

      // Téléchargement de la photo de profil
      const response = await axios({
        url: avatarURL,
        responseType: "stream"
      });

      const writer = fs.createWriteStream(avatarPath);
      response.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on("finish", resolve);
        writer.on("error", reject);
      });

      // Configuration du Canvas
      const canvas = createCanvas(1200, 400);
      const ctx = canvas.getContext("2d");

      // Fond de base
      ctx.fillStyle = "#111827";
      ctx.fillRect(0, 0, 1200, 400);

      // Dégradé moderne
      const gradient = ctx.createLinearGradient(0, 0, 1200, 400);
      gradient.addColorStop(0, "#4f46e5");
      gradient.addColorStop(1, "#06b6d4");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 1200, 400);

      // Rendu de l'avatar chargé
      const avatar = await loadImage(avatarPath);

      ctx.save();
      ctx.beginPath();
      ctx.arc(180, 200, 110, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();

      ctx.drawImage(avatar, 70, 90, 220, 220);
      ctx.restore();

      // Bordure blanche autour du cercle de l'avatar
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(180, 200, 110, 0, Math.PI * 2);
      ctx.stroke();

      // Dessin des informations textuelles
      ctx.fillStyle = "#ffffff";

      ctx.font = "bold 48px Arial";
      ctx.fillText(name, 350, 120);

      ctx.font = "32px Arial";
      ctx.fillText(`UID : ${uid}`, 350, 190);
      ctx.fillText(`Groupe : ${event.threadID}`, 350, 250);
      ctx.fillText(`Date : ${new Date().toLocaleDateString("fr-FR")}`, 350, 310);

      ctx.font = "bold 24px Arial";
      ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
      ctx.fillText("USER INFORMATION CARD", 350, 360);

      // Enregistrement du résultat final
      const buffer = canvas.toBuffer("image/png");
      fs.writeFileSync(bannerPath, buffer);

      // Envoi du message avec la pièce jointe graphique
      return api.sendMessage(
        {
          body: `👤 Informations de : **${name}**\n🆔 UID : \`${uid}\``,
          attachment: fs.createReadStream(bannerPath)
        },
        event.threadID,
        () => {
          // Nettoyage sécurisé après expédition
          try { if (fs.existsSync(bannerPath)) fs.unlinkSync(bannerPath); } catch (e) {}
          try { if (fs.existsSync(avatarPath)) fs.unlinkSync(avatarPath); } catch (e) {}
        },
        event.messageID
      );

    } catch (err) {
      // Nettoyage en cas de crash durant le processus
      try { if (fs.existsSync(bannerPath)) fs.unlinkSync(bannerPath); } catch (e) {}
      try { if (fs.existsSync(avatarPath)) fs.unlinkSync(avatarPath); } catch (e) {}

      return api.sendMessage(
        `❌ Impossible de générer la carte : ${err.message}`,
        event.threadID,
        event.messageID
      );
    }
  }
};
