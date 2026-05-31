module.exports = {
  config: {
    name: "angeladminbox",
    aliases: ["angeladbox", "aadminbox"],
    version: "2.0",
    author: "Shade + Angel edit",
    countDown: 5,
    role: 2,
    description: {
      fr: "💖 Mode Angel : seul le créateur peut activer/désactiver l’accès bot",
      en: "Angel mode: only owner can control bot access"
    },
    category: "👼 angel group"
  },

  langs: {
    fr: {
      on: "💖 ✧ ANGEL MODE ACTIVÉ ✧\n👼 Seul le créateur peut utiliser le bot dans ce groupe",
      off: "🌸 ✧ ANGEL MODE DÉSACTIVÉ ✧\n✨ Tous les membres peuvent utiliser le bot",
      notOwner: "❌ ✧ ACCÈS REFUSÉ ✧\n👼 Tu n’es pas le créateur Angel"
    }
  },

  onStart: async function ({ args, message, event, threadsData, getLang }) {

    const OWNER_ID = "61573867120837";

    // 🔒 OWNER ONLY CONTROL
    if (event.senderID !== OWNER_ID)
      return message.reply(getLang("notOwner"));

    const action = args[0]?.toLowerCase();

    if (!action || !["on", "off"].includes(action))
      return message.reply("💖 Utilise: angeladminbox on/off");

    const value = action === "on";

    await threadsData.set(
      event.threadID,
      value,
      "data.angelOnlyBox"
    );

    return message.reply(value ? getLang("on") : getLang("off"));
  }
};
