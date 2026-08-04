const express = require('express');
const router = express.Router();
const { run } = require('../db');
const nodemailer = require('nodemailer');

// Email disponible seulement si les deux identifiants SMTP sont configurés
const SMTP_READY = !!(process.env.SMTP_USER && process.env.SMTP_PASS);
const transporter = SMTP_READY
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    })
  : null;

// L'échec d'un email ne doit jamais faire échouer la capture du lead déjà enregistrée en base
async function sendMailSafe(options) {
  if (!transporter) return;
  try {
    await transporter.sendMail(options);
  } catch (err) {
    console.error('⚠️  Envoi email échoué (lead conservé quand même):', err.message);
  }
}

// POST /api/leads — Capture lead depuis annonces
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, business, source } = req.body;

    if (!name || !email || !business) {
      return res.status(400).json({ error: 'Champs requis manquants' });
    }

    if (!email.includes('@')) {
      return res.status(400).json({ error: 'Email invalide' });
    }

    // created_at est omis volontairement : la colonne a un DEFAULT now() côté base,
    // qui ne s'applique que si on ne l'insère pas explicitement (le mini-ORM db.js
    // ne sait pas évaluer datetime('now') et insérerait NULL sinon).
    await run(
      `INSERT INTO leads (name, email, phone, business, source)
       VALUES (?, ?, ?, ?, ?)`,
      [name, email, phone, business, source || 'direct']
    );

    // Réponse immédiate — le lead est acquis, les emails sont best-effort
    res.json({ success: true, message: 'Lead capturé' });

    await sendMailSafe({
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

    if (process.env.ADMIN_EMAIL) {
      await sendMailSafe({
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
        `
      });
    }

  } catch (err) {
    console.error('❌ Erreur capture lead:', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
