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
    return message.reply(`🌸✨ Conversation reset for you 💖`);
  } catch {
    return message.reply("💔 Reset failed 🌸");
  }
};

// 🎨 edit
const handleEdit = async (api, event, message, args) => {
  const prompt = args.join(" ");
  if (!prompt) return message.reply("🌸 Give prompt 💖");

  api.setMessageReaction("⏳", event.messageID, () => {}, true);

  try {
    const params = { prompt };
    if (event.messageReply?.attachments?.[0]?.url) {
      params.imgurl = event.messageReply.attachments[0].url;
    }

    const res = await axios.get(EDIT_API, { params });

    if (!res.data?.images?.[0]) {
      api.setMessageReaction("❌", event.messageID, () => {}, true);
      return message.reply("💔 Failed 🌸");
    }

    const base64Image = res.data.images[0].replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Image, "base64");

    const imagePath = path.join(TMP_DIR, `${Date.now()}.png`);
    fs.writeFileSync(imagePath, buffer);

    api.setMessageReaction("💖", event.messageID, () => {}, true);
    await message.reply({
      body: "🌸 Image ready 💖",
      attachment: fs.createReadStream(imagePath)
    });

    fs.unlinkSync(imagePath);
  } catch {
    api.setMessageReaction("❌", event.messageID, () => {}, true);
    message.reply("💔 Error 🌸");
  }
};

// 🎬 YouTube
const handleYouTube = async (api, event, message, args) => {
  const option = args[0];

  if (!["-v", "-a"].includes(option)) {
    return message.reply("🌸 Use: youtube -v / -a ✨");
  }

  const query = args.slice(1).join(" ");
  if (!query) return message.reply("💖 Give song 🌸");

  const sendFile = async (url, type) => {
    try {
      const { data } = await axios.get(`${YT_API}?url=${encodeURIComponent(url)}&type=${type}`);
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
        body: "🌸 Music ready 💖",
        attachment: fs.createReadStream(filePath)
      });

      fs.unlinkSync(filePath);
    } catch {
      message.reply("💔 YouTube error 🌸");
    }
  };

  if (query.startsWith("http")) {
    return await sendFile(query, option === "-v" ? "mp4" : "mp3");
  }

  try {
    const results = (await ytSearch(query)).videos.slice(0, 6);
    if (!results.length) return message.reply("💔 No results 🌸");

    let list = "🌸 Results 💖\n\n";

    results.forEach((v, i) => {
      list += `💖 ${i + 1}. ${v.title} 🌸\n`;
    });

    api.sendMessage(
      { body: list, attachment: [] },
      event.threadID
    );

  } catch {
    message.reply("💔 YouTube error 🌸");
  }
};

// 🤖 AI FIXED CORE
const handleAIRequest = async (api, event, userInput, message) => {

  const args = userInput.split(" ");
  const first = args[0]?.toLowerCase();

  if (["edit", "-e"].includes(first)) {
    return await handleEdit(api, event, message, args.slice(1));
  }

  if (["youtube", "yt", "ytb"].includes(first)) {
    return await handleYouTube(api, event, message, args.slice(1));
  }

  const userId = event.senderID;

  api.setMessageReaction("⏳", event.messageID, () => {}, true);

  try {
    const response = await axios.post(API_ENDPOINT, {
      uid: userId,
      message: userInput
    });

    let reply = response.data?.reply;

    if (!reply) {
      return message.reply("💔 Angel no response 🌸");
    }

    // 🧼 CLEAN TEXT (fix bug say/angel/sae mix)
    reply = reply
      .replace(/Shizu/gi, "Angel 🌸")
      .replace(/Christus/gi, "Sae ❄️")
      .replace(/\bsay\b/gi, "")
      .replace(/say/gi, "");

    await message.reply({
      body: "💖 " + reply + " 🌸"
    });

    api.setMessageReaction("💖", event.messageID, () => {}, true);

  } catch (e) {
    api.setMessageReaction("❌", event.messageID, () => {}, true);
    message.reply("💔 AI error 🌸");
  }
};

module.exports = {
  config: {
    name: 'ai',
    version: '3.2.1',
    author: 'Shade',
    role: 0,
    category: 'ai',
    longDescription: { en: '🌸 Angel AI system FIXED' },
    guide: {
      en: `.ai message 🌸
.ai edit prompt 💖
.ai youtube -v song`
    }
  },

  onStart: async function ({ api, event, args, message }) {
    const userInput = args.join(' ').trim();
    if (!userInput) return message.reply("🌸 Say something 💖");

    if (["clear", "reset"].includes(userInput.toLowerCase())) {
      return await resetConversation(api, event, message);
    }

    return await handleAIRequest(api, event, userInput, message);
  }
};
