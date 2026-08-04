const express = require('express');
const router = express.Router();
const { run } = require('../db');
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);
const ADMIN_NOTIFY_EMAIL = 'oben.rockman@gmail.com';

function escapeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

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

// Wrapper commun — bannière dégradée + carte blanche + pied de page, compatible clients email
function emailShell({ preheader = '', bodyHtml }) {
  return `
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>
  <body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.06);">
          <tr>
            <td style="background:linear-gradient(135deg,#7c3aed,#ec4899);background-color:#7c3aed;padding:24px 28px;">
              <table role="presentation" cellpadding="0" cellspacing="0"><tr>
                <td style="width:34px;height:34px;background:#ffffff;border-radius:9px;text-align:center;vertical-align:middle;font-weight:bold;color:#7c3aed;font-size:16px;">W</td>
                <td style="padding-left:10px;color:#ffffff;font-size:18px;font-weight:800;">Webify</td>
              </tr></table>
            </td>
          </tr>
          <tr><td style="padding:28px;">
            ${bodyHtml}
          </td></tr>
          <tr>
            <td style="padding:18px 28px;background:#f8fafc;border-top:1px solid #e2e8f0;">
              <p style="margin:0;font-size:12px;color:#94a3b8;">© ${new Date().getFullYear()} Webify — Sites vitrine pro en 48h, payez quand c'est prêt.</p>
            </td>
          </tr>
        </table>
      </td></tr>
    </table>
  </body>`;
}

function clientConfirmationEmail(name) {
  return emailShell({
    preheader: 'Votre demande de devis a bien été reçue par Webify.',
    bodyHtml: `
      <div style="display:inline-flex;align-items:center;gap:6px;background:#f5f3ff;color:#7c3aed;font-size:13px;font-weight:700;padding:6px 14px;border-radius:100px;margin-bottom:16px;">✓ Demande reçue</div>
      <h1 style="margin:0 0 12px;font-size:22px;color:#0a0a0f;">Merci ${escapeHtml(name)} !</h1>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#334155;">Votre demande de devis pour un site vitrine a bien été enregistrée.</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f3ff;border-radius:12px;margin-bottom:20px;">
        <tr><td style="padding:16px 18px;">
          <p style="margin:0;font-size:14px;color:#5b21b6;font-weight:700;">Prochaine étape</p>
          <p style="margin:6px 0 0;font-size:14px;color:#334155;line-height:1.6;">Notre équipe vous recontacte sous <strong>2 heures</strong> (jours ouvrés) pour valider votre projet et répondre à vos questions.</p>
        </td></tr>
      </table>
      <p style="margin:0;font-size:13px;color:#64748b;line-height:1.6;">Aucun engagement, aucun paiement aujourd'hui — vous ne réglez que si le résultat vous plaît.</p>
    `
  });
}

function adminNotificationEmail({ name, email, phone, business, source }) {
  const row = (k, v) => `
    <tr>
      <td style="padding:9px 0;border-bottom:1px solid #e2e8f0;font-size:12px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.03em;width:120px;">${k}</td>
      <td style="padding:9px 0;border-bottom:1px solid #e2e8f0;font-size:14px;color:#0a0a0f;">${v}</td>
    </tr>`;
  return emailShell({
    preheader: `Nouveau lead : ${name} — ${business}`,
    bodyHtml: `
      <div style="display:inline-flex;align-items:center;gap:6px;background:#d1fae5;color:#065f46;font-size:13px;font-weight:700;padding:6px 14px;border-radius:100px;margin-bottom:16px;">🎉 Nouveau lead</div>
      <h1 style="margin:0 0 16px;font-size:20px;color:#0a0a0f;">${escapeHtml(name)} — ${escapeHtml(business)}</h1>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
        ${row('Nom', escapeHtml(name))}
        ${row('Email', `<a href="mailto:${escapeHtml(email)}" style="color:#7c3aed;">${escapeHtml(email)}</a>`)}
        ${row('Téléphone', phone ? `<a href="tel:${escapeHtml(phone)}" style="color:#7c3aed;">${escapeHtml(phone)}</a>` : 'Non renseigné')}
        ${row('Secteur', escapeHtml(business))}
        ${row('Source', escapeHtml(source))}
        ${row('Reçu le', new Date().toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' }))}
      </table>
      <p style="margin:0;font-size:13px;color:#dc2626;font-weight:700;">⏱ À rappeler sous 2h pour garder le meilleur taux de conversion.</p>
    `
  });
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
      subject: '✓ Votre demande de devis a été reçue — Webify',
      html: clientConfirmationEmail(name)
    });

    // Toujours notifié, quel que soit le formulaire (leads, commandes, contact)
    await sendMailSafe({
      to: ADMIN_NOTIFY_EMAIL,
      subject: `🎉 Nouveau devis: ${name} (${business})`,
      html: adminNotificationEmail({ name, email, phone, business, source: source || 'direct' })
    });

  } catch (err) {
    console.error('❌ Erreur capture lead:', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
