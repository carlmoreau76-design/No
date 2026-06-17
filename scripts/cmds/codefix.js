const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "codefix",
    aliases: ["fixcode", "repair"],
    version: "1.0.0",
    hasPermssion: 2, // Limité aux administrateurs du bot pour des raisons de sécurité
    credits: "Gemini AI",
    description: "Analyse, répare et sauvegarde une commande défectueuse",
    commandCategory: "system",
    usages: "/codefix [Nom_Commande] | [Message_Erreur] \n\nNote: Vous devez joindre le code de la commande dans le même message sous forme de bloc de texte.",
    cooldowns: 5
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, messageID, body } = event;

    // Séparation des arguments par le séparateur "|"
    const content = args.join(" ");
    if (!content.includes("|")) {
      return api.sendMessage(
        "❌ Format incorrect !\nUtilisation :\n`/codefix nom_cmd | l'erreur`\n*(N'oubliez pas de coller le code entier dans le message)*",
        threadID,
        messageID
      );
    }

    const parts = content.split("|");
    const cmdName = parts[0].trim();
    // Extraction de l'erreur (on nettoie le reste pour isoler le texte)
    const errorLog = parts[1].split("const")[0].split("module.exports")[0].trim();

    // Extraction du code source (tout ce qui se trouve après les blocs ou balises de code)
    const codeMatch = body.match(/```javascript([\s\S]*?)```/) || body.match(/```([\s\S]*?)```/);
    let rawCode = codeMatch ? codeMatch[1].trim() : null;

    if (!rawCode) {
      // Si l'utilisateur n'a pas mis de balises ```, on cherche le premier "module.exports" ou "const"
      const codeStartIndex = body.indexOf("module.exports") !== -1 ? body.indexOf("module.exports") : body.indexOf("const");
      if (codeStartIndex !== -1) {
        rawCode = body.substring(codeStartIndex).trim();
      }
    }

    if (!cmdName || !errorLog || !rawCode) {
      return api.sendMessage(
        "❌ Données manquantes. Assurez-vous d'avoir fourni :\n1. Le nom de la commande\n2. L'erreur reçue\n3. Le code complet.",
        threadID,
        messageID
      );
    }

    api.sendMessage("🔍 Analyse de l'erreur et réparation du code en cours...", threadID, messageID);

    try {
      let fixedCode = rawCode;
      let repairDetails = "";

      // --- MOTEUR DE RÉPARATION AUTOMATIQUE (Règles courantes) ---
      
      // Cas 1 : TypeError: Cannot read properties of undefined (reading 'getData') - Lié à Currencies/Users
      if (errorLog.includes("getData") && errorLog.includes("undefined")) {
        repairDetails += "• Détection d'un problème de structure avec l'économie (`Currencies` ou `usersData` non défini).\n";
        
        // Remplacement de la structure d'entrée pour capturer tous les objets globaux possibles
        fixedCode = fixedCode.replace(
          /onStart:\s*async\s*function\s*\(\{([\s\S]*?)\}\)/,
          "onStart: async function (mainParam) {\n    const { api, event } = mainParam;\n    const CurrenciesModel = mainParam.Currencies || mainParam.Users || global.client?.Currencies || global.Currencies;"
        );

        // Adaptation des variables de récupération de données
        fixedCode = fixedCode.replace(/await\s+usersData\.get\(/g, "await CurrenciesModel.getData(");
        fixedCode = fixedCode.replace(/await\s+usersData\.set\(/g, "await CurrenciesModel.setData(");
        fixedCode = fixedCode.replace(/await\s+usersData\.getAll\(/g, "await CurrenciesModel.getAll(");
        fixedCode = fixedCode.replace(/await\s+Currencies\.getData\(/g, "await CurrenciesModel.getData(");
        fixedCode = fixedCode.replace(/await\s+Currencies\.setData\(/g, "await CurrenciesModel.setData(");
      }

      // Cas 2 : Erreurs d'anciennes syntaxes "api.sendMessage(..., threadID)" dans les rappels (callbacks)
      if (errorLog.includes("callback") || errorLog.includes("unlinkSync")) {
        repairDetails += "• Sécurisation des callbacks de suppression de fichiers (`fs.unlinkSync`).\n";
        fixedCode = fixedCode.replace(
          /=>\s*fs\.unlinkSync\((.*?)\)/g,
          "() => { try { fs.unlinkSync($1); } catch(err) {} }"
        );
      }

      // Cas 3 : Constante réassignée (TypeError: Assignment to constant variable)
      if (errorLog.includes("Assignment to constant variable")) {
        repairDetails += "• Changement des déclarations `const` erronées en `let`.\n";
        // Tente de trouver des const suivis de réassignations globales
        fixedCode = fixedCode.replace(/const\s+(userData|money|rank|allData)\s*=/g, "let $1 =");
      }

      // Si aucune règle automatique n'a matché
      if (repairDetails === "") {
        repairDetails += "• Aucune règle automatique standard trouvée. Tentative de sécurisation globale (Try/Catch).\n";
        if (!fixedCode.includes("try {")) {
          fixedCode = fixedCode.replace(
            /onStart:\s*async\s*function\s*\((.*?)\)\s*\{/,
            "onStart: async function ($1) {\n    try {"
          );
          // Ajout du catch à la fin du module avant la fermeture
          const lastIndex = fixedCode.lastIndexOf("}");
          fixedCode = fixedCode.substring(0, lastIndex) + "\n    } catch (err) { console.error(err); }\n}";
        }
      }

      // --- SAUVEGARDE DU FICHIER ---
      const fileName = cmdName.endsWith(".js") ? cmdName : `${cmdName}.js`;
      const filePath = path.join(__dirname, "..", "cmds", fileName);

      // On vérifie si le fichier existe bien avant d'écraser
      if (!fs.existsSync(filePath)) {
        return api.sendMessage(`⚠️ Le fichier \`${fileName}\` n'a pas été trouvé dans le dossier des commandes. Vérifiez l'orthographe du nom.`, threadID, messageID);
      }

      // Écriture du code corrigé
      fs.writeFileSync(filePath, fixedCode, "utf-8");

      // Message de succès
      const successMessage = `✅ **Commande Réparée avec succès !**\n\n` +
                             `📂 **Fichier modifié :** \`/scripts/cmds/${fileName}\`\n` +
                             `🛠️ **Réparations effectuées :**\n${repairDetails}\n` +
                             `💡 *Veuillez redémarrer votre bot ou utiliser la commande /refresh pour appliquer les changements.*`;

      return api.sendMessage(successMessage, threadID, messageID);

    } catch (globalError) {
      return api.sendMessage(`❌ Échec de la réparation automatique : ${globalError.message}`, threadID, messageID);
    }
  }
};
