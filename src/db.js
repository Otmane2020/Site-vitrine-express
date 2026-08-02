const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, '..', 'data', 'database.db');

let db;

function getDb() {
  if (!db) {
    const dataDir = path.join(__dirname, '..', 'data');
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    db = new sqlite3.Database(DB_PATH);
    db.run('PRAGMA journal_mode=WAL');
  }
  return db;
}

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    getDb().run(sql, params, function (err) {
      if (err) {
        console.error('❌ DB Error:', err.message, '\nSQL:', sql);
        return reject(err);
      }
      resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    getDb().get(sql, params, (err, row) => {
      if (err) {
        console.error('❌ DB Error:', err.message, '\nSQL:', sql);
        return reject(err);
      }
      resolve(row);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    getDb().all(sql, params, (err, rows) => {
      if (err) {
        console.error('❌ DB Error:', err.message, '\nSQL:', sql);
        return reject(err);
      }
      resolve(rows);
    });
  });
}

async function initDb() {
  await run(`CREATE TABLE IF NOT EXISTS orders (
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
    created_at TEXT DEFAULT (datetime('now')),
    paid_at TEXT,
    delivered_at TEXT,
    deadline TEXT
  )`);

  await run(`CREATE TABLE IF NOT EXISTS order_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id TEXT NOT NULL,
    status TEXT NOT NULL,
    message TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (order_id) REFERENCES orders(id)
  )`);

  await run(`CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  )`);

  const adminRow = await get('SELECT COUNT(*) as c FROM admins');
  if (!adminRow || adminRow.c === 0) {
    const email = process.env.ADMIN_EMAIL || 'admin@example.com';
    const password = process.env.ADMIN_PASSWORD || 'admin123';
    const hash = bcrypt.hashSync(password, 10);
    await run('INSERT INTO admins (email, password) VALUES (?, ?)', [email, hash]);
    console.log(`👤 Admin créé: ${email}`);
  }

  console.log('🗄️  Base de données SQLite initialisée');
}

module.exports = { getDb, initDb, run, get, all };
