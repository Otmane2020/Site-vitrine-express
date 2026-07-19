const { createClient } = require('@supabase/supabase-js');

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Client serveur — utilise la clé service_role (accès complet, ne jamais exposer côté client)
const supabase = (url && serviceKey)
  ? createClient(url, serviceKey, { auth: { persistSession: false } })
  : null;

if (!supabase) {
  console.warn('⚠️  Supabase non configuré (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY manquants dans .env)');
}

module.exports = { supabase };
