const CACHE_NAME = 'habit-tracker-v2';
const urlsToCache = [
  '/habit-tracker/',
  '/habit-tracker/static/js/bundle.js',
  '/habit-tracker/static/css/main.css',
  '/habit-tracker/manifest.json',
  '/habit-tracker/favicon.ico'
];

// Установка Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Активация Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Перехват запросов
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Возвращаем кешированный ответ, если он есть
        if (response) {
          return response;
        }
        
        // Иначе делаем запрос к сети
        return fetch(event.request).then(
          (response) => {
            // Проверяем, что ответ валидный
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Клонируем ответ
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      })
  );
});

// Обработка push-уведомлений
self.addEventListener('push', (event) => {
  const options = {
    body: 'Не забудьте отметить свои привычки!',
    icon: '/habit-tracker/logo192.png',
    badge: '/habit-tracker/logo192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Открыть приложение',
        icon: '/habit-tracker/logo192.png'
      },
      {
        action: 'close',
        title: 'Закрыть',
        icon: '/habit-tracker/logo192.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Habit Tracker', options)
  );
});

// Обработка кликов по уведомлениям
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/habit-tracker/')
    );
  }
}); 