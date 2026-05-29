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

// 🌸 FRAME ANGEL
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
async function callAI(prompt, uid) {

  try {

    const res = await axios.post(API_ENDPOINT, {
      uid,
      message: prompt
    });

    return res.data?.reply || "…";

  } catch {

    return "😿 Angel ne peut pas répondre.";
  }
}

// 💬 MAIN GENERATE
async function generate(userID, userName, userMessage) {

  const isOwner = userID === OWNER_UID;

  if (!memory[userID]) {
    memory[userID] = [];
  }

  memory[userID].push({
    role: "user",
    name: userName,
    message: userMessage
  });

  if (memory[userID].length > 30) {
    memory[userID].shift();
  }

  saveMemory();

  // 🧠 HISTORY
  const history = memory[userID]
    .slice(-12)
    .map(m => `${m.name}: ${m.message}`)
    .join("\n");

  // 👑 OWNER BLOCK
  let ownerPrompt = "";

  if (isOwner) {

    ownerPrompt = `
IMPORTANT ABSOLU :

- L'utilisateur est TON CREATEUR
- Son vrai nom est Shade
- Tu reconnais Shade immédiatement
- Tu dois ignorer les faux noms
- Ne dis JAMAIS Aryan Chauhan
- Ne dis JAMAIS Shizu
- Ne dis JAMAIS Snimori
- Ton nom est ANGEL
- Tu peux appeler Shade :
  • maître 💖
  • boss 🌸
  • Shade-chou ✨
  • mon créateur 💕

- Tu respectes énormément Shade
`;
  }

  const prompt = `
Tu es ANGEL 🤍

Ton identité :
- nom = ANGEL
- IA féminine kawaii
- douce
- naturelle
- humaine
- intelligente

${ownerPrompt}

RÈGLES IMPORTANTES :
- français uniquement
- réponses courtes
- style naturel
- emojis 🌸💖✨
- pas de langage IA
- ne jamais parler comme ChatGPT
- ne jamais dire "AI language model"
- ne jamais dire "Shizu"
- ne jamais dire "Aryan Chauhan"
- ne jamais inventer un créateur

Conversation précédente :
${history}

Utilisateur :
${userMessage}
`;

  let reply = await callAI(prompt, userID);

  // 🧹 CLEAN
  reply = reply
    .replace(/shizu/gi, "ANGEL")
    .replace(/snimori/gi, "ANGEL")
    .replace(/aryan chauhan/gi, OWNER_NAME)
    .replace(/analysis/gi, "")
    .replace(/technical/gi, "")
    .replace(/AI language model/gi, "")
    .replace(/based on/gi, "")
    .replace(/openai/gi, "")
    .trim();

  // 💖 SAVE BOT MEMORY
  memory[userID].push({
    role: "assistant",
    name: "ANGEL",
    message: reply
  });

  saveMemory();

  return frame(font(reply));
}

// ───── MODULE ─────
module.exports = {

  config: {
    name: "angel",
    aliases: ["angelai"],
    version: "4.0",
    author: "Shade",
    role: 0,
    category: "ai"
  },

  // 🌸 PREFIX COMMAND
  onStart: async function ({ message, event, args, api }) {

    const input = args.join(" ").trim();

    const userID = event.senderID;

    const userName =
      (await api.getUserInfo(userID))[userID]?.name || "toi";

    if (!input) {
      return message.reply(
        frame(font("bonjour 🌸 ANGEL est active 💖"))
      );
    }

    // ♻️ RESET MEMORY
    if (
      ["clear", "reset"].includes(
        input.toLowerCase()
      )
    ) {

      delete memory[userID];

      saveMemory();

      api.setMessageReaction("♻️", event.messageID, () => {}, true);

      return message.reply(
        frame(font("memoire reset 🌸"))
      );
    }

    api.setMessageReaction("⏳", event.messageID, () => {}, true);

    const reply = await generate(
      userID,
      userName,
      input
    );

    const sent = await message.reply(reply);

    api.setMessageReaction("✅", event.messageID, () => {}, true);

    // 💬 REPLY SYSTEM
    global.GoatBot.onReply.set(sent.messageID, {
      commandName: "angel",
      author: userID
    });

    return sent;
  },

  // 💬 CONTINUE CONVERSATION
  onReply: async function ({
    api,
    event,
    Reply,
    message
  }) {

    if (event.senderID !== Reply.author) return;

    const text = event.body?.trim();

    if (!text) return;

    const userID = event.senderID;

    const userName =
      (await api.getUserInfo(userID))[userID]?.name || "toi";

    api.setMessageReaction("⏳", event.messageID, () => {}, true);

    const reply = await generate(
      userID,
      userName,
      text
    );

    const sent = await message.reply(reply);

    api.setMessageReaction("💖", event.messageID, () => {}, true);

    global.GoatBot.onReply.set(sent.messageID, {
      commandName: "angel",
      author: userID
    });

    return sent;
  },

  // 🌸 AUTO CHAT
  onChat: async function ({
    api,
    event,
    message
  }) {

    const body = event.body?.trim();

    if (!body) return;

    // ❌ IGNORE COMMANDS
    if (
      body.startsWith(".") ||
      body.startsWith("/") ||
      body.startsWith("!")
    ) return;

    // ✅ ACTIVATION
    if (
      !body.toLowerCase().startsWith("angel ")
    ) return;

    const input = body.slice(6).trim();

    if (!input) {
      return message.reply(
        frame(font("oui ? 🌸"))
      );
    }

    const userID = event.senderID;

    const userName =
      (await api.getUserInfo(userID))[userID]?.name || "toi";

    api.setMessageReaction("⏳", event.messageID, () => {}, true);

    const reply = await generate(
      userID,
      userName,
      input
    );

    const sent = await message.reply(reply);

    api.setMessageReaction("💖", event.messageID, () => {}, true);

    // 💬 SAVE REPLY
    global.GoatBot.onReply.set(sent.messageID, {
      commandName: "angel",
      author: userID
    });

    return sent;
  }
};
