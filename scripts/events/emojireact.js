module.exports = {
  config: {
    name: "emojireact",
    version: "1.5",
    author: "Shade × ChatGPT",
    category: "events"
  },

  onStart: async function ({ api, event }) {
    // Sécurité : on ignore si pas de texte ou si c'est le bot qui parle
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
  }
};
