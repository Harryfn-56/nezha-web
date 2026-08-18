/**
 * GAME 1 — THẺ LẬT GHI NHỚ (闪卡)
 *
 * Bước 1: học sinh chọn CHỦ ĐỀ muốn ôn (Chào hỏi, Số đếm, Tháng...) để mỗi
 *         lượt chỉ học một nhóm nhỏ, không phải lật hết cả bài.
 * Bước 2: lật thẻ — mặt trước Hán tự, mặt sau pinyin + nghĩa + nút nghe.
 *         Từ bấm "Chưa thuộc" sẽ quay lại cuối bộ thẻ.
 *
 * Chủ đề lấy từ cột "Nhóm" (thuộc tính tag) của từng từ trong data.js.
 * Bài nào chưa chia nhóm thì tự cắt thành từng phần 10 từ.
 */

import { el, shuffle, speak, sfx, toast, go } from '../core.js';
import { CONFIG } from '../config.js';
import { Shell } from './shell.js';

const COLORS = ['red', 'orange', 'amber', 'green', 'blue', 'purple', 'teal', 'crimson'];

/**
 * Chia từ vựng của bài thành các nhóm chủ đề.
 * @returns {Array<{key, name, words}>}
 */
function buildGroups(lesson) {
  const words = lesson.words || [];
  const byTag = new Map();

  for (const w of words) {
    const tag = (w.tag || '').trim();
    if (!tag) continue;
    if (!byTag.has(tag)) byTag.set(tag, []);
    byTag.get(tag).push(w);
  }

  // Có ít nhất 2 chủ đề và (gần như) mọi từ đều được gắn nhóm → chia theo chủ đề
  const tagged = Array.from(byTag.values()).reduce((s, a) => s + a.length, 0);
  if (byTag.size >= 2 && tagged >= words.length * 0.6) {
    const groups = Array.from(byTag.entries()).map(([name, ws]) => ({
      key: name, name, words: ws,
    }));
    // Những từ chưa gắn nhóm gom vào "Từ khác"
    const rest = words.filter((w) => !(w.tag || '').trim());
    if (rest.length) groups.push({ key: '_rest', name: 'Từ khác', words: rest });
    return groups;
  }

  // Chưa chia nhóm → cắt thành từng phần cho dễ học
  const size = Math.max(5, CONFIG.game.flashcardChunk || 10);
  if (words.length <= size) return [];
  const groups = [];
  for (let i = 0; i < words.length; i += size) {
    const part = words.slice(i, i + size);
    groups.push({
      key: 'p' + (i / size + 1),
      name: `Phần ${groups.length + 1} (từ ${i + 1}–${i + part.length})`,
      words: part,
    });
  }
  return groups;
}

export function play(game, lesson, container) {
  const groups = buildGroups(lesson);

  // Bài ít từ hoặc không chia được nhóm → vào chơi luôn cả bộ
  if (!groups.length) return start(lesson.words, '');

  showPicker();

  /* ---------------------------------------------------- màn chọn chủ đề */
  function showPicker() {
    const total = lesson.words.length;

    container.replaceChildren(el('div.screen', {}, [
      el('div.g-top', {}, el('div.wrap', {}, el('div.g-top-in', {}, [
        el('button.btn.btn-ghost.btn-sm', { onclick: () => go('/hoc') }, '← Thoát'),
        el('div.grow'),
        el('span.pill', {}, `${game.icon} ${game.name}`),
      ]))),

      el('div.wrap.stage', {}, el('div.stack', { style: { '--gap': '18px' } }, [
        el('div.tcenter', {}, [
          el('h1', { style: { marginBottom: '4px' } }, 'Em muốn ôn chủ đề nào?'),
          el('p.muted', {}, `Bài "${lesson.title}" có ${total} từ — chọn một chủ đề để học từng phần nhỏ cho dễ nhớ.`),
        ]),

        el('div.game-grid', {}, [
          ...groups.map((g, i) => el('button.game-card.c-' + COLORS[i % COLORS.length], {
            onclick: () => start(g.words, g.name),
          }, [
            el('div.ic', {}, '🗂️'),
            el('h3', {}, g.name),
            el('p', {}, g.words.slice(0, 4).map((w) => w.hz).join(' · ')),
            el('div.meta', {}, el('span.chip.chip-soft', {}, `${g.words.length} từ`)),
          ])),

          el('button.game-card.c-crimson', {
            onclick: () => start(lesson.words, 'Tất cả chủ đề'),
          }, [
            el('div.ic', {}, '🎴'),
            el('h3', {}, 'Tất cả'),
            el('p', {}, 'Lật hết toàn bộ từ trong bài — dành cho lúc ôn tổng kết.'),
            el('div.meta', {}, el('span.chip', {}, `${total} từ`)),
          ]),
        ]),
      ])),
    ]));
    window.scrollTo(0, 0);
  }

  /* ------------------------------------------------------- chơi bộ thẻ */
  function start(words, groupName) {
    const deck = shuffle(words);
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
          el('div.chip.chip-soft', {}, current.tag || groupName || 'Từ vựng'),
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
          groupName ? el('div.tcenter', { style: { marginBottom: '10px' } },
            el('span.chip', {}, `🗂️ ${groupName}`)) : null,

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
}
