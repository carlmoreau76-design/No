const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "codefix",
    aliases: ["fixcode", "repair"],
    version: "1.0.1",
    hasPermssion: 2, 
    credits: "Gemini AI",
    description: "Analyse, répare et sauvegarde une commande défectueuse",
    commandCategory: "owner",
    usages: "/codefix [Nom_Commande] | [Message_Erreur]",
    cooldowns: 5
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, messageID, body } = event;

    const content = args.join(" ");
    if (!content.includes("|")) {
      return api.sendMessage(
        "❌ Format incorrect !\nUtilisation :\n`/codefix nom_cmd | l'erreur`\n*(N'oubliez pas de coller le code entier)*",
        threadID,
        messageID
      );
    }

    const parts = content.split("|");
    const cmdName = parts[0].trim().replace(".js", "");
    const errorLog = parts[1].trim();

    const codeMatch = body.match(/```javascript([\s\S]*?)```/) || body.match(/```([\s\S]*?)```/);
    let rawCode = codeMatch ? codeMatch[1].trim() : null;

    if (!rawCode) {
      const codeStartIndex = body.indexOf("module.exports") !== -1 ? body.indexOf("module.exports") : body.indexOf("const");
      if (codeStartIndex !== -1) {
        rawCode = body.substring(codeStartIndex).trim();
      }
    }

    if (!cmdName || !errorLog || !rawCode) {
      return api.sendMessage("❌ Données manquantes (Nom, erreur ou code).", threadID, messageID);
    }

    api.sendMessage("🔍 Analyse et réparation du code en cours...", threadID, messageID);

    try {
      let fixedCode = rawCode;
      let repairDetails = "";

      // --- Règles de réparation ---
      if (errorLog.includes("getData") && errorLog.includes("undefined")) {
        repairDetails += "• Correctif appliqué pour le système d'économie (`Currencies`/`usersData`).\n";
        fixedCode = fixedCode.replace(
          /onStart:\s*async\s*function\s*\(\{([\s\S]*?)\}\)/,
          "onStart: async function (mainParam) {\n    const { api, event } = mainParam;\n    const CurrenciesModel = mainParam.Currencies || mainParam.Users || global.client?.Currencies || global.Currencies;"
        );
        fixedCode = fixedCode.replace(/await\s+usersData\.get\(/g, "await CurrenciesModel.getData(");
        fixedCode = fixedCode.replace(/await\s+usersData\.set\(/g, "await CurrenciesModel.setData(");
        fixedCode = fixedCode.replace(/await\s+usersData\.getAll\(/g, "await CurrenciesModel.getAll(");
        fixedCode = fixedCode.replace(/await\s+Currencies\.getData\(/g, "await CurrenciesModel.getData(");
        fixedCode = fixedCode.replace(/await\s+Currencies\.setData\(/g, "await CurrenciesModel.setData(");
      }

      if (errorLog.includes("callback") || errorLog.includes("unlinkSync")) {
        repairDetails += "• Sécurisation des suppressions de fichiers (`fs.unlinkSync`).\n";
        fixedCode = fixedCode.replace(/=>\s*fs\.unlinkSync\((.*?)\)/g, "() => { try { fs.unlinkSync($1); } catch(err) {} }");
      }

      if (errorLog.includes("Assignment to constant variable")) {
        repairDetails += "• Correction d'une variable `const` réassignée en `let`.\n";
        fixedCode = fixedCode.replace(/const\s+(userData|money|rank|allData)\s*=/g, "let $1 =");
      }

      if (repairDetails === "") {
        repairDetails += "• Sécurisation par bloc Try/Catch global.\n";
        if (!fixedCode.includes("try {")) {
          fixedCode = fixedCode.replace(/onStart:\s*async\s*function\s*\((.*?)\)\s*\{/, "onStart: async function ($1) {\n    try {");
          const lastIndex = fixedCode.lastIndexOf("}");
          fixedCode = fixedCode.substring(0, lastIndex) + "\n    } catch (err) { console.error(err); }\n}";
        }
      }

      // --- Chemin Absolu pour Render ---
      const fileName = `${cmdName}.js`;
      const filePath = path.join(process.cwd(), "scripts", "cmds", fileName);

      if (!fs.existsSync(filePath)) {
        return api.sendMessage(`⚠️ Fichier \`${fileName}\` introuvable dans /scripts/cmds/.`, threadID, messageID);
      }

      fs.writeFileSync(filePath, fixedCode, "utf-8");

      return api.sendMessage(
        `✅ **Commande Réparée !**\n\n📂 Modifié : \`${fileName}\`\n🛠️ Actions :\n${repairDetails}\n\n💡 Relancez le bot ou faites /refresh.`,
        threadID,
        messageID
      );

    } catch (globalError) {
      return api.sendMessage(`❌ Échec : ${globalError.message}`, threadID, messageID);
    }
  }
};
