/**
 * 💍 SYSTEME MARRIAGE V2 PREMIUM - COMPOSANT ROUTEUR & INTERACTION INTERACTIVE
 * Version : 2.0.0
 * Architecture : Prise en charge Reply, Mentions, UIDs & Filtrage d'actions
 */

const path = require("path");

// Importation isolée et sécurisée du module de stockage
const storage = require("./MMORPG_System/marriageSystem/marry.storage.js");

module.exports = {
    config: {
        name: "marry",
        version: "2.0.0",
        author: "Premium Social Engine",
        countDown: 3, // Anti-spam natif de 3 secondes
        role: 0, // Accessible à tous les membres
        description: "Système de mariage premium V2 : Unissez vos destins, partagez un profil et gérez vos statistiques de couple !",
        category: "system"
    },

    onStart: async function ({ api, event, args }) {
        const { threadID, messageID, senderID } = event;
        const now = Date.now();

        // Initialisation ou extraction du profil de l'appelant
        const senderName = event.senderName || `Aventurier #${senderID.slice(-4)}`;
        const userProfile = storage.getUserMarriageProfile(senderID, senderName);

        const subCommand = args[0] ? args[0].toLowerCase() : null;

        // =========================================================================
        // 🧾 MENU PRINCIPAL DES COMMANDES (TEXTE PREMIUM)
        // =========================================================================
        if (!subCommand) {
            let menu = `╭───────────────────────────────────────╮\n`;
            menu += `│ 💍 𝐒𝐘𝐒𝐓È𝐌𝐄 𝐌𝐀𝐑𝐈𝐀𝐆𝐄 𝐕𝟐\n`;
            menu += `├───────────────────────────────────────┤\n`;
            menu += `│ 💌 **𝖦𝖾𝗌𝗍𝗂𝗈𝗇 𝖽𝖾 𝗅'𝖴𝗇𝗂𝗈𝗇**\n`;
            menu += `│ 🔹 marry propose [@user | uid] : Demander une main\n`;
            menu += `│ 🔹 marry accept                  : Accepter l'union active\n`;
            menu += `│ 🔹 marry refuse                  : Rejeter la proposition\n`;
            menu += `│ 🔹 marry divorce                 : Dissoudre le lien sacré\n`;
            menu += `├───────────────────────────────────────┤\n`;
            menu += `│ 👩‍❤️‍👨 **𝖯𝗋𝗈𝖿𝗂𝗅 & 𝖤𝗑𝗉𝗋𝖾𝗌𝗌𝗂𝗈𝗇**\n`;
            menu += `│ 🔹 marry info [@user | uid]      : Fiche de couple textuelle\n`;
            menu += `│ 🔹 marry stats                   : Dashboard Canvas premium\n`;
            menu += `│ 🔹 marry bio <texte>             : Mettre à jour la biographie\n`;
            menu += `│ 🔹 marry quote <texte>           : Définir une citation\n`;
            menu += `│ 🔹 marry rename <nom>            : Renommer votre alliance\n`;
            menu += `├───────────────────────────────────────┤\n`;
            menu += `│ 🎁 **𝖨𝗇𝗍𝖾𝗋𝖺𝖼𝗍𝗂𝗈𝗇𝗌 & 𝖦𝖺𝗂𝗇𝗌**\n`;
            menu += `│ 🔹 marry daily                   : Récompense de fidélité\n`;
            menu += `│ 🔹 marry gift <montant>          : Offrir un présent monétaire\n`;
            menu += `│ 🔹 marry ring                    : Statut de la bague sacrée\n`;
            menu += `│ 🔹 marry compatibility           : Afficher l'affinité\n`;
            menu += `│ 🔹 marry top                     : Classement des âmes sœurs\n`;
            menu += `│ 🔹 marry anniversary             : Décompte des jours passés\n`;
            menu += `│ 🔹 marry history                 : Journal d'évolution\n`;
            menu += `╰───────────────────────────────────────╯`;
            return api.sendMessage(menu, threadID, messageID);
        }

        // =========================================================================
        // 💌 SOUS-COMMANDE : MARRY PROPOSE
        // =========================================================================
        if (subCommand === "propose") {
            if (userProfile.isMarried) {
                return api.sendMessage("⚠️ Vous êtes déjà marié ! Vous devez divorcer avant de pouvoir faire une nouvelle demande.", threadID, messageID);
            }

            let targetID = null;

            // Cas 1 : Détection par Reply
            if (event.type === "message_reply") {
                targetID = event.messageReply.senderID;
            } 
            // Cas 2 : Détection par Mention
            else if (Object.keys(event.mentions).length > 0) {
                targetID = Object.keys(event.mentions)[0];
            } 
            // Cas 3 : Détection par UID textuel
            else if (args[1] && !isNaN(args[1])) {
                targetID = args[1];
            }

            if (!targetID) {
                return api.sendMessage("💡 Usage: Répondez à un message avec `marry propose`, mentionnez un utilisateur ou fournissez son UID.", threadID, messageID);
            }

            if (targetID === senderID) {
                return api.sendMessage("❌ L'amour propre est louable, mais vous ne pouvez pas vous épouser vous-même.", threadID, messageID);
            }

            // Récupération du profil de la cible
            const targetName = event.mentions[targetID] ? event.mentions[targetID].replace("@", "") : `Aventurier #${targetID.slice(-4)}`;
            const targetProfile = storage.getUserMarriageProfile(targetID, targetName);

            if (targetProfile.isMarried) {
                return api.sendMessage(`❌ Cette personne est déjà liée par les liens du mariage avec un autre utilisateur.`, threadID, messageID);
            }

            // Création de la proposition persistante (valable 5 minutes)
            storage.createProposal(senderID, targetID, {
                senderName: userProfile.name,
                targetName: targetProfile.name
            });

            let propMsg = `💍 **DEMANDE EN MARIAGE V2** 💍\n\n`;
            propMsg += `💌 **${userProfile.name}** souhaite officiellement s'unir à vous, **${targetProfile.name}**.\n\n`;
            propMsg += `👉 Pour sceller cette alliance, répondez à ce message avec :\n`;
            propMsg += `✅ \`marry accept\` pour prononcer vos vœux.\n`;
            propMsg += `❌ \`marry refuse\` pour rejeter la proposition.\n\n`;
            propMsg += `⚠️ *Cette demande expirera automatiquement dans 5 minutes.*`;

            return api.sendMessage(propMsg, threadID, messageID);
        }

        // =========================================================================
        // ✅ SOUS-COMMANDE : MARRY ACCEPT
        // =========================================================================
        if (subCommand === "accept") {
            if (userProfile.isMarried) {
                return api.sendMessage("⚠️ Vous êtes déjà engagé dans une union sacrée.", threadID, messageID);
            }

            const activeProposal = storage.getProposal(senderID);
            if (!activeProposal) {
                return api.sendMessage("❌ Vous n'avez aucune proposition en attente ou celle-ci a expiré.", threadID, messageID);
            }

            const requesterProfile = storage.getUserMarriageProfile(activeProposal.fromId, activeProposal.senderName);
            if (requesterProfile.isMarried) {
                storage.removeProposal(senderID);
                return api.sendMessage("❌ L'initiateur de la demande s'est marié entre-temps. Proposition annulée.", threadID, messageID);
            }

            // Création du mariage et suppression de la demande en attente
            const coupleData = storage.createMarriage(requesterProfile, userProfile);
            storage.removeProposal(senderID);

            let acceptMsg = `🎉 **UNION SACRÉE CÉLÉBRÉE** 🎉\n\n`;
            acceptMsg += `🔔 Les cloches sonnent ! **${requesterProfile.name}** et **${userProfile.name}** se sont dit "Oui" !\n`;
            acceptMsg += `✨ Leur destin est désormais lié sous le nom : *${coupleData.coupleName}*.\n\n`;
            acceptMsg += `📊 Explorez votre fiche technique via \`marry info\` ou générez votre carte via \`marry stats\`.`;

            return api.sendMessage(acceptMsg, threadID, messageID);
        }

        // =========================================================================
        // ❌ SOUS-COMMANDE : MARRY REFUSE
        // =========================================================================
        if (subCommand === "refuse") {
            const activeProposal = storage.getProposal(senderID);
            if (!activeProposal) {
                return api.sendMessage("❌ Aucune demande active en attente à rejeter.", threadID, messageID);
            }

            storage.removeProposal(senderID);
            return api.sendMessage(`💔 Vous avez poliment décliné la demande en mariage de **${activeProposal.senderName}**. Le registre a été mis à jour.`, threadID, messageID);
        }
