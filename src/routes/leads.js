const express = require('express');
const router = express.Router();
const { run } = require('../db');
const nodemailer = require('nodemailer');

// Init email transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// POST /api/leads — Capture lead depuis annonces
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, business, source } = req.body;

    if (!name || !email || !business) {
      return res.status(400).json({ error: 'Champs requis manquants' });
    }

    // Valider email
    if (!email.includes('@')) {
      return res.status(400).json({ error: 'Email invalide' });
    }

    // Insérer en base
    await run(
      `INSERT INTO leads (name, email, phone, business, source, created_at)
       VALUES (?, ?, ?, ?, ?, datetime('now'))`,
      [name, email, phone, business, source || 'direct']
    );

    // Envoyer confirmation au lead
    if (process.env.SMTP_USER) {
      await transporter.sendMail({
        from: process.env.SMTP_USER,
        to: email,
        subject: '✓ Votre demande a été reçue — Webify',
        html: `
          <h2>Merci ${name} !</h2>
          <p>Votre demande de devis a été enregistrée.</p>
          <p><strong>Prochaine étape:</strong> Notre équipe vous contactera dans les 2 heures (jours ouvrés) pour valider votre projet.</p>
          <p>📞 Vous avez besoin d'aide? Appelez-nous au <strong>+33 1 23 45 67 89</strong></p>
          <hr/>
          <p style="font-size:12px;color:#999;">© Webify 2025</p>
        `
      });
    }

    // Envoyer notification admin
    if (process.env.ADMIN_EMAIL) {
      await transporter.sendMail({
        from: process.env.SMTP_USER,
        to: process.env.ADMIN_EMAIL,
        subject: `🎉 Nouveau lead: ${name} (${business})`,
        html: `
          <h3>Nouveau lead reçu!</h3>
          <p><strong>Nom:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Téléphone:</strong> ${phone || 'N/A'}</p>
          <p><strong>Secteur:</strong> ${business}</p>
          <p><strong>Source:</strong> ${source}</p>
          <p><strong>Date:</strong> ${new Date().toLocaleString('fr-FR')}</p>
          <hr/>
          <p><a href="http://localhost:3000/admin">Voir les leads dans l'admin</a></p>
        `
      });
    }

    res.json({ success: true, message: 'Lead capturé' });

  } catch (err) {
    console.error('❌ Erreur capture lead:', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
