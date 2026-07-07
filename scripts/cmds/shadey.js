/**
 * @author Shade × Gemini
 * @title Playlist Permanente Shadey
 * @name shadey
 * @class shadey
 * @version 3.6
 * @role 0
 * @category media
 * @description Playlist Shadey sauvegardée localement (Restriction Admin pour Add/Remove).
 * @usage shadey list | play [N°] | add Nom | lien | remove
 */

const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const OWNER_UID = "61573867120837"; // 🔒 UID Autorisé pour ADD et REMOVE
const filePath = path.join(__dirname, "cache", "shadey_playlist.json");

// Chansons par défaut initiales si le fichier n'existe pas
const defaultPlaylist = [
  { name: "💔 Couronne de cendres", url: "https://files.catbox.moe/jnk2j5.mp3" },
  { name: "🤝 De rivaux à frères", url: "https://files.catbox.moe/ol6y26.mp3" },
  { name: "💎 Sans diamant, sans chance", url: "https://files.catbox.moe/jvkuwa.mp3" }
];

// Fonctions utilitaires pour lire et écrire de manière synchrone/sécurisée
function getPlaylist() {
  try {
    if (!fs.existsSync(filePath)) {
      fs.ensureDirSync(path.dirname(filePath));
      fs.writeJsonSync(filePath, defaultPlaylist, { spaces: 2 });
      return defaultPlaylist;
    }
    return fs.readJsonSync(filePath);
  } catch (error) {
    console.error("Erreur de lecture du fichier playlist :", error);
    return defaultPlaylist;
  }
}

function savePlaylist(playlist) {
  try {
    fs.ensureDirSync(path.dirname(filePath));
    fs.writeJsonSync(filePath, playlist, { spaces: 2 });
    return true;
  } catch (error) {
    console.error("Erreur d'écriture du fichier playlist :", error);
    return false;
  }
}

function frame(msg) {
  return `╭━━━(｡•̀ᴗ-)✧━━━╮\n🎧 𝗦𝗛𝗔𝗗𝗘𝗬 𝗣𝗟𝗔𝗬𝗟𝗜𝗦𝗧 🎧\n╰━━━━━━━━━━━━━━╯\n${msg}\n╰━━━(✧˙꒳˙✧)━━━╯`;
}

module.exports = {
  config: {
    name: "shadey",
    version: "3.6",
    author: "Shade × Gemini",
    role: 0,
    category: "media",
    shortDescription: "Playlist sauvegardée localement (Restriction Admin pour Add/Remove)",
    guide: {
      fr: "{p}{n} list : Afficher la playlist\n{p}{n} play [Numéro] : Écouter un son\n❌ Admin Seul : add / remove"
    }
  },

  onStart: async function ({ message, event, args }) {
    const { senderID } = event;
    const playlist = getPlaylist();
    const action = args[0]?.toLowerCase();

    // ==========================================
    // ➕ ACTION : ADD (Ajouter une chanson)
    // ==========================================
    if (action === "add") {
      if (senderID !== OWNER_UID) {
        return message.reply(frame("🛑 Accès refusé...\nSeul l'owner de la playlist peut ajouter des musiques ! 💔"));
      }
      const content = args.slice(1).join(" ");
      if (!content.includes("|")) {
        return message.reply(frame("❌ Format incorrect.\nUtilise : `shadey add Nom | lien_mp3`"));
      }
      const [namePart, urlPart] = content.split("|");
      const songName = namePart?.trim();
      const songUrl = urlPart?.trim();

      if (!songName || !songUrl) {
        return message.reply(frame("❌ Le nom ou le lien ne peut pas être vide."));
      }

      playlist.push({ name: songName, url: songUrl });
      savePlaylist(playlist);
      return message.reply(frame(`✅ **Chanson ajoutée !**\n🎵 ${songName}\n📌 Position : #${playlist.length}`));
    }

    // ==========================================
    // 🎶 ACTION : PLAY (Écouter via numéro)
    // ==========================================
    if (action === "play") {
      const index = parseInt(args[1]);
      if (isNaN(index) || index < 1 || index > playlist.length) {
        return message.reply(frame(`❌ Numéro invalide. Choisissez un nombre entre 1 et ${playlist.length}.`));
      }
      const song = playlist[index - 1];
      try {
        const stream = await global.utils.getStreamFromURL(song.url);
        return message.reply({
          body: frame(`🎶 Lecture en cours : **${song.name}**`),
          attachment: stream
        });
      } catch (err) {
        return message.reply(frame(`❌ Impossible de charger l'audio de la chanson :\n${song.name}`));
      }
    }

    // ==========================================
    // 🗑️ ACTION : REMOVE (Supprimer via menu interactif)
    // ==========================================
    if (action === "remove" || action === "delete") {
      if (senderID !== OWNER_UID) {
        return message.reply(frame("🛑 Accès refusé...\nSeul l'owner de la playlist peut supprimer des musiques ! 💔"));
      }
      if (playlist.length === 0) {
        return message.reply(frame("📦 La playlist est actuellement vide."));
      }
      let menuRemove = "Réponds à ce message avec le **numéro** de la chanson à supprimer 🗑️ :\n\n";
      playlist.forEach((song, i) => {
        menuRemove += `${i + 1}. ${song.name}\n`;
      });

      return message.reply(frame(menuRemove), (err, info) => {
        global.GoatBot.onReply.set(info.messageID, {
          commandName: this.config.name,
          author: senderID,
          action: "remove"
        });
      });
    }

    // ==========================================
    // 📋 ACTION PAR DÉFAUT : LIST (Afficher)
    // ==========================================
    if (playlist.length === 0) {
      return message.reply(frame("📦 La playlist est vide."));
    }
    let menuList = "Voici votre Playlist actuelle 🎧\n\n";
    playlist.forEach((song, i) => {
      menuList += `${i + 1}. ${song.name}\n`;
    });
    menuList += `\n💡 Pour écouter, tape :\n\`shadey play [numéro]\``;
    return message.reply(frame(menuList));
  },

  // ==========================================  
  // 🔄 SYSTÈME DE RÉPONSE POUR LE REMOVE        
  // ==========================================  
  onReply: async function ({ message, event, Reply }) {
    const { senderID, body } = event;

    if (senderID !== Reply.author || senderID !== OWNER_UID) return;
    const playlist = getPlaylist();

    if (Reply.action === "remove") {
      const choice = parseInt(body.trim());
      if (isNaN(choice) || choice < 1 || choice > playlist.length) {
        return message.reply(frame("❌ Numéro invalide. Suppression annulée."));
      }
      const deletedSong = playlist.splice(choice - 1, 1)[0];

      savePlaylist(playlist);
      return message.reply(frame(`🗑️ **Chanson supprimée !**\nLe morceau **${deletedSong.name}** a été retiré.`));
    }
  }
};
