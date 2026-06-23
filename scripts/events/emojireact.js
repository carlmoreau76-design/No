module.exports = {
  config: {
    name: "emojireact",
    version: "2.0",
    author: "Shade × Gemini",
    category: "events"
  },

  // 📥 Requis par GoatBot pour valider le chargement du script
  onStart: async function ({ api, event }) {
    console.log("[EMOJI-REACT] Le système de réaction aux émojis est actif.");
  },

  // 💬 Écoute les messages du chat en temps réel sans préfixe
  onChat: async function ({ api, event }) {
    if (!event.body || event.senderID === api.getCurrentUserID()) return;

    const messageText = event.body.trim();

    // 1. Émoji regard 👀
    if (messageText.includes("👀")) {
      return api.sendMessage(
        "T'as assez guetté là, tu ne trouves pas ? 👀❌",
        event.threadID,
        event.messageID
      );
    }

    // 2. Émojis de rire 😂 ou 😹
    if (messageText.includes("😂") || messageText.includes("😹")) {
      return api.sendMessage(
        "Ferme un peu ta bouche, tes dents sont toutes jaunes ! 🛐",
        event.threadID,
        event.messageID
      );
    }

    // 3. Émoji prière/respect 🛐
    if (messageText.includes("🛐")) {
      return api.sendMessage(
        "Arrête de vénérer les gens comme ça, lève-toi de là ! 😭👋",
        event.threadID,
        event.messageID
      );
    }

    // 4. Émoji bisou/amour 😘 ou 🥰
    if (messageText.includes("😘") || messageText.includes("🥰")) {
      return api.sendMessage(
        "Calme tes hormones, on se connaît à peine... 😳 Brothé chill !",
        event.threadID,
        event.messageID
      );
    }

    // 5. Émoji réflexion/doute 🤔
    if (messageText.includes("🤔")) {
      return api.sendMessage(
        "Ça réfléchit mais y'a rien dans le cerveau, laisse tomber ! 🧠💨",
        event.threadID,
        event.messageID
      );
    }

    // 6. Émoji menteur/nez long 🤥
    if (messageText.includes("🤥")) {
      return api.sendMessage(
        "Ton nez va traverser l'écran tellement tu mens, arrête ça ! 🤥✂️",
        event.threadID,
        event.messageID
      );
    }

    // 7. Émoji clown 🤡
    if (messageText.includes("🤡")) {
      return api.sendMessage(
        "Le cirque est fermé mais le clown est resté ici apparemment... 🎪🤷‍♂️",
        event.threadID,
        event.messageID
      );
    }

    // 8. Émoji hautain/lunettes 😎
    if (messageText.includes("😎")) {
      return api.sendMessage(
        "Enlève tes lunettes, on sait tous que tu as peur en vrai. 🕶️😂",
        event.threadID,
        event.messageID
      );
    }

    // 9. Émoji fantôme ou peur 👻 / 😱
    if (messageText.includes("👻") || messageText.includes("😱")) {
      return api.sendMessage(
        "Gros poltron ! Un rien te fait sursauter, ressaisis-toi ! 🫵💀",
        event.threadID,
        event.messageID
      );
    }

    // 10. Émoji argent / riche 🤑 / 💰 [NOUVEAU]
    if (messageText.includes("🤑") || messageText.includes("💰")) {
      return api.sendMessage(
        "Ça parle d'argent alors que le compte est à découvert... 💳📉",
        event.threadID,
        event.messageID
      );
    }

    // 11. Émoji sommeil / dodo 😴 / 💤 [NOUVEAU]
    if (messageText.includes("😴") || messageText.includes("💤")) {
      return api.sendMessage(
        "Éteins ton téléphone et va dormir au lieu de forcer ici ! 🛏️🛌",
        event.threadID,
        event.messageID
      );
    }

    // 12. Émoji diable 😈 / 👿 [NOUVEAU]
    if (messageText.includes("😈") || messageText.includes("👿")) {
      return api.sendMessage(
        "Calme tes plans machiavéliques, tu ne fais peur à personne ici ! 🕊️🛡️",
        event.threadID,
        event.messageID
      );
    }

    // 13. Émoji coeur brisé 💔 [NOUVEAU]
    if (messageText.includes("💔")) {
      return api.sendMessage(
        "Encore un chagrin d'amour... Viens, on va te trouver quelqu'un de mieux ! 🥺🩹",
        event.threadID,
        event.messageID
      );
    }

    // 14. Émoji muscles / force 💪 [NOUVEAU]
    if (messageText.includes("💪")) {
      return api.sendMessage(
        "Ça montre ses muscles mais ça ne peut pas soulever une bouteille d'eau ! 🍼😂",
        event.threadID,
        event.messageID
      );
    }

    // 15. Émoji feu / chaud 🔥 [NOUVEAU]
    if (messageText.includes("🔥")) {
      return api.sendMessage(
        "Appelez les pompiers, l'ambiance devient trop chaude là ! 🧯💨",
        event.threadID,
        event.messageID
      );
    }
  }
};
