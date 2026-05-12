const axios = require("axios");
const fs = require("fs");
const path = require("path");

const memoryFile = path.join(__dirname, "cache", "sae_memory.json");

if (!fs.existsSync(memoryFile)) {
  fs.writeFileSync(memoryFile, "{}");
}

// 👑 IDENTITÉ
const CREATOR_UID = "61573867120837";
const CREATOR_NAME = "Shade";

// 🔑 GEMINI API
const API_KEY = "AIzaSyBTILUPF0fUlt_686C8tWX3HomBjQ44qxA";

// 🧠 mémoire
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

// 💠 style
function font(text) {
  const map = {
    a:"𝘢",b:"𝘣",c:"𝘤",d:"𝘥",e:"𝘦",f:"𝘧",g:"𝘨",h:"𝘩",i:"𝘪",
    j:"𝘫",k:"𝘬",l:"𝘭",m:"𝘮",n:"𝘯",o:"𝘰",p:"𝘱",q:"𝘲",r:"𝘳",
    s:"𝘴",t:"𝘵",u:"𝘶",v:"𝘷",w:"𝘸",x:"𝘹",y:"𝘺",z:"𝘻"
  };
  return text.split("").map(c => map[c.toLowerCase()] || c).join("");
}

// ❄️ frame
function frame(msg) {
  return `╭━━━ ❄️ 𝗦𝗔𝗘 𝗜𝗧𝗢𝗦𝗛𝗜 ❄️ ━━━╮\n${msg}\n╰━━━━━━━━━━━━━━━━━━╯`;
}

// 🤖 GEMINI CALL
async function callAI(prompt) {
  try {
    const res = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`,
      {
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ]
      }
    );

    return (
      res.data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "…"
    );

  } catch (err) {
    return "Tch… système instable.";
  }
}

// 🧠 personnalité
function getPersonality(userID) {
  return userID === CREATOR_UID ? "respect" : "arrogant";
}

// 💬 prompt
function buildPrompt(userID, userName, text, history) {

  const mood = getPersonality(userID);

  let style = "";

  if (mood === "respect") {
    style = `
Tu es Sae Itoshi.
Utilisateur = TON CRÉATEUR (${CREATOR_NAME}).
Tu es respectueux, calme, loyal.
`;
  } else {
    style = `
Tu es Sae Itoshi.
Tu es froid, arrogant, intelligent.
Réponses courtes.
`;
  }

  return `
${style}

Utilisateur: ${userName}
Message: ${text}

Historique:
${history.join("\n")}

Réponds naturellement.
`;
}

// 💾 mémoire update
function updateMemory(userID, text, reply) {
  if (!memory[userID]) memory[userID] = [];

  memory[userID].push(`🧍 ${text}`);
  memory[userID].push(`❄️ ${reply}`);

  if (memory[userID].length > 30) {
    memory[userID].splice(0, 2);
  }

  saveMemory();
}

// ───── BOT ─────
module.exports = {
  config: {
    name: "sae",
    version: "2.2",
    author: "Shade",
    role: 0,
    category: "ai"
  },

  onChat: async function ({ event, message, api }) {

    if (!event.body) return;

    const body = event.body.trim().toLowerCase();

    // ✅ déclenchement naturel : "sae" OU "sae message"
    if (!body.startsWith("sae")) return;

    const text = event.body.slice(3).trim();
    if (!text) {
      return message.reply(frame(font("…")));
    }

    const userID = event.senderID;

    const userName =
      (await api.getUserInfo(userID))[userID]?.name || "inconnu";

    if (!memory[userID]) memory[userID] = [];

    const prompt = buildPrompt(userID, userName, text, memory[userID]);

    const reply = await callAI(prompt);

    updateMemory(userID, text, reply);

    return message.reply(frame(font(reply)));
  }
};
