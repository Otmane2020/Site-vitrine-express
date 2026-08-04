require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const { initDb } = require('./src/db');

const app = express();
const PORT = process.env.PORT || 3000;

// Body parsers — webhook needs raw body
app.use('/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
}));

app.use(express.static(path.join(__dirname, 'public')));

// Config publique (pixel Meta, etc.)
app.get('/api/config', (req, res) => {
  res.json({ metaPixelId: process.env.META_PIXEL_ID || null });
});

// Routes
app.use('/api/init', require('./src/routes/init'));
app.use('/api/orders', require('./src/routes/orders'));
app.use('/api/payment', require('./src/routes/payment'));
app.use('/api/admin', require('./src/routes/admin'));
app.use('/api/blog', require('./src/routes/blog'));
app.use('/api/leads', require('./src/routes/leads'));
app.use('/oauth', require('./src/routes/oauth-google'));
app.use('/webhook', require('./src/routes/webhook'));

// SPA fallback for admin panel
app.get('/admin*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});
app.get('/tracking*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'tracking.html'));
});
app.get('/blog*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'blog.html'));
});
app.get('/success', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'success.html'));
});
app.get('/connect', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'connect.html'));
});

initDb();

app.listen(PORT, () => {
  console.log(`✅ Site Vitrine Express démarré sur http://localhost:${PORT}`);
  console.log(`📊 Admin: http://localhost:${PORT}/admin`);
});
