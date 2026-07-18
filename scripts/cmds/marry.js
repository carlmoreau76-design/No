/** * 💍 SYSTEME MARRIAGE V2 PREMIUM - PRO CONFIG * Version : 2.5.0 * Architecture : Mentions invisibles, Clean Text & Canvas Pro */
const path = require("path");
const fs = require("fs");
const storage = require("./MMORPG_System/mariageSystem/marry.storage.js");

module.exports = {
    config: {
        name: "marry",
        version: "2.5.0",
        author: "Premium Social Engine",
        countDown: 3,
        role: 0,
        description: "Système de mariage premium : Unissez vos destins, partagez un profil et gérez vos statistiques de couple !",
        category: "system"
    },

    onStart: async function ({ api, event, args }) {
        const { threadID, messageID, senderID } = event;
        const now = Date.now();
        
        // Récupération du nom de l'appelant via l'API ou le stockage
        let senderName = event.senderName || "Utilisateur";
        if (senderName.startsWith("Aventurier #")) senderName = "Utilisateur";
        
        const userProfile = storage.getUserMarriageProfile(senderID, senderName);
        const subCommand = args[0] ? args[0].toLowerCase() : null;

        // =========================================================================
        // 🧾 MENU PRINCIPAL DES COMMANDES
        // =========================================================================
        if (!subCommand) {
            let menu = `╭───────────────────────────────────────╮\n`;
            menu += `│ 💍 𝐒𝐘𝐒𝐓È𝐌𝐄 𝐌𝐀𝐑𝐈𝐀𝐆𝐄 𝐏𝐑𝐎\n`;
            menu += `├───────────────────────────────────────┤\n`;
            menu += `│ 💌 **Gestion de l'Union**\n`;
            menu += `│ 🔹 marry propose [mention/uid] : Demander une main\n`;
            menu += `│ 🔹 marry accept                : Accepter l'union active\n`;
            menu += `│ 🔹 marry refuse                : Rejeter la proposition\n`;
            menu += `│ 🔹 marry divorce               : Dissoudre le lien sacré\n`;
            menu += `├───────────────────────────────────────┤\n`;
            menu += `│ 👩‍❤️‍👨 **Profil & Expression**\n`;
            menu += `│ 🔹 marry info [mention/uid]    : Fiche de couple textuelle\n`;
            menu += `│ 🔹 marry stats                 : Dashboard Graphique Pro\n`;
            menu += `│ 🔹 marry bio <texte>           : Mettre à jour la biographie\n`;
            menu += `│ 🔹 marry quote <texte>         : Définir une citation\n`;
            menu += `│ 🔹 marry rename <nom>          : Renommer votre alliance\n`;
            menu += `├───────────────────────────────────────┤\n`;
            menu += `│ 🎁 **Interactions & Gains**\n`;
            menu += `│ 🔹 marry daily                 : Récompense de fidélité\n`;
            menu += `│ 🔹 marry gift <montant>        : Offrir un présent monétaire\n`;
            menu += `│ 🔹 marry ring                  : Statut de la bague sacrée\n`;
            menu += `│ 🔹 marry compatibility         : Afficher l'affinité\n`;
            menu += `│ 🔹 marry top                   : Classement des âmes sœurs\n`;
            menu += `│ 🔹 marry anniversary           : Décompte des jours passés\n`;
            menu += `│ 🔹 marry history               : Journal d'évolution\n`;
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
            if (event.type === "message_reply") {
                targetID = event.messageReply.senderID;
            } else if (Object.keys(event.mentions).length > 0) {
                targetID = Object.keys(event.mentions)[0];
            } else if (args[1] && !isNaN(args[1])) {
                targetID = args[1];
            }

            if (!targetID) {
                return api.sendMessage("💡 Usage: Répondez à un message, mentionnez un utilisateur ou fournissez son UID.", threadID, messageID);
            }

            if (targetID === senderID) {
                return api.sendMessage("❌ Vous ne pouvez pas vous épouser vous-même.", threadID, messageID);
            }

            let targetName = event.mentions[targetID] ? event.mentions[targetID].replace("@", "") : "Utilisateur";
            if (targetName.startsWith("Aventurier #")) targetName = "Utilisateur";
            
            const targetProfile = storage.getUserMarriageProfile(targetID, targetName);

            if (targetProfile.isMarried) {
                return api.sendMessage(`❌ Cette personne est déjà mariée avec un autre utilisateur.`, threadID, messageID);
            }

            storage.createProposal(senderID, targetID, {
                senderName: userProfile.name,
                targetName: targetProfile.name
            });

            // Construction du tag sans @ via l'objet mentions
            let propMsg = `${userProfile.name} souhaite officiellement s'unir à vous, ${targetProfile.name}.\n\n`;
            propMsg += `👉 Pour sceller cette alliance, répondez avec :\n`;
            propMsg += `✅ marry accept pour dire Oui.\n`;
            propMsg += `❌ marry refuse pour rejeter la proposition.`;

            return api.sendMessage({
                body: propMsg,
                mentions: [
                    { tag: userProfile.name, id: senderID },
                    { tag: targetProfile.name, id: targetID }
                ]
            }, threadID, messageID);
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

            const coupleData = storage.createMarriage(requesterProfile, userProfile);
            storage.removeProposal(senderID);

            let acceptMsg = `🎉 Les cloches sonnent ! ${requesterProfile.name} et ${userProfile.name} se sont dit "Oui" !\n`;
            acceptMsg += `✨ Leur destin est lié sous l'alliance : ${coupleData.coupleName}.`;

            return api.sendMessage({
                body: acceptMsg,
                mentions: [
                    { tag: requesterProfile.name, id: requesterProfile.id || activeProposal.fromId },
                    { tag: userProfile.name, id: senderID }
                ]
            }, threadID, messageID);
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
            
            return api.sendMessage({
                body: `💔 Vous avez décliné la demande en mariage de ${activeProposal.senderName}.`,
                mentions: [{ tag: activeProposal.senderName, id: activeProposal.fromId }]
            }, threadID, messageID);
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
                return api.sendMessage("🔧 Votre statut défaillant a été réinitialisé à célibataire.", threadID, messageID);
            }

            const partnerId = senderID === coupleData.user1Id ? coupleData.user2Id : coupleData.user1Id;
            const partnerName = senderID === coupleData.user1Id ? coupleData.user2Name : coupleData.user1Name;

            storage.removeMarriage(userProfile.coupleId);

            let divMsg = `💔 L'alliance unissant ${userProfile.name} et ${partnerName} a été brisée.\n`;
            divMsg += `⚖️ Le nom de couple ${coupleData.coupleName} est effacé des registres.`;

            return api.sendMessage({
                body: divMsg,
                mentions: [
                    { tag: userProfile.name, id: senderID },
                    { tag: partnerName, id: partnerId }
                ]
            }, threadID, messageID);
        }

        // =========================================================================
        // 📝 SOUS-COMMANDES TEXTUELLES DE GESTION (BIO, QUOTE, RENAME)
        // =========================================================================
        if (subCommand === "bio") {
            if (!userProfile.isMarried || !userProfile.coupleId) return api.sendMessage("❌ Vous devez être marié(e).", threadID, messageID);
            const text = args.slice(1).join(" ");
            if (!text) return api.sendMessage("💡 Usage: `marry bio <votre texte>`", threadID, messageID);

            const marriages = storage.getMarriages();
            const coupleData = marriages[userProfile.coupleId];
            coupleData.bio = text.slice(0, 200); 
            storage.logMarriageEvent(coupleData, "BIO", `Modifié par ${userProfile.name}`);
            storage.saveMarriages(marriages);
            return api.sendMessage("📝 Biographie mise à jour !", threadID, messageID);
        }

        if (subCommand === "quote") {
            if (!userProfile.isMarried || !userProfile.coupleId) return api.sendMessage("❌ Vous devez être marié(e).", threadID, messageID);
            const text = args.slice(1).join(" ");
            if (!text) return api.sendMessage("💡 Usage: `marry quote <votre citation>`", threadID, messageID);

            const marriages = storage.getMarriages();
            const coupleData = marriages[userProfile.coupleId];
            coupleData.quote = `« ${text.slice(0, 80)} »`; 
            storage.logMarriageEvent(coupleData, "CITATION", `Mis à jour par ${userProfile.name}`);
            storage.saveMarriages(marriages);
            return api.sendMessage("💬 Nouvelle citation enregistrée !", threadID, messageID);
        }

        if (subCommand === "rename") {
            if (!userProfile.isMarried || !userProfile.coupleId) return api.sendMessage("❌ Vous devez posséder une alliance.", threadID, messageID);
            const newName = args.slice(1).join(" ");
            if (!newName) return api.sendMessage("💡 Usage: `marry rename <Nouveau Nom>`", threadID, messageID);

            const marriages = storage.getMarriages();
            const coupleData = marriages[userProfile.coupleId];
            coupleData.coupleName = newName.slice(0, 50);
            storage.logMarriageEvent(coupleData, "RENAME", `Nouveau nom : ${coupleData.coupleName}`);
            storage.saveMarriages(marriages);
            return api.sendMessage(`🏷️ Alliance renommée : **${coupleData.coupleName}** !`, threadID, messageID);
        }

        // =========================================================================
        // 🗓️ SOUS-COMMANDE : ANNIVERSARY, HISTORY, COMPATIBILITY, RING, DAILY, TOP
        // =========================================================================
        if (subCommand === "anniversary") {
            if (!userProfile.isMarried || !userProfile.coupleId) return api.sendMessage("❌ Non marié(e).", threadID, messageID);
            const marriages = storage.getMarriages();
            const coupleData = marriages[userProfile.coupleId];
            const daysTogether = Math.floor(Math.abs(now - coupleData.marriedAt) / (1000 * 60 * 60 * 24));
            
            return api.sendMessage(`🗓️ **UNION**\n💍 Date : ${new Date(coupleData.marriedAt).toLocaleDateString("fr-FR")}\n💞 Partage : ${daysTogether} jours`, threadID, messageID);
        }

        if (subCommand === "history") {
            if (!userProfile.isMarried || !userProfile.coupleId) return api.sendMessage("❌ Non marié(e).", threadID, messageID);
            const marriages = storage.getMarriages();
            const coupleData = marriages[userProfile.coupleId];
            if (!coupleData.history || coupleData.history.length === 0) return api.sendMessage("📭 Aucun historique.", threadID, messageID);

            let histMsg = `📜 **JOURNAL : ${coupleData.coupleName.toUpperCase()}**\n\n`;
            coupleData.history.forEach((h, index) => {
                histMsg += `${index + 1}. [${new Date(h.timestamp).toLocaleDateString("fr-FR")}] ${h.message}\n`;
            });
            return api.sendMessage(histMsg, threadID, messageID);
        }

        if (subCommand === "compatibility") {
            if (!userProfile.isMarried || !userProfile.coupleId) return api.sendMessage("❌ Non marié(e).", threadID, messageID);
            const coupleData = storage.getMarriages()[userProfile.coupleId];
            return api.sendMessage(`🔮 Affinité évaluée à **${coupleData.compatibilityScore}%**.`, threadID, messageID);
        }

        if (subCommand === "ring") {
            if (!userProfile.isMarried || !userProfile.coupleId) return api.sendMessage("❌ Non marié(e).", threadID, messageID);
            const coupleData = storage.getMarriages()[userProfile.coupleId];
            return api.sendMessage(`💍 **ANNEAU**\nRang : [ ${coupleData.ringTier} ] (Lvl : ${coupleData.bondLevel})`, threadID, messageID);
        }

        if (subCommand === "daily") {
            if (!userProfile.isMarried || !userProfile.coupleId) return api.sendMessage("❌ Non marié(e).", threadID, messageID);
            const marriages = storage.getMarriages();
            const coupleData = marriages[userProfile.coupleId];

            if (now - (coupleData.dailyClaim || 0) < 24 * 60 * 60 * 1000) {
                const remain = (24 * 60 * 60 * 1000) - (now - coupleData.dailyClaim);
                return api.sendMessage(`⏳ Déjà collecté. Réessayez dans ${Math.floor(remain / (1000 * 60 * 60))}h.`, threadID, messageID);
            }

            coupleData.dailyClaim = now;
            const xpBonus = coupleData.bondLevel * 50;
            const leveledUp = storage.addCoupleXp(coupleData, xpBonus);
            storage.saveMarriages(marriages);

            let dlyMsg = `🎁 Bonus récupéré !\n⭐ **+${xpBonus} XP** accordés à votre alliance.`;
            if (leveledUp) dlyMsg += `\n🌟 **LEVEL UP !** Niveau ${coupleData.bondLevel} atteint !`;
            return api.sendMessage(dlyMsg, threadID, messageID);
        }

        if (subCommand === "gift") {
            if (!userProfile.isMarried || !userProfile.coupleId) return api.sendMessage("❌ Non marié(e).", threadID, messageID);
            const amount = parseInt(args[1]);
            if (!amount || isNaN(amount) || amount <= 0) return api.sendMessage("💡 Usage: `marry gift <montant>`", threadID, messageID);

            const userBalance = global.data ? (global.data.allUserData?.[senderID]?.money || 0) : 0;
            if (userBalance < amount) return api.sendMessage(`❌ Or insuffisant (${userBalance} possédés).`, threadID, messageID);

            if (global.data && global.data.allUserData?.[senderID]) global.data.allUserData[senderID].money -= amount;

            const marriages = storage.getMarriages();
            const coupleData = marriages[userProfile.coupleId];
            coupleData.giftCount += 1;
            coupleData.totalGiftMoney += amount;

            const xpGained = Math.floor(amount / 10);
            const leveledUp = storage.addCoupleXp(coupleData, xpGained);
            storage.saveMarriages(marriages);

            let giftMsg = `🎁 Cadeau de **${amount} Or** envoyé !\n✨ **+${xpGained} XP** ajoutés.`;
            if (leveledUp) giftMsg += `\n🌟 **LEVEL UP !** Niveau ${coupleData.bondLevel} atteint !`;
            return api.sendMessage(giftMsg, threadID, messageID);
        }

        if (subCommand === "top") {
            const allMarriages = Object.values(storage.getMarriages());
            if (allMarriages.length === 0) return api.sendMessage("📭 Aucune alliance active.", threadID, messageID);
            
            allMarriages.sort((a, b) => b.bondLevel - a.bondLevel);
            let topMsg = `🏆 **PANTHÉON DES ALLIANCES PRO**\n\n`;
            allMarriages.slice(0, 5).forEach((c, idx) => {
                topMsg += `${idx + 1}. ${c.coupleName} | Lvl ${c.bondLevel} (Bague: ${c.ringTier})\n`;
            });
            return api.sendMessage(topMsg, threadID, messageID);
        }

        if (subCommand === "info") {
            let targetUID = senderID;
            if (event.type === "message_reply") targetUID = event.messageReply.senderID;
            else if (Object.keys(event.mentions).length > 0) targetUID = Object.keys(event.mentions)[0];
            else if (args[1] && !isNaN(args[1])) targetUID = args[1];

            const profiles = storage.getProfiles();
            const tgtProfile = profiles[targetUID] || storage.getUserMarriageProfile(targetUID, "Utilisateur");

            if (!tgtProfile.isMarried || !tgtProfile.coupleId) return api.sendMessage("❌ Profil non marié.", threadID, messageID);
            const couple = storage.getMarriages()[tgtProfile.coupleId];
            
            const daysCount = Math.floor(Math.abs(now - couple.marriedAt) / (1000 * 60 * 60 * 24));
            let infoMsg = `💍 **ALLIANCE : ${couple.coupleName.toUpperCase()}**\n`;
            infoMsg += `👥 Partenaires : ${couple.user1Name} & ${couple.user2Name}\n`;
            infoMsg += `📅 Durée : ${daysCount} jours\n`;
            infoMsg += `❤️ Niveau : ${couple.loveLevel} (Lvl ${couple.bondLevel})\n`;
            infoMsg += `💎 Anneau : ${couple.ringTier}\n`;
            infoMsg += `💬 "${couple.quote}"`;
            return api.sendMessage(infoMsg, threadID, messageID);
        }

        // =========================================================================
        // 🎨 SOUS-COMMANDE : MARRY STATS (CANVAS ULTRA PRO)
        // =========================================================================
        if (subCommand === "stats") {
            if (!userProfile.isMarried || !userProfile.coupleId) {
                return api.sendMessage("❌ Vous devez être marié(e) pour générer votre dashboard.", threadID, messageID);
            }
            const marriages = storage.getMarriages();
            const couple = marriages[userProfile.coupleId];

            let canvasModule;
            try {
                canvasModule = require("canvas");
            } catch (e) {
                return api.sendMessage("⚠️ Module canvas absent sur le serveur. Utilisez `marry info` pour la version texte.", threadID, messageID);
            }

            const { createCanvas, loadImage } = canvasModule;

            // Dimensions Pro (Dashboard Ultra Clean)
            const width = 1400;
            const height = 850;
            const canvas = createCanvas(width, height);
            const ctx = canvas.getContext("2d");

            // Arrière-plan sombre & minimaliste style Count Pro
            ctx.fillStyle = "#0c0d14";
            ctx.fillRect(0, 0, width, height);

            // Subtiles lueurs géométriques d'arrière-plan
            ctx.fillStyle = "rgba(235, 64, 121, 0.03)";
            ctx.beginPath(); ctx.arc(150, 150, 400, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = "rgba(141, 112, 222, 0.03)";
            ctx.beginPath(); ctx.arc(1250, 700, 450, 0, Math.PI * 2); ctx.fill();

            // Structure Conteneur Principal Arrondi
            ctx.fillStyle = "#12131f";
            ctx.strokeStyle = "#1e2035";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(50, 50, width - 100, height - 100, 20);
            ctx.fill(); ctx.stroke();

            // Ligne de Séparation Haute (Header)
            ctx.strokeStyle = "#1e2035";
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(50, 180); ctx.lineTo(width - 50, 180); ctx.stroke();

            // --- HEADER ---
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 42px sans-serif";
            ctx.fillText(couple.coupleName.toUpperCase(), 90, 115);

            const daysCount = Math.floor(Math.abs(now - couple.marriedAt) / (1000 * 60 * 60 * 24));
            ctx.fillStyle = "#6c7293";
            ctx.font = "20px sans-serif";
            ctx.fillText(`UNION CÉLÉBRÉE LE ${new Date(couple.marriedAt).toLocaleDateString("fr-FR")}  |  DURÉE : ${daysCount} JOURS`, 90, 150);

            // Badge de droite (Ring Tier)
            ctx.fillStyle = "#ffb86c";
            ctx.font = "bold 24px sans-serif";
            ctx.textAlign = "right";
            ctx.fillText(`ANNEAU : ${couple.ringTier.toUpperCase()}`, width - 90, 125);
            ctx.textAlign = "left";

            // --- GRILLE DE STATISTIQUES (Belles boîtes séparées sans chevauchement) ---
            const drawStatBox = (x, y, w, h, label, value) => {
                ctx.fillStyle = "#181a26";
                ctx.strokeStyle = "#222538";
                ctx.lineWidth = 1;
                ctx.beginPath(); ctx.roundRect(x, y, w, h, 12); ctx.fill(); ctx.stroke();
                
                // Label
                ctx.fillStyle = "#6c7293"; ctx.font = "15px sans-serif"; ctx.fillText(label, x + 25, y + 35);
                // Valeur
                ctx.fillStyle = "#ffffff"; ctx.font = "bold 26px sans-serif"; ctx.fillText(value, x + 25, y + 78);
            };

            const formatNum = (num) => new Intl.NumberFormat("fr-FR").format(num);
            
            // Ligne de boîtes bien espacées horizontalement (Y = 480)
            drawStatBox(90, 480, 280, 110, "NIVEAU ACTUEL", `Niv. ${couple.loveLevel}`);
            drawStatBox(400, 480, 280, 110, "COMPATIBILITÉ", `${couple.compatibilityScore} %`);
            drawStatBox(710, 480, 280, 110, "CADEAUX TRANSMIS", `${couple.giftCount} Objets`);
            drawStatBox(1020, 480, 290, 110, "VALEUR ESTIMÉE", `${formatNum(couple.totalGiftMoney)} Or`);

            // --- BLOC TEXTE PRINCIPAL (CITATION & BIO SEPARÉES DÉCORÉES) ---
            ctx.fillStyle = "#161724";
            ctx.beginPath(); ctx.roundRect(90, 620, width - 180, 110, 12); ctx.fill();

            ctx.fillStyle = "#ff79c6"; ctx.font = "italic 22px sans-serif";
            ctx.fillText(couple.quote || "« Aucun message défini »", 120, 665);

            ctx.fillStyle = "#8be9fd"; ctx.font = "18px sans-serif";
            ctx.fillText(`Bio : ${couple.bio || "Non renseignée"}`, 120, 705);

            // --- BARRE DE PROGRESSION INFÉRIEURE (XP) ---
            const progressY = height - 85;
            ctx.fillStyle = "#222538";
            ctx.beginPath(); ctx.roundRect(90, progressY, width - 180, 14, 7); ctx.fill();

            const xpNeeded = couple.bondLevel * 500;
            const pct = Math.min(1, couple.bondXp / xpNeeded);
            
            ctx.fillStyle = "#ff79c6";
            ctx.beginPath(); ctx.roundRect(90, progressY, (width - 180) * pct, 14, 7); ctx.fill();

            ctx.fillStyle = "#ffffff"; ctx.font = "bold 15px sans-serif";
            let statusText = couple.bondLevel < 10 ? "ALLIANCE INITIALE" : (couple.bondLevel < 30 ? "ÂMES SŒURS SOUDÉES" : "UNION MYTHIQUE");
            ctx.fillText(`${statusText}  •  ${couple.bondXp} / ${xpNeeded} XP`, 90, progressY - 15);

            // --- CHARGEMENT DES COMPOSANTS GRAPHES FACEBOOK ---
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
                    ctx.fillStyle = "#bd93f9";
                    ctx.beginPath(); ctx.arc(x + size/2, y + size/2, size/2, 0, Math.PI * 2); ctx.fill();
                }
                
                // Écriture du nom parfaitement calibré sous l'avatar
                ctx.fillStyle = "#ffffff"; 
                ctx.font = "bold 24px sans-serif";
                ctx.textAlign = "center";
                ctx.fillText(name, x + size/2, y + size + 45);
                ctx.textAlign = "left"; // reset
            };

            // Rendu parallèle des avatars
            await Promise.all([
                drawAvatar(urlAvatarA, 320, 230, 170, couple.user1Name),
                drawAvatar(urlAvatarB, 910, 230, 170, couple.user2Name)
            ]);

            // Cœur de liaison épuré au centre parfait des deux images
            ctx.fillStyle = "#ff5555"; 
            ctx.font = "55px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText("❤️", 700, 335);
            ctx.textAlign = "left";

            // --- SAUVEGARDE ET LIVRAISON DU CANVAS ---
            const tmpPath = path.join(__dirname, `marry_stats_${senderID}.png`);
            const out = fs.createWriteStream(tmpPath);
            const stream = canvas.createPNGStream();
            stream.pipe(out);

            out.on("finish", () => {
                api.sendMessage({
                    body: `📊 **DASHBOARD RELATIONNEL PRO**\nVoici la carte certifiée de votre alliance !`,
                    attachment: fs.createReadStream(tmpPath)
                }, threadID, () => {
                    try { fs.unlinkSync(tmpPath); } catch (err) {}
                }, messageID);
            });
            return;
        }

        return api.sendMessage("❌ Sous-commande introuvable. Tapez `marry` pour afficher la grille des modules.", threadID, messageID);
    }
};
