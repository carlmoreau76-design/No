const SHOP_ITEMS = {
  voitures: [
  { id: "v1", name: "Volkswagen Golf 8 R", price: 60000, desc: "Compacte nerveuse" },
  { id: "v2", name: "Porsche 911 GT3 RS", price: 230000, desc: "Taillée pour la piste" },
  { id: "v3", name: "Bugatti Chiron Sport", price: 3500000, desc: "Vitesse pure" },
  { id: "v4", name: "Toyota Supra MK5", price: 55000, desc: "Sportive japonaise iconique" },
  { id: "v5", name: "Nissan GT-R R35", price: 120000, desc: "Godzilla de la route" },
  { id: "v6", name: "Lamborghini Huracan EVO", price: 260000, desc: "Supercar agressive" },
  { id: "v7", name: "Ferrari F8 Tributo", price: 280000, desc: "Élégance et puissance" },
  { id: "v8", name: "McLaren 720S", price: 300000, desc: "Aérodynamique extrême" },
  { id: "v9", name: "Audi RS7 Sportback", price: 130000, desc: "Berline ultra rapide" },
  { id: "v10", name: "Mercedes-AMG GT Black Series", price: 350000, desc: "Piste et luxe combinés" },
  { id: "v11", name: "BMW M4 Competition", price: 90000, desc: "Coupé sportif allemand" },
  { id: "v12", name: "Dodge Challenger SRT Hellcat", price: 80000, desc: "Muscle car brut" },
  { id: "v13", name: "Chevrolet Corvette C8", price: 70000, desc: "Supercar américaine abordable" },
  { id: "v14", name: "Ford Mustang Shelby GT500", price: 85000, desc: "Puissance américaine légendaire" },
  { id: "v15", name: "Honda NSX", price: 160000, desc: "Hybrid performance japonaise" },
  { id: "v16", name: "Koenigsegg Jesko", price: 2800000, desc: "Hypercar extrême" },
  { id: "v17", name: "Pagani Huayra", price: 2700000, desc: "Art automobile italien" },
  { id: "v18", name: "Aston Martin DBS Superleggera", price: 320000, desc: "Luxe britannique puissant" },
  { id: "v19", name: "Rolls-Royce Wraith", price: 350000, desc: "Luxe et confort absolu" },
  { id: "v20", name: "Tesla Model S Plaid", price: 110000, desc: "Électrique ultra rapide" }
],
  maisons: [
  { id: "m1", name: "Villa avec Piscine", price: 850000, desc: "Superbe vue dégagée" },
  { id: "m2", name: "Penthouse à New York", price: 4500000, desc: "Vue sur Central Park" },
  { id: "m3", name: "Manoir à Bel-Air", price: 35000000, desc: "Héliport privé" },
  { id: "m4", name: "Maison moderne minimaliste", price: 320000, desc: "Design épuré et lumineux" },
  { id: "m5", name: "Chalet en montagne", price: 540000, desc: "Vue sur les Alpes" },
  { id: "m6", name: "Maison de campagne", price: 210000, desc: "Calme et nature" },
  { id: "m7", name: "Villa en bord de mer", price: 1200000, desc: "Accès direct à la plage" },
  { id: "m8", name: "Loft industriel", price: 750000, desc: "Style urbain et ouvert" },
  { id: "m9", name: "Maison familiale 4 chambres", price: 280000, desc: "Quartier résidentiel" },
  { id: "m10", name: "Duplex moderne", price: 600000, desc: "Deux niveaux spacieux" },
  { id: "m11", name: "Maison écologique", price: 390000, desc: "Énergie solaire intégrée" },
  { id: "m12", name: "Bungalow tropical", price: 450000, desc: "Climat chaud et exotique" },
  { id: "m13", name: "Maison avec jardin XXL", price: 520000, desc: "Grand espace vert" },
  { id: "m14", name: "Villa de luxe", price: 5000000, desc: "Piscine infinity et spa" },
  { id: "m15", name: "Maison de ville", price: 300000, desc: "Proche des commodités" },
  { id: "m16", name: "Château ancien", price: 15000000, desc: "Architecture historique" },
  { id: "m17", name: "Maison contemporaine", price: 680000, desc: "Grandes baies vitrées" },
  { id: "m18", name: "Cabane en bois", price: 90000, desc: "Petit refuge nature" },
  { id: "m19", name: "Villa méditerranéenne", price: 980000, desc: "Style sud de l’Europe" },
  { id: "m20", name: "Maison intelligente (Smart Home)", price: 1100000, desc: "Domotique complète" }
],
  telephones: [
  { id: "t1", name: "iPhone 17 Pro Max", price: 1500, desc: "Le dernier monstre d'Apple" },
  { id: "t2", name: "Samsung Galaxy S26 Ultra", price: 1400, desc: "Le roi du zoom et de l'IA" },
  { id: "t3", name: "Google Pixel 10 Pro", price: 1100, desc: "Photophone ultime" },
  { id: "t4", name: "Xiaomi 15 Ultra", price: 999, desc: "Puissance et photo avancée" },
  { id: "t5", name: "OnePlus 13 Pro", price: 950, desc: "Rapide et fluide" },
  { id: "t6", name: "Huawei P70 Pro", price: 1200, desc: "Caméra exceptionnelle" },
  { id: "t7", name: "Sony Xperia 1 VII", price: 1300, desc: "Écran cinéma 4K" },
  { id: "t8", name: "Oppo Find X8 Pro", price: 1050, desc: "Design premium et charge rapide" },
  { id: "t9", name: "Vivo X200 Pro", price: 1000, desc: "Photo pro et IA avancée" },
  { id: "t10", name: "Asus ROG Phone 9", price: 1150, desc: "Gaming ultra puissant" },
  { id: "t11", name: "Realme GT 7 Pro", price: 800, desc: "Performance à petit prix" },
  { id: "t12", name: "Motorola Edge 60 Ultra", price: 850, desc: "Équilibre performance/design" },
  { id: "t13", name: "Nokia Magic Max", price: 700, desc: "Solidité et autonomie" },
  { id: "t14", name: "Honor Magic 7 Pro", price: 1100, desc: "IA et caméra avancée" },
  { id: "t15", name: "ZTE Nubia Z60 Ultra", price: 900, desc: "Écran sans notch" },
  { id: "t16", name: "Nothing Phone (3)", price: 750, desc: "Design transparent unique" },
  { id: "t17", name: "iPhone 16", price: 999, desc: "Apple classique et puissant" },
  { id: "t18", name: "Samsung Galaxy S25", price: 950, desc: "Haut de gamme équilibré" },
  { id: "t19", name: "Google Pixel 9a Pro", price: 650, desc: "Photo abordable premium" },
  { id: "t20", name: "Infinix Zero Ultra 2", price: 500, desc: "Budget puissant et stylé" }
],
  consoles: [
  { id: "g1", name: "PlayStation 5 Pro", price: 800, desc: "4K 60FPS sans compromis" },
  { id: "g2", name: "Nintendo Switch 2", price: 400, desc: "La polyvalence portable" },
  { id: "g3", name: "PC Master Race RTX 5090", price: 5000, desc: "Puissance absolue hors catégorie" },
  { id: "g4", name: "Xbox Series X2", price: 750, desc: "Puissance et Game Pass ultime" },
  { id: "g5", name: "PlayStation 5 Slim", price: 550, desc: "Version compacte et efficace" },
  { id: "g6", name: "Nintendo Switch OLED+", price: 450, desc: "Écran amélioré et portable" },
  { id: "g7", name: "Steam Deck OLED 2", price: 700, desc: "PC gaming portable avancé" },
  { id: "g8", name: "ASUS ROG Ally X", price: 800, desc: "Console PC portable ultra puissante" },
  { id: "g9", name: "Xbox Series S Pro", price: 500, desc: "Next-gen accessible" },
  { id: "g10", name: "PlayStation 6 Dev Kit", price: 1200, desc: "Version développeur futuriste" },
  { id: "g11", name: "Nintendo Switch Lite 2", price: 300, desc: "Portable pur et simple" },
  { id: "g12", name: "Alienware Console Hybrid", price: 1500, desc: "Console-PC hybride gaming" },
  { id: "g13", name: "Lenovo Legion Go 2", price: 900, desc: "PC gaming portable premium" },
  { id: "g14", name: "MSI Claw 2", price: 850, desc: "Handheld gaming Intel boosté" },
  { id: "g15", name: "Razer Edge Pro 2", price: 650, desc: "Cloud gaming et mobilité" },
  { id: "g16", name: "Oculus Meta Quest 4", price: 600, desc: "VR gaming immersif total" },
  { id: "g17", name: "PlayStation Portal Pro", price: 300, desc: "Streaming PS5 amélioré" },
  { id: "g18", name: "Xbox Cloud Console", price: 350, desc: "Gaming 100% cloud" },
  { id: "g19", name: "Retro Console Ultimate", price: 200, desc: "Toutes les consoles rétro intégrées" },
  { id: "g20", name: "NVIDIA Shield Gaming Box", price: 400, desc: "Streaming et cloud gaming puissant" }
],
  vetements: [
  { id: "f1", name: "Sweat à capuche Nike Tech", price: 120, desc: "Le classique du quotidien" },
  { id: "f2", name: "Veste Moncler Maya", price: 1500, desc: "Pour rester au chaud avec style" },
  { id: "f3", name: "Costume sur mesure Gucci", price: 4500, desc: "Élégance maximale en rendez-vous" },
  { id: "f4", name: "T-shirt Balenciaga oversize", price: 450, desc: "Style streetwear premium" },
  { id: "f5", name: "Jean Levi’s 501 Vintage", price: 90, desc: "Classique intemporel" },
  { id: "f6", name: "Veste en cuir Saint Laurent", price: 2200, desc: "Look rock élégant" },
  { id: "f7", name: "Sneakers Air Jordan 1", price: 250, desc: "Icône du streetwear" },
  { id: "f8", name: "Survêtement Adidas Originals", price: 140, desc: "Confort et style sportif" },
  { id: "f9", name: "Pull en laine Prada", price: 900, desc: "Luxe discret et chaud" },
  { id: "f10", name: "Manteau long Burberry", price: 1800, desc: "Élégance britannique" },
  { id: "f11", name: "Casquette Louis Vuitton", price: 600, desc: "Accessoire de luxe" },
  { id: "f12", name: "Hoodie Off-White", price: 500, desc: "Streetwear hype" },
  { id: "f13", name: "Pantalon cargo Supreme", price: 300, desc: "Style urbain tendance" },
  { id: "f14", name: "Blouson bomber Alpha Industries", price: 200, desc: "Militaire et stylé" },
  { id: "f15", name: "Robe Dior élégante", price: 3500, desc: "Haute couture féminine" },
  { id: "f16", name: "Costume Hugo Boss", price: 800, desc: "Business élégant" },
  { id: "f17", name: "Sneakers Yeezy Boost", price: 400, desc: "Design futuriste" },
  { id: "f18", name: "T-shirt basic Uniqlo", price: 25, desc: "Simple et efficace" },
  { id: "f19", name: "Veste Nike Windbreaker", price: 110, desc: "Léger et sportif" },
  { id: "f20", name: "Ensemble streetwear Trapstar", price: 350, desc: "Style urbain premium" }
],
  bijoux: [
  { id: "b1", name: "Chaîne en Or 18k", price: 2500, desc: "Discrète mais précieuse" },
  { id: "b2", name: "Rolex Submariner Date", price: 15000, desc: "L'horlogerie intemporelle" },
  { id: "b3", name: "Bague Diamant Émeraude", price: 85000, desc: "Éclat spectaculaire" },
  { id: "b4", name: "Collier Cartier Panthère", price: 120000, desc: "Icône du luxe français" },
  { id: "b5", name: "Bracelet Van Cleef Alhambra", price: 60000, desc: "Chance et élégance" },
  { id: "b6", name: "Montre Patek Philippe Nautilus", price: 250000, desc: "Prestige absolu" },
  { id: "b7", name: "Bague Saphir Royal", price: 95000, desc: "Bleu profond royal" },
  { id: "b8", name: "Chaîne Ice Out Diamond", price: 180000, desc: "Blinding luxury style" },
  { id: "b9", name: "Boucles d’oreilles Dior Joaillerie", price: 40000, desc: "Finesse et éclat" },
  { id: "b10", name: "Montre Audemars Piguet Royal Oak", price: 300000, desc: "Design iconique" },
  { id: "b11", name: "Collier en Platine Tiffany", price: 75000, desc: "Pure élégance" },
  { id: "b12", name: "Bague diamant 10 carats", price: 500000, desc: "Extrême rareté" },
  { id: "b13", name: "Bracelet Bulgari Serpenti", price: 90000, desc: "Luxe serpent stylisé" },
  { id: "b14", name: "Chaîne Gucci Ice Edition", price: 110000, desc: "Street luxe brillant" },
  { id: "b15", name: "Montre Richard Mille RM 011", price: 600000, desc: "Hyper horlogerie" },
  { id: "b16", name: "Collier diamant noir rare", price: 450000, desc: "Mystère et puissance" },
  { id: "b17", name: "Bague émeraude colombienne", price: 200000, desc: "Pierre ultra rare" },
  { id: "b18", name: "Chaîne or blanc 24k", price: 85000, desc: "Pureté maximale" },
  { id: "b19", name: "Montre Hublot Big Bang", price: 140000, desc: "Modernité explosive" },
  { id: "b20", name: "Parure royale complète diamant", price: 1000000, desc: "Collection ultime de luxe" }
],
  supermarche: [
  { id: "s1", name: "Pack de Ramen", price: 15, desc: "Le repas économique" },
  { id: "s2", name: "Monster Energy", price: 25, desc: "Énergie instantanée" },
  { id: "s3", name: "Caviar Almas Premium", price: 25000, desc: "Luxe gastronomique" },
  { id: "s4", name: "Pain de mie", price: 8, desc: "Indispensable du petit-déjeuner" },
  { id: "s5", name: "Bouteille d'eau", price: 5, desc: "Hydratation essentielle" },
  { id: "s6", name: "Pizza surgelée", price: 35, desc: "Rapide et savoureuse" },
  { id: "s7", name: "Boîte de céréales", price: 18, desc: "Pour bien commencer la journée" },
  { id: "s8", name: "Lait entier", price: 10, desc: "Riche et nutritif" },
  { id: "s9", name: "Chocolat premium", price: 45, desc: "Douceur gourmande" },
  { id: "s10", name: "Pack de sodas", price: 22, desc: "Pour les fêtes entre amis" },
  { id: "s11", name: "Poulet rôti", price: 65, desc: "Prêt à déguster" },
  { id: "s12", name: "Saumon fumé", price: 120, desc: "Délice raffiné" },
  { id: "s13", name: "Panier de fruits frais", price: 30, desc: "Santé et vitamines" },
  { id: "s14", name: "Fromage affiné", price: 55, desc: "Saveur authentique" },
  { id: "s15", name: "Café arabica premium", price: 80, desc: "Réveil haut de gamme" },
  { id: "s16", name: "Truffe noire", price: 3500, desc: "Produit gastronomique rare" },
  { id: "s17", name: "Foie gras artisanal", price: 1200, desc: "Spécialité de luxe" },
  { id: "s18", name: "Homard vivant", price: 2500, desc: "Prestige culinaire" },
  { id: "s19", name: "Wagyu A5", price: 8000, desc: "La viande d'exception" },
  { id: "s20", name: "Champagne de collection", price: 15000, desc: "Pour célébrer avec élégance" }
],
  cafes: [
    { id: "c1", name: "Café Latte Macchiato", price: 18, desc: "Crémeux à souhait" },
    { id: "c2", name: "Bubble Tea Matcha", price: 30, desc: "Perles de tapioca fraîches" },
    { id: "c3", name: "Gâteau Feuille d'Or", price: 250, desc: "Douceur haut de gamme" }
  ],
  collections: [
    { id: "a1", name: "Katana Forgé Traditionnel", price: 8000, desc: "Acier plié 1000 fois" },
    { id: "a2", name: "Armure de Samouraï Edo", price: 45000, desc: "Pièce historique certifiée" },
    { id: "a3", name: "Sabre Laser Réplique Master", price: 1200, desc: "Éclairage NeoPixel réaliste" }
  ],
  animaux: [
    { id: "p1", name: "Chiot Golden Retriever", price: 1800, desc: "Le compagnon le plus fidèle" },
    { id: "p2", name: "Chat de race Main Coon", price: 2200, desc: "Un géant doux et majestueux" },
    { id: "p3", name: "Bébé Tigre Blanc (Permis)", price: 75000, desc: "Exotisme absolu dans votre domaine" }
  ]
};

function formatMsg(title, content) {
  return `🛒 ═══ 𝗠𝗔𝗚𝗔𝗦𝗜𝗡 𝗚𝗟𝗢𝗕𝗔𝗟 ═══ 🛒\n\n╔══ 🌟 ${title} ══╗\n${content}\n╚══════════════════════╝`;
}

module.exports = {
  config: {
    name: "shopping",
    aliases: ["shop", "magasin", "possede"],
    version: "2.0",
    author: "Shade × ChatGPT",
    role: 0,
    category: "economy",
    shortDescription: "Système de magasin premium à 10 rayons",
    guide: "{pn} list [rayon] (Affiche un catalogue)\n{pn} buy [ID] (Acheter un article)\n{pn} possède (Affiche vos possessions)"
  },

  onStart: async function ({ message, event, args, usersData }) {
    const { senderID } = event;
    const action = args[0] ? args[0].toLowerCase() : null;

    const userData = await usersData.get(senderID);
    if (!userData) return message.reply("❌ Impossible de charger votre profil économique.");

    // Initialisation structurelle de l'inventaire
    if (!userData.customData) userData.customData = {};
    if (!userData.customData.shop) {
      userData.customData.shop = {};
      Object.keys(SHOP_ITEMS).forEach(cat => {
        userData.customData.shop[cat] = [];
      });
    }
    const inv = userData.customData.shop;

    // ==========================================
    // 📋 COMMANDE : AFFICHAGE DES POSSESSIONS
    // ==========================================
    if (action === "possede" || action === "possède" || event.body.toLowerCase().includes("possede")) {
      let txt = "Voici tout ce que vous possédez actuellement :\n\n";
      let empty = true;

      for (const [category, items] of Object.entries(inv)) {
        if (items && items.length > 0) {
          empty = false;
          // Comptage des occurrences pour regrouper les items identiques (ex: Ramen x3)
          const counts = {};
          items.forEach(i => counts[i.name] = (counts[i.name] || 0) + 1);

          txt += `📂 **${category.toUpperCase()} :**\n`;
          for (const [name, count] of Object.entries(counts)) {
            txt += ` • ${name} ${count > 1 ? `(x${count})` : ""}\n`;
          }
          txt += "\n";
        }
      }

      if (empty) return message.reply(formatMsg("VOS BIENS", "📦 Votre inventaire est totalement vide pour le moment !"));
      return message.reply(formatMsg("VOS BIENS", txt.trim()));
    }

    // ==========================================
    // 🛍️ COMMANDE : LISTER UN RAYON (LIST)
    // ==========================================
    if (action === "list") {
      const rayon = args[1] ? args[1].toLowerCase() : null;

      if (!rayon || !SHOP_ITEMS[rayon]) {
        let menu = "Spécifiez un rayon valide à lister parmi les 10 suivants :\n\n";
        Object.keys(SHOP_ITEMS).forEach(cat => menu += `• \`/shop list ${cat}\`\n`);
        menu += `\n💡 *Pour acheter un objet, utilisez :* \`/shop buy [ID]\`\n📌 *Pour voir vos objets :* \`/shop possede\``;
        return message.reply(formatMsg("10 RAYONS DISPONIBLES", menu));
      }

      let catalog = `--- CATALOGUE : ${rayon.toUpperCase()} ---\n\n`;
      SHOP_ITEMS[rayon].forEach(item => {
        catalog += `📦 **${item.name}**\n🔹 ID : \`${item.id}\` | 💰 Prix : **${item.price.toLocaleString()}$**\n💬 *${item.desc}*\n\n`;
      });

      return message.reply(formatMsg(rayon.toUpperCase(), catalog.trim()));
    }

    // ==========================================
    // 💳 COMMANDE : ACHETER UN ARTICLE (BUY)
    // ==========================================
    if (action === "buy") {
      const targetId = args[1] ? args[1].toLowerCase() : null;
      if (!targetId) return message.reply("💡 Exemple d'achat : `/shop buy v2` (pour l'article correspondant).");

      let foundItem = null;
      let itemCategory = null;

      for (const [cat, items] of Object.entries(SHOP_ITEMS)) {
        const item = items.find(i => i.id === targetId);
        if (item) {
          foundItem = item;
          itemCategory = cat;
          break;
        }
      }

      if (!foundItem) return message.reply("❌ ID introuvable dans les rayons du magasin.");

      const wallet = userData.money || 0;
      if (wallet < foundItem.price) {
        return message.reply(`💔 Solde insuffisant. Prix : **${foundItem.price.toLocaleString()}$**. Solde : **${wallet.toLocaleString()}$**.`);
      }

      // Ajout à l'inventaire de la catégorie
      if (!inv[itemCategory]) inv[itemCategory] = [];
      inv[itemCategory].push({ id: foundItem.id, name: foundItem.name, date: Date.now() });

      // Retrait de l'argent et sauvegarde
      userData.money = wallet - foundItem.price;
      await usersData.set(senderID, userData);

      return message.reply(`🎉 **ACHAT VALIDÉ !**\n\nVous venez d'acquérir : **${foundItem.name}** !\n📉 Montant déduit : -**${foundItem.price.toLocaleString()}$**\n💳 Solde restant : **${userData.money.toLocaleString()}$**.\n\nType \`/shop possede\` pour voir tes biens.`);
    }

    // Menu d'accueil par défaut si aucune option n'est entrée
    let defaultMenu = `Bienvenue chez le grossiste du bot !\nPortefeuille : ** ${(userData.money || 0).toLocaleString()}$**\n\n🏬 **Explorez nos 10 Rayons d'achats :**\n`;
    Object.keys(SHOP_ITEMS).forEach(cat => defaultMenu += `• \`/shop list ${cat}\`\n`);
    defaultMenu += `\n⚙️ **Commandes de gestion :**\n• \`/shop buy [ID]\` : Acheter l'item\n• \`/shop possede\` : Voir vos possessions globales`;

    return message.reply(formatMsg("ACCUEIL SHOPPING", defaultMenu));
  }
};
