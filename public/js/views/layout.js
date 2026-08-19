/**
 * LAYOUT — thanh điều hướng và khung trang dùng chung.
 */

import { el, go, initials } from '../core.js';
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

/** Khung 1 trang thường (có nav + footer) */
export function page(...content) {
  return el('div.screen', {}, [
    nav(),
    el('main.grow', { style: { paddingTop: '26px', paddingBottom: '10px' } }, content),
    footer(),
  ]);
}
