// Reads published articles synced from Ranki.ai (ranki_articles table) into
// the site's blog. Deliberately hardcoded to the "webify-app" Supabase
// project rather than reusing process.env.SUPABASE_URL: that variable (used
// for orders/leads) points to a different/misconfigured project on this
// deployment, which made every Ranki-published article 404 even though the
// row existed. Uses the public anon key, not the service role key — reads
// are safe with just the anon key because RLS already restricts SELECT to
// status = 'published' (see the ranki_articles migration), so this is not a
// secret and is fine to ship in the bundle.
// Fails soft: if the request errors, callers get an empty result so the
// rest of the blog keeps working.

const { createClient } = require('@supabase/supabase-js');

const RANKI_SUPABASE_URL = 'https://eecwrwfsfwjrnfckzbez.supabase.co';
const RANKI_SUPABASE_ANON_KEY = 'sb_publishable_RkLSjPM1ofao_JOaeyHDWg_rD5NHt8T';

const supabase = createClient(RANKI_SUPABASE_URL, RANKI_SUPABASE_ANON_KEY);

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
