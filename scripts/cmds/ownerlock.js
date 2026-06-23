const fs = require("fs-extra");

module.exports = {
  config: {
    name: "ownerlock",
    aliases: ["lockall", "reunion"],
    version: "2.0.0",
    author: "Shade × Gemini",
    role: 2, // Limité aux Admins du bot / Owner
    category: "system",
    description: "Active ou désactive le mode réunion global en modifiant la configuration système du bot.",
    guide: {
      fr: "{p}{n} on → Active le mode réunion (Bloque tout le monde sauf Admins/VIP)\n{p}{n} off → Désactive le mode réunion"
    }
  },

  // --- COMMANDE DE CONTRÔLE (onStart) ---
  onStart: async function ({ args, message, event, api }) {
    const { senderID, messageID } = event;
    const OWNER_ID = "61573867120837";
    
    const { config: botConfig } = global.GoatBot;
    const { client } = global;

    // Vérification de sécurité stricte
    const isAdminBot = botConfig.adminBot?.includes(senderID);
    if (senderID !== OWNER_ID && !isAdminBot) {
      try { api.setMessageReaction("❌", messageID, () => {}, true); } catch(e){}
      return message.reply("⛔ [ACCÈS REFUSÉ] Droits insuffisants pour basculer le bot en mode réunion global.");
    }

    const action = args[0]?.toLowerCase();
    if (!action || !["on", "off"].includes(action)) {
      return message.reply("💡 Syntaxe requise : `ownerlock on` ou `ownerlock off`");
    }

    if (action === "on") {
      // 1. Activation du verrou global natif du bot
      botConfig.adminOnly.enable = true;
      // Desactiver la notification native pour la remplacer par notre message personnalisé dans onChat
      botConfig.hideNotiMessage.adminOnly = true; 
      
      global.ownerMeetingsLock = true;

      // Sauvegarde physique dans le fichier config.json
      fs.writeFileSync(client.dirConfig, JSON.stringify(botConfig, null, 2));

      try { api.setMessageReaction("🟩", messageID, () => {}, true); } catch(e){}
      return message.reply("🟩 **[MODE RÉUNION ACTIVÉ]** Le bot est désormais verrouillé globalement.\n\nSeuls les Owners, Admins et VIPs peuvent utiliser les commandes. Les membres normaux recevront le message de réunion.");
    } 
    
    if (action === "off") {
      // 2. Désactivation complète des verrous
      botConfig.adminOnly.enable = false;
      botConfig.hideNotiMessage.adminOnly = false;
      
      global.ownerMeetingsLock = false;

      // Sauvegarde physique dans le fichier config.json
      fs.writeFileSync(client.dirConfig, JSON.stringify(botConfig, null, 2));

      try { api.setMessageReaction("🔓", messageID, () => {}, true); } catch(e){}
      return message.reply("🔓 **[MODE RÉUNION DÉSACTIVÉ]** Fin de la réunion. Le bot est de nouveau accessible à tout le monde sur l'ensemble des groupes !");
    }
  },

  // --- LE PASSE-DROIT POUR LES VIPS & MESSAGE DE RÉUNION (onChat) ---
  onChat: async function ({ api, event }) {
    const { senderID, body, threadID, messageID } = event;
    const OWNER_ID = "61573867120837";
    const { config: botConfig } = global.GoatBot;

    if (!global.ownerMeetingsLock || !body) return;

    const prefix = botConfig.prefix || "/";

    if (body.startsWith(prefix)) {
      const isAdminBot = botConfig.adminBot?.includes(senderID);
      const isVIP = botConfig.vipuser?.includes(senderID);

      // CAS 1 : Si c'est un VIP, on désactive temporairement le verrou pour CE message
      if (senderID === OWNER_ID || isAdminBot || isVIP) {
        botConfig.adminOnly.enable = false;
        
        // On attend un cycle d'exécution (0ms) pour laisser GoatBot traiter la commande du VIP
        setTimeout(() => {
          if (global.ownerMeetingsLock) {
            botConfig.adminOnly.enable = true;
          }
        }, 0);
        return;
      }

      // CAS 2 : C'est un utilisateur normal, on affiche le message personnalisé de réunion
      try {
        try { api.setMessageReaction("⏳", messageID, () => {}, true); } catch(e){}
        
        return api.sendMessage(
          "⚠️ **[SYSTÈME VERROUILLÉ]**\n\nLes Owners et l'administration du bot sont actuellement en réunion. Les fonctionnalités publiques sont temporairement suspendues.\n\nVeuillez attendre la fin de la réunion pour utiliser le bot.",
          threadID,
          messageID
        );
      } catch (e) {
        console.error("Erreur log réunion :", e);
      }
    }
  }
};
