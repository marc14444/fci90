const mongoose = require("mongoose");

const CandidatureSchema = new mongoose.Schema(
  {
    nom: String,
    prenom: String,
    date_naissance: Date,
    lieu_naissance: String,
    nationalite: String,
    email: String,
    telephone: String,
    adresse: String,
    domaine: String,
    motivation: String,
    attentes: String,
    projet: String,
    financement: String,
    financement_autre: String,
    fichiers: [String],
    consentement: Boolean,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Candidature", CandidatureSchema);
