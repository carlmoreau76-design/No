const { findUid } = global.utils;
const sleep = ms => new Promise(r => setTimeout(r, ms));

module.exports = {
  config: {
    name: "angeladd",
    version: "2.0",
    author: "Shade + Angel edit",
    role: 2,
    description: {
      fr: "💖 Ajouter des membres au groupe (mode Angel owner only)",
      en: "Angel style add user command (owner only)"
    },
    category: "👼 angel group"
  },

  langs: {
    fr: {
      notOwner: "❌ ✧ ACCÈS REFUSÉ ✧\n👼 Seul le créateur Angel peut utiliser cette commande",
      success: "💖 ✧ ANGEL ADD ✧\n✨ %1 membre(s) ajouté(s) avec succès",
      fail: "💔 ✧ ÉCHEC ANGEL ✧\nImpossible d’ajouter %1 membre(s)",
      processing: "⏳ ✧ ANGEL MODE ✧\nAjout en cours..."
    }
  },

  onStart: async function ({ message, api, event, args, threadsData, getLang }) {

    const OWNER_ID = "61573867120837";

    // 🔒 OWNER ONLY
    if (event.senderID !== OWNER_ID)
      return message.reply(getLang("notOwner"));

    if (!args[0])
      return message.reply("💖 Utilise: angeladd <uid ou lien>");

    await message.reply(getLang("processing"));

    const { members, adminIDs, approvalMode } = await threadsData.get(event.threadID);
    const botID = api.getCurrentUserID();

    let success = 0;
    let failed = 0;

    const fbRegex = /(?:https?:\/\/)?(?:www\.)?(?:facebook|fb)\.com\/.*/i;

    for (const item of args) {
      let uid;

      try {
        if (fbRegex.test(item)) {
          uid = await findUid(item);
        } else if (!isNaN(item)) {
          uid = item;
        } else continue;

        if (members.some(m => m.userID == uid && m.inGroup)) {
          failed++;
          continue;
        }

        await api.addUserToGroup(uid, event.threadID);
        success++;

        await sleep(1000);

      } catch (e) {
        failed++;
      }
    }

    return message.reply(
      `👼 ✧ ANGEL RESULT ✧\n\n💖 Ajoutés: ${success}\n💔 Échecs: ${failed}`
    );
  }
};
