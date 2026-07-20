const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

// Chemin vers le fichier de stockage local pour l'historique, les notes et les fichiers
const DATA_PATH = path.join(__dirname, 'data', 'hedgehoggpt_data.json');

// Configuration initiale des données locales
function initData() {
    if (!fs.existsSync(path.dirname(DATA_PATH))) {
        fs.ensureDirSync(path.dirname(DATA_PATH));
    }
    if (!fs.existsSync(DATA_PATH)) {
        fs.writeJsonSync(DATA_PATH, {
            files: {},      // Contenu et versions des fichiers sauvegardés
            notes: [],      // Notes textuelles
            stats: { queries: 0, filesAnalyzed: 0, fixesMade: 0 }
        });
    }
}

// Fonction pour appeler l'API de l'IA (À adapter selon votre clé / API Hedgehog ou OpenAI)
async function callAI(prompt, systemInstruction = "Tu es Hedgehog Copilot, un assistant expert en développement logiciel.") {
    try {
        // Mettez ici votre endpoint API et vos configurations
        // Exemple générique avec une structure standard
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: "gpt-4o-mini", // Ou le modèle de votre choix
            messages: [
                { role: "system", content: systemInstruction },
                { role: "user", content: prompt }
            ]
        }, {
            headers: {
                'Authorization': `Bearer VOTRE_CLE_API_ICI`,
                'Content-Type': 'application/json'
            }
        });
        return response.data.choices[0].message.content;
    } catch (error) {
        // En cas d'échec de l'API réelle, mode simulation / message d'erreur clair
        throw new Error("Erreur lors de la communication avec l'API IA. Vérifiez votre configuration de clé d'API.");
    }
}

// Récupérer le contenu d'une pièce jointe (texte, js, json, html, etc.)
async function getAttachmentContent(message) {
    if (!message.attachments || message.attachments.length === 0) return null;
    const att = message.attachments[0];
    if (att.type === 'file' || att.type === 'photo') { // Accepte les fichiers ou textes bruts envoyés
        try {
            const res = await axios.get(att.url, { responseType: 'text' });
            return { filename: att.filename || "fichier_inconnu.txt", content: res.data };
        } catch (e) {
            return null;
        }
    }
    return null;
}

module.exports = {
    config: {
        name: "hedgehoggpt",
        version: "1.0.0",
        author: "Hedgehog Developer",
        countDown: 5,
        role: 4, // 0 = Tous les utilisateurs
        description: "Assistant de développement intelligent de style GitHub Copilot pour analyser, corriger et optimiser votre code.",
        category: "Dev",
        guide: {
            en: "{p}hedgehoggpt [subcommand] [arguments] (ou avec un fichier joint)",
            fr: "{p}hedgehoggpt [sous-commande] [arguments] (ou avec un fichier joint)"
        }
    },

    onStart: async function ({ api, event, args, message }) {
        initData();
        const data = fs.readJsonSync(DATA_PATH);
        const { threadID, messageID } = event;
        
        const subCmd = args[0] ? args[0].toLowerCase() : null;
        const queryText = args.slice(1).join(" ");

        // Détection d'un fichier joint dans le message actuel ou le message répondu (reply)
        let fileData = await getAttachmentContent(event);
        if (!fileData && event.messageReply) {
            fileData = await getAttachmentContent(event.messageReply);
        }

        // --- MENU D'AIDE CENTRALISÉ ---
        const sendHelpMenu = () => {
            const menu = `
╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
┃    🦔 HEDGEHOG COPILOT MENU 🦔
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯
🤖 Assistant de Développement IA Intégré

💡 [COMMANDES GÉNÉRALES]
📝 {p}hedgehoggpt <question> : Poser une question libre à l'IA.
📂 {p}hedgehoggpt copilot <q> : Analyse le fichier joint + répond à <q>.
✨ {p}hedgehoggpt create <nom> <desc> : Génère un nouveau fichier selon la description.

🛠️ [ANALYSE DE CODE] (Nécessite un fichier joint)
🔍 {p}hedgehoggpt review : Revue complète de code (qualité, logique).
🛡️ {p}hedgehoggpt security : Audit de sécurité complet du fichier.
🛠️ {p}hedgehoggpt fix : Corrige les erreurs et bugs détectés.
⚡ {p}hedgehoggpt improve : Propose des optimisations de performance.
💡 {p}hedgehoggpt suggest : Donne le Top 5 des meilleures suggestions.
📖 {p}hedgehoggpt explain : Explique le fonctionnement du code ligne par ligne.
✍️ {p}hedgehoggpt doc : Ajoute des commentaires et de la documentation JSDoc/etc.
🧪 {p}hedgehoggpt test : Génère des tests unitaires adaptés.
📉 {p}hedgehoggpt simplify : Simplifie et factorise le code complexe.
📊 {p}hedgehoggpt analyse : Analyse approfondie des métriques du code.

📦 [GESTION LOCALE ET LOGICIELLE]
💾 {p}hedgehoggpt list : Liste les fichiers actuellement mémorisés.
🕒 {p}hedgehoggpt history <nom> : Affiche l'historique des versions locales.
🔄 {p}hedgehoggpt diff <nom> : Compare l'ancienne version locale et l'actuelle.
⏪ {p}hedgehoggpt rollback <nom> : Restaure la version précédente d'un fichier.
🔍 {p}hedgehoggpt search <terme> : Cherche un terme dans les fichiers enregistrés.
📌 {p}hedgehoggpt note <texte> : Sauvegarde une note de dev.
📋 {p}hedgehoggpt notes : Affiche toutes vos notes enregistrées.
📈 {p}hedgehoggpt stats : Statistiques d'utilisation globale.
🧹 {p}hedgehoggpt reset : Réinitialise la base de données locale.

💡 Astuce : Répondez à un message contenant un fichier avec la commande pour l'analyser directement !
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
            return message.reply(menu.replace(/{p}/g, api.getPrefix ? api.getPrefix() : "/"));
        };

        if (!subCmd) {
            return sendHelpMenu();
        }

        // --- ENREGISTREMENT AUTOMATIQUE DU FICHIER SI PRÉSENT ---
        if (fileData) {
            if (!data.files[fileData.filename]) {
                data.files[fileData.filename] = [];
            }
            // Sauvegarde de l'historique local (max 5 versions pour économiser l'espace)
            const versions = data.files[fileData.filename];
            if (versions.length === 0 || versions[versions.length - 1].content !== fileData.content) {
                versions.push({
                    timestamp: new Date().toLocaleString(),
                    content: fileData.content
                });
                if (versions.length > 5) versions.shift();
                data.stats.filesAnalyzed++;
                fs.writeJsonSync(DATA_PATH, data);
            }
        }

        // --- TRAITEMENT DES SOUS-COMMANDES ---
        try {
            switch (subCmd) {
                
                // 1. Chat Générique / Question Libre
                default: {
                    // Si la sous-commande n'est pas reconnue, on traite tout comme une question globale
                    const fullQuery = args.join(" ");
                    message.reply("🤖 [Hedgehog AI] Réflexion en cours...");
                    const reply = await callAI(fullQuery);
                    data.stats.queries++;
                    fs.writeJsonSync(DATA_PATH, data);
                    return message.reply(reply);
                }

                // 2. Copilot interactif sur fichier
                case "copilot": {
                    if (!fileData) return message.reply("⚠️ Veuillez joindre un fichier ou répondre à un fichier pour utiliser cette commande.");
                    if (!queryText) return message.reply("⚠️ Veuillez spécifier votre question concernant ce fichier. Exemple : copilot Explique la fonction X");
                    
                    message.reply(`🤖 [Hedgehog AI] Analyse du fichier '${fileData.filename}' en cours...`);
                    const prompt = `Fichier: ${fileData.filename}\nContenu:\n\`\`\`\n${fileData.content}\n\`\`\`\n\nQuestion de l'utilisateur: ${queryText}`;
                    const reply = await callAI(prompt);
                    return message.reply(reply);
                }

                // 3. Amélioration de code
                case "improve": {
                    if (!fileData) return message.reply("⚠️ Fichier manquant. Joignez un fichier de code.");
                    message.reply("⚡ [Hedgehog AI] Recherche d'optimisations et d'améliorations de performances...");
                    const prompt = `Analyse ce code et propose uniquement des optimisations de performances, de lisibilité et de structure.\nCode:\n\`\`\`\n${fileData.content}\n\`\`\``;
                    const reply = await callAI(prompt);
                    return message.reply(reply);
                }

                // 4. Correction de bugs
                case "fix": {
                    if (!fileData) return message.reply("⚠️ Fichier manquant. Joignez un fichier de code.");
                    message.reply("🛠️ [Hedgehog AI] Analyse des erreurs et correction automatique du code...");
                    const prompt = `Détecte les bugs logiques, les erreurs de syntaxe ou les mauvaises pratiques dans ce code et renvoie une version corrigée commentée.\nCode:\n\`\`\`\n${fileData.content}\n\`\`\``;
                    const reply = await callAI(prompt);
                    data.stats.fixesMade++;
                    fs.writeJsonSync(DATA_PATH, data);
                    return message.reply(reply);
                }

                // 5. Revue de code complète
                case "review": {
                    if (!fileData) return message.reply("⚠️ Fichier manquant. Joignez un fichier de code.");
                    message.reply("🔍 [Hedgehog AI] Analyse structurelle et revue de code en cours...");
                    const prompt = `Effectue une revue de code rigoureuse (architecture, propreté Clean Code, maintenabilité).\nCode:\n\`\`\`\n${fileData.content}\n\`\`\``;
                    const reply = await callAI(prompt);
                    return message.reply(reply);
                }

                // 6. Audit de sécurité
                case "security": {
                    if (!fileData) return message.reply("⚠️ Fichier manquant. Joignez un fichier de code.");
                    message.reply("🛡️ [Hedgehog AI] Audit de sécurité en cours (Failles, injections, fuites de données)...");
                    const prompt = `Analyse ce code uniquement sous l'angle de la sécurité. Détecte les vulnérabilités potentielles (XSS, injections, secret hardcodé, etc.) et propose des remédiations.\nCode:\n\`\`\`\n${fileData.content}\n\`\`\``;
                    const reply = await callAI(prompt);
                    return message.reply(reply);
                }

                // 7. Top 5 des suggestions
                case "suggest": {
                    if (!fileData) return message.reply("⚠️ Fichier manquant.");
                    message.reply("💡 [Hedgehog AI] Génération des 5 meilleures suggestions d'évolution...");
                    const prompt = `Donne exactement le top 5 des meilleures suggestions d'améliorations ou d'ajouts de fonctionnalités pour ce code.\nCode:\n\`\`\`\n${fileData.content}\n\`\`\``;
                    const reply = await callAI(prompt);
                    return message.reply(reply);
                }

                // 8. Expliquer le code
                case "explain": {
                    if (!fileData) return message.reply("⚠️ Fichier manquant.");
                    message.reply("📖 [Hedgehog AI] Décryptage et explication du code...");
                    const prompt = `Explique le fonctionnement général puis détaillé de ce code de manière pédagogique.\nCode:\n\`\`\`\n${fileData.content}\n\`\`\``;
                    const reply = await callAI(prompt);
                    return message.reply(reply);
                }

                // 9. Ajouter de la documentation
                case "doc": {
                    if (!fileData) return message.reply("⚠️ Fichier manquant.");
                    message.reply("✍️ [Hedgehog AI] Génération des commentaires et de la documentation intégrée...");
                    const prompt = `Prends ce code et renvoie-le entièrement en y ajoutant des commentaires clairs et une documentation complète (JSDoc ou équivalent selon le langage).\nCode:\n\`\`\`\n${fileData.content}\n\`\`\``;
                    const reply = await callAI(prompt);
                    return message.reply(reply);
                }

                // 10. Génération de tests unitaires
                case "test": {
                    if (!fileData) return message.reply("⚠️ Fichier manquant.");
                    message.reply("🧪 [Hedgehog AI] Écriture des suites de tests unitaires...");
                    const prompt = `Génère une suite complète de tests unitaires robustes (en utilisant le framework le plus adapté comme Jest, Mocha, PyTest...) pour couvrir ce code.\nCode:\n\`\`\`\n${fileData.content}\n\`\`\``;
                    const reply = await callAI(prompt);
                    return message.reply(reply);
                }

                // 11. Simplification de code
                case "simplify": {
                    if (!fileData) return message.reply("⚠️ Fichier manquant.");
                    message.reply("📉 [Hedgehog AI] Refactorisation et simplification du code...");
                    const prompt = `Simplifie et réduis la complexité cyclomatique de ce code tout en préservant exactement le même comportement comportemental.\nCode:\n\`\`\`\n${fileData.content}\n\`\`\``;
                    const reply = await callAI(prompt);
                    return message.reply(reply);
                }

                // 12. Analyse approfondie
                case "analyse": {
                    if (!fileData) return message.reply("⚠️ Fichier manquant.");
                    message.reply("📊 [Hedgehog AI] Calcul des indicateurs de qualité et analyse sémantique...");
                    const prompt = `Fournis une analyse technique approfondie : forces, faiblesses, dette technique estimée et architecture globale de ce fichier.\nCode:\n\`\`\`\n${fileData.content}\n\`\`\``;
                    const reply = await callAI(prompt);
                    return message.reply(reply);
                }

                // 13. Création de fichier ex-nihilo
                case "create": {
                    const filename = args[1];
                    const description = args.slice(2).join(" ");
                    if (!filename || !description) return message.reply("⚠️ Syntaxe requise : create <nom_fichier.extension> <description du besoin>");
                    
                    message.reply(`✨ [Hedgehog AI] Génération de la structure initiale du fichier '${filename}'...`);
                    const prompt = `Crée un fichier nommé "${filename}" basé exactement sur cette description :\n${description}\nRetourne uniquement le code propre et prêt à l'emploi.`;
                    const reply = await callAI(prompt);
                    
                    // Enregistrement de cette création dans la base locale
                    data.files[filename] = [{
                        timestamp: new Date().toLocaleString(),
                        content: reply
                    }];
                    fs.writeJsonSync(DATA_PATH, data);
                    
                    return message.reply(`✅ Fichier '${filename}' généré avec succès et enregistré dans l'historique local.\n\n${reply}`);
                }

                // 14. Comparaison entre deux fichiers locaux enregistrés
                case "compare": {
                    const f1 = args[1];
                    const f2 = args[2];
                    if (!f1 || !f2) return message.reply("⚠️ Spécifiez deux noms de fichiers enregistrés. Exemple: compare index.js old.js");
                    if (!data.files[f1] || !data.files[f2]) return message.reply("⚠️ L'un ou les deux fichiers spécifiés n'existent pas dans la base de données Hedgehog.");
                    
                    const c1 = data.files[f1][data.files[f1].length - 1].content;
                    const c2 = data.files[f2][data.files[f2].length - 1].content;
                    
                    message.reply(`⚖️ [Hedgehog AI] Comparaison croisée entre ${f1} et ${f2}...`);
                    const prompt = `Compare le fichier A et le fichier B. Explique les différences architecturales et de logique fondamentales.\nFichier A (${f1}) :\n\`\`\`\n${c1}\n\`\`\`\n\nFichier B (${f2}) :\n\`\`\`\n${c2}\n\`\`\``;
                    const reply = await callAI(prompt);
                    return message.reply(reply);
                }

                // 15. Recherche sémantique
                case "search": {
                    if (!queryText) return message.reply("⚠️ Entrez un mot ou un terme à chercher.");
                    let results = [];
                    for (const [filename, versions] of Object.entries(data.files)) {
                        if (versions.length > 0) {
                            const lastContent = versions[versions.length - 1].content;
                            if (lastContent.toLowerCase().includes(queryText.toLowerCase())) {
                                results.push(filename);
                            }
                        }
                    }
                    if (results.length === 0) return message.reply(`🔍 Aucun fichier contenant '${queryText}' trouvé.`);
                    return message.reply(`🔍 Terme trouvé dans les fichiers suivants :\n🔹 ${results.join("\n🔹 ")}`);
                }

                // 16. Historique des versions locales d'un fichier
                case "history": {
                    const fn = args[1];
                    if (!fn) return message.reply("⚠️ Précisez le nom du fichier.");
                    if (!data.files[fn] || data.files[fn].length === 0) return message.reply("❌ Aucun historique disponible pour ce fichier.");
                    
                    let out = `🕒 Historique local pour [${fn}] :\n`;
                    data.files[fn].forEach((v, idx) => {
                        out += `\n[Version ${idx + 1}] - Sauvegardé le : ${v.timestamp}`;
                    });
                    return message.reply(out);
                }

                // 17. Différentiel local entre la dernière et l'avant-dernière version
                case "diff": {
                    const fn = args[1];
                    if (!fn) return message.reply("⚠️ Précisez le nom du fichier.");
                    const history = data.files[fn];
                    if (!history || history.length < 2) return message.reply("❌ Il faut au moins 2 versions enregistrées pour voir un changement (diff).");
                    
                    const oldV = history[history.length - 2].content;
                    const newV = history[history.length - 1].content;
                    
                    message.reply(`📉 [Hedgehog AI] Génération du rapport différentiel (Diff)...`);
                    const prompt = `Génère un résumé des lignes ajoutées, modifiées ou supprimées entre ces deux versions du même fichier.\nAncienne Version :\n\`\`\`\n${oldV}\n\`\`\`\n\nNouvelle Version :\n\`\`\`\n${newV}\n\`\`\``;
                    const reply = await callAI(prompt);
                    return message.reply(reply);
                }

                // 18. Rollback local
                case "rollback": {
                    const fn = args[1];
                    if (!fn) return message.reply("⚠️ Précisez le nom du fichier.");
                    const history = data.files[fn];
                    if (!history || history.length < 2) return message.reply("❌ Pas d'ancienne version disponible pour effectuer une restauration.");
                    
                    // On retire la dernière version pour revenir en arrière
                    history.pop();
                    data.files[fn] = history;
                    fs.writeJsonSync(DATA_PATH, data);
                    
                    return message.reply(`⏪ Restauration réussie ! Le fichier [${fn}] a été ramené à sa version précédente (${history[history.length - 1].timestamp}). Envoyez la commande 'explain' pour voir son état actuel.`);
                }

                // 19. Ajouter une note textuelle
                case "note": {
                    if (!queryText) return message.reply("⚠️ Contenu de la note manquant.");
                    data.notes.push({
                        date: new Date().toLocaleString(),
                        content: queryText
                    });
                    fs.writeJsonSync(DATA_PATH, data);
                    return message.reply("📌 Note de développement ajoutée au bloc-notes local !");
                }

                // 20. Afficher les notes
                case "notes": {
                    if (data.notes.length === 0) return message.reply("📋 Votre bloc-notes local est vide.");
                    let out = "📋 [BLOC-NOTES DEV HEDGEHOG] :\n";
                    data.notes.forEach((n, i) => {
                        out += `\n📌 #${i + 1} (${n.date}) : ${n.content}`;
                    });
                    return message.reply(out);
                }

                // 21. Lister tous les fichiers enregistrés
                case "list": {
                    const fileNames = Object.keys(data.files);
                    if (fileNames.length === 0) return message.reply("📂 Aucun fichier enregistré dans la base de données locale.");
                    return message.reply(`📂 Fichiers en mémoire (${fileNames.length}) :\n🔹 ${fileNames.join("\n🔹 ")}`);
                }

                // 22. Statistiques locales
                case "stats": {
                    const statsMsg = `📊 STATISTIQUES D'UTILISATION [HEDGEHOG COPILOT]\n\n💬 Requêtes IA totales : ${data.stats.queries}\n📂 Fichiers analysés : ${data.stats.filesAnalyzed}\n🛠️ Débuggages / Corrections appliqués : ${data.stats.fixesMade}\n💾 Fichiers en mémoire locale : ${Object.keys(data.files).length}\n📌 Notes sauvegardées : ${data.notes.length}`;
                    return message.reply(statsMsg);
                }

                // 23. Réinitialisation complète
                case "reset": {
                    fs.removeSync(DATA_PATH);
                    initData();
                    return message.reply("🧹 Toutes les données HedgehogCopilot locales (historiques, notes et fichiers mémorisés) ont été réinitialisées avec succès.");
                }
            }
        } catch (err) {
            return message.reply(`❌ [Hedgehog Error] : ${err.message}`);
        }
    }
};
