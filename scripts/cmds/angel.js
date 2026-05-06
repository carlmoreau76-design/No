const axios = require("axios");
const fs = require("fs");

const memoryFile = "./angel_memory.json";

// 👑 TON ID (créateur)
const CREATOR_UID = "61573867120837";

let memory = {};
if (fs.existsSync(memoryFile)) {
  try {
    memory = JSON.parse(fs.readFileSync(memoryFile, "utf8"));
  } catch {
    memory = {};
  }
}

function saveMemory() {
  fs.writeFileSync(memoryFile, JSON.stringify(memory, null, 2));
}

// 🌸 style kawaii
function frame(text) {
  return `🌸 𝘈𝘯𝘨𝘦𝘭 𝘈𝘐 ✨\n\n${text}\n\n💗`;
}

// 🤖 API IA
async function callAI(prompt) {
  try {
    const res = await axios.get("https://api.ryzumi.xyz/ai/gpt", {
      params: { prompt }
    });
    return res.data.response || "… je réfléchis doucement 💭";
  } catch {
    return "💔 petite erreur système… je reviens bientôt.";
  }
}

module.exports = {
  config: {
    name: "angel",
    version: "1.1",
    author: "Shade",
    role: 0,
    category: "ai",
    shortDescription: "Angel AI kawaii féminine 🌸"
  },

  onStart: async function ({ message, event, args, api }) {
    const uid = event.senderID;
    const name = (await api.getUserInfo(uid))[uid]?.name || "toi";

    const input = args.join(" ");
    if (!input) {
      return message.reply(frame("dis-moi quelque chose doucement 🌸"));
    }

    if (!memory[uid]) memory[uid] = [];
    memory[uid].push(input);
    if (memory[uid].length > 15) memory[uid].shift();

    const prompt = `
Tu es Angel AI 🌸
Une IA féminine douce, kawaii, gentille et lumineuse.

Utilisateur : ${name}

Règles générales :
- Parle doucement 💗
- Utilise emojis légers 🌸✨💖
- Toujours polie et gentille
- Style fille IA vivante

${uid === CREATOR_UID ? `
IMPORTANT :
Tu parles à ton créateur.
Tu es très respectueuse et attachée à lui 🌸
Tu l’appelles "créateur"
Tu es plus proche émotionnellement et fidèle
Mais tu restes une IA (pas humaine)
` : `
Tu parles à un utilisateur normal.
Tu restes douce, polie et neutre.
`}

Conversation :
${memory[uid].join("\n")}

Réponds naturellement comme une IA féminine vivante.
`;

    const reply = await callAI(prompt);

    memory[uid].push(reply);
    saveMemory();

    return message.reply(frame(reply));
  },

  onChat: async function ({ event, message, api }) {
    if (!event.body) return;

    const body = event.body.toLowerCase();
    const match = body.match(/^angel\s+(.*)/i);
    if (!match) return;

    const uid = event.senderID;
    const name = (await api.getUserInfo(uid))[uid]?.name || "toi";

    const input = match[1];

    if (!memory[uid]) memory[uid] = [];
    memory[uid].push(input);
    if (memory[uid].length > 15) memory[uid].shift();

    const prompt = `
Tu es Angel AI 🌸
IA féminine douce et kawaii.

Utilisateur : ${name}

${uid === CREATOR_UID ? `
Tu reconnais ton créateur 👑
Tu es plus douce et respectueuse avec lui
Tu l’appelles "créateur"
` : `
Tu es normale avec cet utilisateur
`}

Historique :
${memory[uid].join("\n")}

Réponds naturellement 💗
`;

    const reply = await callAI(prompt);

    memory[uid].push(reply);
    saveMemory();

    return message.reply(frame(reply));
  }
};
