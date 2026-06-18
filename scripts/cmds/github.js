const axios = require("axios");

// 🔒 SÉCURITÉ : Récupération du token via les variables d'environnement
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || ""; 
const GITHUB_USERNAME = "carlmoreau76-design";

// Configuration globale des requêtes Axios pour l'API GitHub
const githubAPI = axios.create({
  baseURL: "https://api.github.com",
  headers: {
    "Authorization": `Bearer ${GITHUB_TOKEN}`,
    "Accept": "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28"
  }
});

module.exports = {
  config: {
    name: "github",
    aliases: ["git", "repo"],
    version: "1.2.2",
    role: 2, 
    author: "AI Collaborator",
    description: "Explorateur, éditeur, créateur et suppresseur de fichiers sur dépôts GitHub",
    category: "Développeur",
    guide: {
      fr: "{p}{n} [nom_du_repo]"
    },
    countDown: 2
  },

  // ÉTAPE 1 : Entrée dans le dépôt et affichage de la racine
  onStart: async function ({ api, event, args }) {
    const { threadID, messageID, senderID } = event;
    const repoName = args[0];

    if (!repoName) {
      return api.sendMessage("⚠️ Spécifiez le nom d'un de vos dépôts (ex: !github No)", threadID, messageID);
    }

    if (!GITHUB_TOKEN) {
      return api.sendMessage("❌ Configuration manquante : Le Token GitHub n'est pas configuré dans l'environnement du serveur.", threadID, messageID);
    }

    try {
      // Endpoint corrigé (sans le slash final superflu qui peut perturber l'API)
      const url = `/repos/${GITHUB_USERNAME}/${repoName}/contents`;
      const res = await githubAPI.get(url);

      let msg = `📂 **Dépôt : ${repoName}**\n📍 Racine (\`/\`)\n\n`;
      msg += `0️⃣ ➔ ➕ **Créer un nouveau fichier ici**\n──────────────────\n`;
      
      let filesList = [];

      res.data.forEach((item, index) => {
        const typeIcon = item.type === "dir" ? "📁" : "📄";
        msg += `${index + 1}. ${typeIcon} ${item.name}\n`;
        filesList.push({ name: item.name, type: item.type, path: item.path, sha: item.sha });
      });

      msg += `\n🔢 Répondez avec un numéro pour naviguer ou 0 pour créer un fichier.`;

      return api.sendMessage(msg, threadID, (err, info) => {
        if (err) return;
        global.GoatBot.onReply.set(info.messageID, {
          commandName: this.config.name,
          author: senderID,
          repoName: repoName,
          currentPath: "",
          filesList: filesList,
          step: "navigate"
        });
      }, messageID);

    } catch (err) {
      console.error("GitHub API Error:", err.response ? err.response.data : err.message);
      const status = err.response ? err.response.status : null;
      
      let errorHint = "Vérifiez le nom et vos accès.";
      if (status === 401 || status === 403) errorHint = "Token invalide ou permissions insuffisantes (vérifiez les Scopes de votre clé).";
      if (status === 404) errorHint = "Dépôt introuvable. S'il est privé, assurez-vous que votre token a accès aux dépôts privés.";

      return api.sendMessage(`❌ Impossible d'accéder au dépôt (${status || "Erreur réseau"}). ${errorHint}`, threadID, messageID);
    }
  },

  // GESTION INTERACTIVE DES RÉPONSES
  onReply: async function ({ api, event, Reply }) {
    const { threadID, messageID, senderID, body } = event;

    if (senderID !== Reply.author) return;

    // --- MODE NAVIGATION ---
    if (Reply.step === "navigate") {
      const choice = body.trim();

      if (choice === "0") {
        api.unsendMessage(Reply.messageID);
        return api.sendMessage("📝 Entrez le **nom du fichier** avec son extension (ex: `test.js`) :", threadID, (err, info) => {
          global.GoatBot.onReply.set(info.messageID, {
            commandName: this.config.name,
            author: senderID,
            repoName: Reply.repoName,
            currentPath: Reply.currentPath,
            step: "ask_new_file_name"
          });
        }, messageID);
      }

      const index = parseInt(choice) - 1;
      if (isNaN(index) || !Reply.filesList[index]) {
        return api.sendMessage("⚠️ Numéro invalide.", threadID, messageID);
      }

      const selectedItem = Reply.filesList[index];

      // Cas A : Dossier
      if (selectedItem.type === "dir") {
        try {
          const url = `/repos/${GITHUB_USERNAME}/${Reply.repoName}/contents/${selectedItem.path}`;
          const res = await githubAPI.get(url);

          let msg = `📂 **Dépôt : ${Reply.repoName}**\n📍 Dossier : \`/${selectedItem.path}\`\n\n`;
          msg += `0️⃣ ➔ ➕ **Créer un nouveau fichier ici**\n──────────────────\n`;
          
          let filesList = [];

          res.data.forEach((item, idx) => {
            const typeIcon = item.type === "dir" ? "📁" : "📄";
            msg += `${idx + 1}. ${typeIcon} ${item.name}\n`;
            filesList.push({ name: item.name, type: item.type, path: item.path, sha: item.sha });
          });

          msg += `\n🔢 Répondez avec un numéro pour naviguer ou 0 pour créer un fichier.`;
          api.unsendMessage(Reply.messageID);

          return api.sendMessage(msg, threadID, (err, info) => {
            global.GoatBot.onReply.set(info.messageID, {
              commandName: this.config.name,
              author: senderID,
              repoName: Reply.repoName,
              currentPath: selectedItem.path,
              filesList: filesList,
              step: "navigate"
            });
          }, messageID);

        } catch (e) {
          return api.sendMessage("❌ Erreur lors de l'ouverture du dossier.", threadID, messageID);
        }
      }

      // Cas B : Fichier
      if (selectedItem.type === "file") {
        try {
          const url = `/repos/${GITHUB_USERNAME}/${Reply.repoName}/contents/${selectedItem.path}`;
          const res = await githubAPI.get(url);

          const fileContent = Buffer.from(res.data.content, "base64").toString("utf8");
          api.unsendMessage(Reply.messageID);
          
          let msg = `📄 **Fichier : ${selectedItem.name}**\n\n\`\`\`javascript\n${fileContent.substring(0, 1500)}${fileContent.length > 1500 ? "\n... (coupé)" : ""}\n\`\`\`\n`;
          msg += `\n──────────────────\n`;
          msg += `📝 **Pour modifier :** Répondez à ce message en collant le nouveau code complet.\n\n`;
          msg += `🗑️ **Pour supprimer :** Répondez simplement en écrivant le mot \`delete\``;

          return api.sendMessage(msg, threadID, (err, info) => {
            global.GoatBot.onReply.set(info.messageID, {
              commandName: this.config.name,
              author: senderID,
              repoName: Reply.repoName,
              filePath: selectedItem.path,
              fileSha: selectedItem.sha,
              step: "edit_or_delete"
            });
          }, messageID);

        } catch (e) {
          return api.sendMessage("❌ Erreur lors de la lecture du fichier.", threadID, messageID);
        }
      }
    }

    // --- CRÉATION : ÉTAPE NOM ---
    if (Reply.step === "ask_new_file_name") {
      const fileName = body.trim();
      if (!fileName) return api.sendMessage("❌ Nom invalide.", threadID, messageID);

      const finalPath = Reply.currentPath ? `${Reply.currentPath}/${fileName}` : fileName;

      api.unsendMessage(Reply.messageID);
      return api.sendMessage(`💻 Collez et envoyez maintenant le **code complet** pour le fichier \`${fileName}\` :`, threadID, (err, info) => {
        global.GoatBot.onReply.set(info.messageID, {
          commandName: this.config.name,
          author: senderID,
          repoName: Reply.repoName,
          filePath: finalPath,
          step: "save_new_file"
        });
      }, messageID);
    }

    // --- CRÉATION : ÉTAPE ENREGISTREMENT ---
    if (Reply.step === "save_new_file") {
      const fileCode = body;
      api.unsendMessage(Reply.messageID);

      api.sendMessage("⏳ Création et push du fichier sur GitHub...", threadID, async (err, infoLoading) => {
        try {
          const url = `/repos/${GITHUB_USERNAME}/${Reply.repoName}/contents/${Reply.filePath}`;
          const base64Content = Buffer.from(fileCode, "utf8").toString("base64");

          await githubAPI.put(url, {
            message: `Create new file ${Reply.filePath} via Messenger Bot`,
            content: base64Content
          });

          api.unsendMessage(infoLoading.messageID);
          return api.sendMessage(`✅ **Nouveau fichier créé avec succès !**\n📍 Chemin : \`${Reply.filePath}\``, threadID, messageID);
        } catch (e) {
          console.error(e.response ? e.response.data : e.message);
          api.unsendMessage(infoLoading.messageID);
          return api.sendMessage("❌ Impossible de créer le fichier. Vérifiez les scopes de permissions du token.", threadID, messageID);
        }
      }, messageID);
    }

    // --- INTERACTION : ÉDITION OU SUPPRESSION ---
    if (Reply.step === "edit_or_delete") {
      const input = body.trim();
      api.unsendMessage(Reply.messageID);

      // CAS 1 : Suppression
      if (input.toLowerCase() === "delete") {
        api.sendMessage(`⏳ Suppression du fichier \`${Reply.filePath}\` sur GitHub...`, threadID, async (err, infoLoading) => {
          try {
            const url = `/repos/${GITHUB_USERNAME}/${Reply.repoName}/contents/${Reply.filePath}`;
            
            await githubAPI.delete(url, {
              data: {
                message: `Delete file ${Reply.filePath} via Messenger Bot`,
                sha: Reply.fileSha
              }
            });

            api.unsendMessage(infoLoading.messageID);
            return api.sendMessage(`🗑️ **Fichier \`${Reply.filePath}\` supprimé définitivement de GitHub avec succès !**`, threadID, messageID);
          } catch (e) {
            console.error(e.response ? e.response.data : e.message);
            api.unsendMessage(infoLoading.messageID);
            return api.sendMessage("❌ Impossible de supprimer le fichier.", threadID, messageID);
          }
        }, messageID);
        return;
      }

      // CAS 2 : Modification du code
      api.sendMessage("⏳ Sauvegarde des modifications sur GitHub...", threadID, async (err, infoLoading) => {
        try {
          const url = `/repos/${GITHUB_USERNAME}/${Reply.repoName}/contents/${Reply.filePath}`;
          const base64Content = Buffer.from(input, "utf8").toString("base64");

          await githubAPI.put(url, {
            message: `Update ${Reply.filePath} via Messenger Bot`,
            content: base64Content,
            sha: Reply.fileSha
          });

          api.unsendMessage(infoLoading.messageID);
          return api.sendMessage(`✅ **Fichier \`${Reply.filePath}\` mis à jour sur GitHub !**`, threadID, messageID);
        } catch (e) {
          console.error(e.response ? e.response.data : e.message);
          api.unsendMessage(infoLoading.messageID);
          return api.sendMessage("❌ Échec de la mise à jour sur GitHub.", threadID, messageID);
        }
      }, messageID);
    }
  }
};
