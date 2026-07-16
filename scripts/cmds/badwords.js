module.exports = {
  config: {
    name: "badwords",
    aliases: ["badword", "filter"],
    version: "7.0.0",
    author: "Shade × Gemini",
    countDown: 5,
    role: 2,
    description: "Système de sécurité contre les termes interdits et la modération automatique",
    category: "security"
  },

  langs: {
    fr: {
      noPermission: "❌ Accès refusé. Seul l'administrateur principal peut configurer ce module.",
      added: "✓ Terme ajouté à la liste de filtrage : \"%1\"",
      deleted: "✓ Terme supprimé de la liste de filtrage : \"%1\"",
      listEmpty: "📦 Aucun mot interdit n'est actuellement enregistré pour ce groupe.",
      list: "╭─ 🪐 𝗙𝗜𝗟𝗧𝗘𝗥 𝗟𝗜𝗦𝗧 ─╮\n\n%1\n\n╰──────────────────╯",
      on: "✓ Système de sécurité [BadWords] activé avec succès.",
      off: "❌ Système de sécurité [BadWords] désactivé.",
      warn1: "⚠️ Avertissement de sécurité.\n• Membre : %1\n• Motif : Terme restreint détecté (\"%2\").\n• Statut : Prochaine infraction entraînera une exclusion.",
      kicked: "✓ L'utilisateur %1 a été exclu du groupe pour récidive.",
      emojiSpam: "🚫 Alerte de modération : Spam d'émojis détecté (%1x identiques). Veuillez stabiliser le flux de discussion.",
      needAdmin: "⚠️ Action impossible. Le bot nécessite des privilèges d'administrateur pour exécuter l'exclusion."
    }
  },

  onStart: async function ({ message, event, args, threadsData, getLang }) {
    const OWNER_ID = "61573867120837";
    
    if (event.senderID !== OWNER_ID) {
      return message.reply(getLang("noPermission"));
    }

    // Initialisation sécurisée de la structure des données
    let data = await threadsData.get(event.threadID, "data.badWords") || {};
    if (!data.words) data.words = [];
    if (!data.warns) data.warns = {};

    const action = args[0]?.toLowerCase();

    switch (action) {
      // ➕ AJOUTER UN MOT
      case "add": {
        const word = args.slice(1).join(" ").toLowerCase().trim();
        if (!word) return message.reply("❌ Veuillez spécifier le terme à interdire.");
        
        if (!data.words.includes(word)) {
          data.words.push(word);
        }
        
        await threadsData.set(event.threadID, data, "data.badWords");
        return message.reply(getLang("added", word));
      }

      // 🗑️ SUPPRIMER UN MOT
      case "del":
      case "delete": {
        const word = args.slice(1).join(" ").toLowerCase().trim();
        if (!word) return message.reply("❌ Veuillez spécifier le terme à retirer.");
        
        if (!data.words.includes(word)) {
          return message.reply("❌ Ce mot ne figure pas dans la liste globale.");
        }

        data.words = data.words.filter(w => w !== word);
        await threadsData.set(event.threadID, data, "data.badWords");
        return message.reply(getLang("deleted", word));
      }

      // 📜 LISTE DES MOTS
      case "list": {
        if (!data.words.length) return message.reply(getLang("listEmpty"));
        return message.reply(
          getLang("list", data.words.map(w => ` │ • ${w}`).join("\n"))
        );
      }

      // 🟢 ACTIVER
      case "on": {
        await threadsData.set(event.threadID, true, "settings.badWords");
        return message.reply(getLang("on"));
      }

      // 🔴 DÉSACTIVER
      case "off": {
        await threadsData.set(event.threadID, false, "settings.badWords");
        return message.reply(getLang("off"));
      }

      default:
        return message.reply("💡 Options disponibles : `add [mot]`, `del [mot]`, `list`, `on`, `off`.");
    }
  },

  onChat: async function ({ event, message, api, threadsData, getLang }) {
    if (!event.body || event.senderID === api.getCurrentUserID()) return;

    const enabled = await threadsData.get(event.threadID, "settings.badWords");
    if (!enabled) return;

    const data = await threadsData.get(event.threadID, "data.badWords") || {};
    const words = data.words || [];
    const warns = data.warns || {};
    const body = event.body.toLowerCase();

    // 🕵️ DÉTECTION DES TERMES INTERDITS
    for (const word of words) {
      if (body.includes(word)) {
        if (!warns[event.senderID]) {
          warns[event.senderID] = 1;
          data.warns = warns;
          
          await threadsData.set(event.threadID, data, "data.badWords");
          return message.reply(getLang("warn1", `@${event.senderID}`, word));
        } else {
          // Récidive : Tentative d'expulsion
          try {
            await api.removeUserFromGroup(event.senderID, event.threadID);
            
            // Réinitialisation des avertissements de l'utilisateur après le kick
            delete warns[event.senderID];
            data.warns = warns;
            await threadsData.set(event.threadID, data, "data.badWords");

            return message.reply(getLang("kicked", `@${event.senderID}`));
          } catch (err) {
            return message.reply(getLang("needAdmin"));
          }
        }
      }
    }

    // 🛡️ DÉTECTION DU SPAM D'ÉMOJIS IDENTIQUES
    const emojiRegex = /([\p{Emoji_Presentation}\p{Extended_Pictographic}])/gu;
    const emojis = body.match(emojiRegex);
    
    if (emojis && emojis.length >= 10) {
      const firstEmoji = emojis[0];
      const isSameSpam = emojis.every(e => e === firstEmoji);
      
      if (isSameSpam) {
        return message.reply(getLang("emojiSpam", emojis.length));
      }
    }
  }
};
