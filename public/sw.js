/*var cachePaths = [
    // Firebase
    '/__/firebase/6.3.5/firebase-app.js',
    '/__/firebase/6.3.5/firebase-auth.js',
    '/__/firebase/6.3.5/firebase-firestore.js',
    '/__/firebase/6.3.5/firebase-functions.js',
    '/__/firebase/init.js',
    // Internal resources
    '/resources/consoleReplace.js',
    '/resources/loader.css',
    '/resources/loader.js',
    '/resources/scriptures.js',
    '/resources/FirebaseHandler.js',
    '/resources/fullPageLinkHandling.js',
    // External resources
    'https://cdn.jsdelivr.net/npm/vue/dist/vue.js',
    'https://code.jquery.com/jquery-3.4.1.min.js',
    'https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/js/bootstrap.bundle.min.js',
    'https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css',
    // Home page
    '/home',
    '/home/main.js',
    '/home/style.css'
]
var cacheName = 'same_page_v0.0.1'*/
// var cachePages = firebasePaths.concat(resourcePaths).concat(externalPaths).concat(homePaths)

function handleServiceWorker() {
    importScripts('https://storage.googleapis.com/workbox-cdn/releases/4.3.1/workbox-sw.js');
    workbox.routing.registerRoute(
        /\.(?:js|css|html)|\/$/,
        new workbox.strategies.NetworkFirst()
    );

    /*self.addEventListener('install', (e) => {
        console.log('Service worker installed', e)
        e.waitUntil(caches.open(cacheName)
        .then(cache => {
            return cache.addAll(cachePaths)
        }))
    })

    self.addEventListener('fetch', (e) => {
        console.log('Service worker handling fetch', e.request)
        e.respondWith(caches.match(e.request)
        .then(response => {
            if(response) {
                return response
            } else {
                return fetch(e.request)
            } 
        })
        .catch(error => {
            console.error(error)
        }))
    })*/
}

function registerServiceWorker() {
    // window.addEventListener('load', _ => {
        navigator.serviceWorker.register('/sw.js')
        .then(function(registration) {
            console.log('Registration successful, scope is:', registration.scope);
        })
        .catch(function(error) {
            console.log('Service worker registration failed, error:', error);
        });
    // })
}

// console.log(this, navigator)
if('serviceWorker' in navigator) {
    registerServiceWorker()
} else if (
    'ServiceWorkerGlobalScope' in this &&
    this instanceof ServiceWorkerGlobalScope
) {
    handleServiceWorker()
}