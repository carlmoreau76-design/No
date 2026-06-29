const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

// Base de données temporaire en mémoire pour stocker les prisonniers par groupe
if (!global.prisonDatabase) {
  global.prisonDatabase = new Map();
}

module.exports = {
  config: {
    name: "prison",
    aliases: ["jail"],
    version: "8.0.0",
    author: "Shade × AI",
    role: 0, // Accessible par tous pour payer, mais sécurisé à l'intérieur pour l'ajout
    category: "economy",
    guide: {
      fr: "{p}{n} add [@tag/reply] : Envoyer en prison (Admin)\n{p}{n} pay : Payer sa caution (100k)\n{p}{n} list : Voir les prisonniers"
    }
  },

  // ========================================================
  // 🔒 INTERCEPTION GLOBALE (Bloque les autres commandes)
  // ========================================================
  onChat: async function ({ event, message, api }) {
    const { threadID, senderID, body } = event;
    const prefix = global.GoatBot.config.prefix || "!";

    if (!global.prisonDatabase.has(threadID)) return;
    const db = global.prisonDatabase.get(threadID);

    // Si l'utilisateur est en prison
    if (db[senderID]) {
      // Autoriser UNIQUEMENT la commande précise pour sortir (ex: !prison pay ou !jail pay)
      const isTryingToEscape = body && (
        body.toLowerCase().startsWith(`${prefix}prison pay`) || 
        body.toLowerCase().startsWith(`${prefix}jail pay`)
      );

      if (!isTryingToEscape) {
        return message.reply("⛓️ **ACCÈS INTERDIT** : Tu es actuellement en prison ! Seule la commande `/prison pay` pour régler ta caution de 100,000 $ est autorisée.");
      }
    }
  },

  // ========================================================
  // 🎮 LOGIQUE PRINCIPALE DE LA COMMANDE
  // ========================================================
  onStart: async function ({ event, message, args, api, usersData }) {
    const { threadID, senderID } = event;
    const action = args[0]?.toLowerCase();

    if (!global.prisonDatabase.has(threadID)) {
      global.prisonDatabase.set(threadID, {});
    }
    const db = global.prisonDatabase.get(threadID);

    // ────────────────────────────────────────────────────────
    // 🚔 AJOUTER EN PRISON (Seulement les admins du groupe)
    // ────────────────────────────────────────────────────────
    if (action === "add") {
      try {
        // Vérification des droits d'administrateur du groupe
        const threadInfo = await api.getThreadInfo(threadID);
        const adminIDs = threadInfo.adminIDs.map(item => item.id);
        const isGroupAdmin = adminIDs.includes(senderID);
        const isBotOwner = senderID === "61573867120837"; // Votre ID Owner

        if (!isGroupAdmin && !isBotOwner) {
          return message.reply("⛔ **Erreur** : Seuls les administrateurs de ce groupe peuvent envoyer un membre en prison.");
        }

        // cibler l'utilisateur par tag ou par réponse de message
        const targetID = Object.keys(event.mentions)[0] || event.messageReply?.senderID;

        if (!targetID) {
          return message.reply("⚠️ Veuillez taguer un utilisateur ou répondre à son message pour l'envoyer en prison.");
        }

        if (db[targetID]) {
          return message.reply("🚔 Cet utilisateur est déjà sous les verrous.");
        }

        // Ajout à la base de données de la prison
        db[targetID] = {
          jailed: true,
          time: Date.now()
        };

        // Génération de l'image montage de la prison
        const uData = await usersData.get(targetID);
        const name = uData.name || "L'utilisateur";
        const avatar = await usersData.getAvatarUrl(targetID);

        const tmpDir = path.join(__dirname, "tmp");
        await fs.ensureDir(tmpDir);
        const filePath = path.join(tmpDir, `${targetID}.png`);

        try {
          const img = await axios.get(
            `https://api.popcat.xyz/jail?image=${encodeURIComponent(avatar)}`,
            { responseType: "arraybuffer" }
          );
          await fs.outputFile(filePath, img.data);

          return message.reply({
            body: `🚔 🚨 **🚨 INCARCÉRATION 🚨**\n\n${name} a été envoyé en prison par un administrateur ! Ses accès aux commandes sont suspendus jusqu'au paiement de sa caution.`,
            attachment: fs.createReadStream(filePath)
          });
        } catch (error) {
          return message.reply(`🚔 🚨 **🚨 INCARCÉRATION 🚨**\n\n${name} a été envoyé en prison ! (Impossible d'afficher la photo d'écrou).`);
        }

      } catch (err) {
        console.error(err);
        return message.reply("❌ Impossible de vérifier les permissions ou d'ajouter le membre.");
      }
    }

    // ────────────────────────────────────────────────────────
    // 💰 PAYER LA CAUTION (100,000 $)
    // ────────────────────────────────────────────────────────
    if (action === "pay") {
      if (!db[senderID]) {
        return message.reply("🔒 Vous n'êtes pas en prison, votre casier est vierge.");
      }

      const fine = 100000;
      const userData = await usersData.get(senderID);
      const currentMoney = userData.money || 0;

      if (currentMoney < fine) {
        return message.reply(`💔 **Caution refusée** : Vous n'avez pas assez d'argent. Il vous faut **100,000 $** sur votre portefeuille (Solde actuel : ${currentMoney} $).`);
      }

      // Déduction de l'argent via usersData
      await usersData.set(senderID, {
        money: currentMoney - fine
      });

      // Retrait de la prison
      delete db[senderID];

      return message.reply(`🚪 ✨ **LIBÉRATION** : Vous avez payé votre caution de **100,000 $**. Vous êtes libre et vos accès aux commandes du bot sont rétablis !`);
    }

    // ────────────────────────────────────────────────────────
    // 📜 LISTE DES PRISONNIERS
    // ────────────────────────────────────────────────────────
    if (action === "list") {
      let activeJails = Object.keys(db);
      if (activeJails.length === 0) {
        return message.reply("🕊️ La prison de ce groupe est actuellement vide.");
      }

      let text = "🚔 📄 **LISTE DES PRISONNIERS ACTUELS**\n────────────────────\n";
      for (const uid of activeJails) {
        const uData = await usersData.get(uid);
        text += `⛓️ ▪️ ${uData.name || uid}\n`;
      }
      text += "────────────────────\n💡 Pour sortir, les détenus doivent taper : `/prison pay`";
      
      return message.reply(text);
    }

    // Si aucune action valide n'est spécifiée
    return message.reply("⚠️ **Commande incomplète**. Options valides :\n» `/prison list` (Voir les détenus)\n» `/prison pay` (Si vous êtes enfermé)");
  }
};
