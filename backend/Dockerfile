FROM php:8.4-fpm-alpine

# ─── System dependencies ───────────────────────────────────
RUN apk add --no-cache \
    git \
    curl \
    libpng-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    zip \
    unzip \
    autoconf \
    g++ \
    make \
    openssl-dev \
    linux-headers

# ─── PHP Extensions ───────────────────────────────────────
RUN docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) \
        gd \
        pdo \
        pdo_mysql \
        bcmath \
        opcache

# ─── MongoDB Extension ────────────────────────────────────
RUN pecl install mongodb \
    && docker-php-ext-enable mongodb

# ─── Composer ──────────────────────────────────────────────
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# ─── PHP-FPM config: log to stdout/stderr for Docker ──────
RUN echo "access.log = /proc/self/fd/2" >> /usr/local/etc/php-fpm.d/docker.conf \
    && echo "catch_workers_output = yes" >> /usr/local/etc/php-fpm.d/docker.conf \
    && echo "decorate_workers_output = no" >> /usr/local/etc/php-fpm.d/docker.conf

# ─── PHP config optimisé ──────────────────────────────────
RUN echo "memory_limit=256M" > /usr/local/etc/php/conf.d/roomshare.ini \
    && echo "upload_max_filesize=20M" >> /usr/local/etc/php/conf.d/roomshare.ini \
    && echo "post_max_size=25M" >> /usr/local/etc/php/conf.d/roomshare.ini \
    && echo "max_execution_time=60" >> /usr/local/etc/php/conf.d/roomshare.ini

# ─── Workdir ──────────────────────────────────────────────
WORKDIR /var/www/html

# ─── Copy source & install deps ──────────────────────────
COPY . .

# ─── Créer les répertoires de storage avant composer install ────
RUN mkdir -p storage/framework/cache/data \
    && mkdir -p storage/framework/sessions \
    && mkdir -p storage/framework/views \
    && mkdir -p storage/app/public \
    && mkdir -p storage/app/private \
    && mkdir -p storage/logs \
    && mkdir -p bootstrap/cache

RUN composer update --no-dev --optimize-autoloader --no-interaction --no-scripts

# ─── Generate autoload files ─────────────────────────────
RUN composer dump-autoload --optimize --no-scripts

# ─── Permissions ──────────────────────────────────────────
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache \
    && chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache \
    && chmod g+s /var/www/html/storage/app/private 2>/dev/null || true

# ─── Entrypoint: cache config at runtime then start php-fpm
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 9000
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["php-fpm"]
