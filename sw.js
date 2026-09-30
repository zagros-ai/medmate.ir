// توجه: برای هر بار آپدیت کردن برنامه‌های داخل سایت، عدد این نسخه را بالاتر ببرید (مثلا v30)
const CACHE_NAME = 'my-pwa-cache-v30'; 
const ASSETS = [
  '/',
  '/index.html',
  '/css/styles.css',
  '/js/script.js',
  '/js/apps-data.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Caching assets in:', CACHE_NAME);
      return cache.addAll(ASSETS);
    })
  );
  // در اینجا عمداً self.skipWaiting() را صدا نمی‌زنیم 
  // تا منتظر تایید کاربر و دریافت پیام بماند
});

// دریافت پیام از فایل script.js برای جایگزینی فوری سرویس ورکر
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // حذف کش‌های نسخه‌های قدیمی
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // در دست گرفتن کنترل کلاینت‌ها با سرویس ورکر جدید
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  
  // جلوگیری از کش شدن فایل sw.js تا مرورگر همیشه بتواند آپدیت‌ها را شناسایی کند
  if (event.request.url.includes('/sw.js')) {
    return fetch(event.request);
  }

  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        return cachedResponse || fetch(event.request)
          .then(networkResponse => {
            // آپدیت کردن کش با دیتای جدید در صورت موفق بودن درخواست
            if (networkResponse && networkResponse.status === 200) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME)
                .then(cache => cache.put(event.request, responseToCache));
            }
            return networkResponse;
          })
          .catch(() => {
             // اگر کاربر آفلاین بود و درخواست ناموفق شد، صفحه اصلی را برگردان
             return caches.match('/index.html');
          });
      })
  );
});
