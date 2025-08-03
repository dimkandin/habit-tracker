# 🚀 Ручное развертывание Habit Tracker

## 📋 Шаг 1: Подключение к серверу

### Вариант A: Через Yandex Cloud Console
1. Откройте [Yandex Cloud Console](https://console.cloud.yandex.ru/)
2. Перейдите в **Compute Cloud** → **Виртуальные машины**
3. Найдите вашу ВМ `habit-tracker-server`
4. Нажмите **"Подключиться"** → **"Веб-терминал"**

### Вариант B: Через SSH
```bash
ssh -l habit_tracker 158.160.183.121
```

---

## 📋 Шаг 2: Обновление системы

```bash
sudo apt update && sudo apt upgrade -y
```

---

## 📋 Шаг 3: Установка Node.js

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Проверка версий
node --version
npm --version
```

---

## 📋 Шаг 4: Установка PM2

```bash
sudo npm install -g pm2
```

---

## 📋 Шаг 5: Установка Nginx

```bash
sudo apt install nginx -y
sudo systemctl enable nginx
```

---

## 📋 Шаг 6: Создание директории проекта

```bash
# Проверяем текущего пользователя
whoami

# Создаем директорию и устанавливаем права
sudo mkdir -p /var/www/habit-tracker
sudo chown habit_tracker:habit_tracker /var/www/habit-tracker
cd /var/www/habit-tracker
```

---

## 📋 Шаг 7: Клонирование проекта

```bash
# Очистите директорию если она не пустая
sudo rm -rf /var/www/habit-tracker/*

# Клонируйте ваш репозиторий
git clone https://github.com/dimkandin/habit-tracker.git .
```

---

## 📋 Шаг 8: Настройка Backend

```bash
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
```

---

## 📋 Шаг 9: Сборка Frontend

```bash
cd /var/www/habit-tracker
npm install
npm run build
```

---

## 📋 Шаг 10: Настройка Nginx

```bash
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
```

---

## 📋 Шаг 11: Запуск Backend

```bash
cd /var/www/habit-tracker/backend
pm2 start server.js --name "habit-tracker-api"
pm2 save
pm2 startup
```

---

## 📋 Шаг 12: Настройка Firewall

```bash
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw --force enable
```

---

## 📋 Шаг 13: Проверка

```bash
# Проверка backend
curl http://localhost:5000/api/health

# Проверка nginx
curl http://localhost

# Проверка снаружи
curl http://158.160.183.121/api/health
```

---

## 🎯 Результат

После выполнения всех шагов:

✅ **Приложение доступно**: http://158.160.183.121  
✅ **API доступен**: http://158.160.183.121/api  
✅ **Health check**: http://158.160.183.121/api/health  

---

## 🔧 Полезные команды

```bash
# Просмотр логов backend
pm2 logs habit-tracker-api

# Перезапуск backend
pm2 restart habit-tracker-api

# Просмотр логов nginx
sudo tail -f /var/log/nginx/access.log

# Перезапуск nginx
sudo systemctl restart nginx
```

---

## 📞 Поддержка

- **PM2 мониторинг**: `pm2 monit`
- **Nginx статус**: `sudo systemctl status nginx`
- **Логи**: `pm2 logs` и `sudo tail -f /var/log/nginx/error.log` 