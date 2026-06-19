const axios = require("axios");

const availableTEMPLATES = {
  "1": "Lumière Néon Multicolore",
  "2": "Style Galaxie Nom Libre",
  "3": "Texte 3D Sous l'Eau",
  "4": "Logo Viettel",
  "5": "Typographie sur Pavé",
  "6": "Texte 3D Cochon Mignon",
  "7": "Effet Lumière Néon Verte",
  "8": "Texte Lumière Futuriste",
  "9": "Graffiti Couverture",
  "10": "Texte Ailes du Diable Néon",
  "11": "Effets Glow Avancés",
  "12": "Texte Style Dragon Ball",
  "13": "Effet Texte Métal Bleu",
  "14": "Or Moderne",
  "15": "Effet Arbre Galaxie",
  "16": "Lettres Or en Ligne",
  "17": "Créateur Logo Mascottes Métal",
  "18": "Effet Texte Plasma",
  "19": "Texte Brouillard Manuscrit",
  "20": "Or Moderne 3"
  // (je garde court sinon ça spam trop)
};

module.exports = {
  config: {
    name: "ephoto",
    version: "🌸1.1 angel kawaii",
    author: "Christus × Angel Edit ✨",
    countDown: 5,
    role: 0,
    shortDescription: "💖 angel ephoto generator",
    longDescription: "🌸 create magical kawaii text effects",
    category: "image",
    guide: {
      fr: "{pn} <texte> - <id>\n{pn} list"
    }
  },

  onStart: async function ({ event, message, args, api }) {

    const prefix =
      global.utils?.getPrefix
        ? await global.utils.getPrefix(event.threadID)
        : "/";

    const input = args.join(" ").trim();

    /* 🌸 LIST MODE */
    if (input.toLowerCase() === "list") {
      let msg =
`╭─── 🌸 𝗔𝗡𝗚𝗘𝗟 𝗘𝗣𝗛𝗢𝗧𝗢 ───╮
💖 Available templates (1–100)
━━━━━━━━━━━━━━\n`;

      for (const i in availableTEMPLATES) {
        msg += `✨ ${i.padStart(2, "0")} ➜ ${availableTEMPLATES[i]}\n`;
      }

      msg +=
`\n╰────────────────────╯
💡 ${prefix}ephoto <texte> - <id>`;

      return message.reply(msg);
    }

    const parts = input.split("-");
    const text = parts[0]?.trim();
    const id = parseInt(parts[1]?.trim());

    if (!text || !id) {
      return message.reply(
`╭─── 💔 𝗔𝗡𝗚𝗘𝗟 𝗘𝗣𝗛𝗢𝗧𝗢 ───╮
⚠️ Usage incorrect
💡 ${prefix}ephoto <texte> - <id>
╰────────────────────╯`
      );
    }

    if (isNaN(id) || id < 1 || id > 100) {
      return message.reply(
`╭─── ❌ 𝗜𝗗 𝗜𝗡𝗩𝗔𝗟𝗜𝗗 ───╮
💔 ID must be between 1 and 100
🌸 use: ${prefix}ephoto list
╰────────────────────╯`
      );
    }

    const loading = await message.reply(
`💖🌸 Angel is creating your magic text...
✨ please wait sweetie~`
    );

    try {
      const githubRawUrl = "https://raw.githubusercontent.com/Saim-x69x/sakura/main/ApiUrl.json";
      const apiRes = await axios.get(githubRawUrl);
      const baseUrl = apiRes.data.apiv1;

      const res = await axios.get(
        `${baseUrl}/api/ephoto?id=${id}&text=${encodeURIComponent(text)}`
      );

      if (!res.data?.status || !res.data.result_url) {
        return message.reply(
`╭─── 💔 𝗘𝗥𝗥𝗢𝗥 ───╮
❌ Failed to generate image
🌸 Try again later
╰────────────────╯`
        );
      }

      return message.reply({
        body:
`╭─── 💖 𝗔𝗡𝗚𝗘𝗟 𝗘𝗣𝗛𝗢𝗧𝗢 ───╮
✨ Successfully generated
🆔 ID: ${id}
💖 Style: ${availableTEMPLATES[id] || "Unknown"}
🔤 Text: ${text}
╰────────────────────╯`,
        attachment: await global.utils.getStreamFromURL(res.data.result_url)
      });

    } catch (e) {
      console.log(e);

      return message.reply(
`╭─── 💔 𝗖𝗥𝗜𝗧𝗜𝗖𝗔𝗟 𝗘𝗥𝗥𝗢𝗥 ───╮
❌ Server error
💫 Try again later angel~
╰────────────────────╯`
      );
    }
  }
};
