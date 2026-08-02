const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { run, get, all } = require('../db');
const { computeTotal } = require('../pricing');
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

function generateTrackingCode() {
  return 'WEB-' + Math.random().toString(36).substring(2, 8).toUpperCase();
}

// POST /api/orders — commande gratuite, paiement à la livraison
router.post('/', async (req, res) => {
  try {
    const {
      client_name, client_email, client_phone,
      business_name, business_type, description,
      address, hours, socials,
      domain_choice, domain_name, domain_registrar,
      content_text, logo_choice, photos_choice, style,
      pages, colors, reference_urls, options
    } = req.body;

    if (!client_name || !client_email || !client_phone || !business_name || !description) {
      return res.status(400).json({ error: 'Champs obligatoires manquants' });
    }

    const pagesArr = Array.isArray(pages) ? pages : (pages ? [pages] : []);
    if (pagesArr.length === 0) return res.status(400).json({ error: 'Sélectionnez au moins une page' });

    const optionsArr = Array.isArray(options) ? options : (options ? [options] : []);
    const { total, validOptions } = computeTotal(pagesArr, optionsArr);

    const id = uuidv4();
    let tracking_code, existing;
    do {
      tracking_code = generateTrackingCode();
      existing = await get('SELECT id FROM orders WHERE tracking_code = ?', [tracking_code]);
    } while (existing);

    // Deadline : 48h dès la commande (24h si option express)
    const delayH = validOptions.includes('express24') ? 24 : 48;
    const deadline = new Date(Date.now() + delayH * 60 * 60 * 1000).toISOString();

    await run(`
      INSERT INTO orders (id, client_name, client_email, client_phone, business_name, business_type,
        description, address, hours, socials, domain_choice, domain_name, domain_registrar,
        content_text, logo_choice, photos_choice, style, pages, colors, reference_urls,
        options, amount, tracking_code, status, payment_status, deadline)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'new','unpaid',?)
    `, [
      id, client_name, client_email, client_phone,
      business_name, business_type, description,
      address || null, hours || null, socials ? JSON.stringify(socials) : null,
      domain_choice || null, domain_name || null, domain_registrar || null,
      content_text || null, logo_choice || null, photos_choice || null, style || null,
      JSON.stringify(pagesArr), colors || null, reference_urls || null,
      JSON.stringify(validOptions), total, tracking_code, deadline
    ]);

    await run('INSERT INTO order_events (order_id, status, message) VALUES (?, ?, ?)',
      [id, 'new', 'Demande reçue — 0€ à payer aujourd\'hui. Nous démarrons la création de votre site.']);

    await run('INSERT INTO order_events (order_id, status, message) VALUES (?, ?, ?)',
      [id, 'in_progress', `Livraison prévue avant le ${new Date(deadline).toLocaleString('fr-FR')}`]);

    await run("UPDATE orders SET status = 'in_progress' WHERE id = ?", [id]);

    // Envoyer email de confirmation avec Resend
    try {
      const trackingUrl = `${process.env.BASE_URL || 'https://webify-app.com'}/tracking.html?code=${tracking_code}`;
      const adminUrl = `${process.env.BASE_URL || 'https://webify-app.com'}/admin`;

      // Email client
      await resend.emails.send({
        from: process.env.EMAIL_FROM || 'Webify <noreply@webify-app.com>',
        to: client_email,
        subject: `Votre commande Webify reçue — Suivi: ${tracking_code}`,
        html: `
          <h2>Merci pour votre commande !</h2>
          <p>Nous avons reçu votre demande pour <strong>${business_name}</strong>.</p>
          <p><strong>Code de suivi:</strong> ${tracking_code}</p>
          <p><strong>Montant:</strong> ${total}€ (à payer à la livraison)</p>
          <p><strong>Livraison prévue:</strong> ${new Date(deadline).toLocaleString('fr-FR')}</p>
          <p><a href="${trackingUrl}" style="background: #7c3aed; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Suivre ma commande</a></p>
          <p>Nous vous contacterons au <strong>${client_phone}</strong> pour valider les détails.</p>
        `
      });

      // Email admin — notification nouvelle commande
      await resend.emails.send({
        from: process.env.EMAIL_FROM || 'Webify <noreply@webify-app.com>',
        to: 'oben.rockman@gmail.com',
        subject: `🆕 Nouvelle commande — ${business_name} (${tracking_code})`,
        html: `
          <h2>Nouvelle commande reçue</h2>
          <table style="border-collapse:collapse;width:100%;font-family:sans-serif;font-size:14px">
            <tr><td style="padding:8px;font-weight:bold;background:#f3f4f6">Client</td><td style="padding:8px">${client_name}</td></tr>
            <tr><td style="padding:8px;font-weight:bold;background:#f3f4f6">Email</td><td style="padding:8px"><a href="mailto:${client_email}">${client_email}</a></td></tr>
            <tr><td style="padding:8px;font-weight:bold;background:#f3f4f6">Téléphone</td><td style="padding:8px"><a href="tel:${client_phone}">${client_phone}</a></td></tr>
            <tr><td style="padding:8px;font-weight:bold;background:#f3f4f6">Entreprise</td><td style="padding:8px">${business_name}</td></tr>
            <tr><td style="padding:8px;font-weight:bold;background:#f3f4f6">Secteur</td><td style="padding:8px">${business_type || '—'}</td></tr>
            <tr><td style="padding:8px;font-weight:bold;background:#f3f4f6">Description</td><td style="padding:8px">${description}</td></tr>
            <tr><td style="padding:8px;font-weight:bold;background:#f3f4f6">Montant</td><td style="padding:8px"><strong>${total}€</strong></td></tr>
            <tr><td style="padding:8px;font-weight:bold;background:#f3f4f6">Code suivi</td><td style="padding:8px">${tracking_code}</td></tr>
            <tr><td style="padding:8px;font-weight:bold;background:#f3f4f6">Domaine</td><td style="padding:8px">${domain_choice || '—'}${domain_name ? ' — ' + domain_name : ''}</td></tr>
            <tr><td style="padding:8px;font-weight:bold;background:#f3f4f6">Livraison</td><td style="padding:8px">${new Date(deadline).toLocaleString('fr-FR')}</td></tr>
          </table>
          <br>
          <a href="${adminUrl}" style="background:#7c3aed;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;font-weight:bold">Ouvrir l'admin</a>
        `
      });
    } catch (emailErr) {
      console.warn('Email non envoyé (non bloquant):', emailErr.message);
    }

    res.json({ order_id: id, tracking_code, amount: total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/orders/track/:code — suivi public
router.get('/track/:code', async (req, res) => {
  try {
    const order = await get('SELECT * FROM orders WHERE tracking_code = ?', [req.params.code]);
    if (!order) return res.status(404).json({ error: 'Commande introuvable' });

    const events = await all('SELECT * FROM order_events WHERE order_id = ? ORDER BY created_at ASC', [order.id]);

    res.json({
      tracking_code: order.tracking_code,
      client_name: order.client_name,
      business_name: order.business_name,
      amount: order.amount,
      options: order.options,
      status: order.status,
      payment_status: order.payment_status,
      created_at: order.created_at,
      paid_at: order.paid_at,
      deadline: order.deadline,
      delivered_at: order.delivered_at,
      preview_url: order.preview_url,
      payment_link: order.payment_link,
      delivery_url: order.delivery_url,
      events
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
