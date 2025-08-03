#!/bin/bash

# Скрипт для настройки сервера Habit Tracker
# Выполните этот скрипт в веб-терминале Yandex Cloud Console

set -e

echo "🚀 Начинаем настройку сервера Habit Tracker..."

# 1. Обновление системы
echo "📦 Обновление системы..."
sudo apt update && sudo apt upgrade -y

# 2. Установка Node.js
echo "📦 Установка Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Проверка версий
echo "✅ Node.js версия: $(node --version)"
echo "✅ npm версия: $(npm --version)"

# 3. Установка PM2
echo "📦 Установка PM2..."
sudo npm install -g pm2

# 4. Установка Nginx
echo "📦 Установка Nginx..."
sudo apt install nginx -y
sudo systemctl enable nginx

# 5. Создание директории проекта
echo "📁 Создание директории проекта..."
sudo mkdir -p /var/www/habit-tracker
sudo chown habit_tracker:habit_tracker /var/www/habit-tracker
cd /var/www/habit-tracker

# 6. Клонирование проекта
echo "📁 Клонирование проекта..."
# Очистите директорию если она не пустая
sudo rm -rf /var/www/habit-tracker/*
git clone https://github.com/dimkandin/habit-tracker.git .

# 7. Настройка Backend
echo "⚙️ Настройка Backend..."
cd backend
npm install

# Создание .env файла
cat > .env << 'EOF'
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
FRONTEND_URL=http://158.160.183.121
EOF

# 8. Сборка Frontend
echo "🔨 Сборка Frontend..."
cd /var/www/habit-tracker
npm install
npm run build

# 9. Настройка Nginx
echo "⚙️ Настройка Nginx..."
sudo tee /etc/nginx/sites-available/habit-tracker > /dev/null << 'EOF'
server {
    listen 80;
    server_name 158.160.183.121;

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
EOF

# Активация конфигурации
sudo ln -sf /etc/nginx/sites-available/habit-tracker /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx

# 10. Запуск Backend
echo "🚀 Запуск Backend..."
cd /var/www/habit-tracker/backend
pm2 start server.js --name "habit-tracker-api"
pm2 save
pm2 startup

# 11. Настройка Firewall
echo "🔒 Настройка Firewall..."
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw --force enable

# 12. Проверка
echo "✅ Проверка развертывания..."
echo "🔗 Backend health check:"
curl -s http://localhost:5000/api/health || echo "Backend не отвечает"
echo ""
echo "🌐 Nginx status:"
curl -s -I http://localhost | head -1 || echo "Nginx не отвечает"

echo ""
echo "🎉 Развертывание завершено!"
echo "🌐 Приложение доступно: http://158.160.183.121"
echo "🔗 API: http://158.160.183.121/api"
echo "📊 Health check: http://158.160.183.121/api/health"

echo ""
echo "📋 Полезные команды:"
echo "- Просмотр логов backend: pm2 logs habit-tracker-api"
echo "- Перезапуск backend: pm2 restart habit-tracker-api"
echo "- Просмотр логов nginx: sudo tail -f /var/log/nginx/access.log"
echo "- PM2 мониторинг: pm2 monit" 