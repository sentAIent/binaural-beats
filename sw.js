// MindWave Service Worker
// Enables offline functionality and caching

const CACHE_NAME = 'mindwave-v200';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/css/tailwind-compiled.css',
    '/css/style.css',
    '/js/main.js',
    '/js/state.js',
    '/js/audio/engine.js',
    '/js/audio/session-timer.js',
    '/js/ui/controls.js',
    '/js/ui/auth-controller.js',
    '/js/ui/onboarding.js',
    '/js/ui/layout.js',
    '/js/content/audio-library.js',
    '/js/content/classical.js',
    '/js/content/stories.js',
    '/js/content/journey.js',
    '/js/visuals/visualizer.js',
    '/js/export/recorder.js',
    '/js/export/export-worker.js',
    '/js/services/firebase.js',
    '/js/services/share.js',
    '/js/services/analytics.js',
    '/js/utils/init.js',
    '/js/utils/haptics.js',
    '/manifest.json'
];

// Install: Cache static assets
self.addEventListener('install', (event) => {
    console.log('[SW] Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate: Clean old caches
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating...');
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((name) => name !== CACHE_NAME)
                        .map((name) => {
                            console.log('[SW] Deleting old cache:', name);
                            return caches.delete(name);
                        })
                );
            })
            .then(() => self.clients.claim())
    );
});

// Fetch: Strategies based on content type
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Skip non-GET requests
    if (event.request.method !== 'GET') return;

    // Skip Firebase/external requests
    if (url.origin !== self.location.origin) return;

    // Skip Chrome extension requests
    if (url.protocol === 'chrome-extension:') return;

    // STRATEGY 1: Cache-First (No Background Update)
    // For: Audio, Video, Images, Fonts, and Versioned Assets (?v=...)
    // These files don't change without a new filename/query param.
    const isMedia = /\.(ogg|mp3|wav|webm|mp4|jpg|jpeg|png|gif|svg|ico|woff|woff2)$/i.test(url.pathname);
    const isVersioned = url.searchParams.has('v');

    if (isMedia || isVersioned) {
        event.respondWith(
            caches.match(event.request).then((cachedResponse) => {
                if (cachedResponse) {
                    return cachedResponse; // Return cached immediately, no network usage
                }
                return fetch(event.request).then((response) => {
                    if (response.ok) {
                        const responseClone = response.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
                    }
                    return response;
                });
            })
        );
        return;
    }

    // STRATEGY 2: Stale-While-Revalidate
    // For: HTML, CSS, JS (unversioned), and everything else
    // Serve from cache fast, but update in background for next time.
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            const fetchPromise = fetch(event.request).then((response) => {
                if (response.ok) {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
                }
                return response;
            }).catch(() => { /* Ignore network errors */ });

            return cachedResponse || fetchPromise;
        }).catch(() => {
            // Offline fallback for HTML
            if (event.request.headers.get('Accept')?.includes('text/html')) {
                return caches.match('/index.html');
            }
        })
    );
});

// Handle messages from main thread
self.addEventListener('message', (event) => {
    if (event.data === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
