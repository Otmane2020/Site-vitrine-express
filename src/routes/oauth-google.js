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

// ── Diagnostic: statut réel du compte (pourquoi CUSTOMER_NOT_ENABLED etc.) ──
router.get('/customer-status/:customerId', async (req, res) => {
  const customerId = String(req.params.customerId).replace('customers/', '');
  try {
    const accessToken = await getValidAccessToken();
    if (!accessToken) {
      return res.status(401).json({ error: 'Non connecté. Va sur /connect d\'abord' });
    }

    const response = await axios.post(
      `${ADS_API_BASE}/customers/${customerId}/googleAds:search`,
      { query: 'SELECT customer.id, customer.descriptive_name, customer.status, customer.test_account, customer.manager, customer.currency_code, customer.time_zone FROM customer LIMIT 1' },
      { headers: adsHeaders(accessToken, customerId) }
    );

    res.json(response.data);

  } catch (err) {
    console.error('❌ Erreur statut compte:', JSON.stringify(err.response?.data || err.message));
    res.status(500).json({ error: 'Erreur lors de la lecture du statut', details: err.response?.data });
  }
});

// ── STEP: Créer (ou récupérer) l'action de conversion "Lead" et son tag Google ──
router.post('/create-conversion-action/:customerId', async (req, res) => {
  const customerId = String(req.params.customerId).replace('customers/', '');
  try {
    const accessToken = await getValidAccessToken();
    if (!accessToken) {
      return res.status(401).json({ error: 'Non connecté. Va sur /connect d\'abord' });
    }

    const createRes = await mutate(customerId, 'conversionActions', accessToken, [{
      create: {
        name: 'Webify — Lead formulaire',
        type: 'WEBPAGE',
        category: 'SUBMIT_LEAD_FORM',
        status: 'ENABLED',
        countingType: 'ONE_PER_CLICK',
        valueSettings: { defaultValue: 20, defaultCurrencyCode: 'EUR', alwaysUseDefaultValue: true }
      }
    }]);
    const conversionResourceName = createRes[0].resourceName;

    const snippetRes = await axios.post(
      `${ADS_API_BASE}/customers/${customerId}/googleAds:search`,
      { query: `SELECT conversion_action.id, conversion_action.tag_snippets FROM conversion_action WHERE conversion_action.resource_name = '${conversionResourceName}'` },
      { headers: adsHeaders(accessToken, customerId) }
    );

    const row = snippetRes.data.results?.[0]?.conversionAction;
    const snippet = row?.tagSnippets?.find(s => s.type === 'WEBSITE') || row?.tagSnippets?.[0];
    const eventSnippet = snippet?.eventSnippet || '';
    const sendToMatch = eventSnippet.match(/send_to['"]?\s*:\s*['"]([^'"]+)['"]/);
    const sendTo = sendToMatch ? sendToMatch[1] : null; // "AW-XXXXXXXXX/LABEL"
    const awId = sendTo ? sendTo.split('/')[0] : null;
    const label = sendTo ? sendTo.split('/')[1] : null;

    res.json({
      success: true,
      conversionAction: conversionResourceName,
      conversionActionId: row?.id,
      awId,
      label,
      sendTo,
      rawEventSnippet: eventSnippet
    });

  } catch (err) {
    const details = err.response?.data;
    console.error('❌ Erreur création conversion action:', JSON.stringify(details || err.message));
    res.status(500).json({ error: 'Erreur lors de la création de la conversion action', details });
  }
});

async function mutate(customerId, resource, accessToken, operations) {
  const res = await axios.post(
    `${ADS_API_BASE}/customers/${customerId}/${resource}:mutate`,
    { operations },
    { headers: adsHeaders(accessToken, customerId) }
  );
  return res.data.results;
}

const FRANCE_GEO_TARGET = 'geoTargetConstants/2250';
const FRENCH_LANGUAGE = 'languageConstants/1002';

// ── STEP 4: Créer une campagne Search réelle (budget + ciblage + groupe + mots-clés + annonce) ──
// La campagne est créée en PAUSED — aucune dépense tant qu'elle n'est pas activée volontairement.
router.post('/create-campaign', async (req, res) => {
  let {
    customerId,
    campaignName = 'Webify — Leads Site Vitrine',
    dailyBudgetEur = 5,
    maxCpcEur = 1.5,
    keywords = [
      'site vitrine pas cher',
      'création site 49 euros',
      'site web artisan pas cher',
      'site internet rapide',
      'créer un site vitrine'
    ],
    finalUrl = 'https://webify-app.com/landing-ads.html?utm_source=google&utm_medium=cpc&utm_campaign=leads_prix'
  } = req.body;

  if (!customerId) {
    return res.status(400).json({ error: 'customerId manquant (ex: 9639623084)' });
  }
  customerId = String(customerId).replace('customers/', '');

  try {
    const accessToken = await getValidAccessToken();
    if (!accessToken) {
      return res.status(401).json({ error: 'Non connecté. Va sur /connect d\'abord' });
    }

    // 1) Budget quotidien
    const budgetResults = await mutate(customerId, 'campaignBudgets', accessToken, [{
      create: {
        name: `${campaignName} - Budget ${Date.now()}`,
        amountMicros: String(Math.round(dailyBudgetEur * 1_000_000)),
        deliveryMethod: 'STANDARD'
      }
    }]);
    const budgetResourceName = budgetResults[0].resourceName;

    // 2) Campagne Search — PAUSED par sécurité, Google Search uniquement (pas Display/partenaires)
    const startDateTime = new Date(Date.now() + 86400000).toISOString().slice(0, 10) + ' 00:00:00';
    const campaignResults = await mutate(customerId, 'campaigns', accessToken, [{
      create: {
        name: `${campaignName} ${Date.now()}`,
        status: 'PAUSED',
        advertisingChannelType: 'SEARCH',
        campaignBudget: budgetResourceName,
        manualCpc: {},
        networkSettings: {
          targetGoogleSearch: true,
          targetSearchNetwork: false,
          targetContentNetwork: false,
          targetPartnerSearchNetwork: false
        },
        startDateTime
      }
    }]);
    const campaignResourceName = campaignResults[0].resourceName;

    // 3) Ciblage France + Français
    await mutate(customerId, 'campaignCriteria', accessToken, [
      { create: { campaign: campaignResourceName, location: { geoTargetConstant: FRANCE_GEO_TARGET } } }
    ]);
    await mutate(customerId, 'campaignCriteria', accessToken, [
      { create: { campaign: campaignResourceName, language: { languageConstant: FRENCH_LANGUAGE } } }
    ]);

    // 4) Groupe d'annonces
    const adGroupResults = await mutate(customerId, 'adGroups', accessToken, [{
      create: {
        name: 'Site vitrine — Prix & rapidité',
        campaign: campaignResourceName,
        status: 'ENABLED',
        type: 'SEARCH_STANDARD',
        cpcBidMicros: String(Math.round(maxCpcEur * 1_000_000))
      }
    }]);
    const adGroupResourceName = adGroupResults[0].resourceName;

    // 5) Mots-clés (correspondance expression)
    await mutate(customerId, 'adGroupCriteria', accessToken,
      keywords.map(text => ({
        create: {
          adGroup: adGroupResourceName,
          status: 'ENABLED',
          keyword: { text, matchType: 'PHRASE' }
        }
      }))
    );

    // 6) Annonce responsive search
    const adResults = await mutate(customerId, 'adGroupAds', accessToken, [{
      create: {
        adGroup: adGroupResourceName,
        status: 'ENABLED',
        ad: {
          finalUrls: [finalUrl],
          responsiveSearchAd: {
            headlines: [
              { text: 'Site vitrine pro 49€' },
              { text: 'Livré en 48h chrono' },
              { text: 'Devis gratuit 2 min' },
              { text: 'Sans engagement' },
              { text: '0€ avant validation' },
              { text: 'Satisfait ou remboursé' }
            ],
            descriptions: [
              { text: 'Création de site vitrine pro en 48h. Domaine et hébergement inclus. Devis gratuit.' },
              { text: '0€ à la commande. Vous payez seulement si le site vous plaît. Sans engagement.' }
            ]
          }
        }
      }
    }]);

    res.json({
      success: true,
      status: 'PAUSED',
      message: `Campagne créée en PAUSE — active-la dans Google Ads quand tu es prêt à dépenser`,
      budget: budgetResourceName,
      campaign: campaignResourceName,
      adGroup: adGroupResourceName,
      ad: adResults[0].resourceName,
      keywordCount: keywords.length
    });

  } catch (err) {
    const details = err.response?.data;
    console.error('❌ Erreur création campagne:', JSON.stringify(details || err.message));
    res.status(500).json({ error: 'Erreur lors de la création de la campagne', details });
  }
});

module.exports = router;
