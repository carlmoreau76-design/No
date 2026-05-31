const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");

module.exports = {
	config: {
		name: "pin",
		version: "1.0 angel kawaii",
		author: "Shade ✨ Angel Edit",
		countDown: 5,
		role: 0,
		shortDescription: "💖 Pinterest-style image grid viewer",
		longDescription: "🌸 Affiche une grille d'images comme Pinterest et permet sélection U1-U35",
		category: "🌸 générateur d'images",
		guide: "{p}pin <recherche> <nombre max 1-35>"
	},

	onStart: async function ({ message, args, event }) {

		const query = args.slice(0, -1).join(" ");
		let limit = parseInt(args[args.length - 1]);

		if (!query || isNaN(limit)) {
			return message.reply(
`🌸💖 Pinterest Angel

Utilisation:
!pin Naruto 10

✨ max: 35`
			);
		}

		if (limit > 35) limit = 35;
		if (limit < 1) limit = 1;

		const loading = await message.reply("💖🌸 Pinterest Angel recherche tes images... ⏳");

		try {

			// 🔥 API images (tu peux changer si tu veux une autre source)
			const api = `https://api.lolhuman.xyz/api/pinterest?apikey=free&query=${encodeURIComponent(query)}`;
			const res = await axios.get(api);

			const images = (res.data.result || []).slice(0, limit);

			if (!images.length) {
				return message.reply("💔✨ Aucun résultat trouvé Angel...");
			}

			const cache = path.join(__dirname, "cache");
			await fs.ensureDir(cache);

			// 🎨 GRID CONFIG
			const size = 250;
			const cols = 5;
			const canvas = createCanvas(size * cols, size * Math.ceil(images.length / cols));
			const ctx = canvas.getContext("2d");

			ctx.fillStyle = "#1e1e2f";
			ctx.fillRect(0, 0, canvas.width, canvas.height);

			const downloaded = [];

			for (let i = 0; i < images.length; i++) {

				const imgUrl = images[i];
				const filePath = path.join(cache, `pin_${Date.now()}_${i}.jpg`);

				const img = await axios({ url: imgUrl, responseType: "stream" });
				await new Promise((res, rej) => {
					const stream = fs.createWriteStream(filePath);
					img.data.pipe(stream);
					stream.on("finish", res);
					stream.on("error", rej);
				});

				downloaded.push(filePath);

				const image = await loadImage(filePath);

				const x = (i % cols) * size;
				const y = Math.floor(i / cols) * size;

				ctx.drawImage(image, x, y, size, size);

				// 🎀 NUMBER LABEL
				ctx.fillStyle = "rgba(0,0,0,0.6)";
				ctx.fillRect(x, y, 40, 40);

				ctx.fillStyle = "#fff";
				ctx.font = "20px Arial";
				ctx.fillText(`${i + 1}`, x + 12, y + 25);
			}

			const outPath = path.join(cache, `pin_${Date.now()}_grid.jpg`);
			fs.writeFileSync(outPath, canvas.toBuffer("image/jpeg"));

			await message.reply({
				body:
`💖🌸 Pinterest Angel

🔎 Recherche: ${query}
📦 Résultats: ${images.length} / max 35

👉 Reply avec un numéro (1-${images.length})`,
				attachment: fs.createReadStream(outPath)
			}, (err, info) => {

				global.GoatBot.onReply.set(info.messageID, {
					commandName: this.config.name,
					author: event.senderID,
					images: downloaded
				});
			});

			await message.unsend(loading.messageID);

		} catch (e) {
			await message.unsend(loading.messageID);
			message.reply("💔✨ Erreur Pinterest Angel...");
		}
	},

	onReply: async function ({ event, Reply, message, args }) {

		if (event.senderID !== Reply.author) return;

		const index = parseInt(args[0]) - 1;

		if (!Reply.images[index]) {
			return message.reply("💔✨ Numéro invalide Angel...");
		}

		return message.reply({
			body: `💖🌸 Image Pinterest #${index + 1}`,
			attachment: fs.createReadStream(Reply.images[index])
		});
	}
};
