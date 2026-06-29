/**
 * @file adminonly.js
 * @description Active ou désactive le mode restreint aux administrateurs/propriétaires du bot.
 */

const fs = require("fs-extra");

module.exports = {
	config: {
		name: "adminonly",
		aliases: ["adonly", "onlyad", "onlyadmin"],
		version: "1.6.0",
		author: "NTKhang & Gemini",
		countDown: 5,
		role: 3, // Réservé aux administrateurs globaux / Owners
		description: {
			fr: "Activer ou désactiver le mode où seul l'admin peut utiliser le bot",
			en: "Turn on/off only admin can use bot"
		},
		category: "owner",
		guide: {
			fr: "{pn} [on | off] : Activer/Désactiver le mode admin unique\n{pn} noti [on | off] : Activer/Désactiver les notifications de refus",
			en: "{pn} [on | off] : Turn on/off only admin mode\n{pn} noti [on | off] : Turn on/off access denied notifications"
		}
	},

	langs: {
		fr: {
			turnedOn: "✅ Le mode 'Seul l'administrateur peut utiliser le bot' est désormais ACTIVÉ.",
			turnedOff: "✅ Le mode 'Seul l'administrateur peut utiliser le bot' est désormais DÉSACTIVÉ.",
			turnedOnNoti: "🔔 Les notifications d'avertissement pour les non-admins sont désormais ACTIVÉES.",
			turnedOffNoti: "🔕 Les notifications d'avertissement pour les non-admins sont désormais DÉSACTIVÉES."
		},
		en: {
			turnedOn: "✅ The mode 'Only admin can use the bot' has been ENABLED.",
			turnedOff: "✅ The mode 'Only admin can use the bot' has been DISABLED.",
			turnedOnNoti: "🔔 Access denied notifications for non-admin users have been ENABLED.",
			turnedOffNoti: "🔕 Access denied notifications for non-admin users have been DISABLED."
		}
	},

	onStart: async function ({ args, message, getLang }) {
		const configPath = global.client.dirConfig;
		const currentConfig = global.GoatBot.config;

		// Sécurité : S'assurer que la structure de base existe dans le fichier config
		if (!currentConfig.adminOnly) currentConfig.adminOnly = {};
		if (!currentConfig.hideNotiMessage) currentConfig.hideNotiMessage = {};

		let isSetNoti = false;
		let value;
		let indexGetVal = 0;

		// Vérification de l'argument 'noti'
		if (args[0]?.toLowerCase() === "noti") {
			isSetNoti = true;
			indexGetVal = 1;
		}

		const action = args[indexGetVal]?.toLowerCase();

		if (action === "on") {
			value = true;
		} else if (action === "off") {
			value = false;
		} else {
			return message.SyntaxError();
		}

		try {
			if (isSetNoti) {
				// Dans GoatBot, masquer la notification (hideNoti) est l'inverse de l'activation de la notification
				currentConfig.hideNotiMessage.adminOnly = !value;
				message.reply(getLang(value ? "turnedOnNoti" : "turnedOffNoti"));
			} else {
				currentConfig.adminOnly.enable = value;
				message.reply(getLang(value ? "turnedOn" : "turnedOff"));
			}

			// Sauvegarde synchrone et sécurisée dans le fichier global
			fs.writeFileSync(configPath, JSON.stringify(currentConfig, null, 4));
		} catch (error) {
			console.error("[ERROR adminonly]:", error);
			return message.reply("❌ Une erreur est survenue lors de la réécriture du fichier de configuration.");
		}
	}
};
