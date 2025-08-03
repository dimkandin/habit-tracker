#!/bin/bash

echo "=== Проверка состояния сервера ==="
echo "Текущая директория: $(pwd)"
echo "Файлы в текущей директории:"
ls -la

echo ""
echo "=== Проверка backend директории ==="
if [ -d "backend" ]; then
    echo "Backend директория существует"
    cd backend
    echo "Файлы в backend:"
    ls -la
    echo ""
    echo "=== Проверка package.json ==="
    if [ -f "package.json" ]; then
        echo "package.json существует"
        cat package.json
    else
        echo "package.json НЕ существует"
    fi
else
    echo "Backend директория НЕ существует"
fi

echo ""
echo "=== Проверка процессов Node.js ==="
ps aux | grep node

echo ""
echo "=== Проверка портов ==="
netstat -tlnp | grep :5000 