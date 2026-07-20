const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');

// Configuration de l'API GitHub via le token d'environnement
const GH_TOKEN = process.env.GITHUB_TOKEN;
const GH_API = "https://api.github.com";

// En-têtes pour s'authentifier auprès de GitHub
const getHeaders = () => ({
    'Authorization': `token ${GH_TOKEN}`,
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'GoatBot-Hedgehog-Copilot'
});

module.exports = {
    config: {
        name: "commit",
        version: "6.0.0",
        author: "Hedgehog Developer",
        countDown: 5,
        role: 4, // Ajuste à 2 (Admin) si tu ne veux pas que tes membres touchent à ton GitHub !
        description: "Gestionnaire de code réel connecté à l'API GitHub.",
        category: "admin",
        guide: { fr: "{p}commit [option] [arguments]" }
    },

    onStart: async function ({ api, event, args, message }) {
        if (!GH_TOKEN || GH_TOKEN === "github_pat_ton_token_ici") {
            return message.reply("❌ Le GITHUB_TOKEN n'est pas configuré dans le fichier .env.");
        }

        const subCmd = args[0] ? args[0].toLowerCase() : null;
        const p = api.getPrefix ? api.getPrefix() : ".";

        // --- MENU DE LA COMMANDE RÉELLE ---
        if (!subCmd) {
            const menu = `╭─────────────────────•
│ 📦 𝐂𝐎𝐌𝐌𝐈𝐓 𝐯🟪.🟨 — 𝐑𝐄𝐀𝐋 𝐆𝐈𝐓𝐇𝐔𝐁
├─────────────────────•
│ ━━━━━━━━━━━━━━━━━━
│ ${p}𝐜𝐨𝐦𝐦𝐢𝐭 𝐜𝐫𝐞𝐚𝐭𝐞-𝐫𝐞𝐩𝐨 <𝐧𝐚𝐦𝐞>      — Crée un vrai repo sur ton GitHub
│ ${p}𝐜𝐨𝐦𝐦𝐢𝐭 𝐩𝐫𝐢𝐯𝐚𝐜𝐲 <𝐫𝐞𝐩𝐨> <𝐩𝐫𝐢𝐯𝐚𝐭𝐞|𝐩𝐮𝐛𝐥𝐢𝐜> — Change la visibilité (Privé/Public) ← 𝐍𝐄𝐖
│ ${p}𝐜𝐨𝐦𝐦𝐢𝐭 𝐩𝐮𝐬𝐡 <𝐫𝐞𝐩𝐨> <𝐟𝐢𝐥𝐞_𝐩𝐚𝐭𝐡>  — Commit & Push un vrai fichier local
│ ${p}𝐜𝐨𝐦𝐦𝐢𝐭 𝐥𝐢𝐬𝐭 <𝐫𝐞𝐩𝐨>              — Liste les fichiers du repo distant
│ ${p}𝐜𝐨𝐦𝐦𝐢𝐭 𝐝𝐞𝐥𝐞𝐭𝐞-𝐫𝐞𝐩𝐨 <安全_𝐫𝐞𝐩𝐨>  — Supprime un dépôt GitHub
│ 
│ 🦔 Type "hedgehoggpt help" for AI commands
╰─────────────────────•`;
            return message.reply(menu);
        }

        try {
            switch (subCmd) {

                // 1. CHANGER LA VISIBILITÉ DU REPO (PRIVÉ / PUBLIC)
                case "privacy": {
                    const repoName = args[1];
                    const visibility = args[2] ? args[2].toLowerCase() : null;

                    if (!repoName || !['private', 'public'].includes(visibility)) {
                        return message.reply(`⚠️ Utilisation : ${p}commit privacy <nom_du_repo> <private|public>`);
                    }

                    message.reply(`⚙️ Modification de la visibilité du dépôt '${repoName}'...`);

                    // Récupérer le nom d'utilisateur GitHub automatiquement
                    const userRes = await axios.get(`${GH_API}/user`, { headers: getHeaders() });
                    const username = userRes.data.login;

                    // Requête PATCH pour modifier le statut private
                    await axios.patch(`${GH_API}/repos/${username}/${repoName}`, {
                        private: visibility === 'private'
                    }, { headers: getHeaders() });

                    return message.reply(`🔒 Le dépôt **${repoName}** est désormais **${visibility === 'private' ? 'PRIVÉ 🔐' : 'PUBLIC 🌐'}**.`);
                }

                // 2. CRÉER UN NOUVEAU DÉPÔT
                case "create-repo": {
                    const repoName = args[1];
                    if (!repoName) return message.reply(`⚠️ Utilisation : ${p}commit create-repo <nom_du_repo>`);

                    message.reply(`🚀 Création du dépôt '${repoName}' sur GitHub...`);

                    const response = await axios.post(`${GH_API}/user/repos`, {
                        name: repoName,
                        private: true, // Par défaut en privé pour la sécurité
                        description: "Créé via Hedgehog Copilot"
                    }, { headers: getHeaders() });

                    return message.reply(`✅ Dépôt créé avec succès !\n🔗 URL : ${response.data.html_url}\n🔒 Statut : Privé (Utilise 'privacy' pour changer)`);
                }

                // 3. PUSH (COMMITTER) UN VRAI FICHIER LOCAL
                case "push": {
                    const repoName = args[1];
                    const filePath = args[2]; // Exemple: cmds/test.js

                    if (!repoName || !filePath) {
                        return message.reply(`⚠️ Utilisation : ${p}commit push <nom_repo> <chemin_du_fichier_local>`);
                    }

                    const fullPath = path.resolve(__dirname, '..', filePath);
                    if (!fs.existsSync(fullPath)) {
                        return message.reply(`❌ Le fichier local '${filePath}' n'existe pas.`);
                    }

                    message.reply(`📤 Lecture et envoi de '${filePath}' vers GitHub...`);

                    const fileContent = fs.readFileSync(fullPath, 'utf-8');
                    const contentBase64 = Buffer.from(fileContent).toString('base64');

                    const userRes = await axios.get(`${GH_API}/user`, { headers: getHeaders() });
                    const username = userRes.data.login;

                    // Vérifier si le fichier existe déjà sur GitHub pour récupérer son SHA (nécessaire pour update)
                    let sha = undefined;
                    try {
                        const fileInfo = await axios.get(`${GH_API}/repos/${username}/${repoName}/contents/${filePath}`, { headers: getHeaders() });
                        sha = fileInfo.data.sha;
                    } catch (e) {
                        // Le fichier n'existe pas encore, c'est une création
                    }

                    // Envoyer le commit
                    await axios.put(`${GH_API}/repos/${username}/${repoName}/contents/${filePath}`, {
                        message: `Hedgehog Copilot: mis à jour de ${filePath}`,
                        content: contentBase64,
                        sha: sha
                    }, { headers: getHeaders() });

                    return message.reply(`✅ Fichier '${filePath}' pushé avec succès sur le dépôt '${repoName}' !`);
                }

                // 4. LISTER LES FICHIERS DISTANTS
                case "list": {
                    const repoName = args[1];
                    if (!repoName) return message.reply(`⚠️ Utilisation : ${p}commit list <nom_repo>`);

                    const userRes = await axios.get(`${GH_API}/user`, { headers: getHeaders() });
                    const username = userRes.data.login;

                    const res = await axios.get(`${GH_API}/repos/${username}/${repoName}/contents`, { headers: getHeaders() });
                    const files = res.data.map(f => `🔹 ${f.name} (${f.type})`);

                    return message.reply(`📂 Fichiers présents sur le repo '${repoName}' :\n\n${files.join('\n')}`);
                }

                // 5. SUPPRIMER UN REPO
                case "delete-repo": {
                    const repoName = args[1];
                    if (!repoName) return message.reply(`⚠️ Utilisation : ${p}commit delete-repo <nom_repo>`);

                    const userRes = await axios.get(`${GH_API}/user`, { headers: getHeaders() });
                    const username = userRes.data.login;

                    await axios.delete(`${GH_API}/repos/${username}/${repoName}`, { headers: getHeaders() });
                    return message.reply(`🗑️ Dépôt GitHub '${repoName}' supprimé définitivement.`);
                }
            }
        } catch (error) {
            const errorMsg = error.response && error.response.data ? error.response.data.message : error.message;
            return message.reply(`❌ [GitHub API Error] : ${errorMsg}`);
        }
    }
};
