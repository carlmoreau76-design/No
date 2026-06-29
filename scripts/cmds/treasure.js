/**
 * @file treasure.js
 * @description Mini-jeu de chasse au trésor 3x3 pour GoatBot (Node.js)
 * @command treasure <montant>
 */

module.exports = {
    config: {
        name: "treasure",
        aliases: ["tresor", "coffre"],
        version: "1.0.0",
        author: "Gemini",
        countDown: 5,
        role: 0,
        shortDescription: {
            fr: "Jeu de chasse au trésor (Grille 3x3)",
            en: "Treasure hunt mini-game (3x3 Grid)"
        },
        category: "economy",
        guide: {
            fr: "{pn} <montant>\nExemple: {pn} 1000",
            en: "{pn} <amount>\nExample: {pn} 1000"
        }
    },

    onStart: async function ({ api, event, args, usersData, message }) {
        const { threadID, messageID, senderID } = event;

        // 1. Validation de l'argument de mise
        if (!args[0]) {
            return message.reply("🏴‍☠️ **Chasse au Trésor** 🏴‍☠️\n───────────────────\n⚠️ Entrez un montant à miser.\n👉 Exemple : `treasure 500`");
        }

        const betAmount = parseInt(args[0]);
        if (isNaN(betAmount) || betAmount <= 0) {
            return message.reply("❌ Le montant de la mise doit être un nombre entier positif.");
        }

        // 2. Vérification du solde de l'utilisateur
        let userData;
        try {
            userData = await usersData.get(senderID);
            if (!userData || userData.money === undefined) {
                return message.reply("❌ Impossible de charger vos données financières.");
            }
        } catch (e) {
            return message.reply("❌ Une erreur est survenue lors de l'accès à la base de données.");
        }

        const currentMoney = userData.money;
        if (currentMoney < betAmount) {
            return message.reply(`❌ **Fonds insuffisants !**\nVous misez \`${betAmount}$\` mais votre solde actuel est de \`${currentMoney}$\`.`);
        }

        // 3. Déduction préventive de la mise (Anti-glitch)
        await usersData.set(senderID, { money: currentMoney - betAmount });

        // 4. Initialisation des données du jeu
        // Génération d'une position aléatoire pour le trésor (de 1 à 9)
        const treasureLocation = Math.floor(Math.random() * 9) + 1;
        
        // Sélection aléatoire de 2 coffres piégés parmi les restants
        const boxes = Array.from({ length: 9 }, (_, i) => i + 1);
        const availableForTraps = boxes.filter(b => b !== treasureLocation);
        const trapLocations = [];
        while (trapLocations.length < 2) {
            const randomIndex = Math.floor(Math.random() * availableForTraps.length);
            const trap = availableForTraps.splice(randomIndex, 1)[0];
            trapLocations.push(trap);
        }

        // 5. Interface utilisateur : Grille 3x3
        const gridVisual = 
            "📦 [1]   📦 [2]   📦 [3]\n" +
            "📦 [4]   📦 [5]   📦 [6]\n" +
            "📦 [7]   📦 [8]   📦 [9]";

        const gameMessage = await message.reply(
            `🏴‍☠️ ── **L'ÎLE AUX TRÉSORS** ── 🏴‍☠️\n` +
            `───────────────────\n` +
            `👤 **Aventurier :** <@${senderID}>\n` +
            `💰 **Mise engagée :** \`${betAmount}$\`\n\n` +
            `${gridVisual}\n\n` +
            `ℹ️ *9 coffres sont face à vous. 1 contient le diamant 💎, 2 contiennent des pièges mortels 💀, et les autres sont vides 💨.*\n\n` +
            `👉 **Répondez à ce message** en envoyant un numéro entre **1 et 9** pour tenter votre chance !`
        );

        // 6. Enregistrement de l'action pour le gestionnaire de réponses (onReply)
        global.GoatBot.onReply.set(gameMessage.messageID, {
            commandName: this.config.name,
            messageID: gameMessage.messageID,
            senderID: senderID,
            betAmount: betAmount,
            treasureLocation: treasureLocation,
            trapLocations: trapLocations,
            expiry: setTimeout(async () => {
                // Gestion de l'expiration au bout de 60 secondes
                global.GoatBot.onReply.delete(gameMessage.messageID);
                try {
                    await message.unsend(gameMessage.messageID);
                } catch (e) {}
                message.reply(`⏳ <@${senderID}>, le temps imparti de 60 secondes est écoulé. Les gardiens de l'île ont repris la mise de \`${betAmount}$\`.`);
            }, 60000)
        });
    },

    onReply: async function ({ api, event, Reply, usersData, message }) {
        const { senderID, body, messageID } = event;
        
        // Sécurité : Seul le joueur initial peut répondre à sa session
        if (senderID !== Reply.senderID) return;

        // Annulation immédiate du timer d'expiration
        clearTimeout(Reply.expiry);
        global.GoatBot.onReply.delete(Reply.messageID);

        const choice = parseInt(body?.trim());

        // Si la réponse n'est pas un nombre valide entre 1 et 9, on rembourse et on quitte
        if (isNaN(choice) || choice < 1 || choice > 9) {
            let freshUserData = await usersData.get(senderID);
            await usersData.set(senderID, { money: freshUserData.money + Reply.betAmount });
            
            try { await message.unsend(Reply.messageID); } catch(e) {}
            return message.reply(`❌ Choix invalide. La session a été annulée et vos \`${Reply.betAmount}$\` vous ont été rendus. Veuillez rejouer proprement.`);
        }

        // Supprimer le message d'attente initial pour fluidifier le tchat
        try { await message.unsend(Reply.messageID); } catch(e) {}

        let freshUserData = await usersData.get(senderID);
        let currentWallet = freshUserData.money; // Solde déjà déduit du montant de base

        // Génération visuelle de la grille de résultats finale
        let finalGrid = "";
        for (let i = 1; i <= 9; i++) {
            let icon = "📦";
            if (i === Reply.treasureLocation) icon = "💎";
            else if (Reply.trapLocations.includes(i)) icon = "💀";
            else icon = "💨";

            if (i === choice) icon = `✨${icon}✨`; // Met en valeur le choix du joueur

            finalGrid += `${icon} [${i}]` + (i % 3 === 0 ? "\n" : "   ");
        }

        // 7. Détermination du résultat
        if (choice === Reply.treasureLocation) {
            // Victoire : Multiplicateur dynamique compris entre 2 et 5 (au dixième près)
            const multiplier = parseFloat((Math.random() * (5 - 2) + 2).toFixed(1));
            const totalWinnings = Math.floor(Reply.betAmount * multiplier);
            const finalWallet = currentWallet + totalWinnings;

            await usersData.set(senderID, { money: finalWallet });

            return message.reply(
                `💰 ── **VICTOIRE ÉPIQUE !** ── 💰\n` +
                `───────────────────\n` +
                `${finalGrid}\n` +
                `🎉 Excellent choix ! Vous ouvrez le coffre **N°${choice}** et découvrez le Diamant Sacré 💎 !\n\n` +
                `📈 **Multiplicateur :** \`x${multiplier}\`\n` +
                `💵 **Gains net :** \`+${totalWinnings}$\`\n` +
                `💳 **Nouveau Solde :** \`${finalWallet}$\``
            );

        } else if (Reply.trapLocations.includes(choice)) {
            // Défaite critique : Coffre piégé
            return message.reply(
                `💀 ── **PIÈGE MORTEL !** ── 💀\n` +
                `───────────────────\n` +
                `${finalGrid}\n` +
                `💥 Malheur ! En ouvrant le coffre **N°${choice}**, un piège se déclenche 💀.\n` +
                `Le trésor se trouvait dans le coffre **N°${Reply.treasureLocation}**.\n\n` +
                `📉 **Perte :** \`-${Reply.betAmount}$\`\n` +
                `💳 **Solde actuel :** \`${currentWallet}$\``
            );

        } else {
            // Défaite standard : Coffre vide
            return message.reply(
                `💨 ── **COFFRE VIDE** ── 💨\n` +
                `───────────────────\n` +
                `${finalGrid}\n` +
                `💨 Vous ouvrez nerveusement le coffre **N°${choice}**... mais il n'y a que de la poussière.\n` +
                `Le diamant brillait dans le coffre **N°${Reply.treasureLocation}**.\n\n` +
                `📉 **Perte :** \`-${Reply.betAmount}$\`\n` +
                `💳 **Solde actuel :** \`${currentWallet}$\``
            );
        }
    }
};
