// Klavion PWA Service Worker
const CACHE_NAME = 'klavion-v1.0.0';
const CACHE_URLS = [
  './',
  './index.html',
  './app.js',
  './scss/styles.min.css',
  './src/img/ogp.png',
  './src/img/scr.jpg',
  './manifest.json',
  './icons/icon-192x192.svg',
  './icons/icon-512x512.svg'
];

// インストール時にリソースをキャッシュ
self.addEventListener('install', event => {
  console.log('[SW] Install event');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Caching app shell');
        return cache.addAll(CACHE_URLS);
      })
      .then(() => {
        console.log('[SW] Skip waiting');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('[SW] Cache failed:', error);
      })
  );
});

// アクティベート時に古いキャッシュを削除
self.addEventListener('activate', event => {
  console.log('[SW] Activate event');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Claiming clients');
      return self.clients.claim();
    })
  );
});

// フェッチイベント: キャッシュファーストストラテジー
self.addEventListener('fetch', event => {
  // Chrome拡張機能のリクエストは無視
  if (event.request.url.startsWith('chrome-extension://')) {
    return;
  }
  
  // GETリクエストのみ処理
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // キャッシュにある場合はそれを返す
        if (response) {
          console.log('[SW] Serving from cache:', event.request.url);
          return response;
        }
        
        // キャッシュにない場合はネットワークから取得
        console.log('[SW] Fetching from network:', event.request.url);
        return fetch(event.request)
          .then(response => {
            // レスポンスが有効でない場合はそのまま返す
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // レスポンスをクローンしてキャッシュに保存
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                // 重要なリソースのみキャッシュ
                if (shouldCache(event.request.url)) {
                  cache.put(event.request, responseToCache);
                  console.log('[SW] Cached:', event.request.url);
                }
              });
            
            return response;
          })
          .catch(error => {
            console.error('[SW] Fetch failed:', error);
            
            // オフライン時のフォールバック
            if (event.request.destination === 'document') {
              return caches.match('./index.html');
            }
            
            // その他のリソースで失敗した場合
            throw error;
          });
      })
  );
});

// キャッシュすべきURLかどうかを判断
function shouldCache(url) {
  const urlObj = new URL(url);
  
  // 同一オリジンのリソース
  if (urlObj.origin === location.origin) {
    return true;
  }
  
  // 重要な外部リソース
  const importantDomains = [
    'unpkg.com',
    'www.googletagmanager.com'
  ];
  
  return importantDomains.some(domain => urlObj.hostname.includes(domain));
}

// メッセージハンドリング（将来の拡張用）
self.addEventListener('message', event => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// エラーハンドリング
self.addEventListener('error', event => {
  console.error('[SW] Error:', event.error);
});

self.addEventListener('unhandledrejection', event => {
  console.error('[SW] Unhandled rejection:', event.reason);
});

console.log('[SW] Service Worker loaded successfully');