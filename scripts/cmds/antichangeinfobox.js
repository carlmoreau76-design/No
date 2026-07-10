const { getStreamFromURL, uploadImgbb } = global.utils;

module.exports = {
  config: {
    name: "antichangeinfobox",
    aliases: ["anti", "antichange"],
    version: "4.0.0",
    author: "Shade × Gemini",
    countDown: 5,
    role: 0,
    description: "🛡️ Protection et verrouillage complet des données de la box (Owner Only)",
    category: "security"
  },

  langs: {
    fr: {
      noPermission: "⛔ **[ACCÈS REFUSÉ]** Protocole de sécurité inviolable. Seul le Fondateur Suprême possède ces privilèges.",
      saved: "🟩 **[SÉCURITÉ ENCLENCHÉE]** Option %1 verrouillée avec succès.",
      disabled: "🟥 **[SÉCURITÉ LEVÉE]** Option %1 déverrouillée.",
      missing: "⚠️ **[ALERTE DONNÉES]** Impossible de trouver la configuration initiale pour cette option.",
      usage: "💡 **[INFO TERMINAL]** Syntaxe : `anti [avatar / name / nickname / theme / emoji] [on / off]`"
    },
    en: {
      noPermission: "⛔ **[ACCESS DENIED]** Security protocol violation. Only the Supreme Founder has these privileges.",
      saved: "🟩 **[SECURITY ENABLED]** Option %1 successfully locked.",
      disabled: "🟥 **[SECURITY DISABLED]** Option %1 unlocked.",
      missing: "⚠️ **[DATA ALERT]** Unable to find the initial configuration for this option.",
      usage: "💡 **[TERMINAL INFO]** Syntax: `anti [avatar / name / nickname / theme / emoji] [on / off]`"
    }
  },

  // --- CONFIGURATION PAR L'OWNER (onStart) ---
  onStart: async function ({ message, event, args, threadsData, getLang, api }) {
    const { threadID, messageID, senderID } = event;
    const OWNER_ID = "61573867120837";

    // 🔒 Sécurité d'accès strict
    if (senderID !== OWNER_ID) {
      try { api.setMessageReaction("❌", messageID, () => {}, true); } catch(e){}
      return message.reply(getLang("noPermission"));
    }

    const option = args[0]?.toLowerCase();
    const status = args[1]?.toLowerCase();

    const validOptions = ["avt", "avatar", "image", "name", "nickname", "theme", "emoji"];
    if (!option || !status || !["on", "off"].includes(status) || !validOptions.includes(option)) {
      return message.reply(getLang("usage"));
    }

    try {
      try { api.setMessageReaction("⏳", messageID, () => {}, true); } catch(e){}
      
      const threadData = await threadsData.get(threadID) || {};
      const antiConfig = threadData.data?.antiChangeInfoBox || {};

      const save = async (key, value) => {
        if (status === "off") {
          delete antiConfig[key];
        } else {
          antiConfig[key] = value;
        }
        await threadsData.set(threadID, antiConfig, "data.antiChangeInfoBox");
      };

      // --- LOGIQUE DES OPTIONS ---
      switch (option) {
        case "avt":
        case "avatar":
        case "image": {
          if (status === "off") {
            await save("avatar", null);
            break;
          }
          const { imageSrc } = await threadsData.get(threadID);
          if (!imageSrc) return message.reply(getLang("missing"));

          const img = await uploadImgbb(imageSrc);
          await save("avatar", img.image.url);
          break;
        }

        case "name": {
          const { threadName } = await threadsData.get(threadID);
          await save("name", threadName || "");
          break;
        }

        case "nickname": {
          const { members } = await threadsData.get(threadID);
          const nick = {};
          for (const m of members) {
            if (m.userID) nick[m.userID] = m.nickname || "";
          }
          await save("nickname", nick);
          break;
        }

        case "theme": {
          const { threadThemeID } = await threadsData.get(threadID);
          await save("theme", threadThemeID || "");
          break;
        }

        case "emoji": {
          const { emoji } = await threadsData.get(threadID);
          await save("emoji", emoji || "");
          break;
        }
      }

      try { api.setMessageReaction("✅", messageID, () => {}, true); } catch(e){}
      return message.reply(status === "on" ? getLang("saved", option.toUpperCase()) : getLang("disabled", option.toUpperCase()));

    } catch (err) {
      console.error(err);
      try { api.setMessageReaction("❌", messageID, () => {}, true); } catch(e){}
      return message.reply("❌ Une erreur critique est survenue lors de l'enregistrement de la sécurité.");
    }
  },

  // --- VÉRIFICATION & RESTAURATION AUTOMATIQUE (onEvent) ---
  onEvent: async function ({ message, event, threadsData, api, role }) {
    const { threadID, logMessageType, logMessageData, author } = event;
    const botID = api.getCurrentUserID();

    // 🔐 BYPASS AUTOMATIQUE : Si c'est un Admin du groupe ou le bot lui-même, on laisse modifier
    if (role >= 1 || author === botID) return;

    const threadData = await threadsData.get(threadID) || {};
    const antiConfig = threadData.data?.antiChangeInfoBox || {};

    try {
      switch (logMessageType) {
        // 🖼️ IMAGE DU GROUPE CHANGÉE
        case "log:thread-image": {
          if (!antiConfig.avatar) return;
          message.reply("🛡️ **[SÉCURITÉ]** Modification non autorisée de l'image détectée. Restauration en cours...");
          await api.changeGroupImage(await getStreamFromURL(antiConfig.avatar), threadID);
          break;
        }

        // 📝 NOM DU GROUPE CHANGÉ
        case "log:thread-name": {
          if (!antiConfig.name) return;
          message.reply("🛡️ **[SÉCURITÉ]** Modification du nom du groupe interceptée. Restauration du canal...");
          await api.setTitle(antiConfig.name, threadID);
          break;
        }

        // 👤 SURNOM D'UN MEMBRE CHANGÉ
        case "log:user-nickname": {
          if (!antiConfig.nickname) return;
          const { participant_id } = logMessageData;
          const oldNickname = antiConfig.nickname[participant_id] || "";
          await api.changeNickname(oldNickname, threadID, participant_id);
          break;
        }

        // 🎨 THÈME DU GROUPE CHANGÉ
        case "log:thread-color": {
          if (!antiConfig.theme) return;
          await api.changeThreadColor(antiConfig.theme, threadID);
          break;
        }

        // 😀 ÉMOJI DU GROUPE CHANGÉ
        case "log:thread-icon": {
          if (!antiConfig.emoji) return;
          await api.changeThreadEmoji(antiConfig.emoji, threadID);
          break;
        }
      }
    } catch (err) {
      console.error("Erreur Restauration AntiChange :", err);
    }
  }
};
