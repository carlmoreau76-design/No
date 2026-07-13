const { createCanvas, loadImage, registerFont } = require('canvas');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Token d'accès Facebook pour récupérer les avatars HD fourni par l'utilisateur
const FB_TOKEN = "6628568379|c1e620fa708a1d5696fb991c1bde5662";

module.exports = {
  config: {
    name: "cupidon",
    version: "2.0.0",
    author: "Furious & Gemini",
    countDown: 10,
    role: 0,
    shortDescription: {
      vi: "Phân tích độ tương thích giữa 2 người",
      en: "Analyze compatibility between 2 users with custom Canvas render"
    },
    longDescription: {
      vi: "Phân tích độ tương thích, tạo chứng nhận và ảnh phân tích độ phân giải cao.",
      en: "Analyze compatibility, create an official certificate and high-definition neon interface."
    },
    category: "game",
    guide: {
      vi: "{pn} [@tag]",
      en: "{pn} [@tag]"
    }
  },

  onStart: async function ({ api, message, event, args }) {
    const { threadID, messageID, senderID } = event;
    
    // 1. Détermination des deux cibles
    let targetID1 = senderID;
    let targetID2 = null;

    const mentions = Object.keys(event.mentions);
    if (mentions.length > 0) {
      targetID2 = mentions[0];
    } else {
      // Récupérer un membre aléatoire du groupe différent de l'auteur
      try {
        const threadInfo = await api.getThreadInfo(threadID);
        const participantIDs = threadInfo.participantIDs.filter(id => id !== senderID);
        if (participantIDs.length === 0) {
          return api.sendMessage("❌ Vous devez être au moins deux dans ce groupe pour utiliser cette commande.", threadID, messageID);
        }
        targetID2 = participantIDs[Math.floor(Math.random() * participantIDs.length)];
      } catch (err) {
        // Fallback si la récupération des infos du thread échoue
        return api.sendMessage("❌ Impossible de récupérer les membres du groupe. Mentionnez quelqu'un !", threadID, messageID);
      }
    }

    // 2. Récupération des informations des utilisateurs (Noms)
    let name1 = "Utilisateur 1";
    let name2 = "Utilisateur 2";
    try {
      const userNames = await api.getUserInfo([targetID1, targetID2]);
      name1 = userNames[targetID1]?.name || "Anonyme";
      name2 = userNames[targetID2]?.name || "Anonyme";
    } catch (e) {
      name1 = "Utilisateur 1";
      name2 = "Utilisateur 2";
    }

    // 3. Animation de chargement par édition de message
    const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
    
    const loadingMsg = await api.sendMessage(
      "╭─────────────────────•\n" +
      "│ ⏳ 🔮 Lecture des ondes cosmiques...\n" +
      "├─────────────────────•\n" +
      "│ [█████░░░░░░░░░░░░░░░] 25%\n" +
      "╰─────────────────────•", threadID
    );

    await delay(1500);
    await api.editMessage(
      "╭─────────────────────•\n" +
      "│ ⏳ 💞 Analyse des vibrations émotionnelles...\n" +
      "├─────────────────────•\n" +
      "│ [██████████░░░░░░░░░] 50%\n" +
      "╰─────────────────────•", loadingMsg.messageID
    );

    await delay(1500);
    await api.editMessage(
      "╭─────────────────────•\n" +
      "│ ⏳ ✨ Calcul de l'alchimie entre les âmes...\n" +
      "├─────────────────────•\n" +
      "│ [███████████████░░░░] 75%\n" +
      "╰─────────────────────•", loadingMsg.messageID
    );

    await delay(1500);
    await api.editMessage(
      "╭─────────────────────•\n" +
      "│ ✅ Analyse terminée !\n" +
      "├─────────────────────•\n" +
      "│ [███████████████████] 100%\n" +
      "╰─────────────────────•", loadingMsg.messageID
    );

    await delay(800);
    // Suppression du message de chargement
    await api.unsendMessage(loadingMsg.messageID);

    // 4. Génération des données aléatoires mais cohérentes
    const score = Math.floor(Math.random() * 100) + 1;
    
    // Configuration des catégories basées sur le score
    let configCategory = {
      title: "",
      relationType: "",
      phrase: "",
      colors: {
        primary: "#00ffcc", // Couleur principale de l'interface (néon)
        bgGradientStart: "#03140f",
        bgGradientEnd: "#08271e",
        accent: "#00ff66"
      }
    };

    // Base de données de phrases (+ de 100 phrases uniques réparties)
    const database = {
      instable: { // 1-20
        relation: ["Rivalité affectueuse", "Lien complexe", "Orage magnétique", "Énergie instable", "Divergence Cosmique"],
        colors: { primary: "#ff3333", bgGradientStart: "#1a0505", bgGradientEnd: "#3a0a0a", accent: "#ff6666" },
        phrases: [
          "Le courant passe mais attention aux courts-circuits !", "Une dynamique électrique où l'un ne va pas sans l'autre.",
          "Des étincelles constantes, pour le meilleur et pour le pire.", "Une connexion volcanique qui demande beaucoup de patience.",
          "Entre attraction et friction, votre duo ne dort jamais.", "Deux opposés magnétiques qui s'entrechoquent constamment.",
          "Un défi quotidien qui teste la force de votre patience.", "Parfois l'harmonie est difficile, mais l'intérêt reste entier.",
          "Vos ondes s'entrechoquent dans un chaos fascinant.", "Chaque jour est un nouveau round d'adaptation mutuelle.",
          "Une énigme relationnelle complexe à déchiffrer.", "Vous parlez deux langues différentes, mais le dialogue persiste.",
          "Un équilibre fragile suspendu sur un fil d'acier.", "Vos divergences font aussi votre force cachée.",
          "Une connexion qui s'exprime dans la contradiction.", "Pas toujours sur la même longueur d'onde, mais jamais loin.",
          "Un puzzle complexe où les pièces ont du mal à s'emboîter.", "L'alchimie demande du travail, mais la curiosité est là.",
          "Des étincelles créatrices nées de vos différences.", "Un duo imprévisible qui défie toutes les règles logiques."
        ]
      },
      amis: { // 21-40
        relation: ["Vrais amis", "Alliance solide", "Complices de l'ombre", "Duo de confiance", "Piliers fiables"],
        colors: { primary: "#33ccff", bgGradientStart: "#05151a", bgGradientEnd: "#0b2c3a", accent: "#00ffcc" },
        phrases: [
          "Vous êtes les piliers l'un de l'autre face aux tempêtes.", "Une amitié sincère et dénuée de tout artifice.",
          "Sur qui compter quand tout s'effondre ? Vous avez la réponse.", "Une confiance aveugle qui s'est bâtie au fil des jours.",
          "Des éclats de rire partagés et un soutien inestimable.", "Votre complicité silencieuse vaut mieux que de longs discours.",
          "Un repère stable dans le tumulte du quotidien.", "Toujours là pour épauler l'autre sans rien demander en retour.",
          "Une alliance indéfectible basée sur le respect mutuel.", "La définition même d'une épaule solide sur qui s'appuyer.",
          "Votre lien résiste au temps et aux aléas de la vie.", "Une amitié authentique qui se passe de faux-semblants.",
          "Une présence rassurante dans les moments de doute.", "Le genre de lien sur lequel on peut bâtir l'avenir.",
          "Votre connexion amicale est un havre de paix.", "Toujours prêts à vous serrer les coudes en cas de coup dur.",
          "Une écoute attentive et des conseils toujours bienveillants.", "Rien ne peut ébranler la base solide de votre entente.",
          "Des valeurs communes qui scellent une amitié durable.", "Un duo robuste prêt à affronter n'importe quel défi."
        ]
      },
      connexion: { // 41-60
        relation: ["Bonne connexion", "Complices", "Harmonie naissante", "Énergie complémentaire", "Esprits synchrones"],
        colors: { primary: "#33ff57", bgGradientStart: "#051a09", bgGradientEnd: "#0b3a16", accent: "#39ff14" },
        phrases: [
          "Vos idées se croisent souvent sur le même chemin.", "Une synergie agréable qui rend chaque moment fluide.",
          "L'entente est naturelle, presque sans effort.", "Vos ondes positives s'accordent d'une très belle manière.",
          "Un bel équilibre entre moments de partage et liberté.", "L'alchimie s'installe doucement et promet de grandes choses.",
          "Vous trouvez toujours un terrain d'entente chaleureux.", "Une résonance mentale qui se renforce de jour en jour.",
          "Des discussions fluides et un respect mutuel évident.", "Votre connexion est une source constante d'énergie positive.",
          "Vous vous comprenez sans avoir besoin d'insister.", "Une belle harmonie qui ne demande qu'à s'épanouir.",
          "Le feeling est indéniable, l'échange est toujours riche.", "Vos parcours se croisent pour créer une belle synergie.",
          "Une complicité saine et particulièrement rafraîchissante.", "Vous tirez le meilleur parti de vos conversations.",
          "Un lien équilibré, sain et porteur de belles promesses.", "La simplicité de votre entente fait toute sa beauté.",
          "Une vibration commune qui s'intensifie avec le temps.", "Le plaisir de partager et d'avancer ensemble."
        ]
      },
      compatibles: { // 61-80
        relation: ["Très compatibles", "Partenaires idéaux", "Alliance parfaite", "Duo de choc", "Synchronicité d'esprit"],
        colors: { primary: "#ff33aa", bgGradientStart: "#1a0512", bgGradientEnd: "#3a0b29", accent: "#ff00bb" },
        phrases: [
          "Vos vibrations sont synchronisées de manière spectaculaire.", "Une compatibilité évidente qui saute aux yeux de tous.",
          "Une force commune capable de déplacer des montagnes.", "Vos différences s'assemblent pour former un tout harmonieux.",
          "Une entente naturelle qui frôle la perfection absolue.", "Ensemble, vous formez une équipe redoutable et inspirante.",
          "Le soutien mutuel est une seconde nature chez vous.", "Un duo dynamique et équilibré qui fait l'unanimité.",
          "Vos esprits fonctionnent sur le même rythme cardiaque.", "Une alchimie puissante qui transforme chaque projet en succès.",
          "Vous partagez une vision commune du monde et de la vie.", "Une complémentarité rare qui suscite l'admiration.",
          "L'un commence la phrase, l'autre la termine naturellement.", "Votre complicité est un moteur de réussite incroyable.",
          "Des échanges profonds qui renforcent sans cesse votre lien.", "Un accord parfait entre vos forces et vos faiblesses.",
          "Votre duo brille par sa cohérence et sa solidité.", "Une très forte synergie qui surmonte tous les obstacles.",
          "Vous êtes faits pour collaborer, créer et avancer ensemble.", "Une présence qui illumine instantanément le quotidien de l'autre."
        ]
      },
      exceptionnelle: { // 81-95
        relation: ["Connexion exceptionnelle", "Destin lié", "Alliance sacrée", "Duo légendaire", "Aura fusionnelle"],
        colors: { primary: "#bf55ec", bgGradientStart: "#13021c", bgGradientEnd: "#2a043d", accent: "#df73ff" },
        phrases: [
          "L'amour et le respect qui vous lient sont aussi puissants que l'océan.", "Une connexion cosmique qui dépasse l'entendement rationnel.",
          "Vos âmes se reconnaissent sans l'ombre d'un doute.", "Un lien d'une pureté exceptionnelle et infiniment précieux.",
          "Votre complicité est inscrite dans les étoiles depuis toujours.", "Une union magique qui traverse le temps et l'espace.",
          "Vous êtes le refuge et la force de l'autre à la fois.", "Une résonance émotionnelle d'une profondeur absolue.",
          "L'un des liens les plus solides qu'il soit donné de contempler.", "Votre harmonie est un chef-d'œuvre de la nature.",
          "Une confiance inébranlable que rien ne pourra détruire.", "Deux cœurs qui battent à l'unisson parfait.",
          "Le destin a fait son travail en croisant vos chemins.", "Une aura partagée d'une intensité lumineuse rare.",
          "Vous écrivez ensemble une histoire d'une valeur inestimable.", "Une fusion parfaite de vos deux personnalités.",
          "Le lien qui vous unit est une source d'inspiration pure.", "Rien ne semble pouvoir perturber votre entente sacrée.",
          "Une présence indispensable pour le bien-être de chacun.", "Votre connexion redéfinit la notion même de complicité."
        ]
      },
      amesLiees: { // 96-100
        relation: ["Âmes sœurs", "Connexion éternelle", "Harmonie cosmique", "Destinée absolue", "Double spirituel"],
        colors: { primary: "#f39c12", bgGradientStart: "#221100", bgGradientEnd: "#442200", accent: "#f1c40f" },
        phrases: [
          "Une connexion d'une rareté absolue, deux moitiés enfin réunies.", "Votre lien transcende les lois de la physique et du temps.",
          "Une symbiose spirituelle et émotionnelle parfaite.", "Deux trajectoires destinées à fusionner de toute éternité.",
          "Une harmonie cosmique qui vibre à l'infini.", "L'alchimie ultime, la définition parfaite de l'âme sœur.",
          "Rien ne pourra jamais altérer ou briser ce lien sacré.", "Vos esprits se complètent dans un accord céleste absolu.",
          "Une rencontre qui change le cours d'une existence entière.", "Le reflet parfait de l'un dans le regard de l'autre.",
          "Une évidence silencieuse qui n'a pas besoin de mots.", "Deux flammes jumelles unies pour briller ensemble.",
          "Une connexion éternelle gravée dans la mémoire du temps.", "Le sommet de la compatibilité humaine et spirituelle.",
          "Votre histoire commune est un héritage stellaire.", "L'un est la clé qui ouvre le cœur et l'esprit de l'autre.",
          "Une union intemporelle portée par les forces de l'univers.", "Vous ne faites qu'un dans la diversité de vos êtres.",
          "Une entente divine qui défie toute description.", "Le plus haut degré d'alchimie jamais enregistré."
        ]
      }
    };

    // Sélection de la bonne catégorie
    let selectedGroup;
    if (score <= 20) selectedGroup = database.instable;
    else if (score <= 40) selectedGroup = database.amis;
    else if (score <= 60) selectedGroup = database.connexion;
    else if (score <= 80) selectedGroup = database.compatibles;
    else if (score <= 95) selectedGroup = database.exceptionnelle;
    else selectedGroup = database.amesLiees;

    configCategory.relationType = selectedGroup.relation[Math.floor(Math.random() * selectedGroup.relation.length)];
    configCategory.phrase = selectedGroup.phrases[Math.floor(Math.random() * selectedGroup.phrases.length)];
    configCategory.colors = selectedGroup.colors;

    // 5. Récupération des avatars
    let avatarBuffer1, avatarBuffer2;
    const defaultAvatarUrl = "https://i.imgur.com/6EE87b9.png"; // Image par défaut si erreur

    const getAvatarUrl = (uid) => `https://graph.facebook.com/${uid}/picture?width=500&access_token=${FB_TOKEN}`;

    try {
      const res1 = await axios.get(getAvatarUrl(targetID1), { responseType: 'arraybuffer' });
      avatarBuffer1 = Buffer.from(res1.data);
    } catch (e) {
      try {
        const res1 = await axios.get(defaultAvatarUrl, { responseType: 'arraybuffer' });
        avatarBuffer1 = Buffer.from(res1.data);
      } catch { avatarBuffer1 = null; }
    }

    try {
      const res2 = await axios.get(getAvatarUrl(targetID2), { responseType: 'arraybuffer' });
      avatarBuffer2 = Buffer.from(res2.data);
    } catch (e) {
      try {
        const res2 = await axios.get(defaultAvatarUrl, { responseType: 'arraybuffer' });
        avatarBuffer2 = Buffer.from(res2.data);
      } catch { avatarBuffer2 = null; }
    }

    const avatarImg1 = avatarBuffer1 ? await loadImage(avatarBuffer1) : null;
    const avatarImg2 = avatarBuffer2 ? await loadImage(avatarBuffer2) : null;

    // 6. GENERATION DU CANVAS 1 (Analyseur de Liens - 1920x1080)
    const canvas1 = createCanvas(1920, 1080);
    const ctx1 = canvas1.getContext('2d');

    // Fond dégradé premium sombre adapté au thème
    const grad1 = ctx1.createLinearGradient(0, 0, 1920, 1080);
    grad1.addColorStop(0, configCategory.colors.bgGradientStart);
    grad1.addColorStop(1, configCategory.colors.bgGradientEnd);
    ctx1.fillStyle = grad1;
    ctx1.fillRect(0, 0, 1920, 1080);

    // Ajout d'un effet de grille technologique subtil en arrière-plan
    ctx1.strokeStyle = "rgba(255, 255, 255, 0.015)";
    ctx1.lineWidth = 1;
    for (let i = 0; i < 1920; i += 60) {
      ctx1.beginPath(); ctx1.moveTo(i, 0); ctx1.lineTo(i, 1080); ctx1.stroke();
    }
    for (let j = 0; j < 1080; j += 60) {
      ctx1.beginPath(); ctx1.moveTo(0, j); ctx1.lineTo(1920, j); ctx1.stroke();
    }

    // Titre de l'interface en haut
    ctx1.shadowColor = configCategory.colors.primary;
    ctx1.shadowBlur = 15;
    ctx1.fillStyle = configCategory.colors.primary;
    ctx1.font = 'bold 36px sans-serif';
    ctx1.textAlign = 'center';
    ctx1.fillText("✦ ANALYSEUR DE LIENS ✦", 1920 / 2, 80);

    // Dessin de l'Avatar 1 (Gauche) - Centre (480, 480)
    const drawAvatar = (ctx, img, x, y, size, primaryColor) => {
      ctx.save();
      ctx.shadowColor = primaryColor;
      ctx.shadowBlur = 40;
      ctx.lineWidth = 15;
      ctx.strokeStyle = primaryColor;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.stroke();
      ctx.clip();
      if (img) {
        ctx.drawImage(img, x - size, y - size, size * 2, size * 2);
      } else {
        ctx.fillStyle = "#333";
        ctx.fillRect(x - size, y - size, size * 2, size * 2);
      }
      ctx.restore();
    };

    drawAvatar(ctx1, avatarImg1, 480, 450, 210, configCategory.colors.primary);
    drawAvatar(ctx1, avatarImg2, 1440, 450, 210, configCategory.colors.primary);

    // Icône de connexion (Infini ou Coeur) au centre
    ctx1.save();
    ctx1.shadowColor = configCategory.colors.accent;
    ctx1.shadowBlur = 35;
    ctx1.fillStyle = configCategory.colors.accent;
    ctx1.font = 'bold 160px sans-serif';
    ctx1.textAlign = 'center';
    ctx1.fillText("∞", 1920 / 2, 420);
    ctx1.restore();

    // Noms des utilisateurs sous leurs avatars respectifs
    ctx1.shadowBlur = 5;
    ctx1.fillStyle = "#ffffff";
    ctx1.font = 'bold 45px sans-serif';
    ctx1.textAlign = 'center';
    ctx1.fillText(name1.toUpperCase(), 480, 740);
    ctx1.fillText(name2.toUpperCase(), 1440, 740);

    // Pourcentage de compatibilité
    ctx1.save();
    ctx1.shadowColor = configCategory.colors.primary;
    ctx1.shadowBlur = 40;
    ctx1.fillStyle = "#ffffff";
    ctx1.font = 'bold 165px sans-serif';
    ctx1.textAlign = 'center';
    ctx1.fillText(`${score}%`, 1920 / 2, 630);
    ctx1.restore();

    // Barre de progression futuriste
    const barWidth = 900;
    const barHeight = 24;
    const barX = (1920 - barWidth) / 2;
    const barY = 700;

    // Fond de la barre
    ctx1.fillStyle = "rgba(255, 255, 255, 0.1)";
    ctx1.beginPath();
    ctx1.roundRect(barX, barY, barWidth, barHeight, 12);
    ctx1.fill();

    // Remplissage de la barre
    ctx1.save();
    ctx1.shadowColor = configCategory.colors.accent;
    ctx1.shadowBlur = 15;
    const fillWidth = (score / 100) * barWidth;
    const fillGrad = ctx1.createLinearGradient(barX, 0, barX + fillWidth, 0);
    fillGrad.addColorStop(0, configCategory.colors.primary);
    fillGrad.addColorStop(1, configCategory.colors.accent);
    ctx1.fillStyle = fillGrad;
    ctx1.beginPath();
    ctx1.roundRect(barX, barY, fillWidth, barHeight, 12);
    ctx1.fill();
    ctx1.restore();

    // Catégorie / Type de relation
    ctx1.save();
    ctx1.shadowColor = configCategory.colors.primary;
    ctx1.shadowBlur = 15;
    ctx1.fillStyle = configCategory.colors.primary;
    ctx1.font = 'bold 48px sans-serif';
    ctx1.textAlign = 'center';
    ctx1.fillText(configCategory.relationType.toUpperCase(), 1920 / 2, 800);
    ctx1.restore();

    // Phrase personnalisée en italique
    ctx1.fillStyle = "rgba(255, 255, 255, 0.8)";
    ctx1.font = 'italic 32px Georgia, serif';
    ctx1.textAlign = 'center';
    ctx1.fillText(`" ${configCategory.phrase} "`, 1920 / 2, 880);

    // Dessin d'une animation ECG esthétique en bas
    ctx1.strokeStyle = configCategory.colors.primary;
    ctx1.lineWidth = 4;
    ctx1.shadowBlur = 15;
    ctx1.beginPath();
    let currentX = 0;
    ctx1.moveTo(0, 1000);
    while (currentX < 1920) {
      currentX += 40 + Math.random() * 60;
      let randY = 1000;
      if (Math.random() > 0.7) {
        // Crête ECG
        ctx1.lineTo(currentX - 10, 1000);
        ctx1.lineTo(currentX - 5, 960);
        ctx1.lineTo(currentX, 1050);
        ctx1.lineTo(currentX + 5, 990);
        ctx1.lineTo(currentX + 10, 1000);
      } else {
        ctx1.lineTo(currentX, randY);
      }
    }
    ctx1.stroke();

    // Date discrète tout en bas
    const optionsDate = { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' };
    const dateFormatted = new Date().toLocaleDateString('fr-FR', optionsDate);
    ctx1.fillStyle = "rgba(255, 255, 255, 0.3)";
    ctx1.font = '16px sans-serif';
    ctx1.textAlign = 'center';
    ctx1.fillText(`Analyse générée le ${dateFormatted}`, 1920 / 2, 1060);


    // 7. GENERATION DU CANVAS 2 (Certificat Officiel - 1440x1018)
    const canvas2 = createCanvas(1440, 1018);
    const ctx2 = canvas2.getContext('2d');

    // Fond dégradé du certificat
    const grad2 = ctx2.createLinearGradient(0, 0, 1440, 1018);
    grad2.addColorStop(0, configCategory.colors.bgGradientStart);
    grad2.addColorStop(1, configCategory.colors.bgGradientEnd);
    ctx2.fillStyle = grad2;
    ctx2.fillRect(0, 0, 1440, 1018);

    // Double Bordure de Certificat avec lueur
    ctx2.save();
    ctx2.strokeStyle = configCategory.colors.primary;
    ctx2.lineWidth = 6;
    ctx2.shadowColor = configCategory.colors.primary;
    ctx2.shadowBlur = 20;
    ctx2.strokeRect(30, 30, 1380, 958);

    ctx2.strokeStyle = configCategory.colors.accent;
    ctx2.lineWidth = 2;
    ctx2.strokeRect(45, 45, 1350, 928);
    ctx2.restore();

    // Coins stylisés
    const drawCorner = (ctx, x, y, size, color) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.moveTo(x - size, y);
      ctx.lineTo(x, y);
      ctx.lineTo(x, y - size);
      ctx.stroke();
    };
    // Coin Supérieur Gauche
    drawCorner(ctx2, 60, 110, 50, configCategory.colors.accent);
    // Coin Supérieur Droit
    drawCorner(ctx2, 1380, 110, 50, configCategory.colors.accent);

    // Titre 1 : Déclaration Officielle
    ctx2.fillStyle = "rgba(255, 255, 255, 0.6)";
    ctx2.font = 'italic 28px Georgia, serif';
    ctx2.textAlign = 'center';
    ctx2.fillText("— Déclaration Officielle —", 1440 / 2, 130);

    // Grand Titre : CERTIFICAT D'AMITIÉ OU D'AMOUR
    const isHighCompat = score >= 60;
    const certTitle = isHighCompat ? "CERTIFICAT D'AMOUR" : "CERTIFICAT D'AMITIÉ";
    ctx2.save();
    ctx2.shadowColor = configCategory.colors.primary;
    ctx2.shadowBlur = 30;
    ctx2.fillStyle = configCategory.colors.primary;
    ctx2.font = 'bold 85px sans-serif';
    ctx2.textAlign = 'center';
    ctx2.fillText(certTitle, 1440 / 2, 260);
    ctx2.restore();

    // Sous-titre explicatif
    ctx2.fillStyle = "rgba(255, 255, 255, 0.8)";
    ctx2.font = 'italic 36px Georgia, serif';
    ctx2.fillText("Certifie un lien indéfectible et unique entre", 1440 / 2, 380);

    // Les noms reliés
    ctx2.save();
    ctx2.shadowColor = configCategory.colors.accent;
    ctx2.shadowBlur = 10;
    ctx2.fillStyle = "#ffffff";
    ctx2.font = 'bold 64px sans-serif';
    ctx2.fillText(`${name1}  &  ${name2}`, 1440 / 2, 500);
    ctx2.restore();

    // Score de Compatibilité
    ctx2.fillStyle = "rgba(255, 255, 255, 0.7)";
    ctx2.font = 'italic 40px Georgia, serif';
    ctx2.fillText(`Score de Compatibilité : ${score}%`, 1440 / 2, 620);

    // Message / Phrase de certification
    ctx2.fillStyle = configCategory.colors.primary;
    ctx2.font = 'italic 34px Georgia, serif';
    ctx2.fillText(`" ${configCategory.phrase} "`, 1440 / 2, 730);

    // Ligne de signature ou date en bas à gauche
    ctx2.strokeStyle = "rgba(255, 255, 255, 0.2)";
    ctx2.lineWidth = 2;
    ctx2.beginPath();
    ctx2.moveTo(100, 880);
    ctx2.lineTo(450, 880);
    ctx2.stroke();
    ctx2.fillStyle = "rgba(255, 255, 255, 0.5)";
    ctx2.font = '22px sans-serif';
    ctx2.textAlign = 'left';
    ctx2.fillText(`Délivré le ${dateFormatted}`, 100, 920);

    // Cachet officiel en bas à droite
    ctx2.save();
    ctx2.translate(1150, 820);
    ctx2.rotate(-0.15); // Légère rotation réaliste du tampon
    ctx2.shadowColor = configCategory.colors.accent;
    ctx2.shadowBlur = 15;
    ctx2.strokeStyle = configCategory.colors.accent;
    ctx2.lineWidth = 6;
    ctx2.beginPath();
    ctx2.arc(0, 0, 100, 0, Math.PI * 2);
    ctx2.stroke();
    // Bordure interne pointillée
    ctx2.strokeStyle = configCategory.colors.accent;
    ctx2.lineWidth = 2;
    ctx2.setLineDash([6, 6]);
    ctx2.beginPath();
    ctx2.arc(0, 0, 88, 0, Math.PI * 2);
    ctx2.stroke();
    ctx2.setLineDash([]);
    // Textes du tampon
    ctx2.fillStyle = configCategory.colors.accent;
    ctx2.font = 'bold 20px sans-serif';
    ctx2.textAlign = 'center';
    ctx2.textBaseline = 'middle';
    ctx2.fillText("OFFICIEL", 0, -30);
    ctx2.font = 'bold 24px sans-serif';
    ctx2.fillText("APPROUVÉ", 0, 10);
    ctx2.font = 'bold 16px sans-serif';
    ctx2.fillText("CUPIDON IA", 0, 45);
    ctx2.restore();

    // 8. Sauvegarde temporaire et envoi des fichiers générés
    const pathImg1 = path.join(__dirname, `cupidon_analyse_${senderID}.png`);
    const pathImg2 = path.join(__dirname, `cupidon_certificat_${senderID}.png`);

    const out1 = fs.createWriteStream(pathImg1);
    const stream1 = canvas1.createPNGStream();
    stream1.pipe(out1);

    const out2 = fs.createWriteStream(pathImg2);
    const stream2 = canvas2.createPNGStream();
    stream2.pipe(out2);

    // Attendre que l'écriture sur le disque soit complètement terminée
    await Promise.all([
      new Promise(resolve => out1.on('finish', resolve)),
      new Promise(resolve => out2.on('finish', resolve))
    ]);

    // Envoi des images
    await api.sendMessage({
      body: `✨ 🔮 **Rapport du Détecteur d'Âmes Sœurs** 🔮 ✨\n\n` +
            `• **Partenaires :** ${name1} & ${name2}\n` +
            `• **Compatibilité :** ${score}%\n` +
            `• **Statut :** ${configCategory.relationType}\n\n` +
            `👉 *Visualisez vos rapports haute fidélité ci-joint.*`,
      attachment: [
        fs.createReadStream(pathImg1),
        fs.createReadStream(pathImg2)
      ]
    }, threadID);

    // Nettoyage des fichiers pour ne pas encombrer le disque
    fs.unlinkSync(pathImg1);
    fs.unlinkSync(pathImg2);
  }
};
