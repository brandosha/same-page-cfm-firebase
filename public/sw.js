function handleServiceWorker() {
    importScripts('https://storage.googleapis.com/workbox-cdn/releases/4.3.1/workbox-sw.js');
    workbox.routing.registerRoute(
        /^((?!(channel)|(cloudfunctions)|(securetoken)|(identitytoolkit)).)*$/,
        new workbox.strategies.NetworkFirst()
    );
}

function registerServiceWorker() {
    navigator.serviceWorker.register('/sw.js')
    .then(function(registration) {
        console.log('Registration successful, scope is:', registration.scope);
    })
    .catch(function(error) {
        console.log('Service worker registration failed, error:', error);
    });
}

if('serviceWorker' in navigator) {
    registerServiceWorker()
} else if (
    'ServiceWorkerGlobalScope' in this &&
    this instanceof ServiceWorkerGlobalScope
) {
    handleServiceWorker()
}