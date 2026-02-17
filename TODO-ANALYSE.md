# 📋 Analyse Complète Front/Backend - Roomshare MVP

## ✅ Ce qui est FAIT

### Backend
- ✅ Laravel 12 API-only avec MongoDB
- ✅ Modèles : Room, User, Conversation, Message, Favorite
- ✅ Repository Pattern implémenté
- ✅ Endpoints API : Rooms (CRUD + map), Conversations, Messages, Favorites, Upload
- ✅ Chat temps réel avec Laravel Reverb (WebSockets)
- ✅ Validation MongoDB ObjectId
- ✅ Exception handling JSON pour API
- ✅ CORS configuré
- ✅ Tests smoke (ApiSmokeTest)
- ✅ Migrations MongoDB avec index (2dsphere, unique, etc.)
- ✅ AuthController avec Sanctum (mais pas utilisé dans routes)

### Frontend
- ✅ Next.js 16 PWA avec TypeScript
- ✅ Pages complètes : Explorer, Map, Create, Messages, Profile, Room Detail
- ✅ Design inspiré Airbnb avec DA Roomshare
- ✅ Chat temps réel avec Laravel Echo
- ✅ Carte interactive (react-map-gl)
- ✅ Système de favoris (localStorage MVP)
- ✅ Upload d'images
- ✅ Filtres et recherche
- ✅ Carrousel d'autres annonces
- ✅ AuthContext avec Sanctum (mais pas intégré partout)

---

## 🔴 CRITIQUE - À faire IMMÉDIATEMENT

### 1. **Authentification complète** ⚠️ PRIORITÉ 1
**Problème** : Le système utilise `X-User-Id` header (MVP) au lieu de Sanctum.

**À faire** :
- [ ] Ajouter les routes Auth dans `routes/api.php`
- [ ] Créer middleware pour protéger les routes avec Sanctum
- [ ] Intégrer `useAuth()` partout au lieu de `useUser()`
- [ ] Supprimer `X-User-Id` header, utiliser `Authorization: Bearer {token}`
- [ ] Mettre à jour tous les controllers pour utiliser `$request->user()`

**Impact** : Sécurité, gestion des sessions, expérience utilisateur

---

### 2. **Champ `owner_id` dans Room** ⚠️ PRIORITÉ 1
**Problème** : `owner_id` référencé dans RoomPolicy mais pas dans le modèle Room.

**À faire** :
- [ ] Ajouter `owner_id` dans `Room::$fillable`
- [ ] Créer migration pour ajouter `owner_id` aux rooms existantes
- [ ] Mettre à jour `RoomController::store()` pour assigner `owner_id` depuis `$request->user()->id`
- [ ] Ajouter index MongoDB sur `owner_id`
- [ ] Créer endpoint `GET /api/v1/rooms/my` pour les annonces de l'utilisateur

**Impact** : Fonctionnalité "Mes annonces" non fonctionnelle

---

### 3. **Endpoint "Mes annonces"** ⚠️ PRIORITÉ 2
**Problème** : La page Profile affiche une liste vide pour "Mes annonces".

**À faire** :
- [ ] Créer méthode `findByOwner(string $userId)` dans `RoomRepositoryInterface`
- [ ] Implémenter dans `MongoRoomRepository`
- [ ] Ajouter route `GET /api/v1/rooms/my` dans `RoomController`
- [ ] Mettre à jour `roomService.getMyRooms()` dans le frontend
- [ ] Connecter la page Profile à cet endpoint

**Impact** : Fonctionnalité manquante pour les utilisateurs

---

## 🟡 IMPORTANT - À faire AVANT PRODUCTION

### 4. **Pagination des résultats** ⚠️ PRIORITÉ 2
**Problème** : Tous les endpoints retournent toutes les données sans pagination.

**À faire** :
- [ ] Ajouter pagination Laravel dans `RoomController::index()`
- [ ] Ajouter pagination dans `ConversationController::index()`
- [ ] Mettre à jour les interfaces TypeScript pour inclure `meta.pagination`
- [ ] Implémenter "Load more" ou pagination dans le frontend
- [ ] Ajouter paramètres `page` et `per_page` dans les endpoints

**Impact** : Performance avec beaucoup de données

---

### 5. **Recherche full-text backend** ⚠️ PRIORITÉ 3
**Problème** : La recherche se fait côté client uniquement.

**À faire** :
- [ ] Ajouter index MongoDB text sur `title`, `description`, `address.city`
- [ ] Implémenter recherche dans `RoomRepository::all()` avec paramètre `search`
- [ ] Ajouter endpoint `GET /api/v1/rooms/search?q=...`
- [ ] Optimiser avec regex ou MongoDB text search

**Impact** : Performance et pertinence des résultats

---

### 6. **Gestion des annonces publiées** ⚠️ PRIORITÉ 2
**Problème** : Pas de possibilité de modifier/supprimer ses propres annonces.

**À faire** :
- [ ] Protéger `PUT /rooms/{id}` et `DELETE /rooms/{id}` avec RoomPolicy
- [ ] Vérifier `owner_id` dans les controllers
- [ ] Ajouter boutons Edit/Delete dans la page Profile
- [ ] Créer page Edit pour modifier une annonce
- [ ] Ajouter confirmation avant suppression

**Impact** : Fonctionnalité essentielle pour les annonceurs

---

## 🟢 AMÉLIORATIONS - Nice to have

### 7. **Notifications système**
- [ ] Endpoint pour marquer messages comme lus
- [ ] Badge de notifications non lues dans le header
- [ ] Notifications push (PWA)

### 8. **Statistiques utilisateur**
- [ ] Endpoint pour stats (nombre de vues, messages reçus, etc.)
- [ ] Afficher dans la page Profile

### 9. **Recherche avancée**
- [ ] Filtres par surface, nombre de chambres
- [ ] Filtres par amenities
- [ ] Tri par prix, date, distance

### 10. **Optimisations performance**
- [ ] Cache Redis pour les requêtes fréquentes
- [ ] Lazy loading des images
- [ ] Optimisation des requêtes MongoDB (projection)

### 11. **Tests complets**
- [ ] Tests unitaires pour les repositories
- [ ] Tests d'intégration pour les endpoints critiques
- [ ] Tests E2E pour les flux principaux

### 12. **Documentation**
- [ ] Documentation API (Swagger/OpenAPI)
- [ ] README avec instructions de déploiement
- [ ] Guide de contribution

---

## 📊 RÉSUMÉ DES PRIORITÉS

### 🔴 URGENT (MVP fonctionnel)
1. **Authentification Sanctum** - Sécurité et sessions
2. **Champ owner_id** - Fonctionnalité "Mes annonces"
3. **Endpoint "Mes annonces"** - Compléter la page Profile

### 🟡 IMPORTANT (Production-ready)
4. **Pagination** - Performance
5. **Recherche backend** - Performance
6. **Gestion Edit/Delete** - Fonctionnalité essentielle

### 🟢 OPTIONNEL (Améliorations)
7-12. Notifications, Stats, Tests, Documentation

---

## 🎯 PROCHAINES ÉTAPES RECOMMANDÉES

**Phase 1 - MVP Complet (1-2 jours)** :
1. Ajouter `owner_id` dans Room
2. Créer endpoint "Mes annonces"
3. Intégrer authentification Sanctum partout

**Phase 2 - Production-ready (2-3 jours)** :
4. Ajouter pagination
5. Implémenter recherche backend
6. Ajouter Edit/Delete des annonces

**Phase 3 - Polish (1-2 jours)** :
7. Notifications
8. Statistiques
9. Tests complets

---

## 📝 NOTES TECHNIQUES

- Le frontend utilise actuellement `useUser()` (localStorage) et `useAuth()` (Sanctum) en parallèle
- Il faut choisir UN système et l'utiliser partout
- Les routes Auth existent mais ne sont pas exposées dans `api.php`
- Le modèle Room n'a pas `owner_id` dans `$fillable`, mais il est référencé dans RoomPolicy
