#!/bin/bash

echo "🚀 Ручной деплой на GitHub Pages..."

# Собираем приложение
echo "📦 Сборка приложения..."
npm run build

# Переходим в папку build
cd build

# Инициализируем git репозиторий
git init
git add -A
git commit -m "Деплой $(date)"

# Пушим в ветку gh-pages
echo "🚀 Деплой в ветку gh-pages..."
git push -f https://github.com/dimkandin/habit-tracker.git main:gh-pages

echo "✅ Деплой завершен! Проверьте https://dimkandin.github.io/habit-tracker/"
echo "⏰ Обновление может занять 2-5 минут"

cd ..