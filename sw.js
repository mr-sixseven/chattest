/* MiniChat service worker: offline-capable app shell + notifications from the installed app */
const CACHE='minichat-v4';
const SHELL=['./','index.html','chat.js','themes.css','manifest.webmanifest','icon-192.png','icon-512.png'];

self.addEventListener('install',e=>{
  e.waitUntil(
    caches.open(CACHE)
      .then(c=>Promise.all(SHELL.map(u=>c.add(u).catch(()=>{}))))   // a missing file must not break install
      .then(()=>self.skipWaiting())
  );
});
self.addEventListener('activate',e=>{
  e.waitUntil(
    caches.keys()
      .then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});
// Network first (so updates show up immediately when online), cached copy when offline.
self.addEventListener('fetch',e=>{
  const r=e.request;
  if(r.method!=='GET'||new URL(r.url).origin!==self.location.origin||r.headers.has('range'))return;
  e.respondWith(
    fetch(r).then(res=>{
      if(res&&res.ok){const copy=res.clone();caches.open(CACHE).then(c=>c.put(r,copy)).catch(()=>{})}
      return res;
    }).catch(()=>caches.match(r).then(hit=>hit||(r.mode==='navigate'?caches.match('index.html'):undefined)))
  );
});
self.addEventListener('notificationclick',e=>{
  e.notification.close();
  const msgId=e.notification.data&&e.notification.data.msgId;
  e.waitUntil(
    self.clients.matchAll({type:'window',includeUncontrolled:true}).then(list=>{
      const c=list[0];
      if(c){if(msgId)c.postMessage({mcJump:String(msgId)});return c.focus()}
      return self.clients.openWindow('./');
    })
  );
});
