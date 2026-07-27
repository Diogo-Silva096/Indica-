var CACHE = "indica-v1.0.0";
var ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./css/base.css",
  "./css/layout.css",
  "./css/indicadores.css",
  "./css/pdf.css",
  "./css/simulador.css",
  "./css/responsive.css",
  "./version.js",
  "./simulador-core.js",
  "./simulador-ui.js",
  "./drawers.js",
  "./quadrimestre.js",
  "./pdf-import.js",
  "./unidade.js",
  "./indicadores-pco.js",
  "./indicadores-toc.js",
  "./indicadores-escovacao.js",
  "./indicadores-b456.js",
  "./indicadores.js",
  "./manifest.json",
  "./assets/icon.svg",
  "./assets/icon-192.png",
  "./assets/icon-512.png",
  "./assets/favicon-32.png",
  "./assets/apple-touch-icon.png",
];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (cache) {
      return cache.addAll(ASSETS).catch(function () { /* rede indisponível no install */ });
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET") return;
  var url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;

  e.respondWith(
    fetch(e.request)
      .then(function (res) {
        if (res && res.status === 200 && res.type === "basic") {
          var clone = res.clone();
          caches.open(CACHE).then(function (cache) { cache.put(e.request, clone); });
        }
        return res;
      })
      .catch(function () {
        return caches.match(e.request).then(function (cached) {
          return cached || caches.match("./index.html");
        });
      })
  );
});
