// CACHE and FILES are injected by scripts/sw.mjs.
const isSafe = response => response && response.ok && !response.redirected &&
  response.type !== 'opaqueredirect' && response.type !== 'opaque';
const isDocument = response => isSafe(response) &&
  (response.headers.get('content-type') || '').includes('text/html');

async function safeFetch(request) {
  // Reject redirects before following them, including hosting/auth redirects.
  const response = await fetch(request, { redirect: 'error', cache: 'no-store' });
  if (!isSafe(response)) throw new Error('Unsafe response');
  return response;
}

// A repair must not wait for dozens of offline asset downloads. Activation
// happens immediately; assets are cached as requested after the worker takes over.
self.addEventListener('install', event => event.waitUntil(self.skipWaiting()));

// Safari also checks the internal response URL list. A fresh Response has no
// network URL history. Only already validated responses may reach this helper.
function navigationResponse(response) {
  return new Response(response.body, {
    status: response.status, statusText: response.statusText, headers: response.headers
  });
}

self.addEventListener('activate', event => event.waitUntil((async () => {
  const names = await caches.keys();
  await Promise.all(names.filter(name => name.startsWith('dyad-') && name !== CACHE)
    .map(name => caches.delete(name)));
  await self.clients.claim();
})()));

async function navigate(request) {
  try {
    const response = await safeFetch(request);
    // Cache only the canonical app shell, never arbitrary navigation/auth pages.
    const url = new URL(request.url);
    if (url.pathname === '/' && !url.search && isDocument(response)) {
      try { await (await caches.open(CACHE)).put('/index.html', response.clone()); } catch {}
    }
    return navigationResponse(response);
  } catch {
    try {
      const cache = await caches.open(CACHE);
      const cached = await cache.match('/index.html');
      if (isDocument(cached)) return navigationResponse(cached);
      if (cached) await cache.delete('/index.html');
    } catch {}
    try {
      const response = await safeFetch('/');
      if (isDocument(response)) return navigationResponse(response);
    } catch {}
    return new Response('Dyad cannot connect. Please reconnect and reload.', {
      status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  }
}

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (event.request.mode === 'navigate') {
    event.respondWith(navigate(event.request));
    return;
  }
  if (FILES.includes(url.pathname)) event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(url.pathname);
    if (isSafe(cached)) return cached;
    const response = await safeFetch(event.request);
    try { await cache.put(url.pathname, response.clone()); } catch {}
    return response;
  })());
});

// Warm offline assets after activation without delaying takeover or navigation.
self.addEventListener('message', event => {
  if (event.data?.type !== 'CACHE_OFFLINE_ASSETS') return;
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await Promise.all(FILES.map(async path => {
      try {
        const response = await safeFetch(path === '/index.html' ? '/' : path);
        if (path !== '/index.html' || isDocument(response)) await cache.put(path, response);
      } catch {}
    }));
  })());
});
