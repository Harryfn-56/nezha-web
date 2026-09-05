/**
 * LAYOUT — thanh điều hướng và khung trang dùng chung.
 */

import { el, go, initials, revealOnScroll } from '../core.js';
import { CONFIG } from '../config.js';
import { currentUser, logout, CLOUD } from '../store.js';

export function nav() {
  const u = currentUser();

  const right = el('div.row', { style: { marginLeft: 'auto' } });

  if (u) {
    if (u.role === 'teacher') {
      right.append(
        el('a.btn.btn-ghost.btn-sm', { href: '/quan-tri', 'data-link': '' }, '📊 Quản trị'),
        el('a.btn.btn-sm.btn-orange', { href: '/live', 'data-link': '' }, '⚡ Phòng Kahoot'),
      );
    } else {
      right.append(
        el('a.btn.btn-ghost.btn-sm', { href: '/hoc', 'data-link': '' }, '🎮 Trò chơi'),
        el('a.btn.btn-sm.btn-orange', { href: '/vao-phong', 'data-link': '' }, '⚡ Vào phòng'),
      );
    }
    right.append(
      el('div.who', {}, [
        el('div.av', {}, initials(u.name)),
        el('div', {}, [
          el('div.nm', {}, u.name),
          el('div.cl', {}, u.role === 'teacher' ? 'Giáo viên' : u.className || u.classCode),
        ]),
      ]),
      el('button.btn.btn-plain.btn-sm', {
        title: 'Đăng xuất',
        onclick: () => { logout(); go('/'); },
      }, '⏻'),
    );
  }

  return el('header.nav', {}, el('div.wrap.nav-in', {}, [
    el('a.brand', { href: u ? (u.role === 'teacher' ? '/quan-tri' : '/hoc') : '/', 'data-link': '' }, [
      el('img', { src: '/assets/logo.png', alt: CONFIG.siteName }),
      el('div', {}, [
        el('b', {}, 'NeZha'),
        el('span', {}, 'Chinese Center'),
      ]),
    ]),
    right,
  ]));
}

export function footer() {
  return el('footer.foot.wrap', {}, [
    el('img', { src: '/assets/logo-trong-suot.png', alt: '' }),
    el('div', {}, `${CONFIG.siteName} · ${CONFIG.siteTagline}`),
    el('div.tiny', { style: { marginTop: '4px' } },
      CLOUD ? '☁️ Có máy chủ Supabase — điểm được lưu tập trung'
            : '💾 Chế độ ngoại tuyến — điểm lưu trên máy này'),
  ]);
}

/**
 * TRANG TRÍ HAI BÊN LỀ (chỉ giao diện "neo", chỉ màn hình rộng)
 * ------------------------------------------------------------------
 * Màn hình rộng 1920px thì hai bên nội dung còn trống mấy trăm pixel.
 * Lớp này dán vào đó vài miếng sticker chữ Hán và mấy hình khối viền đen
 * cho đỡ trống, đúng tinh thần neo-brutalism.
 *
 * Lưu ý khi sửa:
 *   • Toàn bộ nằm sau nội dung (z-index -1) và không bắt chuột
 *     (pointer-events: none) nên không bao giờ che nút bấm.
 *   • Máy màn hẹp tự ẩn hết — xem phần CSS ".neo-deco" ở cuối style.css.
 *   • Muốn đổi chữ trên sticker thì sửa ngay mảng STICKERS bên dưới.
 */
const STICKERS = [
  // Ghi chú tiếng Việt chứ không ghi pinyin: dấu thanh pinyin (ǎ, ǐ, ǚ)
  // không phải font nào cũng có, thiếu là hiện sai chữ.
  { cls: 'st-1', hz: '你好', py: 'xin chào' },
  { cls: 'st-2', hz: '★',   py: 'giỏi lắm' },
  { cls: 'st-3', hz: '加油', py: 'cố lên' },
  { cls: 'st-4', hz: '学',   py: 'học' },
  { cls: 'st-5', logo: true, py: 'NeZha' },
  { cls: 'st-6', hz: '谢谢', py: 'cảm ơn' },
];

export function deco() {
  return el('div.neo-deco', { 'aria-hidden': 'true' }, [
    el('div.nz-ring.ring-1'),
    el('div.nz-ring.ring-2'),
    el('div.nz-sq.sq-1'),
    el('div.nz-sq.sq-2'),
    ...STICKERS.map((s) => el('div.nz-st.' + s.cls, {}, [
      s.logo
        ? el('img', { src: '/assets/logo.png', alt: '', width: 46, height: 46 })
        : el('b', {}, s.hz),
      el('i', {}, s.py),
    ])),
  ]);
}

/** Khung 1 trang thường (có nav + footer) */
export function page(...content) {
  const neo = document.body.dataset.skin === 'neo';
  const node = el('div.screen', {}, [
    neo ? deco() : null,
    nav(),
    el('main.grow', { style: { paddingTop: '26px', paddingBottom: '10px' } }, content),
    footer(),
  ]);
  // Chờ trang gắn vào DOM rồi mới bật hiệu ứng hiện dần
  setTimeout(() => revealOnScroll(node), 30);
  return node;
}
