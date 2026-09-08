/**
 * SERVICE WORKER — phần "app" của website
 * ======================================================================
 * Nhờ file này mà học sinh bấm "Thêm vào màn hình chính" là có một cái
 * app NeZha thật sự: mở toàn màn hình (không thấy thanh địa chỉ trình
 * duyệt), có icon riêng, và vào được cả khi MẤT MẠNG.
 *
 * Ba nguyên tắc quan trọng (đừng sửa nếu chưa hiểu rõ):
 *
 * 1. TRANG HTML luôn ưu tiên lấy từ mạng trước.
 *    Nếu để lấy từ bộ nhớ đệm trước, máy học sinh sẽ giữ mãi bản cũ sau
 *    khi thầy/cô cập nhật website — đúng lỗi đã từng gặp.
 *
 * 2. FILE JS/CSS/ẢNH lấy từ bộ nhớ đệm trước cho nhanh.
 *    An toàn vì mỗi lần build, tên file đều kèm ?v=<mã bản> khác nhau,
 *    nên bản mới luôn là một đường dẫn mới, không đụng bản cũ.
 *
 * 3. GỌI SUPABASE (điểm số, phòng Kahoot) KHÔNG BAO GIỜ được lưu đệm.
 *    Phòng Kahoot phải là dữ liệu thật ngay lúc đó, lưu đệm là hỏng.
 *
 * Mỗi lần `npm run build`, mã bản bên dưới đổi → trình duyệt tự nhận ra
 * service worker mới, tải lại toàn bộ và xoá bộ đệm cũ.
 */

const VERSION = '__BUILD_VERSION__';
const CACHE = 'nezha-' + VERSION;
const PRECACHE = "__PRECACHE__";
// Chưa build thì PRECACHE còn là chuỗi placeholder → coi như danh sách rỗng
const LIST = Array.isArray(PRECACHE) ? PRECACHE : [];

/* ------------------------------------------------------------ cài đặt */
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      // Tải từng file một, thiếu file nào cũng không làm hỏng cả bản cài
      .then((c) => Promise.all(LIST.map((u) => c.add(u).catch(() => null))))
  );
});

/* ------------------------------------- kích hoạt: dọn bộ đệm bản cũ */
self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(
      names.filter((n) => n.startsWith('nezha-') && n !== CACHE)
        .map((n) => caches.delete(n))
    );
    await self.clients.claim();
  })());
});

/* --- Thầy/cô bấm "Cập nhật ngay" trên thanh thông báo thì chạy vào đây */
self.addEventListener('message', (e) => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});

/* ------------------------------------------------------------ lấy file */
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Khác tên miền (Supabase, Google Fonts, CDN nét chữ) → để trình duyệt
  // tự lo, tuyệt đối không lưu đệm.
  if (url.origin !== self.location.origin) return;

  // Mở một trang (gõ địa chỉ, bấm link, mở app) → thử mạng trước
  if (req.mode === 'navigate') {
    e.respondWith(networkFirstPage(req));
    return;
  }

  e.respondWith(cacheFirst(req));
});

/** Trang HTML: mạng trước, mất mạng thì lấy bản đã lưu */
async function networkFirstPage(req) {
  try {
    const res = await fetch(req);
    if (res && res.ok) {
      const c = await caches.open(CACHE);
      c.put('/index.html', res.clone());
    }
    return res;
  } catch {
    const cached = await caches.match('/index.html');
    return cached || new Response(
      '<meta charset="utf-8"><h1>Chưa có mạng</h1>' +
      '<p>Em mở lại khi có mạng nhé!</p>',
      { headers: { 'Content-Type': 'text/html; charset=utf-8' }, status: 503 }
    );
  }
}

/** JS/CSS/ảnh: lấy bản đã lưu trước cho nhanh, chưa có thì tải rồi lưu lại */
async function cacheFirst(req) {
  // ignoreSearch: đường dẫn có kèm ?v=<mã bản> nhưng file lưu đệm thì không
  const hit = await caches.match(req, { ignoreSearch: true });
  if (hit) return hit;

  try {
    const res = await fetch(req);
    if (res && res.ok && res.type === 'basic') {
      const c = await caches.open(CACHE);
      c.put(req, res.clone());
    }
    return res;
  } catch {
    return new Response('', { status: 504 });
  }
}
