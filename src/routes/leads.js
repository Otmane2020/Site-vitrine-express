const express = require('express');
const router = express.Router();
const { run } = require('../db');
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);
const ADMIN_NOTIFY_EMAIL = 'oben.rockman@gmail.com';

// L'échec d'un email ne doit jamais faire échouer la capture du lead déjà enregistrée en base
async function sendMailSafe(options) {
  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM || 'Webify <noreply@webify-app.com>',
      ...options
    });
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
      to: email,
      subject: '✓ Votre demande a été reçue — Webify',
      html: `
        <h2>Merci ${name} !</h2>
        <p>Votre demande de devis a été enregistrée.</p>
        <p><strong>Prochaine étape:</strong> Notre équipe vous contactera dans les 2 heures (jours ouvrés) pour valider votre projet.</p>
        <hr/>
        <p style="font-size:12px;color:#999;">© Webify 2025</p>
      `
    });

    // Toujours notifié, quel que soit le formulaire (leads, commandes, contact)
    await sendMailSafe({
      to: ADMIN_NOTIFY_EMAIL,
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

  } catch (err) {
    console.error('❌ Erreur capture lead:', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
