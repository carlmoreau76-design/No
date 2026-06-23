module.exports = {
  config: {
    name: "nickname",
    aliases: ["name", "rename", "setname"],
    version: "1.0.0",
    author: "Gemini × Shade",
    role: 0, // Tout le monde peut changer son propre nom
    category: "utility",
    description: "Modifie ton nom ou celui de la personne ciblée dans la base de données du bot",
    guide: {
      fr: "{p}{n} [nouveau nom] → Change votre nom dans le bot\n{p}{n} [reply] [nouveau nom] → Change le nom de la personne à qui vous répondez"
    },
    countDown: 3
  },

  onStart: async function ({ api, event, args, usersData, message }) {
    const { threadID, messageID, senderID, type, messageReply } = event;

    try {
      let targetID;
      let newName;

      // 1. VÉRIFICATION SI C'EST UN REPLY
      if (type === "message_reply" && messageReply) {
        targetID = messageReply.senderID;
        newName = args.join(" "); // Tout le texte devient le nouveau nom
      } else {
        // Sinon, l'utilisateur change son propre nom
        targetID = senderID;
        newName = args.join(" ");
      }

      // Sécurité : Vérifier qu'un nom a bien été écrit
      if (!newName || newName.trim() === "") {
        return message.reply("⚠️ Veuillez spécifier le nouveau nom. Exemple : `nickname Shade` ou en répondant à quelqu'un.");
      }

      newName = newName.trim();

      // 2. MISE À JOUR DANS LA BASE DE DONNÉES GLOBALE
      // On récupère d'abord les données existantes pour ne rien écraser d'autre (comme l'argent ou l'xp)
      const userData = await usersData.get(targetID) || {};
      
      // On applique le nouveau nom
      userData.name = newName;
      
      // Sauvegarde définitive dans les données du bot
      await usersData.set(targetID, userData);

      // 3. CONFIRMATION VISUELLE
      if (targetID === senderID) {
        return message.reply(`✨ **[MIGRATION NOMINALE]**\nVotre nom a été modifié avec succès. Vous êtes désormais enregistré sous le nom : **${newName}** dans tout le système.`);
      } else {
        const oldName = await usersData.getName(targetID) || "L'utilisateur";
        return message.reply(`✨ **[MIGRATION NOMINALE]**\nLe profil de l'utilisateur a été mis à jour. Son nom est désormais : **${newName}**.`);
      }

    } catch (err) {
      console.error("ERROR NICKNAME CMD:", err);
      return message.reply("❌ Une erreur est survenue lors de la modification du nom dans la matrice de données.");
    }
  }
};
