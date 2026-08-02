const { createClient } = require('@supabase/supabase-js');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const USE_SUPABASE = !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);

let supabase;
let sqliteDb;

if (USE_SUPABASE) {
  supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  console.log('🗄️  Mode: Supabase PostgreSQL');
} else {
  const DB_PATH = path.join(__dirname, '..', 'data', 'database.db');
  const dataDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  sqliteDb = new sqlite3.Database(DB_PATH);
  sqliteDb.run('PRAGMA journal_mode=WAL');
  console.log('🗄️  Mode: SQLite local');
}

// ── SUPABASE HELPERS ──────────────────────────────────────────────────────────

function parseInsert(sql, params) {
  // INSERT INTO table (col1, col2) VALUES (?, ?) → { table, row }
  const m = sql.match(/INSERT INTO (\w+)\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)/i);
  if (!m) throw new Error('Cannot parse INSERT: ' + sql);
  const table = m[1];
  const cols = m[2].split(',').map(c => c.trim());
  const row = {};
  cols.forEach((col, i) => { row[col] = params[i] !== undefined ? params[i] : null; });
  return { table, row };
}

function parseUpdate(sql, params) {
  // UPDATE table SET col1 = ?, col2 = ? WHERE id = ?
  const tableMatch = sql.match(/UPDATE\s+(\w+)\s+SET/i);
  const whereMatch = sql.match(/WHERE\s+(\w+)\s*=\s*\?/i);
  if (!tableMatch) throw new Error('Cannot parse UPDATE: ' + sql);

  const table = tableMatch[1];
  const setStr = sql.match(/SET\s+(.*?)\s*WHERE/i)?.[1] || sql.match(/SET\s+(.*)/i)?.[1];
  const setCols = setStr.split(',').map(s => s.trim().split(/\s*=\s*\?/)[0].trim());

  const updates = {};
  setCols.forEach((col, i) => { updates[col] = params[i]; });
  const whereCol = whereMatch?.[1] || 'id';
  const whereVal = params[setCols.length];

  return { table, updates, whereCol, whereVal };
}

function parseSelect(sql, params) {
  const tableMatch = sql.match(/FROM\s+(\w+)/i);
  const whereMatch = sql.match(/WHERE\s+(\w+)\s*=\s*\?/i);
  const table = tableMatch?.[1];
  const whereCol = whereMatch?.[1];
  const whereVal = params[0];
  const countMatch = sql.match(/COUNT\(\*\)\s+as\s+(\w+)/i);
  return { table, whereCol, whereVal, isCount: !!countMatch, countAlias: countMatch?.[1] || 'c' };
}

// ── MAIN DB FUNCTIONS ─────────────────────────────────────────────────────────

async function run(sql, params = []) {
  const trimmed = sql.trim().toUpperCase();

  if (!USE_SUPABASE) {
    return new Promise((resolve, reject) => {
      sqliteDb.run(sql, params, function (err) {
        if (err) { console.error('❌ SQLite:', err.message); return reject(err); }
        resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  }

  if (trimmed.startsWith('INSERT')) {
    const { table, row } = parseInsert(sql, params);
    const { error } = await supabase.from(table).insert([row]);
    if (error) { console.error('❌ Supabase INSERT:', error.message); throw error; }
    return { changes: 1 };
  }

  if (trimmed.startsWith('UPDATE')) {
    const { table, updates, whereCol, whereVal } = parseUpdate(sql, params);
    const { error } = await supabase.from(table).update(updates).eq(whereCol, whereVal);
    if (error) { console.error('❌ Supabase UPDATE:', error.message); throw error; }
    return { changes: 1 };
  }

  if (trimmed.startsWith('CREATE') || trimmed.startsWith('PRAGMA')) {
    return { changes: 0 };
  }

  console.warn('⚠️  run() SQL non géré:', sql.substring(0, 60));
  return { changes: 0 };
}

async function get(sql, params = []) {
  if (!USE_SUPABASE) {
    return new Promise((resolve, reject) => {
      sqliteDb.get(sql, params, (err, row) => {
        if (err) { console.error('❌ SQLite:', err.message); return reject(err); }
        resolve(row);
      });
    });
  }

  const { table, whereCol, whereVal, isCount, countAlias } = parseSelect(sql, params);

  if (isCount) {
    const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
    if (error) { console.error('❌ Supabase COUNT:', error.message); throw error; }
    return { [countAlias]: count || 0, c: count || 0 };
  }

  let query = supabase.from(table).select('*');
  if (whereCol && whereVal !== undefined) query = query.eq(whereCol, whereVal);
  const { data, error } = await query.limit(1).maybeSingle();
  if (error) { console.error('❌ Supabase SELECT:', error.message); throw error; }
  return data || null;
}

async function all(sql, params = []) {
  if (!USE_SUPABASE) {
    return new Promise((resolve, reject) => {
      sqliteDb.all(sql, params, (err, rows) => {
        if (err) { console.error('❌ SQLite:', err.message); return reject(err); }
        resolve(rows);
      });
    });
  }

  const { table, whereCol, whereVal } = parseSelect(sql, params);
  const orderMatch = sql.match(/ORDER BY\s+(\w+)\s*(ASC|DESC)?/i);

  let query = supabase.from(table).select('*');
  if (whereCol && whereVal !== undefined) query = query.eq(whereCol, whereVal);
  if (orderMatch) query = query.order(orderMatch[1], { ascending: orderMatch[2]?.toUpperCase() !== 'DESC' });

  const { data, error } = await query;
  if (error) { console.error('❌ Supabase SELECT ALL:', error.message); throw error; }
  return data || [];
}

// ── INIT ──────────────────────────────────────────────────────────────────────

async function initDb() {
  if (USE_SUPABASE) {
    // Tables déjà créées via migration Supabase
    console.log('✅ Connecté à Supabase PostgreSQL');
    return;
  }

  // SQLite local
  await run(`CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY, client_name TEXT NOT NULL, client_email TEXT NOT NULL,
    client_phone TEXT, business_name TEXT NOT NULL, business_type TEXT NOT NULL,
    description TEXT NOT NULL, address TEXT, hours TEXT, socials TEXT,
    domain_choice TEXT, domain_name TEXT, domain_registrar TEXT, content_text TEXT,
    logo_choice TEXT, photos_choice TEXT, style TEXT, pages TEXT NOT NULL,
    colors TEXT, reference_urls TEXT, options TEXT, amount INTEGER NOT NULL,
    currency TEXT DEFAULT 'eur', status TEXT DEFAULT 'new',
    payment_status TEXT DEFAULT 'unpaid', stripe_session_id TEXT,
    stripe_payment_intent TEXT, payment_link TEXT, preview_url TEXT,
    tracking_code TEXT UNIQUE NOT NULL, notes TEXT, delivery_url TEXT,
    created_at TEXT DEFAULT (datetime('now')), paid_at TEXT, delivered_at TEXT, deadline TEXT
  )`);

  await run(`CREATE TABLE IF NOT EXISTS order_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT, order_id TEXT NOT NULL,
    status TEXT NOT NULL, message TEXT, created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (order_id) REFERENCES orders(id)
  )`);

  await run(`CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL, created_at TEXT DEFAULT (datetime('now'))
  )`);

  const adminRow = await get('SELECT COUNT(*) as c FROM admins', []);
  if (!adminRow || adminRow.c === 0) {
    const email = process.env.ADMIN_EMAIL || 'admin@example.com';
    const password = process.env.ADMIN_PASSWORD || 'admin123';
    const hash = bcrypt.hashSync(password, 10);
    await run('INSERT INTO admins (email, password) VALUES (?, ?)', [email, hash]);
    console.log(`👤 Admin créé: ${email}`);
  }

  console.log('🗄️  Base de données SQLite initialisée');
}

module.exports = { initDb, run, get, all };
