/**
 * GAME 6 — SẮP XẾP CÂU (排句子)
 * Các chữ trong câu bị xáo trộn, học sinh bấm theo thứ tự để tạo câu đúng.
 * Rèn trật tự từ — phần học sinh Việt Nam hay nhầm nhất.
 */

import { el, shuffle, sample, speak, sleep, sfx, toast } from '../core.js';
import { Shell } from './shell.js';

/** Tách câu thành các "thẻ chữ": ưu tiên tách theo từ có trong bài học */
function tokenize(sentence, words) {
  const vocab = words
    .map((w) => w.hz)
    .filter((h) => h.length > 1)
    .sort((a, b) => b.length - a.length);

  const text = sentence.replace(/[？。！，]/g, '');
  const tokens = [];
  let i = 0;
  while (i < text.length) {
    const hit = vocab.find((v) => text.startsWith(v, i));
    if (hit) { tokens.push(hit); i += hit.length; }
    else { tokens.push(text[i]); i++; }
  }
  return tokens;
}

export function play(game, lesson, container) {
  const pool = (lesson.sentences && lesson.sentences.length)
    ? lesson.sentences
    : lesson.words.map((w) => ({ hz: w.hz, py: w.py, vi: w.vi }));

  const picked = sample(pool, Math.min(8, pool.length));
  const shell = new Shell({ game, lesson, total: picked.length });
  shell.attach(container);

  let i = 0;

  function next() {
    if (i >= picked.length) return shell.finish();
    const s = picked[i];
    const answer = tokenize(s.hz, lesson.words);

    // Câu chỉ có 1 thẻ thì bỏ qua (không có gì để sắp xếp)
    if (answer.length < 2) { i++; return next(); }

    const scrambled = shuffle(answer.map((t, k) => ({ t, k })));
    let placed = [];
    let done = false;
    shell.progress(i, picked.length);

    const slot = el('div.slot');
    const bank = el('div.tokens');
    const feedback = el('div', { style: { minHeight: '46px', marginTop: '14px' } });

    function redraw() {
      slot.replaceChildren(
        ...(placed.length
          ? placed.map((p, pos) => el('button.token.placed', {
              onclick: () => { if (done) return; placed.splice(pos, 1); redraw(); sfx.flip(); },
            }, p.t))
          : [el('span.hint', { style: { margin: 'auto' } }, 'Bấm các chữ bên dưới để xếp thành câu →')])
      );
      bank.replaceChildren(
        ...scrambled.map((p) => el('button.token' + (placed.includes(p) ? '.used' : ''), {
          onclick: () => {
            if (done || placed.includes(p)) return;
            placed.push(p);
            sfx.flip();
            redraw();
            if (placed.length === answer.length) check();
          },
        }, p.t))
      );
      checkBtn.disabled = placed.length !== answer.length;
    }

    async function check() {
      if (done) return;
      const built = placed.map((p) => p.t).join('');
      const ok = built === answer.join('');
      done = true;
      shell.mark(ok, 140, { hz: s.hz, py: s.py, vi: s.vi });
      speak(s.hz);

      feedback.replaceChildren(
        el('div.alert' + (ok ? '.alert-ok' : ''), {}, [
          ok ? '🎉 Chính xác! ' : '❌ Chưa đúng. ',
          el('div', { style: { marginTop: '6px' } }, [
            el('span.hz', { style: { fontSize: '1.35rem' } }, s.hz),
            el('span.py', { style: { marginLeft: '10px' } }, s.py),
          ]),
          el('div.small', {}, s.vi),
        ])
      );

      checkBtn.textContent = 'Câu tiếp theo →';
      checkBtn.disabled = false;
      checkBtn.onclick = () => { i++; next(); };
    }

    const checkBtn = el('button.btn.btn-lg.btn-block', { onclick: check }, 'Kiểm tra câu');

    shell.setStage([
      el('div.wrap-sm', { style: { padding: 0 } }, [
        el('div.qbox', { style: { padding: '22px' } }, [
          el('div.lbl', {}, 'Sắp xếp thành câu tiếng Trung đúng'),
          el('div.q-vi', {}, `“${s.vi}”`),
        ]),
        slot,
        bank,
        feedback,
        checkBtn,
        el('p.hint.tcenter', {}, 'Bấm vào chữ đã xếp để lấy ra nếu muốn sửa'),
      ]),
    ]);

    redraw();
  }

  next();
}
