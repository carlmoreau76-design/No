module.exports = {
  config: {
    name: "out",
    aliases: ["leave", "quitter"],
    version: "2.2.0",
    author: "Shade × Gemini",
    countDown: 5,
    role: 3, // 🔒 Niveau Owner uniquement
    description: "Fait quitter le bot du groupe actuel ou de tous les autres groupes connectés",
    category: "owner",
    guide: {
      fr: "{p}{n} : Quitter le groupe actuel\n{p}{n} all : Quitter tous les autres groupes connectés"
    }
  },

  onStart: async function ({ api, event, args }) {
    const ownerID = "61573867120837"; // 🔒 Identifiant administrateur principal

    // 🔒 Contrôle d'accès strict
    if (event.senderID !== ownerID) {
      return api.sendMessage(
        `╭─ 🪐 𝗛𝗢𝗥𝗜 𝗦𝗬𝗦𝗧𝗘𝗠 ────────╮\n` +
        `│ 🎀 Statut : Accès Refusé\n` +
        `│ 💔 Désolée, seul mon créateur peut\n` +
        `│    déclencher ce protocole.\n` +
        `╰──────────────────────────╯`,
        event.threadID,
        event.messageID
      );
    }

    const action = args[0]?.toLowerCase();

    // ==========================================
    // 🚪 PROTOCOLE : QUITTER TOUS LES AUTRES GROUPES
    // ==========================================
    if (action === "all") {
      try {
        const list = await api.getThreadList(100, null, ["INBOX"]);
        
        // Filtrage pour exclure le groupe actuel
        const otherGroups = list.filter(thread => thread.isGroup && thread.threadID !== event.threadID);

        if (otherGroups.length === 0) {
          return api.sendMessage(
            `╭─ 🪐 𝗛𝗢𝗥𝗜 𝗦𝗬𝗦𝗧𝗘𝗠 ────────╮\n` +
            `│ 🌸 Aucun autre groupe détecté.\n` +
            `│    Je reste connectée ici.\n` +
            `╰──────────────────────────╯`, 
            event.threadID
          );
        }

        await api.sendMessage(
          `╭─ 🪐 𝗛𝗢𝗥𝗜 𝗦𝗬𝗦𝗧𝗘𝗠 ────────╮\n` +
          `│ ⚙️ Initialisation du nettoyage...\n` +
          `│ 📦 Groupes cibles : ${otherGroups.length}\n` +
          `│ ✨ Début du traitement en arrière-plan.\n` +
          `╰──────────────────────────╯`,
          event.threadID
        );

        let count = 0;
        for (const group of otherGroups) {
          // Pause de sécurité d'une seconde entre chaque extraction
          await new Promise(resolve => setTimeout(resolve, 1000));
          try {
            await api.removeUserFromGroup(api.getCurrentUserID(), group.threadID);
            count++;
          } catch (e) {
            console.error(`Impossible de quitter le groupe ID: ${group.threadID}`, e);
          }
        }

        return api.sendMessage(
          `╭─ 🪐 𝗛𝗢𝗥𝗜 𝗦𝗬𝗦𝗧𝗘𝗠 ────────╮\n` +
          `│ ✓ Nettoyage global terminé\n` +
          `│ 🌸 Groupes quittés : ${count}\n` +
          `│ 🎉 Mission accomplie avec succès.\n` +
          `╰──────────────────────────╯`,
          event.threadID
        );

      } catch (err) {
        console.error(err);
        return api.sendMessage("❌ Une erreur critique est survenue lors du protocole d'extraction.", event.threadID);
      }
    }

    // ==========================================
    // 🚪 PROTOCOLE : QUITTER LE GROUPE ACTUEL
    // ==========================================
    try {
      await api.sendMessage(
        `╭─ 🪐 𝗛𝗢𝗥𝗜 𝗦𝗬𝗦𝗧𝗘𝗠 ────────╮\n` +
        `│ 🚪 Extraction en cours...\n` +
        `│ 🌸 Je m'éloigne doucement.\n` +
        `│ ✨ Prenez soin de vous.\n` +
        `╰──────────────────────────╯`,
        event.threadID
      );
      
      setTimeout(() => {
        api.removeUserFromGroup(api.getCurrentUserID(), event.threadID);
      }, 1000);

    } catch (err) {
      console.error(err);
      api.sendMessage("❌ Échec de la commande : Impossible de quitter le groupe actuel.", event.threadID);
    }
  }
};
