#!/usr/bin/env node
/**
 * Script pour initialiser les tables dans Supabase
 * Usage: node scripts/init-supabase.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const SQL = `
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  client_phone TEXT,
  business_name TEXT NOT NULL,
  business_type TEXT NOT NULL,
  description TEXT NOT NULL,
  address TEXT,
  hours TEXT,
  socials TEXT,
  domain_choice TEXT,
  domain_name TEXT,
  domain_registrar TEXT,
  content_text TEXT,
  logo_choice TEXT,
  photos_choice TEXT,
  style TEXT,
  pages TEXT NOT NULL,
  colors TEXT,
  reference_urls TEXT,
  options TEXT,
  amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'eur',
  status TEXT DEFAULT 'new',
  payment_status TEXT DEFAULT 'unpaid',
  stripe_session_id TEXT,
  stripe_payment_intent TEXT,
  payment_link TEXT,
  preview_url TEXT,
  tracking_code TEXT UNIQUE NOT NULL,
  notes TEXT,
  delivery_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  paid_at TIMESTAMP,
  delivered_at TIMESTAMP,
  deadline TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_events (
  id SERIAL PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id),
  status TEXT NOT NULL,
  message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admins (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO admins (email, password) VALUES (
  'admin@example.com',
  '$2a$10$Yd5h/sR3KRqM/R2w6.pGRObUTbBq7z8S5sJ4JZkJzQ3iyLw2YZCqm'
) ON CONFLICT (email) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_orders_tracking ON orders(tracking_code);
CREATE INDEX IF NOT EXISTS idx_orders_email ON orders(client_email);
CREATE INDEX IF NOT EXISTS idx_events_order ON order_events(order_id);
`;

(async () => {
  try {
    console.log('🚀 Initialisation de Supabase...');

    const { data, error } = await supabase.rpc('execute_sql', { query: SQL });

    if (error) {
      console.error('❌ Erreur:', error.message);
      process.exit(1);
    }

    console.log('✅ Tables créées avec succès dans Supabase!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Erreur:', err.message);
    process.exit(1);
  }
})();
