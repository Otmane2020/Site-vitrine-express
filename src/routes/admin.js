const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { run, get, all } = require('../db');

function requireAdmin(req, res, next) {
  if (req.session && req.session.admin) return next();
  res.status(401).json({ error: 'Non autorisé' });
}

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const admin = await get('SELECT * FROM admins WHERE email = ?', [email]);
    if (!admin || !bcrypt.compareSync(password, admin.password)) {
      return res.status(401).json({ error: 'Identifiants invalides' });
    }
    req.session.admin = { id: admin.id, email: admin.email };
    res.json({ success: true, email: admin.email });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

router.get('/me', requireAdmin, (req, res) => {
  res.json({ email: req.session.admin.email });
});

router.get('/orders', requireAdmin, async (req, res) => {
  try {
    const { status, search } = req.query;
    let sql = 'SELECT * FROM orders WHERE 1=1';
    const params = [];
    if (status && status !== 'all') { sql += ' AND status = ?'; params.push(status); }
    if (search) {
      sql += ' AND (client_name LIKE ? OR client_email LIKE ? OR tracking_code LIKE ? OR business_name LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }
    sql += ' ORDER BY created_at DESC';
    res.json(await all(sql, params));
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/orders/:id', requireAdmin, async (req, res) => {
  try {
    const order = await get('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    if (!order) return res.status(404).json({ error: 'Commande introuvable' });
    const events = await all('SELECT * FROM order_events WHERE order_id = ? ORDER BY created_at ASC', [order.id]);
    res.json({ ...order, events });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

const STATUS_LABELS = {
  new: 'Demande reçue',
  in_progress: 'Création en cours',
  review: 'Aperçu disponible — en attente de votre validation',
  awaiting_payment: 'En attente de paiement',
  paid: 'Paiement reçu',
  delivered: 'Site mis en ligne',
  completed: 'Projet terminé',
  cancelled: 'Commande annulée'
};

router.patch('/orders/:id/status', requireAdmin, async (req, res) => {
  const { status, message, preview_url, delivery_url } = req.body;
  if (!Object.keys(STATUS_LABELS).includes(status)) {
    return res.status(400).json({ error: 'Statut invalide' });
  }

  try {
    const order = await get('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    if (!order) return res.status(404).json({ error: 'Commande introuvable' });

    let sql = 'UPDATE orders SET status = ?';
    const params = [status];

    if (preview_url) { sql += ', preview_url = ?'; params.push(preview_url); }
    if (status === 'delivered') {
      if (delivery_url) { sql += ', delivery_url = ?'; params.push(delivery_url); }
      sql += ", delivered_at = COALESCE(delivered_at, datetime('now'))";
    }
    sql += ' WHERE id = ?';
    params.push(req.params.id);
    await run(sql, params);

    await run('INSERT INTO order_events (order_id, status, message) VALUES (?, ?, ?)',
      [req.params.id, status, message || STATUS_LABELS[status]]);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/admin/orders/:id/payment-link — génère le lien de paiement Stripe
router.post('/orders/:id/payment-link', requireAdmin, async (req, res) => {
  try {
    const order = await get('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    if (!order) return res.status(404).json({ error: 'Commande introuvable' });
    if (order.payment_status === 'paid') return res.status(400).json({ error: 'Commande déjà payée' });

    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
    const options = JSON.parse(order.options || '[]');

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: {
            name: `Site vitrine — ${order.business_name}`,
            description: `Création de site vitrine (${order.tracking_code})${options.length ? ' + options' : ''}`
          },
          unit_amount: order.amount
        },
        quantity: 1
      }],
      mode: 'payment',
      customer_email: order.client_email,
      metadata: { order_id: order.id, tracking_code: order.tracking_code },
      success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}&tracking=${order.tracking_code}`,
      cancel_url: `${baseUrl}/tracking?code=${order.tracking_code}`,
      locale: 'fr'
    });

    await run(`UPDATE orders SET stripe_session_id = ?, payment_link = ?, status = 'awaiting_payment' WHERE id = ?`,
      [session.id, session.url, order.id]);

    await run('INSERT INTO order_events (order_id, status, message) VALUES (?, ?, ?)',
      [order.id, 'awaiting_payment', `Votre site est prêt ! Réglez ${(order.amount / 100).toFixed(0)}€ pour le mettre en ligne.`]);

    res.json({ success: true, payment_link: session.url });
  } catch (err) {
    console.error('Stripe error:', err.message);
    res.status(500).json({ error: 'Erreur création lien de paiement' });
  }
});

router.patch('/orders/:id/notes', requireAdmin, async (req, res) => {
  try {
    await run('UPDATE orders SET notes = ? WHERE id = ?', [req.body.notes, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/stats', requireAdmin, async (req, res) => {
  try {
    const [total, inProgress, awaiting, paid, delivered, revenue] = await Promise.all([
      get("SELECT COUNT(*) as c FROM orders"),
      get("SELECT COUNT(*) as c FROM orders WHERE status IN ('new','in_progress','review')"),
      get("SELECT COUNT(*) as c FROM orders WHERE status = 'awaiting_payment'"),
      get("SELECT COUNT(*) as c FROM orders WHERE payment_status = 'paid'"),
      get("SELECT COUNT(*) as c FROM orders WHERE status IN ('delivered','completed')"),
      get("SELECT COALESCE(SUM(amount), 0) as r FROM orders WHERE payment_status = 'paid'")
    ]);
    res.json({
      total: total.c, inProgress: inProgress.c, awaiting: awaiting.c,
      paid: paid.c, delivered: delivered.c, revenue: revenue.r
    });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
