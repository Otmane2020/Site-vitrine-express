// Tarification centrale — montants en centimes d'euro
const BASE_PRICE = 4900; // 49€ : 3 pages, domaine 1 an, hébergement 1 an
const INCLUDED_PAGES = 3;
const EXTRA_PAGE_PRICE = 1000; // +10€/page au-delà de 3

const OPTIONS = {
  reservation: { label: 'Réservation en ligne', price: 2900 },
  blog: { label: 'Blog / actualités', price: 1900 },
  galerie: { label: 'Galerie photos avancée', price: 1500 },
  logo: { label: 'Création de logo simple', price: 2500 },
  express24: { label: 'Livraison prioritaire 24h', price: 2000 }
};

function computeTotal(pages = [], optionKeys = []) {
  const extraPages = Math.max(0, (Array.isArray(pages) ? pages.length : 0) - INCLUDED_PAGES);
  let total = BASE_PRICE + extraPages * EXTRA_PAGE_PRICE;
  const validOptions = [];
  for (const key of optionKeys || []) {
    if (OPTIONS[key]) {
      total += OPTIONS[key].price;
      validOptions.push(key);
    }
  }
  return { total, extraPages, validOptions };
}

module.exports = { BASE_PRICE, INCLUDED_PAGES, EXTRA_PAGE_PRICE, OPTIONS, computeTotal };
