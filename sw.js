const CACHE_NAME = 'pira-ziman-v1';
// الملفات التي نريد حفظها لتعمل بدون إنترنت
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './style.css',
    './data.js',
    './script.js',
    './manifest.json'
];

// الخطوة 1: تثبيت الـ Service Worker وحفظ الملفات
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
        .then(cache => {
            console.log('تم حفظ الملفات بنجاح (Offline Mode Ready)');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

// الخطوة 2: جلب الملفات من الذاكرة عند غياب الإنترنت
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
        .then(response => {
            // إذا كان الملف موجوداً في الذاكرة، استخدمه. وإلا، اطلبه من الإنترنت.
            return response || fetch(event.request);
        })
    );
});

// الخطوة 3: تحديث الملفات القديمة إذا قمنا بتعديل التطبيق مستقبلاً
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if (cache !== CACHE_NAME) {
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
});