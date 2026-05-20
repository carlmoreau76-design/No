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

// 🔑 OPENAI API 👇👇👇
const OPENAI_API_KEY = "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";

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

// 🤖 OPENAI (principal)
async function callOpenAI(prompt) {
  try {
    const res = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "Tu es Sae Itoshi. Réponds froidement, intelligemment, style anime."
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
          Authorization: `Bearer ${OPENAI_API_KEY}`
        }
      }
    );

    return res.data?.choices?.[0]?.message?.content || null;
  } catch {
    return null;
  }
}

// 🥈 BACKUP API (si OpenAI crash)
async function callBackup(prompt) {
  try {
    const res = await axios.get(
      "https://arychauhann.onrender.com/api/gemini-proxy2",
      {
        params: { prompt }
      }
    );

    return res.data?.reply || null;
  } catch {
    return null;
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
    version: "3.0",
    author: "Shade",
    role: 0,
    category: "ai"
  },

  onChat: async function ({ event, message, api }) {

  if (!event.body) return;

  const body = event.body.trim();
  const userID = event.senderID;

  // ───── USER INFO ─────
  const userName =
    (await api.getUserInfo(userID))[userID]?.name || "inconnu";

  // ───── 1. SI MESSAGE COMMENCE PAR "sae" ─────
  const isSaeCommand = body.toLowerCase().startsWith("sae");

  const textFromCommand = isSaeCommand ? body.slice(3).trim() : null;

  // ───── 2. SI C'EST UNE RÉPONSE À SAE ─────
  const isReplyToSae =
    event.messageReply &&
    event.messageReply.senderID == api.getCurrentUserID();

  // ───── SI AUCUN DES DEUX → STOP ─────
  if (!isSaeCommand && !isReplyToSae) return;

  // ───── TEXTE FINAL ─────
  let text = "";

  if (isSaeCommand) {
    text = textFromCommand;
  } else {
    text = body; // réponse normale
  }

  if (!text) {
    return message.reply(frame(font("...")));
  }

  // ───── PROMPT + IA ─────
  const prompt = buildPrompt(
    userID,
    userName,
    text,
    memory[userID] || []
  );

  let reply = await callOpenAI(prompt);

  if (!reply) {
    reply = await callBackup(prompt);
  }

  if (!reply) {
    reply = "Tch… système instable.";
  }

  updateMemory(userID, text, reply);

  return message.reply(frame(font(reply)));
  }
