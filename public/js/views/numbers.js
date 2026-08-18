/**
 * BẢNG SỐ 1–99 — bảng tra cứu cho học sinh (không tính điểm).
 * Bấm vào ô nào thì máy đọc to số đó bằng tiếng Trung.
 */

import { el, mount, go, speak } from '../core.js';
import { numToHanzi, DIGITS_PY } from '../data.js';
import { currentUser } from '../store.js';
import { page } from './layout.js';

/** Pinyin của số 1–99: 25 → èr shí wǔ */
function numToPinyin(n) {
  if (n < 10) return DIGITS_PY[n];
  if (n === 10) return 'shí';
  if (n < 20) return 'shí ' + DIGITS_PY[n - 10];
  const t = Math.floor(n / 10);
  const o = n % 10;
  return DIGITS_PY[t] + ' shí' + (o ? ' ' + DIGITS_PY[o] : '');
}

export function view() {
  const u = currentUser();
  if (!u) return go('/', true);

  const cells = [];
  for (let n = 1; n <= 99; n++) {
    const hz = numToHanzi(n);
    cells.push(el('button.num-cell', {
      onclick: () => speak(hz),
      title: 'Bấm để nghe đọc',
    }, [
      el('div.n', {}, String(n)),
      el('div.hz', {}, hz),
      el('div.py', {}, numToPinyin(n)),
    ]));
  }

  mount(page(el('div.wrap.stack', { style: { '--gap': '18px' } }, [
    el('div.row-between.wrapf', {}, [
      el('div', {}, [
        el('h1', { style: { marginBottom: '2px' } }, '🔢 Bảng số 1 – 99'),
        el('p.muted.mb-0', {}, 'Bấm vào một ô bất kỳ để nghe đọc. Quy tắc: 11 = 十一 (mười một), 20 = 二十 (hai mươi), 25 = 二十五 (hai mươi lăm).'),
      ]),
      el('a.btn.btn-ghost', { href: '/hoc', 'data-link': '' }, '← Về trang chính'),
    ]),

    el('div.alert.alert-info', {},
      'Mẹo nhớ: từ 11–19 chỉ cần thêm 十 phía trước; từ 20 trở đi đọc "mấy 十 mấy".'),

    el('div.num-grid', {}, cells),
  ])));
  window.scrollTo(0, 0);
}
