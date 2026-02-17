# 🛠 Business, Method, Architecture & Delivery (BMAD)

## 1. Architecture Technique (Expert Level)
- **Découplage :** Architecture Headless.
    - `/backend` : API REST (Laravel 11 + MongoDB).
    - `/frontend` : PWA (Next.js / Tailwind CSS).
- **Infrastructure :** Dockerized environment (Nginx, PHP-FPM, MongoDB).
- **Temps Réel :** Pusher/Soketi pour les notifications et le chat.

## 2. Standards de Code (Senior/Lead Dev)
- **Patterns :** Repository Pattern pour le Back, Services pour la logique métier.
- **Clean Code :** SOLID principles, Typage strict (PHP 8.2+, TypeScript), DRY.
- **Performance :** Optimisation des images (WebP), Lazy loading, Caching Redis (post-MVP).

## 3. Workflow de Livraison
- **Vibe Coding :** Utilisation de Cursor/Claude avec des prompts contextuels.
- **Validation :** Chaque feature doit être testée (Unit/Feature tests) avant intégration.
- **Déploiement :** CI/CD prêt pour un déploiement Cloud.

## 4. Stratégie de Données (Scraping & Import)
- Module de transformation pour uniformiser les données scrapées vers notre schéma MongoDB flexible.

## 5. Design System & Identité Visuelle
- **Couleur Principale (Accent)** : `#0E583D`
  - RGB: 14, 88, 61
  - HSL: 158°, 72%, 20%
  - Utilisée pour tous les éléments d'accentuation (boutons, badges, liens, etc.)
- **Couleur Accent Light** : `#E8F5F0` (version claire harmonisée)
- **Couleur Primaire** : Noir `#000000` (texte principal, boutons primaires)
- **Couleur Background** : Blanc `#FFFFFF` (fond de l'application)
- **Architecture Couleur** : Centralisée dans `frontend/src/app/globals.css` via variables CSS (`--color-accent`)
- **Cohérence** : Tous les composants utilisent les classes Tailwind (`accent`, `accent-light`) pour garantir la synchronisation avec le logo Roomshare
