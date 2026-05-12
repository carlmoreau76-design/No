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

const TMP_DIR = path.join(__dirname, 'tmp');
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR);

// ───── ITALIC FONT ─────
function font(text) {
  const map = {
    a:"𝘢",b:"𝘣",c:"𝘤",d:"𝘥",e:"𝘦",f:"𝘧",g:"𝘨",h:"𝘩",i:"𝘪",
    j:"𝘫",k:"𝘬",l:"𝘭",m:"𝘮",n:"𝘯",o:"𝘰",p:"𝘱",q:"𝘲",r:"𝘳",
    s:"𝘴",t:"𝘵",u:"𝘶",v:"𝘷",w:"𝘸",x:"𝘹",y:"𝘺",z:"𝘻"
  };
  return text.split("").map(c => map[c.toLowerCase()] || c).join("");
}

// 📥 download
const downloadFile = async (url, ext) => {
  const filePath = path.join(TMP_DIR, `${uuidv4()}.${ext}`);
  const response = await axios.get(url, { responseType: 'arraybuffer' });
  fs.writeFileSync(filePath, Buffer.from(response.data));
  return filePath;
};

// ♻️ reset
const resetConversation = async (api, event, message) => {
  api.setMessageReaction("♻️", event.messageID, () => {}, true);
  try {
    await axios.delete(`${CLEAR_ENDPOINT}/${event.senderID}`);
    return message.reply("KAI: conversation reset.");
  } catch {
    return message.reply("KAI: reset failed.");
  }
};

// 🎨 edit
const handleEdit = async (api, event, message, args) => {
  const prompt = args.join(" ");
  if (!prompt) return message.reply("KAI: give prompt.");

  api.setMessageReaction("⏳", event.messageID, () => {}, true);

  try {
    const params = { prompt };

    if (event.messageReply?.attachments?.[0]?.url) {
      params.imgurl = event.messageReply.attachments[0].url;
    }

    const res = await axios.get(EDIT_API, { params });

    if (!res.data?.images?.[0]) {
      api.setMessageReaction("❌", event.messageID, () => {}, true);
      return message.reply("KAI: edit failed.");
    }

    const base64Image = res.data.images[0].replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Image, "base64");

    const imagePath = path.join(TMP_DIR, `${Date.now()}.png`);
    fs.writeFileSync(imagePath, buffer);

    api.setMessageReaction("✔", event.messageID, () => {}, true);

    await message.reply({
      body: "KAI image generated.",
      attachment: fs.createReadStream(imagePath)
    });

    fs.unlinkSync(imagePath);

  } catch {
    api.setMessageReaction("❌", event.messageID, () => {}, true);
    message.reply("KAI: error edit.");
  }
};

// 🎬 YouTube
const handleYouTube = async (api, event, message, args) => {
  const option = args[0];

  if (!["-v", "-a"].includes(option)) {
    return message.reply("KAI: use -v or -a");
  }

  const query = args.slice(1).join(" ");
  if (!query) return message.reply("KAI: give song.");

  const sendFile = async (url, type) => {
    try {
      const { data } = await axios.get(
        `${YT_API}?url=${encodeURIComponent(url)}&type=${type}`
      );

      const downloadUrl = data.download_url;

      const filePath = path.join(TMP_DIR, `yt_${Date.now()}.${type}`);
      const writer = fs.createWriteStream(filePath);

      const stream = await axios({ url: downloadUrl, responseType: "stream" });
      stream.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on("finish", resolve);
        writer.on("error", reject);
      });

      await message.reply({
        body: "KAI music ready.",
        attachment: fs.createReadStream(filePath)
      });

      fs.unlinkSync(filePath);

    } catch {
      message.reply("KAI: youtube error.");
    }
  };

  if (query.startsWith("http")) {
    return await sendFile(query, option === "-v" ? "mp4" : "mp3");
  }

  try {
    const results = (await ytSearch(query)).videos.slice(0, 5);
    if (!results.length) return message.reply("KAI: no results.");

    let list = "KAI results:\n\n";

    results.forEach((v, i) => {
      list += `${i + 1}. ${v.title}\n`;
    });

    message.reply(list);

  } catch {
    message.reply("KAI: youtube error.");
  }
};

// 🤖 AI CORE CLEAN
const handleAIRequest = async (api, event, userInput, message) => {

  const userId = event.senderID;

  api.setMessageReaction("⏳", event.messageID, () => {}, true);

  try {
    const response = await axios.post(API_ENDPOINT, {
      uid: userId,
      message: userInput
    });

    let reply = response.data?.reply;

    if (!reply) return message.reply("KAI: no response.");

    // 🧼 CLEAN
    reply = reply
      .replace(/Shizu/gi, "KAI")
      .replace(/Angel/gi, "KAI")
      .replace(/Sae/gi, "KAI")
      .replace(/Christus/gi, "KAI")
      .replace(/[💖🌸🎀]/g, "");

    await message.reply({
      body: font("AI KAI") + "\n\n" + reply
    });

    api.setMessageReaction("✔", event.messageID, () => {}, true);

  } catch (e) {
    api.setMessageReaction("❌", event.messageID, () => {}, true);
    message.reply("KAI: error system.");
  }
};

// ───── EXPORT ─────
module.exports = {
  config: {
    name: 'ai',
    version: '4.2',
    author: 'Shade',
    role: 0,
    category: 'ai',
    description: 'KAI AI assistant'
  },

  onChat: async function ({ api, event, message }) {

    const body = event.body?.trim();
    if (!body) return;

    if (!body.toLowerCase().startsWith("ai")) return;

    const input = body.slice(2).trim();

    if (!input) {
      return message.reply("KAI: oui ?");
    }

    return handleAIRequest(api, event, input, message);
  }
};
