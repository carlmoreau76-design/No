const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "67",
    version: "1.0.0",
    author: "Shade × Gemini",
    description: "Détecte le nombre 67 et envoie un média aléatoire (GIF+Audio ou Vidéo seule)"
  },

  onChat: async function ({ api, event }) {
    const { threadID, messageID, body } = event;
    if (!body) return;

    // Détection du nombre 67 isolé ou dans une phrase (ex: "tu connais 67 ?")
    const regex67 = /\b67\b/;
    if (!regex67.test(body)) return;

    const gifs = [
      "https://i.imgur.com/lcFfLSX.gif",
      "https://i.imgur.com/4wDHfJq.gif",
      "https://i.imgur.com/jSDs0ak.gif"
    ];
    const videoUrl = "https://files.catbox.moe/cu3atc.mp4";
    const audioUrl = "https://files.catbox.moe/9ebkev.mp3";

    const cacheDir = path.join(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

    // Tirage au sort : 0 = Mode GIF + Audio, 1 = Mode Vidéo seule
    const choice = Math.floor(Math.random() * 2);
    const pathsToUnlink = [];

    try {
      const attachments = [];

      if (choice === 0) {
        // --- MODE GIF + AUDIO ---
        const randomGif = gifs[Math.floor(Math.random() * gifs.length)];
        const gifPath = path.join(cacheDir, `67_${Date.now()}.gif`);
        const audioPath = path.join(cacheDir, `67_${Date.now()}.mp3`);

        // Téléchargement du GIF choisi
        const resGif = await axios({ method: "GET", url: randomGif, responseType: "stream" });
        const gifWriter = fs.createWriteStream(gifPath);
        resGif.data.pipe(gifWriter);
        await new Promise((res, rej) => { gifWriter.on("finish", res); gifWriter.on("error", rej); });
        attachments.push(fs.createReadStream(gifPath));
        pathsToUnlink.push(gifPath);

        // Téléchargement de l'audio
        const resAudio = await axios({ method: "GET", url: audioUrl, responseType: "stream" });
        const audioWriter = fs.createWriteStream(audioPath);
        resAudio.data.pipe(audioWriter);
        await new Promise((res, rej) => { audioWriter.on("finish", res); audioWriter.on("error", rej); });
        attachments.push(fs.createReadStream(audioPath));
        pathsToUnlink.push(audioPath);

      } else {
        // --- MODE VIDÉO SEULE ---
        const videoPath = path.join(cacheDir, `67_${Date.now()}.mp4`);

        const resVideo = await axios({ method: "GET", url: videoUrl, responseType: "stream" });
        const videoWriter = fs.createWriteStream(videoPath);
        resVideo.data.pipe(videoWriter);
        await new Promise((res, rej) => { videoWriter.on("finish", res); videoWriter.on("error", rej); });
        attachments.push(fs.createReadStream(videoPath));
        pathsToUnlink.push(videoPath);
      }

      // Envoi du message avec les pièces jointes correspondantes
      return api.sendMessage(
        { attachment: attachments },
        threadID,
        () => {
          // Nettoyage des fichiers temporaires après envoi
          for (const filePath of pathsToUnlink) {
            try { fs.unlinkSync(filePath); } catch (e) {}
          }
        },
        messageID
      );

    } catch (error) {
      console.error("Erreur lors de l'exécution de l'event 67:", error);
      // Nettoyage en cas d'échec du téléchargement
      for (const filePath of pathsToUnlink) {
        try { fs.unlinkSync(filePath); } catch (e) {}
      }
    }
  }
};
