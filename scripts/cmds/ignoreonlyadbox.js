const OWNER_UID = "61573867120837";

module.exports = {
  config: {
    name: "ignoreonlyadbox",
    aliases: ["ignoreadboxonly", "ignoreadminboxonly", "ignbox"],
    version: "2.1.0",
    author: "Shade & Gemini",
    countDown: 5,
    role: 0,
    description: "Gérer la liste des commandes qui ignorent le mode adminOnly par groupe",
    category: "security",
    guide: {
      fr: "• {p}{n} add [commande] → Autoriser une commande\n• {p}{n} del [commande] → Retirer une commande\n• {p}{n} list → Afficher la liste des exceptions"
    }
  },

  langs: {
    fr: {
      denied: "❌ Accès refusé. Cette commande est strictement réservée à l'administrateur principal.",
      missingAdd: "❌ Veuillez spécifier le nom de la commande à ajouter aux exceptions.",
      missingDel: "❌ Veuillez spécifier le nom de la commande à retirer des exceptions.",
      notFound: "❌ La commande \"%1\" n'existe pas dans le système.",
      already: "⚠️ La commande \"%1\" est déjà présente dans la liste des exceptions de ce groupe.",
      added: "✓ La commande \"%1\" ignore désormais les restrictions adminOnly dans ce groupe.",
      notIn: "❌ La commande \"%1\" ne fait pas partie de la liste des exceptions.",
      removed: "✓ La commande \"%1\" a été retirée des exceptions avec succès.",
      list: "╭─ 🪐 𝗘𝗫𝗖𝗘𝗣𝗧𝗜𝗢𝗡𝗦 𝗟𝗜𝗦𝗧 ─╮\n\n%1\n\n╰─────────────────────╯",
      empty: "📦 La liste des exceptions pour ce groupe est actuellement vide."
    }
  },

  onStart: async function ({ args, message, event, threadsData, getLang }) {
    // 🔒 CONTRÔLE D'ACCÈS
    if (event.senderID !== OWNER_UID) {
      return message.reply(getLang("denied"));
    }

    try {
      const threadID = event.threadID;
      let ignoreList = await threadsData.get(
        threadID,
        "data.ignoreCommanToOnlyAdminBox",
        []
      );

      const action = args[0]?.toLowerCase();

      // ➕ AJOUT D'UNE EXCEPTION
      if (action === "add") {
        if (!args[1]) return message.reply(getLang("missingAdd"));
        const cmd = args[1].toLowerCase();
        
        const command = global.GoatBot.commands.get(cmd);
        if (!command) return message.reply(getLang("notFound", cmd));
        if (ignoreList.includes(cmd)) return message.reply(getLang("already", cmd));

        ignoreList.push(cmd);
        await threadsData.set(
          threadID,
          ignoreList,
          "data.ignoreCommanToOnlyAdminBox"
        );
        return message.reply(getLang("added", cmd));
      }

      // ❌ SUPPRESSION D'UNE EXCEPTION
      if (["del", "remove", "rm"].includes(action)) {
        if (!args[1]) return message.reply(getLang("missingDel"));
        const cmd = args[1].toLowerCase();

        const command = global.GoatBot.commands.get(cmd);
        if (!command) return message.reply(getLang("notFound", cmd));
        if (!ignoreList.includes(cmd)) return message.reply(getLang("notIn", cmd));

        ignoreList.splice(ignoreList.indexOf(cmd), 1);
        await threadsData.set(
          threadID,
          ignoreList,
          "data.ignoreCommanToOnlyAdminBox"
        );
        return message.reply(getLang("removed", cmd));
      }

      // 📜 AFFICHAGE DE LA LISTE
      if (action === "list") {
        if (!ignoreList || ignoreList.length === 0) return message.reply(getLang("empty"));
        return message.reply(
          getLang(
            "list",
            ignoreList.map(c => ` │ • ${c}`).join("\n")
          )
        );
      }

      return message.SyntaxError();
    } catch (e) {
      console.error(e);
      return message.reply("❌ Une erreur interne est survenue lors de la configuration du protocole.");
    }
  }
};
