module.exports = {
  config: {
    name: "out",
    aliases: ["leave"],
    version: "2.1",
    author: "Shade",
    countDown: 5,
    role: 3, // admin bot only
    shortDescription: {
      fr: "Fait quitter le bot des autres groupes ou du groupe actuel"
    },
    category: "owner",
    guide: {
      fr: "{p}{n} → Quitter le groupe actuel\n{p}{n} all → Quitter TOUS les groupes SAUF celui-ci 🌸"
    }
  },

  onStart: async function ({ api, event, args }) {
    const ownerID = "61573867120837"; // 🔒 TON ID

    // 🔒 Sécurité : Seul l'owner peut déclencher ça
    if (event.senderID !== ownerID) {
      return api.sendMessage(
        "🌸 𝘼𝙣𝙜𝙚𝙡 : désolée… seul mon créateur peut me demander ça 💔",
        event.threadID,
        event.messageID
      );
    }

    const action = args[0]?.toLowerCase();

    // ==========================================
    // 🚪 QUITTER TOUS LES AUTRES GROUPES (OUT ALL)
    // ==========================================
    if (action === "all") {
      try {
        const list = await api.getThreadList(100, null, ["INBOX"]);
        
        // On filtre pour exclure le groupe actuel (event.threadID) de la liste de suppression
        const otherGroups = list.filter(thread => thread.isGroup && thread.threadID !== event.threadID);

        if (otherGroups.length === 0) {
          return api.sendMessage("🌸 𝘼𝙣𝙜𝙚𝙡 : Je ne suis connectée à aucun autre groupe pour le moment !", event.threadID);
        }

        await api.sendMessage(
          `🌸⚙️ 𝘼𝙣𝙜𝙚𝙡 : Initialisation du nettoyage global...\nExtraction de ${otherGroups.length} autres groupes en cours. Je reste ici avec toi ! ✨`,
          event.threadID
        );

        let count = 0;
        for (const group of otherGroups) {
          // Pause d'une seconde pour éviter le spam
          await new Promise(resolve => setTimeout(resolve, 1000));
          try {
            await api.removeUserFromGroup(api.getCurrentUserID(), group.threadID);
            count++;
          } catch (e) {
            console.error(`Impossible de quitter le groupe ID: ${group.threadID}`, e);
          }
        }

        return api.sendMessage(
          `🎉 𝘼𝙣𝙜𝙚𝙡 : Opération terminée ! J'ai quitté ${count} autres groupes avec succès. 🌸`,
          event.threadID
        );

      } catch (err) {
        console.error(err);
        return api.sendMessage("❌ Une erreur s'est produite lors du protocole d'extraction.", event.threadID);
      }
    }

    // ==========================================
    // 🚪 QUITTER LE GROUPE ACTUEL SEULEMENT
    // ==========================================
    try {
      await api.sendMessage(
        "🌸💔 𝘼𝙣𝙜𝙚𝙡 : d'accord… je m'éloigne doucement du groupe...\nPrenez soin de vous ✨",
        event.threadID
      );

      setTimeout(() => {
        api.removeUserFromGroup(api.getCurrentUserID(), event.threadID);
      }, 800);

    } catch (err) {
      console.error(err);
      api.sendMessage(
        "❌ Angel n’a pas réussi à quitter le groupe…",
        event.threadID
      );
    }
  }
};
