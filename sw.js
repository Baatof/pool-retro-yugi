const SHELL = "poolretro-shell-v1";
const ART = "poolretro-art-v1";
const FILES = ["./", "./index.html", "./manifest.json",
  "./apple-touch-icon.png", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(SHELL).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks =>
    Promise.all(ks.filter(k => k !== SHELL && k !== ART).map(k => caches.delete(k)))
  ).then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET") return;

  if (url.hostname.endsWith("ygoprodeck.com") && url.pathname.includes("/images/")) {
    e.respondWith(caches.open(ART).then(async cache => {
      const hit = await cache.match(e.request);
      if (hit) return hit;
      try {
        const res = await fetch(e.request);
        if (res.ok || res.type === "opaque") cache.put(e.request, res.clone());
        return res;
      } catch (err) {
        return new Response("", { status: 504 });
      }
    }));
    return;
  }

  if (url.origin === self.location.origin) {
    e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
      const copy = res.clone();
      caches.open(SHELL).then(c => c.put(e.request, copy));
      return res;
    }).catch(() => caches.match("./index.html"))));
  }
});
