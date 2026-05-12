const axios = require("axios");
const fs = require("fs");
const path = require("path");

const GoatStor = "https://goatstore.vercel.app";

// 💖 FRAME KAWAII
function frame(text) {
  return `
╭───『 🐐 𝗚𝗢𝗔𝗧𝗦𝗧𝗢𝗥 🌸 』───╮
${text}
╰────────────────────╯
`;
}

// 🌸 police stylée
function font(text) {
  const map = {
    a:"𝘢",b:"𝘣",c:"𝘤",d:"𝘥",e:"𝘦",f:"𝘧",g:"𝘨",h:"𝘩",i:"𝘪",
    j:"𝘫",k:"𝘬",l:"𝘭",m:"𝘮",n:"𝘯",o:"𝘰",p:"𝘱",q:"𝘲",r:"𝘳",
    s:"𝘴",t:"𝘵",u:"𝘶",v:"𝘷",w:"𝘸",x:"𝘹",y:"𝘺",z:"𝘻"
  };
  return text.toLowerCase().split("").map(c => map[c] || c).join("");
}

module.exports = {
  config: {
    name: "goatstor",
    aliases: ["gs", "market"],
    version: "0.0.1",
    role: 0,
    author: "ArYAN",
    shortDescription: {
      en: "🐐 GoatStor kawaii marketplace"
    },
    category: "market",
    cooldowns: 0,
  },

  onStart: async ({ api, event, args, message }) => {

    const send = (txt) => message.reply(frame(font(txt)));

    try {

      if (!args[0]) {
        return send(
`🌸 commands:

📦 show <id>
├ voir une commande

📄 page <num>
├ parcourir les commandes

🔍 search <text>
├ rechercher

🔥 trending
├ commandes populaires

💝 like <id>
├ aimer une commande

⬆️ upload <name>
├ publier une commande`
        );
      }

      const cmd = args[0].toLowerCase();

      switch (cmd) {

        // 📦 SHOW
        case "show": {
          const id = parseInt(args[1]);
          if (isNaN(id)) return send("donne un id valide 🌸");

          const { data: item } = await axios.get(`${GoatStor}/api/item/${id}`);

          return send(
`🌸 ${item.itemName}

🆔 id: ${item.itemID}
⚙️ type: ${item.type}
📝 desc: ${item.description}
👑 author: ${item.authorName}
👀 views: ${item.views}
💝 likes: ${item.likes}

🔗 link:
${GoatStor}/raw/${item.rawID}`
          );
        }

        // 📄 PAGE
        case "page": {
          const page = parseInt(args[1]) || 1;

          const { data } = await axios.get(
            `${GoatStor}/api/items?page=${page}&limit=5`
          );

          const list = data.items.map((it, i) =>
`🌸 ${i+1}. ${it.itemName}
🆔 ${it.itemID} | 💝 ${it.likes} | 👀 ${it.views}`
          ).join("\n\n");

          return send(`📄 page ${page}\n\n${list}`);
        }

        // 🔍 SEARCH
        case "search": {
          const q = args.slice(1).join(" ");
          if (!q) return send("donne un texte 🌸");

          const { data } = await axios.get(
            `${GoatStor}/api/items?search=${encodeURIComponent(q)}`
          );

          const list = data.items.slice(0, 5).map((it, i) =>
`🌸 ${i+1}. ${it.itemName}
🆔 ${it.itemID}
💝 ${it.likes}`
          ).join("\n\n");

          return send(`🔍 results for "${q}"\n\n${list}`);
        }

        // 🔥 TRENDING
        case "trending": {
          const { data } = await axios.get(`${GoatStor}/api/trending`);

          const list = data.slice(0, 5).map((it, i) =>
`🔥 ${i+1}. ${it.itemName}
💝 ${it.likes} | 👀 ${it.views}`
          ).join("\n\n");

          return send(`🔥 trending\n\n${list}`);
        }

        // 💝 LIKE
        case "like": {
          const id = parseInt(args[1]);
          if (isNaN(id)) return send("donne un id 🌸");

          const { data } = await axios.post(
            `${GoatStor}/api/items/${id}/like`
          );

          return send(`💝 liked!\ntotal: ${data.likes}`);
        }

        default:
          return send("commande inconnue 🌸");

      }

    } catch (e) {
      console.log(e);
      return send("erreur serveur 💔");
    }
  }
};
