/**
 * GAME 1 — THẺ LẬT GHI NHỚ (闪卡)
 * Mặt trước: Hán tự. Lật ra sau: pinyin + nghĩa tiếng Việt + nút nghe.
 * Học sinh tự đánh giá "Đã thuộc" / "Chưa thuộc"; từ chưa thuộc sẽ quay lại.
 */

import { el, shuffle, speak, sfx, toast } from '../core.js';
import { Shell } from './shell.js';

export function play(game, lesson, container) {
  const deck = shuffle(lesson.words);
  const shell = new Shell({ game, lesson, total: deck.length });
  shell.attach(container);

  let queue = deck.slice();
  let done = 0;
  let flipped = false;
  let current = null;

  function next() {
    if (!queue.length) return shell.finish();
    current = queue.shift();
    flipped = false;
    shell.progress(done, deck.length);
    draw();
  }

  function draw() {
    const card = el('div.fc' + (flipped ? '.flipped' : ''), {
      onclick: () => { flipped = !flipped; sfx.flip(); draw(); if (flipped) speak(current.hz); },
    }, [
      // Mặt trước
      el('div.fc-face.fc-front', {}, [
        el('div.chip.chip-soft', {}, current.tag || 'Từ vựng'),
        el('div.hz', { style: { fontSize: 'clamp(4rem, 17vw, 8rem)', lineHeight: '1.1' } }, current.hz),
        el('div.fc-tip', {}, '👆 Chạm vào thẻ để xem nghĩa'),
      ]),
      // Mặt sau
      el('div.fc-face.fc-back', {}, [
        el('div.hz', { style: { fontSize: 'clamp(2.4rem, 9vw, 3.6rem)' } }, current.hz),
        el('div.py', { style: { fontSize: '1.5rem' } }, current.py),
        el('div', { style: { fontSize: '1.35rem', fontWeight: '700' } }, current.vi),
        el('div.fc-tip', {}, 'Chạm để lật lại'),
      ]),
    ]);

    shell.setStage([
      el('div.wrap-sm', { style: { padding: 0 } }, [
        el('div.fc-wrap', {}, card),

        el('div.row', { style: { justifyContent: 'center', marginBottom: '18px' } }, [
          el('button.btn.btn-ghost', {
            onclick: (e) => { e.stopPropagation(); speak(current.hz); },
          }, '🔊 Nghe phát âm'),
          el('button.btn.btn-ghost', {
            onclick: (e) => { e.stopPropagation(); speak(current.hz, { rate: 0.5 }); },
          }, '🐢 Nghe chậm'),
        ]),

        el('div.opts', {}, [
          el('button.btn.btn-ghost.btn-lg', {
            onclick: () => {
              // Chưa thuộc: đẩy về cuối hàng đợi để gặp lại
              shell.mark(false, 100, current);
              queue.push(current);
              toast('Sẽ gặp lại từ này ở cuối nhé!', '');
              next();
            },
          }, '🤔 Chưa thuộc'),
          el('button.btn.btn-green.btn-lg', {
            onclick: () => {
              shell.mark(true, 100, current);
              done++;
              next();
            },
          }, '✅ Đã thuộc'),
        ]),

        el('p.hint.tcenter', { style: { marginTop: '14px' } },
          `Còn ${queue.length} thẻ trong bộ · Bấm "Chưa thuộc" để ôn lại từ đó lần nữa`),
      ]),
    ]);
  }

  next();
}
