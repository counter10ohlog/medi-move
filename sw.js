/* 메디포스트 휴대폰 재고이동 — 화면 파일을 휴대폰에 저장해 두기 (창고에서 인터넷이 끊겨도 QR로 열리게)
 * 화면 파일(같은 주소)만 다룬다. 구글로 보내는 자료(POST)는 건드리지 않는다.
 * 인터넷이 되면 늘 새 파일을 먼저 받고(4초 기다림), 안 되면 저장해 둔 것을 보여 준다. */
const CACHE = 'medi-move-v1';
const FILES = ['./', './index.html', './config.js'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const res = await Promise.race([
        fetch(req, { cache: 'no-store' }),
        new Promise((_, rej) => setTimeout(() => rej(new Error('느림')), 4000))
      ]);
      if (res && res.ok) {
        const key = new URL(req.url); key.search = '';          // ?loc=… 는 빼고 저장 (자리마다 같은 화면)
        cache.put(key.href, res.clone());
      }
      return res;
    } catch (err) {
      const hit = await cache.match(req, { ignoreSearch: true }) || (req.mode === 'navigate' && await cache.match('./index.html'));
      if (hit) return hit;
      throw err;
    }
  })());
});
