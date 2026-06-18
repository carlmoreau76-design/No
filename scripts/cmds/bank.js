const cooldowns = new Map();

module.exports = {
    config: {
        name: "bank",
        version: "2.5.0",
        author: "AI Collaborator",
        countDown: 5,
        role: 0, // 0 = Tous les utilisateurs, 1 = Admin du groupe, 2 = Admin du bot
        description: "SystÃ¨me bancaire et Ã©conomique ultra-complet (Banque, Bourse, Immobilier, Crimes, Business)",
        category: "Ã‰conomie",
        guide: {
            en: "{p}{n} [register/balance/deposit/withdraw/transfer/daily/work/loan/repay/rob/invest/business/property/shop/achievements/history/vault]",
            fr: "{p}{n} [register/balance/deposit/withdraw/transfer/daily/work/loan/repay/rob/invest/business/property/shop/achievements/history/vault]"
        }
    },

    onStart: async function ({ api, event, args, usersData }) {
        const { threadID, messageID, senderID } = event;
        const subCommand = args[0]?.toLowerCase();

        // 1. Initialisation et rÃ©cupÃ©ration des donnÃ©es du joueur
        let userData = await usersData.get(senderID);
        if (!userData) {
            return api.sendMessage("âŒ Impossible de charger vos donnÃ©es utilisateur.", threadID, messageID);
        }

        // Structure Ã©conomique personnalisÃ©e intÃ©grÃ©e dans usersData
        if (!userData.bankSystem) {
            userData.bankSystem = {
                cash: 500,
                bank: 0,
                vault: 0,
                vaultInsurance: false,
                creditScore: 600,
                loan: 0,
                lastDaily: 0,
                lastWork: 0,
                lastRob: 0,
                history: [],
                investments: { stocks: 0, crypto: 0, bonds: 0 },
                business: { owned: false, name: "", level: 0, lastCollect: 0 },
                properties: [],
                inventory: { vehicles: [], luxury: [] },
                achievements: { workCount: 0, successfulRobs: 0 },
                reputation: 100
            };
            await usersData.set(senderID, userData);
        }

        const eco = userData.bankSystem;

        // Fonction utilitaire pour ajouter l'historique
        const addHistory = (type, amount, details) => {
            if (!eco.history) eco.history = [];
            eco.history.unshift({
                date: new Date().toISOString().split('T')[0],
                type,
                amount,
                details
            });
            if (eco.history.length > 10) eco.history.pop(); // Garder les 10 derniers
        };

        // 2. Gestion des sous-commandes
        switch (subCommand) {
            
            case "register": {
                return api.sendMessage("âœ… Votre compte bancaire et votre dossier financier sont dÃ©jÃ  opÃ©rationnels !", threadID, messageID);
            }

            case "balance":
            case "bal": {
                const totalText = `ðŸ¦ [ DOSSIER FINANCIER - U${senderID} ] ðŸ¦\n` +
                    `ðŸ’µ Cash : ${eco.cash} $\n` +
                    `ðŸ›ï¸ Banque : ${eco.bank} $\n` +
                    `ðŸ”’ Coffre-fort : ${eco.vault} $ ${eco.vaultInsurance ? "(AssurÃ© ðŸ›¡ï¸)" : "(Non assurÃ© âš ï¸)"}\n` +
                    `ðŸ’³ Score de CrÃ©dit : ${eco.creditScore}/850\n` +
                    `ðŸ“‰ Dette de PrÃªt : ${eco.loan} $\n` +
                    `ðŸŒŸ RÃ©putation : ${eco.reputation}/200`;
                return api.sendMessage(totalText, threadID, messageID);
            }

            case "deposit":
            case "dep": {
                const amountInput = args[1];
                if (!amountInput) return api.sendMessage("âš ï¸ SpÃ©cifiez un montant ou 'all'.", threadID, messageID);
                
                let amount = amountInput === "all" ? eco.cash : parseInt(amountInput);
                if (isNaN(amount) || amount <= 0) return api.sendMessage("âŒ Montant invalide.", threadID, messageID);
                if (eco.cash < amount) return api.sendMessage("âŒ Vous n'avez pas assez de cash.", threadID, messageID);

                eco.cash -= amount;
                eco.bank += amount;
                addHistory("DÃ©pÃ´t", amount, "DÃ©pÃ´t en banque");
                await usersData.set(senderID, userData);
                return api.sendMessage(`âœ… Vous avez dÃ©posÃ© ${amount} $ sur votre compte bancaire.`, threadID, messageID);
            }

            case "withdraw":
            case "wd": {
                const amountInput = args[1];
                if (!amountInput) return api.sendMessage("âš ï¸ SpÃ©cifiez un montant ou 'all'.", threadID, messageID);
                
                let amount = amountInput === "all" ? eco.bank : parseInt(amountInput);
                if (isNaN(amount) || amount <= 0) return api.sendMessage("âŒ Montant invalide.", threadID, messageID);
                if (eco.bank < amount) return api.sendMessage("âŒ Solde bancaire insuffisant.", threadID, messageID);

                eco.bank -= amount;
                eco.cash += amount;
                addHistory("Retrait", amount, "Retrait de la banque");
                await usersData.set(senderID, userData);
                return api.sendMessage(`âœ… Vous avez retirÃ© ${amount} $ de votre compte bancaire.`, threadID, messageID);
            }

            case "transfer": {
                const targetID = args[1];
                const amount = parseInt(args[2]);
                if (!targetID || isNaN(amount) || amount <= 0) {
                    return api.sendMessage("âš ï¸ Utilisation: bank transfer [ID_Utilisateur] [Montant]", threadID, messageID);
                }
                if (eco.bank < amount) return api.sendMessage("âŒ Solde bancaire insuffisant pour ce virement.", threadID, messageID);

                let targetData = await usersData.get(targetID);
                if (!targetData) return api.sendMessage("âŒ Utilisateur cible introuvable.", threadID, messageID);
                if (!targetData.bankSystem) return api.sendMessage("âŒ La cible n'a pas encore ouvert de compte bancaire.", threadID, messageID);

                eco.bank -= amount;
                targetData.bankSystem.bank += amount;

                addHistory("Transfert", -amount, `Vers l'utilisateur ${targetID}`);
                targetData.bankSystem.history.unshift({
                    date: new Date().toISOString().split('T')[0],
                    type: "Transfert",
                    amount: amount,
                    details: `ReÃ§u de l'utilisateur ${senderID}`
                });

                await usersData.set(senderID, userData);
                await usersData.set(targetID, targetData);
                return api.sendMessage(`âœ… Virement rÃ©ussi de ${amount} $ vers l'utilisateur ${targetID}.`, threadID, messageID);
            }

            case "daily": {
                const now = Date.now();
                if (now - eco.lastDaily < 86400000) {
                    const remaining = 86400000 - (now - eco.lastDaily);
                    const hours = Math.floor(remaining / 3600000);
                    return api.sendMessage(`â³ Vous avez dÃ©jÃ  rÃ©cupÃ©rÃ© votre bonus quotidien. Revenez dans ${hours}h.`, threadID, messageID);
                }
                const dailyReward = 1500;
                eco.cash += dailyReward;
                eco.lastDaily = now;
                addHistory("Daily", dailyReward, "RÃ©compense quotidienne");
                await usersData.set(senderID, userData);
                return api.sendMessage(`ðŸŽ RÃ©compense quotidienne rÃ©cupÃ©rÃ©e ! Vous gagnez ${dailyReward} $.`, threadID, messageID);
            }

            case "work": {
                const now = Date.now();
                if (now - eco.lastWork < 1800000) { // 30 mins cooldown
                    return api.sendMessage("â³ Vous Ãªtes fatiguÃ©. Attendez 30 minutes entre chaque session de travail.", threadID, messageID);
                }
                const salary = Math.floor(Math.random() * (600 - 250 + 1)) + 250;
                eco.cash += salary;
                eco.lastWork = now;
                eco.achievements.workCount = (eco.achievements.workCount || 0) + 1;
                
                // AmÃ©lioration du score de crÃ©dit via le travail rÃ©gulier
                if (eco.creditScore < 850) eco.creditScore = Math.min(850, eco.creditScore + 2);

                addHistory("Travail", salary, "Salaire reÃ§u");
                await usersData.set(senderID, userData);
                return api.sendMessage(`ðŸ› ï¸ Vous avez travaillÃ© dur et touchÃ© un salaire de ${salary} $. Votre score de crÃ©dit s'amÃ©liore lÃ©gÃ¨rement.`, threadID, messageID);
            }

                case "loan": {
                const action = args[1]?.toLowerCase();
                if (action === "request") {
                    if (eco.loan > 0) return api.sendMessage(`âŒ Vous avez dÃ©jÃ  un prÃªt actif de ${eco.loan} $ Ã  rembourser d'abord.`, threadID, messageID);
                    
                    // Calcul de la capacitÃ© d'emprunt basÃ©e sur le credit score
                    let maxLoan = Math.floor((eco.creditScore * 50));
                    const amount = parseInt(args[2]);

                    if (isNaN(amount) || amount <= 0 || amount > maxLoan) {
                        return api.sendMessage(`âš ï¸ Montant invalide. BasÃ© sur votre score de crÃ©dit (${eco.creditScore}), votre limite d'emprunt est de ${maxLoan} $.`, threadID, messageID);
                    }

                    eco.loan = Math.floor(amount * 1.15); // 15% d'intÃ©rÃªts imposÃ©s
                    eco.bank += amount;
                    addHistory("PrÃªt", amount, "PrÃªt bancaire contractÃ© (+15% intÃ©rÃªt)");
                    await usersData.set(senderID, userData);
                    return api.sendMessage(`ðŸ›ï¸ PrÃªt accordÃ© ! ${amount} $ ajoutÃ©s Ã  votre banque. Vous devez rembourser un total de ${eco.loan} $.`, threadID, messageID);
                } else {
                    return api.sendMessage("âš ï¸ Utilisez: `bank loan request [montant]` pour demander un prÃªt.", threadID, messageID);
                }
            }

            case "repay": {
                const amountInput = args[1];
                if (!eco.loan || eco.loan <= 0) return api.sendMessage("âŒ Vous n'avez aucune dette active.", threadID, messageID);
                
                let amount = amountInput === "all" ? eco.loan : parseInt(amountInput);
                if (isNaN(amount) || amount <= 0) return api.sendMessage("âŒ Indiquez un montant valide.", threadID, messageID);
                if (eco.cash < amount) return api.sendMessage("âŒ Vous n'avez pas assez de cash sur vous pour ce remboursement.", threadID, messageID);

                if (amount > eco.loan) amount = eco.loan;

                eco.cash -= amount;
                eco.loan -= amount;

                if (eco.loan === 0) {
                    eco.creditScore = Math.min(850, eco.creditScore + 40); // Gros bonus de score si dette Ã©teinte
                }

                addHistory("Dette", -amount, "Remboursement prÃªt");
                await usersData.set(senderID, userData);
                return api.sendMessage(`âœ… Vous avez remboursÃ© ${amount} $. Dette restante : ${eco.loan} $. Your credit score updated.`, threadID, messageID);
            }

            case "leaderboard":
            case "lb": {
                // RÃ©cupÃ©ration globale simplifiÃ©e via le gestionnaire global de GoatBot
                const allUsers = await usersData.getAll();
                let leaders = [];

                for (const u of allUsers) {
                    if (u.data?.bankSystem) {
                        const totalWorth = (u.data.bankSystem.cash || 0) + (u.data.bankSystem.bank || 0) + (u.data.bankSystem.vault || 0);
                        leaders.push({ id: u.userID, name: u.name || `Utilisateur ${u.userID}`, total: totalWorth });
                    }
                }

                leaders.sort((a, b) => b.total - a.total);
                let lbText = "ðŸ† â”€â”€ [ LEADERBOARD DES PLUS RICHES ] â”€â”€ ðŸ†\n\n";
                leaders.slice(0, 10).forEach((user, index) => {
                    lbText += `${index + 1}. ${user.name} - ${user.total} $\n`;
                });
                return api.sendMessage(lbText, threadID, messageID);
            }

            case "rob": {
                const targetID = args[1];
                if (!targetID || targetID === senderID) return api.sendMessage("âš ï¸ SpÃ©cifiez l'ID d'une cible valide.", threadID, messageID);

                const now = Date.now();
                if (now - eco.lastRob < 3600000) {
                    return api.sendMessage("â³ Votre jauge de suspicion est trop Ã©levÃ©e. Attendez 1 heure.", threadID, messageID);
                }

                let targetData = await usersData.get(targetID);
                if (!targetData || !targetData.bankSystem) return api.sendMessage("âŒ Cible introuvable ou inactive financiÃ¨rement.", threadID, messageID);

                let targetEco = targetData.bankSystem;
                if (targetEco.cash < 200) return api.sendMessage("âŒ Cette cible est trop pauvre pour Ãªtre dÃ©troussÃ©e.", threadID, messageID);

                eco.lastRob = now;
                const successChance = Math.random();

                if (successChance > 0.45) { // 55% de chance de rÃ©ussite
                    const stolenCash = Math.floor(targetEco.cash * (Math.random() * (0.40 - 0.15) + 0.15));
                    targetEco.cash -= stolenCash;
                    eco.cash += stolenCash;
                    eco.achievements.successfulRobs = (eco.achievements.successfulRobs || 0) + 1;
                    eco.reputation = Math.max(0, eco.reputation - 15);

                    addHistory("Vol (Auteur)", stolenCash, `Vol rÃ©ussi sur ${targetID}`);
                    targetEco.history.unshift({
                        date: new Date().toISOString().split('T')[0],
                        type: "Vol (Victime)",
                        amount: -stolenCash,
                        details: `DÃ©troussÃ© par l'utilisateur ${senderID}`
                    });

                    await usersData.set(senderID, userData);
                    await usersData.set(targetID, targetData);
                    return api.sendMessage(`ðŸ¥· SuccÃ¨s ! Vous avez dÃ©valisÃ© ${stolenCash} $ des poches de la cible. Votre rÃ©putation baisse.`, threadID, messageID);
                } else {
                    // Ã‰chec du braquage : Amende et baisse drastique de rÃ©putation/crÃ©dit
                    const fine = Math.floor(eco.cash * 0.20) || 100;
                    eco.cash = Math.max(0, eco.cash - fine);
                    eco.creditScore = Math.max(300, eco.creditScore - 50);
                    eco.reputation = Math.max(0, eco.reputation - 25);

                    await usersData.set(senderID, userData);
                    return api.sendMessage(`ðŸš¨ Ã‰chec ! La police vous a arrÃªtÃ©. Vous payez une amende de ${fine} $. Votre rÃ©putation et score de crÃ©dit s'effondrent.`, threadID, messageID);
                }
            }

                case "invest": {
                const category = args[1]?.toLowerCase(); // stocks, crypto, bonds
                const action = args[2]?.toLowerCase();   // buy, sell
                const amount = parseInt(args[3]);

                const prices = { stocks: 150, crypto: 850, bonds: 500 };

                if (!category || !prices[category]) {
                    return api.sendMessage(`ðŸ“Š [ MARCHÃ‰ DES INVESTISSEMENTS ] ðŸ“Š\n` +
                        `ðŸ“ˆ 1. STOCKS (Actions d'entreprises) : ${prices.stocks} $ /unitÃ© [bank invest stocks buy/sell]\n` +
                        `ðŸª™ 2. CRYPTO (Actifs volatiles) : ${prices.crypto} $ /unitÃ© [bank invest crypto buy/sell]\n` +
                        `ðŸ“œ 3. BONDS (Obligations d'Ã‰tat stables) : ${prices.bonds} $ /unitÃ© [bank invest bonds buy/sell]\n\n` +
                        `Vos Actifs : Stocks: ${eco.investments.stocks} | Crypto: ${eco.investments.crypto} | Bonds: ${eco.investments.bonds}`, threadID, messageID);
                }

                if (action === "buy") {
                    if (isNaN(amount) || amount <= 0) return api.sendMessage("âš ï¸ SpÃ©cifiez un nombre d'unitÃ©s valide Ã  acheter.", threadID, messageID);
                    let totalCost = prices[category] * amount;
                    if (eco.cash < totalCost) return api.sendMessage(`âŒ Cash insuffisant. Il vous faut ${totalCost} $.`, threadID, messageID);

                    eco.cash -= totalCost;
                    eco.investments[category] += amount;
                    addHistory("Investissement", -totalCost, `Achat de ${amount} ${category}`);
                    await usersData.set(senderID, userData);
                    return api.sendMessage(`ðŸ“ˆ Achat effectuÃ© ! Vous possÃ©dez maintenant ${eco.investments[category]} unitÃ©s de ${category}.`, threadID, messageID);
                } 
                else if (action === "sell") {
                    if (isNaN(amount) || amount <= 0) return api.sendMessage("âš ï¸ SpÃ©cifiez un nombre d'unitÃ©s valide Ã  vendre.", threadID, messageID);
                    if (eco.investments[category] < amount) return api.sendMessage("âŒ Vous ne possÃ©dez pas autant d'unitÃ©s.", threadID, messageID);

                    // Simulation d'une fluctuation de marchÃ© Ã  la revente (-20% Ã  +35%)
                    const fluctuation = (Math.random() * (1.35 - 0.80) + 0.80);
                    let payout = Math.floor((prices[category] * amount) * fluctuation);

                    eco.investments[category] -= amount;
                    eco.cash += payout;
                    addHistory("DÃ©sinvestissement", payout, `Vente de ${amount} ${category}`);
                    await usersData.set(senderID, userData);
                    return api.sendMessage(`ðŸ“‰ Vente finalisÃ©e ! Le cours du marchÃ© a valorisÃ© vos actifs Ã  un prix total de ${payout} $ (Cash crÃ©ditÃ©).`, threadID, messageID);
                } else {
                    return api.sendMessage("âš ï¸ PrÃ©cisez l'action : `buy` ou `sell`.", threadID, messageID);
                }
            }

            case "business": {
                const action = args[1]?.toLowerCase();
                if (!eco.business) eco.business = { owned: false, name: "", level: 0, lastCollect: 0 };

                if (!action) {
                    if (!eco.business.owned) {
                        return api.sendMessage("ðŸ¢ Vous ne possÃ©dez aucun commerce. Tapez `bank business setup [Nom]` pour lancer une Startup pour 15,000 $.", threadID, messageID);
                    }
                    const passiveIncome = eco.business.level * 450;
                    return api.sendMessage(`ðŸ¢ [ GESTION ENTREPRISE : ${eco.business.name.toUpperCase()} ] ðŸ¢\n` +
                        `ðŸ“ˆ Niveau : ${eco.business.level}\n` +
                        `ðŸ’¸ Revenu passif gÃ©nÃ©rÃ© : ${passiveIncome} $ / cycle\n` +
                        `âš™ï¸ Actions disponibles : \n` +
                        `- \`bank business upgrade\` (CoÃ»t : ${eco.business.level * 8000} $)\n` +
                        `- \`bank business collect\` (RÃ©cupÃ©rer les dividendes)`, threadID, messageID);
                }

                if (action === "setup") {
                    const bizName = args.slice(2).join(" ");
                    if (!bizName) return api.sendMessage("âš ï¸ Donnez un nom Ã  votre entreprise.", threadID, messageID);
                    if (eco.business.owned) return api.sendMessage("âŒ Vous possÃ©dez dÃ©jÃ  une entreprise.", threadID, messageID);
                    if (eco.cash < 15000) return api.sendMessage("âŒ La crÃ©ation d'une franchise requiert 15 000 $ en liquide.", threadID, messageID);

                    eco.cash -= 15000;
                    eco.business = { owned: true, name: bizName, level: 1, lastCollect: Date.now() };
                    addHistory("Business", -15000, `Fondation de ${bizName}`);
                    await usersData.set(senderID, userData);
                    return api.sendMessage(`ðŸŽ‰ FÃ©licitations ! Votre entreprise "${bizName}" est ouverte. Elle gÃ©nÃ¨re des revenus passifs.`, threadID, messageID);
                }

                if (action === "upgrade") {
                    if (!eco.business.owned) return api.sendMessage("âŒ Vous n'avez pas de business.", threadID, messageID);
                    let cost = eco.business.level * 8000;
                    if (eco.cash < cost) return api.sendMessage(`âŒ AmÃ©lioration impossible. Il vous faut ${cost} $.`, threadID, messageID);

                    eco.cash -= cost;
                    eco.business.level += 1;
                    await usersData.set(senderID, userData);
                    return api.sendMessage(`ðŸš€ Votre entreprise passe au Niveau ${eco.business.level} ! Les revenus augmentent.`, threadID, messageID);
                }

                if (action === "collect") {
                    if (!eco.business.owned) return api.sendMessage("âŒ Vous n'avez pas de business.", threadID, messageID);
                    const now = Date.now();
                    const elapsed = now - eco.business.lastCollect;
                    
                    if (elapsed < 7200000) { // 2 heures d'intervalle minimum pour collecter
                        return api.sendMessage("â³ Le chiffre d'affaires n'est pas encore consolidÃ©. Attendez 2 heures.", threadID, messageID);
                    }

                    const revenue = eco.business.level * 450;
                    eco.bank += revenue;
                    eco.business.lastCollect = now;
                    addHistory("Revenus", revenue, `Dividendes de ${eco.business.name}`);
                    await usersData.set(senderID, userData);
                    return api.sendMessage(`ðŸ’° BÃ©nÃ©fices collectÃ©s ! ${revenue} $ ont Ã©tÃ© directement dÃ©posÃ©s sur votre compte en banque.`, threadID, messageID);
                }
            }

            case "property": {
                const action = args[1]?.toLowerCase();
                const catalog = {
                    studio: { name: "Studio en Ville", price: 35000, rent: 800 },
                    villa: { name: "Villa CotiÃ¨re", price: 120000, rent: 3200 }
                };

                if (!action) {
                    return api.sendMessage(`ðŸ  [ AGENCE IMMOBILIÃˆRE ] ðŸ \n` +
                        `1. \`studio\` - Studio en Ville : 35 000 $ (Loyer rapportÃ© : 800$/cycle)\n` +
                        `2. \`villa\` - Villa CotiÃ¨re : 120 000 $ (Loyer rapportÃ© : 3200$/cycle)\n\n` +
                        `Usage: \`bank property buy [studio/villa]\` ou \`bank property collect\` pour vos loyers.`, threadID, messageID);
                }

                if (action === "buy") {
                    const type = args[2]?.toLowerCase();
                    if (!catalog[type]) return api.sendMessage("âŒ PropriÃ©tÃ© invalide (choisissez studio ou villa).", threadID, messageID);
                    if (eco.cash < catalog[type].price) return api.sendMessage("âŒ Financement refusÃ© : Fonds liquides insuffisants.", threadID, messageID);

                    eco.cash -= catalog[type].price;
                    if (!eco.properties) eco.properties = [];
                    eco.properties.push({ type, purchasedAt: Date.now(), lastCollected: Date.now() });

                    addHistory("Immobilier", -catalog[type].price, `Achat immo: ${catalog[type].name}`);
                    await usersData.set(senderID, userData);
                    return api.sendMessage(`ðŸ”‘ Titre de propriÃ©tÃ© signÃ© ! Vous Ãªtes propriÃ©taire de : ${catalog[type].name}.`, threadID, messageID);
                }

                if (action === "collect") {
                    if (!eco.properties || eco.properties.length === 0) return api.sendMessage("âŒ Aucun bien immobilier locatif en votre possession.", threadID, messageID);
                    
                    const now = Date.now();
                    let totalRent = 0;
                    let updatedCount = 0;

                    eco.properties.forEach(prop => {
                        if (now - prop.lastCollected >= 14400000) { // 4 heures requises
                            totalRent += catalog[prop.type].rent;
                            prop.lastCollected = now;
                            updatedCount++;
                        }
                    });

                    if (totalRent === 0) return api.sendMessage("â³ Vos locataires ont dÃ©jÃ  payÃ© leur terme. Revenez plus tard (4h d'intervalle requis).", threadID, messageID);

                    eco.bank += totalRent;
                    addHistory("Loyer", totalRent, `Perception loyers de ${updatedCount} biens`);
                    await usersData.set(senderID, userData);
                    return api.sendMessage(`ðŸ’µ Gestion locative : Vous encaissez ${totalRent} $ de loyers en banque.`, threadID, messageID);
                }
            }

            case "shop": {
                const action = args[1]?.toLowerCase();
                const shopItems = {
                    sportscar: { name: "Supercar Sportive ðŸŽï¸", price: 75000, cat: "vehicles" },
                    yacht: { name: "Yacht de Luxe ðŸ›³ï¸", price: 250000, cat: "luxury" },
                    rolex: { name: "Montre en Or âŒš", price: 15000, cat: "luxury" }
                };

                if (!action) {
                    return api.sendMessage(`ðŸ›ï¸ [ CONCESSIONNAIRE & LUXE ] ðŸ›ï¸\n` +
                        `â€¢ \`sportscar\` : Concessionnaire Supercar - 75 000 $\n` +
                        `â€¢ \`yacht\` : Yacht Yacht-Club Prestige - 250 000 $\n` +
                        `â€¢ \`rolex\` : Montre de collection - 15 000 $\n\n` +
                        `Acheter via: \`bank shop buy [item]\``, threadID, messageID);
                }

                if (action === "buy") {
                    const choice = args[2]?.toLowerCase();
                    if (!shopItems[choice]) return api.sendMessage("âŒ Article introuvable dans le catalogue.", threadID, messageID);
                    if (eco.cash < shopItems[choice].price) return api.sendMessage("âŒ Transaction refusÃ©e : Fonds insuffisants.", threadID, messageID);

                    eco.cash -= shopItems[choice].price;
                    const category = shopItems[choice].cat;
                    if (!eco.inventory[category]) eco.inventory[category] = [];
                    eco.inventory[category].push(shopItems[choice].name);

                    // Prestige boost sur la rÃ©putation
                    eco.reputation = Math.min(200, eco.reputation + 20);

                    addHistory("Achat Luxe", -shopItems[choice].price, `Acquisition de ${shopItems[choice].name}`);
                    await usersData.set(senderID, userData);
                    return api.sendMessage(`ðŸ’Ž SuccÃ¨s ! Vous venez d'acquÃ©rir votre ${shopItems[choice].name}. Votre statut social augmente !`, threadID, messageID);
                }
                        }

                case "vault": {
                const action = args[1]?.toLowerCase();
                const amount = parseInt(args[2]);

                if (!action) {
                    return api.sendMessage(`ðŸ”’ [ COFFRE-FORT DE HAUTE SÃ‰CURITÃ‰ ] ðŸ”’\n` +
                        `Le coffre protÃ¨ge votre argent des raids et des vols.\n` +
                        `â€¢ Contenu actuel : ${eco.vault} $\n` +
                        `â€¢ Assurance vol : ${eco.vaultInsurance ? "ACTIVE ðŸ›¡ï¸" : "INACTIVE âš ï¸ (CoÃ»t: 5,000 $)"}\n\n` +
                        `Commandes :\n` +
                        `- \`bank vault store [montant]\` : Mettre Ã  l'abri\n` +
                        `- \`bank vault take [montant]\` : Retirer du coffre\n` +
                        `- \`bank vault insurance\` : Souscrire Ã  l'assurance`, threadID, messageID);
                }

                if (action === "store") {
                    if (isNaN(amount) || amount <= 0 || eco.cash < amount) return api.sendMessage("âŒ Montant en liquide invalide ou insuffisant.", threadID, messageID);
                    eco.cash -= amount;
                    eco.vault += amount;
                    await usersData.set(senderID, userData);
                    return api.sendMessage(`ðŸ”’ ${amount} $ ont Ã©tÃ© cadenassÃ©s dans votre coffre personnel.`, threadID, messageID);
                }

                if (action === "take") {
                    if (isNaN(amount) || amount <= 0 || eco.vault < amount) return api.sendMessage("âŒ Le coffre ne contient pas cette somme.", threadID, messageID);
                    eco.vault -= amount;
                    eco.cash += amount;
                    await usersData.set(senderID, userData);
                    return api.sendMessage(`ðŸ”“ Retrait sÃ©curisÃ© : Vous reprenez ${amount} $ en liquide.`, threadID, messageID);
                }

                if (action === "insurance") {
                    if (eco.vaultInsurance) return api.sendMessage("ðŸ›¡ï¸ Votre coffre est dÃ©jÃ  sous couverture d'assurance.", threadID, messageID);
                    if (eco.cash < 5000) return api.sendMessage("âŒ L'activation de la police d'assurance coÃ»te 5 000 $ en cash.", threadID, messageID);

                    eco.cash -= 5000;
                    eco.vaultInsurance = true;
                    await usersData.set(senderID, userData);
                    return api.sendMessage("ðŸ›¡ï¸ Contrat signÃ©. Votre coffre est dÃ©sormais immunisÃ© contre les pertes collatÃ©rales.", threadID, messageID);
                }
            }

            case "history": {
                if (!eco.history || eco.history.length === 0) return api.sendMessage("ðŸ“‹ Aucun relevÃ© bancaire rÃ©cent trouvÃ©.", threadID, messageID);
                
                let histText = "ðŸ“‹ [ 10 DERNIÃˆRES TRANSACTIONS ] ðŸ“‹\n\n";
                eco.history.forEach((t, i) => {
                    histText += `${i + 1}. [${t.date}] ${t.type} : ${t.amount > 0 ? "+" : ""}${t.amount} $ (${t.details})\n`;
                });
                return api.sendMessage(histText, threadID, messageID);
            }

            case "achievements": {
                const totalInvest = (eco.investments.stocks || 0) + (eco.investments.crypto || 0) + (eco.investments.bonds || 0);
                let achText = "ðŸ… [ DISTINCTIONS ET RÃ‰COMPENSES ] ðŸ…\n\n" +
                    `ðŸ’¼ Travailleur Assidu : ${eco.achievements.workCount || 0} sessions validÃ©es.\n` +
                    `ðŸ¥· Hors-la-loi recherchÃ© : ${eco.achievements.successfulRobs || 0} cambriolages rÃ©ussis.\n` +
                    `ðŸ“Š Portefeuille d'actifs : ${totalInvest} unitÃ©s financiÃ¨res possÃ©dÃ©es.\n` +
                    `ðŸŽï¸ Garage & Objets d'Ã©lite : ${[...(eco.inventory.vehicles || []), ...(eco.inventory.luxury || [])].length} items possÃ©dÃ©s.`;
                return api.sendMessage(achText, threadID, messageID);
            }

            default: {
                return api.sendMessage(
                    "âš™ï¸ â”€â”€ [ CONFIGURATION BANCAIRE ] â”€â”€ âš™ï¸\n\n" +
                    "Veuillez entrer l'une des sous-commandes suivantes :\n" +
                    "ðŸ”¹ `balance` : Solde & Profil financier\n" +
                    "ðŸ”¹ `deposit [montant/all]` : DÃ©poser du cash en banque\n" +
                    "ðŸ”¹ `withdraw [montant/all]` : Retirer l'argent de la banque\n" +
                    "ðŸ”¹ `transfer [ID] [montant]` : Faire un virement bancaire\n" +
                    "ðŸ”¹ `daily` : RÃ©cupÃ©rer son salaire quotidien\n" +
                    "ðŸ”¹ `work` : Travailler pour gÃ©nÃ©rer du cash\n" +
                    "ðŸ”¹ `loan request [montant]` : Demander un emprunt bancaire\n" +
                    "ðŸ”¹ `repay [montant/all]` : Rembourser sa dette\n" +
                    "ðŸ”¹ `rob [ID]` : Essayer de dÃ©valiser un utilisateur\n" +
                    "ðŸ”¹ `invest` : Ouvrir le panneau de la bourse (Crypto, Actions)\n" +
                    "ðŸ”¹ `business` : Fonder ou dÃ©velopper sa propre entreprise\n" +
                    "ðŸ”¹ `property` : Acheter des biens immobiliers locatifs\n" +
                    "ðŸ”¹ `shop` : Acheter des vÃ©hicules de sport ou objets de luxe\n" +
                    "ðŸ”¹ `vault` : DÃ©poser de l'argent dans le coffre blindÃ© sÃ©curisÃ©\n" +
                    "ðŸ”¹ `history` : Consulter son relevÃ© bancaire de transactions\n" +
                    "ðŸ”¹ `achievements` : Voir ses succÃ¨s et accomplissements\n" +
                    "ðŸ”¹ `leaderboard` : Classement des plus grandes fortunes",
                    threadID, messageID
                );
            }
        }
    }
};
