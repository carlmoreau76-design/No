const axios = require("axios");
const fs = require("fs");
const path = require("path");

// ───── OPENAI API ─────
const OPENAI_API_KEY = "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";

// ───── OWNER ─────
const OWNER_UID = "61573867120837";
const OWNER_NAME = "Shade";

// ───── MEMORY FILE ─────
const memoryFile = path.join(__dirname, "cache", "angel_memory.json");

if (!fs.existsSync(memoryFile)) {
  fs.writeFileSync(memoryFile, "{}");
}

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

// ───── FONT STYLE ─────
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

// ───── AI CALL ─────
async function callAI(prompt) {

  // ───── OPENAI ─────
  try {

    const openai = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "Tu es ANGEL 🤍 une IA féminine kawaii, douce, intelligente et naturelle."
          },
          {
            role: "user",
            content: prompt
          }
        ]
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${OPENAI_API_KEY}`
        },
        timeout: 20000
      }
    );

    const reply = openai.data?.choices?.[0]?.message?.content;

    if (reply) return reply;

  } catch (err) {

    console.log("OpenAI failed");

  }

  // ───── FREE FALLBACK ─────
  try {

    const free = await axios.get(
      "https://ai-chat-gpt-4-lite.onrender.com/api/hercai",
      {
        params: {
          question: prompt
        },
        timeout: 15000
      }
    );

    return (
      free.data?.reply ||
      free.data?.response ||
      free.data?.message ||
      "… Angel réfléchit doucement 🌸"
    );

  } catch (err) {

    console.log("Fallback failed");

  }

  return "… erreur système angel 😿";
}

// ───── GENERATE ─────
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

// ───── EXPORT ─────
module.exports = {
  config: {
    name: "angel",
    version: "3.0",
    author: "Shade",
    role: 0,
    category: "ai",
    shortDescription: "Angel AI OpenAI Hybrid"
  },

  // ───── COMMAND ─────
  onStart: async function ({ message, event, args, api }) {

    const input = args.join(" ").trim();

    const userID = event.senderID;

    const userName =
      (await api.getUserInfo(userID))[userID]?.name || "toi";

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

  // ───── CHAT AUTO + REPLY SYSTEM ─────
onChat: async function ({ event, message, api }) {

  if (!event.body) return;

  const body = event.body.trim();
  const userID = event.senderID;

  const userName =
    (await api.getUserInfo(userID))[userID]?.name || "toi";

  // ───── SI LA PERSONNE REPOND A ANGEL ─────
  if (
    event.messageReply &&
    event.messageReply.senderID == api.getCurrentUserID()
  ) {

    const reply = await generate(
      userID,
      userName,
      body
    );

    return message.reply(reply);
  }

  // ───── ACTIVATION AVEC "angel" ─────
  if (!body.toLowerCase().startsWith("angel")) return;

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
