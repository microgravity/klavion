// Klavion PWA Service Worker
const CACHE_NAME = 'klavion-v1.1.0';
const CACHE_URLS = [
  './',
  './index.html',
  './app.js',
  './scss/styles.min.css',
  './src/img/ogp.png',
  './src/img/scr.jpg',
  './manifest.json',
  // External CDN resources
  'https://unpkg.com/three@0.149.0/build/three.min.js',
  'https://www.googletagmanager.com/gtag/js?id=G-MNPNCFFTL1'
];

// インストール時にリソースをキャッシュ
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(CACHE_URLS);
      })
      .then(() => {
        return self.skipWaiting();
      })
      .catch(error => {
      })
  );
});

// アクティベート時に古いキャッシュを削除
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
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
          return response;
        }
        
        // キャッシュにない場合はネットワークから取得
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
                }
              });
            
            return response;
          })
          .catch(error => {
            
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
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// エラーハンドリング
self.addEventListener('error', event => {
});

self.addEventListener('unhandledrejection', event => {
});

