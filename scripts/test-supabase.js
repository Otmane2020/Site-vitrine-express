#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  try {
    console.log('🔗 Test connexion Supabase...');
    console.log('URL:', process.env.SUPABASE_URL);

    // Tester la connexion
    const { data, error } = await supabase
      .from('orders')
      .select('count', { count: 'exact' })
      .limit(1);

    if (error) {
      if (error.message.includes('relation "orders" does not exist') || error.code === 'PGRST116') {
        console.log('❌ Tables n\'existent pas!\n');
        console.log('📋 ACTION REQUISE:');
        console.log('1. Va à: https://app.supabase.com/project/drpypfcaablispokomce/sql/new');
        console.log('2. Copie/colle le SQL');
        console.log('3. Clique RUN');
        process.exit(1);
      }
      throw error;
    }

    console.log('✅ Connexion réussie! Tables existent.');

  } catch (err) {
    console.error('❌ Erreur:', err.message);
    process.exit(1);
  }
})();
