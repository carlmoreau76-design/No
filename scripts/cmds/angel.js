const axios = require("axios");
const fs = require("fs");
const path = require("path");

const memoryFile = path.join(__dirname, "cache", "angel_memory.json");

if (!fs.existsSync(memoryFile)) {
  fs.writeFileSync(memoryFile, "{}");
}

const OWNER_UID = "61573867120837";
const OWNER_NAME = "Shade";

// ───── MEMORY ─────
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

// ───── STYLE KAWAII 𝘧𝘰𝘯𝘵 ─────
function font(text) {
  return text
    .replace(/a/g, "𝘢").replace(/b/g, "𝘣").replace(/c/g, "𝘤")
    .replace(/d/g, "𝘥").replace(/e/g, "𝘦").replace(/f/g, "𝘧")
    .replace(/g/g, "𝘨").replace(/h/g, "𝘩").replace(/i/g, "𝘪")
    .replace(/j/g, "𝘫").replace(/k/g, "𝘬").replace(/l/g, "𝘭")
    .replace(/m/g, "𝘮").replace(/n/g, "𝘯").replace(/o/g, "𝘰")
    .replace(/p/g, "𝘱").replace(/q/g, "𝘲").replace(/r/g, "𝘳")
    .replace(/s/g, "𝘴").replace(/t/g, "𝘵").replace(/u/g, "𝘶")
    .replace(/v/g, "𝘷").replace(/w/g, "𝘸").replace(/x/g, "𝘹")
    .replace(/y/g, "𝘺").replace(/z/g, "𝘻");
}

// ───── FRAME ─────
function frame(msg) {
  return `🌸 𝗔𝗡𝗚𝗘𝗟 𝗔𝗜 🌸\n━━━━━━━━━━\n${msg}\n━━━━━━━━━━`;
}

// ───── IA CALL (FIXED) ─────
async function callAI(prompt) {
  try {

    const res = await axios.get("https://shizuai.vercel.app/chat", {
      params: { prompt }
    });

    console.log(res.data);

    return (
      res.data.response ||
      res.data.reply ||
      res.data.message ||
      "… Angel réfléchit 🌸"
    );

  } catch (err) {
    console.log(err.message);
    return "… erreur système angel 😿";
  }
}

// ───── CORE ─────
async function generate(userID, userName, message) {

  if (!memory[userID]) memory[userID] = [];

  memory[userID].push({ name: userName, msg: message });
  if (memory[userID].length > 30) memory[userID].shift();
  saveMemory();

  const isOwner = userID === OWNER_UID;

  let prompt = `
Tu es ANGEL 🤍 une IA féminine kawaii, douce et intelligente.

Règles:
- Tu es polie, douce, stylée
- Tu peux être un peu taquine
- Tu respectes tout le monde
- Tu es légèrement plus attentive avec ton créateur (Shade)

Créateur: ${OWNER_NAME} (${OWNER_UID})

Conversation:
${memory[userID].map(m => `${m.name}: ${m.msg}`).join("\n")}

Réponds naturellement avec emojis 🌸✨
`;

  if (isOwner) {
    prompt += `\nTu reconnais Shade comme ton créateur et tu lui réponds avec plus d’attention 💖`;
  }

  if (/qui.*cr[eé]e|creator|createur/i.test(message)) {
    return frame(font(`Mon créateur est Shade 🌸✨`));
  }

  const reply = await callAI(prompt);

  memory[userID].push({ name: "ANGEL", msg: reply });
  saveMemory();

  return frame(font(reply));
}

// ───── EXPORT BOT ─────
module.exports = {
  config: {
    name: "angel",
    version: "1.0",
    author: "Shade",
    role: 0,
    category: "ai",
    shortDescription: "Angel AI kawaii + mémoire + owner mode"
  },

  onStart: async function ({ message, event, args, api }) {
    const input = args.join(" ").trim();
    const userID = event.senderID;
    const userName = (await api.getUserInfo(userID))[userID]?.name || "toi";

    if (!input) {
      return message.reply(frame(font("bonjour 🌸 je suis Angel… parle-moi doucement")));
    }

    const reply = await generate(userID, userName, input);
    message.reply(reply);
  },

  onChat: async function ({ event, message, api }) {
    if (!event.body) return;

    const body = event.body.trim();
    const match = body.match(/^angel\s+(.*)/i);
    if (!match) return;

    const input = match[1];
    const userID = event.senderID;
    const userName = (await api.getUserInfo(userID))[userID]?.name || "toi";

    const reply = await generate(userID, userName, input);
    message.reply(reply);
  }
};
