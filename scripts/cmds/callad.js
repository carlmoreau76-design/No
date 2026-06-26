const { getStreamsFromAttachment } = global.utils;
const { createCanvas, loadImage } = require('canvas');
const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');

const mediaTypes = ["photo", "png", "animated_image", "video", "audio"];
const TARGET_GROUP_ID = "1290457223176689"; 

// Fonction pour récupérer les avatars (Utilisateur ou Groupe)
async function getAvatarBuffer(id, type = "user") {
    try {
        const url = type === "user" 
            ? `https://graph.facebook.com/${id}/picture?width=500&height=500&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`
            : `https://graph.facebook.com/${id}/picture?type=large`;
            
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        return Buffer.from(response.data, 'binary');
    } catch (e) {
        const fallbackCanvas = createCanvas(200, 200);
        const fCtx = fallbackCanvas.getContext('2d');
        fCtx.fillStyle = '#f43f5e';
        fCtx.fillRect(0, 0, 200, 200);
        return fallbackCanvas.toBuffer();
    }
}

// Canvas Style Hori
async function createCustomCanvas(title, subText, mainContent, senderID, isGroup, threadID) {
    const width = 1000;
    const height = 580;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    try {
        // Fond principal Hori Kyoko réutilisé de façon optimisée
        const background = await loadImage("https://i.imgur.com/pUCStOk.jpeg");
        
        const imgRatio = background.width / background.height;
        const canvasRatio = width / height;
        let renderWidth, renderHeight, xOffset, yOffset;

        if (imgRatio > canvasRatio) {
            renderHeight = height;
            renderWidth = background.width * (height / background.height);
            xOffset = (width - renderWidth) / 2;
            yOffset = 0;
        } else {
            renderWidth = width;
            renderHeight = background.height * (width / background.width);
            xOffset = 0;
            yOffset = (height - renderHeight) / 2;
        }
        ctx.drawImage(background, xOffset, yOffset, renderWidth, renderHeight);
    } catch (e) {
        ctx.fillStyle = '#1a0f1e';
        ctx.fillRect(0, 0, width, height);
    }

    // Overlay d'assombrissement fluide
    ctx.fillStyle = "rgba(15, 10, 22, 0.72)";
    ctx.fillRect(0, 0, width, height);

    // Boîte centrale effet Glassmorphic
    const boxX = 50;
    const boxY = 40;
    const boxWidth = 900;
    const boxHeight = 500;
    const radius = 20;

    ctx.save();
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(boxX, boxY, boxWidth, boxHeight, radius) : ctx.rect(boxX, boxY, boxWidth, boxHeight);
    ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
    ctx.fill();
    ctx.strokeStyle = "rgba(244, 63, 94, 0.35)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    // Insertion Avatar de gauche (Expéditeur)
    try {
        const avatarBuffer = await getAvatarBuffer(senderID, "user");
        const img = await loadImage(avatarBuffer);
        ctx.save();
        ctx.beginPath();
        ctx.arc(140, 140, 55, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(img, 85, 85, 110, 110);
        ctx.restore();

        ctx.strokeStyle = '#f43f5e';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(140, 140, 55, 0, Math.PI * 2, true);
        ctx.stroke();
    } catch (_) {}

    // Si c'est un groupe, insertion de l'avatar du Groupe à droite
    if (isGroup && threadID) {
        try {
            const groupBuffer = await getAvatarBuffer(threadID, "group");
            const gImg = await loadImage(groupBuffer);
            ctx.save();
            ctx.beginPath();
            ctx.arc(width - 140, 140, 55, 0, Math.PI * 2, true);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(gImg, width - 195, 85, 110, 110);
            ctx.restore();

            ctx.strokeStyle = '#fb923c';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(width - 140, 140, 55, 0, Math.PI * 2, true);
            ctx.stroke();
        } catch (_) {}
    }

    // Titres & En-tête
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    
    const titleGrad = ctx.createLinearGradient(220, 0, 600, 0);
    titleGrad.addColorStop(0, "#f43f5e");
    titleGrad.addColorStop(1, "#fb923c");

    ctx.fillStyle = titleGrad;
    ctx.font = 'bold 36px Arial';
    ctx.fillText(title, 220, 115);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = 'italic 20px Arial';
    ctx.fillText(subText, 220, 160);

    // Séparateur horizontal
    ctx.strokeStyle = 'rgba(244, 63, 94, 0.2)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(80, 220);
    ctx.lineTo(width - 80, 220);
    ctx.stroke();

    // Contenu du message
    ctx.fillStyle = '#ffffff';
    ctx.font = '24px Arial';
    ctx.textBaseline = 'top';
    
    const words = mainContent.split(' ');
    let line = '';
    let x = 90;
    let y = 260;
    const maxWidth = 820;
    const lineHeight = 40;

    for (let n = 0; n < words.length; n++) {
        let testLine = line + words[n] + ' ';
        let metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && n > 0) {
            ctx.fillText(line, x, y);
            line = words[n] + ' ';
            y += lineHeight;
        } else {
            line = testLine;
        }
    }
    ctx.fillText(line, x, y);

    // Footer de marque de la carte
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(244, 63, 94, 0.8)';
    ctx.font = 'bold 14px Arial';
    ctx.fillText('🌸 HORI ASSISTANT NETWORK OPERATOR 🌸', width / 2, height - 65);

    const cacheDir = path.join(__dirname, 'cache');
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

    const cachePath = path.join(cacheDir, `hori_call_${Date.now()}.png`);
    fs.writeFileSync(cachePath, canvas.toBuffer('image/png'));
    
    return cachePath;
}

module.exports = {
    config: {
        name: "callad",
        version: "4.0.0",
        author: "Shade × Gemini",
        countDown: 5,
        role: 0,
        description: { fr: "Envoyer un rapport stylisé Hori directement aux administrateurs." },
        category: "contacts admin",
        guide: { fr: "{pn} <votre message>" }
    },

    langs: {
        fr: {
            missingMessage: "🌸 Veuillez entrer le message que vous souhaitez transmettre.",
            sendByGroup: "\n» Groupe émetteur : %1\n» ID Groupe : %2",
            sendByUser: "\n» Envoyé depuis les messages privés",
            content: "\n\n━━━━━━━━━━━━━━━━━━━━━━\n📬 **MESSAGE ENTRANT** :\n%1\n━━━━━━━━━━━━━━━━━━━━━━\n\n💡 _Répondez directement à ce message pour lui renvoyer votre décision._",
            success: "✨ Votre message a été transmis avec succès au réseau d'administration !",
            failed: "❌ Une erreur est survenue lors de la transmission du signal.",
            reply: "✨ 🌸 **[ NOTIFICATION DE L'ADMINISTREUR ]** 🌸 ✨\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n💬 **L'administrateur %1 vous répond :**\n\n%2\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n💡 _Vous pouvez répondre à ce message pour continuer l'échange._",
            replySuccess: "✨ Votre décision a été transmise avec succès à l'utilisateur !",
            feedback: "✨ 🌸 **[ NOUVEAU RETOUR UTILISATEUR ]** 🌸 ✨\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n» **De :** %1\n» **ID :** %2%3\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n📬 **Contenu :**\n%4",
            replyUserSuccess: "✨ Message utilisateur actualisé sur le terminal de l'admin."
        }
    },

    onStart: async function ({ args, message, event, usersData, threadsData, api, commandName, getLang }) {
        try {
            if (!args[0]) return message.reply(getLang("missingMessage"));
            const { senderID, threadID, isGroup } = event;
            
            const senderName = await usersData.getName(senderID);
            const locationText = isGroup ? getLang("sendByGroup", (await threadsData.get(threadID)).threadName, threadID) : getLang("sendByUser");
            const mainMsg = args.join(" ");

            // Génération du Canvas Style Hori (Incorpore profil utilisateur + groupe)
            const canvasImagePath = await createCustomCanvas("📬 SIGNAL ENTRANT", `Émis par : ${senderName}`, mainMsg, senderID, isGroup, threadID);

            const msg = "✨ 🌸 **[ SYSTEM CALL AD ]** 🌸 ✨"
                + `\n» Utilisateur : ${senderName}`
                + `\n» ID Unique : ${senderID}`
                + locationText;

            const attachments = await getStreamsFromAttachment(
                [...event.attachments, ...(event.messageReply?.attachments || [])].filter(item => mediaTypes.includes(item.type))
            );
            if (fs.existsSync(canvasImagePath)) attachments.push(fs.createReadStream(canvasImagePath));

            const formMessage = {
                body: msg + getLang("content", mainMsg),
                mentions: [{ id: senderID, tag: senderName }],
                attachment: attachments
            };

            try {
                const messageSend = await api.sendMessage(formMessage, TARGET_GROUP_ID);
                global.GoatBot.onReply.set(messageSend.messageID, {
                    commandName,
                    messageID: messageSend.messageID,
                    threadID,
                    messageIDSender: event.messageID,
                    type: "userCallAdmin"
                });
                setTimeout(() => { try { fs.unlinkSync(canvasImagePath); } catch(_) {} }, 5000);
                return message.reply(getLang("success"));
            } catch (err) {
                setTimeout(() => { try { fs.unlinkSync(canvasImagePath); } catch(_) {} }, 5000);
                return message.reply(getLang("failed"));
            }
        } catch (error) {
            return message.reply("❌ Une erreur interne est survenue sur le serveur.");
        }
    },

    onReply: async ({ args, event, api, message, Reply, usersData, commandName, getLang }) => {
        try {
            const { type, threadID, messageIDSender } = Reply;
            const senderName = await usersData.getName(event.senderID);
            const { isGroup, senderID } = event;
            const replyMsg = args.join(" ");

            // 🛡️ SÉCURITÉ DE VÉRIFICATION : Seuls les admins du bot peuvent répondre aux messages d'alerte
            const { config } = global.GoatBot;
            const isBotAdmin = config.adminBot.includes(senderID);

            switch (type) {
                case "userCallAdmin": {
                    // Si l'utilisateur qui répond n'est PAS un admin du bot, on rejette l'appel
                    if (!isBotAdmin) {
                        return api.sendMessage("⛔ Accès refusé : Seuls les administrateurs officiels du système peuvent répondre à cette alerte.", event.threadID, event.messageID);
                    }

                    const canvasImagePath = await createCustomCanvas("⌖ RÉPONSE ADMIN", `Validé par : ${senderName}`, replyMsg, event.senderID, isGroup, event.threadID);
                    const attachments = await getStreamsFromAttachment(event.attachments.filter(item => mediaTypes.includes(item.type)));
                    if (fs.existsSync(canvasImagePath)) attachments.push(fs.createReadStream(canvasImagePath));

                    const formMessage = {
                        body: getLang("reply", senderName, replyMsg),
                        mentions: [{ id: event.senderID, tag: senderName }],
                        attachment: attachments
                    };

                    api.sendMessage(formMessage, threadID, (err, info) => {
                        setTimeout(() => { try { fs.unlinkSync(canvasImagePath); } catch(_) {} }, 5000);
                        if (err) return message.err(err);
                        message.reply(getLang("replySuccess"));
                        global.GoatBot.onReply.set(info.messageID, {
                            commandName,
                            messageID: info.messageID,
                            messageIDSender: event.messageID,
                            threadID: event.threadID,
                            type: "adminReply"
                        });
					}, messageIDSender);
                    break;
                }
                case "adminReply": {
                    // Ici, l'utilisateur d'origine a le droit de répondre pour envoyer un nouveau rapport
                    let sendByGroup = "";
                    if (isGroup) {
                        try {
                            const threadInfo = await api.getThreadInfo(event.threadID);
                            sendByGroup = getLang("sendByGroup", threadInfo.threadName, event.threadID);
                        } catch(_) {}
                    }

                    const canvasImagePath = await createCustomCanvas("✎ RETOUR SIGNAL", `Par : ${senderName}`, replyMsg, event.senderID, isGroup, event.threadID);
                    const attachments = await getStreamsFromAttachment(event.attachments.filter(item => mediaTypes.includes(item.type)));
                    if (fs.existsSync(canvasImagePath)) attachments.push(fs.createReadStream(canvasImagePath));

                    const formMessage = {
                        body: getLang("feedback", senderName, event.senderID, sendByGroup, replyMsg),
                        mentions: [{ id: event.senderID, tag: senderName }],
                        attachment: attachments
                    };

                    api.sendMessage(formMessage, TARGET_GROUP_ID, (err, info) => {
                        setTimeout(() => { try { fs.unlinkSync(canvasImagePath); } catch(_) {} }, 5000);
                        if (err) return message.err(err);
                        message.reply(getLang("replyUserSuccess"));
                        global.GoatBot.onReply.set(info.messageID, {
                            commandName,
                            messageID: info.messageID,
                            messageIDSender: event.messageID,
                            threadID: event.threadID,
                            type: "userCallAdmin"
                        });
                    }, messageIDSender);
                    break;
                }
                default:
                    break;
            }
        } catch (error) {
            console.error(error);
        }
    }
};
