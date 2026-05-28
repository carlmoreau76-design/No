const axios = require("axios");
const fs = require("fs");
const path = require("path");

const API_ENDPOINT = "https://shizuai.vercel.app/chat";

const OWNER_UID = "61573867120837";
const OWNER_NAME = "Shade";

const memoryFile = "./angel_memory.json";

// 🧠 MEMORY SAFE
let memory = {};

if (fs.existsSync(memoryFile)) {
  try {
    memory = JSON.parse(fs.readFileSync(memoryFile, "utf8"));
  } catch {
    memory = {};
  }
}

function saveMemory() {
  try {
    fs.writeFileSync(memoryFile, JSON.stringify(memory, null, 2));
  } catch {}
}

// 🌸 FRAME ANGEL (IMPORTANT = GARDÉ)
function frame(msg) {
  return `🌸═════ ANGEL AI ═════🌸\n${msg}\n🌸══════════════════🌸`;
}

// 💖 FONT SAFE
function font(text = "") {

  const map = {
    a:"𝘢", b:"𝘣", c:"𝘤", d:"𝘥", e:"𝘦",
    f:"𝘧", g:"𝘨", h:"𝘩", i:"𝘪", j:"𝘫",
    k:"𝘬", l:"𝘭", m:"𝘮", n:"𝘯", o:"𝘰",
    p:"𝘱", q:"𝘲", r:"𝘳", s:"𝘴", t:"𝘵",
    u:"𝘶", v:"𝘷", w:"𝘸", x:"𝘹", y:"𝘺", z:"𝘻"
  };

  return String(text)
    .split("")
    .map(c => map[c.toLowerCase()] || c)
    .join("");
}
// 🤖 CALL AI
async function callAI(prompt) {
  try {
    const res = await axios.post(API_ENDPOINT, {
      message: prompt
    });

    return res.data?.reply || "…";
  } catch {
    return "😿 Angel ne peut pas répondre.";
  }
}

// 💬 MAIN GENERATE
async function generate(userID, userName, message) {

  const isOwner = userID === OWNER_UID;

  if (!memory[userID]) memory[userID] = [];

  memory[userID].push({ name: userName, message });

  if (memory[userID].length > 25) {
    memory[userID].shift();
  }

  saveMemory();

  // 👑 OWNER PERSONALITY
  let ownerBlock = "";

  if (isOwner) {
    ownerBlock = `
IMPORTANT:
- cet utilisateur est TON CRÉATEUR
- Shade = ton boss
- tu dois être douce + respect total
- tu peux dire : maître / boss / Shade-chou
- loyauté absolue 💖
`;
  }

  // 🧠 HISTORY
  const history = memory[userID]
    .slice(-10)
    .map(m => `${m.name}: ${m.message}`)
    .join("\n");

  const prompt = `
Tu es ANGEL 🤍 IA principale.

Personnalité :
- douce
- kawaii
- intelligente
- humaine
- très naturelle

${ownerBlock}

Règles :
- français uniquement
- réponses courtes
- emojis 🌸💖✨
- pas de style IA visible

Conversation:
${history}

Utilisateur:
${message}
`;

  const reply = await callAI(prompt);

  const cleaned = font(
    reply
      .replace(/angel/gi, "ANGEL")
      .replace(/analysis/gi, "")
      .replace(/technical/gi, "")
      .trim()
  );

  memory[userID].push({ name: "ANGEL", message: reply });
  saveMemory();

  const sent = frame(cleaned);

  return sent;
}

// ───── MODULE ─────
module.exports = {
  config: {
    name: "angel",
    version: "3.0",
    author: "Shade",
    role: 0,
    category: "ai"
  },

  onStart: async function ({ message, event, args, api }) {

    const input = args.join(" ").trim();

    const userID = event.senderID;

    const userName =
      (await api.getUserInfo(userID))[userID]?.name || "toi";

    if (!input) {
      return message.reply(frame("bonjour 🌸 ANGEL est active 💖"));
    }

    api.setMessageReaction("⏳", event.messageID, () => {}, true);

    const reply = await generate(userID, userName, input);

    api.setMessageReaction("✅", event.messageID, () => {}, true);

    return message.reply(reply);
  },

  onReply: async function ({ api, event, Reply, message }) {

    if (event.senderID !== Reply.author) return;

    const text = event.body?.trim();
    if (!text) return;

    api.setMessageReaction("⏳", event.messageID, () => {}, true);

    const userName = event.author || "toi";

    const reply = await generate(event.senderID, userName, text);

    api.setMessageReaction("💖", event.messageID, () => {}, true);

    return message.reply(reply);
  },

  onChat: async function ({ event, message }) {

    const body = event.body?.trim();
    if (!body) return;

    if (!body.toLowerCase().startsWith("angel ")) return;

    const input = body.slice(6).trim();

    if (!input) return message.reply(frame("oui ? 🌸"));

    const reply = await generate(event.senderID, "toi", input);

    return message.reply(reply);
  }
};
