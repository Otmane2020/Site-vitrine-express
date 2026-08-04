const express = require('express');
const router = express.Router();
const axios = require('axios');

const GOOGLE_OAUTH_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_ADS_API = 'https://googleads.googleapis.com/v14/customers';

// ── STEP 1: Redirect utilisateur vers Google OAuth ──
router.get('/auth', (req, res) => {
  const clientId = process.env.GOOGLE_ADS_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_ADS_REDIRECT_URI;
  const scope = 'https://www.googleapis.com/auth/adwords';
  const responseType = 'code';

  if (!clientId || !redirectUri) {
    return res.status(500).json({ error: 'Google OAuth non configuré. Vérifie .env' });
  }

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${clientId}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `response_type=${responseType}&` +
    `scope=${encodeURIComponent(scope)}&` +
    `access_type=offline&` +
    `prompt=consent`;

  res.redirect(authUrl);
});

// ── STEP 2: Récupérer le token après redirection ──
router.get('/callback', async (req, res) => {
  const { code, error } = req.query;

  if (error) {
    return res.status(400).json({ error: `Erreur Google: ${error}` });
  }

  if (!code) {
    return res.status(400).json({ error: 'Code d\'autorisation manquant' });
  }

  try {
    // Échanger le code contre un access token
    const tokenResponse = await axios.post(GOOGLE_OAUTH_URL, {
      client_id: process.env.GOOGLE_ADS_CLIENT_ID,
      client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
      redirect_uri: process.env.GOOGLE_ADS_REDIRECT_URI
    });

    const { access_token, refresh_token, expires_in } = tokenResponse.data;

    // TODO: Stocker le refresh_token en base de données (chiffré!)
    // Pour l'instant, on le retourne
    req.session.googleAdsToken = {
      access_token,
      refresh_token,
      expires_at: Date.now() + (expires_in * 1000)
    };

    res.json({
      success: true,
      message: 'Connexion Google Ads réussie!',
      token: {
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresIn: expires_in
      }
    });

  } catch (err) {
    console.error('❌ Erreur OAuth:', err.response?.data || err.message);
    res.status(500).json({ error: 'Erreur lors de l\'échange de token' });
  }
});

// ── STEP 3: Obtenir les Google Ads accounts de l'utilisateur ──
router.get('/accounts', async (req, res) => {
  const token = req.session?.googleAdsToken?.access_token;

  if (!token) {
    return res.status(401).json({ error: 'Non authentifié. Fais /oauth/auth d\'abord' });
  }

  try {
    // Récupérer la liste des customer accounts
    const response = await axios.get(
      'https://googleads.googleapis.com/v14/customers:list',
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'developer-token': process.env.GOOGLE_ADS_DEVELOPER_TOKEN
        }
      }
    );

    res.json({
      accounts: response.data.resource_names || []
    });

  } catch (err) {
    console.error('❌ Erreur API Google Ads:', err.response?.data || err.message);
    res.status(500).json({ error: 'Erreur lors de la récupération des comptes' });
  }
});

// ── STEP 4: Créer automatiquement une campagne ──
router.post('/create-campaign', async (req, res) => {
  const token = req.session?.googleAdsToken?.access_token;
  const { customerId, campaignName, dailyBudget } = req.body;

  if (!token) {
    return res.status(401).json({ error: 'Non authentifié' });
  }

  if (!customerId || !campaignName || !dailyBudget) {
    return res.status(400).json({ error: 'Paramètres manquants' });
  }

  try {
    // TODO: Implémenter la création de campagne via Google Ads API
    // Pour l'instant, on retourne un placeholder

    res.json({
      success: true,
      message: `Campagne "${campaignName}" créée avec un budget de ${dailyBudget}€/jour`,
      campaignId: 'TEMP_CAMPAIGN_ID'
    });

  } catch (err) {
    console.error('❌ Erreur création campagne:', err.message);
    res.status(500).json({ error: 'Erreur lors de la création de la campagne' });
  }
});

module.exports = router;
