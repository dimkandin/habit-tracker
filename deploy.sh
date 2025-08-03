#!/bin/bash

# Скрипт для развертывания Habit Tracker на Yandex Cloud
# Использование: ./deploy.sh SERVER_IP

set -e

SERVER_IP=$1
if [ -z "$SERVER_IP" ]; then
    echo "❌ Ошибка: Укажите IP адрес сервера"
    echo "Использование: ./deploy.sh SERVER_IP"
    exit 1
fi

echo "🚀 Начинаем развертывание на сервере $SERVER_IP..."

# 1. Обновление системы
echo "📦 Обновление системы..."
ssh ubuntu@$SERVER_IP << 'EOF'
sudo apt update && sudo apt upgrade -y
EOF

# 2. Установка Node.js
echo "📦 Установка Node.js..."
ssh ubuntu@$SERVER_IP << 'EOF'
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version
npm --version
EOF

# 3. Установка PM2
echo "📦 Установка PM2..."
ssh ubuntu@$SERVER_IP << 'EOF'
sudo npm install -g pm2
EOF

# 4. Установка Nginx
echo "📦 Установка Nginx..."
ssh ubuntu@$SERVER_IP << 'EOF'
sudo apt install nginx -y
sudo systemctl enable nginx
EOF

# 5. Создание директории проекта
echo "📁 Создание директории проекта..."
ssh ubuntu@$SERVER_IP << 'EOF'
sudo mkdir -p /var/www/habit-tracker
sudo chown ubuntu:ubuntu /var/www/habit-tracker
EOF

# 6. Копирование файлов проекта
echo "📁 Копирование файлов проекта..."
scp -r ../* ubuntu@$SERVER_IP:/var/www/habit-tracker/

# 7. Настройка Backend
echo "⚙️ Настройка Backend..."
ssh ubuntu@$SERVER_IP << 'EOF'
cd /var/www/habit-tracker/backend
npm install

# Создание .env файла для продакшна
cat > .env << 'ENVEOF'
NODE_ENV=production
PORT=5000

# Database Configuration
DB_HOST=rc1a-eucbcmeia1arq2l9.mdb.yandexcloud.net
DB_PORT=5432
DB_NAME=habit_tracker
DB_USER=habit_user
DB_PASSWORD=SecurePass123!

# JWT Configuration
JWT_SECRET=your_super_secret_production_jwt_key_here_change_this

# Frontend URL
FRONTEND_URL=https://your-domain.com
ENVEOF
EOF

# 8. Сборка Frontend
echo "🔨 Сборка Frontend..."
ssh ubuntu@$SERVER_IP << 'EOF'
cd /var/www/habit-tracker
npm install
npm run build
EOF

# 9. Настройка Nginx
echo "⚙️ Настройка Nginx..."
ssh ubuntu@$SERVER_IP << 'EOF'
sudo tee /etc/nginx/sites-available/habit-tracker > /dev/null << 'NGINXEOF'
server {
    listen 80;
    server_name _;

    # Frontend
    location / {
        root /var/www/habit-tracker/build;
        try_files $uri $uri/ /index.html;
        
        # Кэширование статических файлов
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Gzip сжатие
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss;
}
NGINXEOF

# Активация конфигурации
sudo ln -sf /etc/nginx/sites-available/habit-tracker /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
EOF

# 10. Запуск Backend с PM2
echo "🚀 Запуск Backend..."
ssh ubuntu@$SERVER_IP << 'EOF'
cd /var/www/habit-tracker/backend
pm2 start server.js --name "habit-tracker-api"
pm2 save
pm2 startup
EOF

# 11. Настройка Firewall
echo "🔒 Настройка Firewall..."
ssh ubuntu@$SERVER_IP << 'EOF'
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw --force enable
EOF

echo "✅ Развертывание завершено!"
echo "🌐 Приложение доступно по адресу: http://$SERVER_IP"
echo "🔗 API: http://$SERVER_IP/api"
echo "📊 Health check: http://$SERVER_IP/api/health"

echo ""
echo "📋 Следующие шаги:"
echo "1. Настройте домен и SSL сертификат"
echo "2. Обновите FRONTEND_URL в .env файле"
echo "3. Перезапустите backend: pm2 restart habit-tracker-api" 