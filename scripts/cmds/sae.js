const axios = require("axios");
const fs = require("fs");

const memoryFile = "./sae_memory.json";

// 👑 TON IDENTITÉ
const CREATOR_UID = "61573867120837";
const CREATOR_NAME = "Shade";

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

// 💠 police stylée
function font(text) {
  const map = {
    a:"𝘢",b:"𝘣",c:"𝘤",d:"𝘥",e:"𝘦",f:"𝘧",g:"𝘨",h:"𝘩",i:"𝘪",
    j:"𝘫",k:"𝘬",l:"𝘭",m:"𝘮",n:"𝘯",o:"𝘰",p:"𝘱",q:"𝘲",r:"𝘳",
    s:"𝘴",t:"𝘵",u:"𝘶",v:"𝘷",w:"𝘸",x:"𝘹",y:"𝘺",z:"𝘻"
  };
  return text.split("").map(c => map[c] || c).join("");
}

// 🧊 cadre Sae
function frame(msg) {
  return `╭━━━ ❄️ 𝗦𝗔𝗘 𝗜𝗧𝗢𝗦𝗛𝗜 ❄️ ━━━╮\n${msg}\n╰━━━━━━━━━━━━━━━━━━╯`;
}

// 🤖 IA API
async function callAI(prompt) {
  try {
    const res = await axios.get("https://api.ryzumi.xyz/ai/gpt", {
      params: { prompt }
    });
    return res.data.response || "…";
  } catch {
    return "Tch… système instable.";
  }
}

// 🧠 analyser relation utilisateur
function getPersonality(userID) {
  if (userID === CREATOR_UID) {
    return "respect";
  }
  return "arrogant";
}

// 💬 construire prompt Sae
function buildPrompt(userID, userName, text, history) {
  const mood = getPersonality(userID);

  let style = "";

  if (mood === "respect") {
    style = `
Tu es Sae Itoshi.
Utilisateur = TON CRÉATEUR (${CREATOR_NAME}).
Tu es respectueux, calme, loyal.
Tu réponds avec respect et calme absolu.
`;
  } else {
    style = `
Tu es Sae Itoshi.
Tu es froid, arrogant, intelligent.
Tu méprises légèrement les autres.
Tu réponds court, précis, dominant.
Pas d’émotions inutiles.
`;
  }

  return `
${style}

Utilisateur: ${userName}
Message: ${text}

Historique:
${history.join("\n")}

Réponds naturellement comme Sae Itoshi.
`;
}

// 💾 gérer mémoire
function updateMemory(userID, text, reply) {
  if (!memory[userID]) memory[userID] = [];

  memory[userID].push(`🧍 ${text}`);
  memory[userID].push(`❄️ ${reply}`);

  if (memory[userID].length > 30) {
    memory[userID].splice(0, 2);
  }

  saveMemory();
}

module.exports = {
  config: {
    name: "sae",
    version: "2.0",
    author: "Shade",
    role: 0,
    category: "ai",
    shortDescription: "Sae Itoshi IA froide + respect créateur"
  },

  onStart: async function ({ message, event, args, api }) {
    const userID = event.senderID;
    const userName =
      (await api.getUserInfo(userID))[userID]?.name || "inconnu";

    const text = args.join(" ");
    if (!text) {
      return message.reply(frame(font("… parle.")));
    }

    if (!memory[userID]) memory[userID] = [];

    const prompt = buildPrompt(
      userID,
      userName,
      text,
      memory[userID]
    );

    const reply = await callAI(prompt);

    updateMemory(userID, text, reply);

    let finalText = reply;

    // 👑 respect spécial pour toi
    if (userID === CREATOR_UID) {
      finalText = "… " + reply;
    }

    return message.reply(frame(font(finalText)));
  },

  onChat: async function ({ event, message, api }) {
    if (!event.body) return;
    if (!event.body.toLowerCase().startsWith("sae ")) return;

    const text = event.body.slice(4).trim();
    if (!text) return;

    const userID = event.senderID;
    const userName =
      (await api.getUserInfo(userID))[userID]?.name || "inconnu";

    if (!memory[userID]) memory[userID] = [];

    const prompt = buildPrompt(
      userID,
      userName,
      text,
      memory[userID]
    );

    const reply = await callAI(prompt);

    updateMemory(userID, text, reply);

    let finalText = reply;

    if (userID === CREATOR_UID) {
      finalText = "… " + reply;
    }

    return message.reply(frame(font(finalText)));
  }
};
