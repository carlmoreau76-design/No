/**
 * @author Shade
 * @title Panneau de Configuration Premium
 * @name settings
 * @class settings
 * @version 1.0.5
 * @description Panneau de configuration et de gestion système du bot.
 * @usage settings
 */

function fNum(num) {
    return Number(num).toLocaleString("fr-FR");
}

module.exports = {
    config: {
        name: "settings",
        version: "1.0.5",
        author: "Shade",
        countDown: 5,
        role: 2, // Propriétaire du bot uniquement
        category: "settings",
        guide: {
            fr: "{p}{n}"
        }
    },

    langs: {
        fr: {
            panelTitle: "╭───────────────────────────────────────╮\n│ 🛠️  **𝖯𝖠𝖭𝖭𝖤𝖳 𝖣𝖤 𝖢𝖮𝖭𝖥𝖨𝖦𝖴𝖱𝖠𝖳𝖨𝖮𝖭 𝖧𝖮𝖱𝖨**",
            settingsTitle: "├───────────────────────────────────────┤\n│ ⚙️  **𝖦𝖤𝖲𝖳𝖨𝖮𝖭 𝖣𝖤𝖲 𝖯𝖠𝖱𝖠𝖬𝖤𝖳𝖱𝖤𝖲 :**",
            activityTitle: "├───────────────────────────────────────┤\n│ 📊 **𝖦𝖤𝖲𝖳𝖨𝖮𝖭 𝖣𝖤𝖲 𝖠𝖢𝖳𝖨𝖵𝖨𝖳𝖤𝖲 :**",
            option1: "│ 🔹 [1] Préfixe actuel du bot",
            option2: "│ 🔹 [2] Nom d'instance",
            option3: "│ 🔹 [3] Liste des administrateurs",
            option4: "│ 🔹 [4] Langue système",
            option5: "│ 🔹 [5] Redémarrage automatique",
            option6: "│ 🔹 [6] Version du noyau",
            option7: "│ 🔹 [7] Utilisateurs bannis",
            option8: "│ 🔹 [8] Groupes mis à l'index",
            option9: "│ 🔹 [9] Diffuser une annonce globale",
            option10: "│ 🔹 [10] Recherche UID par pseudonyme",
            option11: "│ 🔹 [11] Recherche ID de groupe par nom",
            option12: "│ 🔹 [12] Altérer l'émoji du salon",
            option13: "│ 🔹 [13] Altérer le nom du salon",
            option14: "│ 🔹 [14] Diagnostiquer le groupe actuel",
            selectPrompt: "├───────────────────────────────────────┤\n│ 💡 *Répondez à ce message avec le numéro.*\n╰───────────────────────────────────────╯",
            autoRestart: "🪐 **𝖲𝖸𝖲𝖳𝖤𝖬𝖤**\nLe noyau est programmé pour une réinitialisation automatique à 12h00.",
            currentVersion: "🪐 **𝖲𝖸𝖲𝖳𝖤𝖬𝖤**\nVersion actuelle de l'infrastructure : ",
            bannedUsers: "🪐 **𝖲𝖤𝖢𝖴𝖱𝖨𝖳𝖤**\nUtilisateurs bannis enregistrés (%1) :\n\n%2",
            bannedThreads: "🪐 **𝖲𝖤𝖢𝖴𝖱𝖨𝖳𝖤**\nSalons mis à l'index enregistrés (%1) :\n\n%2",
            announcementPrompt: "📣 **𝖣𝖨𝖥𝖥𝖴𝖲𝖨𝖮𝖭**\nRépondez à ce message avec le texte de l'annonce à déployer globalement.",
            findUidPrompt: "🔎 **𝖱𝖤𝖢𝖧𝖤𝖱𝖢𝖧𝖤**\nEntrez le pseudonyme de la cible pour extraire son UID.",
            findThreadPrompt: "🔎 **𝖱𝖤𝖢𝖧𝖤𝖱𝖢𝖧𝖤**\nEntrez le nom du groupe pour extraire son identifiant.",
            emojiPrompt: "✨ **𝖬𝖮𝖣𝖨𝖥𝖨𝖢𝖠𝖳𝖨𝖮𝖭**\nEnvoyez le nouvel émoji pour ce canal.",
            namePrompt: "✨ **𝖬𝖮𝖣𝖨𝖥𝖨𝖢𝖠𝖳𝖨𝖮𝖭**\nEntrez le nouveau titre du groupe.",
            announcementSent: "📢 **𝖱𝖠𝖯𝖯𝖮𝖱𝖳 𝖣𝖤 𝖣𝖨𝖥𝖥𝖴𝖲𝖨𝖮𝖭**\n\n✅ Transmissions réussies : **%1**\n❌ Échecs de liaison : **%2**",
            threadInfo: "📊 **𝖣𝖨𝖠𝖦𝖭𝖮𝖲𝖳𝖨𝖢 𝖣𝖴 𝖢𝖠𝖭𝖠𝖫**\n━━━━━━━━━━━━━━━━━━\n📝 Nom du Salon   : %1\n🆔 ID de Groupe   : %2\n🛡️ Approbation    : %3\n🔮 Émoji Actif    : %4\n👥 Total Membres  : %5\n♂️ Effectif Hommes : %6\n♀️ Effectif Femmes : %7\n👑 Administrateurs : %8\n📥 Flux Messages  : %9\n━━━━━━━━━━━━━━━━━━",
            noResult: "❌ **𝖤𝖱𝖱𝖤𝖴𝖱**\nAucune correspondance trouvée dans les registres."
        }
    },

    onStart: async function ({ event, message, args, getLang }) {
        if (!args[0]) {
            const panelMessage = [
                getLang("panelTitle"),
                getLang("settingsTitle"),
                getLang("option1"),
                getLang("option2"),
                getLang("option3"),
                getLang("option4"),
                getLang("option5"),
                getLang("activityTitle"),
                getLang("option6"),
                getLang("option7"),
                getLang("option8"),
                getLang("option9"),
                getLang("option10"),
                getLang("option11"),
                getLang("option12"),
                getLang("option13"),
                getLang("option14"),
                getLang("selectPrompt")
            ].join("\n");

            return message.reply(panelMessage, (err, info) => {
                if (global.GoatBot?.onReply) {
                    global.GoatBot.onReply.set(info.messageID, {
                        commandName: this.config.name,
                        author: event.senderID,
                        type: "choose"
                    });
                }
            });
        }
    },

    onReply: async function ({ api, event, message, Reply, threadsData, usersData, getLang }) {
        const { type, author } = Reply;
        if (author != event.senderID) return;

        switch (type) {
            case "choose": {
                const choice = event.body?.trim();
                const configBase = global.GoatBot?.config || {};

                switch (choice) {
                    case "1":
                        return message.reply(`⚙️ **𝖯𝖠𝖱𝖠𝖬𝖤𝖳𝖱𝖤**\nPréfixe actuel : \`${configBase.prefix || ""}\``);
                    case "2":
                        return message.reply(`⚙️ **𝖯𝖠𝖱𝖠𝖬𝖤𝖳𝖱𝖤**\nNom d'instance : **${configBase.botName || "GoatBot"}**`);
                    case "3": {
                        const admins = configBase.adminBot || [];
                        let adminList = [];
                        for (const adminID of admins) {
                            const name = await usersData.getName(adminID);
                            adminList.push(`• ${name} (\`${adminID}\`)`);
                        }
                        return message.reply(`👑 **𝖫𝖨𝖲𝖳𝖤 𝖣𝖤𝖲 𝖠𝖣𝖬𝖨𝖭𝖲**\n\n${adminList.join("\n")}`);
                    }
                    case "4":
                        return message.reply(`⚙️ **𝖯𝖠𝖱𝖠𝖬𝖤𝖳𝖱𝖤**\nLangue du noyau : \`${configBase.language || "fr"}\``);
                    case "5":
                        return message.reply(getLang("autoRestart"));
                    case "6":
                        return message.reply(getLang("currentVersion") + `\`${this.config.version}\``);
                    case "7": {
                        const bannedUsers = global.GoatBot?.bannedUsers || new Map();
                        let bannedList = [];
                        let count = 1;
                        for (const [id, reason] of bannedUsers.entries()) {
                            const name = await usersData.getName(id);
                            bannedList.push(`${count++}. **${name}**\n   └ UID : \`${id}\` | Raison : *${reason}*`);
                        }
                        return message.reply(getLang("bannedUsers", bannedUsers.size, bannedList.join("\n\n") || "*Aucun banni*"));
                    }
                    case "8": {
                        const bannedThreads = global.GoatBot?.bannedThreads || new Map();
                        let bannedList = [];
                        let count = 1;
                        for (const [id, reason] of bannedThreads.entries()) {
                            const threadInfo = await threadsData.get(id) || {};
                            bannedList.push(`${count++}. **${threadInfo.threadName || "Groupe Inconnu"}**\n   └ TID : \`${id}\` | Raison : *${reason}*`);
                        }
                        return message.reply(getLang("bannedThreads", bannedThreads.size, bannedList.join("\n\n") || "*Aucun groupe mis à l'index*"));
                    }
                    case "9":
                        return message.reply(getLang("announcementPrompt"), (err, info) => {
                            global.GoatBot.onReply.set(info.messageID, {
                                commandName: this.config.name,
                                author: event.senderID,
                                type: "sendAnnouncement"
                            });
                        });
                    case "10":
                        return message.reply(getLang("findUidPrompt"), (err, info) => {
                            global.GoatBot.onReply.set(info.messageID, {
                                commandName: this.config.name,
                                author: event.senderID,
                                type: "findUid"
                            });
                        });
                    case "11":
                        return message.reply(getLang("findThreadPrompt"), (err, info) => {
                            global.GoatBot.onReply.set(info.messageID, {
                                commandName: this.config.name,
                                author: event.senderID,
                                type: "findThread"
                            });
                        });
                    case "12":
                        return message.reply(getLang("emojiPrompt"), (err, info) => {
                            global.GoatBot.onReply.set(info.messageID, {
                                commandName: this.config.name,
                                author: event.senderID,
                                type: "changeEmoji"
                            });
                        });
                    case "13":
                        return message.reply(getLang("namePrompt"), (err, info) => {
                            global.GoatBot.onReply.set(info.messageID, {
                                commandName: this.config.name,
                                author: event.senderID,
                                type: "changeName"
                            });
                        });
                    case "14": {
                        const threadInfo = await threadsData.get(event.threadID);
                        if (!threadInfo) return message.reply(getLang("noResult"));
                        
                        const participants = threadInfo.members.length;
                        let maleCount = 0;
                        let femaleCount = 0;

                        // Parallélisation asynchrone des requêtes de profil pour éviter le lag
                        const memberPromises = threadInfo.members.map(m => usersData.get(m.userID).catch(() => null));
                        const fetchedMembers = await Promise.all(memberPromises);

                        for (const userInfo of fetchedMembers) {
                            if (userInfo) {
                                if (userInfo.gender === "MALE") maleCount++;
                                else if (userInfo.gender === "FEMALE") femaleCount++;
                            }
                        }

                        const approvalMode = threadInfo.approvalMode ? "Activé (Strict)" : "Désactivé (Libre)";

                        return message.reply(getLang("threadInfo",
                            threadInfo.threadName,
                            event.threadID,
                            approvalMode,
                            threadInfo.emoji || "🔹",
                            fNum(participants),
                            fNum(maleCount),
                            fNum(femaleCount),
                            threadInfo.adminIDs.length,
                            fNum(threadInfo.messageCount || 0)
                        ));
                    }
                    default:
                        return message.reply(getLang("noResult"));
                }
            }
            case "sendAnnouncement": {
                const allThreads = await threadsData.getAll();
                const senderName = await usersData.getName(event.senderID);
                let successCount = 0;
                let failedThreads = [];

                for (const thread of allThreads) {
                    if (thread.threadID !== event.threadID) {
                        try {
                            await message.send(
                                `📣 **𝖠𝖭𝖭𝖮𝖭𝖢𝖤 𝖲𝖸𝖲𝖳𝖤𝖬𝖤**\nTransmis par l'admin : **${senderName}**\n────────────────────\n\n${event.body}`,
                                thread.threadID
                            );
                            successCount++;
                            await new Promise(resolve => setTimeout(resolve, 600)); // Limiteur léger de rate-limit
                        } catch (e) {
                            failedThreads.push(thread.threadID);
                        }
                    }
                }
                return message.reply(getLang("announcementSent", successCount, failedThreads.length));
            }
            case "findUid": {
                try {
                    const name = event.body;
                    const users = await api.searchUsers(name);
                    let result = `🔎 **𝖱𝖤𝖲𝖴𝖫𝖳𝖠𝖳𝖲 𝖣𝖤 𝖱𝖤𝖢𝖧𝖤𝖱𝖢𝖧𝖤 :**\n\n`;
                    for (const user of users) {
                        result += `• Nom : **${user.name}**\n  UID : \`${user.userID}\`\n\n`;
                    }
                    return message.reply(users.length > 0 ? result : getLang("noResult"));
                } catch (e) {
                    return message.reply(getLang("noResult"));
                }
            }
            case "findThread": {
                try {
                    const name = event.body.toLowerCase();
                    const allThreads = await threadsData.getAll();
                    let foundThreads = [];

                    for (const thread of allThreads) {
                        if (thread.threadName && thread.threadName.toLowerCase().includes(name)) {
                            foundThreads.push({
                                name: thread.threadName,
                                id: thread.threadID
                            });
                        }
                    }

                    if (foundThreads.length > 0) {
                        let result = `🔎 **𝖦𝖱𝖮𝖴𝖯𝖤𝖲 𝖢𝖮𝖱𝖱𝖤𝖲𝖯𝖮𝖭𝖣𝖠𝖭𝖳𝖲 :**\n\n` + foundThreads.map((t, i) => `${i + 1}. **${t.name}**\n   🆔 TID : \`${t.id}\``).join("\n\n");
                        return message.reply(result);
                    } else {
                        return message.reply(getLang("noResult"));
                    }
                } catch (e) {
                    return message.reply(getLang("noResult"));
                }
            }
            case "changeEmoji": {
                try {
                    await api.changeThreadEmoji(event.body, event.threadID);
                    return message.reply(`✨ **𝖲𝖸𝖲𝖳𝖤𝖬𝖤**\nL'émoji du groupe a été redéfini avec succès sur : ${event.body}`);
                } catch (e) {
                    return message.reply("❌ Impossible de modifier l'émoji.");
                }
            }
            case "changeName": {
                try {
                    await api.setTitle(event.body, event.threadID);
                    return message.reply(`✨ **𝖲𝖸𝖲𝖳𝖤𝖬𝖤**\nLe titre du salon a été redéfini sur : **${event.body}**`);
                } catch (e) {
                    return message.reply("❌ Impossible de renommer le salon.");
                }
            }
        }
    }
};
