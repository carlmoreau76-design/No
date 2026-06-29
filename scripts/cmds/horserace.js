/**
 * @file horserace.js
 * @description Mini-jeu de course de chevaux pour GoatBot (Node.js)
 * @command horserace <montant> <1-5>
 */

module.exports = {
    config: {
        name: "horserace",
        version: "1.5.0",
        author: "Gemini",
        countDown: 5,
        role: 0,
        shortDescription: {
            vi: "Cá cược đua ngựa giải trí arcade.",
            en: "Arcade horse racing mini-game."
        },
        longDescription: {
            vi: "Đặt cược vào một chú ngựa từ 1 đến 5 và xem cuộc đua kịch tính.",
            en: "Bet on a horse from 1 to 5 and watch the thrilling race live."
        },
        category: "economy",
        guide: {
            vi: "{pn} <số tiền> <1-5>",
            en: "{pn} <amount> <1-5>\nEx: {pn} 500 3"
        }
    },

    onStart: async function ({ api, event, args, usersData, message }) {
        const { threadID, messageID, senderID } = event;

        // Émoticônes et éléments visuels
        const HORSE_ICONS = ["🐎", "🏇", "🦄", "🦓", "🚀"];
        const FINISH_LINE = "🏁";
        const TRACK_LENGTH = 15; // Longueur de la piste

        // 1. Vérification des arguments
        if (args.length < 2) {
            return message.reply("❌ **Format incorrect !**\nUtilise: `horserace <montant> <numéro du cheval 1-5>`\nExemple: `horserace 500 3`");
        }

        const betAmount = parseInt(args[0]);
        const chosenHorse = parseInt(args[1]);

        // 2. Validation de la mise et du cheval choisi
        if (isNaN(betAmount) || betAmount <= 0) {
            return message.reply("❌ Le montant de la mise doit être un nombre entier positif supérieur à 0.");
        }

        if (isNaN(chosenHorse) || chosenHorse < 1 || chosenHorse > 5) {
            return message.reply("❌ Vous devez choisir un cheval valide entre **1** et **5**.");
        }

        // 3. Vérification du solde de l'utilisateur via usersData
        let userData;
        try {
            userData = await usersData.get(senderID);
            if (!userData || userData.money === undefined) {
                return message.reply("❌ Impossible de récupérer vos informations financières. Réessayez plus tard.");
            }
        } catch (error) {
            return message.reply("❌ Erreur lors de l'accès à la base de données des utilisateurs.");
        }

        const currentMoney = userData.money;

        if (currentMoney < betAmount) {
            return message.reply(`❌ **Fonds insuffisants !**\nVous misez \`${betAmount}$\` mais vous n'avez que \`${currentMoney}$\` en compte.`);
        }

        // Déduire temporairement la mise pour sécuriser le jeu
        await usersData.set(senderID, { money: currentMoney - betAmount });

        // Noms fictifs des chevaux pour l'immersion
        const horseNames = [
            "Éclair Sombre",
            "Tempête Dorée",
            "Comète d'Argent",
            "Furia Rouge",
            "Pégase Céleste"
        ];

        // Initialisation des positions des chevaux (0 à TRACK_LENGTH)
        let positions = [0, 0, 0, 0, 0];
        
        // Message d'ambiance de départ
        let infoMessage = await message.reply(`|🏇| **L'HIPPODROME DE GOATBOT** |🏁|\n${"─".repeat(20)}\n` +
            `👤 **Joueur :** <@${senderID}>\n` +
            `💵 **Mise :** \`${betAmount}$\`\n` +
            `🐎 **Cheval choisi :** N°${chosenHorse} — *"${horseNames[chosenHorse - 1]}"*\n\n` +
            `📢 *Les chevaux entrent en piste... Les paris sont fermés !* 🚩\n` +
            `Le départ est imminent ! ⏱️`
        );

        // Attendre 2 secondes avant de lancer la course
        await new Promise(resolve => setTimeout(resolve, 2000));

        let raceFinished = false;
        let winner = -1;
        let originalMessageId = infoMessage.messageID;

        // Fonction pour générer le visuel de la piste de course
        function renderTrack(positions, currentStep) {
            let trackOutput = `|🏇| **COURSE EN COURS (Étape ${currentStep})** |🏁|\n${"─".repeat(25)}\n`;
            
            for (let i = 0; i < 5; i++) {
                let horseSymbol = HORSE_ICONS[i];
                let pos = positions[i];
                
                // Construire la piste textuelle
                let lane = "░".repeat(pos) + horseSymbol + "░".repeat(TRACK_LENGTH - pos);
                
                // Mettre en valeur le cheval choisi par le joueur
                let prefix = (i + 1) === chosenHorse ? "⭐" : "🔹";
                
                trackOutput += `${prefix} **N°${i + 1}** [${lane}] ${FINISH_LINE}\n`;
            }
            trackOutput += `\n${"─".repeat(25)}\n📢 *Encouragez votre favori ! En plein sprint !* 🏃‍♂️💨`;
            return trackOutput;
        }

        let step = 1;

        // Boucle d'animation de la course (Max 12 étapes pour éviter le spam d'API)
        while (!raceFinished && step <= 12) {
            // Faire avancer chaque cheval de façon aléatoire (de 1 à 3 cases)
            for (let i = 0; i < 5; i++) {
                let advance = Math.floor(Math.random() * 3) + 1;
                positions[i] = Math.min(positions[i] + advance, TRACK_LENGTH);
                
                // Vérifier si un cheval franchit la ligne d'arrivée
                if (positions[i] >= TRACK_LENGTH && !raceFinished) {
                    raceFinished = true;
                    winner = i + 1; // Index basé sur 1-5
                }
            }

            // Si aucun n'a franchi la ligne mais qu'on atteint la fin des étapes forcées, on prend le premier
            if (step === 12 && !raceFinished) {
                let maxPos = Math.max(...positions);
                winner = positions.indexOf(maxPos) + 1;
                raceFinished = true;
            }

            // Générer la piste actualisée
            let currentTrackVisual = renderTrack(positions, step);

            // Modifier le message existant pour simuler l'animation
            try {
                await message.unsend(originalMessageId);
            } catch(e) { /* Ignorer si déjà supprimé */ }

            let updatedMsg = await message.reply(currentTrackVisual);
            originalMessageId = updatedMsg.messageID;

            step++;
            // Pause de 1.5 seconde entre les frames de la course
            await new Promise(resolve => setTimeout(resolve, 1500));
        }

        // 4. Calcul des résultats et récompenses
        const userWon = (winner === chosenHorse);
        let finalMultiplier = 3.0; // Multiplicateur standard x3 (1 chance sur 5)
        let moneyChange = 0;
        let finalStatusText = "";

        // Récupérer à nouveau l'argent frais pour éviter les conflits de concurrence
        let freshUserData = await usersData.get(senderID);
        let walletBeforeResult = freshUserData.money; // Déjà déduit de la mise initiale

        if (userWon) {
            const winnings = Math.floor(betAmount * finalMultiplier);
            moneyChange = winnings;
            const newBalance = walletBeforeResult + winnings;
            
            await usersData.set(senderID, { money: newBalance });

            finalStatusText = `🏆 **FÉLICITATIONS ! VOUS AVEZ GAGNÉ !** 🥇\n` +
                              `Le cheval **N°${winner} ("${horseNames[winner - 1]}")** a écrasé la concurrence !\n\n` +
                              `💰 **Gain :** \`+${winnings}$\` (Multiplicateur x${finalMultiplier})\n` +
                              `💳 **Nouveau solde :** \`${newBalance}$\``;
        } else {
            moneyChange = -betAmount;
            // L'argent a déjà été déduit au départ, rien à soustraire de plus.
            finalStatusText = `❌ **DOMMAGE, C'EST PERDU !** 💸\n` +
                              `Le vainqueur est le cheval **N°${winner} ("${horseNames[winner - 1]}")**.\n` +
                              `Votre cheval, le N°${chosenHorse}, a mordu la poussière.\n\n` +
                              `📉 **Perte :** \`-${betAmount}$\` \n` +
                              `💳 **Nouveau solde :** \`${walletBeforeResult}$\``;
        }

        // Affichage du tableau d'honneur final
        let finalPodium = `🏁 ✨ **RÉSULTAT FINAL DE LA COURSE** ✨ 🏁\n${"═".repeat(25)}\n` +
                          `🥇 **1er Rang :** Cheval N°${winner} — *${horseNames[winner - 1]}* 🐎\n` +
                          `${"─".repeat(25)}\n` +
                          `${finalStatusText}\n` +
                          `${"═".repeat(25)}\n` +
                          `Merci d'avoir joué à GoatBot Arcade Horse Racing ! 🎢`;

        try {
            await message.unsend(originalMessageId);
        } catch(e) {}
        
        return message.reply(finalPodium);
    }
};
