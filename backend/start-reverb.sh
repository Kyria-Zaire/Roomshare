#!/bin/sh
set -e

# Créer les répertoires de storage nécessaires avec les bonnes permissions
mkdir -p /var/www/html/storage/framework/cache/data
mkdir -p /var/www/html/storage/framework/sessions
mkdir -p /var/www/html/storage/framework/views
mkdir -p /var/www/html/storage/app/public
mkdir -p /var/www/html/bootstrap/cache

# Définir les permissions correctes
chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache
chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache
chmod g+s /var/www/html/storage/framework/cache/data 2>/dev/null || true

# Run package discovery & cache config at runtime
php artisan package:discover --ansi 2>/dev/null || true
php artisan config:clear 2>/dev/null || true

# Démarrer Reverb avec gestion d'erreurs pour Windows/Docker
# Utiliser exec pour que les signaux soient correctement gérés
exec php artisan reverb:start --host=0.0.0.0 --port=8080
