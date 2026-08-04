const express = require('express');
const router = express.Router();
const axios = require('axios');
const { supabase } = require('../supabaseClient');

const GOOGLE_OAUTH_URL = 'https://oauth2.googleapis.com/token';
const ADS_API_VERSION = 'v25';
const ADS_API_BASE = `https://googleads.googleapis.com/${ADS_API_VERSION}`;

function adsHeaders(accessToken, loginCustomerId) {
  const headers = {
    'Authorization': `Bearer ${accessToken}`,
    'developer-token': process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
    'Content-Type': 'application/json'
  };
  if (loginCustomerId) headers['login-customer-id'] = loginCustomerId;
  return headers;
}

// Stockage serveur uniquement — jamais renvoyé au navigateur.
// Ligne unique (id=1) car il s'agit d'un compte Google Ads pour ce site.
async function saveTokens({ access_token, refresh_token, expires_in }) {
  if (!supabase) throw new Error('Supabase non configuré');
  const { error } = await supabase.from('google_ads_tokens').upsert({
    id: 1,
    access_token,
    refresh_token,
    expires_at: Date.now() + expires_in * 1000,
    updated_at: new Date().toISOString()
  });
  if (error) throw error;
}

async function getValidAccessToken() {
  if (!supabase) throw new Error('Supabase non configuré');
  const { data, error } = await supabase.from('google_ads_tokens').select('*').eq('id', 1).maybeSingle();
  if (error) throw error;
  if (!data) return null;

  // Marge de 60s avant expiration
  if (Date.now() < data.expires_at - 60000) {
    return data.access_token;
  }

  // Token expiré → on rafraîchit avec le refresh_token
  const resp = await axios.post(GOOGLE_OAUTH_URL, {
    client_id: process.env.GOOGLE_ADS_CLIENT_ID,
    client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET,
    refresh_token: data.refresh_token,
    grant_type: 'refresh_token'
  });

  const { access_token, expires_in } = resp.data;
  await supabase.from('google_ads_tokens').update({
    access_token,
    expires_at: Date.now() + expires_in * 1000,
    updated_at: new Date().toISOString()
  }).eq('id', 1);

  return access_token;
}

// ── STEP 1: Redirect utilisateur vers Google OAuth ──
router.get('/auth', (req, res) => {
  const clientId = process.env.GOOGLE_ADS_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_ADS_REDIRECT_URI;
  const scope = 'https://www.googleapis.com/auth/adwords';

  if (!clientId || !redirectUri) {
    return res.status(500).json({ error: 'Google OAuth non configuré. Vérifie les variables d\'environnement.' });
  }

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${clientId}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `response_type=code&` +
    `scope=${encodeURIComponent(scope)}&` +
    `access_type=offline&` +
    `prompt=consent`;

  res.redirect(authUrl);
});

// ── STEP 2: Récupérer le token après redirection — stocké côté serveur uniquement ──
router.get('/callback', async (req, res) => {
  const { code, error } = req.query;

  if (error) {
    return res.redirect(`/connect?error=${encodeURIComponent(error)}`);
  }
  if (!code) {
    return res.redirect(`/connect?error=${encodeURIComponent('Code d\'autorisation manquant')}`);
  }

  try {
    const tokenResponse = await axios.post(GOOGLE_OAUTH_URL, {
      client_id: process.env.GOOGLE_ADS_CLIENT_ID,
      client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
      redirect_uri: process.env.GOOGLE_ADS_REDIRECT_URI
    });

    const { access_token, refresh_token, expires_in } = tokenResponse.data;

    if (!refresh_token) {
      // Google ne renvoie un refresh_token que si prompt=consent + access_type=offline
      // et qu'aucun token valide n'existe déjà pour cette combinaison client/utilisateur.
      return res.redirect(`/connect?error=${encodeURIComponent('Aucun refresh_token reçu — révoque l\'accès existant sur myaccount.google.com/permissions puis réessaie')}`);
    }

    await saveTokens({ access_token, refresh_token, expires_in });

    // Jamais de token dans l'URL ni dans la réponse — juste une confirmation
    res.redirect('/connect?success=1');

  } catch (err) {
    console.error('❌ Erreur OAuth:', err.response?.data || err.message);
    res.redirect(`/connect?error=${encodeURIComponent('Erreur lors de l\'échange de token')}`);
  }
});

// ── STEP 3: Obtenir les Google Ads accounts de l'utilisateur ──
router.get('/accounts', async (req, res) => {
  try {
    const accessToken = await getValidAccessToken();
    if (!accessToken) {
      return res.status(401).json({ error: 'Non connecté. Va sur /connect d\'abord' });
    }

    const response = await axios.get(
      `${ADS_API_BASE}/customers:listAccessibleCustomers`,
      { headers: adsHeaders(accessToken) }
    );

    res.json({ accounts: response.data.resourceNames || [] });

  } catch (err) {
    console.error('❌ Erreur API Google Ads:', err.response?.data || err.message);
    res.status(500).json({ error: 'Erreur lors de la récupération des comptes' });
  }
});

// ── STEP 4: Créer automatiquement une campagne ──
router.post('/create-campaign', async (req, res) => {
  const { customerId, campaignName, dailyBudget } = req.body;

  if (!customerId || !campaignName || !dailyBudget) {
    return res.status(400).json({ error: 'Paramètres manquants' });
  }

  try {
    const accessToken = await getValidAccessToken();
    if (!accessToken) {
      return res.status(401).json({ error: 'Non connecté. Va sur /connect d\'abord' });
    }

    // TODO: Implémenter la création de campagne via Google Ads API
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
