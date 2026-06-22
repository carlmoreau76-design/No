module.exports = {
  config: {
    name: "angeladminbox",
    aliases: ["angeladbox", "aadminbox", "adminbox"],
    version: "3.0.0",
    author: "Shade × Gemini",
    countDown: 5,
    role: 2,
    description: "🔒 Verrouiller ou déverrouiller l'accès complet au bot dans ce groupe (Owner Only)",
    category: "system"
  },

  langs: {
    fr: {
      on: "🟩 **[PROTECTION ENCLENCHÉE]** Terminal restreint. Le bot répond désormais uniquement aux requêtes du Fondateur Suprême dans ce canal.",
      off: "🔓 **[SÉCURITÉ DÉSACTIVÉE]** Terminal public. L'accès global au bot est rétabli pour tous les membres du groupe.",
      notOwner: "⛔ **[ACCÈS REFUSÉ]** Droits administratifs insuffisants pour modifier le protocole de sécurité du groupe.",
      usage: "💡 **[INFO TERMINAL]** Commande incomplète. Syntaxe requise : `angeladminbox [on / off]`"
    }
  },

  // --- LE VERROU EXÉCUTIF (onChat) ---
  // Bloque l'exécution de n'importe quelle autre commande si le mode est actif
  onChat: async function ({ api, event, threadsData }) {
    const { threadID, senderID, body } = event;
    const OWNER_ID = "61573867120837";

    // Si le message ne commence pas par un préfixe ou si c'est l'owner, on s'en fiche
    if (!body || senderID === OWNER_ID) return;

    const threadData = await threadsData.get(threadID) || {};
    const isLocked = threadData.data?.angelOnlyBox === true;

    // Si le groupe est verrouillé et qu'une commande est tentée par un membre normal
    if (isLocked && global.GoatBot?.config?.prefix && body.startsWith(global.GoatBot.config.prefix)) {
      // On intercepte silencieusement pour éviter de spammer le groupe
      try {
        api.setMessageReaction("🔏", event.messageID, () => {}, true);
      } catch (e) {}
      return; 
    }
  },

  // --- COMMANDE DE CONTRÔLE (onStart) ---
  onStart: async function ({ args, message, event, threadsData, getLang, api }) {
    const { threadID, messageID, senderID } = event;
    const OWNER_ID = "61573867120837";

    // 🔒 Sécurité d'accès strict
    if (senderID !== OWNER_ID) {
      try { api.setMessageReaction("❌", messageID, () => {}, true); } catch(e){}
      return message.reply(getLang("notOwner"));
    }

    const action = args[0]?.toLowerCase();

    if (!action || !["on", "off"].includes(action)) {
      return message.reply(getLang("usage"));
    }

    const value = action === "on";

    try {
      try { api.setMessageReaction("⏳", messageID, () => {}, true); } catch(e){}

      // Récupération et mise à jour sécurisée dans les métadonnées du thread
      const threadData = await threadsData.get(threadID) || {};
      if (!threadData.data) threadData.data = {};
      
      threadData.data.angelOnlyBox = value;

      await threadsData.set(threadID, threadData.data, "data");

      try { api.setMessageReaction("✅", messageID, () => {}, true); } catch(e){}
      return message.reply(value ? getLang("on") : getLang("off"));

    } catch (error) {
      console.error(error);
      try { api.setMessageReaction("❌", messageID, () => {}, true); } catch(e){}
      return message.reply("❌ Une erreur est survenue lors de la configuration du protocole de sécurité.");
    }
  }
};
