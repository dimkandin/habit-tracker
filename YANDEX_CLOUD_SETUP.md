# 🚀 Настройка Yandex Cloud - Пошаговое руководство

## 📋 Шаг 1: Создание PostgreSQL кластера

### 1.1 Вход в Yandex Cloud Console
1. Откройте [Yandex Cloud Console](https://console.cloud.yandex.ru/)
2. Войдите в свой аккаунт
3. Выберите проект (или создайте новый)

### 1.2 Создание кластера PostgreSQL
1. В меню слева найдите **Managed Service for PostgreSQL**
2. Нажмите **Создать кластер**
3. Заполните форму:

```
Название кластера: habit-tracker-db
Описание: База данных для трекера привычек
Версия PostgreSQL: 15
Класс хоста: s2.micro (2 vCPU, 8 GB RAM)
Размер диска: 10 GB
Сеть: default
```

### 1.3 Настройка базы данных
1. После создания кластера перейдите в него
2. Откройте вкладку **Базы данных**
3. Нажмите **Создать базу данных**:
   - Имя: `habit_tracker`
   - Владелец: `postgres`

### 1.4 Создание пользователя
1. Перейдите в **Пользователи**
2. Нажмите **Создать пользователя**:
   - Имя: `habit_user`
   - Пароль: `SecurePass123!`
   - Права: `ALL PRIVILEGES`

### 1.5 Настройка сетевого доступа
1. Перейдите в **Сетевой доступ**
2. Нажмите **Добавить подсеть**
3. Выберите подсеть или добавьте `0.0.0.0/0` для тестирования

---

## 📋 Шаг 2: Создание Compute Instance

### 2.1 Создание виртуальной машины
1. Перейдите в **Compute Cloud**
2. Нажмите **Создать ВМ**
3. Заполните форму:

```
Имя: habit-tracker-server
Описание: Сервер для трекера привычек
Платформа: Intel Ice Lake
vCPU: 2
RAM: 4 GB
Диск: 20 GB SSD
Образ: Ubuntu 22.04 LTS
Сеть: default
```

### 2.2 Настройка сети
1. В разделе **Сетевые настройки**:
   - Подсеть: выберите существующую
   - Публичный IP: включить
   - NAT: включить

### 2.3 Создание ключа SSH
1. В разделе **SSH-ключи**:
   - Нажмите **Создать ключ**
   - Сохраните приватный ключ

---

## 📋 Шаг 3: Подключение к серверу

### 3.1 Подключение по SSH
```bash
ssh ubuntu@YOUR_SERVER_IP
```

### 3.2 Обновление системы
```bash
sudo apt update && sudo apt upgrade -y
```

### 3.3 Установка Node.js
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Проверка версий
node --version
npm --version
```

### 3.4 Установка PM2
```bash
sudo npm install -g pm2
```

---

## 📋 Шаг 4: Развертывание Backend

### 4.1 Клонирование проекта
```bash
# Создание директории
mkdir -p /var/www/habit-tracker
cd /var/www/habit-tracker

# Клонирование репозитория
git clone https://github.com/dimkandin/habit-tracker.git .
```

### 4.2 Настройка Backend
```bash
# Переход в backend
cd backend

# Установка зависимостей
npm install

# Создание .env файла
cat > .env << 'EOF'
NODE_ENV=production
PORT=5000

# Database Configuration (замените на ваши данные)
DB_HOST=YOUR_DB_HOST.yandexcloud.net
DB_PORT=5432
DB_NAME=habit_tracker
DB_USER=habit_user
DB_PASSWORD=SecurePass123!

# JWT Configuration
JWT_SECRET=your_super_secret_production_jwt_key_here_change_this

# Frontend URL
FRONTEND_URL=https://your-domain.com
EOF
```

### 4.3 Запуск Backend
```bash
# Запуск с PM2
pm2 start server.js --name "habit-tracker-api"

# Сохранение конфигурации
pm2 save

# Настройка автозапуска
pm2 startup
```

---

## 📋 Шаг 5: Настройка Frontend

### 5.1 Сборка приложения
```bash
# Переход в корневую директорию
cd /var/www/habit-tracker

# Установка зависимостей
npm install

# Сборка для продакшна
npm run build
```

### 5.2 Установка Nginx
```bash
sudo apt install nginx -y
```

### 5.3 Настройка Nginx
```bash
# Создание конфигурации
sudo nano /etc/nginx/sites-available/habit-tracker
```

Содержимое файла:
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

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
```

### 5.4 Активация конфигурации
```bash
# Создание символической ссылки
sudo ln -s /etc/nginx/sites-available/habit-tracker /etc/nginx/sites-enabled/

# Удаление дефолтной конфигурации
sudo rm /etc/nginx/sites-enabled/default

# Проверка конфигурации
sudo nginx -t

# Перезапуск Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

---

## 📋 Шаг 6: Настройка SSL

### 6.1 Установка Certbot
```bash
sudo apt install certbot python3-certbot-nginx -y
```

### 6.2 Получение SSL сертификата
```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

### 6.3 Автоматическое обновление
```bash
# Добавление в crontab
sudo crontab -e

# Добавить строку:
0 12 * * * /usr/bin/certbot renew --quiet
```

---

## 📋 Шаг 7: Настройка Firewall

```bash
# Разрешение портов
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443

# Включение firewall
sudo ufw enable
```

---

## 📋 Шаг 8: Тестирование

### 8.1 Проверка Backend
```bash
# Проверка процессов
pm2 list

# Просмотр логов
pm2 logs habit-tracker-api

# Проверка API
curl http://localhost:5000/api/health
```

### 8.2 Проверка Frontend
```bash
# Проверка Nginx
sudo systemctl status nginx

# Проверка сайта
curl -I http://your-domain.com
```

---

## 📋 Шаг 9: Мониторинг

### 9.1 PM2 мониторинг
```bash
# Мониторинг в реальном времени
pm2 monit

# Просмотр статистики
pm2 show habit-tracker-api
```

### 9.2 Nginx логи
```bash
# Access logs
sudo tail -f /var/log/nginx/access.log

# Error logs
sudo tail -f /var/log/nginx/error.log
```

---

## 🎯 Результат

После выполнения всех шагов у вас будет:

✅ **PostgreSQL база данных** в Yandex Cloud  
✅ **Backend API** на Compute Instance  
✅ **Frontend приложение** с Nginx  
✅ **SSL сертификат** для безопасности  
✅ **Автоматические бэкапы** и мониторинг  

### URL приложения:
- **Frontend**: `https://your-domain.com`
- **API**: `https://your-domain.com/api`
- **Health check**: `https://your-domain.com/api/health`

---

## 🔧 Полезные команды

### Обновление приложения
```bash
cd /var/www/habit-tracker
git pull origin main
cd backend && npm install
pm2 restart habit-tracker-api
cd .. && npm install && npm run build
```

### Просмотр логов
```bash
# Backend логи
pm2 logs habit-tracker-api

# Nginx логи
sudo tail -f /var/log/nginx/access.log
```

### Перезапуск сервисов
```bash
# Backend
pm2 restart habit-tracker-api

# Nginx
sudo systemctl restart nginx
```

---

## 📞 Поддержка

- **Документация**: README.md
- **API**: /api/health
- **Логи**: PM2 и Nginx
- **Мониторинг**: PM2 monit

**Готово к развертыванию! 🚀** 