/* 레벨업 길드 service worker */
const CACHE='levelup-guild-v1.1.0';
const SHELL=['./','index.html','style.css','config.js','data.js','app.js','ask.js','sfx.js','manifest.webmanifest'];
const STATIC=['fonts/Galmuri11-sub.woff2','fonts/Galmuri11-Bold-sub.woff2','icons/icon-192.png','icons/icon-512.png','icons/icon-maskable-512.png','icons/apple-touch-icon.png'];
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll([...SHELL,...STATIC])));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('levelup-guild-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('message',e=>{if(e.data==='skipWaiting')self.skipWaiting();});
self.addEventListener('fetch',e=>{
  const req=e.request;
  if(req.method!=='GET')return;            // POST(묻기 /ask 포함)는 SW를 거치지 않고 네트워크로
  const url=new URL(req.url);
  if(url.origin!==location.origin)return;  // 다른 origin(묻기 엔드포인트 등)은 통과: 캐시 안 함
  if(/\/ask$/.test(url.pathname))return;
  const scope=new URL(self.registration.scope);
  if(!url.pathname.startsWith(scope.pathname))return;
  const isStatic=/\/(fonts|icons)\//.test(url.pathname);
  if(isStatic){
    e.respondWith(caches.match(req).then(r=>r||fetch(req).then(res=>{if(res.ok){const cp=res.clone();caches.open(CACHE).then(c=>c.put(req,cp));}return res;})));
    return;
  }
  // HTML/JS/CSS: network-first, 실패 시 캐시
  e.respondWith(fetch(req).then(res=>{
    if(res.ok){const cp=res.clone();caches.open(CACHE).then(c=>c.put(req,cp));}
    return res;
  }).catch(()=>caches.match(req,{ignoreSearch:true}).then(r=>r||(req.mode==='navigate'?caches.match('index.html'):undefined)).then(r=>r||Response.error())));
});
