const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "load",
    aliases: ["reload", "refresh"],
    version: "1.0.0",
    role: 2, // Uniquement le développeur principal
    author: "AI Collaborator",
    description: "Recharge une ou toutes les commandes du bot pour appliquer les modifications",
    category: "owner",
    guide: {
      fr: "{p}{n} [all] ou [nom_commande]"
    },
    countDown: 2
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, messageID } = event;
    const target = args[0]?.toLowerCase();

    if (!target) {
      return api.sendMessage("⚠️ Spécifiez quoi charger. Exemple :\n`!load all` pour tout recharger.\n`!load ai` pour recharger uniquement la commande AI.", threadID, messageID);
    }

    // --- OPTION 1 : RECHARGER TOUTES LES COMMANDES ---
    if (target === "all") {
      try {
        const commandsPath = __dirname; // Dossier actuel (où se trouvent vos commandes)
        const files = fs.readdirSync(commandsPath).filter(file => file.endsWith(".js"));

        let successCount = 0;
        let failCount = 0;

        for (const file of files) {
          const filePath = path.join(commandsPath, file);
          
          try {
            // Supprimer le fichier du cache de Node.js pour forcer la relecture
            delete require.cache[require.resolve(filePath)];
            
            // Recharger le script
            const newCommand = require(filePath);
            
            if (newCommand && newCommand.config && newCommand.config.name) {
              global.GoatBot.commands.set(newCommand.config.name, newCommand);
              successCount++;
            } else {
              failCount++;
            }
          } catch (e) {
            console.error(`Erreur lors du chargement de ${file}:`, e);
            failCount++;
          }
        }

        return api.sendMessage(`🔄 **Rechargement complet réussi !**\n✅ Commandes chargées : ${successCount}\n❌ Échecs : ${failCount}\n\n✨ Ton menu help est maintenant à jour !`, threadID, messageID);
      } catch (err) {
        console.error(err);
        return api.sendMessage("❌ Une erreur critique est survenue lors du rechargement général.", threadID, messageID);
      }
    }

    // --- OPTION 2 : RECHARGER UNE SEULE COMMANDE PRÉCISE ---
    const commandsPath = __dirname;
    // Tente de trouver le fichier correspondant (avec ou sans l'extension .js écrite par l'utilisateur)
    const fileName = target.endsWith(".js") ? target : `${target}.js`;
    const filePath = path.join(commandsPath, fileName);

    if (!fs.existsSync(filePath)) {
      return api.sendMessage(`❌ Le fichier \`${fileName}\` est introuvable dans le dossier des commandes.`, threadID, messageID);
    }

    try {
      // Nettoyage du cache Node.js pour ce fichier précis
      delete require.cache[require.resolve(filePath)];
      
      // Chargement de la nouvelle version
      const newCommand = require(filePath);
      
      if (!newCommand || !newCommand.config || !newCommand.config.name) {
        return api.sendMessage(`❌ La structure du fichier \`${fileName}\` n'est pas compatible avec le bot.`, threadID, messageID);
      }

      // Remplacement dans la collection globale du bot
      global.GoatBot.commands.set(newCommand.config.name, newCommand);

      return api.sendMessage(`✅ La commande \`${newCommand.config.name}\` a été rechargée avec succès ! Les modifications sont appliquées.`, threadID, messageID);

    } catch (error) {
      console.error(error);
      return api.sendMessage(`❌ Erreur lors du rechargement de la commande \`${target}\`. Vérifie s'il y a des fautes de syntaxe dans son code.`, threadID, messageID);
    }
  }
};
