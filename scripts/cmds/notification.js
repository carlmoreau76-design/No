const { createCanvas, loadImage } = require('canvas');
const fs = require('fs-extra');
const path = require('path');

async function generateNotifyCanvas(adminId, adminName, groupName, groupIconUrl, messageContent) {
    // Canvas format étendu style bannière moderne
    const canvas = createCanvas(1000, 580);
    const ctx = canvas.getContext('2d');

    // 1. Fond Néon Cyberpunk (Dégradé Violet & Cyan)
    const bgGradient = ctx.createLinearGradient(0, 0, 1000, 580);
    bgGradient.addColorStop(0, '#0f0c20'); // Sombre profond
    bgGradient.addColorStop(0.5, '#2b1055'); // Violet Électrique
    bgGradient.addColorStop(1, '#00f2fe'); // Cyan Néon
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, 1000, 580);

    // 2. Cadre Lumineux avec coins arrondis
    ctx.strokeStyle = '#00f2fe';
    ctx.lineWidth = 5;
    ctx.shadowColor = '#00f2fe';
    ctx.shadowBlur = 15; // Effet néon brillant
    
    ctx.beginPath();
    ctx.roundRect(30, 30, 940, 520, 25);
    ctx.stroke();
    ctx.shadowBlur = 0; // Réinitialisation de l'ombre

    // 3. Avatar de l'Admin + "Cercle d'animation" pulsant
    const avatarX = 200;
    const avatarY = 290;
    const avatarRadius = 110;

    // Anneau externe "effet chargement"
    ctx.strokeStyle = 'rgba(0, 242, 254, 0.3)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(avatarX, avatarY, avatarRadius + 12, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = '#00f2fe';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(avatarX, avatarY, avatarRadius + 12, 0.3, Math.PI * 1.5); // Arc partiel style chargement
    ctx.stroke();

    // URL de l'avatar Graph Facebook avec Jeton
    const avatarUrl = `https://graph.facebook.com/${adminId}/picture?height=500&width=500&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;

    try {
        const adminAvatar = await loadImage(avatarUrl);
        ctx.save();
        ctx.beginPath();
        ctx.arc(avatarX, avatarY, avatarRadius, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(adminAvatar, avatarX - avatarRadius, avatarY - avatarRadius, avatarRadius * 2, avatarRadius * 2);
        ctx.restore();
    } catch (e) {
        // Système de secours stable
        try {
            const backupAvatar = await loadImage(`https://api.mestaria.com/fb/avatar?id=${adminId}`);
            ctx.save();
            ctx.beginPath();
            ctx.arc(avatarX, avatarY, avatarRadius, 0, Math.PI * 2);
            ctx.clip();
            ctx.drawImage(backupAvatar, avatarX - avatarRadius, avatarY - avatarRadius, avatarRadius * 2, avatarRadius * 2);
            ctx.restore();
        } catch (err) {
            ctx.fillStyle = '#00f2fe';
            ctx.beginPath(); ctx.arc(avatarX, avatarY, avatarRadius, 0, Math.PI * 2); ctx.fill();
        }
    }

    // Aligner tous les textes de la colonne droite proprement à gauche
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    // 4. Intégration de l'icône du Groupe
    let textStartOffsetX = 420;
    if (groupIconUrl) {
        try {
            const groupImg = await loadImage(groupIconUrl);
            ctx.save();
            ctx.beginPath();
            ctx.roundRect(420, 150, 50, 50, 10);
            ctx.clip();
            ctx.drawImage(groupImg, 420, 150, 50, 50);
            ctx.restore();
            textStartOffsetX = 485; // Décalage du titre du groupe si icône présente
        } catch (e) {}
    }

    // 5. Zone de Textes
    const titleGrad = ctx.createLinearGradient(420, 0, 800, 0);
    titleGrad.addColorStop(0, '#00f2fe');
    titleGrad.addColorStop(1, '#ffffff');
    ctx.fillStyle = titleGrad;
    ctx.font = 'bold 38px sans-serif';
    ctx.fillText("👑 COMMUNIQUÉ OFFICIEL", 420, 75);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.font = 'italic 18px sans-serif';
    ctx.fillText(`Par l'administrateur : ${adminName}`, 420, 120);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText(`🏰 ${groupName.substring(0, 22)}`, textStartOffsetX, 160);

    // 6. Cadre Décoratif Textuel (HAUT)
    const decoration = "✧ ▬▭▬ ▬▭▬ ✦✧✦ ▬▭▬ ▬▭▬ ✧";
    ctx.fillStyle = '#00f2fe';
    ctx.font = 'bold 20px Arial';
    ctx.fillText(decoration, 420, 220);

    // Message principal avec retour à la ligne automatique ajusté
    ctx.fillStyle = '#ffffff';
    ctx.font = '500 24px sans-serif';

    const maxLineWidth = 510;
    const words = messageContent.split(' ');
    let line = '';
    let currentY = 265;
    const lineHeight = 36;

    for (let n = 0; n < words.length; n++) {
        let testLine = line + words[n] + ' ';
        let metrics = ctx.measureText(testLine);
        if (metrics.width > maxLineWidth && n > 0) {
            ctx.fillText(line, 420, currentY);
            line = words[n] + ' ';
            currentY += lineHeight;
        } else {
            line = testLine;
        }
    }
    ctx.fillText(line, 420, currentY);

    // Cadre Décoratif Textuel (BAS)
    ctx.fillStyle = '#00f2fe';
    ctx.font = 'bold 20px Arial';
    ctx.fillText(decoration, 420, currentY + 45);

    // Sauvegarde de l'image de façon isolée
    const tmpDir = path.join(__dirname, "cache");
    await fs.ensureDir(tmpDir);
    const imagePath = path.join(tmpDir, `notify_${Date.now()}_${adminId}.png`);
    await fs.promises.writeFile(imagePath, canvas.toBuffer('image/png'));
    return imagePath;
}

module.exports = {
    config: {
        name: "notification",
        aliases: ["noti"],
        version: "4.0",
        author: "Shade",
        role: 2, // Limité aux Admins/Owners du Bot
        description: "Envoie un communiqué visuel cyberpunk aligné et stylisé à tous les groupes.",
        category: "owner",
        guide: {
            fr: "{p}notification [votre message]"
        }
    },

    onStart: async function ({ message, api, event, args, usersData }) {
        if (!args[0]) return message.reply("⚠️ Veuillez saisir le message du communiqué à diffuser.");

        const adminId = event.senderID;
        const adminName = await usersData.getName(adminId) || "Administration";
        const messageContent = args.join(" ");

        try {
            // Récupération dynamique et sécurisée des vrais groupes actifs du bot
            const threads = await api.getThreadList(100, null, ["INBOX"]) || [];
            const activeGroups = threads.filter(t => t.isGroup && t.name);

            if (activeGroups.length === 0) {
                return message.reply("❌ Le bot n'est présent dans aucun groupe actif.");
            }
        
            message.reply(`📡 Diffusion de la bannière Cyberpunk en cours dans ${activeGroups.length} groupes...`);

            for (const group of activeGroups) {
                try {
                    const groupIconUrl = group.imageSrc || null;

                    // Génération du canvas pour le groupe en cours
                    const imagePath = await generateNotifyCanvas(
                        adminId, adminName, group.name || "Groupe Public", 
                        groupIconUrl, messageContent
                    );

                    // Envoi conjoint du message formaté et de la pièce jointe
                    await api.sendMessage({
                        body: `👑 **𝘾𝙊𝙈𝙈𝙐𝙉𝙄𝙌𝙐𝙀́ 𝙊𝙁𝙁𝙄𝘾𝙄𝙀𝙇**\n━━━━━━━━━━━━━━━━━\n\n📢 ${messageContent}`,
                        attachment: fs.createReadStream(imagePath)
                    }, group.threadID);

                    // Nettoyage immédiat de l'image du cache pour libérer l'espace disque
                    try { if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath); } catch(e){}
                    
                    // Léger délai anti-spam/anti-bannissement de l'application
                    await new Promise(r => setTimeout(r, 1200));
                } catch (e) {
                    console.error(`[NOTIFY ERR] Échec sur le salon : ${group.threadID}`, e.message);
                }
            }
            return message.reply("✅ Le communiqué officiel a été envoyé avec succès dans l'ensemble des groupes !");
            
        } catch (globalErr) {
            console.error(globalErr);
            return message.reply(`❌ Une erreur critique est survenue : ${globalErr.message}`);
        }
    }
};
