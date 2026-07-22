const { getPrefix } = global.utils;

module.exports = {
	config: {
		name: "rules",
		version: "2.0",
		author: "NTKhang & Gemini",
		countDown: 5,
		role: 0,
		description: {
			fr: "Créer/voir/ajouter/modifier/supprimer les règles du groupe et sanctionner les membres.",
			en: "Create/view/add/edit/delete group rules and sanction members."
		},
		category: "admin",
		guide: {
			fr: "   {pn}: voir les règles du groupe."
				+ "\n   {pn} <n°>: afficher la règle n°n (ou répondre au message d'un membre avec {pn} <n°> pour le sanctionner 24h)."
				+ "\n   {pn} [add | -a] <règle>: ajouter une règle."
				+ "\n   {pn} [edit | -e] <n> <contenu>: modifier la règle n°n."
				+ "\n   {pn} [move | -m] <n1> <n2>: échanger les règles n1 et n2."
				+ "\n   {pn} [delete | -d] <n>: supprimer la règle n°n."
				+ "\n   {pn} [remove | -r]: supprimer toutes les règles.",
			en: "   {pn}: view group rules."
				+ "\n   {pn} <n>: view rule n (or reply to a user to sanction them for 24h)."
				+ "\n   {pn} [add | -a] <rule>: add a rule."
				+ "\n   {pn} [edit | -e] <n> <content>: edit rule n."
				+ "\n   {pn} [move | -m] <n1> <n2>: swap rules n1 and n2."
				+ "\n   {pn} [delete | -d] <n>: delete rule n."
				+ "\n   {pn} [remove | -r]: delete all rules."
		}
	},

	langs: {
		fr: {
			yourRules: "Règles de votre groupe :\n%1",
			noRules: "Votre groupe n'a actuellement aucune règle. Utilisez `%1rules add` pour en ajouter.",
			noPermissionAdd: "Seuls les administrateurs peuvent ajouter des règles.",
			noContent: "Veuillez entrer le contenu de la règle.",
			success: "Nouvelle règle ajoutée avec succès.",
			noPermissionEdit: "Seuls les administrateurs peuvent modifier les règles.",
			invalidNumber: "Veuillez entrer un numéro de règle valide.",
			rulesNotExist: "La règle n°%1 n'existe pas.",
			numberRules: "Actuellement, le groupe a %1 règle(s).",
			noContentEdit: "Veuillez entrer le nouveau contenu.",
			successEdit: "La règle n°%1 a été modifiée.",
			noPermissionMove: "Seuls les administrateurs peuvent déplacer les règles.",
			invalidNumberMove: "Veuillez entrer 2 numéros de règles valides.",
			sameNumberMove: "Impossible d'échanger deux règles identiques.",
			rulesNotExistMove2: "Les règles n°%1 et n°%2 n'existent pas.",
			rulesNotExistMove: "La règle n°%1 n'existe pas.",
			successMove: "Les règles n°%1 et n°%2 ont été échangées.",
			noPermissionDelete: "Seuls les administrateurs peuvent supprimer des règles.",
			invalidNumberDelete: "Veuillez entrer le numéro de la règle à supprimer.",
			rulesNotExistDelete: "La règle n°%1 n'existe pas.",
			successDelete: "La règle n°%1 a été supprimée.",
			noPermissionRemove: "Seuls les administrateurs peuvent supprimer toutes les règles.",
			confirmRemove: "⚠️ Réagissez à ce message pour reconfirmer la suppression de toutes les règles.",
			successRemove: "Toutes les règles ont été supprimées.",
			invalidNumberView: "Veuillez entrer un numéro de règle valide.",
			noPermissionSanction: "Seuls les administrateurs peuvent sanctionner un membre.",
			sanctionSuccess: "⛔ **SANCTION APPLIQUÉE !**\n\n👤 Member : %1\n📜 Règle enfreinte n°%2 : %3\n⏰ Sanction : Mute complet de 24 heures. Tes messages seront automatiquement effacés !"
		},
		en: {
			yourRules: "Your group rules\n%1",
			noRules: "Your group has no rules. Use `%1rules add` to add one.",
			noPermissionAdd: "Only admins can add rules.",
			noContent: "Please enter the rule content.",
			success: "New rule added successfully.",
			noPermissionEdit: "Only admins can edit rules.",
			invalidNumber: "Please enter a valid rule number.",
			rulesNotExist: "Rule %1 does not exist.",
			numberRules: "Your group has %1 rule(s).",
			noContentEdit: "Please enter new content.",
			successEdit: "Rule %1 has been edited.",
			noPermissionMove: "Only admins can move rules.",
			invalidNumberMove: "Please enter 2 valid numbers.",
			sameNumberMove: "Cannot swap identical rules.",
			rulesNotExistMove2: "Rules %1 and %2 do not exist.",
			rulesNotExistMove: "Rule %1 does not exist.",
			successMove: "Rules %1 and %2 swapped.",
			noPermissionDelete: "Only admins can delete rules.",
			invalidNumberDelete: "Please enter rule number to delete.",
			rulesNotExistDelete: "Rule %1 does not exist.",
			successDelete: "Rule %1 deleted.",
			noPermissionRemove: "Only admins can remove all rules.",
			confirmRemove: "⚠️ React to this message to confirm deletion.",
			successRemove: "All rules removed.",
			invalidNumberView: "Please enter a valid rule number.",
			noPermissionSanction: "Only admins can sanction a member.",
			sanctionSuccess: "⛔ **SANCTION APPLIED!**\n\n👤 User: %1\n📜 Rule broken #%2: %3\n⏰ Penalty: 24h Mute. Your messages will be deleted automatically!"
		}
	},

	// Intercepteur de chat : supprime les messages des membres sanctionnés en temps réel
	onChat: async function ({ api, event, threadsData }) {
		const { threadID, senderID, messageID } = event;
		const mutedUsers = await threadsData.get(threadID, "data.mutedUsers", {});

		if (mutedUsers[senderID]) {
			const expireTime = mutedUsers[senderID];
			if (Date.now() < expireTime) {
				// Supprime le message immédiatement
				try {
					await api.unsendMessage(messageID);
				} catch (e) {
					console.error("Erreur lors de la suppression du message Mute:", e.message);
				}
			} else {
				// La sanction est expirée, on nettoie la base de données
				delete mutedUsers[senderID];
				await threadsData.set(threadID, mutedUsers, "data.mutedUsers");
			}
		}
	},

	onStart: async function ({ role, args, message, event, threadsData, usersData, getLang, commandName, api }) {
		const { threadID, senderID, messageReply } = event;
		const type = args[0];
		const rulesOfThread = await threadsData.get(threadID, "data.rules", []);
		const totalRules = rulesOfThread.length;

		if (!type) {
			let i = 1;
			const msg = rulesOfThread.reduce((text, rules) => text += `${i++}. ${rules}\n`, "");
			message.reply(msg ? getLang("yourRules", msg) : getLang("noRules", getPrefix(threadID)), (err, info) => {
				global.GoatBot.onReply.set(info.messageID, {
					commandName,
					author: senderID,
					rulesOfThread,
					messageID: info.messageID
				});
			});
		}
		else if (["add", "-a"].includes(type)) {
			if (role < 1) return message.reply(getLang("noPermissionAdd"));
			if (!args[1]) return message.reply(getLang("noContent"));
			rulesOfThread.push(args.slice(1).join(" "));
			try {
				await threadsData.set(threadID, rulesOfThread, "data.rules");
				message.reply(getLang("success"));
			} catch (err) {
				message.err(err);
			}
		}
		else if (["edit", "-e"].includes(type)) {
			if (role < 1) return message.reply(getLang("noPermissionEdit"));
			const stt = parseInt(args[1]);
			if (isNaN(stt)) return message.reply(getLang("invalidNumber"));
			if (!rulesOfThread[stt - 1]) return message.reply(`${getLang("rulesNotExist", stt)}, ${totalRules == 0 ? getLang("noRules") : getLang("numberRules", totalRules)}`);
			if (!args[2]) return message.reply(getLang("noContentEdit", stt));
			const newContent = args.slice(2).join(" ");
			rulesOfThread[stt - 1] = newContent;
			try {
				await threadsData.set(threadID, rulesOfThread, "data.rules");
				message.reply(getLang("successEdit", stt, newContent));
			} catch (err) {
				message.err(err);
			}
		}
		else if (["move", "-m"].includes(type)) {
			if (role < 1) return message.reply(getLang("noPermissionMove"));
			const num1 = parseInt(args[1]);
			const num2 = parseInt(args[2]);
			if (isNaN(num1) || isNaN(num2)) return message.reply(getLang("invalidNumberMove"));
			if (!rulesOfThread[num1 - 1] || !rulesOfThread[num2 - 1]) {
				let msg = !rulesOfThread[num1 - 1] ?
					!rulesOfThread[num2 - 1] ?
						getLang("rulesNotExistMove2", num1, num2) :
						getLang("rulesNotExistMove", num1) :
					getLang("rulesNotExistMove", num2);
				msg += `, ${totalRules == 0 ? getLang("noRules") : getLang("numberRules", totalRules)}`;
				return message.reply(msg);
			}
			if (num1 == num2) return message.reply(getLang("sameNumberMove"));
			[rulesOfThread[num1 - 1], rulesOfThread[num2 - 1]] = [rulesOfThread[num2 - 1], rulesOfThread[num1 - 1]];
			try {
				await threadsData.set(threadID, rulesOfThread, "data.rules");
				message.reply(getLang("successMove", num1, num2));
			} catch (err) {
				message.err(err);
			}
		}
		else if (["delete", "del", "-d"].includes(type)) {
			if (role < 1) return message.reply(getLang("noPermissionDelete"));
			if (!args[1] || isNaN(args[1])) return message.reply(getLang("invalidNumberDelete"));
			const rulesDel = rulesOfThread[parseInt(args[1]) - 1];
			if (!rulesDel) return message.reply(`${getLang("rulesNotExistDelete", args[1])}, ${totalRules == 0 ? getLang("noRules") : getLang("numberRules", totalRules)}`);
			rulesOfThread.splice(parseInt(args[1]) - 1, 1);
			await threadsData.set(threadID, rulesOfThread, "data.rules");
			message.reply(getLang("successDelete", args[1], rulesDel));
		}
		else if (["remove", "reset", "-r", "-rm"].includes(type)) {
			if (role < 1) return message.reply(getLang("noPermissionRemove"));
			message.reply(getLang("confirmRemove"), (err, info) => {
				global.GoatBot.onReaction.set(info.messageID, {
					commandName: "rules",
					messageID: info.messageID,
					author: senderID
				});
			});
		}
		else if (!isNaN(type)) {
			const ruleIndex = parseInt(type) - 1;
			const ruleContent = rulesOfThread[ruleIndex];

			if (!ruleContent) {
				return message.reply(`${getLang("rulesNotExist", type)}, ${totalRules == 0 ? getLang("noRules") : getLang("numberRules", totalRules)}`);
			}

			// CAS SPECIFIQUE : Reply au message d'une personne pour lui donner une sanction 24h
			if (messageReply) {
				if (role < 1) return message.reply(getLang("noPermissionSanction"));
				const targetID = messageReply.senderID;
				const targetName = await usersData.getName(targetID);

				// Appliquer le Mute de 24 Heures (24 * 60 * 60 * 1000 ms)
				const mutedUsers = await threadsData.get(threadID, "data.mutedUsers", {});
				const expireTime = Date.now() + (24 * 60 * 60 * 1000);
				mutedUsers[targetID] = expireTime;

				await threadsData.set(threadID, mutedUsers, "data.mutedUsers");

				return message.reply(getLang("sanctionSuccess", targetName, type, ruleContent));
			}

			// Sinon, affichage classique de la règle
			let msg = "";
			for (const stt of args) {
				const rules = rulesOfThread[parseInt(stt) - 1];
				if (rules) msg += `${stt}. ${rules}\n`;
			}
			message.reply(msg);
		}
		else {
			message.SyntaxError();
		}
	},

	onReply: async function ({ message, event, getLang, Reply }) {
		const { author, rulesOfThread } = Reply;
		if (author != event.senderID) return;
		const num = parseInt(event.body || "");
		if (isNaN(num) || num < 1) return message.reply(getLang("invalidNumberView"));
		const totalRules = rulesOfThread.length;
		if (num > totalRules) return message.reply(`${getLang("rulesNotExist", num)}, ${totalRules == 0 ? getLang("noRules") : getLang("numberRules", totalRules)}`);
		message.reply(`${num}. ${rulesOfThread[num - 1]}`, () => message.unsend(Reply.messageID));
	},

	onReaction: async ({ threadsData, message, Reaction, event, getLang }) => {
		const { author } = Reaction;
		const { threadID, userID } = event;
		if (author != userID) return;
		await threadsData.set(threadID, [], "data.rules");
		message.reply(getLang("successRemove"));
	}
};
