const { writeFileSync } = require("fs-extra");

module.exports = {
  config: {
    name: "thread",
    aliases: ["t"],
    version: "1.5",
    author: "NTKhang",
    role: 2, // Admin / Owner Bot uniquement
    category: "Owner",
    description: "No description",
    guide: {
      en: "🌸 𝗧𝗛𝗥𝗘𝗔𝗗\n\n📂 𝗖𝗮𝘁𝗲𝗴𝗼𝗿𝘆: Owner\n📘 𝗗𝗲𝘀𝗰𝗿𝗶𝗽𝘁𝗶𝗼𝗻: No description\n🧾 𝗨𝘀𝗮𝗴𝗲:\n{pn} [find | -f | search | -s] <name to find>\n{pn} [find | -f | search | -s] [-j | joined] <name to find>\n{pn} [ban | -b] [<tid> | leave blank] <reason>\n{pn} unban [<tid> | leave blank]\n\n👤 𝗔𝘂𝘁𝗵𝗼𝗿: NTKhang\n🛠 𝗩𝗲𝗿𝘀𝗶𝗼𝗻: 1.5"
    }
  },

  onStart: async function ({ api, event, args, threadsData, message }) {
    const { threadID, messageID } = event;
    const action = args[0]?.toLowerCase();

    if (!action) {
      return message.reply(`🌸 𝗧𝗛𝗥𝗘𝗔𝗗\n\n📂 𝗖𝗮𝘁𝗲𝗴𝗼𝗿𝘆: Owner\n📘 𝗗𝗲𝘀𝗰𝗿𝗶𝗽𝘁𝗶𝗼𝗻: No description\n🧾 𝗨𝘀𝗮𝗴𝗲:\n{p}{n} find <name>\n{p}{n} find -j <name>\n{p}{n} ban <tid> <reason>\n{p}{n} unban <tid>`);
    }

    // ==========================================
    // 🔍 RECHERCHE / FIND / SEARCH
    // ==========================================
    if (["find", "-f", "search", "-s"].includes(action)) {
      try {
        let onlyJoined = false;
        let queryIndex = 1;

        if (args[1]?.toLowerCase() === "-j" || args[1]?.toLowerCase() === "joined") {
          onlyJoined = true;
          queryIndex = 2;
        }

        const searchQuery = args.slice(queryIndex).join(" ").toLowerCase();
        if (!searchQuery) {
          return message.reply("⚠️ Veuillez entrer un nom de groupe à rechercher.");
        }

        // Récupération de tous les groupes enregistrés dans la DB du bot
        const allThreads = await threadsData.getAll() || [];
        // Récupération de la liste en temps réel des salons actifs sur la session
        let activeThreads = [];
        try {
          activeThreads = await api.getThreadList(100, null, ["INBOX"]) || [];
        } catch (e) {
          console.error("Impossible de récupérer la liste active de l'API", e);
        }

        const activeTids = activeThreads.map(t => String(t.threadID));

        let results = [];

        for (const tData of allThreads) {
          const tid = String(tData.threadID);
          const tInfoInActive = activeThreads.find(t => String(t.threadID) === tid);
          
          // Détermination du nom et du statut de jointure
          let threadName = tData.threadName || tInfoInActive?.name || tInfoInActive?.threadName || "Sans nom";
          const isJoined = activeTids.includes(tid) || !!tInfoInActive;
          const memberCount = tInfoInActive?.participantIDs?.length || tData.members?.length || 0;

          if (onlyJoined && !isJoined) continue;

          if (threadName.toLowerCase().includes(searchQuery) || tid.includes(searchQuery)) {
            results.push({
              id: tid,
              name: threadName,
              members: memberCount,
              status: isJoined ? "Connecté 🟢" : "Quitté 🔴"
            });
          }
        }

        if (results.length === 0) {
          return message.reply(`❌ Aucun groupe trouvé correspondant à "${searchQuery}" (Filtre Joint: ${onlyJoined ? "Oui" : "Non"}).`);
        }

        // Gestion de la pagination (max 20 groupes par page)
        const itemsPerPage = 20;
        const totalPages = Math.ceil(results.length / itemsPerPage);
        let page = 1;

        // Détection si le dernier argument spécifie un numéro de page
        const lastArg = args[args.length - 1];
        if (!isNaN(lastArg) && parseInt(lastArg) > 0) {
          page = parseInt(lastArg);
          if (page > totalPages) page = totalPages;
        }

        const startIdx = (page - 1) * itemsPerPage;
        const endIdx = startIdx + itemsPerPage;
        const paginatedResults = results.slice(startIdx, endIdx);

        let responseMsg = `🔎 **RÉSULTATS DE RECHERCHE (${startIdx + 1}-${Math.min(endIdx, results.length)}/${results.length})**\n━━━━━━━━━━━━━━━━━━━━━\n`;
        
        paginatedResults.forEach((res, index) => {
          responseMsg += `${startIdx + index + 1}. 👥 **${res.name}**\n   🆔 TID: \`${res.id}\`\n   👥 Membres: ${res.members} | Statut: ${res.status}\n\n`;
        });

        responseMsg += `━━━━━━━━━━━━━━━━━━━━━\n📄 Page ${page}/${totalPages} — Utilisez \`thread find [query] [page]\` pour naviguer.`;
        return message.reply(responseMsg);

      } catch (err) {
        console.error(err);
        return message.reply("❌ Une erreur est survenue lors de la recherche des groupes.");
      }
    }

    // ==========================================
    // 🚫 BAN / -B
    // ==========================================
    if (["ban", "-b"].includes(action)) {
      try {
        let targetTid = args[1];
        let reason = args.slice(2).join(" ");

        // Si l'UID ou le TID est omis, on prend par défaut le groupe actuel
        if (!targetTid || isNaN(targetTid)) {
          targetTid = threadID;
          reason = args.slice(1).join(" ");
        }

        if (!reason) reason = "Aucune raison spécifiée par l'administrateur.";

        const threadToBan = await threadsData.get(targetTid);
        if (!threadToBan) {
          return message.reply(`❌ Le groupe avec l'ID \`${targetTid}\` n'existe pas dans la base de données.`);
        }

        if (threadToBan.data?.banned === true) {
          return message.reply(`⚠️ Le groupe \`${threadToBan.threadName || targetTid}\` est déjà banni.`);
        }

        // Sauvegarde des informations du ban dans les métadonnées de la DB
        if (!threadToBan.data) threadToBan.data = {};
        threadToBan.data.banned = true;
        threadToBan.data.banReason = reason;
        threadToBan.data.banDate = new Date().toISOString();

        await threadsData.set(targetTid, threadToBan.data, "data");

        // Notification d'exécution
        message.reply(`🛑 **[THREAD BAN]**\n━━━━━━━━━━━━━━━━━\n👥 Groupe : ${threadToBan.threadName || "Inconnu"}\n🆔 TID : \`${targetTid}\`\n⚖️ Raison : ${reason}\n\nLe groupe a été verrouillé avec succès.`);

        // Alerte envoyée sur le groupe banni si le bot y est encore connecté
        try {
          await api.sendMessage(`🛑 **[NOTIFICATION SYSTÈME]**\nCe groupe a été banni par l'administration du bot.\n⚖️ Raison : ${reason}\n\nLe bot cessera de répondre ici.`, targetTid);
        } catch (e) {}

      } catch (err) {
        console.error(err);
        return message.reply("❌ Une erreur s'est produite lors du bannissement du thread.");
      }
      return;
    }

    // ==========================================
    // 🔓 UNBAN
    // ==========================================
    if (action === "unban") {
      try {
        let targetTid = args[1];

        if (!targetTid || isNaN(targetTid)) {
          targetTid = threadID;
        }

        const threadToUnban = await threadsData.get(targetTid);
        if (!threadToUnban) {
          return message.reply(`❌ Le groupe avec l'ID \`${targetTid}\` n'existe pas dans la base de données.`);
        }

        if (!threadToUnban.data || threadToUnban.data.banned !== true) {
          return message.reply(`⚠️ Le groupe \`${threadToUnban.threadName || targetTid}\` n'est pas banni.`);
        }

        // Réinitialisation des paramètres de bannissement
        threadToUnban.data.banned = false;
        delete threadToUnban.data.banReason;
        delete threadToUnban.data.banDate;

        await threadsData.set(targetTid, threadToUnban.data, "data");

        message.reply(`🟩 **[THREAD UNBAN]**\n━━━━━━━━━━━━━━━━━\n👥 Groupe : ${threadToUnban.threadName || "Inconnu"}\n🆔 TID : \`${targetTid}\`\n\nL'accès global a été restauré pour ce groupe.`);

        try {
          await api.sendMessage(`🟩 **[NOTIFICATION SYSTÈME]**\nLe bannissement de ce groupe a été levé. Les fonctionnalités sont de nouveau opérationnelles.`, targetTid);
        } catch (e) {}

      } catch (err) {
        console.error(err);
        return message.reply("❌ Une erreur s'est produite lors du débannissement du thread.");
      }
      return;
    }

    return message.reply("⚠️ Commande ou action introuvable. Utilisez `find`, `ban` ou `unban`.");
  }
};
