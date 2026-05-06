function frame(msg) {
  return `╭━━━(｡•̀ᴗ-)✧━━━╮
🎧 𝗦𝗛𝗔𝗗𝗘𝗬 𝗣𝗟𝗔𝗬𝗟𝗜𝗦𝗧 🎧
╰━━━━━━━━━━━━━━╯

${msg}

╰━━━(✧˙꒳˙✧)━━━╯`;
}

module.exports = {
  config: {
    name: "shadey",
    version: "1.0",
    author: "Shade",
    role: 0,
    category: "music",
    shortDescription: "Mes musiques Shadey 🎧"
  },

  onStart: async function ({ message, event }) {

    const songs = [
      {
        name: "💔 Couronne de cendres",
        url: "https://files.catbox.moe/jnk2j5.mp3"
      },
      {
        name: "🤝 De rivaux à frères",
        url: "https://files.catbox.moe/ol6y26.mp3"
      },
      {
        name: "💎 Sans diamant, sans chance",
        url: "https://files.catbox.moe/jvkuwa.mp3"
      }
    ];

    let menu = "Choisis une chanson 🎧\n\n";
    songs.forEach((s, i) => {
      menu += `${i + 1}. ${s.name}\n`;
    });

    return message.reply(frame(menu), (err, info) => {
      global.GoatBot.onReply.push({
        name: this.config.name,
        messageID: info.messageID,
        author: event.senderID,
        songs
      });
    });
  },

  onReply: async function ({ message, event, Reply }) {
    const choice = parseInt(event.body);

    if (!choice || choice < 1 || choice > Reply.songs.length) {
      return message.reply(frame("❌ Choix invalide nya~"));
    }

    const song = Reply.songs[choice - 1];

    return message.reply({
      body: frame(`🎶 Lecture : ${song.name}`),
      attachment: await global.utils.getStreamFromURL(song.url)
    });
  }
};
