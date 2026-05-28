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

// 🌸 FRAME
function frame(msg) {
  return `╭━━━〔 SNIMORI 🌸 〕━━━╮

${msg}

╰━━━〔 AI GIRL 💖 〕━━━╯`;
}

// 💖 FONT
function font(text) {
  const map = {
    a:"𝘢", b:"𝘣", c:"𝘤", d:"𝘥", e:"𝘦",
    f:"𝘧", g:"𝘨", h:"𝘩", i:"𝘪", j:"𝘫",
    k:"𝘬", l:"𝘭", m:"𝘮", n:"𝘯", o:"𝘰",
    p:"𝘱", q:"𝘲", r:"𝘳", s:"𝘴", t:"𝘵",
    u:"𝘶", v:"𝘷", w:"𝘸", x:"𝘹", y:"𝘺",
    z:"𝘻"
  };

  return String(text)
    .split("")
    .map(c => map[c.toLowerCase()] || c)
    .join("");
}

// 📥 DOWNLOAD
const downloadFile = async (url, ext) => {
  const filePath = path.join(TMP_DIR, `${uuidv4()}.${ext}`);

  const response = await axios.get(url, {
    responseType: 'arraybuffer'
  });

  fs.writeFileSync(filePath, Buffer.from(response.data));

  return filePath;
};

// ♻️ RESET
const resetConversation = async (api, event, message) => {
  api.setMessageReaction("♻️", event.messageID, () => {}, true);

  try {

    await axios.delete(`${CLEAR_ENDPOINT}/${event.senderID}`);

    return message.reply(
      frame(font("memoire reset 🌸"))
    );

  } catch (error) {

    console.error(error.message);

    return message.reply(
      frame(font("reset failed ❌"))
    );
  }
};

// 🎨 EDIT
const handleEdit = async (api, event, message, args) => {

  const prompt = args.join(" ");

  if (!prompt) {
    return message.reply(
      frame(font("donne un prompt 🌸"))
    );
  }

  api.setMessageReaction("⏳", event.messageID, () => {}, true);

  try {

    const params = { prompt };

    if (event.messageReply?.attachments?.[0]?.url) {
      params.imgurl = event.messageReply.attachments[0].url;
    }

    const res = await axios.get(EDIT_API, { params });

    if (!res.data?.images?.[0]) {
      return message.reply(
        frame(font("image failed ❌"))
      );
    }

    const base64Image = res.data.images[0]
      .replace(/^data:image\/\w+;base64,/, "");

    const buffer = Buffer.from(base64Image, "base64");

    const imagePath = path.join(
      TMP_DIR,
      `${Date.now()}.png`
    );

    fs.writeFileSync(imagePath, buffer);

    api.setMessageReaction("✅", event.messageID, () => {}, true);

    return message.reply({
      body: frame(font("image generated ✨")),
      attachment: fs.createReadStream(imagePath)
    });

  } catch (error) {

    console.error(error.message);

    api.setMessageReaction("❌", event.messageID, () => {}, true);

    return message.reply(
      frame(font("edit error 😿"))
    );
  }
};

// 🎬 YOUTUBE
const handleYouTube = async (api, event, message, args) => {

  const option = args[0];

  if (!["-v", "-a"].includes(option)) {
    return message.reply(
      frame(font("youtube -v/-a seulement 🌸"))
    );
  }

  const query = args.slice(1).join(" ");

  if (!query) {
    return message.reply(
      frame(font("donne une recherche 🌸"))
    );
  }

  const sendFile = async (url, type) => {

    try {

      const { data } = await axios.get(
        `${YT_API}?url=${encodeURIComponent(url)}&type=${type}`
      );

      const downloadUrl = data.download_url;

      const filePath = await downloadFile(downloadUrl, type);

      await message.reply({
        attachment: fs.createReadStream(filePath)
      });

      fs.unlinkSync(filePath);

    } catch (error) {

      console.error(error.message);

      message.reply(
        frame(font("download failed ❌"))
      );
    }
  };

  if (query.startsWith("http")) {
    return await sendFile(
      query,
      option === "-v" ? "mp4" : "mp3"
    );
  }

  try {

    const results = (
      await ytSearch(query)
    ).videos.slice(0, 6);

    if (results.length === 0) {
      return message.reply(
        frame(font("aucun resultat 😿"))
      );
    }

    let list = "🎧 choose song 🌸\n\n";

    results.forEach((v, i) => {
      list += `${i + 1}. ${v.title}\n`;
    });

    const sent = await message.reply(
      frame(font(list))
    );

    global.GoatBot.onReply.set(sent.messageID, {
      commandName: "ai",
      author: event.senderID,
      results,
      type: option
    });

  } catch (error) {

    console.error(error.message);

    message.reply(
      frame(font("youtube error ❌"))
    );
  }
};

// 🤖 AI
const handleAIRequest = async (
  api,
  event,
  userInput,
  message
) => {

  const args = userInput.split(" ");
  const first = args[0]?.toLowerCase();

  // 🎨 edit
  if (["edit", "-e"].includes(first)) {
    return await handleEdit(
      api,
      event,
      message,
      args.slice(1)
    );
  }

  // 🎬 youtube
  if (["youtube", "yt", "ytb"].includes(first)) {
    return await handleYouTube(
      api,
      event,
      message,
      args
    );
  }

  const userId = event.senderID;

  let messageContent = userInput;
  let imageUrl = null;

  api.setMessageReaction("⏳", event.messageID, () => {}, true);

  const urlMatch = messageContent.match(
    /(https?:\/\/[^\s]+)/
  )?.[0];

  if (urlMatch && validUrl.isWebUri(urlMatch)) {

    imageUrl = urlMatch;

    messageContent = messageContent
      .replace(urlMatch, '')
      .trim();
  }

  if (!messageContent && !imageUrl) {
    return message.reply(
      frame(font("envoie un message 🌸"))
    );
  }

  try {

    const response = await axios.post(
      API_ENDPOINT,
      {
        uid: userId,

        message: `
Tu es SNIMORI 🌸

Tu es une IA feminine kawaii,
douce,
naturelle,
humaine,
stylée.

Règles :
- français uniquement
- réponses naturelles
- réponses courtes
- pas de langage technique
- pas de blabla IA
- emojis autorisés 🌸💖✨

Utilisateur:
${messageContent}
        `,

        image_url: imageUrl
      }
    );

    let finalReply =
      response.data?.reply ||
      "😿 snimori bug...";

    // 🧼 nettoyage
    finalReply = finalReply
      .replace(/shadow/gi, "snimori")
      .replace(/technical/gi, "")
      .replace(/analysis/gi, "")
      .replace(/based on/gi, "")
      .replace(/AI language model/gi, "")
      .trim();

    finalReply = font(finalReply);

    const attachments = [];

    if (response.data?.image_url) {

      const imgPath = await downloadFile(
        response.data.image_url,
        "jpg"
      );

      attachments.push(
        fs.createReadStream(imgPath)
      );
    }

    const sentMessage = await message.reply({
      body: frame(finalReply),
      attachment: attachments.length
        ? attachments
        : undefined
    });

    global.GoatBot.onReply.set(
      sentMessage.messageID,
      {
        commandName: "ai",
        author: userId
      }
    );

    api.setMessageReaction("✅", event.messageID, () => {}, true);

  } catch (error) {

    console.error(error.message);

    api.setMessageReaction("❌", event.messageID, () => {}, true);

    return message.reply(
      frame(font("snimori ne peut pas répondre 😿"))
    );
  }
};

// ───── MODULE ─────
module.exports = {

  config: {
    name: 'ai',
    aliases: ['snimori'],
    version: '4.0',
    author: 'Shade',
    role: 0,
    category: 'ai',

    shortDescription: {
      en: 'Snimori AI 🌸'
    },

    guide: {
      en:
`.ai hello
.ai edit cat girl
.ai youtube -v naruto
.ai clear`
    }
  },

  // 🌸 START
  onStart: async function ({
    api,
    event,
    args,
    message
  }) {

    const userInput = args.join(' ').trim();

    if (!userInput) {
      return message.reply(
        frame(font("snimori active 🌸"))
      );
    }

    if (
      ['clear', 'reset']
      .includes(userInput.toLowerCase())
    ) {
      return await resetConversation(
        api,
        event,
        message
      );
    }

    return await handleAIRequest(
      api,
      event,
      userInput,
      message
    );
  },

  // 💬 REPLY
  onReply: async function ({
    api,
    event,
    Reply,
    message
  }) {

    if (event.senderID !== Reply.author) return;

    const userInput = event.body?.trim();

    if (!userInput) return;

    // 🎬 youtube choix
    if (Reply.results && Reply.type) {

      const idx = parseInt(userInput);

      const list = Reply.results;

      if (
        isNaN(idx) ||
        idx < 1 ||
        idx > list.length
      ) {
        return message.reply(
          frame(font("choix invalide ❌"))
        );
      }

      const selected = list[idx - 1];

      const type =
        Reply.type === "-v"
          ? "mp4"
          : "mp3";

      try {

        const { data } = await axios.get(
          `${YT_API}?url=${encodeURIComponent(selected.url)}&type=${type}`
        );

        const filePath = await downloadFile(
          data.download_url,
          type
        );

        await message.reply({
          attachment: fs.createReadStream(filePath)
        });

        fs.unlinkSync(filePath);

      } catch {

        return message.reply(
          frame(font("download failed ❌"))
        );
      }

      return;
    }

    return await handleAIRequest(
      api,
      event,
      userInput,
      message
    );
  },

  // 🌸 CHAT
  onChat: async function ({
    api,
    event,
    message
  }) {

    const body = event.body?.trim();

    if (
      !body?.toLowerCase()
      .startsWith('ai ')
    ) return;

    const userInput = body.slice(3).trim();

    if (!userInput) return;

    return await handleAIRequest(
      api,
      event,
      userInput,
      message
    );
  }
};
