#!/usr/bin/env node
const { Client } = require('pg');
require('dotenv').config();

// Construire la connection string Supabase
const url = process.env.SUPABASE_URL; // https://drpypfcaablispokomce.supabase.co
const projectRef = url.split('//')[1].split('.')[0]; // drpypfcaablispokomce

const client = new Client({
  host: `db.${projectRef}.supabase.co`,
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: process.env.SUPABASE_SERVICE_ROLE_KEY,
  ssl: { rejectUnauthorized: false }
});

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
`;

(async () => {
  try {
    console.log('🔗 Connexion à Supabase PostgreSQL...');
    await client.connect();
    console.log('✅ Connecté!');

    console.log('📝 Création des tables...');
    await client.query(SQL);

    console.log('✅ Tables créées avec succès!');
    console.log('🎉 Supabase est prêt!');

  } catch (err) {
    console.error('❌ Erreur:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
})();
