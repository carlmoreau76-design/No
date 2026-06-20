const OWNER_ID = "61573867120837";

// Fonction pour abréger les montants (ex: 5000 -> 5K)
function formatMoneyShort(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(0) + "M";
  if (num >= 1000) return (num / 1000).toFixed(0) + "K";
  return num;
}

module.exports = {
  config: {
    name: "topwipe",
    version: "1.2",
    author: "Shade × ChatGPT",
    role: 2,
    category: "admin",
    shortDescription: "Réinitialise le portefeuille des top joueurs ou d'un utilisateur cible (Owner uniquement)",
    guide: "{pn} [all] ou {pn} [@mention / ID / reply]"
  },

  onStart: async function ({ message, event, args, usersData }) {
    const { senderID, mentions, messageReply } = event;

    // 🔒 SÉCURITÉ STRICTE
    if (senderID !== OWNER_ID) {
      return message.reply("❌ Accès refusé. Cette commande est réservée au propriétaire principal.");
    }

    const action = args[0];

    // ==========================================
    // 🌐 MODE 1 : GLOBAL WIPE (TOP 10 RICHEST)
    // ==========================================
    if (action === "all") {
      message.reply("⏳ Analyse du classement et réinitialisation du Top 10 en cours...");

      try {
        const allUsers = await usersData.getAll();
        if (!allUsers || allUsers.length === 0) {
          return message.reply("❌ Aucun utilisateur trouvé dans la base de données.");
        }

        // Tri par argent (user.money)
        const topRichest = allUsers
          .filter(u => u && u.userID)
          .sort((a, b) => (b.money || 0) - (a.money || 0))
          .slice(0, 10);

        let detailsText = "🔄 Reset effectué pour les 10 premiers du top :\n\n";

        for (const user of topRichest) {
          const currentData = await usersData.get(user.userID);
          if (currentData) {
            const previousMoney = currentData.money || 0;
            const name = currentData.name || `Utilisateur`;
            
            // Remise à zéro sécurisée
            await usersData.set(user.userID, {
              ...currentData,
              money: 0
            });
            
            const oldMoneyFormatted = formatMoneyShort(previousMoney);
            detailsText += `• ${name} (${user.userID}) : ${oldMoneyFormatted}$ ➜ 0$\n`;
          }
        }

        return message.reply(detailsText.trim());
      } catch (err) {
        console.error(err);
        return message.reply("💔 Une erreur est survenue lors du wipe global du Top 10.");
      }
    }

    // ==========================================
    // 🎯 MODE 2 : TARGETED WIPE (CIBLE UNIQUE)
    // ==========================================
    const targetID = Object.keys(mentions)[0] || action || messageReply?.senderID;

    if (!targetID) {
      return message.reply("💡 **Utilisation :**\n• `/topwipe all` pour réinitialiser le Top 10.\n• `/topwipe @mention` pour cibler quelqu'un.\n• `/topwipe [ID]` pour cibler par identifiant.\n• Répondre à un message avec `/topwipe`");
    }

    try {
      const targetData = await usersData.get(targetID);
      if (!targetData) {
        return message.reply(`❌ Impossible de trouver les données pour l'UID : ${targetID}`);
      }

      const previousMoney = targetData.money || 0;
      const targetName = targetData.name || `Utilisateur`;

      await usersData.set(targetID, {
        ...targetData,
        money: 0
      });

      const oldMoneyFormatted = formatMoneyShort(previousMoney);
      return message.reply(`🔄 Reset effectué pour l'utilisateur cible :\n\n• ${targetName} (${targetID}) : ${oldMoneyFormatted}$ ➜ 0$`);

    } catch (err) {
      console.error(err);
      return message.reply(`💔 Une erreur est survenue lors de la réinitialisation de la cible (${targetID}).`);
    }
  }
};
