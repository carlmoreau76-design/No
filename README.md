<p align="center">
  <a href="https://git.io/typing-svg">
    <img src="https://readme-typing-svg.demolab.com?font=Dancing+Script&size=70&pause=1000&color=FF69B4&center=true&vCenter=true&width=1000&height=180&lines=SHADE+HORI+BOT;Version+1.0.0;Created+By+SHADE" alt="Typing SVG" />
  </a>
</p>

<p align="center">
  <img src="https://files.catbox.moe/6ofj4c.jpg" width="750" style="border-radius: 15px; box-shadow: 0px 4px 15px rgba(255, 105, 180, 0.4);" alt="Shade Hori Bot Banner"/>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Version-1.0.0_Premium-ff69b4?style=glass" alt="Version"/>
  <img src="https://img.shields.io/badge/Status-Online_%F0%9F%92%9A-2ecc71?style=glass" alt="Status"/>
  <img src="https://img.shields.io/badge/Platform-GoatBot-lightblue?style=glass" alt="Platform"/>
</p>

---

<p align="center">
  <a href="https://git.io/typing-svg">
    <img src="https://readme-typing-svg.demolab.com?font=Dancing+Script&size=60&pause=1000&color=FF69B4&center=true&vCenter=true&width=1000&height=140&lines=MIYAMURA+EDITION;Miyamura+x+Hori+%F0%9F%92%96;Always+With+You..." alt="Typing SVG Miyamura" />
  </a>
</p>

<p align="center">
  <img src="https://i.ibb.co/m5h7Dq5B/image.jpg" width="750" style="border-radius: 15px; box-shadow: 0px 4px 15px rgba(255, 105, 180, 0.4);" alt="Shade Miyamura Banner"/>
</p>

## 🌸 Shade Hori Bot

<blockquote>
  <p align="center">
    <i>ʚ Shade Hori Bot 🌸😇<br>💖 Toujours active… toujours avec toi ✨ ɞ</i>
  </p>
</blockquote>

---

## 🗿 Customization & Fork

Obtenez votre propre copie du projet pour configurer et déployer votre instance personnalisée du bot :

<p align="left">
  <a href="https://github.com/3voldi/Flemme/fork">
    <img src="https://img.shields.io/badge/FORK%20REPO-Click%20Here-FF69B4?style=for-the-badge&logo=github" alt="Fork Repo"/>
  </a>
</p>

---

## ⚡ Plateformes de Déploiement

Choisissez votre hébergeur préféré pour exécuter **Shade Hori Bot** instantanément :

| Plateforme | Bouton de Déploiement |
| :--- | :--- |
| **TalkDrove** | <a href="https://host.talkdrove.com/dashboard/select-bot/prepare-deployment?botId=51" target="_blank"><img alt="Deploy to TalkDrove" src="https://img.shields.io/badge/DEPLOY-NOW-8A2BE2?style=for-the-badge&logo=visualstudiocode"/></a> |
| **Render** | <a href="https://dashboard.render.com" target="_blank"><img src="https://img.shields.io/badge/DEPLOY_TO-RENDER-ff69b4?style=for-the-badge&logo=render&logoColor=white" alt="Deploy to Render"/></a> |
| **Replit** | <a href="https://repl.it/github/3voldi/Flemme" target="_blank"><img alt="Deploy to Replit" src="https://img.shields.io/badge/REPLIT-orange?style=for-the-badge&logo=replit&logoColor=white"/></a> |
| **Koyeb** | <a href="https://app.koyeb.com/auth/signin" target="_blank"><img alt="Deploy to Koyeb" src="https://img.shields.io/badge/KOYEB-blue?style=for-the-badge&logo=koyeb&logoColor=white"/></a> |
| **Railway** | <a href="https://railway.app/new" target="_blank"><img src="https://img.shields.io/badge/RAILWAY-black?style=for-the-badge&logo=railway" alt="Deploy to Railway"/></a> |

### 🌐 Alternatives secondaires

* **Glitch:** <a href="https://glitch.com/signup" target="_blank"><img src="https://img.shields.io/badge/GLITCH-pink?style=flat-square&logo=glitch" alt="Glitch"/></a>
* **Codespaces:** <a href="https://github.com/codespaces/new" target="_blank"><img src="https://img.shields.io/badge/CODESPACE-navy?style=flat-square&logo=github" alt="Codespaces"/></a>

---

## 💎 Commandes & Modules Spéciaux

| 🔮 Module | 📝 Fonctionnalité & Description | 🔑 Restriction |
| :--- | :--- | :--- |
| `pinterest` | Catalogue d'images Canvas interactif (10 miniatures, pagination dynamique) | 👤 Tout le monde |
| `shadey play` | Écouter un son de la playlist via son numéro de liste | 👤 Tout le monde |
| `shadey list` | Afficher l'index complet de la playlist audio | 👤 Tout le monde |
| `shadey add` | Ajouter une chanson via le format : `Titre \| Lien_MP3` | 👑 Admin Unique |
| `shadey remove` | Menu de suppression interactif pour retirer des musiques | 👑 Admin Unique |
| `paire` | Calculateur de couple amoureux et montage photo des avatars | 👤 Tout le monde |

---

## 💻 Intégration Continue (CI/CD)

Exemple de workflow pour le déploiement continu via GitHub Actions (`.github/workflows/deploy.yml`) :

```yaml
name: Node.js CI

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [20.x]
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
      - name: Install dependencies
        run: npm install
      - name: Start app
        run: npm start
