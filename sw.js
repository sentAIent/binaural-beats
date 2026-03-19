// NUCLEAR SW - SELF DESTRUCT & CACHE CLEAR
// This Service Worker is designed to unregister itself and clear all caches immediately.

const CACHE_NAME = 'NUCLEAR_PURGE_V101';

self.addEventListener('install', (event) => {
    console.log('[NUCLEAR SW] Purge Install - Skip Waiting');
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log('[NUCLEAR SW] Purge Activate - Unregistering and Clearing Caches');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    console.log('[NUCLEAR SW] Deleting Cache:', cacheName);
                    return caches.delete(cacheName);
                })
            );
        }).then(() => {
            return self.registration.unregister();
        }).then(() => {
            console.log('[NUCLEAR SW] Unregistered successfully');
            return self.clients.claim();
        }).then(() => {
            // Force reload all controlled clients
            return self.clients.matchAll().then((clients) => {
                clients.forEach(client => {
                    if (client.url && 'navigate' in client) {
                        console.log('[NUCLEAR SW] Reloading client:', client.url);
                        client.navigate(client.url);
                    }
                });
            });
        })
    );
});
