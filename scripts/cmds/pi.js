const axios = require("axios");

const models = {
  1: "Angel Soft ✨",
  2: "Angel Cute 🌸",
  3: "Angel Smart 💡",
  4: "Angel Calm 🌙",
  5: "Angel Pro 🤖",
  6: "Angel Anime 💖",
  7: "Angel Ultra ⚡",
  8: "Angel Dark 🖤"
};

module.exports = {
  config: {
    name: "pi",
    version: "angel-ai-1.0",
    author: "Angel ✨",
    role: 0,
    category: "🌸 ai",
    description: {
      fr: "🤖 Assistant Angel AI avec voix et styles personnalisés"
    },
    guide: {
      fr:
`🌸 Commandes :
• angel <message>
• angel voice on/off
• angel voice 1-8
• angel list`
    }
  },

  onStart: async function ({ message, args, event, usersData }) {

    const uid = event.senderID;
    const input = args.join(" ").trim();

    if (!input)
      return message.reply("🌸 Écris quelque chose pour parler avec Angel AI ✨");

    let data = await usersData.get(uid, "data.angel_ai");

    if (!data) {
      data = { voice: false, model: 1 };
      await usersData.set(uid, data, "data.angel_ai");
    }

    // 🌸 SETTINGS
    if (input.toLowerCase().startsWith("voice")) {
      const cmd = input.split(" ")[1];

      if (!cmd)
        return message.reply("🌸 Utilise: voice on / off / 1-8");

      if (cmd === "on") data.voice = true;
      else if (cmd === "off") data.voice = false;
      else if (models[cmd]) {
        data.voice = true;
        data.model = parseInt(cmd);
      } else {
        return message.reply("🌸 Modèles disponibles: 1 à 8");
      }

      await usersData.set(uid, data, "data.angel_ai");

      return message.reply(
`🌸 ANGEL AI SETTINGS

🔊 Voice: ${data.voice ? "ON" : "OFF"}
🎙️ Model: ${models[data.model]}`
      );
    }

    if (input.toLowerCase() === "list") {
      return message.reply(
`🌸 ANGEL AI MODELS

${Object.entries(models)
  .map(([k, v]) => `🔢 ${k} → ${v}`)
  .join("\n")}`
      );
    }

    // 🌸 SESSION
    const session = `angel-${uid}`;

    try {
      const res = await callAngelAI(input, session, data.voice, data.model);

      if (!res?.text)
        return message.reply("🌸 Angel n’a pas répondu…");

      const reply = { body: res.text };

      if (data.voice && res.audio) {
        reply.attachment = await global.utils.getStreamFromURL(res.audio);
      }

      return message.reply(reply);

    } catch (e) {
      return message.reply("🌸 Erreur Angel AI : " + e.message);
    }
  }
};

// 🌸 API CALL
async function callAngelAI(query, session, voice, model) {
  const { data } = await axios.get(
    `https://example-ai-api.com/angel?query=${encodeURIComponent(query)}&session=${session}&voice=${voice}&model=${model}`
  );

  return data.result;
}
