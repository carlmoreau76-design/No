module.exports = {
  config: {
    name: "broadcast",
    version: "1.0",
    author: "Shade",
    role: 4,
    shortDescription: "Message global admin",
    category: "admin"
  },

  onStart: async function ({ api, event, args, threadsData }) {

    const ownerID = "61573867120837"; // ✅ ton ID déjà connu

    if (event.senderID != ownerID)
      return api.sendMessage("❌ Tu n'as pas la permission.", event.threadID);

    const message = args.join(" ");
    if (!message)
      return api.sendMessage("⚠️ Écris un message.", event.threadID);

    const allThreads = global.db.allThreadData;

    let success = 0;

    for (const thread of allThreads) {
      try {
        const info = await api.getThreadInfo(thread.threadID);

        const text =
`📢 MESSAGE D'ADMINISTRATEUR

👑 Envoyé par : Shade

💬 Message :
${message}

👥 Groupe : ${info.threadName}
👤 Membres : ${info.participantIDs.length}

⚠️ Merci de respecter le bot et éviter les spams`;

        await api.sendMessage(text, thread.threadID);
        success++;

      } catch (e) {
        console.log("Erreur groupe:", thread.threadID);
      }
    }

    return api.sendMessage(
      `✅ Broadcast terminé dans ${success} groupes.`,
      event.threadID
    );
  }
};
