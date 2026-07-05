/**
 * 💍 SYSTEME MARRIAGE V2 PREMIUM - COMPOSANT ROUTEUR & INTERACTION INTERACTIVE
 * Version : 2.0.0
 * Architecture : Prise en charge Reply, Mentions, UIDs & Filtrage d'actions
 */

const path = require("path");

// Importation isolée et sécurisée du module de stockage
const storage = require("./MMORPG_System/mariageSystem/marry.storage.js");

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

        // =========================================================================
        // 💔 SOUS-COMMANDE : MARRY DIVORCE
        // =========================================================================
        if (subCommand === "divorce") {
            if (!userProfile.isMarried || !userProfile.coupleId) {
                return api.sendMessage("❌ Vous n'êtes actuellement pas marié(e).", threadID, messageID);
            }

            const marriages = storage.getMarriages();
            const coupleData = marriages[userProfile.coupleId];

            if (!coupleData) {
                userProfile.isMarried = false;
                userProfile.coupleId = null;
                storage.saveUserMarriageProfile(senderID, userProfile);
                return api.sendMessage("🔧 Anomalie détectée et réparée : Votre statut a été réinitialisé à célibataire.", threadID, messageID);
            }

            const partnerId = senderID === coupleData.user1Id ? coupleData.user2Id : coupleData.user1Id;
            const partnerName = senderID === coupleData.user1Id ? coupleData.user2Name : coupleData.user1Name;

            // Dissolution définitive de l'alliance
            storage.removeMarriage(userProfile.coupleId);

            let divMsg = `💔 **RUPTURE DE SCELLÉ** 💔\n\n`;
            divMsg += `L'alliance unissant **${userProfile.name}** et **${partnerName}** a été brisée.\n`;
            divMsg += `⚖️ Le nom de couple *${coupleData.coupleName}* est effacé des registres officiels. Chacun reprend sa route en solo.`;

            return api.sendMessage(divMsg, threadID, messageID);
        }

        // =========================================================================
        // 📝 SOUS-COMMANDE : MARRY BIO
        // =========================================================================
        if (subCommand === "bio") {
            if (!userProfile.isMarried || !userProfile.coupleId) {
                return api.sendMessage("❌ Vous devez être marié(e) pour modifier la biographie du couple.", threadID, messageID);
            }

            const text = args.slice(1).join(" ");
            if (!text) return api.sendMessage("💡 Usage: `marry bio <votre texte>`", threadID, messageID);

            const marriages = storage.getMarriages();
            const coupleData = marriages[userProfile.coupleId];

            coupleData.bio = text.slice(0, 200); // Limite de sécurité de 200 caractères
            storage.logMarriageEvent(coupleData, "BIO", `Biographie modifiée par ${userProfile.name}`);
            storage.saveMarriages(marriages);

            return api.sendMessage("📝 Biographie du couple mise à jour avec succès !", threadID, messageID);
        }

        // =========================================================================
        // 💬 SOUS-COMMANDE : MARRY QUOTE
        // =========================================================================
        if (subCommand === "quote") {
            if (!userProfile.isMarried || !userProfile.coupleId) {
                return api.sendMessage("❌ Vous devez être marié(e) pour définir une citation de couple.", threadID, messageID);
            }

            const text = args.slice(1).join(" ");
            if (!text) return api.sendMessage("💡 Usage: `marry quote <votre citation>`", threadID, messageID);

            const marriages = storage.getMarriages();
            const coupleData = marriages[userProfile.coupleId];

            coupleData.quote = `« ${text.slice(0, 80)} »`; // Limite esthétique de 80 caractères
            storage.logMarriageEvent(coupleData, "CITATION", `Citation mise à jour par ${userProfile.name}`);
            storage.saveMarriages(marriages);

            return api.sendMessage("💬 Nouvelle citation enregistrée pour votre alliance !", threadID, messageID);
        }

        // =========================================================================
        // 🏷️ SOUS-COMMANDE : MARRY RENAME
        // =========================================================================
        if (subCommand === "rename") {
            if (!userProfile.isMarried || !userProfile.coupleId) {
                return api.sendMessage("❌ Vous devez posséder une alliance active pour la renommer.", threadID, messageID);
            }

            const newName = args.slice(1).join(" ");
            if (!newName) return api.sendMessage("💡 Usage: `marry rename <Nouveau Nom d'Alliance>`", threadID, messageID);

            const marriages = storage.getMarriages();
            const coupleData = marriages[userProfile.coupleId];

            const oldName = coupleData.coupleName;
            coupleData.coupleName = newName.slice(0, 50);
            storage.logMarriageEvent(coupleData, "RENAME", `Alliance renommée : ${oldName} ➔ ${coupleData.coupleName}`);
            storage.saveMarriages(marriages);

            return api.sendMessage(`🏷️ Votre alliance a été renommée : **${coupleData.coupleName}** !`, threadID, messageID);
        }

        // =========================================================================
        // 🗓️ SOUS-COMMANDE : MARRY ANNIVERSARY
        // =========================================================================
        if (subCommand === "anniversary") {
            if (!userProfile.isMarried || !userProfile.coupleId) {
                return api.sendMessage("❌ Cette commande nécessite d'être marié(e).", threadID, messageID);
            }

            const marriages = storage.getMarriages();
            const coupleData = marriages[userProfile.coupleId];

            const diffTime = Math.abs(now - coupleData.marriedAt);
            const daysTogether = Math.floor(diffTime / (1000 * 60 * 60 * 24));

            let annMsg = `🗓️ **JALONS TEMPORELS DE L'UNION**\n\n`;
            annMsg += `💍 Date de célébration : **${new Date(coupleData.marriedAt).toLocaleDateString("fr-FR")}**\n`;
            annMsg += `💞 Temps partagé ensemble : **${daysTogether} jours**\n`;
            
            return api.sendMessage(annMsg, threadID, messageID);
        }

        // =========================================================================
        // 📜 SOUS-COMMANDE : MARRY HISTORY
        // =========================================================================
        if (subCommand === "history") {
            if (!userProfile.isMarried || !userProfile.coupleId) {
                return api.sendMessage("❌ Vous n'avez pas de journal historique car vous êtes célibataire.", threadID, messageID);
            }

            const marriages = storage.getMarriages();
            const coupleData = marriages[userProfile.coupleId];

            if (!coupleData.history || coupleData.history.length === 0) {
                return api.sendMessage("📭 Aucun événement historique marquant pour ce couple.", threadID, messageID);
            }

            let histMsg = `📜 **JOURNAL OFFICIEL DE : ${coupleData.coupleName.toUpperCase()}**\n\n`;
            coupleData.history.forEach((h, index) => {
                const dateStr = new Date(h.timestamp).toLocaleDateString("fr-FR");
                histMsg += `${index + 1}. [${dateStr}] [${h.type}] ${h.message}\n`;
            });

            return api.sendMessage(histMsg, threadID, messageID);
        }

        // =========================================================================
        // 👩‍❤️‍👨 SOUS-COMMANDE : MARRY INFO (FICHE TECHNIQUE TEXTE)
        // =========================================================================
        if (subCommand === "info") {
            let targetUID = senderID;

            if (event.type === "message_reply") {
                targetUID = event.messageReply.senderID;
            } else if (Object.keys(event.mentions).length > 0) {
                targetUID = Object.keys(event.mentions)[0];
            } else if (args[1] && !isNaN(args[1])) {
                targetUID = args[1];
            }

            const profiles = storage.getProfiles();
            const tgtProfile = profiles[targetUID] || storage.getUserMarriageProfile(targetUID, `Aventurier #${targetUID.slice(-4)}`);

            if (!tgtProfile.isMarried || !tgtProfile.coupleId) {
                return api.sendMessage(targetUID === senderID ? "❌ Vous êtes actuellement célibataire." : "❌ Cet aventurier n'est pas marié actuellement.", threadID, messageID);
            }

            const marriages = storage.getMarriages();
            const couple = marriages[tgtProfile.coupleId];

            if (!couple) return api.sendMessage("❌ Données du couple introuvables ou corrompues.", threadID, messageID);

            const formatNum = (num) => new Intl.NumberFormat("fr-FR").format(num);
            const daysCount = Math.floor(Math.abs(now - couple.marriedAt) / (1000 * 60 * 60 * 24));

            let infoMsg = `╭───────────────────────────────────────╮\n`;
            infoMsg += `│ 💍 𝐀𝐋𝐋𝐈𝐀𝐍𝐂𝐄 : ${couple.coupleName.toUpperCase()}\n`;
            infoMsg += `├───────────────────────────────────────┤\n`;
            infoMsg += `│ 👤 Partenaire A : **${couple.user1Name}**\n`;
            infoMsg += `│ 👤 Partenaire B : **${couple.user2Name}**\n`;
            infoMsg += `├───────────────────────────────────────┤\n`;
            infoMsg += `│ 📅 Date d'Union : ${new Date(couple.marriedAt).toLocaleDateString("fr-FR")} (${daysCount} jours)\n`;
            infoMsg += `│ ❤️ Niveau d'Amour : **Niv.${couple.loveLevel}** (XP: ${couple.bondXp} / ${couple.bondLevel * 500})\n`;
            infoMsg += `│ 💎 Bague Actuelle : **[ ${couple.ringTier} ]**\n`;
            infoMsg += `│ 🔮 Affinité Mutuelle : **${couple.compatibilityScore}%**\n`;
            infoMsg += `├───────────────────────────────────────┤\n`;
            infoMsg += `│ 💬 Citation : *${couple.quote}*\n`;
            infoMsg += `│ 📝 Bio : _${couple.bio}_\n`;
            infoMsg += `├───────────────────────────────────────┤\n`;
            infoMsg += `│ 🎁 Cadeaux Échangés : ${couple.giftCount} (${formatNum(couple.totalGiftMoney)} Or)\n`;
            infoMsg += `╰───────────────────────────────────────╯`;

            return api.sendMessage(infoMsg, threadID, messageID);
                }

        // =========================================================================
        // 🎁 SOUS-COMMANDE : MARRY GIFT (ÉCONOMIE RELIÉE)
        // =========================================================================
        if (subCommand === "gift") {
            if (!userProfile.isMarried || !userProfile.coupleId) {
                return api.sendMessage("❌ Vous devez être marié(e) pour envoyer des présents à votre conjoint.", threadID, messageID);
            }

            const amount = parseInt(args[1]);
            if (!amount || isNaN(amount) || amount <= 0) {
                return api.sendMessage("💡 Usage: `marry gift <montant>` (Ex: `marry gift 5000`)", threadID, messageID);
            }

            // [SÉCURITÉ ÉCONOMIE GOATBOT]
            // Extraction et vérification de la balance de l'utilisateur depuis l'objet global du bot
            // Si ton système utilise une structure différente (ex: Users.get), ajuste cette ligne.
            const userBalance = global.data ? (global.data.allUserData?.[senderID]?.money || 0) : 0;
            
            if (userBalance < amount) {
                return api.sendMessage(`❌ Fonds insuffisants ! Vous ne possédez pas ${amount} Or dans votre portefeuille.`, threadID, messageID);
            }

            // Déduction de l'argent de l'économie globale si disponible
            if (global.data && global.data.allUserData?.[senderID]) {
                global.data.allUserData[senderID].money -= amount;
            }

            const marriages = storage.getMarriages();
            const coupleData = marriages[userProfile.coupleId];

            // Mise à jour des compteurs relationnels
            coupleData.giftCount += 1;
            coupleData.totalGiftMoney += amount;
            coupleData.stats.totalGiftMoney += amount;
            coupleData.stats.giftsSent += 1;
            coupleData.stats.lovePoints += Math.floor(amount / 100);

            // Attribution d'XP de couple (1 XP par tranche de 10 pièces d'Or offertes)
            const xpGained = Math.floor(amount / 10);
            const leveledUp = storage.addCoupleXp(coupleData, xpGained);

            storage.logMarriageEvent(coupleData, "CADEAU", `${userProfile.name} a offert ${amount} Or à son partenaire (+${xpGained} XP).`);
            storage.saveMarriages(marriages);

            let giftMsg = `🎁 **PRÉSENT ENVOYÉ !** Vous offrez **${amount} Or** à votre moitié.\n`;
            giftMsg += `✨ Votre couple gagne **+${xpGained} XP** de lien et de précieux Points d'Amour !`;
            if (leveledUp) giftMsg += `\n🌟 **LEVEL UP D'ALLIANCE !** Votre couple atteint le **Niveau ${coupleData.bondLevel}** !`;

            return api.sendMessage(giftMsg, threadID, messageID);
        }

        // =========================================================================
        // 💎 SOUS-COMMANDE : MARRY RING (STATUT DE LA BAGUE)
        // =========================================================================
        if (subCommand === "ring") {
            if (!userProfile.isMarried || !userProfile.coupleId) {
                return api.sendMessage("❌ Vous devez posséder une alliance pour inspecter vos joyaux.", threadID, messageID);
            }

            const marriages = storage.getMarriages();
            const coupleData = marriages[userProfile.coupleId];

            let ringDesc = `💍 **STATUT DE L'ANNEAU SACRÉ**\n\n`;
            ringDesc += `Rang de l'Alliance : **[ ${coupleData.ringTier} ]** (Niveau de Lien : ${coupleData.bondLevel})\n\n`;
            ringDesc += `📜 *Les paliers d'évolution se débloquent automatiquement via votre niveau d'amour :*\n`;
            ringDesc += `🔸 Niv.1  ➔ Bronze\n🔸 Niv.5  ➔ Argent\n🔸 Niv.10 ➔ Or\n🔸 Niv.20 ➔ Saphir\n🔸 Niv.35 ➔ Rubis\n🔸 Niv.50 ➔ Mythique`;

            return api.sendMessage(ringDesc, threadID, messageID);
        }

        // =========================================================================
        // 🎁 SOUS-COMMANDE : MARRY DAILY (DOTATION DE FIDÉLITÉ)
        // =========================================================================
        if (subCommand === "daily") {
            if (!userProfile.isMarried || !userProfile.coupleId) {
                return api.sendMessage("❌ Le bonus quotidien de couple requiert d'être marié(e).", threadID, messageID);
            }

            const marriages = storage.getMarriages();
            const coupleData = marriages[userProfile.coupleId];

            if (now - (coupleData.dailyClaim || 0) < 24 * 60 * 60 * 1000) {
                const remain = (24 * 60 * 60 * 1000) - (now - coupleData.dailyClaim);
                const hours = Math.floor(remain / (1000 * 60 * 60));
                return api.sendMessage(`⏳ Votre dotation quotidienne de couple est verrouillée. Réessayez dans ${hours}h.`, threadID, messageID);
            }

            // Attribution des gains
            coupleData.dailyClaim = now;
            coupleData.stats.dailyClaimCount += 1;
            const xpBonus = coupleData.bondLevel * 50;
            const leveledUp = storage.addCoupleXp(coupleData, xpBonus);

            storage.logMarriageEvent(coupleData, "DAILY", `${userProfile.name} a collecté les récompenses quotidiennes de couple.`);
            storage.saveMarriages(marriages);

            let dlyMsg = `🎁 **FIDÉLITÉ DE COUPLE RECONNUE !**\n`;
            dlyMsg += `⭐ Vos vœux quotidiens rapportent **+${xpBonus} XP** à votre alliance.`;
            if (leveledUp) dlyMsg += `\n🌟 **LEVEL UP !** Votre couple progresse au **Niveau ${coupleData.bondLevel}** !`;

            return api.sendMessage(dlyMsg, threadID, messageID);
        }

        // =========================================================================
        // ❤️ SOUS-COMMANDE : MARRY COMPATIBILITY
        // =========================================================================
        if (subCommand === "compatibility") {
            if (!userProfile.isMarried || !userProfile.coupleId) {
                return api.sendMessage("❌ Cette analyse requiert une union active.", threadID, messageID);
            }
            const marriages = storage.getMarriages();
            const coupleData = marriages[userProfile.coupleId];

            return api.sendMessage(`🔮 **ALCHIMIE DES ÂMES :** Le taux d'affinité astrale et émotionnelle entre vous et votre conjoint est évalué à **${coupleData.compatibilityScore}%**.`, threadID, messageID);
        }

        // =========================================================================
        // 🏆 SOUS-COMMANDE : MARRY TOP (CLASSEMENT GLOBAL)
        // =========================================================================
        if (subCommand === "top") {
            const allMarriages = Object.values(storage.getMarriages());
            if (allMarriages.length === 0) return api.sendMessage("📭 Aucune union enregistrée pour le moment.", threadID, messageID);

            allMarriages.sort((a, b) => b.bondLevel - a.bondLevel);

            let topMsg = `╭───────────────────────────────────────╮\n`;
            topMsg += `│ 🏆 𝐏𝐀𝐍𝐓𝐇É𝐎𝐍 𝐃𝐄𝐒 𝐀𝐋𝐋𝐈𝐀𝐍𝐂𝐄𝐒\n`;
            topMsg += `├───────────────────────────────────────┤\n`;
            allMarriages.slice(0, 5).forEach((c, idx) => {
                topMsg += `│ ${idx + 1}. **${c.coupleName}** | Niv. Lvl ${c.bondLevel}\n`;
                topMsg += `│    💍 Anneau : ${c.ringTier} | 💞 Cadeaux : ${c.giftCount}\n`;
                topMsg += `├───────────────────────────────────────┤\n`;
            });
            topMsg += `╰───────────────────────────────────────╯`;
            return api.sendMessage(topMsg, threadID, messageID);
        }

        // =========================================================================
        // 🎨 SOUS-COMMANDE V2 GRAPHISME PREMIUM : MARRY STATS (CANVAS ENGYNE)
        // =========================================================================
        if (subCommand === "stats") {
            if (!userProfile.isMarried || !userProfile.coupleId) {
                return api.sendMessage("❌ Vous devez être marié(e) pour générer votre dashboard graphique.", threadID, messageID);
            }

            const marriages = storage.getMarriages();
            const couple = marriages[userProfile.coupleId];

            // Chargement dynamique de la librairie Node Canvas
            let canvasModule;
            try {
                canvasModule = require("canvas");
            } catch (e) {
                return api.sendMessage("⚠️ Module de rendu graphique non installé sur le serveur. Utilisez `npm install canvas` ou tapez `marry info` pour la version texte.", threadID, messageID);
            }

            const { createCanvas, loadImage } = canvasModule;
            const fs = require("fs");

            // Dimensions exactes demandées (Horizontal Premium Dashboard)
            const width = 1400;
            const height = 850;
            const canvas = createCanvas(width, height);
            const ctx = canvas.getContext("2d");

            // 1️⃣ Création du fond Dégradé Cosmique Néon
            const bgGrad = ctx.createLinearGradient(0, 0, width, height);
            bgGrad.addColorStop(0, "#0b0514"); // Violet profond très sombre
            bgGrad.addColorStop(0.5, "#16071a"); // Nuances sombres intermédiaires
            bgGrad.addColorStop(1, "#280718"); // Rouge/Rose néon tamisé
            ctx.fillStyle = bgGrad;
            ctx.fillRect(0, 0, width, height);

            // Effets de lumière lointaine en arrière-plan (Glow ambiant)
            ctx.fillStyle = "rgba(235, 64, 121, 0.04)";
            ctx.beginPath(); ctx.arc(200, 200, 300, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = "rgba(141, 112, 222, 0.04)";
            ctx.beginPath(); ctx.arc(1200, 650, 400, 0, Math.PI * 2); ctx.fill();

            // 2️⃣ Panneau Principal Central (Coins arrondis et bordure fine)
            ctx.fillStyle = "rgba(18, 11, 26, 0.85)";
            ctx.strokeStyle = "rgba(235, 64, 121, 0.25)";
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.roundRect(60, 60, width - 120, height - 160, 25);
            ctx.fill(); ctx.stroke();

            // 3️⃣ En-tête : Nom du couple et dates majeures
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 46px sans-serif";
            ctx.fillText(couple.coupleName.toUpperCase(), 100, 140);

            const daysCount = Math.floor(Math.abs(now - couple.marriedAt) / (1000 * 60 * 60 * 24));
            ctx.fillStyle = "#eb4079";
            ctx.font = "26px sans-serif";
            ctx.fillText(`✨ Unis depuis le ${new Date(couple.marriedAt).toLocaleDateString("fr-FR")}  •  💞 ${daysCount} Jours Ensemble`, 100, 190);

            // Badge du Rang / Bague (En haut à droite)
            ctx.fillStyle = "#ffd700";
            ctx.font = "bold 32px sans-serif";
            ctx.textAlign = "right";
            ctx.fillText(`👑 ALLIANCE : ${couple.ringTier.toUpperCase()}`, width - 100, 140);
            ctx.textAlign = "left"; // Reset alignement

            // 4️⃣ Blocs d'informations statistiques (Panneaux sub-grid)
            const drawStatBox = (x, y, w, h, title, value) => {
                ctx.fillStyle = "rgba(255, 255, 255, 0.02)";
                ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
                ctx.lineWidth = 1;
                ctx.beginPath(); ctx.roundRect(x, y, w, h, 12); ctx.fill(); ctx.stroke();
                
                ctx.fillStyle = "#8d70de"; ctx.font = "18px sans-serif"; ctx.fillText(title, x + 20, y + 35);
                ctx.fillStyle = "#ffffff"; ctx.font = "bold 28px sans-serif"; ctx.fillText(value, x + 20, y + 80);
            };

            const formatNum = (num) => new Intl.NumberFormat("fr-FR").format(num);

            drawStatBox(100, 480, 270, 110, "NIVEAU D'AMOUR", `Niv. ${couple.loveLevel}`);
            drawStatBox(400, 480, 270, 110, "AFFINITÉ ASTROLE", `${couple.compatibilityScore}%`);
            drawStatBox(700, 480, 270, 110, "PRÉSENTS OFFERTS", `${couple.giftCount} Cadeaux`);
            drawStatBox(1000, 480, 300, 110, "VALEUR DU BUTIN", `${formatNum(couple.totalGiftMoney)} Or`);

            // Zone Citation & Biographie
            ctx.fillStyle = "rgba(235, 64, 121, 0.05)";
            ctx.beginPath(); ctx.roundRect(100, 620, width - 200, 100, 10); ctx.fill();
            ctx.fillStyle = "#ffffff"; ctx.font = "italic 24px sans-serif";
            ctx.fillText(couple.quote, 130, 660);
            ctx.fillStyle = "rgba(255, 255, 255, 0.6)"; ctx.font = "20px sans-serif";
            ctx.fillText(`Bio : ${couple.bio}`, 130, 700);

            // 5️⃣ Barre d'expérience inférieure (Progression)
            const progressY = height - 60;
            ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
            ctx.beginPath(); ctx.roundRect(60, progressY, width - 120, 20, 10); ctx.fill();

            const xpNeeded = couple.bondLevel * 500;
            const pct = Math.min(1, couple.bondXp / xpNeeded);
            ctx.fillStyle = "#eb4079";
            ctx.beginPath(); ctx.roundRect(60, progressY, (width - 120) * pct, 20, 10); ctx.fill();

            ctx.fillStyle = "#ffffff"; ctx.font = "bold 16px sans-serif";
            let statusText = "🔗 UNION SACRÉE MYTHIQUE";
            if (couple.bondLevel < 10) statusText = "🌱 ALLIANCE COMPAGNON NAISSANT";
            else if (couple.bondLevel < 30) statusText = "🔮 ÂMES SŒURS SOUDÉES";
            ctx.fillText(`${statusText}  (${couple.bondXp} / ${xpNeeded} XP)`, 70, progressY - 15);

            // 6️⃣ Traitement sécurisé des Photos de Profil Facebook réelles
            // Utilisation de l'API Graph officielle via le token d'accès fourni par l'utilisateur
            const fbToken = "6628568379%7Cc1e620fa708a1d5696fb991c1bde5662";
            const urlAvatarA = `https://graph.facebook.com/${couple.user1Id}/picture?width=300&access_token=${fbToken}`;
            const urlAvatarB = `https://graph.facebook.com/${couple.user2Id}/picture?width=300&access_token=${fbToken}`;

            const drawAvatar = async (url, x, y, size, name) => {
                try {
                    const img = await loadImage(url);
                    ctx.save();
                    ctx.beginPath(); ctx.arc(x + size/2, y + size/2, size/2, 0, Math.PI * 2); ctx.clip();
                    ctx.drawImage(img, x, y, size, size);
                    ctx.restore();
                } catch (e) {
                    // Fallback graphique premium en cas d'échec de chargement réseau
                    ctx.fillStyle = "#8d70de";
                    ctx.beginPath(); ctx.arc(x + size/2, y + size/2, size/2, 0, Math.PI * 2); ctx.fill();
                }
                // Écriture du nom sous l'avatar
                ctx.fillStyle = "#ffffff"; ctx.font = "bold 26px sans-serif";
                ctx.fillText(name, x + 10, y + size + 40);
            };

            // Exécution asynchrone parallèle des deux avatars pour des performances maximales
            await Promise.all([
                drawAvatar(urlAvatarA, 300, 240, 160, couple.user1Name),
                drawAvatar(urlAvatarB, 900, 240, 160, couple.user2Name)
            ]);

            // Lien visuel entre les deux avatars (Icône de cœur central)
            ctx.fillStyle = "#eb4079"; ctx.font = "60px sans-serif";
            ctx.fillText("❤️", 665, 330);

            // 7️⃣ Sauvegarde atomique du fichier tampon et transmission
            const tmpPath = path.join(__dirname, `marry_stats_${senderID}.png`);
            const out = fs.createWriteStream(tmpPath);
            const stream = canvas.createPNGStream();
            stream.pipe(out);

            out.on("finish", () => {
                api.sendMessage({
                    body: `📊 **DASHBOARD RELATIONNEL V2**\nVoici la carte de fidélité de votre alliance !`,
                    attachment: fs.createReadStream(tmpPath)
                }, threadID, () => {
                    try { fs.unlinkSync(tmpPath); } catch (err) {} // Nettoyage immédiat du cache disque après envoi
                }, messageID);
            });
            return;
        }

        return api.sendMessage("❌ Sous-commande introuvable. Tapez `marry` pour afficher la grille des modules.", threadID, messageID);
    }
};
