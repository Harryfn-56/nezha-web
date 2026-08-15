/**
 * GAME 4 — GÕ PINYIN (拼音输入)
 * Nhìn Hán tự, gõ pinyin. Chấp nhận gõ không dấu thanh (ni hao = nǐ hǎo)
 * nhưng gõ đúng cả dấu thanh sẽ được thưởng thêm điểm.
 */

import { el, sample, speak, stripTone, sleep, toast } from '../core.js';
import { CONFIG } from '../config.js';
import { Shell } from './shell.js';

// Bảng chèn dấu thanh nhanh cho học sinh dùng chuột / điện thoại
const TONE_KEYS = [
  ['ā', 'á', 'ǎ', 'à', 'a'],
  ['ō', 'ó', 'ǒ', 'ò', 'o'],
  ['ē', 'é', 'ě', 'è', 'e'],
  ['ī', 'í', 'ǐ', 'ì', 'i'],
  ['ū', 'ú', 'ǔ', 'ù', 'u'],
  ['ǖ', 'ǘ', 'ǚ', 'ǜ', 'ü'],
];

export function play(game, lesson, container) {
  const n = Math.min(CONFIG.game.questionsPerRound, lesson.words.length);
  const picked = sample(lesson.words, n);
  const shell = new Shell({ game, lesson, total: n });
  shell.attach(container);

  let i = 0;

  function next() {
    if (i >= picked.length) return shell.finish();
    const word = picked[i];
    shell.progress(i, picked.length);

    const input = el('input.input.input-lg', {
      type: 'text',
      autocomplete: 'off',
      autocapitalize: 'off',
      autocorrect: 'off',
      spellcheck: 'false',
      placeholder: 'Gõ pinyin, ví dụ: ni hao',
      style: { textAlign: 'center', fontFamily: 'var(--f-body)' },
    });

    const feedback = el('div', { style: { minHeight: '52px', marginTop: '12px' } });
    let done = false;

    const toneBar = el('div', { style: { display: 'grid', gap: '5px', marginTop: '14px' } },
      TONE_KEYS.map((row) => el('div.row', { style: { justifyContent: 'center', gap: '5px' } },
        row.map((ch) => el('button.btn.btn-ghost.btn-sm', {
          type: 'button',
          style: { minWidth: '42px', padding: '7px 0', fontFamily: 'var(--f-body)' },
          onclick: () => {
            const s = input.selectionStart ?? input.value.length;
            input.value = input.value.slice(0, s) + ch + input.value.slice(input.selectionEnd ?? s);
            input.focus();
            input.setSelectionRange(s + 1, s + 1);
          },
        }, ch))
      ))
    );

    function check() {
      if (done) return;
      const raw = input.value.trim();
      if (!raw) { toast('Em hãy gõ pinyin của chữ này'); input.focus(); return; }
      done = true;

      const exact = raw.toLowerCase().replace(/\s+/g, ' ') === word.py.toLowerCase();
      const loose = stripTone(raw) === stripTone(word.py);
      const ok = exact || loose;
      const points = exact ? 150 : loose ? 90 : 0;

      shell.mark(ok, ok ? points : 100, word);
      input.disabled = true;
      speak(word.hz);

      feedback.replaceChildren(
        el('div.alert' + (ok ? '.alert-ok' : ''), {}, [
          ok
            ? (exact ? '🎉 Chính xác cả dấu thanh! +150 điểm' : '✅ Đúng rồi! Lần sau thử gõ cả dấu thanh để được 150 điểm nhé.')
            : '❌ Chưa đúng. ',
          el('b', { style: { marginLeft: '6px' } }, `Đáp án: ${word.py}`),
        ])
      );

      submitBtn.textContent = 'Câu tiếp theo →';
      submitBtn.onclick = () => { i++; next(); };
      submitBtn.focus();
    }

    const submitBtn = el('button.btn.btn-lg.btn-block', { onclick: check }, 'Kiểm tra');

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (done) { i++; next(); } else check();
      }
    });

    shell.setStage([
      el('div.wrap-sm', { style: { padding: 0 } }, [
        el('div.qbox', {}, [
          el('div.lbl', {}, 'Gõ pinyin của chữ này'),
          el('div.q-hz', {}, word.hz),
          el('div.small.muted', { style: { marginTop: '8px' } }, word.vi),
          el('div.row', { style: { justifyContent: 'center', marginTop: '14px' } }, [
            el('button.btn.btn-ghost.btn-sm', { onclick: () => speak(word.hz) }, '🔊 Nghe'),
            el('button.btn.btn-ghost.btn-sm', {
              onclick: () => {
                if (done) return;
                toast('Gợi ý: bắt đầu bằng "' + word.py.slice(0, 2) + '..."');
              },
            }, '💡 Gợi ý'),
          ]),
        ]),
        input,
        feedback,
        submitBtn,
        toneBar,
        el('p.hint.tcenter', {}, 'Mẹo: gõ không dấu vẫn được tính đúng (90đ), gõ đúng dấu thanh được 150đ'),
      ]),
    ]);

    setTimeout(() => input.focus(), 60);
  }

  next();
}
