# 🏠 Roomshare — Colocation Express à Reims

Application web de colocation pour étudiants et jeunes actifs à Reims. Backend Laravel (API) + Frontend Next.js (React).

## 📋 Structure du projet

```
Roomshare/
├── backend/          # API Laravel (PHP)
├── frontend/        # Application Next.js (React/TypeScript)
├── docker/          # Configuration Docker/Nginx
└── docs/            # Documentation
```

## 🚀 Démarrage rapide

### Prérequis

- PHP 8.2+ (backend)
- Node.js 18+ (frontend)
- MongoDB
- Composer
- npm/yarn

### Installation

1. **Backend**
   ```bash
   cd backend
   composer install
   cp .env.example .env
   php artisan key:generate
   # Configurer MongoDB et Stripe dans .env
   php artisan migrate
   ```

2. **Frontend**
   ```bash
   cd frontend
   npm install
   cp .env.example .env.local
   # Configurer les URLs dans .env.local
   npm run dev
   ```

## 🔑 Clés API nécessaires

Voir [`docs/CLES-API-ESSENTIELLES.md`](docs/CLES-API-ESSENTIELLES.md) pour la liste complète.

**Obligatoires :**
- Stripe (`STRIPE_SECRET`, `STRIPE_WEBHOOK_SECRET`) — Paiements Pass/Boost/Pro

**Recommandées :**
- Mail SMTP — Réinitialisation de mot de passe

## 📚 Documentation

- [`docs/CLES-API-ESSENTIELLES.md`](docs/CLES-API-ESSENTIELLES.md) — Liste des clés API essentielles
- [`docs/ENV-ET-CLES-API.md`](docs/ENV-ET-CLES-API.md) — Analyse complète des variables d'environnement

## 🛠️ Technologies

- **Backend :** Laravel 12, MongoDB, Sanctum (auth), Stripe (paiements)
- **Frontend :** Next.js 15, React, TypeScript, Tailwind CSS, MapLibre GL
- **WebSocket :** Laravel Reverb

## 📝 Licence

Propriétaire — Tous droits réservés
