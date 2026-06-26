const sleep = ms => new Promise(r => setTimeout(r, ms));

// Système d'extraction local au cas où findUid rencontre des restrictions d'URL Facebook
function extractUIDLocal(input) {
  if (!input) return null;
  const cleanInput = input.trim();
  if (/^\d+$/.test(cleanInput)) return cleanInput;
  const idMatch = cleanInput.match(/[?&]id=(\d+)/);
  if (idMatch) return idMatch[1];
  const slashMatch = cleanInput.match(/\/(\d+)(?:\/|\?|$)/);
  if (slashMatch) return slashMatch[1];
  return null;
}

module.exports = {
  config: {
    name: "add",
    aliases: ["aadd", "addmember"],
    version: "3.0.0",
    author: "Shade × Gemini",
    role: 2,
    description: "⚡ Ajouter des membres via UID ou Lien avec interface Cyber Émeraude",
    category: "system"
  },

  langs: {
    fr: {
      notOwner: "⛔ **[ACCÈS REFUSÉ]** Terminal sécurisé. Seul le Fondateur Suprême possède les clés de contournement.",
      usage: "💡 **[INFO TERMINAL]** Syntaxe requise : `add [UID ou Lien du profil]`",
      processing: "⏳ **[INITIALISATION]** Connexion à la passerelle Facebook... Tentative d'injection des utilisateurs.",
      result: "⚡ **[RAPPORT DE TRANSIT CYBER]**\n━━━━━━━━━━━━━━━━━\n🟩 Membres injectés : %1\n🟥 Échecs / Rejets : %2"
    }
  },

  onStart: async function ({ message, api, event, args, threadsData, getLang }) {
    const { threadID, messageID, senderID } = event;
    const OWNER_ID = "61573867120837";

    // 🔒 Sécurité d'accès strict
    if (senderID !== OWNER_ID) {
      return message.reply(getLang("notOwner"));
    }

    if (args.length === 0) {
      return message.reply(getLang("usage"));
    }

    try {
      try { api.setMessageReaction("⏳", messageID, () => {}, true); } catch(e){}
      await message.reply(getLang("processing"));

      const threadInfo = await threadsData.get(threadID) || {};
      const members = threadInfo.members || [];
      
      let successCount = 0;
      let failedCount = 0;

      for (const item of args) {
        let uid = extractUIDLocal(item);

        // Si l'extraction locale échoue et que global.utils.findUid est disponible
        if (!uid && global.utils?.findUid && /(?:https?:\/\/)?(?:www\.)?(?:facebook|fb)\.com\/.*/i.test(item)) {
          try {
            uid = await global.utils.findUid(item);
          } catch (err) {
            uid = null;
          }
        }

        if (!uid) {
          failedCount++;
          continue;
        }

        // Vérification si l'utilisateur est déjà présent dans le groupe
        if (members.some(m => m.userID == uid && m.inGroup)) {
          failedCount++;
          continue;
        }

        try {
          await api.addUserToGroup(uid, threadID);
          successCount++;
          await sleep(1200); // Délai de sécurité pour éviter le spam block de Facebook
        } catch (addError) {
          failedCount++;
        }
      }

      // Réaction finale selon le succès
      if (successCount > 0) {
        try { api.setMessageReaction("✅", messageID, () => {}, true); } catch(e){}
      } else {
        try { api.setMessageReaction("❌", messageID, () => {}, true); } catch(e){}
      }

      return message.reply(getLang("result", successCount, failedCount));

    } catch (globalError) {
      console.error(globalError);
      try { api.setMessageReaction("❌", messageID, () => {}, true); } catch(e){}
      return message.reply("❌ Une erreur critique est survenue durant l'exécution du script.");
    }
  }
};
