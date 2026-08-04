# 🎯 Google Ads Setup — Lead Generation

**Budget:** 5€/jour | **Durée:** 30 jours | **Objectif:** Capturer leads de haute qualité

---

## 📋 Configuration de la campagne

### Paramètres généraux
- **Type de campagne:** Search (Recherche)
- **Sous-type:** Leads
- **Budget quotidien:** 5€
- **Langue:** Français
- **Localisation:** France (+ Belgique/Suisse francophone optionnel)
- **Appareils:** Desktop + Mobile
- **Réseau:** Google Search uniquement (pas Display)

---

## 🎨 Groupes d'annonces & Copies

### **Groupe 1: "Prix & Rapidité"** (Coût bas)
**Mots-clés:** site vitrine pas cher, création site 49 euros, site web artisan pas cher

#### Annonce 1.1 (Headline lead)
```
Titre 1: Site vitrine professionnel 49€
Titre 2: Livré en 48h — Sans engagement
Titre 3: Devis gratuit en 2 minutes

Description:
Création de site web professionnel en 48h chrono.
Domaine + hébergement inclus. 0€ payé d'avance.
Devis gratuit et sans engagement → Demander le vôtre

CTA: Demander un devis gratuit
URL: https://webify.fr/landing-ads.html?utm_source=google&utm_medium=cpc&utm_campaign=leads_prix
```

#### Annonce 1.2 (Urgence)
```
Titre 1: Besoin d'un site rapidement?
Titre 2: Création en 48h à 49€
Titre 3: Satisfait ou remboursé

Description:
Vous avez besoin de votre site cette semaine?
Nous créons votre site vitrine en 48h max.
Devis instantané, aucun paiement d'avance.

CTA: Obtenir mon devis
URL: https://webify.fr/landing-ads.html?utm_source=google&utm_medium=cpc&utm_campaign=leads_urgence
```

---

### **Groupe 2: "Solution complète"** (Coût moyen)
**Mots-clés:** création site internet artisan, site web professionnel pas cher, site e-commerce abordable

#### Annonce 2.1 (All-in-one)
```
Titre 1: Tout compris pour 49€
Titre 2: Site + Domaine + Hébergement 1 an
Titre 3: Paiement après validation

Description:
Domaine .fr inclus. Hébergement 1 an offert.
Design professionnel et mobile-first.
127+ entrepreneurs nous ont fait confiance.

CTA: Commencer gratuitement
URL: https://webify.fr/landing-ads.html?utm_source=google&utm_medium=cpc&utm_campaign=leads_complet
```

#### Annonce 2.2 (Social proof)
```
Titre 1: 127+ entrepreneurs satisfaits
Titre 2: Site vitrine en 48h à 49€
Titre 3: Livré prêt à générer des clients

Description:
Design professionnel sur-mesure.
Optimisé SEO et mobile.
Paiement sécurisé uniquement si satisfait.

CTA: Demander le mien
URL: https://webify.fr/landing-ads.html?utm_source=google&utm_medium=cpc&utm_campaign=leads_social
```

---

### **Groupe 3: "Spécifique secteur"** (Coût plus élevé mais très ciblé)
**Mots-clés:** 
- restaurant création site
- site artisan plombier
- site esthéticienne
- site coaching bien-être

#### Annonce 3.1 (Pour restaurants/services)
```
Titre 1: Site pour votre restaurant
Titre 2: Créé en 48h à 49€
Titre 3: Réservations en ligne intégrées

Description:
Domaine + menu en ligne + formulaire réservation.
Livré en 48h, visible immédiatement sur Google.
Commencez à recevoir des clients dès demain.

CTA: Demander mon site
URL: https://webify.fr/landing-ads.html?utm_source=google&utm_medium=cpc&utm_campaign=leads_restaurant
```

---

## 🎯 Stratégie d'enchères

**Type:** Maximiser les conversions (lead captures)
**Budget quotidien:** 5€
**Ajustement d'offres:** Augmenter pour mobile (+15%) si taux de conversion >5%

---

## 📊 Tracking & Conversions

### Configuration Google Analytics

**1. Ajouter le tag Google Ads:**
```html
<!-- Dans public/landing-ads.html (déjà intégré) -->
<!-- Google Analytics event tracking pour les leads -->
gtag('event', 'conversion', {
  'conversion_id': 'AW-16759234568',  ← À remplacer par ton ID
  'conversion_label': 'webify_lead'
});
```

**2. Paramètres de suivi:**
```
Paramètre: utm_source = google
Paramètre: utm_medium = cpc
Paramètre: utm_campaign = leads_[groupe]
Paramètre: utm_content = [headline_variant]
```

---

## 💰 Optimisation budgétaire

**Budget: 5€/jour = 150€/mois**

Allocation recommandée:
- Groupe 1 (Prix): 60% → 3€/jour (coût bas, volume)
- Groupe 2 (Complet): 25% → 1,25€/jour (conversion moyen)
- Groupe 3 (Spécifique): 15% → 0,75€/jour (coût élevé, qualité)

**KPI attendus (après 2 semaines):**
- CPC: 0,50€ - 1,50€ par clic
- CTR: 3-5%
- Coût par lead: 2€ - 5€
- Taux de conversion lead→commande: 10-20%

---

## 🔗 URLs & Paramètres

**Landing page dédiée:** `https://webify.fr/landing-ads.html`

**Paramètres UTM à ajouter automatiquement:**
- `?utm_source=google`
- `&utm_medium=cpc`
- `&utm_campaign=leads_[type]`
- `&utm_content=[ad_variant]`

---

## ⚙️ Points de vérification avant lancement

- [ ] Landing page `/landing-ads.html` en ligne
- [ ] API `/api/leads` fonctionnelle
- [ ] Email de confirmation envoyé aux leads
- [ ] Email de notification admin configuré
- [ ] Google Analytics installé sur landing-ads.html
- [ ] Conversion tracking configuré dans Google Ads
- [ ] Budget quotidien défini à 5€
- [ ] Groupes d'annonces créés
- [ ] Annonces approuvées par Google

---

## 📱 Instructions de mise en place (dans Google Ads)

### Étape 1: Créer une nouvelle campagne
1. Google Ads → Créer une campagne
2. Objectif: Générer des leads
3. Type: Recherche (Search)

### Étape 2: Paramètres
- Budget quotidien: 5€
- Pays: France
- Langue: Français
- Enchères: Maximiser les conversions

### Étape 3: Groupes d'annonces
Créer 3 groupes:
1. "Prix et rapidité"
2. "Solution complète"
3. "Par secteur"

### Étape 4: Mots-clés
Pour chaque groupe, ajouter les mots-clés listés ci-dessus en correspondance "Requête large"

### Étape 5: Annonces
Copier/coller chaque variante d'annonce

### Étape 6: Landing page
Toutes les annonces → `https://webify.fr/landing-ads.html`

### Étape 7: Extensions (Très important!)
- **Lien de site:** webify.fr, commander.html, tracking.html
- **Callout:** "0€ d'avance", "Satisfait ou remboursé", "Livré en 48h"
- **Appel (Call extension):** Ajouter ton numéro (optionnel)

---

## 🚀 Go-live Checklist

```
✅ Landing page responsive testée
✅ API leads fonctionnelle
✅ Emails configurés (transporter nodemailer)
✅ Google Analytics intégré
✅ Conversion tracking setup
✅ 3 groupes d'annonces créés
✅ Annonces en review chez Google
✅ Extensions ajoutées
✅ Budget: 5€/jour
✅ Notifications admin activées
```

**Une fois lancé:** Surveillance quotidienne pendant 7 jours, puis optimisation basée sur les données.

---

**Besoin d'aide?** Contacte: contact@webify.fr
