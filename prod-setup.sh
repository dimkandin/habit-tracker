#!/bin/bash

echo "🚀 Настройка для production (GitHub Pages)..."

# Возвращаем homepage для GitHub Pages
sed -i '' 's|"homepage": "."|"homepage": "https://dimkandin.github.io/habit-tracker"|g' package.json

echo "✅ homepage изменен на GitHub Pages URL"
echo "📦 Теперь можно собрать: npm run build"
echo "🚀 И задеплоить: ./deploy-manual.sh"
echo ""
echo "📝 Для возврата к development запустите: ./dev-setup.sh"