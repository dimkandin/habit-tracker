#!/bin/bash

# Скрипт для добавления SSH ключей на сервер
# Выполните этот скрипт в веб-терминале Yandex Cloud Console

echo "🔑 Добавление SSH ключей на сервер..."

# Создайте директорию для SSH ключей
mkdir -p ~/.ssh

# Добавьте публичные ключи
echo "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQCkShLiMQbVWEUKd7ZC+IgqGF9jo5LjYJcnuhOanMv4wVKZdeYIQDs68HGKhYDHiuEr4qbRk4FY9x43X7atwm8GhRYHfqCzaryJFXFQT9kcPCgQgNtbYVNn938Bp6sUCWBTI6lv8JL7EEILDwqoovfG0T96CjXdzJSsQQ4gRv4cnYrKoFNj+gTJBoblR8mAWbNZEpiNZLoJskTHHp5d6VesgeZD8KKdU+C6jPRTrf6YlsWdEi9JNk2FgGTv7qRWB/zmgedY7ATMHKzPodcKuU4q8PjXI7YXyZLjpiqF20M5qbGq2IV1x6VAme5yyigr3I/wsuLDxtttGz0neSX53uJqIp96tz+Yf5vlpi5EM+0lFuzUrSdX1I6fFlol4X8Rn5GO6xZ740pKSSdveQWgE/D0+rCudVrX93wnrWbg/E4dhSy5NED0l1GgWrqlobtfnvThPne+Y9W3I4Hx15thjeNtR20y/TWv2zGrgfmUYTW9jvPO0YA+A73p9CK7KteD3dfyxtXJ8kvkUV0t+Is3le8G5BO/RsktX7N7PUvUFA/ejcAzVihHINw++UY7J5LNx+h0uiZMzXcmFdM80k77qpTuY5/hAtwwtmwBfEwicXHJFiyz3cLCgt4uXmgaMWCCqq0t2TNzvhyhV2tOx/eFjtzXEUKCAWqLHQPeEixF41S5NQ== dim@MacBook-Air-Dmitrij.local" >> ~/.ssh/authorized_keys

# Установите правильные права
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys

# Проверьте, что ключи добавлены
echo "✅ Добавленные ключи:"
cat ~/.ssh/authorized_keys

echo ""
echo "🔑 SSH ключи успешно добавлены!"
echo "Теперь можно подключаться по SSH с вашего компьютера." 