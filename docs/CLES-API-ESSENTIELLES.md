# 🔑 Clés API Essentielles — Roomshare

**Liste simple et claire des clés API externes nécessaires pour que ton app soit 100% fonctionnelle.**

---

## ✅ OBLIGATOIRES (sans ça, certaines fonctionnalités ne marchent pas)

### 1. **Stripe** — Paiements Pass / Boost / Pro

**Pourquoi :** Ton app utilise Stripe pour les paiements (Pass Étudiant, Boost annonce, Abonnement Pro). Sans ces clés, les utilisateurs ne peuvent pas acheter.

**Clés nécessaires :**

| Variable | Description | Où l'obtenir |
|----------|-------------|--------------|
| `STRIPE_SECRET` | Clé secrète Stripe (backend uniquement) | [stripe.com](https://stripe.com) → Dashboard → Clés API → Clé secrète (`sk_test_...` pour test, `sk_live_...` pour prod) |
| `STRIPE_WEBHOOK_SECRET` | Secret pour valider les webhooks Stripe | **En local :** `stripe listen --forward-to http://localhost:8000/api/v1/stripe/webhook` → copie le `whsec_...` affiché<br>**En prod :** Dashboard Stripe → Webhooks → Signing secret |

**Où les mettre :** `backend/.env`

**Fichier utilisé :** `backend/app/Http/Controllers/Api/V1/StripeController.php`

---

## ⚠️ RECOMMANDÉES (fonctionnalité partielle sans ça)

### 2. **Mail (SMTP)** — Réinitialisation de mot de passe

**Pourquoi :** Quand un utilisateur clique sur "Mot de passe oublié", l'app doit lui envoyer un email avec le lien de réinitialisation. Sans config SMTP, l'email ne part pas (mais l'app ne plante pas non plus).

**Clés nécessaires :**

| Variable | Description | Où l'obtenir |
|----------|-------------|--------------|
| `MAIL_HOST` | Serveur SMTP | Compte Mailtrap (dev) ou SendGrid / Mailgun / Gmail (prod) |
| `MAIL_PORT` | Port SMTP | `2525` (Mailtrap), `587` (TLS), `465` (SSL) |
| `MAIL_USERNAME` | Utilisateur SMTP | Identifiants de ton compte email |
| `MAIL_PASSWORD` | Mot de passe SMTP | Mot de passe ou "mot de passe d'application" (Gmail) |
| `MAIL_FROM_ADDRESS` | Email expéditeur | `noreply@roomshare.app` |

**Alternative en développement :** Mettre `MAIL_MAILER=log` dans `.env` → les emails sont écrits dans les logs au lieu d'être envoyés (pas besoin de clés).

**Où les mettre :** `backend/.env`

**Fichier utilisé :** `backend/app/Mail/ResetPasswordMail.php` et `backend/app/Http/Controllers/Api/V1/AuthController.php` (méthode `forgotPassword`)

---

## ❌ PAS NÉCESSAIRES (pas utilisées dans ton code actuel)

- **Postmark** (`POSTMARK_API_KEY`) — pas utilisé
- **Resend** (`RESEND_API_KEY`) — pas utilisé
- **AWS** (`AWS_ACCESS_KEY_ID`, etc.) — pas utilisé
- **Slack** (`SLACK_BOT_USER_OAUTH_TOKEN`) — pas utilisé
- **Mapbox** (`NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`) — optionnel, tu utilises Carto Positron gratuit
- **MongoDB** — ce sont des credentials de connexion, pas une clé API externe

---

## 📋 Checklist rapide

Pour que ton app soit **100% fonctionnelle** :

- [ ] **Stripe** : Compte créé sur [stripe.com](https://stripe.com)
  - [ ] `STRIPE_SECRET` copié dans `backend/.env`
  - [ ] `STRIPE_WEBHOOK_SECRET` obtenu (Stripe CLI en local ou Dashboard en prod) et copié dans `backend/.env`
- [ ] **Mail (optionnel en dev)** : 
  - [ ] Soit `MAIL_MAILER=log` dans `backend/.env` (emails dans les logs)
  - [ ] Soit compte Mailtrap/SendGrid/etc. avec `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD` dans `backend/.env`

---

## 🎯 Résumé ultra-simple

**Pour que l'app fonctionne à 100% :**

1. **Stripe** → 2 clés (`STRIPE_SECRET` + `STRIPE_WEBHOOK_SECRET`) → **OBLIGATOIRE**
2. **Mail** → config SMTP ou `MAIL_MAILER=log` → **RECOMMANDÉ** (sans ça, "mot de passe oublié" ne fonctionne pas)

**C'est tout !** Le reste (MongoDB, Reverb, Map) n'a pas besoin de clés API externes.

---

## 💡 Astuce

En développement local, tu peux :
- Mettre `MAIL_MAILER=log` → pas besoin de config SMTP
- Utiliser Stripe en mode test (`sk_test_...`) → gratuit, pas de vrai paiement

En production, tu auras besoin :
- Stripe en mode live (`sk_live_...`)
- Un vrai service SMTP (SendGrid, Mailgun, etc.)
