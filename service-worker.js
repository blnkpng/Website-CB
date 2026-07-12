// Ubah versi cache agar browser di HP mereset cache yang lama
const CACHE_NAME = "cabe-bisnis-assistive-nav-v3"; 

// Masukkan semua file penting di sini, terutama ikon!
const ASSETS = [
  "./",
  "index.html",
  "manifest.json",
  "assets/icon-192.png",
  "assets/icon-512.png"
  // Jika kamu punya file CSS atau JS tambahan, masukkan juga ke sini. 
  // Contoh: "css/style.css", "js/app.js"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  const isPageRequest = event.request.mode === "navigate" || url.pathname.endsWith("/") || url.pathname.endsWith("/index.html");

  if (isPageRequest) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put("index.html", copy));
          return response;
        })
        .catch(() => caches.match("index.html"))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});