/**
 * @file ignoreonlyad.js
 * @description Permet à l'owner de gérer les commandes qui contournent le mode adminOnly.
 */

const OWNER_UID = "61573867120837";
const fs = require("fs-extra");

module.exports = {
	config: {
		name: "ignoreonlyad",
		aliases: ["ignoreadonly", "ignoreonlyadmin", "ign"],
		version: "2.1.0",
		author: "Shade & Gemini",
		countDown: 5,
		role: 0,
		shortDescription: {
			en: "Manage commands that bypass adminOnly mode",
			fr: "Gérer les commandes qui contournent le mode adminOnly"
		},
		category: "security",
		guide: {
			en: "{pn} add <command>\n{pn} del <command>\n{pn} list",
			fr: "{pn} add <commande>\n{pn} del <commande>\n{pn} list"
		}
	},

	langs: {
		en: {
			denied: "❌ Access denied. Only the bot owner can use this command.",
			missingAdd: "⚠️ Please specify a command name to add to the ignore list.",
			missingDel: "⚠️ Please specify a command name to remove from the ignore list.",
			notFound: "❌ Command \"%1\" does not exist in the system.",
			already: "ℹ️ Command \"%1\" is already in the bypass list.",
			added: "✅ Command \"%1\" successfully added to the adminOnly bypass list.",
			notIn: "❌ Command \"%1\" is not in the bypass list.",
			removed: "🧹 Command \"%1\" successfully removed from the bypass list.",
			listEmpty: "📜 The adminOnly bypass list is currently empty.",
			list: "📜 ── [ BYPASS LIST ] ──\n\n%1\n\nThese commands can be used by anyone even if adminOnly is active."
		},
		fr: {
			denied: "❌ Accès refusé. Seul le propriétaire du bot peut utiliser cette commande.",
			missingAdd: "⚠️ Veuillez spécifier le nom d'une commande à ajouter.",
			missingDel: "⚠️ Veuillez spécifier le nom d'une commande à retirer.",
			notFound: "❌ La commande \"%1\" n'existe pas dans le système.",
			already: "ℹ️ La commande \"%1\" est déjà dans la liste d'exception.",
			added: "✅ La commande \"%1\" ignore désormais le mode adminOnly.",
			notIn: "❌ La commande \"%1\" n'est pas dans la liste d'exception.",
			removed: "🧹 La commande \"%1\" a été retirée de la liste d'exception.",
			listEmpty: "📜 La liste d'exception adminOnly est actuellement vide.",
			list: "📜 ── [ LISTE D'EXCEPTION ] ──\n\n%1\n\nCes commandes sont accessibles à tous même si adminOnly est activé."
		}
	},

	onStart: async function ({ args, message, getLang, event, api }) {
		const { senderID, messageID } = event;

		// 👑 Vérification stricte du Propriétaire (Owner)
		if (senderID !== OWNER_UID) {
			return message.reply(getLang("denied"));
		}

		// Récupération dynamique de la configuration globale
		const configPath = global.client.dirConfig;
		const currentConfig = global.GoatBot.config;
		
		if (!currentConfig.adminOnly || !Array.isArray(currentConfig.adminOnly.ignoreCommand)) {
			return message.reply("❌ Error: GoatBot config structure for 'adminOnly.ignoreCommand' is invalid.");
		}

		const ignoreList = currentConfig.adminOnly.ignoreCommand;
		const action = args[0]?.toLowerCase();

		try {
			switch (action) {
				case "add": {
					if (!args[1]) return message.reply(getLang("missingAdd"));
					
					const cmd = args[1].toLowerCase();
					const commandExists = global.GoatBot.commands.has(cmd);

					if (!commandExists) return message.reply(getLang("notFound", cmd));
					if (ignoreList.includes(cmd)) return message.reply(getLang("already", cmd));

					// Ajout et sauvegarde synchrone de la référence réelle
					ignoreList.push(cmd);
					fs.writeFileSync(configPath, JSON.stringify(currentConfig, null, 4));

					api.setMessageReaction("✅", messageID);
					return message.reply(getLang("added", cmd));
				}

				case "del":
				case "remove":
				case "rm": {
					if (!args[1]) return message.reply(getLang("missingDel"));

					const cmd = args[1].toLowerCase();
					const index = ignoreList.indexOf(cmd);

					if (index === -1) return message.reply(getLang("notIn", cmd));

					// Retrait et sauvegarde synchrone de la référence réelle
					ignoreList.splice(index, 1);
					fs.writeFileSync(configPath, JSON.stringify(currentConfig, null, 4));

					api.setMessageReaction("✅", messageID);
					return message.reply(getLang("removed", cmd));
				}

				case "list": {
					if (ignoreList.length === 0) return message.reply(getLang("listEmpty"));
					
					const formattedList = ignoreList.map(item => `  • ${item}`).join("\n");
					return message.reply(getLang("list", formattedList));
				}

				default: {
					return message.SyntaxError();
				}
			}
		} catch (error) {
			console.error("[ERROR ignoreonlyad]:", error);
			return message.reply("❌ An error occurred while updating the configuration file.");
		}
	}
};
