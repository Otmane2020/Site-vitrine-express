const express = require('express');
const router = express.Router();

const articles = [
  {
    slug: 'site-vitrine-48h-auto-entrepreneur',
    title: 'Créer un site vitrine en 48h pour auto-entrepreneur : le guide complet',
    description: 'Découvrez comment créer rapidement un site vitrine professionnel pour votre auto-entreprise à 49€ avec Webify.',
    image: '/images/article-1.svg',
    date: '2026-01-15',
    readTime: '5 min',
    category: 'Guide',
    content: `
<article class="blog-article">
  <h1>Créer un site vitrine en 48h pour auto-entrepreneur : le guide complet</h1>

  <p class="intro">En tant qu'auto-entrepreneur, avoir un site vitrine professionnel n'est plus une option — c'est une nécessité. Mais comment créer rapidement un site sans compétences techniques ni budget énorme ? Voici comment Webify a aidé plus de 500 auto-entrepreneurs à lancer leur présence en ligne en 48h.</p>

  <h2>Pourquoi un site vitrine est essentiel pour un auto-entrepreneur</h2>
  <p>Selon une étude 2024, 85% des professionnels indépendants perdent des clients faute de présence en ligne. Un site vitrine simple suffit à transformer cette statistique.</p>
  <ul>
    <li><strong>Crédibilité :</strong> Un site renforce votre professionnalisme</li>
    <li><strong>Visibilité :</strong> Vous apparaissez sur Google et attirez des clients</li>
    <li><strong>Conversion :</strong> Un site convertit 5x plus que les réseaux seuls</li>
    <li><strong>ROI :</strong> À 49€, l'investissement est minimal</li>
  </ul>

  <h2>Les erreurs à éviter quand on crée un site</h2>
  <p>Avant Webify, la plupart des auto-entrepreneurs choisissaient entre :</p>
  <ol>
    <li><strong>Faire seul</strong> → Prend des mois, c'est compliqué</li>
    <li><strong>Engager un dev</strong> → 2000€ minimum, trop cher</li>
    <li><strong>Utiliser Wix/Weebly</strong> → Lent, cher à long terme, pas professionnel</li>
  </ol>

  <h2>La solution Webify : site en 48h, payable à la livraison</h2>
  <p>Voici comment ça marche :</p>
  <ol>
    <li><strong>Décrire votre activité</strong> (5 min) : Vous nous envoyez vos infos</li>
    <li><strong>Notre équipe crée</strong> (48h) : Site sur-mesure, optimisé SEO</li>
    <li><strong>Vous validez et payez</strong> : 0€ jusqu'à ce que vous soyez satisfait</li>
  </ol>

  <h2>Cas réels : auto-entrepreneurs qui ont lancé en 48h</h2>
  <p><strong>Marie, coiffeuse à Paris :</strong> "Mon site était prêt vendredi. Lundi, j'avais 3 appels de nouveaux clients."</p>
  <p><strong>Thomas, plombier à Lyon :</strong> "Je pensais que ça coûterait 2000€. 49€, c'est un no-brainer."</p>

  <h2>Optimisé SEO : apparaître sur Google</h2>
  <p>Tous nos sites incluent :</p>
  <ul>
    <li>Balises meta optimisées pour vos mots-clés</li>
    <li>Structure de contenu SEO-friendly</li>
    <li>Sitemap XML et robots.txt</li>
    <li>Mobile-first (obligatoire pour Google)</li>
    <li>Temps de chargement < 2s</li>
  </ul>

  <h2>Le secret de la rapidité : délai de 48h</h2>
  <p>Comment on livre en 48h alors que d'autres prennent 2 semaines ?</p>
  <ul>
    <li>Processus optimisé (pas de réunion inutile)</li>
    <li>Templates professionnels (customisés pour vous)</li>
    <li>Équipe dédiée (pas de file d'attente)</li>
    <li>Livraison testée et validée</li>
  </ul>

  <h2>Combien ça coûte vraiment ?</h2>
  <p><strong>49€ tout compris, jamais.</strong></p>
  <ul>
    <li>Création du site : inclus</li>
    <li>Design professionnel : inclus</li>
    <li>Mobile-responsive : inclus</li>
    <li>Domaine année 1 : inclus</li>
    <li>Hébergement année 1 : inclus</li>
    <li>Email professionnel : inclus</li>
  </ul>

  <h2>Prêt à lancer votre site en 48h ?</h2>
  <p>Plus de 500 auto-entrepreneurs, artisans et petits professionnels font confiance à Webify. Votre tour.</p>
  <p><a href="/commander.html" class="cta-link">Créer mon site maintenant — 0€ aujourd'hui</a></p>
</article>
    `
  },
  {
    slug: 'site-web-avocat-medecin-artisan-professionnel',
    title: 'Site vitrine pour profession libérale : avocat, médecin, artisan',
    description: 'Guide complet pour créer un site professionnel pour avocat, médecin ou artisan. Rapidement, pas cher, et conforme.',
    image: '/images/article-2.svg',
    date: '2026-01-10',
    readTime: '6 min',
    category: 'Guide',
    content: `
<article class="blog-article">
  <h1>Site vitrine pour profession libérale : avocat, médecin, artisan</h1>

  <p class="intro">Les professions libérales (avocats, médecins, dentistes, artisans) ont besoin d'un site vitrine, mais pas d'une usine à gaz. Cet article explique exactement ce qu'il faut et comment le faire rapidement avec Webify.</p>

  <h2>Pourquoi les professions libérales ont besoin d'un site</h2>
  <p>Un client potentiel cherche votre nom sur Google. S'il ne trouve que votre numéro, il va chez le concurrent qui a un site.</p>
  <ul>
    <li><strong>Avocats :</strong> Les clients cherchent vos spécialités avant d'appeler</li>
    <li><strong>Médecins :</strong> Les patients veulent vérifier votre bio, horaires, parking</li>
    <li><strong>Artisans :</strong> Les clients veulent voir vos réalisations et tarifs</li>
  </ul>

  <h2>Ce qu'il faut dans un site de profession libérale</h2>
  <p>Pas besoin de complexe. Juste :</p>
  <ul>
    <li><strong>Qui êtes-vous ?</strong> Bio courte + photo pro</li>
    <li><strong>Quels services ?</strong> Spécialités (droit du travail, cardio, plomberie...)</li>
    <li><strong>Tarifs ?</strong> Transparence ou "Sur devis"</li>
    <li><strong>Horaires et localisation</strong> Où et quand vous recevoir</li>
    <li><strong>Témoignages</strong> Social proof = confiance</li>
    <li><strong>Formulaire de contact</strong> Pour les demandes</li>
  </ul>

  <h2>Les pièges à éviter</h2>
  <p><strong>Ne faites PAS :</strong></p>
  <ul>
    <li>Un site trop complexe (clients ne veulent pas cliquer 10 fois)</li>
    <li>Un site lent (Google pénalise, clients partent)</li>
    <li>Pas de mobile (60% des recherches se font sur téléphone)</li>
    <li>Pas de contact facile (les clients doivent vous trouver en 3 secondes)</li>
  </ul>

  <h2>Cas d'usage : avocat à Paris</h2>
  <p>Pierre, avocat en droit du travail à Paris, a lancé son site en 48h :</p>
  <ul>
    <li>Avant : Page Facebook mal entretenue</li>
    <li>Après : "avocat droit du travail paris" sur Google page 1</li>
    <li>Résultat : +5 nouveaux clients le premier mois</li>
    <li>Coût : 49€ (moins qu'un déjeuner)</li>
  </ul>

  <h2>Cas d'usage : médecin en province</h2>
  <p>Dr. Dupont, généraliste en Bourgogne :</p>
  <ul>
    <li>Besoin : Les nouveaux patients cherchent "médecin + ville" sur Google</li>
    <li>Solution : Site simple avec bio, horaires, parking, prise de RDV</li>
    <li>Impact : 12 nouveaux patients en 2 mois</li>
  </ul>

  <h2>Cas d'usage : artisan (électricien, plombier, menuisier)</h2>
  <p>Mathieu, électricien à Toulouse :</p>
  <ul>
    <li>Avant : Clients trouvaient son compétiteur en premier sur Google</li>
    <li>Après : Site avec photos de réalisations + avis clients</li>
    <li>Résultat : 1 devis par jour (avant : 2 par semaine)</li>
  </ul>

  <h2>SEO local : être visible près de chez vous</h2>
  <p>Pour les professions libérales, le local prime sur le global.</p>
  <ul>
    <li>Mots-clés locaux : "avocat paris" vs "avocat"</li>
    <li>Google My Business : à mettre à jour</li>
    <li>Adresse complète sur le site : essentiel</li>
    <li>Numéro de téléphone visible : facilite les appels</li>
  </ul>

  <h2>Combien ça coûte, avec Webify ?</h2>
  <p><strong>49€. C'est tout.</strong></p>
  <p>Pas d'abonnement caché, pas de frais supplémentaires. Vous payez quand c'est prêt.</p>

  <h2>Prêt à avoir un site pro ?</h2>
  <p><a href="/commander.html" class="cta-link">Créer mon site — 0€ maintenant</a></p>
</article>
    `
  },
  {
    slug: 'pourquoi-site-vitrine-2024-entrepreneur-independant',
    title: 'Pourquoi avoir un site vitrine en 2024 : chiffres et tendances',
    description: 'Les chiffres 2024 qui prouvent qu\'un site vitrine est indispensable pour auto-entrepreneurs et petits professionnels en France.',
    image: '/images/article-3.svg',
    date: '2026-01-05',
    readTime: '4 min',
    category: 'Tendances',
    content: `
<article class="blog-article">
  <h1>Pourquoi avoir un site vitrine en 2024 : chiffres et tendances</h1>

  <p class="intro">Vous pensez que les réseaux sociaux suffisent ? Les chiffres 2024 disent le contraire. Voici pourquoi un site vitrine est plus important que jamais pour les indépendants.</p>

  <h2>Les chiffres qui changent tout</h2>
  <ul>
    <li><strong>92%</strong> des Français consultent Google avant de contacter une entreprise</li>
    <li><strong>78%</strong> des clients potentiels veulent vérifier les horaires avant d'appeler</li>
    <li><strong>68%</strong> abandonnent un achat si le site n'est pas mobile-friendly</li>
    <li><strong>85%</strong> font confiance davantage aux entreprises avec site qu'aux autres</li>
    <li><strong>60%</strong> des recherches se font maintenant sur mobile (vs 40% il y a 2 ans)</li>
  </ul>

  <h2>Le mythe : "Instagram/Facebook suffisent"</h2>
  <p>Non. Voici pourquoi :</p>
  <ul>
    <li>Les réseaux disparaissent : Twitter, Tiktok changent constamment</li>
    <li>L'algo change : vos posts ne sont vus que par 10% de vos followers</li>
    <li>Vous ne contrôlez rien : Meta peut fermer votre compte demain</li>
    <li>Les clients cherchent sur Google, pas sur Insta</li>
    <li>Un site = vôtre pour toujours (les réseaux = location)</li>
  </ul>

  <h2>Le coût réel d'être invisible en ligne</h2>
  <p>Si vous avez pas de site en 2024 :</p>
  <ul>
    <li>Vous perdez ~30% de vos clients potentiels (ils trouvent le concurrent)</li>
    <li>Vous sembler moins professionnel (pas de site = sketchy)</li>
    <li>Vous dépendez 100% du bouche-à-oreille (pas scalable)</li>
    <li>Vous payez plus en pub (besoin de plus de visibility)</li>
  </ul>

  <h2>Tendance 2024 : "Search before social"</h2>
  <p>Les comportements changent :</p>
  <ul>
    <li>Avant : Chercher sur Instagram</li>
    <li>Maintenant : Chercher sur Google pour vérifier, puis aller sur les réseaux</li>
    <li>Tendance : Les réseaux = buzz, le site = la source de vérité</li>
  </ul>

  <h2>Exemple concret : plombier à Lyon</h2>
  <p><strong>Sans site :</strong></p>
  <ul>
    <li>Un client cherche "plombier urgence lyon" sur Google</li>
    <li>Il trouve 5 plombiers avec sites</li>
    <li>Il n'est pas dedans, donc il appelle un concurrent</li>
    <li>Perte de client</li>
  </ul>

  <p><strong>Avec site (même simple) :</strong></p>
  <ul>
    <li>Il vous trouve sur Google</li>
    <li>Il voit vos horaires, votre numéro, vos avis</li>
    <li>Il vous appelle directement</li>
    <li>+1 client</li>
  </ul>

  <h2>SEO local : le graal pour les indépendants</h2>
  <p>Bonne nouvelle : Un site simple suffit souvent à dominer localement.</p>
  <ul>
    <li>Moins de concurrence locale qu'au niveau national</li>
    <li>Vos clients recherchent "profession + ville" (pas "profession" tout court)</li>
    <li>Un site + Google My Business = visible sur 90% des recherches locales</li>
  </ul>

  <h2>Le bon moment : c'est maintenant</h2>
  <p>Pourquoi attendre ?</p>
  <ul>
    <li>Plus vous attendez, plus vous perdez de clients</li>
    <li>Vos concurrents ont déjà un site</li>
    <li>Le coût : 49€ (moins qu'un déjeuner)</li>
    <li>Le délai : 48h (vous ne perdez pas de temps)</li>
  </ul>

  <h2>Ce que vous aurez avec Webify</h2>
  <ul>
    <li>✅ Site mobile-first (obligatoire en 2024)</li>
    <li>✅ Optimisé SEO (pour Google)</li>
    <li>✅ Professionnel (crédibilité maximale)</li>
    <li>✅ Rapide à charger (Google récompense ça)</li>
    <li>✅ Contrôle total (c'est vôtre)</li>
  </ul>

  <h2>Pas convaincu ? Regardez vos concurrents</h2>
  <p>Cherchez votre profession + votre ville sur Google. Si vous n'êtes pas dedans, c'est que vous perdez des clients à chaque recherche.</p>

  <p><strong>Prêt à vous rattraper ?</strong></p>
  <p><a href="/commander.html" class="cta-link">Créer mon site en 48h — 0€ aujourd'hui</a></p>
</article>
    `
  }
];

router.get('/', (req, res) => {
  res.json(articles.map(a => ({
    slug: a.slug,
    title: a.title,
    description: a.description,
    date: a.date,
    readTime: a.readTime,
    category: a.category
  })));
});

router.get('/:slug', (req, res) => {
  const article = articles.find(a => a.slug === req.params.slug);
  if (!article) {
    return res.status(404).json({ error: 'Article not found' });
  }
  res.json(article);
});

module.exports = router;
