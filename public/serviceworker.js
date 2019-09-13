'use strict';

// Update cache names any time any of the cached files change.
const CACHE_NAME = 'static-cache-v1';
const DATA_CACHE_NAME = 'data-cache-v1';

//List of files to cache
const FILES_TO_CACHE = [
    '/',
    '/index.html',
    '/loadinfo.html',
    '/deliveryinfo.html',

    '/styles/site.css',

    '/scripts/acknowledgement.js',
    '/scripts/install.js',

    '/favicon.ico',
    '/images/app-logo-512x512.png',
    '/images/app-logo-dump-truck-130x35.gif',
    '/images/apple-touch-icon-57x57.png',
    '/images/apple-touch-icon-60x60.png',
    '/images/apple-touch-icon-72x72.png',
    '/images/apple-touch-icon-76x76.png',
    '/images/apple-touch-icon-114x114.png',
    '/images/apple-touch-icon-120x120.png',
    '/images/apple-touch-icon-144x144.png',
    '/images/apple-touch-icon-152x152.png',
    '/images/favicon-16x16.png',
    '/images/favicon-32x32.png',
    '/images/favicon-96x96.png',
    '/images/favicon-128.png',
    '/images/favicon-192x192.png',
    '/images/favicon-196x196.png',
    '/images/install.svg',
    '/images/mstile-70x70.png',
    '/images/mstile-144x144.png',
    '/images/mstile-150x150.png',
    '/images/mstile-310x150.png',
    '/images/mstile-310x310.png',
    '/images/refresh.svg'
];

// Cache the files
self.addEventListener('install', (evt) => {
    console.log('[ServiceWorker] Install');
    evt.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[ServiceWorker] Pre-caching pages');
            return cache.addAll(FILES_TO_CACHE);
        })
    );

    self.skipWaiting();
});

// Remove old cached data and files on the activate event
self.addEventListener('activate', (evt) => {
    console.log('[ServiceWorker] Activate');
    evt.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(keyList.map((key) => {
                if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
                    console.log('[ServiceWorker] Removing old cache', key);
                    return caches.delete(key);
                }
            }));
        })
    );

    self.clients.claim();
});

//If the data can be fetched, store it in the cache
self.addEventListener('fetch', (evt) => {

    console.log('[Service Worker] Fetch (data)', evt.request.url);
    if (evt.request.url.includes('/api/dispatches')) {

        evt.respondWith(
            caches.open(DATA_CACHE_NAME).then((cache) => {
                return fetch(evt.request)
                    .then((response) => {
                        // If the response was good, clone it and store it in the cache.
                        if (response.status === 200) {
                            cache.put(evt.request.url, response.clone());
                        }
                        return response;
                    }).catch((err) => {
                        // Network request failed, try to get it from the cache.
                        return cache.match(evt.request);
                    });
            }));
        return;
    }
    // Fetch files from the cache
    evt.respondWith(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.match(evt.request)
                .then((response) => {
                    return response || fetch(evt.request);
                });
        })
    );

    return;
});
