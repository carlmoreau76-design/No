const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');
const axios = require('axios');

const GH_TOKEN = process.env.GITHUB_TOKEN;
const GH_API = "https://api.github.com";
const DATA_PATH = path.join(__dirname, 'data', 'commit_real_data.json');

const getHeaders = () => ({
    'Authorization': `token ${GH_TOKEN}`,
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'GoatBot-Hedgehog-Copilot'
});

function initData() {
    if (!fs.existsSync(path.dirname(DATA_PATH))) {
        fs.ensureDirSync(path.dirname(DATA_PATH));
    }
    if (!fs.existsSync(DATA_PATH)) {
        fs.writeJsonSync(DATA_PATH, {
            config: { currentRepo: "Non défini" },
            localFiles: {},
            notes: [],
            encrypted: {},
            stats: { pushes: 0, pulls: 0, saves: 0 }
        });
    }
}

function encryptText(text, level) {
    const algorithm = level === 'high' ? 'aes-256-cbc' : (level === 'medium' ? 'aes-192-cbc' : 'aes-128-cbc');
    const key = crypto.scryptSync('hedgehog_secret', 'salt', level === 'high' ? 32 : (level === 'medium' ? 24 : 16));
    const iv = Buffer.alloc(16, 0);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
}

function handleGitHubError(error) {
    if (error.response) {
        const status = error.response.status;
        const msg = error.response.data ? error.response.data.message : "";
        if (status === 401) return "❌ Token GitHub invalide ou expiré dans le .env.";
        if (status === 403) return "❌ Accès refusé. Vérifie les permissions de ton token.";
        if (status === 404) return "❌ Cible introuvable. Vérifie le nom du dépôt.";
        return `❌ [Erreur GitHub ${status}] : ${msg}`;
    }
    return `❌ [Erreur Système] : ${error.message}`;
}

module.exports = {
    config: {
        name: "commit",
        version: "6.0.0",
        author: "Hedgehog Developer",
        countDown: 5,
        role: 4, 
        description: "Gestionnaire GitHub avec aide explicite intégrée.",
        category: "admin",
        guide: { fr: "{p}commit [option] [arguments]" }
    },

    onStart: async function ({ api, event, args, message }) {
        initData();
        const data = fs.readJsonSync(DATA_PATH);
        
        if (!GH_TOKEN || GH_TOKEN === "github_pat_ton_token_ici") {
            return message.reply("❌ Le GITHUB_TOKEN n'est pas configuré dans ton fichier .env.");
        }

        const subCmd = args[0] ? args[0].toLowerCase() : null;
        const p = api.getPrefix ? api.getPrefix() : ".";

        // --- MENU EXPLICITE PAR CATÉGORIE ---
        if (!subCmd) {
            const menu = `╭─────────────────────•
│ 📦 𝐂𝐎𝐌𝐌𝐈𝐓 𝐯🟪.🟨 — 𝐆𝐔𝐈𝐃𝐄 𝐃É𝐓𝐀𝐈𝐋𝐋É
├─────────────────────•
│ ⚙️ 𝐂𝐎𝐍𝐅𝐈𝐆𝐔𝐑𝐀𝐓𝐈𝐎𝐍 :
│ 🛠️ ${p}𝐜𝐨𝐦𝐦𝐢𝐭 𝐫𝐞𝐩𝐨 <𝐧𝐚𝐦𝐞>
│    ↳ Cible un dépôt GitHub.
│ 🛠️ ${p}𝐜𝐨𝐦𝐦𝐢𝐭 𝐢𝐧𝐟𝐨 / 𝐬𝐭𝐚𝐭𝐬
│    ↳ Infos de connexion & chiffres.
│ 
│ 📂 𝐀𝐓𝐄𝐋𝐈𝐄𝐑 𝐋𝐎𝐂𝐀𝐋 :
│ 🛠️ ${p}𝐜𝐨𝐦𝐦𝐢𝐭 𝐬𝐚𝐯𝐞 <𝐧𝐚𝐦𝐞> <𝐜𝐨𝐝𝐞>
│    ↳ Crée/Modifie un fichier local.
│ 🛠️ ${p}𝐜𝐨𝐦𝐦𝐢𝐭 𝐥𝐢𝐬𝐭
│    ↳ Liste tes fichiers locaux.
│ 🛠️ ${p}𝐜𝐨𝐦𝐦𝐢𝐭 𝐩𝐫𝐞𝐟𝐢𝐞𝐰 <𝐧𝐚𝐦𝐞>𝐟
│    ↳ Relit le code d'un fichier local.
│ 🛠️ ${p}𝐜𝐨𝐦𝐦𝐢𝐭 𝐩𝐚𝐬𝐭e <𝐧𝐚𝐦e> <𝐥𝐢e𝐧>
│    ↳ Importe un code brut via URL.
│ 🛠️ ${p}𝐜𝐨𝐦𝐦𝐢𝐭 e𝐱𝐩𝐨𝐫𝐭 <𝐧𝐚𝐦e>
│    ↳ Envoie le fichier dans le chat.
│ 
│ 🚀 𝐆𝐈𝐓𝐇𝐔𝐁 (𝐑É𝐄𝐋) :
│ 🛠️ ${p}𝐜𝐨𝐦𝐦𝐢𝐭 𝐩𝐮𝐬𝐡 <𝐧𝐚𝐦𝐞>
│    ↳ Envoie un fichier sur GitHub.
│ 🛠️ ${p}𝐜𝐨𝐦𝐦𝐢𝐭 𝐩𝐮𝐬𝐡𝐚𝐥𝐥
│    ↳ Envoie tout le dossier sur GitHub.
│ 🛠️ ${p}𝐜𝐨𝐦𝐦𝐢𝐭 𝐫𝐞𝐦𝐨𝐭𝐞
│    ↳ Liste les fichiers en ligne.
│ 🛠️ ${p}𝐜𝐨𝐦𝐦𝐢𝐭 𝐩𝐮𝐥𝐥 / 𝐬𝐲𝐧𝐜
│    ↳ Récupère les fichiers en ligne.
│ 🛠️ ${p}𝐜𝐨𝐦𝐦𝐢𝐭 𝐝𝐢𝐟𝐟 <𝐧𝐚𝐦𝐞>
│    ↳ Compare local vs distant.
│ 🛠️ ${p}𝐜𝐨𝐦𝐦𝐢𝐭 𝐩𝐫𝐢𝐯𝐚𝐜𝐲 <𝐩𝐫𝐢𝐯𝐚𝐭𝐞|𝐩𝐮𝐛𝐥𝐢𝐜>
│    ↳ Change la visibilité du dépôt.
╰─────────────────────•`;
            return message.reply(menu);
        }

        try {
            let username;
            try {
                const userRes = await axios.get(`${GH_API}/user`, { headers: getHeaders() });
                username = userRes.data.login;
            } catch (err) {
                return message.reply(handleGitHubError(err));
            }

            const currentRepo = data.config.currentRepo;

            switch (subCmd) {
                case "repo": {
                    const repoName = args[1];
                    if (!repoName) return message.reply(`📂 Dépôt ciblé : \`${currentRepo}\` (Change avec : ${p}commit repo <nom>)`);
                    data.config.currentRepo = repoName;
                    fs.writeJsonSync(DATA_PATH, data);
                    return message.reply(`✅ Target GitHub changée pour : '${repoName}'`);
                }

                case "token": {
                    return message.reply(`🔑 Token GitHub détecté et actif.`);
                }

                case "info":
                case "stats": {
                    return message.reply(`📊 [STATISTIQUES]\n\n• Compte : ${username}\n• Repo Actif : ${currentRepo}\n• Sauv. Locales : ${data.stats.saves}\n• Total Pushes : ${data.stats.pushes}\n• Total Pulls : ${data.stats.pulls}`);
                }

                case "list": {
                    const files = Object.keys(data.localFiles);
                    if (files.length === 0) return message.reply("📁 Aucun fichier enregistré localement.");
                    return message.reply(`📁 [WORKSPACE LOCAL] :\n🔸 ${files.join("\n🔸 ")}`);
                }

                case "remote": {
                    if (currentRepo === "Non défini") return message.reply("⚠️ Définis d'abord un dépôt avec : commit repo <nom>");
                    message.reply(`📥 Lecture du dépôt distant '${currentRepo}'...`);
                    try {
                        const res = await axios.get(`${GH_API}/repos/${username}/${currentRepo}/contents`, { headers: getHeaders() });
                        const remoteFiles = res.data.map(f => `🔹 ${f.name} (${f.type})`);
                        return message.reply(`☁️ [DÉPÔT DISTANT] :\n\n${remoteFiles.join('\n')}`);
                    } catch (err) {
                        return message.reply(handleGitHubError(err));
                    }
                }

                case "save": {
                    const name = args[1];
                    const code = args.slice(2).join(" ");
                    if (!name || !code) return message.reply(`⚠️ Syntaxe : ${p}commit save <nom> <contenu>`);
                    data.localFiles[name] = { code, updatedAt: new Date().toLocaleString() };
                    data.stats.saves++;
                    fs.writeJsonSync(DATA_PATH, data);
                    return message.reply(`✅ Fichier '${name}' prêt en local.`);
                }

                case "preview": {
                    const name = args[1];
                    if (!name || !data.localFiles[name]) return message.reply("❌ Fichier local introuvable.");
                    return message.reply(`📄 [ ${name} ] :\n\n\`\`\`javascript\n${data.localFiles[name].code}\n\`\`\``);
                }

                case "export": {
                    const name = args[1];
                    if (!name || !data.localFiles[name]) return message.reply("❌ Fichier introuvable.");
                    const tempPath = path.join(__dirname, name);
                    fs.writeFileSync(tempPath, data.localFiles[name].code);
                    await message.reply({ body: `📤 Fichier exporté : ${name}`, attachment: fs.createReadStream(tempPath) });
                    return fs.unlinkSync(tempPath);
                }

                case "paste": {
                    const name = args[1];
                    const link = args[2];
                    if (!name || !link) return message.reply(`⚠️ Syntaxe : ${p}commit paste <nom> <lien_raw> [--push]`);
                    message.reply("📥 Importation en cours...");
                    
                    let res;
                    try { res = await axios.get(link, { responseType: 'text' }); } catch (e) {
                        return message.reply("❌ Lien incorrect ou inaccessible.");
                    }

                    data.localFiles[name] = { code: res.data, updatedAt: new Date().toLocaleString() };
                    
                    if (args.includes('--push')) {
                        if (currentRepo === "Non défini") return message.reply("⚠️ Aucun repo configuré pour le --push.");
                        const contentBase64 = Buffer.from(res.data).toString('base64');
                        try {
                            await axios.put(`${GH_API}/repos/${username}/${currentRepo}/contents/${name}`, {
                                message: `Hedgehog AutoPaste: ${name}`,
                                content: contentBase64
                            }, { headers: getHeaders() });
                            data.stats.pushes++;
                            message.reply("🚀 Envoyé également sur GitHub !");
                        } catch (err) { message.reply(handleGitHubError(err)); }
                    }
                    fs.writeJsonSync(DATA_PATH, data);
                    return message.reply(`✅ Fichier téléchargé sous le nom '${name}'.`);
                }

                case "push": {
                    const name = args[1];
                    if (!name || !data.localFiles[name]) return message.reply("❌ Indique un fichier local valide de ta 'list'.");
                    if (currentRepo === "Non défini") return message.reply("⚠️ Utilise d'abord : commit repo <nom>");

                    message.reply(`📤 Synchronisation de '${name}' vers GitHub...`);
                    const contentBase64 = Buffer.from(data.localFiles[name].code).toString('base64');
                    
                    let sha;
                    try {
                        const fileInfo = await axios.get(`${GH_API}/repos/${username}/${currentRepo}/contents/${name}`, { headers: getHeaders() });
                        sha = fileInfo.data.sha;
                    } catch (e) {}

                    try {
                        await axios.put(`${GH_API}/repos/${username}/${currentRepo}/contents/${name}`, {
                            message: `Mise à jour via Hedgehog`,
                            content: contentBase64,
                            sha: sha
                        }, { headers: getHeaders() });

                        data.stats.pushes++;
                        fs.writeJsonSync(DATA_PATH, data);
                        return message.reply(`🚀 '${name}' est en ligne sur le repo **${currentRepo}** !`);
                    } catch (err) { return message.reply(handleGitHubError(err)); }
                }

                case "pushall": {
                    if (currentRepo === "Non défini") return message.reply("⚠️ Aucun repo configuré.");
                    const locals = Object.keys(data.localFiles);
                    if (locals.length === 0) return message.reply("❌ Rien à pousser, dossier local vide.");

                    message.reply(`📤 Push simultané de ${locals.length} fichiers...`);
                    try {
                        for (const name of locals) {
                            const contentBase64 = Buffer.from(data.localFiles[name].code).toString('base64');
                            let sha;
                            try {
                                const fileInfo = await axios.get(`${GH_API}/repos/${username}/${currentRepo}/contents/${name}`, { headers: getHeaders() });
                                sha = fileInfo.data.sha;
                            } catch (e) {}

                            await axios.put(`${GH_API}/repos/${username}/${currentRepo}/contents/${name}`, {
                                message: `PushAll groupé`,
                                content: contentBase64,
                                sha: sha
                            }, { headers: getHeaders() });
                            data.stats.pushes++;
                        }
                        fs.writeJsonSync(DATA_PATH, data);
                        return message.reply("✅ Déploiement complet réussi !");
                    } catch (err) { return message.reply(handleGitHubError(err)); }
                }

                case "pull":
                case "sync": {
                    if (currentRepo === "Non défini") return message.reply("⚠️ Aucun repo configuré.");
                    message.reply(`📥 Téléchargement des fichiers depuis GitHub...`);
                    try {
                        const res = await axios.get(`${GH_API}/repos/${username}/${currentRepo}/contents`, { headers: getHeaders() });
                        for (const file of res.data) {
                            if (file.type === 'file') {
                                const fileData = await axios.get(file.download_url, { responseType: 'text' });
                                data.localFiles[file.name] = { code: fileData.data, updatedAt: new Date().toLocaleString() };
                            }
                        }
                        data.stats.pulls++;
                        fs.writeJsonSync(DATA_PATH, data);
                        return message.reply("🔄 Espace local synchronisé avec GitHub.");
                    } catch (err) { return message.reply(handleGitHubError(err)); }
                }

                case "diff": {
                    const name = args[1];
                    if (!name || !data.localFiles[name]) return message.reply("❌ Indique un fichier local existant.");
                    if (currentRepo === "Non défini") return message.reply("⚠️ Aucun repo configuré.");

                    try {
                        const fileInfo = await axios.get(`${GH_API}/repos/${username}/${currentRepo}/contents/${name}`, { headers: getHeaders() });
                        const remoteContent = Buffer.from(fileInfo.data.content, 'base64').toString('utf-8');
                        const isDiff = data.localFiles[name].code !== remoteContent;
                        return message.reply(isDiff ? `⚠️ Des modifications locales diffèrent de la version en ligne.` : `✅ Parfaitement identique.`);
                    } catch (e) { return message.reply("❌ Absent de GitHub pour l'instant."); }
                }

                case "delete": {
                    const name = args[1];
                    if (!name) return message.reply("⚠️ Indique un nom.");
                    if (data.localFiles[name]) {
                        delete data.localFiles[name];
                        fs.writeJsonSync(DATA_PATH, data);
                        return message.reply(`🗑️ '${name}' retiré de la mémoire locale.`);
                    }
                    return message.reply("❌ Introuvable.");
                }

                case "rename": {
                    const oldN = args[1];
                    const newN = args[2];
                    if (!oldN || !newN) return message.reply(`⚠️ Syntaxe : ${p}commit rename <ancien> <nouveau>`);
                    if (!data.localFiles[oldN]) return message.reply("❌ Fichier introuvable.");
                    data.localFiles[newN] = data.localFiles[oldN];
                    delete data.localFiles[oldN];
                    fs.writeJsonSync(DATA_PATH, data);
                    return message.reply(`🔄 Fichier local renommé.`);
                }

                case "crypt": {
                    const name = args[1];
                    const level = args[2] || 'low';
                    if (!name || !data.localFiles[name]) return message.reply("❌ Fichier introuvable.");
                    if (!['low', 'medium', 'high'].includes(level)) return message.reply("⚠️ Niveaux : low | medium | high");

                    const hash = encryptText(data.localFiles[name].code, level);
                    data.encrypted[name] = { level, hash, encryptedAt: new Date().toLocaleString() };
                    fs.writeJsonSync(DATA_PATH, data);
                    return message.reply(`🔒 Protégé. Hash : \`${hash.substring(0, 25)}...\``);
                }

                case "crypt-list": {
                    const list = Object.keys(data.encrypted);
                    if (list.length === 0) return message.reply("🛡️ Aucun fichier chiffré.");
                    let msg = "🛡️ [FICHIERS SÉCURISÉS] :\n";
                    list.forEach(f => { msg += `\n🔒 ${f} (Niveau : ${data.encrypted[f].level.toUpperCase()})`; });
                    return message.reply(msg);
                }

                case "privacy": {
                    const visibility = args[1] ? args[1].toLowerCase() : null;
                    if (currentRepo === "Non défini") return message.reply("⚠️ Aucun repo actif défini.");
                    if (!['private', 'public'].includes(visibility)) return message.reply(`⚠️ Syntaxe : ${p}commit privacy <private|public>`);

                    message.reply(`⚙️ Configuration des accès sur GitHub...`);
                    try {
                        await axios.patch(`${GH_API}/repos/${username}/${currentRepo}`, { private: visibility === 'private' }, { headers: getHeaders() });
                        return message.reply(`🔒 Le dépôt **${currentRepo}** est désormais **${visibility === 'private' ? 'PRIVÉ 🔐' : 'PUBLIC 🌐'}**.`);
                    } catch (err) { return message.reply(handleGitHubError(err)); }
                }
            }
        } catch (globalError) {
            return message.reply(`❌ [Erreur Fatale] : ${globalError.message}`);
        }
    }
};
