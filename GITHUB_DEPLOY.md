# Деплой на GitHub Pages

## Пошаговая инструкция

### 1. Создание репозитория на GitHub

1. Перейдите на [github.com](https://github.com)
2. Нажмите "New repository"
3. Назовите репозиторий: `habit-tracker`
4. Оставьте его публичным
5. НЕ инициализируйте с README (у нас уже есть файлы)
6. Нажмите "Create repository"

### 2. Загрузка кода в репозиторий

Выполните следующие команды в терминале:

```bash
# Добавляем удаленный репозиторий (замените YOUR_USERNAME на ваше имя пользователя)
git remote add origin https://github.com/YOUR_USERNAME/habit-tracker.git

# Отправляем код в репозиторий
git branch -M main
git push -u origin main
```

### 3. Настройка GitHub Pages

1. Перейдите в Settings вашего репозитория
2. В левом меню найдите "Pages"
3. В разделе "Source" выберите "Deploy from a branch"
4. Выберите ветку "gh-pages"
5. Нажмите "Save"

### 4. Деплой приложения

```bash
# Деплой на GitHub Pages
npm run deploy
```

### 5. Проверка

После деплоя приложение будет доступно по адресу:
`https://YOUR_USERNAME.github.io/habit-tracker`

## Альтернативный способ через GitHub Actions

Если хотите автоматический деплой при каждом push:

1. Создайте файл `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '16'
        
    - name: Install dependencies
      run: npm install
      
    - name: Build
      run: npm run build
      
    - name: Deploy to GitHub Pages
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./build
```

## Преимущества GitHub Pages

- ✅ Бесплатно
- ✅ Простая настройка
- ✅ Автоматический HTTPS
- ✅ Кастомный домен (опционально)
- ✅ Хорошая производительность
- ✅ PWA поддержка

## Проверка после деплоя

Убедитесь, что:
- ✅ Приложение загружается
- ✅ Все функции работают
- ✅ Адаптивность на мобильных устройствах
- ✅ Сохранение данных работает
- ✅ Экспорт/импорт работает 