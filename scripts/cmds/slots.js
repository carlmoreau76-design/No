const DAILY_LIMIT = 20;
const MAX_BET = 6000000;

module.exports = {
	config: {
		name: "slots",
		aliases: ["slot"],
		version: "2.0",
		author: "Christus × Shade Angel edit",
		countDown: 8,
		role: 0,
		description: "🎰 Angel Slot Machine (BANK LINKED)",
		category: "game"
	},

	onStart: async function ({ message, event, args, usersData }) {
		const { senderID } = event;
		const bet = parseInt(args[0]);

		const user = await usersData.get(senderID);

		// 🏦 BANK INIT SAFE
		if (!user.data.bank) {
			user.data.bank = {
				wallet: 0,
				balance: 0,
				cardNumber: null,
				transactions: [],
				loan: 0
			};
		}

		const formatMoney = (amount) => {
			if (isNaN(amount)) return "💲0";
			const scales = [
				{ value: 1e12, suffix: 'T', color: '✨' },
				{ value: 1e9, suffix: 'B', color: '💎' },
				{ value: 1e6, suffix: 'M', color: '💰' },
				{ value: 1e3, suffix: 'k', color: '💵' }
			];
			const scale = scales.find(s => amount >= s.value);
			if (scale) {
				return `${scale.color}${(amount / scale.value).toFixed(2)}${scale.suffix}`;
			}
			return `💲${amount.toLocaleString()}`;
		};

		if (isNaN(bet) || bet <= 0)
			return message.reply("❌ Invalid bet amount!");

		if (bet > MAX_BET)
			return message.reply(`🚫 Max bet is ${formatMoney(MAX_BET)}`);

		// 🏦 USE BANK WALLET
		const wallet = user.data.bank.wallet || 0;

		if (wallet < bet)
			return message.reply(`❌ Not enough money in BANK wallet!`);

		// 📅 DAILY LIMIT
		const today = new Date().toISOString().split("T")[0];

		const last = user.data.slotsDay || "";
		const count = user.data.slotsCount || 0;

		const sameDay = today === last;
		const used = sameDay ? count : 0;

		if (used >= DAILY_LIMIT)
			return message.reply(`⏳ Daily limit reached (${DAILY_LIMIT})`);

		// 🎰 SYMBOLS
		const symbols = [
			{ emoji: "🍒", weight: 30 },
			{ emoji: "🍋", weight: 25 },
			{ emoji: "🍇", weight: 20 },
			{ emoji: "🍉", weight: 15 },
			{ emoji: "⭐", weight: 7 },
			{ emoji: "7️⃣", weight: 3 }
		];

		const roll = () => {
			let total = symbols.reduce((a, b) => a + b.weight, 0);
			let r = Math.random() * total;
			for (const s of symbols) {
				if (r < s.weight) return s.emoji;
				r -= s.weight;
			}
		};

		const s1 = roll();
		const s2 = roll();
		const s3 = roll();

		let win = 0;
		let result = "";
		let bonus = "";

		// 💎 WIN LOGIC
		if (s1 === "7️⃣" && s2 === "7️⃣" && s3 === "7️⃣") {
			win = bet * 10;
			result = "💎 ANGEL JACKPOT x10!";
			bonus = "✨ Divine Blessing Activated!";
			user.data.bank.wallet *= 1.03;
		} else if (s1 === s2 && s2 === s3) {
			win = bet * 5;
			result = "💰 TRIPLE MATCH!";
		} else if (s1 === s2 || s2 === s3 || s1 === s3) {
			win = bet * 2;
			result = "✨ DOUBLE MATCH!";
		} else if (Math.random() < 0.4) {
			win = bet * 1.5;
			result = "🍀 Lucky Spin!";
		} else {
			win = -bet;
			result = "💸 Lost spin...";
		}

		// 🏦 APPLY BANK BALANCE
		user.data.bank.wallet += win;

		// 📊 SAVE LIMITS
		user.data.slotsDay = today;
		user.data.slotsCount = used + 1;

		await usersData.set(senderID, {
			money: user.data.bank.wallet,
			data: user.data
		});

		const ui =
`🏦 ❲ 𝗔𝗡𝗚𝗘𝗟 𝗦𝗟𝗢𝗧𝗦 ❳ 🏦
━━━━━━━━━━━━━━━

🎰 [ ${s1} | ${s2} | ${s3} ]

━━━━━━━━━━━━━━━
🎯 RESULT: ${result}
${bonus ? `💫 ${bonus}` : ""}

💰 CHANGE: ${win >= 0 ? "+" : ""}${formatMoney(win)}
🏦 BANK: ${formatMoney(user.data.bank.wallet)}

🎮 SPINS: ${used + 1}/${DAILY_LIMIT}
━━━━━━━━━━━━━━━`;

		return message.reply(ui);
	}
};
