const { Command } = require('goatbot');
const axios = require('axios');

module.exports = new Command({
  name: "codegen",
  version: "1.1.0",
  description: "Génère une commande GoatBot via IA",
  usage: "codegen <description>",
  category: "utility",
  role: 2,
  cooldown: 5,

  async execute({ message, args }) {
    const description = args.join(" ").trim();

    if (!description) {
      return message.reply(
`🤖 AI Code Generator

Describe the command you want and I'll generate minimal working code.

Examples:
• .codegen kick command
• .codegen coin flip game
• .codegen show bot uptime

💡 Save the code to scripts/cmds/<name>.js
Then activate with: .cmd load <name>`
      );
    }

    try {
      await message.reply("🤖 Génération du code en cours...");

      const prompt = `
You are a GoatBot v2 JavaScript command generator.

Create a minimal, working command based on this request:
"${description}"

Rules:
- Use GoatBot format (module.exports = Command style if needed)
- Must be fully working
- No explanations
- Output ONLY JavaScript code in a single block
- Command name must be short and lowercase
- Handle basic errors
`;

      const res = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-4o-mini",
          messages: [
            { role: "user", content: prompt }
          ],
          temperature: 0.4,
          max_tokens: 1200
        },
        {
          headers: {
            "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
            "Content-Type": "application/json"
          }
        }
      );

      let code = res.data?.choices?.[0]?.message?.content || "";

      // Nettoyage robuste
      code = code
        .replace(/```js/g, "")
        .replace(/```javascript/g, "")
        .replace(/```/g, "")
        .trim();

      if (!code || !code.includes("module.exports")) {
        return message.reply("❌ Échec génération. Réessaie avec une description plus précise.");
      }

      return message.reply(
`✅ Code généré :

\`\`\`js
${code}
\`\`\`

💡 Mets ça dans scripts/cmds/<nom>.js puis fais .cmd load <nom>`
      );

    } catch (err) {
      console.error("CODEGEN ERROR:", err?.response?.data || err.message);

      return message.reply(
        "❌ Erreur API OpenAI. Vérifie ta clé API ou ton crédit."
      );
    }
  }
});
