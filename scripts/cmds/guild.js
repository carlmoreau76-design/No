const storage = require("./MMORPG_System/guildsMMO/guild.storage.js");

module.exports = {
    config: {
        name: "guild",
        version: "2.0.0",
        author: "AI Developer",
        countDown: 3,
        role: 0,
        shortDescription: "Système complet de Guilde MMORPG",
        longDescription: "Gérez votre guilde, menez des guerres de guildes, conquérez des territoires et améliorez vos infrastructures.",
        category: "game",
        guide: {
            en: "{p}guild - Affiche le menu principal\n{p}guild create <nom> - Fonde une guilde",
            fr: "{p}guild - Affiche le menu principal\n{p}guild create <nom> - Fonde une guilde"
        }
    },

    onStart: async function ({ api, event, args, usersData }) {
        const { threadID, messageID, senderID } = event;
        const subCommand = args[0] ? args[0].toLowerCase() : null;
        
        let userDataStr;
        try {
            userDataStr = await usersData.getName(senderID);
        } catch(e) {
            userDataStr = "Aventurier";
        }

        const player = storage.getUserProfile(senderID, userDataStr);
        
        // Exécution automatique des moteurs d'arrière-plan (Guerre & Territoires)
        await handleWarEngine(api, threadID);
        await handleTerritoryPayouts(api, threadID);

        // MENU PRINCIPAL DE LA GUILDE
        if (!subCommand) {
            let menu = `╭───────────────────────────────────────╮\n`;
            menu += `│ ⚔️ 𝐒𝐘𝐒𝐓È𝐌𝐄 𝐃𝐄 𝐆𝐔𝐈𝐋𝐃𝐄𝐒 𝐌𝐌𝐎𝐑𝐏𝐆\n`;
            menu += `├───────────────────────────────────────┤\n`;
            menu += `│ 🔹 𝖦𝗎𝗂𝗅𝖽 𝖼𝗋𝖾𝖺𝗍𝖾 <nom> : 𝖥𝗈𝗇𝖽𝖾𝗋 𝗏𝗈𝗍𝗋𝖾 𝖾𝗆𝗉𝗂𝗋𝖾\n`;
            menu += `│ 🔹 𝖦𝗎𝗂𝗅𝖽 𝗂𝗇𝖿𝗈 [ID] : 𝖠𝖿𝖿𝗂𝖼𝗁𝖾𝗋 𝗅𝖺 𝖿𝗂𝖼𝗁𝖾 𝖽𝖾 𝗀𝗎𝗂𝗅𝖽𝖾\n`;
            menu += `│ 🔹 𝖦𝗎𝗂𝗅𝖽 𝗅𝗂𝗌𝗍 : 𝖯𝖺𝗋𝖼𝗈𝗎𝗋𝗂𝗋 𝗅’𝖺𝗇𝗇𝗎𝖺𝗂𝗋𝖾 𝖽𝖾𝗌 𝗀𝗎𝗂𝗅𝖽𝖾𝗌\n`;
            menu += `│ 🔹 𝖦𝗎𝗂𝗅𝖽 𝗌𝖾𝖺𝗋𝖼𝗁 <nom> : 𝖥𝗂𝗅𝗍𝗋𝖾𝗋 𝗅𝖾𝗌 𝖺𝗅𝗅𝗂𝖺𝗇𝖼𝖾𝗌\n`;
            menu += `│ 🔹 𝖦𝗎𝗂𝗅𝖽 𝗃𝗈𝗂𝗇 <ID> : 𝖨𝗇𝗍é𝗀𝗋𝖾𝗋 𝗎𝗇𝖾 𝗀𝗎𝗂𝗅𝖽𝖾\n`;
            menu += `│ 🔹 𝖦𝗎𝗂𝗅𝖽 𝗅𝖾𝖺𝗏𝖾 : 𝖰𝗎𝗂quit𝗍𝖾𝗋 𝗏𝗈𝗍𝗋𝖾 𝗀𝗎𝗂𝗅𝖽𝖾\n`;
            menu += `│ 🔹 𝖦𝗎𝗂𝗅𝖽 𝗂𝗇𝗏𝗂𝗍𝖾 @user : 𝖨𝗇𝗏𝗂𝗍𝖾𝗋 𝗎𝗇 𝗃𝗈𝗎𝖾𝗎𝗋\n`;
            menu += `│ 🔹 𝖦𝗎𝗂𝗅𝖽 𝗆𝖾𝗆𝖻𝖾𝗋𝗌 : 𝖵𝗈𝗂𝗋 𝗅’𝖾𝖿𝖿𝖾𝖼𝗍𝗂𝖿 𝖼𝗈𝗆𝗉𝗅𝖾𝗍\n`;
            menu += `├───────────────────────────────────────┤\n`;
            menu += `│ 💰 𝐁𝐀𝐍𝐐𝐔𝐄 & 𝐈𝐍𝐅𝐑𝐀𝐒𝐓𝐑𝐔𝐂𝐓𝐔𝐑𝐄\n`;
            menu += `├───────────────────────────────────────┤\n`;
            menu += `│ 🔹 𝖦𝗎𝗂𝗅𝖽 𝖽𝗈𝗇𝖺𝗍𝖾 <montant/all> : 𝖵𝖾𝗋𝗌𝖾𝗋 𝖺𝗎 𝖼𝗈𝖿𝖿𝗋𝖾\n`;
            menu += `│ 🔹 𝖦𝗎𝗂𝗅𝖽 𝗐𝗂𝗍𝗁𝖽𝗋𝖺𝗐 <montant> : 𝖱𝖾𝗍𝗂𝗋𝖾𝗋 𝖽𝖾𝗌 𝖿𝗈𝗇𝖽𝗌\n`;
            menu += `│ 🔹 𝖦𝗎𝗂𝗅𝖽 𝗎𝗉𝗀𝗋𝖺𝖽𝖾 : 𝖠𝗆é𝗅𝗂𝗈𝗋𝖾𝗋 𝗅𝖺 𝗀𝗎𝗂𝗅𝖽𝖾\n`;
            menu += `│ 🔹 𝖦𝗎𝗂𝗅𝖽 𝖽𝖺𝗂𝗅𝗒 : 𝖱é𝖼𝗅𝖺𝗆𝖾𝗋 𝗅𝖺 𝗋é𝖼𝗈𝗆𝗉𝖾𝗇𝗌𝖾 𝗊𝗎𝗈𝗍𝗂𝖽𝗂𝖾𝗇𝗇𝖾\n`;
            menu += `│ 🔹 𝖦𝗎𝗂𝗅𝖽 𝗌𝖾uet𝗍𝗂𝗇𝗀𝗌 : 𝖬𝗈𝖽𝗂𝖿𝗂𝖾𝗋 𝖾𝗆𝗈𝗃𝗂 / 𝖻𝗂𝗈\n`;
            menu += `│ 🔹 𝖦𝗎𝗂𝗅𝖽 𝗅𝗈𝗀𝗌 : 𝖢𝗈𝗇𝗌𝗎𝗅𝗍𝖾𝗋 𝗅’𝗁𝗂𝗌𝗍𝗈𝗋𝗂𝗊𝗎𝖾\n`;
            menu += `├───────────────────────────────────────┤\n`;
            menu += `│ 👑 𝐇𝐈𝐄́𝐑𝐀𝐑𝐂𝐇𝐈𝐄 & 𝐎𝐅𝐅𝐈𝐂𝐈𝐄𝐑𝐒\n`;
            menu += `├───────────────────────────────────────┤\n`;
            menu += `│ 🔹 𝖦𝗎𝗂𝗅𝖽 𝗉𝗋𝗈𝗆𝗈𝗍𝖾 @user : 𝖯𝗋𝗈𝗆𝗈𝗎𝗏𝗈𝗂𝗋 𝗎𝗇 𝗆𝖾𝗆𝖻𝗋𝖾\n`;
            menu += `│ 🔹 𝖦𝗎𝗂𝗅𝖽 𝖽𝖾𝗆𝗈𝗍𝖾 @user : 𝖱é𝗍𝗋𝗈𝗀𝗋𝖺𝖽𝖾𝗋 𝗎𝗇 𝗆𝖾𝗆𝖻𝗋𝖾\n`;
            menu += `│ 🔹 𝖦𝗎𝗂𝗅𝖽 𝗄𝗂𝖼𝗄 @user : 𝖤𝗑𝖼𝗅𝗎𝗋𝖾 𝗎𝗇 𝗆𝖾𝗆𝖻𝗋𝖾\n`;
            menu += `│ 🔹 𝖦𝗎ἱ𝗅𝖽 𝖽𝗂𝗌𝖻𝖺𝗇𝖽 : 𝖣𝗂𝗌𝗌𝗈𝗎𝖽𝗋𝖾 𝗅𝖺 𝗀𝗎𝗂𝗅𝖽𝖾\n`;
            menu += `├───────────────────────────────────────┤\n`;
            menu += `│ 🏆 ⚔️ 𝐆𝐔𝐄𝐑𝐑𝐄𝐒, 𝐌𝐈𝐒𝐒𝐈𝐎𝐍𝐒 & 𝐓𝐄𝐑𝐑𝐈𝐓𝐎𝐈𝐑𝐄𝐒\n`;
            menu += `├───────────────────────────────────────┤\n`;
            menu += `│ 🔹 𝖦𝗎𝗂𝗅𝖽 𝗐𝖺𝗋 : 𝖵𝗈𝗂𝗋 𝗅𝖾 𝗌𝗍𝖺𝗍𝗎𝗍 𝖽𝖾𝗌 𝗀𝗎𝖾𝗋𝗋𝖾𝗌\n`;
            menu += `│ 🔹 𝖦𝗎𝗂𝗅𝖽 𝗐𝖺𝗋 𝗃𝗈𝗂𝗇 : 𝖲’𝗂𝗇𝗌𝖼𝗋𝗂𝗋𝖾 à 𝗅𝖺 𝗀𝗎𝖾𝗋𝗋𝖾\n`;
            menu += `│ 🔹 𝖦𝗎𝗂𝗅𝖽 𝗐𝖺𝗋 𝖺𝗍𝗍𝖺𝊼𝗄 : 𝖠𝗍𝗍𝖺𝗊𝗎𝖾𝗋 𝗅𝖺 𝗀𝗎𝗂𝗅𝖽𝖾 𝖺𝖽𝗏𝖾𝗋𝗌𝖾\n`;
            menu += `│ 🔹 𝖦𝗎𝗂𝗅𝖽 𝗍𝖾𝗋𝗋𝗂𝗍𝗈𝗋𝗂𝖾𝗌 : 𝖠𝖿𝖿𝗂𝖼𝗁𝖾𝗋 𝗅𝖺 𝖼𝖺𝗋𝗍𝖾 𝖽𝖾𝗌 𝗍𝖾𝗋𝗋𝗂𝗍𝗈𝗂𝗋𝖾𝗌\n`;
            menu += `│ 🔹 𝖦𝗎𝗂𝗅𝖽 𝗆𝗂𝗌𝗌𝗂𝗈𝗇𝗌 : 𝖵𝗈𝗂𝗋 𝗅𝖾𝗌 𝗊𝗎ê𝗍𝖾𝗌 𝖽𝖾 𝗀𝗎𝗂𝗅𝖽𝖾\n`;
            menu += `│ 🔹 𝖦𝗎𝗂𝗅𝖽 𝖺𝖼𝗁𝗂𝖾𝗏𝖾𝗆𝖾𝗇𝗍𝗌 : 𝖵𝗈ἱ𝗋 𝗅𝖾𝗌 𝗌𝗎𝖼𝖼è𝗌\n`;
            menu += `│ 🔹 𝖦𝗎𝗂𝗅𝖽 𝗍𝗈𝗉 : 𝖢𝗅𝖺𝗌𝗌𝖾𝗆𝖾𝗇𝗍 𝖽𝖾𝗌 𝗀𝗎𝖾𝗋𝗋𝖾𝗌\n`;
            menu += `│ 🔹 𝖦𝗎𝗂𝗅𝖽 𝖼𝗁𝖺𝗍 <msg> : 𝖤𝗇𝗏𝗈𝗒𝖾𝗋 𝗎𝗇 𝗆𝖾𝗌𝗌𝖺𝗀𝖾 𝗂𝗇𝗍𝖾𝗋𝗇𝖾\n`;
            menu += `├───────────────────────────────────────┤\n`;
            menu += `│ ⭐ 𝖭𝗂𝗏𝖾𝖺𝗎𝗑 : 1 → 50 | ⚔️ 𝖦𝗎𝖾𝗋𝗋𝖾𝗌 : 18𝗁\n`;
            menu += `╰───────────────────────────────────────╯`;
            return api.sendMessage(menu, threadID, messageID);
        }

        // Execution des sous-commandes
        switch (subCommand) {
            case "create": return await handleCreate(api, event, args, player);
            case "info": return await handleInfo(api, event, args, player);
            case "list": return await handleList(api, event);
            case "search": return await handleSearch(api, event, args);
            case "join": return await handleJoin(api, event, args, player);
            case "leave": return await handleLeave(api, event, player);
            case "invite": return await handleInvite(api, event, player);
            case "kick": return await handleKick(api, event, player);
            case "promote": return await handlePromote(api, event, player);
            case "demote": return await handleDemote(api, event, player);
            case "members": return await handleMembers(api, event, player);
            case "donate": return await handleDonate(api, event, args, player);
            case "withdraw": return await handleWithdraw(api, event, args, player);
            case "upgrade": return await handleUpgrade(api, event, player);
            case "chat": return await handleChat(api, event, args, player);
            case "top": return await handleTop(api, event, args);
            case "disband": return await handleDisband(api, event, player);
            case "settings": return await handleSettings(api, event, args, player);
            case "logs": return await handleLogs(api, event, player);
            case "daily": return await handleDaily(api, event, player);
            case "missions": return await handleMissions(api, event, player);
            case "achievements": return await handleAchievements(api, event, player);
            case "war":
                if (args[1] === "join") return await handleWarJoin(api, event, player);
                if (args[1] === "attack") return await handleWarAttack(api, event, player);
                return await handleWarStatus(api, event, player);
            case "territories":
            case "territory":
                return await handleTerritories(api, event, player);
            default:
                return api.sendMessage("❌ 𝖲𝗈𝗎𝗌-𝖼𝗈𝗆𝗆𝖺𝗇𝖽𝖾 𝗂𝗇𝗏𝖺𝗅𝗂𝖽𝖾. 𝖳𝖺𝗉𝖾𝗓 `guild` 𝗉𝗈𝗎𝗋 𝗅𝖾 𝗆𝖾𝗇𝗎.", threadID, messageID);
        }
    }
};
