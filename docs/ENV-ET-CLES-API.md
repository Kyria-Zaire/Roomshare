# Analyse complète des .env et liste des clés API — Roomshare

Document généré à partir de l’analyse du backend (Laravel), du frontend (Next.js) et des configs utilisées dans l’app.

---

## 1. Backend — Fichier `.env` (dossier `backend/`)

### 1.1 Application (obligatoire)

| Variable       | Description | Exemple / Où l’obtenir |
|----------------|-------------|--------------------------|
| `APP_NAME`     | Nom de l’app | `Roomshare` |
| `APP_ENV`      | Environnement | `local` / `production` |
| `APP_KEY`      | Clé de chiffrement Laravel | Générer : `php artisan key:generate` |
| `APP_DEBUG`    | Mode debug | `true` (dev) / `false` (prod) |
| `APP_URL`      | URL publique du backend | `http://localhost:8000` |

### 1.2 Base de données — MongoDB (obligatoire)

| Variable       | Description | Exemple |
|----------------|-------------|---------|
| `DB_CONNECTION`| Driver | `mongodb` |
| `DB_HOST`      | Hôte MongoDB | `localhost` ou `mongodb` (Docker) |
| `DB_PORT`      | Port | `27017` |
| `DB_DATABASE`  | Nom de la base | `roomshare` |
| `DB_USERNAME`  | Utilisateur (optionnel) | vide ou user |
| `DB_PASSWORD`  | Mot de passe (optionnel) | vide ou password |

### 1.3 URLs Frontend / API (obligatoire pour CORS, mails, Stripe)

| Variable       | Description | Exemple |
|----------------|-------------|---------|
| `FRONTEND_URL` | URL du front Next.js | `http://localhost:3000` |
| `API_URL`      | URL de l’API (CORS) | `http://localhost:8000` |

### 1.4 Stripe — Paiements (clés API à implémenter)

| Variable               | Description | Où l’obtenir |
|------------------------|-------------|--------------|
| `STRIPE_KEY`           | Clé publique (frontend si besoin) | Dashboard Stripe → Clés API → Clé publique (`pk_test_...` / `pk_live_...`) |
| `STRIPE_SECRET`        | Clé secrète (backend uniquement) | Dashboard Stripe → Clés API → Clé secrète (`sk_test_...` / `sk_live_...`) |
| `STRIPE_WEBHOOK_SECRET`| Secret de signature des webhooks | Stripe CLI : `stripe listen --forward-to http://localhost:8000/api/v1/stripe/webhook` → affiche `whsec_...` ; ou Dashboard → Webhooks → Signing secret |

### 1.5 Mail — Envoi d’emails (clés API / identifiants)

| Variable             | Description | Où l’obtenir |
|----------------------|-------------|--------------|
| `MAIL_MAILER`        | Driver (smtp, log, etc.) | `smtp` ou `log` (dev sans envoi) |
| `MAIL_HOST`          | Serveur SMTP | ex. `smtp.mailtrap.io` (Mailtrap) |
| `MAIL_PORT`          | Port SMTP | `2525` (Mailtrap), `587` (TLS) |
| `MAIL_USERNAME`      | Utilisateur SMTP | Compte Mailtrap / Gmail / SendGrid |
| `MAIL_PASSWORD`      | Mot de passe SMTP ou mot de passe d’application | Idem |
| `MAIL_ENCRYPTION`    | Chiffrement | `tls` ou `ssl` |
| `MAIL_FROM_ADDRESS`  | Adresse expéditrice | `noreply@roomshare.app` |
| `MAIL_FROM_NAME`     | Nom expéditeur | `Roomshare` |

Utilisé notamment pour : lien de réinitialisation de mot de passe (`ResetPasswordMail.php`).

### 1.6 Reverb — WebSockets (optionnel, valeurs par défaut en place)

| Variable               | Description | Exemple |
|------------------------|-------------|---------|
| `BROADCAST_CONNECTION` | Driver broadcast | `reverb` |
| `REVERB_APP_ID`        | ID app Reverb | `roomshare` |
| `REVERB_APP_KEY`       | Clé (partagée avec le front) | `roomshare-key` |
| `REVERB_APP_SECRET`    | Secret (backend uniquement) | `roomshare-secret` |
| `REVERB_SERVER_HOST`   | Host du serveur Reverb | `0.0.0.0` |
| `REVERB_SERVER_PORT`   | Port serveur | `8080` |
| `REVERB_HOST`          | Host côté client | `localhost` |
| `REVERB_PORT`          | Port côté client | `8080` |
| `REVERB_SCHEME`        | Schéma | `http` (local) / `https` (prod) |

Pas de clé API externe : tout est local / config projet.

### 1.7 Autres variables backend (optionnel ou Laravel par défaut)

- **Log / Session / Cache / Queue** : `LOG_CHANNEL`, `LOG_LEVEL`, `SESSION_DRIVER`, `CACHE_STORE`, `QUEUE_CONNECTION`, etc. — pas de clés API.
- **Sanctum** : `SANCTUM_STATEFUL_DOMAINS` si besoin (domaines de confiance pour les cookies).

---

## 2. Frontend — Fichier `.env.local` ou `.env` (dossier `frontend/`)

Variables utilisées dans le code (apiClient, echo, route API, next.config).

| Variable                  | Description | Exemple |
|---------------------------|-------------|---------|
| `NEXT_PUBLIC_API_URL`     | URL de l’API pour le client | `/api/v1` (proxy Next) ou `https://api.roomshare.app/api/v1` |
| `API_BACKEND_URL`         | URL du backend (server-side, proxy, etc.) | `http://localhost:8000` |
| `NEXT_PUBLIC_REVERB_HOST` | Host Reverb (WebSocket) | `localhost` |
| `NEXT_PUBLIC_REVERB_PORT` | Port Reverb | `8080` |
| `NEXT_PUBLIC_REVERB_KEY`  | Clé Reverb (Pusher-compatible) | `roomshare-key` |
| `NEXT_PUBLIC_REVERB_SCHEME` | Schéma (http/https) | `http` |
| **Carte (Map)** | | |
| `NEXT_PUBLIC_MAP_STYLE_URL` | URL du style de carte (MapLibre/Mapbox GL) | Optionnel : laissé vide = Carto Positron (gratuit, sans clé). Voir ci‑dessous. |
| `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` | Token Mapbox (si tu utilises un style `mapbox://`) | Optionnel : uniquement si tu passes à Mapbox pour les tuiles. |

**Carte (Map)**  
L’app utilise **MapLibre GL** avec le style **Carto Positron** (`https://basemaps.cartocdn.com/gl/positron-gl-style/style.json`). Aucune clé n’est obligatoire pour ce style en usage raisonnable.  
Si tu veux utiliser **Mapbox** (styles personnalisés, meilleure perf à forte charge), crée un compte sur [mapbox.com](https://www.mapbox.com/), récupère un **Access Token** et définis `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`. Tu pourras alors utiliser une URL de style du type `mapbox://styles/mapbox/...`.  
Tu peux aussi définir `NEXT_PUBLIC_MAP_STYLE_URL` pour forcer une autre URL de style (Maptiler, Stadia, etc.) sans changer le code.

Aucune autre clé API tierce côté frontend pour l’instant (Stripe côté front peut utiliser `STRIPE_KEY` plus tard si tu fais du Stripe.js direct ; pour l’instant le checkout passe par le backend).

---

## 3. Liste complète des clés API à implémenter

Tout ce qui nécessite un compte chez un fournisseur ou une génération explicite.

### 3.1 Obligatoires pour l’app actuelle

| Priorité | Service | Variable(s) | Action |
|----------|---------|-------------|--------|
| 1        | **Laravel** | `APP_KEY` | `cd backend && php artisan key:generate` |
| 2        | **MongoDB** | `DB_HOST`, `DB_PORT`, `DB_DATABASE`, (optionnel) `DB_USERNAME`, `DB_PASSWORD` | Installer MongoDB ou utiliser un cloud (MongoDB Atlas) et remplir les valeurs |
| 3        | **Stripe** | `STRIPE_SECRET`, `STRIPE_WEBHOOK_SECRET` | Créer un compte Stripe → Clés API (test) ; Webhook secret via Stripe CLI en local ou via Dashboard en prod |
| 3        | **Stripe** | `STRIPE_KEY` | Même compte Stripe → Clé publique (utile si un jour tu utilises Stripe.js côté front) |

### 3.2 Recommandées (fonctionnalités déjà branchées dans le code)

| Priorité | Service | Variable(s) | Action |
|----------|---------|-------------|--------|
| 4        | **Mail (SMTP)** | `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_FROM_ADDRESS` | Créer un compte Mailtrap (dev) ou SendGrid / Mailgun / Gmail (prod) et remplir le .env |

### 3.3 Carte (Map) — optionnel

| Priorité | Service | Variable(s) | Action |
|----------|---------|-------------|--------|
| Optionnel | **Carto** (actuel) | Aucune | Style Positron utilisé par défaut : pas de clé nécessaire. |
| Optionnel | **Mapbox** | `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` | Si tu switches vers un style Mapbox : compte [mapbox.com](https://www.mapbox.com/) → Access Tokens. |
| Optionnel | **Style personnalisé** | `NEXT_PUBLIC_MAP_STYLE_URL` | URL d’un style GL (Maptiler, Stadia, etc.) si tu veux une autre base de carte. |

### 3.4 Optionnelles (présentes dans `config/services.php` Laravel, non utilisées dans ton code actuel)

| Service | Variable(s) | Utilisation possible |
|---------|-------------|----------------------|
| Postmark | `POSTMARK_API_KEY` | Envoi d’emails via Postmark |
| Resend | `RESEND_API_KEY` | Envoi d’emails via Resend |
| AWS (SES, S3, etc.) | `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_DEFAULT_REGION` | Emails, stockage, queue, etc. |
| Slack | `SLACK_BOT_USER_OAUTH_TOKEN`, `SLACK_BOT_USER_DEFAULT_CHANNEL` | Notifications Slack |

Tu peux les ignorer tant que tu n’utilises pas ces services.

---

## 4. Récap par fichier .env

### Backend `backend/.env`

À avoir au minimum :

```env
APP_NAME=Roomshare
APP_ENV=local
APP_KEY=base64:...   # php artisan key:generate
APP_DEBUG=true
APP_URL=http://localhost:8000

DB_CONNECTION=mongodb
DB_HOST=127.0.0.1
DB_PORT=27017
DB_DATABASE=roomshare
DB_USERNAME=
DB_PASSWORD=

FRONTEND_URL=http://localhost:3000
API_URL=http://localhost:8000

# Stripe (à remplir avec tes clés)
STRIPE_KEY=pk_test_...
STRIPE_SECRET=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Mail (optionnel en dev : MAIL_MAILER=log pour ne pas envoyer)
MAIL_MAILER=smtp
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USERNAME=...
MAIL_PASSWORD=...
MAIL_FROM_ADDRESS=noreply@roomshare.app
MAIL_FROM_NAME="${APP_NAME}"
```

### Frontend `frontend/.env.local`

```env
NEXT_PUBLIC_API_URL=/api/v1
API_BACKEND_URL=http://localhost:8000

NEXT_PUBLIC_REVERB_HOST=localhost
NEXT_PUBLIC_REVERB_PORT=8080
NEXT_PUBLIC_REVERB_KEY=roomshare-key
NEXT_PUBLIC_REVERB_SCHEME=http

# ─── Carte (optionnel) ────────────────────────────────────
# Vide = Carto Positron (gratuit). Si Mapbox : token ci‑dessous.
# NEXT_PUBLIC_MAP_STYLE_URL=https://basemaps.cartocdn.com/gl/positron-gl-style/style.json
# NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.eyJ1Ijoi...
```

---

## 5. Checklist rapide

- [ ] `APP_KEY` générée dans `backend/.env`
- [ ] MongoDB accessible et `DB_*` renseignés
- [ ] Compte Stripe créé → `STRIPE_SECRET` et `STRIPE_WEBHOOK_SECRET` (et `STRIPE_KEY` si besoin) dans `backend/.env`
- [ ] En local : `stripe listen --forward-to http://localhost:8000/api/v1/stripe/webhook` et copier le `whsec_...` dans `STRIPE_WEBHOOK_SECRET`
- [ ] (Optionnel) Compte Mailtrap ou autre SMTP → variables `MAIL_*` dans `backend/.env`
- [ ] `FRONTEND_URL` et `API_URL` cohérents avec ton environnement
- [ ] Frontend : `.env.local` avec `NEXT_PUBLIC_API_URL` et `API_BACKEND_URL` (et Reverb si tu utilises le temps réel)
- [ ] **Carte** : aucune clé requise avec Carto (défaut). Optionnel : `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` si tu utilises Mapbox, ou `NEXT_PUBLIC_MAP_STYLE_URL` pour un autre style.

Si tu veux, on peut détailler une section (par ex. uniquement Stripe ou uniquement Mail) étape par étape.
