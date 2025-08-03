# 🚀 Развертывание в Yandex Cloud

## 📋 План развертывания

### 1. База данных PostgreSQL
### 2. Backend API
### 3. Frontend приложение
### 4. Домен и SSL

---

## 🗄️ 1. Создание PostgreSQL в Yandex Cloud

### Шаг 1: Создание кластера
1. Откройте [Yandex Cloud Console](https://console.cloud.yandex.ru/)
2. Выберите ваш проект
3. Перейдите в **Managed Service for PostgreSQL**
4. Нажмите **Создать кластер**

### Шаг 2: Настройка кластера
```
Название: habit-tracker-db
Версия: PostgreSQL 15
Класс хоста: s2.micro (для начала)
Размер диска: 10 ГБ
Сеть: default
```

### Шаг 3: Создание базы данных
1. Перейдите в созданный кластер
2. Откройте **Базы данных**
3. Создайте базу данных:
   - Имя: `habit_tracker`
   - Владелец: `postgres`

### Шаг 4: Настройка доступа
1. Перейдите в **Пользователи**
2. Создайте пользователя:
   - Имя: `habit_user`
   - Пароль: `secure_password_123`
3. Перейдите в **Сетевой доступ**
4. Добавьте IP адрес вашего сервера или `0.0.0.0/0` для тестирования

---

## ⚙️ 2. Настройка Backend

### Шаг 1: Создание Compute Instance
1. Перейдите в **Compute Cloud**
2. Создайте виртуальную машину:
   - Имя: `habit-tracker-api`
   - Платформа: Intel Ice Lake
   - vCPU: 2
   - RAM: 4 ГБ
   - Диск: 20 ГБ SSD
   - Образ: Ubuntu 22.04 LTS

### Шаг 2: Подключение к серверу
```bash
ssh ubuntu@your-server-ip
```

### Шаг 3: Установка зависимостей
```bash
# Обновление системы
sudo apt update && sudo apt upgrade -y

# Установка Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Установка PM2
sudo npm install -g pm2

# Проверка версий
node --version
npm --version
```

### Шаг 4: Клонирование проекта
```bash
# Создание директории
mkdir -p /var/www/habit-tracker
cd /var/www/habit-tracker

# Клонирование репозитория
git clone https://github.com/dimkandin/habit-tracker.git .
```

### Шаг 5: Настройка Backend
```bash
# Переход в backend
cd backend

# Установка зависимостей
npm install

# Создание .env файла
cat > .env << EOF
NODE_ENV=production
PORT=5000

# Database Configuration
DB_HOST=your-db-host.yandexcloud.net
DB_PORT=5432
DB_NAME=habit_tracker
DB_USER=habit_user
DB_PASSWORD=secure_password_123

# JWT Configuration
JWT_SECRET=your_super_secret_production_jwt_key_here

# Frontend URL
FRONTEND_URL=https://your-domain.com
EOF

# Запуск с PM2
pm2 start server.js --name "habit-tracker-api"
pm2 save
pm2 startup
```

---

## 🌐 3. Настройка Frontend

### Шаг 1: Сборка приложения
```bash
# Переход в корневую директорию
cd /var/www/habit-tracker

# Установка зависимостей
npm install

# Сборка для продакшна
npm run build
```

### Шаг 2: Настройка Nginx
```bash
# Установка Nginx
sudo apt install nginx -y

# Создание конфигурации
sudo nano /etc/nginx/sites-available/habit-tracker
```

Содержимое конфигурации:
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

### Шаг 3: Активация конфигурации
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

## 🔒 4. Настройка SSL (Let's Encrypt)

### Шаг 1: Установка Certbot
```bash
sudo apt install certbot python3-certbot-nginx -y
```

### Шаг 2: Получение SSL сертификата
```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

### Шаг 3: Автоматическое обновление
```bash
# Добавление в crontab
sudo crontab -e

# Добавить строку:
0 12 * * * /usr/bin/certbot renew --quiet
```

---

## 🔄 5. Обновление Frontend для работы с API

Теперь нужно обновить frontend для работы с backend API вместо localStorage:

### Шаг 1: Создание API сервиса
```javascript
// src/services/api.js
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class ApiService {
  constructor() {
    this.token = localStorage.getItem('token');
  }

  setToken(token) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('token');
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(url, config);
    
    if (response.status === 401) {
      this.clearToken();
      window.location.href = '/login';
      return;
    }

    return response;
  }

  // Аутентификация
  async register(userData) {
    const response = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    const data = await response.json();
    if (data.token) {
      this.setToken(data.token);
    }
    return data;
  }

  async login(credentials) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    const data = await response.json();
    if (data.token) {
      this.setToken(data.token);
    }
    return data;
  }

  // Привычки
  async getHabits() {
    const response = await this.request('/habits');
    return response.json();
  }

  async createHabit(habitData) {
    const response = await this.request('/habits', {
      method: 'POST',
      body: JSON.stringify(habitData),
    });
    return response.json();
  }

  async updateHabit(id, habitData) {
    const response = await this.request(`/habits/${id}`, {
      method: 'PUT',
      body: JSON.stringify(habitData),
    });
    return response.json();
  }

  async deleteHabit(id) {
    const response = await this.request(`/habits/${id}`, {
      method: 'DELETE',
    });
    return response.json();
  }

  // Выполнение привычек
  async updateCompletion(id, date, completed) {
    const response = await this.request(`/habits/${id}/completion`, {
      method: 'POST',
      body: JSON.stringify({ date, completed }),
    });
    return response.json();
  }

  async updateValue(id, date, value) {
    const response = await this.request(`/habits/${id}/value`, {
      method: 'POST',
      body: JSON.stringify({ date, value }),
    });
    return response.json();
  }

  async updateMood(id, date, moodValue) {
    const response = await this.request(`/habits/${id}/mood`, {
      method: 'POST',
      body: JSON.stringify({ date, moodValue }),
    });
    return response.json();
  }
}

export default new ApiService();
```

---

## 📊 6. Мониторинг и логи

### PM2 мониторинг
```bash
# Просмотр процессов
pm2 list

# Просмотр логов
pm2 logs habit-tracker-api

# Мониторинг в реальном времени
pm2 monit
```

### Nginx логи
```bash
# Access logs
sudo tail -f /var/log/nginx/access.log

# Error logs
sudo tail -f /var/log/nginx/error.log
```

---

## 🔧 7. Автоматическое развертывание

### Создание скрипта деплоя
```bash
# /var/www/habit-tracker/deploy.sh
#!/bin/bash

echo "🚀 Начинаем деплой..."

# Переход в директорию проекта
cd /var/www/habit-tracker

# Получение последних изменений
git pull origin main

# Установка зависимостей backend
cd backend
npm install

# Перезапуск API
pm2 restart habit-tracker-api

# Установка зависимостей frontend
cd ..
npm install

# Сборка frontend
npm run build

echo "✅ Деплой завершен!"
```

### Настройка прав
```bash
chmod +x /var/www/habit-tracker/deploy.sh
```

---

## 🎯 Результат

После выполнения всех шагов у вас будет:

✅ **Полноценное веб-приложение** с базой данных  
✅ **Синхронизация** между всеми устройствами  
✅ **Аутентификация** пользователей  
✅ **SSL сертификат** для безопасности  
✅ **Автоматическое развертывание**  
✅ **Мониторинг** и логирование  

### URL приложения:
- Frontend: `https://your-domain.com`
- API: `https://your-domain.com/api`
- Health check: `https://your-domain.com/api/health`

---

## 🔧 Дополнительные настройки

### Настройка firewall
```bash
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

### Настройка автоматических бэкапов
```bash
# Создание скрипта бэкапа
sudo nano /usr/local/bin/backup-habits.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/habit-tracker"

mkdir -p $BACKUP_DIR

# Бэкап базы данных
pg_dump -h your-db-host.yandexcloud.net -U habit_user habit_tracker > $BACKUP_DIR/db_$DATE.sql

# Бэкап файлов приложения
tar -czf $BACKUP_DIR/app_$DATE.tar.gz /var/www/habit-tracker

# Удаление старых бэкапов (старше 30 дней)
find $BACKUP_DIR -name "*.sql" -mtime +30 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete
```

```bash
chmod +x /usr/local/bin/backup-habits.sh

# Добавление в crontab (ежедневно в 2:00)
sudo crontab -e
0 2 * * * /usr/local/bin/backup-habits.sh
``` 