# ⚙️ Configuration Supabase pour Lead Generation

Tu utilises **Supabase PostgreSQL** (pas SQLite local). Suis ces étapes pour activer la capture de leads:

---

## 1️⃣ Créer la table `leads` dans Supabase

### Option A: Via Supabase Dashboard (recommandé, 2 min)

1. Va sur **[console.supabase.com](https://console.supabase.com)**
2. Sélectionne ton projet
3. Va dans **SQL Editor**
4. Copie/colle le contenu du fichier `supabase-migration-leads.sql` 
5. Clique **Run** ▶️

### Option B: Via Supabase CLI (si installé)

```bash
supabase db push supabase-migration-leads.sql
```

### Option C: Créer manuellement dans l'UI

1. **Database** → **Tables** → **Create new**
2. Nom: `leads`
3. Ajoute les colonnes:
   - `id` (int, primary key, auto-increment)
   - `name` (text, required)
   - `email` (text, required)
   - `phone` (text, optional)
   - `business` (text, required)
   - `source` (text, default: 'direct')
   - `created_at` (timestamp, default: now())
   - `updated_at` (timestamp, default: now())

---

## 2️⃣ Activer les accès publics (RLS Policies)

Dans Supabase SQL Editor, exécute:

```sql
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Permet aux visiteurs d'envoyer un lead
CREATE POLICY "Allow public inserts" ON leads
  FOR INSERT WITH CHECK (true);

-- Permet aux admins de voir les leads
CREATE POLICY "Allow select for authenticated" ON leads
  FOR SELECT USING (auth.role() = 'authenticated');
```

---

## 3️⃣ Configurer l'email (Nodemailer)

Ajoute à ton `.env`:

```env
# Email pour notifications de leads
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre-email@gmail.com
SMTP_PASS=your-app-password  # Pas votre mdp Gmail direct!
ADMIN_EMAIL=admin@webify.fr
```

### ⚠️ Gmail: Générer un "App Password"
1. Va sur **[myaccount.google.com](https://myaccount.google.com)**
2. **Sécurité** → **Mots de passe d'application**
3. Sélectionne: Mail + Windows/Linux
4. Copie le mot de passe généré → colle dans `.env` comme `SMTP_PASS`

---

## 4️⃣ Tester la landing page

```bash
npm run dev
# Puis ouvre: http://localhost:3000/landing-ads.html
```

Remplis un test lead → vérifies que:
- ✅ Message de confirmation s'affiche
- ✅ Un email de confirmation arrive
- ✅ Admin reçoit une notification
- ✅ Data apparaît dans Supabase

---

## 5️⃣ Vérifier les leads reçus

### Dans Supabase Dashboard:
**Database** → **Table "leads"** → vois tous les leads capturés

### Via requête SQL:
```sql
SELECT * FROM leads ORDER BY created_at DESC LIMIT 10;
```

---

## 📊 Colonnes de la table

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | BIGINT (PK) | Identifiant unique |
| `name` | TEXT | Nom du lead |
| `email` | TEXT | Email du lead |
| `phone` | TEXT | Téléphone (optionnel) |
| `business` | TEXT | Secteur d'activité |
| `source` | TEXT | Source: 'google_ads', 'direct', etc. |
| `created_at` | TIMESTAMP | Date de création |
| `updated_at` | TIMESTAMP | Dernière mise à jour |

---

## 🔐 Sécurité

**RLS (Row Level Security)** est activé:
- Les visiteurs peuvent **insérer** un lead (POST)
- Seuls les utilisateurs authentifiés peuvent **lire** (GET)
- L'API `/api/leads` gère l'authentification backend

---

## ✅ Checklist avant Google Ads

```
☐ Table 'leads' créée dans Supabase
☐ RLS Policies activées
☐ SMTP configuré dans .env
☐ Landing page http://localhost:3000/landing-ads.html teste ✓
☐ Données arrivent dans Supabase ✓
☐ Emails de confirmation reçus ✓
☐ Google Analytics intégré
```

Une fois tout ✓, tu peux lancer les annonces Google Ads!

---

**Questions?** Contact: contact@webify.fr
