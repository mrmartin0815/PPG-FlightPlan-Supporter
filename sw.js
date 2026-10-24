// Service Worker für die PWA-Installation.
// Strategie: App-Dateien "network first" (Updates kommen sofort an, offline gibt es die letzte Version),
// Bibliotheken vom CDN "cache first" (versionsgenau, ändern sich nie).
// Overpass-Abfragen (POST) und Kartenkacheln werden bewusst nicht angefasst.
var CACHE = 'ppg-flightplan-v2';

var APP_FILES = [
    './',
    'index.html',
    'script.js?v=3',
    'styles.css',
    'manifest.webmanifest',
    'icons/icon-192.png',
    'icons/icon-512.png'
];

var CDN_FILES = [
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
    'https://unpkg.com/esri-leaflet@3.0.19/dist/esri-leaflet.js',
    'https://unpkg.com/osmtogeojson@2.2.12/osmtogeojson.js',
    'https://unpkg.com/@turf/turf@6.5.0/turf.min.js',
    'https://unpkg.com/leaflet-geometryutil@0.11.0/src/leaflet.geometryutil.js'
];

self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(CACHE).then(function(cache) {
            return cache.addAll(APP_FILES.concat(CDN_FILES));
        }).then(function() {
            return self.skipWaiting();
        })
    );
});

self.addEventListener('activate', function(event) {
    event.waitUntil(
        caches.keys().then(function(keys) {
            return Promise.all(keys.filter(function(key) {
                return key !== CACHE;
            }).map(function(key) {
                return caches.delete(key);
            }));
        }).then(function() {
            return self.clients.claim();
        })
    );
});

self.addEventListener('fetch', function(event) {
    var request = event.request;
    if (request.method !== 'GET') {
        return;
    }
    var url = new URL(request.url);

    // CDN-Bibliotheken: aus dem Cache, sonst laden und ablegen
    if (CDN_FILES.indexOf(request.url) !== -1) {
        event.respondWith(
            caches.match(request).then(function(cached) {
                return cached || fetch(request).then(function(response) {
                    var copy = response.clone();
                    caches.open(CACHE).then(function(cache) { cache.put(request, copy); });
                    return response;
                });
            })
        );
        return;
    }

    // Eigene App-Dateien: zuerst Netz, offline aus dem Cache
    if (url.origin === self.location.origin) {
        event.respondWith(
            fetch(request).then(function(response) {
                if (response.ok) {
                    var copy = response.clone();
                    caches.open(CACHE).then(function(cache) { cache.put(request, copy); });
                }
                return response;
            }).catch(function() {
                return caches.match(request).then(function(cached) {
                    return cached || caches.match('index.html');
                });
            })
        );
    }
    // Alles andere (Kartenkacheln, Overpass usw.) läuft normal übers Netz
});
