// Deliberately does NOT cache anything. This app already forces fresh
// fetches on deploy via ?v=N query strings on style.css/app.js (see
// index.html) — a caching service worker would fight that strategy and
// risk serving stale JS/CSS after a redeploy. Its only job is to satisfy
// Chrome's PWA installability requirement, which needs a registered
// service worker with a fetch handler before beforeinstallprompt can fire.

self.addEventListener('install', () => {
  self.skipWaiting(); // Activate a new version immediately, don't wait for all tabs to close.
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});
