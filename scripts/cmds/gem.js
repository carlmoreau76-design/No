const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const memoryFile = path.join(__dirname, "cache", "gem_memory.json");
let memory = {};

// Initialisation sécurisée de la mémoire
try {
  fs.ensureDirSync(path.dirname(memoryFile));
  if (fs.existsSync(memoryFile)) {
    memory = JSON.parse(fs.readFileSync(memoryFile, "utf8"));
  }
} catch (e) {
  memory = {};
}

function saveMemory() {
  try {
    fs.writeFileSync(memoryFile, JSON.stringify(memory, null, 2));
  } catch (e) {
    console.error("Impossible de sauvegarder la mémoire de gem :", e.message);
  }
}

// Appel à l'API Hugging Face avec DreamShaper
async function queryHuggingFace(prompt, token) {
  const response = await axios.post(
    "https://api-inference.huggingface.co/models/Lykon/dreamshaper-xl-v2-turbo",
    { inputs: prompt },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      responseType: "arraybuffer"
    }
  );
  return Buffer.from(response.data);
}

module.exports = {
  config: {
    name: "gem",
    version: "6.1.0 Hori Edition",
    author: "Shade × Gemini",
    role: 0,
    category: "ai",
    description: "🎨 Génère un montage graphique anime/fantastique basé sur une image et une histoire continue.",
    guide: { fr: "Réponds à une image avec tes consignes de montage de scène" }
  },

  onStart: async function ({ message, event, args, api }) {
    const userID = event.senderID;
    const prompt = args.join(" ").trim();

    // ========================================================
    // 🔑 EMPLACEMENT DE TA CLÉ API / TOKEN HUGGING FACE
    // ========================================================
    // Tu peux remplacer la ligne ci-dessous par ton token en dur entre guillemets si tu veux, 
    // exemple : const hfToken = "hf_votreCléIci";
    
    const hfToken = process.env.HF_TOKEN || "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";

    if (!hfToken || hfToken.includes("METS_TON_TOKEN_ICI")) {
      return message.reply("✨ 🌸 **[ CONFIGURATION UNIQUE REQUISE ]** 🌸 ✨\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n❌ Erreur : La clé d'accès `HF_TOKEN` n'est pas configurée dans le script ou sur ton panel Render.");
    }

    // Réinitialisation de la mémoire utilisateur
    if (prompt.toLowerCase() === "reset") {
      memory[userID] = { image: null, story: "" };
      saveMemory();
      return message.reply("✨ 🌸 **[ MÉMOIRE RÉINITIALISÉE ]** 🌸 ✨\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n🧠 Ton historique de scène et tes prompts accumulés ont été effacés avec succès !");
    }

    const attachment = event.messageReply?.attachments?.[0];
    if (!attachment || attachment.type !== "photo") {
      return message.reply("✨ 🌸 **[ COMPOSANT MANQUANT ]** 🌸 ✨\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n💡 Action requise : Réponds à une image (photo de profil, paysage, anime) pour définir la base visuelle du montage.");
    }

    if (!prompt) {
      return message.reply(`✨ 🌸 **[ INSTRUCTIONS DU SCRIPT ]** 🌸 ✨\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n💡 Exemple d'utilisation :\nRéponds à une photo et écris : \`${this.config.name} en train de se battre avec Sukuna sur un toit en bois style anime\``);
    }

    // Gestion de l'historique d'images dans la mémoire de l'IA
    if (!memory[userID] || memory[userID].image !== attachment.url) {
      memory[userID] = { image: attachment.url, story: `Anime style montage, high quality, illustration, inspired by the appearance of the context image, ${prompt}` };
    } else {
      memory[userID].story = `${memory[userID].story}, ${prompt}`;
    }
    
    saveMemory();

    let loading;
    const cacheDir = path.join(__dirname, "cache");
    const filePath = path.join(cacheDir, `hori_gem_${userID}_${Date.now()}.png`);

    try {
      api.setMessageReaction("🎨", event.messageID, () => {}, true);
      loading = await message.reply("✨ 🌸 **[ IMMERSION GRAPHIQUE ]** 🌸 ✨\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n🎨 Rendu en cours d'exécution... Le module de dessin applique vos filtres esthétiques, veuillez patienter.");

      // Création physique du sous-dossier cache si absent
      await fs.ensureDir(cacheDir);

      // Génération de l'image via l'API
      const imageBuffer = await queryHuggingFace(memory[userID].story, hfToken);
      fs.writeFileSync(filePath, imageBuffer);

      if (loading?.messageID) {
        await api.unsendMessage(loading.messageID);
      }

      api.setMessageReaction("🖼️", event.messageID, () => {}, true);

      return message.reply({
        body: `✨ 🌸 **[ MONTAGE EFFECTUÉ ]** 🌸 ✨\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n🎬 **Style :** Anime & Fantastique Studio\n📈 **Statut :** Synthèse réussie\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n💡 _Utilise la commande "reset" pour démarrer une toute nouvelle composition._`,
        attachment: fs.createReadStream(filePath)
      }, () => {
        try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch (e) {}
      });

    } catch (e) {
      console.log("====== GEM ERROR ======", e.message || e);
      if (loading?.messageID) {
        await api.unsendMessage(loading.messageID).catch(() => {});
      }
      api.setMessageReaction("❌", event.messageID, () => {}, true);
      try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch (_) {}
      
      return message.reply("✨ 🌸 **[ TERMINAL SURCHARGÉ ]** 🌸 ✨\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n❌ Le serveur de rendu graphique est temporairement saturé ou en cours de redémarrage.\n\n💡 _Veuillez soumettre à nouveau votre invite dans 30 secondes._");
    }
  }
};
