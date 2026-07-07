const { getPrefix } = global.utils;

module.exports = {
	config: {
		name: "rules",
		version: "1.7",
		author: "NTKhang (Traduit & Fix par Shade)",
		countDown: 5,
		role: 2,
		description: {
			vi: "Tạo/xem/thêm/sửa/đổi vị trí/xóa nội quy nhóm của bạn",
			en: "Create/view/add/edit/change position/delete group rules of you",
			fr: "Créer/voir/ajouter/modifier/déplacer/supprimer les règles de votre groupe"
		},
		category: "utility",
		guide: {
			fr: "   {pn} [add | -a] <règle> : Ajouter une règle au groupe."
				+ "\n   {pn} : Voir les règles du groupe."
				+ "\n   {pn} [edit | -e] <numéro> <nouveau contenu> : Modifier une règle spécifique."
				+ "\n   {pn} [move | -m] <num1> <num2> : Échanger les positions de deux règles."
				+ "\n   {pn} [delete | -d] <numéro> : Supprimer une règle précise."
				+ "\n   {pn} [remove | -r] : Supprimer TOUTES les règles du groupe."
				+ "\n"
				+ "\n   Exemples :"
				+ "\n    {pn} add Pas de spam"
				+ "\n    {pn} move 1 3"
				+ "\n    {pn} -e 1 Ne pas spammer les messages ici"
				+ "\n    {pn} -r"
		}
	},

	langs: {
		fr: {
			yourRules: "📜 Règlement du groupe :\n%1",
			noRules: "Votre groupe n'a actuellement aucune règle. Pour en ajouter une, utilisez `%1rules add <texte>`",
			noPermissionAdd: "❌ Seuls les administrateurs peuvent ajouter des règles.",
			noContent: "⚠️ Veuillez entrer le contenu de la règle que vous souhaitez ajouter.",
			success: "✅ Nouvelle règle ajoutée avec succès !",
			noPermissionEdit: "❌ Seuls les administrateurs peuvent modifier le règlement.",
			invalidNumber: "⚠️ Veuillez entrer un numéro valide pour la règle à modifier.",
			rulesNotExist: "La règle numéro %1 n'existe pas.",
			numberRules: "Votre groupe possède actuellement %1 règle(s).",
			noContentEdit: "⚠️ Veuillez entrer le nouveau contenu pour la règle numéro %1.",
			successEdit: "📝 Règle numéro %1 modifiée avec succès : %2",
			noPermissionMove: "❌ Seuls les administrateurs peuvent changer l'ordre des règles.",
			invalidNumberMove: "⚠️ Veuillez spécifier les numéros des 2 règles à intervertir.",
			sameNumberMove: "Désolé, impossible d'échanger une règle avec elle-même.",
			rulesNotExistMove: "La règle numéro %1 n'existe pas.",
			rulesNotExistMove2: "Les règles numéros %1 et %2 n'existent pas.",
			successMove: "🔄 Positions des règles %1 et %2 inversées avec succès !",
			noPermissionDelete: "❌ Seuls les administrateurs peuvent supprimer une règle.",
			invalidNumberDelete: "⚠️ Veuillez entrer le numéro de la règle à supprimer.",
			rulesNotExistDelete: "La règle numéro %1 n'existe pas.",
			successDelete: "🗑️ Règle numéro %1 supprimée avec succès. Contenu précédent : %2",
			noPermissionRemove: "❌ Seuls les administrateurs principaux peuvent réinitialiser le règlement.",
			confirmRemove: "⚠️ Ajoutez une réaction (emoji) à ce message pour confirmer la suppression complète du règlement.",
			successRemove: "💥 Toutes les règles du groupe ont été supprimées avec succès.",
			invalidNumberView: "⚠️ Veuillez entrer un numéro valide pour voir cette règle."
		}
	},

	onStart: async function ({ role, args, message, event, threadsData, getLang, commandName }) {
		const { threadID, senderID } = event;
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
			if (role < 1)
				return message.reply(getLang("noPermissionAdd"));
			if (!args[1])
				return message.reply(getLang("noContent"));

			rulesOfThread.push(args.slice(1).join(" "));
			try {
				await threadsData.set(threadID, rulesOfThread, "data.rules");
				message.reply(getLang("success"));
			}
			catch (err) {
				message.err(err);
			}
		}
		else if (["edit", "-e"].includes(type)) {
			if (role < 1)
				return message.reply(getLang("noPermissionEdit"));
			
			const stt = parseInt(args[1]);
			if (isNaN(stt))
				return message.reply(getLang("invalidNumber"));
			if (!rulesOfThread[stt - 1])
				return message.reply(`${getLang("rulesNotExist", stt)}, ${totalRules == 0 ? getLang("noRules", getPrefix(threadID)) : getLang("numberRules", totalRules)}`);
			if (!args[2])
				return message.reply(getLang("noContentEdit", stt));

			const newContent = args.slice(2).join(" ");
			rulesOfThread[stt - 1] = newContent;
			try {
				await threadsData.set(threadID, rulesOfThread, "data.rules");
				message.reply(getLang("successEdit", stt, newContent));
			}
			catch (err) {
				message.err(err);
			}
		}
		else if (["move", "-m"].includes(type)) {
			if (role < 1)
				return message.reply(getLang("noPermissionMove"));

			const num1 = parseInt(args[1]);
			const num2 = parseInt(args[2]);

			if (isNaN(num1) || isNaN(num2))
				return message.reply(getLang("invalidNumberMove"));
			
			if (!rulesOfThread[num1 - 1] || !rulesOfThread[num2 - 1]) {
				let msg = "";
				if (!rulesOfThread[num1 - 1] && !rulesOfThread[num2 - 1]) {
					msg = getLang("rulesNotExistMove2", num1, num2);
				} else if (!rulesOfThread[num1 - 1]) {
					msg = getLang("rulesNotExistMove", num1);
				} else {
					msg = getLang("rulesNotExistMove", num2);
				}
				msg += `, ${totalRules == 0 ? getLang("noRules", getPrefix(threadID)) : getLang("numberRules", totalRules)}`;
				return message.reply(msg);
			}

			if (num1 == num2)
				return message.reply(getLang("sameNumberMove"));

			// Interversion (Swap)
			[rulesOfThread[num1 - 1], rulesOfThread[num2 - 1]] = [rulesOfThread[num2 - 1], rulesOfThread[num1 - 1]];
			try {
				await threadsData.set(threadID, rulesOfThread, "data.rules");
				message.reply(getLang("successMove", num1, num2));
			}
			catch (err) {
				message.err(err);
			}
		}
		else if (["delete", "del", "-d"].includes(type)) {
			if (role < 1)
				return message.reply(getLang("noPermissionDelete"));
			if (!args[1] || isNaN(args[1]))
				return message.reply(getLang("invalidNumberDelete"));

			const index = parseInt(args[1]) - 1;
			const rulesDel = rulesOfThread[index];
			if (!rulesDel)
				return message.reply(`${getLang("rulesNotExistDelete", args[1])}, ${totalRules == 0 ? getLang("noRules", getPrefix(threadID)) : getLang("numberRules", totalRules)}`);

			rulesOfThread.splice(index, 1);
			await threadsData.set(threadID, rulesOfThread, "data.rules");
			message.reply(getLang("successDelete", args[1], rulesDel));
		}
		else if (["remove", "reset", "-r", "-rm"].includes(type)) {
			if (role < 1)
				return message.reply(getLang("noPermissionRemove"));

			message.reply(getLang("confirmRemove"), (err, info) => {
				global.GoatBot.onReaction.set(info.messageID, {
					commandName: "rules",
					messageID: info.messageID,
					author: senderID
				});
			});
		}
		else if (!isNaN(type)) {
			let msg = "";
			for (const stt of args) {
				const rules = rulesOfThread[parseInt(stt) - 1];
				if (rules)
					msg += `${stt}. ${rules}\n`;
			}
			if (msg == "")
				return message.reply(`${getLang("rulesNotExist", type)}, ${totalRules == 0 ? getLang("noRules", getPrefix(threadID)) : getLang("numberRules", totalRules)}`);
			message.reply(msg);
		}
		else {
			message.SyntaxError();
		}
	},

	onReply: async function ({ message, event, getLang, Reply }) {
		const { author, rulesOfThread } = Reply;
		if (author != event.senderID)
			return;

		const num = parseInt(event.body || "");
		if (isNaN(num) || num < 1)
			return message.reply(getLang("invalidNumberView"));

		const totalRules = rulesOfThread.length;
		if (num > totalRules)
			return message.reply(`${getLang("rulesNotExist", num)}, ${totalRules == 0 ? getLang("noRules", getPrefix(event.threadID)) : getLang("numberRules", totalRules)}`);

		message.reply(`${num}. ${rulesOfThread[num - 1]}`, () => message.unsend(Reply.messageID));
	},

	onReaction: async ({ threadsData, message, Reaction, event, getLang }) => {
		const { author } = Reaction;
		const { threadID, userID } = event;
		if (author != userID)
			return;

		await threadsData.set(threadID, [], "data.rules");
		message.reply(getLang("successRemove"));
	}
};
