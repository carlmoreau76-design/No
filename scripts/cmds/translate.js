const axios = require('axios');
const defaultEmojiTranslate = "🌐";

module.exports = {
  config: {
    name: "translate",
    aliases: ["trans", "tr"],
    version: "2.1.0",
    author: "NTKhang | Fixed by Shade & Gemini",
    countDown: 5,
    role: 0,
    description: "Traduction de texte via l'API Google Translate",
    category: "utility",
    guide: {
      fr: "• Répondre à un message + {pn} [langue] → Traduit le message ciblé\n• {pn} [langue] [texte] → Traduit le texte saisi\n• Options de réaction disponibles via -react"
    }
  },

  langs: {
    fr: {
      translateTo: "✓ Traduction automatique : %1 → %2",
      invalidArgument: "❌ Option invalide. Veuillez choisir entre 'on' et 'off'.",
      turnOnTransWhenReaction: `✓ Traduction par réaction activée.\nRéagissez avec "${defaultEmojiTranslate}" pour traduire un message.`,
      turnOffTransWhenReaction: "❌ Traduction par réaction désactivée.",
      inputEmoji: "🌐 Veuillez réagir avec l'emoji de votre choix pour le configurer.",
      emojiSet: "✓ L'emoji de traduction a été défini sur : %1"
    }
  },

  onStart: async function ({ message, event, args, threadsData, getLang, commandName }) {
    // ⚙️ CONFIGURATION DU MODE RÉACTION
    if (["-r", "-react", "-reaction"].includes(args[0]?.toLowerCase())) {
      if (args[1]?.toLowerCase() === "set") {
        return message.reply(getLang("inputEmoji"), (err, info) =>
          global.GoatBot.onReaction.set(info.messageID, {
            type: "setEmoji",
            commandName,
            messageID: info.messageID,
            authorID: event.senderID
          })
        );
      }

      const isEnable = args[1] === "on" ? true : args[1] === "off" ? false : null;
      if (isEnable === null) return message.reply(getLang("invalidArgument"));

      await threadsData.set(event.threadID, isEnable, "data.translate.autoTranslateWhenReaction");
      return message.reply(isEnable ? getLang("turnOnTransWhenReaction") : getLang("turnOffTransWhenReaction"));
    }

    let content;
    let langCodeTrans;
    const langOfThread = await threadsData.get(event.threadID, "data.lang") || global.GoatBot.config.language;

    // 📩 MODE 1 : RÉPONSE À UN MESSAGE
    if (event.messageReply) {
      content = event.messageReply.body;
      langCodeTrans = args[0] ? args[0].toLowerCase() : langOfThread;
    }
    // 📝 MODE 2 : TEXTE TRADITIONNEL
    else {
      if (args.length < 1) {
        return message.reply("❌ Syntaxe : /translate [langue] [texte] ou répondez à un message avec /translate [langue]");
      }

      langCodeTrans = args[0].toLowerCase();
      content = args.slice(1).join(" ");

      // Sécurité si l'utilisateur oublie de spécifier le code langue
      if (langCodeTrans.length > 3 || !content) {
        content = args.join(" ");
        langCodeTrans = langOfThread;
      }
    }

    if (!content) return message.reply("❌ Veuillez saisir un texte valide à traduire.");
    translateAndSendMessage(content, langCodeTrans, message, getLang);
  },

  onReaction: async ({ message, Reaction, event, threadsData, getLang }) => {
    const emojiTrans = await threadsData.get(event.threadID, "data.translate.emojiTranslate") || defaultEmojiTranslate;
    
    if (event.reaction === emojiTrans) {
      const langCodeTrans = await threadsData.get(event.threadID, "data.lang") || global.GoatBot.config.language;
      const content = Reaction.body;
      
      Reaction.delete();
      translateAndSendMessage(content, langCodeTrans, message, getLang);
    }
  }
};

// 🌐 MOTEUR DE TRADUCTION GOOGLE
async function translate(text, langCode) {
  try {
    const res = await axios.get(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${langCode}&dt=t&q=${encodeURIComponent(text)}`
    );
    return {
      text: res.data[0].map(i => i[0]).join(''),
      lang: res.data[2]
    };
  } catch (error) {
    throw new Error("Erreur de liaison avec l'API de traduction.");
  }
}

// 📄 COMPOSITION DU RAPPORT DE TRADUCTION PRO
async function translateAndSendMessage(content, langCodeTrans, message, getLang) {
  try {
    const { text, lang } = await translate(content.trim(), langCodeTrans.trim());
    
    let responseMsg = `╭─ 🪐 𝗧𝗥𝗔𝗡𝗦𝗟𝗔𝗧𝗜𝗢𝗡 𝗦𝗬𝗦𝗧𝗘𝗠 ─╮\n`;
    responseMsg += `│\n`;
    responseMsg += `│  "${text}"\n`;
    responseMsg += `│\n`;
    responseMsg += `├──────────────────────────┤\n`;
    responseMsg += `│ 🌐 Statut : ${getLang("translateTo", lang.toUpperCase(), langCodeTrans.toUpperCase())}\n`;
    responseMsg += `╰──────────────────────────╯`;

    return message.reply(responseMsg);
  } catch (err) {
    return message.reply("❌ Impossible de finaliser la traduction pour le moment.");
  }
}
