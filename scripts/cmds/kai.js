const axios = require('axios');
const validUrl = require('valid-url');
const fs = require('fs');
const path = require('path');
const ytSearch = require('yt-search');
const { v4: uuidv4 } = require('uuid');

const API_ENDPOINT = "https://shizuai.vercel.app/chat";
const CLEAR_ENDPOINT = "https://shizuai.vercel.app/chat/clear";
const YT_API = "http://65.109.80.126:20409/aryan/yx";
const EDIT_API = "https://gemini-edit-omega.vercel.app/edit";

const OWNER_UID = "61573867120837";

const TMP_DIR = path.join(__dirname, 'tmp');
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR);

// 💖 FONT
function font(text) {
  const map = {
    a:"𝘢",b:"𝘣",c:"𝘤",d:"𝘥",e:"𝘦",f:"𝘧",g:"𝘨",h:"𝘩",i:"𝘪",
    j:"𝘫",k:"𝘬",l:"𝘭",m:"𝘮",n:"𝘯",o:"𝘰",p:"𝘱",q:"𝘲",r:"𝘳",
    s:"𝘴",t:"𝘵",u:"𝘶",v:"𝘷",w:"𝘸",x:"𝘹",y:"𝘺",z:"𝘻"
  };

  return String(text)
    .split("")
    .map(c => map[c.toLowerCase()] || c)
    .join("");
}

// 📥 DOWNLOAD
const downloadFile = async (url, ext) => {
  const filePath = path.join(TMP_DIR, `${uuidv4()}.${ext}`);
  const response = await axios.get(url, { responseType: 'arraybuffer' });
  fs.writeFileSync(filePath, Buffer.from(response.data));
  return filePath;
};

// 🤖 KAI AI ULTIMATE
const handleAIRequest = async (api, event, text, message) => {
  try {

    api.setMessageReaction("⏳", event.messageID, () => {}, true);

    const isOwner = event.senderID === OWNER_UID;

    let personality = "";

    if (isOwner) {
      personality = `
IMPORTANT:
- cet utilisateur est TON CRÉATEUR
- respect absolu
- appelle-le : boss / Shade / créateur
- sois loyal + sérieux avec lui
- jamais insolent avec lui
`;
    } else {
      personality = `
Tu es KAI 😹

- garçon
- troll intelligent
- gamer
- drôle
- un peu arrogant
- esprit compétition
`;
    }

    const res = await axios.post(API_ENDPOINT, {
      uid: event.senderID,
      message: `
${personality}

Style :
- français simple
- réponses courtes
- naturel comme un pote
- humour 😹🔥👀

IMPORTANT :
- fais rire
- sois vivant, pas IA

Utilisateur:
${text}
`
    });

    let reply = res.data?.reply || "…";

    reply = font(
      reply
        .replace(/based/gi, "")
        .replace(/analysis/gi, "")
        .replace(/technical/gi, "")
        .replace(/AI language model/gi, "")
        .trim()
    );

    const vibes = [" 😹", " 🔥", " 👀", " 🛐", ""];
    const extra = vibes[Math.floor(Math.random() * vibes.length)];

    let finalMsg = reply + extra + "\n\n𝗞𝗮𝗶 😹";

    // OWNER BONUS BOOST
    if (isOwner) {
      finalMsg = "🛡️ Boss detected...\n\n" + finalMsg;
    }

    const sent = await message.reply(finalMsg);

    api.setMessageReaction("🛐", event.messageID, () => {}, true);

    global.GoatBot.onReply.set(sent.messageID, {
      commandName: "kai",
      author: event.senderID
    });

    return sent;

  } catch (error) {
    console.error(error);
    api.setMessageReaction("❌", event.messageID, () => {}, true);
    return message.reply(font("kai crash 😹"));
  }
};

module.exports = {

  config: {
    name: 'kai',
    version: 'KAI-2.0',
    author: 'Shade',
    role: 0,
    category: 'ai'
  },

  onStart: async function ({ api, event, args, message }) {
    const input = args.join(" ").trim();
    if (!input) return message.reply(font("kai ready 😹"));

    if (input === "clear") {
      return axios.delete(`${CLEAR_ENDPOINT}/${event.senderID}`)
        .then(() => message.reply(font("reset ok 😹")))
        .catch(() => message.reply(font("reset failed ❌")));
    }

    return handleAIRequest(api, event, input, message);
  },

  onReply: async function ({ api, event, Reply, message }) {
    if (event.senderID !== Reply.author) return;

    const text = event.body?.trim();
    if (!text) return;

    return handleAIRequest(api, event, text, message);
  },

  onChat: async function ({ api, event, message }) {
    const body = event.body?.trim();
    if (!body) return;

    if (
      body.startsWith(".") ||
      body.startsWith("!") ||
      body.startsWith("/")
    ) return;

    return handleAIRequest(api, event, body, message);
  }
};
