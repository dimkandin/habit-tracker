#!/bin/bash

echo "🔧 Настройка для локальной разработки..."

# Изменяем homepage для локальной разработки
sed -i '' 's|"homepage": "https://dimkandin.github.io/habit-tracker"|"homepage": "."|g' package.json

echo "✅ homepage изменен на '.'"
echo "🚀 Теперь можно запустить: npm start"
echo "📱 Приложение будет доступно на: http://localhost:3000"
echo "🔗 API работает на: http://localhost:5000/api"
echo ""
echo "📝 Для возврата к production запустите: ./prod-setup.sh"