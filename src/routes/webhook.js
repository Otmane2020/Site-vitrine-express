const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { run, get } = require('../db');

router.post('/', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    if (webhookSecret) {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } else {
      event = JSON.parse(req.body.toString());
    }
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      if (session.payment_status === 'paid') await markOrderPaid(session);
    }

    if (event.type === 'payment_intent.payment_failed') {
      const pi = event.data.object;
      const order = await get('SELECT * FROM orders WHERE stripe_payment_intent = ?', [pi.id]);
      if (order) {
        await run('INSERT INTO order_events (order_id, status, message) VALUES (?, ?, ?)',
          [order.id, 'payment_failed', 'Paiement échoué']);
      }
    }
  } catch (err) {
    console.error('Webhook handler error:', err);
  }

  res.json({ received: true });
});

async function markOrderPaid(session) {
  const order = await get('SELECT * FROM orders WHERE stripe_session_id = ?', [session.id]);
  if (!order || order.payment_status === 'paid') return;

  await run(`
    UPDATE orders
    SET payment_status = 'paid', status = 'paid',
        stripe_payment_intent = ?, paid_at = datetime('now')
    WHERE id = ?
  `, [session.payment_intent, order.id]);

  await run('INSERT INTO order_events (order_id, status, message) VALUES (?, ?, ?)',
    [order.id, 'paid', 'Paiement reçu — mise en ligne de votre site en cours !']);

  console.log(`✅ Commande ${order.tracking_code} payée`);
}

module.exports = router;
