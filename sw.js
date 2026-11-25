// 핸즈프리 악보 — 오프라인 저장용 (버전을 올리면 새 파일로 교체됩니다)
const VERSION = "smart-score-v6";
const FILES = [
  "./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png",
  "./vendor/pdf.min.mjs", "./vendor/pdf.worker.min.mjs", "./vendor/vision_bundle.mjs",
  "./vendor/wasm/vision_wasm_internal.js", "./vendor/wasm/vision_wasm_internal.wasm",
  "./vendor/wasm/vision_wasm_nosimd_internal.js", "./vendor/wasm/vision_wasm_nosimd_internal.wasm",
  "./models/face_landmarker.task",
  ...["piano","violin","cello","guitar","wind","voice","drum"].map(k => `./img/inst/${k}.webp`),
  "./img/sample/p1.webp", "./img/sample/p2.webp", "./img/logo.svg", "./favicon.svg",
];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const host = new URL(req.url).host;
  if (host === "fonts.googleapis.com" || host === "fonts.gstatic.com") { // 글꼴도 오프라인용으로 저장
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); return res; })));
    return;
  }
  if (new URL(req.url).origin !== location.origin) return;
  // 화면(index.html)은 인터넷이 되면 항상 최신으로, 안 되면 저장본으로
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).then(res => { const copy = res.clone(); caches.open(VERSION).then(c => c.put("./index.html", copy)); return res; }).catch(() => caches.match("./index.html")));
    return;
  }
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then(hit => hit || fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
      return res;
    }))
  );
});
