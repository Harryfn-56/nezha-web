/**
 * BẢN APP TRÊN ĐIỆN THOẠI (PWA)
 * ======================================================================
 * Website này cài được vào điện thoại như một cái app thật: có icon NeZha
 * ngoài màn hình chính, mở ra là toàn màn hình (không thấy thanh địa chỉ),
 * và vào được cả khi mất mạng.
 *
 * KHÔNG cần lên App Store hay Google Play, không mất phí, không phải cài
 * đặt gì thêm — chỉ cần website chạy trên https (Cloudflare đã có sẵn).
 *
 * File này lo 3 việc:
 *   1. Bật service worker (sw.js) — phần chạy ngầm giúp app mở offline
 *   2. Hiện thanh mời cài app đúng lúc, và nhớ nếu học sinh bấm "Để sau"
 *   3. Máy iPhone không cho cài tự động → hiện hướng dẫn 2 bước bằng hình
 *
 * Chỉ hiện lời mời ở trang chính và trang đăng nhập, không chen vào lúc
 * đang chơi.
 */

import { el, toast } from './core.js';

const HIDE_KEY = 'nz_pwa_hide';       // học sinh đã bấm "Để sau"
const SHOW_ON = ['/', '/hoc'];        // chỉ mời cài ở 2 trang này

let deferred = null;                  // lời mời cài của trình duyệt
let banner = null;

/** Đang chạy dưới dạng app đã cài (không phải trong trình duyệt)? */
export function isInstalled() {
  return window.matchMedia('(display-mode: standalone)').matches
    || window.navigator.standalone === true;
}

const isIOS = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent)
  || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

/* ==================================================================== */
/*  1. Bật service worker                                               */
/* ==================================================================== */

export function start() {
  if (!('serviceWorker' in navigator)) return;
  // Chạy bằng file:// hoặc http thường thì trình duyệt không cho — bỏ qua
  if (location.protocol !== 'https:' && location.hostname !== 'localhost') return;

  // Đang chạy `npm run dev` (chưa build) thì KHÔNG bật service worker —
  // nếu bật, mọi sửa đổi trong file js sẽ bị bộ đệm che mất, sửa mãi
  // không thấy đổi gì.
  const meta = document.querySelector('meta[name="nz-build"]');
  const build = meta ? meta.content : '';
  if (!build || build.startsWith('__')) return;

  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');

      // Có bản mới đang chờ → mời tải lại, KHÔNG tự tải lại giữa lúc chơi
      reg.addEventListener('updatefound', () => {
        const sw = reg.installing;
        if (!sw) return;
        sw.addEventListener('statechange', () => {
          if (sw.state === 'installed' && navigator.serviceWorker.controller) {
            offerUpdate(sw);
          }
        });
      });
    } catch (e) {
      console.warn('Không bật được service worker:', e.message);
    }
  });

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (window.__nzUpdating) location.reload();
  });
}

function offerUpdate(sw) {
  const box = el('div.pwa-bar.pwa-update', {}, [
    el('div.grow', {}, [
      el('div.bold', {}, '🎉 Đã có bản mới'),
      el('div.small', {}, 'Bấm cập nhật để dùng bản mới nhất.'),
    ]),
    el('button.btn.btn-sm', {
      onclick: () => {
        window.__nzUpdating = true;
        sw.postMessage('SKIP_WAITING');
        box.remove();
      },
    }, 'Cập nhật'),
    el('button.btn.btn-ghost.btn-sm', { onclick: () => box.remove() }, 'Để sau'),
  ]);
  document.body.append(box);
}

/* ==================================================================== */
/*  2. Thanh mời cài app                                                */
/* ==================================================================== */

export function initInstall() {
  // Trình duyệt Android/Chrome báo "trang này cài được" qua sự kiện này.
  // Giữ lại để lát nữa học sinh bấm nút thì mới bật hộp thoại cài.
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e;
    maybeShow();
  });

  window.addEventListener('appinstalled', () => {
    deferred = null;
    if (banner) { banner.remove(); banner = null; }
    toast('🎉 Đã cài NeZha Game vào máy!', 'ok');
  });

  // Chờ vài giây cho học sinh xem trang trước rồi mới mời, đỡ làm phiền
  setTimeout(maybeShow, 4000);
  window.addEventListener('popstate', () => setTimeout(maybeShow, 600));
}

function canShow() {
  if (isInstalled()) return false;
  if (banner) return false;
  try { if (localStorage.getItem(HIDE_KEY) === '1') return false; } catch { /* bỏ qua */ }
  const path = location.pathname.replace(/\/+$/, '') || '/';
  if (!SHOW_ON.includes(path)) return false;
  // Android: phải có lời mời của trình duyệt. iPhone: luôn hiện hướng dẫn.
  return Boolean(deferred) || isIOS();
}

function maybeShow() {
  if (!canShow()) return;

  const later = () => {
    try { localStorage.setItem(HIDE_KEY, '1'); } catch { /* bỏ qua */ }
    if (banner) { banner.remove(); banner = null; }
  };

  banner = el('div.pwa-bar', {}, [
    el('img.pwa-ic', { src: '/assets/icon-192.png', alt: '', width: 44, height: 44 }),
    el('div.grow', {}, [
      el('div.bold', {}, '📲 Cài NeZha Game vào máy'),
      el('div.small', {}, isIOS()
        ? 'Có icon ngoài màn hình chính, mở toàn màn hình, chơi được cả khi mất mạng.'
        : 'Mở nhanh hơn, toàn màn hình, chơi được cả khi mất mạng.'),
    ]),
    el('button.btn.btn-sm', { onclick: () => (isIOS() ? iosGuide() : install()) }, 'Cài đặt'),
    el('button.btn.btn-ghost.btn-sm', { onclick: later }, 'Để sau'),
  ]);
  document.body.append(banner);
}

async function install() {
  if (!deferred) return iosGuide();
  const e = deferred;
  deferred = null;
  if (banner) { banner.remove(); banner = null; }
  try {
    e.prompt();
    const { outcome } = await e.userChoice;
    if (outcome !== 'accepted') {
      try { localStorage.setItem(HIDE_KEY, '1'); } catch { /* bỏ qua */ }
    }
  } catch { /* bỏ qua */ }
}

/** iPhone/iPad không có nút cài tự động — phải chỉ học sinh làm tay */
function iosGuide() {
  if (banner) { banner.remove(); banner = null; }
  const box = el('div.pwa-guide', {}, [
    el('div.pwa-card', {}, [
      el('img', { src: '/assets/icon-192.png', alt: '', width: 64, height: 64 }),
      el('h3', {}, 'Cài NeZha Game trên iPhone'),
      el('ol', {}, [
        el('li', {}, ['Bấm nút ', el('b', {}, 'Chia sẻ'), ' ⬆️ ở thanh dưới màn hình Safari']),
        el('li', {}, ['Kéo xuống chọn ', el('b', {}, 'Thêm vào MH chính'), ' ➕']),
        el('li', {}, ['Bấm ', el('b', {}, 'Thêm'), ' ở góc trên bên phải — xong!']),
      ]),
      el('p.small.muted', {}, 'Nhớ mở bằng Safari nhé — Chrome trên iPhone chưa cài được.'),
      el('button.btn.btn-block', {
        onclick: () => {
          try { localStorage.setItem(HIDE_KEY, '1'); } catch { /* bỏ qua */ }
          box.remove();
        },
      }, 'Em hiểu rồi'),
    ]),
  ]);
  box.onclick = (ev) => { if (ev.target === box) box.remove(); };
  document.body.append(box);
}

/* Cho phép gọi lại lời mời từ nơi khác (nút "Cài app" trong trang chính) */
export function askInstall() {
  try { localStorage.removeItem(HIDE_KEY); } catch { /* bỏ qua */ }
  if (isInstalled()) return toast('Máy này đã cài app rồi 👍');
  if (deferred) return install();
  return iosGuide();
}
