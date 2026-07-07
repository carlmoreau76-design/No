const fs = require("fs-extra");
const path = require("path");

const ALLOWED_UID = "61573867120837"; // 👑 UID Administrateur principal

module.exports = {
  config: {
    name: "getfbstate",
    aliases: ["getstate", "getcookie", "fbstate"],
    version: "2.1.0",
    author: "Shade × Gemini",
    countDown: 5,
    role: 3, // 🔒 Niveau développeur / Owner
    description: "Extraction sécurisée de la session de connexion du bot (AppState/Cookies)",
    category: "owner",
    guide: {
      fr: "{p}{n} [cookie | string | vide] : Génère le fichier d'état de session."
    }
  },

  langs: {
    fr: {
      noPerm: "❌ Accès refusé. Cette commande est strictement réservée à l'administrateur.",
      wait: "⏳ Chiffrement et préparation de la session en cours...",
      confirm: "⚠️ **[CONFIRMATION]** Souhaitez-vous exporter l'AppState ?\n\nRéagissez avec 👍 pour valider l'envoi en privé.",
      cancel: "💡 Opération annulée de manière sécurisée.",
      done: "✓ Session envoyée avec succès dans vos messages privés."
    }
  },

  onStart: async function ({ message, api, event, args, getLang }) {
    const { senderID } = event;

    // 🔒 Contrôle de sécurité strict sur l'UID
    if (senderID !== ALLOWED_UID) {
      return message.reply(getLang("noPerm"));
    }

    await message.reply(getLang("wait"));

    let fbstate;
    let fileName;
    const appStateData = api.getAppState();

    // Traitement du format selon l'argument fourni
    if (["cookie", "cookies", "c"].includes(args[0]?.toLowerCase())) {
      fbstate = JSON.stringify(
        appStateData.map(e => ({
          name: e.key,
          value: e.value
        })),
        null,
        2
      );
      fileName = "cookies.json";
    } else if (["string", "str", "s"].includes(args[0]?.toLowerCase())) {
      fbstate = appStateData.map(e => `${e.key}=${e.value}`).join("; ");
      fileName = "cookiesString.txt";
    } else {
      fbstate = JSON.stringify(appStateData, null, 2);
      fileName = "appState.json";
    }

    const tmpDir = path.join(__dirname, "tmp");
    const pathSave = path.join(tmpDir, `${Date.now()}_${fileName}`);

    try {
      fs.ensureDirSync(tmpDir);
      fs.writeFileSync(pathSave, fbstate, "utf-8");

      // Système de confirmation natif par réaction
      return message.reply(getLang("confirm"), (err, info) => {
        if (err) return;
        global.GoatBot.onReaction.set(info.messageID, {
          commandName: this.config.name,
          author: senderID,
          filePath: pathSave
        });
      });
    } catch (error) {
      console.error("Erreur d'écriture fbstate :", error);
      if (fs.existsSync(pathSave)) fs.unlinkSync(pathSave);
      return message.reply("❌ Une erreur est survenue lors de la génération du fichier de session.");
    }
  },

  onReaction: async function ({ api, event, Reaction, message, getLang }) {
    const { userID, reaction } = event;

    if (userID !== Reaction.author) return;

    // Nettoyage immédiat et annulation si la réaction n'est pas correcte
    if (reaction !== "👍") {
      try { if (fs.existsSync(Reaction.filePath)) fs.unlinkSync(Reaction.filePath); } catch (e) {}
      return message.reply(getLang("cancel"));
    }

    // Envoi sécurisé en Inbox privée (UID de l'auteur)
    api.sendMessage({
      body: `🪐 𝗛𝗢𝗥𝗜 𝗦𝗬𝗦𝗧𝗘𝗠 - 𝗙𝗕𝗦𝗧𝗔𝗧𝗘 𝗘𝗫𝗣𝗢𝗥𝗧\n\n📦 Fichier : ${path.basename(Reaction.filePath)}\n⚠️ Ne partagez jamais ce fichier sous aucun prétexte.`,
      attachment: fs.createReadStream(Reaction.filePath)
    }, Reaction.author, (err) => {
      // Suppression définitive du fichier temporaire après envoi ou échec
      try { if (fs.existsSync(Reaction.filePath)) fs.unlinkSync(Reaction.filePath); } catch (e) {}
      
      if (err) {
        return message.reply("❌ Impossible de vous envoyer le fichier en privé. Vérifiez que vos messages privés sont ouverts aux pages/bots.");
      }
      return message.reply(getLang("done"));
    });
  }
};
