const CACHE_NAME = 'vocadash-cache-v3';
const MATERIAL_SYMBOLS_URL = 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200';

const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.json',
  './favicon.png',
  './css/tailwind.prod.css',
  './css/style.css',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/characters/es-idle.webp',
  './assets/characters/es-run.webp',
  './assets/characters/es-study.webp',
  './assets/characters/es-fever.webp',
  './assets/characters/es-happy.webp',
  './assets/characters/es-victory.webp',
  './assets/characters/es-sad.webp',
  './assets/characters/es-surprised.webp',
  './assets/characters/en-idle.webp',
  './assets/characters/en-run.webp',
  './assets/characters/en-study.webp',
  './assets/characters/en-fever.webp',
  './assets/characters/en-happy.webp',
  './assets/characters/en-victory.webp',
  './assets/characters/en-sad.webp',
  './assets/characters/en-surprised.webp',
  './assets/profiles/profile-spanish.webp',
  './assets/profiles/profile-english.webp',
  './assets/profiles/profile-artist.webp',
  './assets/profiles/profile-explorer.webp',
  './js/errorBoundary.js',
  './js/data/languagesRegistry.js',
  './js/data/data_es.js',
  './js/data_football.js',
  './js/data/data_en.js',
  './js/dataLoader.js',
  './js/data/courseSections.js',
  './js/courseConfig.js',
  './js/sound.js',
  './js/settingsStore.js',
  './js/settings.js',
  './js/heartManager.js',
  './js/languageModal.js',
  './js/bookRenderer.js',
  './js/progressManager.js',
  './js/courseDrawer.js',
  './js/roadmapTemplates.js',
  './js/roadmapRenderer.js',
  './js/lessonModal.js',
  './js/profileManager.js',
  './js/shopModal.js',
  './js/packsManager.js',
  './js/reviewManager.js',
  './js/flashcard.js',
  './js/app.js',
  './js/gameResultModal.js',
  './js/quizSessionGenerator.js',
  './js/gameEngine.js',
  './js/navigation.js',
  './js/debug.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => Promise.all([
        cache.addAll(PRECACHE_URLS),
        cache.add(MATERIAL_SYMBOLS_URL).catch(() => {})
      ]))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

function staleWhileRevalidate(request, ignoreSearch = false) {
  return caches.match(request, { ignoreSearch }).then((cached) => {
    const networkFetch = fetch(request)
      .then((response) => {
        if (response && (response.ok || response.type === 'opaque')) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => cached);

    return cached || networkFetch;
  });
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put('./index.html', clone));
          }
          return response;
        })
        .catch(() => caches.match('./index.html', { ignoreSearch: true }))
    );
    return;
  }

  const isSameOrigin = url.origin === self.location.origin;
  const isFontOrCdnAsset =
    url.hostname === 'fonts.googleapis.com' ||
    url.hostname === 'fonts.gstatic.com' ||
    url.hostname === 'cdn.jsdelivr.net';

  if (isSameOrigin) {
    event.respondWith(staleWhileRevalidate(request, true));
  } else if (isFontOrCdnAsset) {
    // Query string(?family=...) distinguishes Noto Sans KR vs Material Symbols Outlined
    event.respondWith(staleWhileRevalidate(request, false));
  }
});
