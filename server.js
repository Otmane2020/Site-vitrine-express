require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const fs = require('fs');
const { initDb } = require('./src/db');
const blogRoutes = require('./src/routes/blog');

const app = express();
const PORT = process.env.PORT || 3000;
const SITE_URL = process.env.BASE_URL || 'https://webify-app.com';

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

function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

// SSR meta tags + Article JSON-LD for individual blog posts (the /blog list
// page stays client-rendered — only single-article pages need per-URL
// metadata for crawlers that don't execute JS).
app.get('/blog/:slug', async (req, res, next) => {
  const article = await blogRoutes.findArticleBySlug(req.params.slug);
  if (!article) return next(); // falls through to the /blog* SPA handler below (client shows "not found")

  const template = fs.readFileSync(path.join(__dirname, 'public', 'blog.html'), 'utf8');
  const url = `${SITE_URL}/blog/${article.slug}`;
  const title = `${escapeHtml(article.title)} — Webify Blog`;
  const description = escapeHtml(article.description || '');

  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.description || undefined,
    image: article.coverUrl || undefined,
    datePublished: article.date || undefined,
    dateModified: article.date || undefined,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    author: { '@type': 'Organization', name: 'Webify' },
    publisher: { '@type': 'Organization', name: 'Webify', url: SITE_URL }
  });

  const html = template
    .replace(/<title>.*?<\/title>/, `<title>${title}</title>`)
    .replace(/<meta name="description" content=".*?" \/>/, `<meta name="description" content="${description}" />`)
    .replace(/<link rel="canonical" href=".*?" \/>/, `<link rel="canonical" href="${url}" />`)
    .replace(/<meta property="og:title" content=".*?" \/>/, `<meta property="og:title" content="${title}" />`)
    .replace(/<meta property="og:description" content=".*?" \/>/, `<meta property="og:description" content="${description}" />`)
    .replace(/<meta property="og:url" content=".*?" \/>/, `<meta property="og:url" content="${url}" />`)
    .replace('</head>', `<script type="application/ld+json">${jsonLd}</script>\n</head>`);

  res.set('Content-Type', 'text/html');
  res.send(html);
});

// Dynamic sitemap — static pages + hardcoded blog posts + Ranki.ai-published
// articles. Registered before express.static so it wins over any leftover
// static sitemap.xml file in public/.
app.get('/sitemap.xml', async (req, res) => {
  const slugs = await blogRoutes.listAllArticleSlugs();
  const staticUrls = [
    { loc: `${SITE_URL}/`, changefreq: 'weekly', priority: '1.0' },
    { loc: `${SITE_URL}/contact.html`, changefreq: 'monthly', priority: '0.6' },
    { loc: `${SITE_URL}/blog`, changefreq: 'weekly', priority: '0.7' }
  ];
  const articleUrls = slugs.map(slug => ({
    loc: `${SITE_URL}/blog/${slug}`,
    changefreq: 'monthly',
    priority: '0.6'
  }));
  const urls = [...staticUrls, ...articleUrls]
    .map(u => `  <url>\n    <loc>${u.loc}</loc>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`)
    .join('\n');

  res.set('Content-Type', 'application/xml');
  res.send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
});

// llms.txt — machine-readable summary for LLM/AI crawlers (GEO).
app.get('/llms.txt', async (req, res) => {
  const slugs = await blogRoutes.listAllArticleSlugs();
  const articleLines = slugs.map(slug => `- ${SITE_URL}/blog/${slug}`).join('\n');
  res.set('Content-Type', 'text/plain');
  res.send(
`# Webify

> Développeur de sites web, d'applications et de projets sur mesure intégrant l'intelligence artificielle (IA, LLM), en France. Devis gratuit, sans engagement.

## Pages principales
- ${SITE_URL}/ — présentation, offres, FAQ
- ${SITE_URL}/contact.html — contact et devis
- ${SITE_URL}/blog — articles et guides

## Articles de blog
${articleLines}
`);
});

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
app.use('/api/blog', blogRoutes);
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
app.get('/contact*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'contact.html'));
});

initDb();

app.listen(PORT, () => {
  console.log(`✅ Site Vitrine Express démarré sur http://localhost:${PORT}`);
  console.log(`📊 Admin: http://localhost:${PORT}/admin`);
});
