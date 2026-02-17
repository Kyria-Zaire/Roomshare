#!/bin/sh
# Script de vérification des permissions de storage
# À exécuter dans le conteneur PHP pour diagnostiquer les problèmes de permissions

echo "🔍 Vérification des permissions de storage..."
echo ""

# Vérifier l'utilisateur actuel
echo "👤 Utilisateur actuel: $(whoami)"
echo ""

# Vérifier les répertoires de storage
echo "📁 Répertoires de storage:"
ls -la /var/www/html/storage/app/ 2>/dev/null || echo "❌ storage/app/ n'existe pas"
echo ""

# Vérifier storage/app/private spécifiquement
if [ -d "/var/www/html/storage/app/private" ]; then
    echo "✅ storage/app/private existe"
    echo "   Permissions: $(stat -c '%a %U:%G' /var/www/html/storage/app/private)"
    echo "   Propriétaire: $(stat -c '%U:%G' /var/www/html/storage/app/private)"
    echo ""
    
    # Test d'écriture
    if touch /var/www/html/storage/app/private/.test_write 2>/dev/null; then
        echo "✅ Test d'écriture réussi"
        rm -f /var/www/html/storage/app/private/.test_write
    else
        echo "❌ Test d'écriture échoué - www-data ne peut pas écrire"
    fi
    
    # Test de création de sous-répertoire
    if mkdir -p /var/www/html/storage/app/private/test_subdir 2>/dev/null; then
        echo "✅ Test de création de sous-répertoire réussi"
        rmdir /var/www/html/storage/app/private/test_subdir 2>/dev/null
    else
        echo "❌ Test de création de sous-répertoire échoué"
    fi
else
    echo "❌ storage/app/private n'existe pas"
    echo "   Création..."
    mkdir -p /var/www/html/storage/app/private
    chown -R www-data:www-data /var/www/html/storage/app/private
    chmod -R 775 /var/www/html/storage/app/private
    chmod g+s /var/www/html/storage/app/private
    echo "✅ Répertoire créé avec les bonnes permissions"
fi

echo ""
echo "🔧 Pour corriger manuellement les permissions:"
echo "   chown -R www-data:www-data /var/www/html/storage/app/private"
echo "   chmod -R 775 /var/www/html/storage/app/private"
echo "   chmod g+s /var/www/html/storage/app/private"
