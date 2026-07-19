# Stratégie d'acquisition — SVExpress (site vitrine à 49€)

Votre offre a un avantage marketing énorme : **« 0€ aujourd'hui — payez seulement quand c'est prêt »**. C'est l'argument à mettre en avant PARTOUT, car il supprime le frein n°1 (la peur de payer pour rien).

## 1. Facebook / Instagram Ads — le canal principal ✅

C'est le bon canal pour cette cible (artisans, commerçants, indépendants qui scrollent Facebook le soir).

**Setup :**
1. Créez une page Facebook Business + un compte Meta Business Suite.
2. Créez le pixel dans Events Manager, copiez l'ID dans `.env` → `META_PIXEL_ID=123456789`. Le site enverra automatiquement les événements `PageView`, `InitiateCheckout` (début du formulaire) et `Lead` (commande envoyée).
3. Campagne objectif **« Prospects » (Leads)**, optimisée sur l'événement `Lead`.

**Ciblage recommandé :**
- Zone : France (ou votre région pour commencer)
- Âge : 28-60 ans
- Intérêts : petites entreprises, auto-entrepreneur, artisanat, commerce de proximité, Google My Business
- Ou mieux : audience large + laisser l'algo optimiser sur l'événement Lead (souvent plus efficace en 2025+)

**Créas qui marchent pour ce type d'offre :**
- Avant/après : « Voici le site d'un plombier fait en 48h » avec capture du site
- Vidéo écran du formulaire → aperçu du site (15-30 sec)
- Accroche : « Votre site pro à 49€. Vous ne payez QUE s'il vous plaît. Livré en 48h. »
- Preuve sociale : capture d'un témoignage client

**Budget test :** 10€/jour pendant 7 jours. Coût par lead attendu : 2-8€ sur cette cible. Avec un site à 49€ + options (panier moyen ~70-90€), visez un coût par lead < 10€.

## 2. Canaux gratuits (à faire en parallèle)

- **Groupes Facebook locaux** « entrepreneurs [ville] », « artisans [région] », vide-greniers pro, etc. Répondez aux posts « je cherche quelqu'un pour un site » — il y en a tous les jours.
- **Démarchage Google Maps** : cherchez des commerces de votre ville SANS site web (fiche Google sans lien). Envoyez un message court : « J'ai remarqué que vous n'avez pas de site. J'en crée un pour 49€, vous ne payez que s'il vous plaît. Voici un exemple : [lien] ». Taux de réponse très bon car l'offre est sans risque.
- **Google Business Profile** pour SVExpress lui-même + demandez un avis Google à chaque client livré.
- **LinkedIn** : posts avant/après de chaque site livré.
- **Bouche à oreille structuré** : à chaque livraison, proposez « 10€ de réduction pour vous ou un proche si vous recommandez quelqu'un ».

## 3. SEO (déjà en place sur le site)

- Balises title/description optimisées (« site vitrine 49€ », « création site internet pas cher »)
- Open Graph + JSON-LD Service avec prix
- `robots.txt` + `sitemap.xml`
- **À faire ensuite** : publier 1 page/article par métier cible (« Site internet pour plombier », « Site internet pour restaurant »...) — c'est le levier SEO n°1 pour ce business.

## 4. Ce qu'il faut faire AVANT de lancer les pubs

1. ✅ Mettre le site en production avec un vrai domaine (le `BASE_URL` dans `.env`)
2. ✅ Passer Stripe en mode live (clés `sk_live_...`) + configurer le webhook
3. Créer 2-3 sites démo (même fictifs) pour la section Réalisations — remplacer les maquettes par de vraies captures
4. Ajouter le `META_PIXEL_ID` dans `.env`
5. Mentions légales + politique de confidentialité (obligatoire en France, surtout avec de la pub)

## 5. Rentabilité (ordre de grandeur)

- Panier moyen estimé : 70€ (49€ + 1-2 options)
- Coût par client via Ads : 15-30€ (si 1 lead sur 3 convertit à ~7€/lead)
- Marge par site : dépend de votre temps de production — la clé est de standardiser au maximum la création (templates internes, IA, etc.) pour tenir les 48h sans y passer 3 jours.
- Le renouvellement 39€/an (hébergement+domaine) devient du revenu récurrent quasi passif.
