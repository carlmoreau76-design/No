const express = require("express");
const lyricsFinder = require("lyrics-finder");
const app = express();
const PORT = process.env.PORT || 3000;

app.get("/api/lyrics", async (req, res) => {
  const song = req.query.song;
  
  if (!song) {
    return res.status(400).json({ error: "Veuillez fournir un paramètre 'song'." });
  }

  try {
    // Recherche automatique de l'artiste et des paroles
    const lyrics = await lyricsFinder("", song) || "Paroles introuvables.";
    
    // Structure de la réponse de ton API
    res.json({
      title: song,
      artist: "Recherche API",
      lyrics: lyrics,
      image: "https://i.imgur.com/4M7QYqH.jpg" // Image par défaut
    });
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la recherche des paroles." });
  }
});

app.listen(PORT, () => {
  console.log(`Ton API de paroles est en ligne sur le port ${PORT}`);
});
