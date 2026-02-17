#!/bin/sh
set -e

# Créer les répertoires de storage nécessaires avec les bonnes permissions
mkdir -p /var/www/html/storage/framework/cache/data
mkdir -p /var/www/html/storage/framework/sessions
mkdir -p /var/www/html/storage/framework/views
mkdir -p /var/www/html/storage/app/public
mkdir -p /var/www/html/storage/app/public/avatars
mkdir -p /var/www/html/storage/app/private
mkdir -p /var/www/html/storage/logs
mkdir -p /var/www/html/bootstrap/cache

# Définir les permissions correctes (www-data doit pouvoir écrire ET créer des sous-répertoires)
# Utiliser setgid pour que les nouveaux fichiers/répertoires héritent du groupe www-data
chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache
chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

# S'assurer que le répertoire de cache peut créer des sous-répertoires
# Le cache file de Laravel crée des sous-répertoires automatiquement (ex: ca/c7/...)
# On doit s'assurer que www-data peut créer ces répertoires
chmod g+s /var/www/html/storage/framework/cache/data 2>/dev/null || true

# S'assurer que storage/app/private peut créer des sous-répertoires pour les vérifications
# Le contrôleur crée des répertoires comme verifications/{user_id}/identity et verifications/{user_id}/residence
chmod g+s /var/www/html/storage/app/private 2>/dev/null || true

# Lien symbolique pour stockage public (avatars, etc.)
php artisan storage:link 2>/dev/null || true

# Run package discovery & cache config at runtime (env vars available)
php artisan package:discover --ansi 2>/dev/null || true
php artisan config:clear 2>/dev/null || true

exec "$@"
