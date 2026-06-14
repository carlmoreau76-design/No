module.exports.config = {
  name: "box",
  version: "1.1",
  author: "Shade",
  description: "Gestion du groupe en 8 commandes"
};

module.exports.run = async ({ api, event, args }) => {
  const { threadID, senderID } = event;
  const sub = args[0];

  try {
    const info = await api.getThreadInfo(threadID);

    const name = info.threadName || "Sans nom";
    const emoji = info.emoji || "💬";
    const members = info.participantIDs.length;
    const admins = info.adminIDs.map(a => a.id);

    const botID = api.getCurrentUserID();
    const botIsAdmin = admins.includes(botID);

    // PANEL
    if (!sub) {
      return api.sendMessage(
`╭─────── BOX ───────
│ 📦 Groupe : ${name}
│ 😀 Emoji : ${emoji}
│ 👥 Membres : ${members}
│ 👑 Admins : ${admins.length}
│ 🤖 Bot admin : ${botIsAdmin ? "Oui" : "Non"}
├──────────────
│ ⚙️ 1 nom
│ ⚙️ 2 photo
│ ⚙️ 3 emoji
│ ⚙️ 4 pseudo
│ ⚙️ 5 approval
│ ⚙️ 6 uid
│ ⚙️ 7 membres
│ ⚙️ 8 infos
╰────────────────`,
        threadID
      );
    }

    // 1 NAME
    if (sub === "1") {
      const newName = args.slice(1).join(" ");
      if (!newName) return api.sendMessage("Utilise: box 1 [nom]", threadID);
      await api.setTitle(newName, threadID);
      return api.sendMessage("Nom modifié ✅", threadID);
    }

    // 2 PHOTO (reply image)
    if (sub === "2") {
      if (!event.messageReply?.attachments?.[0])
        return api.sendMessage("Répond à une image avec: box 2", threadID);

      const img = event.messageReply.attachments[0].url;
      await api.changeGroupImage(img, threadID);
      return api.sendMessage("Photo modifiée ✅", threadID);
    }

    // 3 EMOJI
    if (sub === "3") {
      const emoji = args[1];
      if (!emoji) return api.sendMessage("box 3 🔥", threadID);
      await api.changeThreadEmoji(emoji, threadID);
      return api.sendMessage("Emoji changé ✅", threadID);
    }

    // 4 NICKNAME
    if (sub === "4") {
      const nick = args.slice(1).join(" ");
      if (!nick) return api.sendMessage("box 4 pseudo", threadID);
      await api.changeNickname(nick, senderID, threadID);
      return api.sendMessage("Pseudo modifié ✅", threadID);
    }

    // 5 APPROVAL
    if (sub === "5") {
      if (!botIsAdmin)
        return api.sendMessage("Je dois être admin pour faire ça ❌", threadID);

      const newMode = !info.approvalMode;
      await api.setApprovalMode(newMode, threadID);
      return api.sendMessage(
        `Approval ${newMode ? "ON 🔒" : "OFF 🔓"}`,
        threadID
      );
    }

    // 6 UID
    if (sub === "6") {
      return api.sendMessage(`UID groupe: ${threadID}`, threadID);
    }

    // 7 MEMBERS
    if (sub === "7") {
      let list = "👥 Membres:\n";
      info.participantIDs.forEach(id => {
        list += `• ${id}\n`;
      });
      return api.sendMessage(list, threadID);
    }

    // 8 INFO
    if (sub === "8") {
      return api.sendMessage(
`📊 INFO
Nom: ${name}
ID: ${threadID}
Membres: ${members}`,
        threadID
      );
    }

    return api.sendMessage("Commande 1-8 uniquement", threadID);

  } catch (e) {
    console.log(e);
    return api.sendMessage("Erreur box ❌", threadID);
  }
};
