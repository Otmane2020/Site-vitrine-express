const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { get } = require('../db');

// GET /api/payment/verify/:sessionId — vérif après retour Stripe
router.get('/verify/:sessionId', async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.retrieve(req.params.sessionId);
    if (session.payment_status === 'paid') {
      const order = await get('SELECT * FROM orders WHERE stripe_session_id = ?', [session.id]);
      if (order) return res.json({ paid: true, tracking_code: order.tracking_code, business_name: order.business_name });
    }
    res.json({ paid: false });
  } catch (err) {
    res.status(500).json({ error: 'Erreur vérification' });
  }
});

module.exports = router;
