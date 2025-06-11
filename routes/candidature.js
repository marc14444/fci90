const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path"); // Import manquant ajouté
const { createClient } = require("@supabase/supabase-js");
const nodemailer = require("nodemailer");
const Candidature = require("../models/Candidature");
require("dotenv").config();

// Configuration Multer
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max par fichier
  },
  fileFilter: (req, file, cb) => {
    // Filtrer les types de fichiers acceptés
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx|txt/;
    const extName = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimeType = allowedTypes.test(file.mimetype);

    if (mimeType && extName) {
      return cb(null, true);
    } else {
      cb(
        new Error(
          "Type de fichier non autorisé. Formats acceptés: PDF, DOC, DOCX, JPG, PNG, TXT"
        )
      );
    }
  },
});

// Configuration Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Configuration Nodemailer
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Fonction d'upload vers Supabase
const uploadFileToSupabase = async (file, candidatureId) => {
  try {
    const fileExt = path.extname(file.originalname).toLowerCase();
    const fileName = `candidatures/${candidatureId}/file-${Date.now()}${fileExt}`;

    const { data, error } = await supabase.storage
      .from("documents")
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      });

    if (error) {
      console.error("Erreur Supabase:", error);
      throw new Error(`Upload failed: ${error.message}`);
    }

    const { data: publicUrlData } = supabase.storage
      .from("documents")
      .getPublicUrl(fileName);

    return publicUrlData.publicUrl;
  } catch (error) {
    console.error("Erreur uploadFileToSupabase:", error);
    throw error;
  }
};

// Route POST principale
router.post("/", upload.array("fichiers", 5), async (req, res) => {
  try {
    const {
      nom,
      prenom,
      date_naissance,
      lieu_naissance,
      nationalite,
      email,
      telephone,
      adresse,
      domaine,
      motivation,
      attentes,
      projet,
      financement,
      financement_autre,
      consentement,
    } = req.body;

    // Validation des champs obligatoires
    if (!nom || !prenom || !email || !telephone) {
      return res.status(400).json({
        error: "Les champs nom, prénom, email et téléphone sont obligatoires",
      });
    }

    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: "Format d'email invalide",
      });
    }

    // Créer la candidature
    const nouvelleCandidature = new Candidature({
      nom,
      prenom,
      date_naissance,
      lieu_naissance,
      nationalite,
      email,
      telephone,
      adresse,
      domaine,
      motivation,
      attentes,
      projet,
      financement,
      financement_autre,
      fichiers: [],
      consentement: consentement === "on" || consentement === true,
    });

    const candidatureSauvee = await nouvelleCandidature.save();

    // Upload des fichiers
    // Dans votre route POST, remplacez cette section :

    // Upload des fichiers
    const fichiers = [];
    const fichiersUrls = []; // ✅ Nouveau : pour stocker juste les URLs
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          const publicUrl = await uploadFileToSupabase(
            file,
            candidatureSauvee._id
          );

          // Pour l'email (détails complets)
          fichiers.push({
            url: publicUrl,
            nom: file.originalname,
            taille: file.size,
            type: file.mimetype,
          });

          // ✅ Pour la base de données (juste l'URL)
          fichiersUrls.push(publicUrl);
        } catch (uploadError) {
          console.error("Erreur upload fichier:", uploadError);
        }
      }
    }

    // Mettre à jour avec SEULEMENT les URLs
    if (fichiersUrls.length > 0) {
      candidatureSauvee.fichiers = fichiersUrls; // ✅ Array de strings
      await candidatureSauvee.save();
    }

    // Envoyer l'email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: "caengimultimedia@gmail.com",
      subject: `Nouvelle candidature FCI90 - ${nom} ${prenom}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Nouvelle candidature FCI90</h2>
          <hr style="border: 1px solid #eee;">
          
          <h3 style="color: #555;">Informations personnelles</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 5px; font-weight: bold;">Nom:</td><td style="padding: 5px;">${nom}</td></tr>
            <tr><td style="padding: 5px; font-weight: bold;">Prénom:</td><td style="padding: 5px;">${prenom}</td></tr>
            <tr><td style="padding: 5px; font-weight: bold;">Email:</td><td style="padding: 5px;">${email}</td></tr>
            <tr><td style="padding: 5px; font-weight: bold;">Téléphone:</td><td style="padding: 5px;">${telephone}</td></tr>
            ${date_naissance ? `<tr><td style="padding: 5px; font-weight: bold;">Date de naissance:</td><td style="padding: 5px;">${date_naissance}</td></tr>` : ""}
            ${lieu_naissance ? `<tr><td style="padding: 5px; font-weight: bold;">Lieu de naissance:</td><td style="padding: 5px;">${lieu_naissance}</td></tr>` : ""}
            ${nationalite ? `<tr><td style="padding: 5px; font-weight: bold;">Nationalité:</td><td style="padding: 5px;">${nationalite}</td></tr>` : ""}
            ${adresse ? `<tr><td style="padding: 5px; font-weight: bold;">Adresse:</td><td style="padding: 5px;">${adresse}</td></tr>` : ""}
          </table>
          
          <h3 style="color: #555;">Formation</h3>
          <table style="width: 100%; border-collapse: collapse;">
            ${domaine ? `<tr><td style="padding: 5px; font-weight: bold;">Domaine:</td><td style="padding: 5px;">${domaine}</td></tr>` : ""}
            ${financement ? `<tr><td style="padding: 5px; font-weight: bold;">Financement:</td><td style="padding: 5px;">${financement}</td></tr>` : ""}
            ${financement_autre ? `<tr><td style="padding: 5px; font-weight: bold;">Autre financement:</td><td style="padding: 5px;">${financement_autre}</td></tr>` : ""}
          </table>
          
          ${motivation ? `<h4 style="color: #555;">Motivation:</h4><p style="background: #f9f9f9; padding: 10px; border-radius: 5px;">${motivation}</p>` : ""}
          ${attentes ? `<h4 style="color: #555;">Attentes:</h4><p style="background: #f9f9f9; padding: 10px; border-radius: 5px;">${attentes}</p>` : ""}
          ${projet ? `<h4 style="color: #555;">Projet:</h4><p style="background: #f9f9f9; padding: 10px; border-radius: 5px;">${projet}</p>` : ""}
          
          <h3 style="color: #555;">Fichiers joints (${fichiers.length})</h3>
          ${
            fichiers.length > 0
              ? `<ul style="list-style-type: none; padding: 0;">
              ${fichiers
                .map(
                  (fichier) =>
                    `<li style="background: #f0f0f0; margin: 5px 0; padding: 10px; border-radius: 5px;">
                  <a href="${fichier.url}" style="color: #007bff; text-decoration: none;">${fichier.nom}</a>
                  <span style="color: #666; font-size: 12px;"> (${Math.round(fichier.taille / 1024)} KB)</span>
                </li>`
                )
                .join("")}
            </ul>`
              : '<p style="color: #666;">Aucun fichier joint</p>'
          }
          
          <hr style="border: 1px solid #eee; margin: 20px 0;">
          <p style="color: #999; font-size: 12px;">
            Candidature reçue le ${new Date().toLocaleDateString("fr-FR")} à ${new Date().toLocaleTimeString("fr-FR")}
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({
      success: true,
      message: "Candidature soumise avec succès",
      candidature_id: candidatureSauvee._id,
      fichiers_uploades: fichiers.length,
    });
  } catch (error) {
    console.error("Erreur candidature:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la soumission",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Erreur interne",
    });
  }
});

// Route GET pour lister les candidatures
router.get("/", async (req, res) => {
  try {
    const candidatures = await Candidature.find()
      .select("-fichiers") // Exclure les fichiers pour optimiser
      .sort({ createdAt: -1 })
      .limit(50); // Limiter à 50 résultats

    res.status(200).json({
      success: true,
      count: candidatures.length,
      candidatures,
    });
  } catch (error) {
    console.error("Erreur GET candidatures:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Erreur interne",
    });
  }
});

// Route GET pour une candidature spécifique
router.get("/:id", async (req, res) => {
  try {
    const candidature = await Candidature.findById(req.params.id);
    if (!candidature) {
      return res.status(404).json({
        success: false,
        message: "Candidature non trouvée",
      });
    }
    res.status(200).json({
      success: true,
      candidature,
    });
  } catch (error) {
    console.error("Erreur GET candidature:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Erreur interne",
    });
  }
});

module.exports = router;
