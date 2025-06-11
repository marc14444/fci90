const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configuration de base
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Debug middleware (à retirer en production)
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Connexion MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ Connecté à MongoDB"))
  .catch((err) => console.error("❌ Erreur MongoDB:", err));

// Routes API AVANT les static files et fallback
const candidatureRoutes = require("./routes/candidature");
app.use("/api/candidature", candidatureRoutes);

// Servir les fichiers statiques
app.use(express.static(path.join(__dirname, "frontend")));

// Route fallback pour le SPA - SEULEMENT pour les routes non-API
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "index.html"));
});

// Gestion des erreurs globales
app.use((err, req, res, next) => {
  console.error("🔥 Erreur globale:", err);

  // Si c'est l'erreur path-to-regexp, donner plus d'infos
  if (err.message.includes("Missing parameter name")) {
    console.error("❌ Erreur de route - vérifiez vos définitions de routes");
    console.error("Route problématique:", req.originalUrl);
  }

  res.status(500).json({
    error: "Erreur serveur interne",
    message:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Une erreur est survenue",
  });
});

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
  console.log(`📁 Frontend servi depuis: ${path.join(__dirname, "frontend")}`);
  console.log(
    `🛣️  API disponible sur: http://localhost:${PORT}/api/candidature`
  );
});
