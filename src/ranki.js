// Reads published articles synced from Ranki.ai (ranki_articles table) into
// the site's blog. Uses the same SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY
// already configured for orders/leads — no separate credentials needed.
// Fails soft: if Supabase isn't configured or the request errors, callers
// get an empty result so the rest of the blog keeps working.

const { createClient } = require('@supabase/supabase-js');

const USE_SUPABASE = !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
const supabase = USE_SUPABASE
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  : null;

function toArticleSummary(row) {
  return {
    slug: row.slug,
    title: row.title,
    description: row.excerpt || '',
    date: (row.published_at || row.created_at || '').slice(0, 10),
    readTime: null,
    category: row.content_type || 'Actualités',
    source: 'ranki'
  };
}

function toArticleFull(row) {
  return {
    slug: row.slug,
    title: row.title,
    description: row.excerpt || '',
    date: (row.published_at || row.created_at || '').slice(0, 10),
    readTime: null,
    category: row.content_type || 'Actualités',
    content: row.content_html || '',
    coverUrl: row.cover_url || null,
    keywords: row.keywords || [],
    source: 'ranki'
  };
}

async function listRankiArticles() {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('ranki_articles')
    .select('slug, title, excerpt, content_type, published_at, created_at')
    .eq('status', 'published')
    .order('published_at', { ascending: false });
  if (error) {
    console.warn('⚠️  ranki_articles list error:', error.message);
    return [];
  }
  return (data || []).map(toArticleSummary);
}

async function getRankiArticleBySlug(slug) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('ranki_articles')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();
  if (error) {
    console.warn('⚠️  ranki_articles get error:', error.message);
    return null;
  }
  return data ? toArticleFull(data) : null;
}

module.exports = { listRankiArticles, getRankiArticleBySlug };
