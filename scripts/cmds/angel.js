const axios = require("axios");
const fs = require("fs");
const path = require("path");

const memoryFile = path.join(__dirname, "cache", "angel_memory.json");

if (!fs.existsSync(memoryFile)) {
  fs.writeFileSync(memoryFile, "{}");
}

const OWNER_UID = "61573867120837";
const OWNER_NAME = "Shade";

// ───── GEMINI API ─────
const API_KEY = "AIzaSyBTILUPF0fUlt_686C8tWX3HomBjQ44qxA";

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

// ───── STYLE KAWAII ─────
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

// ───── IA CALL GEMINI ─────
async function callAI(prompt) {
  try {

    const res = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`,
      {
        contents: [
          {
            parts: [
              { text: prompt }
            ]
          }
        ]
      }
    );

    return (
      res.data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "… Angel réfléchit doucement 🌸"
    );

  } catch (err) {

    console.log(err.response?.data || err.message);

    return "… erreur système angel 😿";
  }
}

// ───── CORE ─────
async function generate(userID, userName, message) {

  if (!memory[userID]) memory[userID] = [];

  memory[userID].push({
    name: userName,
    msg: message
  });

  if (memory[userID].length > 30) {
    memory[userID].shift();
  }

  saveMemory();

  const isOwner = userID === OWNER_UID;

  let prompt = `
Tu es ANGEL 🤍 une IA féminine kawaii, douce et intelligente.

Règles:
- Tu es polie
- Tu es douce
- Tu es stylée
- Tu peux être légèrement taquine
- Tu respectes tout le monde
- Tu réponds naturellement
- Tu utilises parfois des emojis 🌸✨💖

Créateur:
${OWNER_NAME} (${OWNER_UID})

Conversation:
${memory[userID]
  .map(m => `${m.name}: ${m.msg}`)
  .join("\n")}
`;

  if (isOwner) {
    prompt += `
Tu reconnais Shade comme ton créateur.
Tu lui réponds avec plus d’attention et de douceur 💖
`;
  }

  if (/qui.*cr[eé]e|creator|createur/i.test(message)) {
    return frame(font("Mon créateur est Shade 🌸✨"));
  }

  const reply = await callAI(prompt);

  memory[userID].push({
    name: "ANGEL",
    msg: reply
  });

  saveMemory();

  return frame(font(reply));
}

// ───── EXPORT BOT ─────
module.exports = {
  config: {
    name: "angel",
    version: "2.1",
    author: "Shade",
    role: 0,
    category: "ai",
    shortDescription: "Angel AI kawaii Gemini"
  },

  // commande !angel
  onStart: async function ({ message, event, args, api }) {

    const input = args.join(" ").trim();

    const userID = event.senderID;

    const userName =
      (await api.getUserInfo(userID))[userID]?.name || "toi";

    // juste !angel
    if (!input) {

      await message.reply({
        sticker: "125881936546154"
      });

      return message.reply(
        frame(font("bonjour 🌸 je suis Angel… parle-moi doucement 💖"))
      );
    }

    const reply = await generate(
      userID,
      userName,
      input
    );

    return message.reply(reply);
  },

  // message direct : angel salut
  onChat: async function ({ event, message, api }) {

    if (!event.body) return;

    const body = event.body.trim();

    // activation sans !
    if (!body.toLowerCase().startsWith("angel")) return;

    const userID = event.senderID;

    const userName =
      (await api.getUserInfo(userID))[userID]?.name || "toi";

    // juste "angel"
    if (body.toLowerCase() === "angel") {

      await message.reply({
        sticker: "125881936546154"
      });

      return message.reply(
        frame(font("bonjour 🌸 je suis Angel… parle-moi doucement 💖"))
      );
    }

    // angel + message
    const input = body.slice(5).trim();

    if (!input) return;

    const reply = await generate(
      userID,
      userName,
      input
    );

    return message.reply(reply);
  }
};
