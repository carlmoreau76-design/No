const axios = require("axios");
const cheerio = require("cheerio");
const Canvas = require("canvas");
const fs = require("fs-extra");
const path = require("path");

const langsSupported = [
  'sq','ar','az','bn','bs','bg','my','zh-hans','zh-hant','hr','cs','da','nl','en',
  'et','fil','fi','fr','ka','de','el','he','hi','hu','id','it','ja','kk','ko','lv',
  'lt','ms','nb','fa','pl','pt','ro','ru','sr','sk','sl','es','sv','th','tr','uk','vi'
];

// Fonction utilitaire pour dessiner des rectangles à bords arrondis
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// Fonction pour couper intelligemment les longs textes sur le Canvas
function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';
  let currentY = y;

  for (let n = 0; n < words.length; n++) {
    let testLine = line + words[n] + ' ';
    let metrics = ctx.measureText(testLine);
    let testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      ctx.fillText(line, x, currentY);
      line = words[n] + ' ';
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, currentY);
  return currentY;
}

module.exports = {
  config: {
    name: "emojimean",
    aliases: ["em", "emojimeaning", "emoji"],
    version: "2.0.0",
    author: "NTKhang × Shade × Gemini",
    countDown: 5,
    role: 0,
    description: "Recherche la signification complète et les détails d'un emoji",
    category: "utility",
    guide: {
      fr: "{p}{n} <emoji>"
    }
  },

  langs: {
    fr: {
      missingEmoji: "🌸💔 S'il vous plaît, fournissez un emoji valide à analyser.",
      manyRequest: "💫 Trop de requêtes en cours. Veuillez réessayer dans quelques instants.",
      notHave: "Non disponible"
    }
  },

  onStart: async function ({ args, message, event, threadsData, getLang }) {
    const emoji = args[0];
    if (!emoji) return message.reply(getLang("missingEmoji"));

    let lang = await threadsData.get(event.threadID, "data.lang") || "fr";
    lang = langsSupported.includes(lang) ? lang : "fr";

    let data;
    try {
      data = await getEmojiMeaning(emoji, lang);
    } catch (e) {
      return message.reply(getLang("manyRequest"));
    }

    const { meaning, moreMeaning, shortcode } = data;

    // 🪐 CONCEPTION DU CANVAS PREMIUM
    const W = 1000, H = 550;
    const canvas = Canvas.createCanvas(W, H);
    const ctx = canvas.getContext("2d");

    // Fond sombre Premium
    ctx.fillStyle = "#0d0e15";
    ctx.fillRect(0, 0, W, H);

    // Effet Glow Rose/Violet en arrière-plan
    const glowGrad = ctx.createRadialGradient(W / 2, H / 2, 50, W / 2, H / 2, 500);
    glowGrad.addColorStop(0, "rgba(255, 182, 236, 0.12)");
    glowGrad.addColorStop(1, "rgba(13, 14, 21, 0)");
    ctx.fillStyle = glowGrad;
    ctx.fillRect(0, 0, W, H);

    // Conteneur Principal Transparent
    ctx.fillStyle = "rgba(255, 255, 255, 0.03)";
    roundRect(ctx, 35, 35, W - 70, H - 70, 25);
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // En-tête / Titre de la carte
    ctx.textAlign = "left";
    ctx.font = "bold 38px Arial";
    ctx.fillStyle = "#ffb6ec";
    ctx.fillText("🪐 𝗔𝗡𝗚𝗘𝗟 𝗘𝗠𝗢𝗝𝗜 𝗠𝗘𝗔𝗡𝗜𝗡𝗚𝗦", 75, 95);

    // Séparateur fin
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(75, 125);
    ctx.lineTo(W - 75, 125);
    ctx.stroke();

    // Affichage géant de l'Emoji ciblé à gauche
    ctx.font = "110px Arial";
    ctx.textAlign = "center";
    ctx.fillText(emoji, 170, 290);

    // Boîte d'information : Shortcode / Identifiant
    ctx.textAlign = "left";
    const boxX = 300, boxY = 160, boxW = W - 375;
    
    ctx.fillStyle = "rgba(255, 255, 255, 0.02)";
    roundRect(ctx, boxX, boxY, boxW, 75, 15);
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
    ctx.stroke();

    ctx.font = "14px Arial";
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.fillText("SHORTCODE / RACCOURCI", boxX + 20, boxY + 30);
    ctx.font = "bold 22px Arial";
    ctx.fillStyle = "#ffeaa7";
    ctx.fillText(shortcode || "—", boxX + 20, boxY + 60);

    // Contenu principal : Définitions
    ctx.font = "bold 16px Arial";
    ctx.fillStyle = "#ffb6ec";
    ctx.fillText("SIGNIFICATION PRINCIPALE", boxX, 280);

    ctx.font = "20px Arial";
    ctx.fillStyle = "#ffffff";
    const nextY = wrapText(ctx, meaning || "Aucune description directe disponible.", boxX, 315, boxW, 28);

    if (moreMeaning) {
      ctx.font = "bold 16px Arial";
      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      ctx.fillText("INFORMATIONS COMPLÉMENTAIRES", boxX, nextY + 35);

      ctx.font = "18px Arial";
      ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
      wrapText(ctx, moreMeaning, boxX, nextY + 70, boxW, 26);
    }

    // Sauvegarde temporaire et envoi du rendu
    const tmpDir = path.join(__dirname, "tmp");
    await fs.ensureDir(tmpDir);
    const file = path.join(tmpDir, `emoji_${Date.now()}.png`);
    
    await fs.writeFile(file, canvas.toBuffer());

    let responseMsg = `╭─ 🪐 𝗔𝗡𝗚𝗘𝗟 𝗘𝗠𝗢𝗝𝗜 ────────╮\n`;
    responseMsg += `│ 📌 Emoji : ${emoji}\n`;
    responseMsg += `│ 💎 Code : ${shortcode || "—"}\n`;
    responseMsg += `├──────────────────────────┤\n`;
    responseMsg += `│ 📖 Analyse graphique générée\n`;
    responseMsg += `│    avec succès ci-dessous.\n`;
    responseMsg += `╰──────────────────────────╯`;

    return message.reply({
      body: responseMsg,
      attachment: fs.createReadStream(file)
    }, () => {
      if (fs.existsSync(file)) fs.unlinkSync(file);
    });
  }
};

/* 💫 SCRIPT D'EXTRACTION API ORIGINAL CLEAN */
async function getEmojiMeaning(emoji, lang) {
  const url = `https://www.emojiall.com/${lang}/emoji/${encodeURI(emoji)}`;
  const { data } = await axios.get(url);
  const $ = cheerio.load(data);
  
  const meaning = $(".emoji_card_content").eq(0).text().trim();
  const moreMeaning = $(".emoji_card_content").eq(1).text().trim();
  const shortcode = $("table").text().match(/(:.*:)/)?.[1];
  
  return {
    meaning,
    moreMeaning,
    shortcode
  };
      }
