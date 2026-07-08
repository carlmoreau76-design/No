const { getTime } = global.utils;

module.exports = {
  config: {
    name: "thread",
    version: "1.5.0",
    author: "Chitron Bhattacharjee × Gemini",
    countDown: 5,
    role: 0,
    description: "Gestion des groupes de discussion enregistrés dans le système du bot",
    category: "owner",
    guide: {
      fr: "• {p}{n} find [-j / joined] [nom] : Recherche un groupe par son nom (-j filtre uniquement les groupes où le bot est actif).\n" +
          "• {p}{n} ban [ID_groupe / vide] [raison] : Bloque l'accès au bot pour le groupe spécifié ou actuel.\n" +
          "• {p}{n} unban [ID_groupe / vide] : Débloque le groupe spécifié ou actuel.\n" +
          "• {p}{n} info [ID_groupe / vide] : Affiche les statistiques globales d'un groupe."
    }
  },

  langs: {
    fr: {
      noPermission: "❌ Autorisation refusée. Vous n'avez pas les privilèges nécessaires.",
      found: "🔎 %1 groupe(s) correspondant au mot-clé \"%2\" trouvé(s) :\n%3",
      notFound: "❌ Aucun groupe ne correspond au mot-clé : \"%1\"",
      hasBanned: "⚠️ Ce groupe [ID: %1 | Nom: %2] est déjà banni.\n» Raison : %3\n» Date : %4",
      banned: "✓ Le groupe [ID: %1 | Nom: %2] a été banni avec succès.\n» Raison : %3\n» Date : %4",
      notBanned: "💡 Le groupe [ID: %1 | Nom: %2] ne fait l'objet d'aucune restriction.",
      unbanned: "✓ Les restrictions du groupe [ID: %1 | Nom: %2] ont été levées.",
      missingReason: "❌ Veuillez spécifier un motif ou une raison pour justifier le bannissement.",
      info: "╭─ 🪐 𝗧𝗛𝗥𝗘𝗔𝗗 𝗜𝗡𝗙𝗢𝗥𝗠𝗔𝗧𝗜𝗢𝗡 ─╮\n" +
            "│ • ID de la box : %1\n" +
            "│ • Nom : %2\n" +
            "│ • Création des données : %3\n" +
            "├──────────────────────────┤\n" +
            "│ • Membres totaux : %4\n" +
            "│ • Hommes : %5\n" +
            "│ • Femmes : %6\n" +
            "│ • Activité totale : %7 messages\n" +
            "%8" +
            "╰──────────────────────────╯"
    }
  },

  onStart: async function ({ args, threadsData, message, role, event, getLang }) {
    const type = args[0]?.toLowerCase();

    switch (type) {
      // 🔍 CONFIGURATION RECHERCHE
      case "find":
      case "search":
      case "-f":
      case "-s": {
        if (role < 2) return message.reply(getLang("noPermission"));
        let allThread = await threadsData.getAll();
        let keyword = args.slice(1).join(" ");

        if (['-j', '-join', 'joined'].includes(args[1]?.toLowerCase())) {
          allThread = allThread.filter(thread => thread.members.some(member => member.userID == global.GoatBot.botID && member.inGroup));
          keyword = args.slice(2).join(" ");
        }

        const result = allThread.filter(item => item.threadID.length > 15 && (item.threadName || "").toLowerCase().includes(keyword.toLowerCase()));
        const resultText = result.reduce((i, thread) => i += `\n ├─ Nom : ${thread.threadName}\n └─ ID : ${thread.threadID}\n`, "");

        let msg = "";
        if (result.length > 0) msg += getLang("found", result.length, keyword, resultText);
        else msg += getLang("notFound", keyword);
        
        return message.reply(msg);
      }

      // 🔒 CONFIGURATION BANNISSEMENT
      case "ban":
      case "-b": {
        if (role < 2) return message.reply(getLang("noPermission"));
        let tid, reason;

        if (!isNaN(args[1])) {
          tid = args[1];
          reason = args.slice(2).join(" ");
        } else {
          tid = event.threadID;
          reason = args.slice(1).join(" ");
        }

        if (!tid) return message.SyntaxError();
        if (!reason) return message.reply(getLang("missingReason"));
        
        reason = reason.replace(/\s+/g, ' ');
        const threadData = await threadsData.get(tid);
        const name = threadData.threadName;
        const status = threadData.banned.status;

        if (status) return message.reply(getLang("hasBanned", tid, name, threadData.banned.reason, threadData.banned.date));

        const time = getTime("DD/MM/YYYY HH:mm:ss");
        await threadsData.set(tid, {
          banned: {
            status: true,
            reason,
            date: time
          }
        });
        return message.reply(getLang("banned", tid, name, reason, time));
      }

      // 🔓 CONFIGURATION DÉBANNISSEMENT
      case "unban":
      case "-u": {
        if (role < 2) return message.reply(getLang("noPermission"));
        let tid;

        if (!isNaN(args[1])) tid = args[1];
        else tid = event.threadID;

        if (!tid) return message.SyntaxError();

        const threadData = await threadsData.get(tid);
        const name = threadData.threadName;
        const status = threadData.banned.status;

        if (!status) return message.reply(getLang("notBanned", tid, name));

        await threadsData.set(tid, { banned: {} });
        return message.reply(getLang("unbanned", tid, name));
      }

      // 📊 AFFICHAGE DES STATISTIQUES GLOBAL
      case "info":
      case "-i": {
        let tid;

        if (!isNaN(args[1])) tid = args[1];
        else tid = event.threadID;

        if (!tid) return message.SyntaxError();

        const threadData = await threadsData.get(tid);
        const createdDate = getTime(threadData.createdAt, "DD/MM/YYYY HH:mm:ss");
        const valuesMember = Object.values(threadData.members).filter(item => item.inGroup);
        const totalBoy = valuesMember.filter(item => item.gender == "MALE").length;
        const totalGirl = valuesMember.filter(item => item.gender == "FEMALE").length;
        const totalMessage = valuesMember.reduce((i, item) => i += item.count, 0);

        let infoBanned = "";
        if (threadData.banned.status) {
          infoBanned = "├──────────────────────────┤\n" +
                       `│ ⚠️ STATUT : BANNI\n` +
                       `│ • Motif : ${threadData.banned.reason}\n` +
                       `│ • Date d'effet : ${threadData.banned.date}\n`;
        }

        const msg = getLang("info", threadData.threadID, threadData.threadName, createdDate, valuesMember.length, totalBoy, totalGirl, totalMessage, infoBanned);
        return message.reply(msg);
      }

      default:
        return message.SyntaxError();
    }
  }
};
