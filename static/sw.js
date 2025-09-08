// LottoPro AI v2.0 Service Worker
// PWA 오프라인 지원 및 캐싱 전략

const CACHE_NAME = 'lottopro-ai-v2-0-1';
const API_CACHE_NAME = 'lottopro-api-v2-0-1';

// 캐싱할 정적 리소스들
const STATIC_RESOURCES = [
  '/',
  '/static/css/style.css',
  '/static/js/app.js',
  '/static/manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/css/bootstrap.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/js/bootstrap.bundle.min.js'
];

// API 엔드포인트들 (캐싱 전략 적용)
const API_ENDPOINTS = [
  '/api/health',
  '/api/stats',
  '/api/example-numbers'
];

// 설치 이벤트 - 정적 리소스 캐싱
self.addEventListener('install', event => {
  console.log('[SW] 서비스 워커 설치 중...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] 정적 리소스 캐싱 시작');
        return cache.addAll(STATIC_RESOURCES);
      })
      .then(() => {
        console.log('[SW] 정적 리소스 캐싱 완료');
        // 즉시 활성화
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('[SW] 설치 중 오류:', error);
      })
  );
});

// 활성화 이벤트 - 이전 캐시 정리
self.addEventListener('activate', event => {
  console.log('[SW] 서비스 워커 활성화 중...');
  
  event.waitUntil(
    Promise.all([
      // 이전 버전 캐시 삭제
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
              console.log('[SW] 이전 캐시 삭제:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // 모든 클라이언트에 즉시 적용
      self.clients.claim()
    ])
  );
});

// 네트워크 요청 인터셉트
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // 동일 출처 요청만 처리
  if (url.origin !== location.origin) {
    // CDN 리소스 처리
    if (url.hostname === 'cdnjs.cloudflare.com') {
      event.respondWith(handleCDNRequest(request));
    }
    return;
  }
  
  // API 요청 처리
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleAPIRequest(request));
    return;
  }
  
  // 정적 파일 요청 처리
  event.respondWith(handleStaticRequest(request));
});

// CDN 리소스 처리 (Cache First 전략)
async function handleCDNRequest(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    
    // 성공적인 응답만 캐싱
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[SW] CDN 요청 실패:', error);
    throw error;
  }
}

// API 요청 처리 (Network First with Cache Fallback)
async function handleAPIRequest(request) {
  const url = new URL(request.url);
  
  try {
    // 네트워크 우선 시도
    const networkResponse = await fetch(request.clone());
    
    if (networkResponse.ok) {
      // 특정 API만 캐싱 (GET 요청)
      if (request.method === 'GET' && shouldCacheAPI(url.pathname)) {
        const cache = await caches.open(API_CACHE_NAME);
        
        // 짧은 시간 캐싱 (5분)
        const responseToCache = networkResponse.clone();
        const headers = new Headers(responseToCache.headers);
        headers.set('sw-cached-at', new Date().toISOString());
        
        const cachedResponse = new Response(responseToCache.body, {
          status: responseToCache.status,
          statusText: responseToCache.statusText,
          headers: headers
        });
        
        cache.put(request, cachedResponse);
      }
      
      return networkResponse;
    }
    
    throw new Error(`API 응답 오류: ${networkResponse.status}`);
    
  } catch (error) {
    console.log('[SW] 네트워크 실패, 캐시에서 조회:', url.pathname);
    
    // 캐시된 응답 확인
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      // 캐시 시간 확인 (5분 제한)
      const cachedAt = cachedResponse.headers.get('sw-cached-at');
      if (cachedAt) {
        const cacheAge = Date.now() - new Date(cachedAt).getTime();
        if (cacheAge < 5 * 60 * 1000) { // 5분
          console.log('[SW] 캐시된 API 응답 반환');
          return cachedResponse;
        }
      }
    }
    
    // API 요청 실패 시 기본 응답
    return new Response(
      JSON.stringify({
        success: false,
        error: '네트워크 연결이 없습니다. 오프라인 모드입니다.',
        offline: true,
        cached_at: new Date().toISOString()
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
}

// 정적 파일 처리 (Cache First 전략)
async function handleStaticRequest(request) {
  try {
    // 캐시에서 먼저 확인
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // 네트워크에서 가져오기
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // 캐시에 저장
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
    
  } catch (error) {
    console.error('[SW] 정적 파일 요청 실패:', error);
    
    // 메인 페이지 요청 시 오프라인 페이지 반환
    const url = new URL(request.url);
    if (url.pathname === '/' || request.headers.get('accept')?.includes('text/html')) {
      return getOfflinePage();
    }
    
    throw error;
  }
}

// API 캐싱 여부 결정
function shouldCacheAPI(pathname) {
  const cacheableAPIs = ['/api/health', '/api/stats', '/api/example-numbers'];
  return cacheableAPIs.includes(pathname);
}

// 오프라인 페이지 생성
function getOfflinePage() {
  const offlineHTML = `
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>LottoPro AI v2.0 - 오프라인</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: linear-gradient(135deg, #667eea, #764ba2);
                color: white;
                margin: 0;
                padding: 0;
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                text-align: center;
            }
            .container {
                max-width: 500px;
                padding: 2rem;
            }
            .icon {
                font-size: 4rem;
                margin-bottom: 1rem;
            }
            .title {
                font-size: 2rem;
                font-weight: bold;
                margin-bottom: 1rem;
            }
            .description {
                font-size: 1.1rem;
                opacity: 0.9;
                margin-bottom: 2rem;
                line-height: 1.6;
            }
            .btn {
                background: rgba(255, 255, 255, 0.2);
                border: 2px solid rgba(255, 255, 255, 0.3);
                color: white;
                padding: 1rem 2rem;
                border-radius: 50px;
                font-size: 1rem;
                cursor: pointer;
                transition: all 0.3s ease;
                text-decoration: none;
                display: inline-block;
                margin: 0.5rem;
            }
            .btn:hover {
                background: rgba(255, 255, 255, 0.3);
                transform: translateY(-2px);
            }
            .features {
                background: rgba(255, 255, 255, 0.1);
                border-radius: 15px;
                padding: 1.5rem;
                margin-top: 2rem;
                backdrop-filter: blur(10px);
            }
            .feature-item {
                margin-bottom: 0.8rem;
                font-size: 0.95rem;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="icon">📱</div>
            <h1 class="title">LottoPro AI v2.0</h1>
            <p class="description">
                현재 오프라인 상태입니다.<br>
                인터넷 연결을 확인하고 다시 시도해주세요.
            </p>
            
            <button class="btn" onclick="window.location.reload()">
                🔄 다시 시도
            </button>
            
            <a href="/" class="btn">
                🏠 홈으로
            </a>
            
            <div class="features">
                <h3>오프라인에서도 이용 가능한 기능:</h3>
                <div class="feature-item">✅ 앱 재시작 및 네비게이션</div>
                <div class="feature-item">✅ 기본 UI 및 레이아웃</div>
                <div class="feature-item">✅ 로컬 저장된 데이터 조회</div>
                <div class="feature-item">⏳ AI 예측은 온라인 연결 시 가능</div>
            </div>
        </div>
        
        <script>
            // 온라인 상태 감지
            window.addEventListener('online', function() {
                window.location.reload();
            });
            
            // 페이지 가시성 변경 시 재시도
            document.addEventListener('visibilitychange', function() {
                if (!document.hidden && navigator.onLine) {
                    setTimeout(() => {
                        window.location.reload();
                    }, 1000);
                }
            });
        </script>
    </body>
    </html>
  `;
  
  return new Response(offlineHTML, {
    headers: {
      'Content-Type': 'text/html',
      'Cache-Control': 'no-cache'
    }
  });
}

// 백그라운드 동기화 (선택적)
self.addEventListener('sync', event => {
  console.log('[SW] 백그라운드 동기화:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

// 백그라운드 동기화 실행
async function doBackgroundSync() {
  try {
    // 서버 상태 확인
    const response = await fetch('/api/health');
    if (response.ok) {
      console.log('[SW] 백그라운드 동기화 성공');
    }
  } catch (error) {
    console.log('[SW] 백그라운드 동기화 실패:', error);
  }
}

// 푸시 알림 (미래 확장용)
self.addEventListener('push', event => {
  if (!event.data) return;
  
  const data = event.data.json();
  const options = {
    body: data.body || 'LottoPro AI에서 새로운 소식이 있습니다.',
    icon: '/static/icons/icon-192x192.png',
    badge: '/static/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: data.primaryKey || 1
    },
    actions: [
      {
        action: 'explore',
        title: '확인하기',
        icon: '/static/icons/checkmark.png'
      },
      {
        action: 'close',
        title: '닫기',
        icon: '/static/icons/xmark.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'LottoPro AI', options)
  );
});

// 알림 클릭 처리
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// 메시지 처리 (앱과 통신)
self.addEventListener('message', event => {
  console.log('[SW] 메시지 수신:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({
      version: CACHE_NAME,
      type: 'VERSION_INFO'
    });
  }
});

console.log('[SW] LottoPro AI v2.0 Service Worker 로드 완료');
