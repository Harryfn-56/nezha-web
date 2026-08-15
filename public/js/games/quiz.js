/**
 * GAME 2 — TRẮC NGHIỆM 4 ĐÁP ÁN (选择题)
 * Xen kẽ 3 kiểu hỏi để không nhàm: Hán tự→nghĩa, nghĩa→Hán tự, Hán tự→pinyin.
 * Trả lời càng nhanh điểm càng cao.
 */

import { el, shuffle, sample, sleep, speak } from '../core.js';
import { CONFIG } from '../config.js';
import { Shell, timeScore } from './shell.js';

const MODES = ['hz2vi', 'vi2hz', 'hz2py'];

export function play(game, lesson, container) {
  const words = lesson.words;
  const n = Math.min(CONFIG.game.questionsPerRound, words.length);
  const picked = sample(words, n);
  const shell = new Shell({ game, lesson, total: n });
  shell.attach(container);

  let i = 0;
  let locked = false;

  function buildQuestion(word, mode) {
    const others = shuffle(words.filter((w) => w.hz !== word.hz));
    if (mode === 'vi2hz') {
      return {
        prompt: el('div', {}, [
          el('div.lbl', {}, 'Từ nào có nghĩa là'),
          el('div.q-vi', {}, `“${word.vi}”`),
        ]),
        options: shuffle([word, ...others.slice(0, 3)]),
        label: (w) => el('span.hz', { style: { fontSize: '1.7rem' } }, w.hz),
        speakOnReveal: true,
      };
    }
    if (mode === 'hz2py') {
      // Đáp án nhiễu nên là pinyin của từ khác nhưng độ dài gần giống
      const pool = others.filter((w) => Math.abs(w.py.length - word.py.length) <= 3);
      const distract = (pool.length >= 3 ? pool : others).slice(0, 3);
      return {
        prompt: el('div', {}, [
          el('div.lbl', {}, 'Pinyin của từ này là gì?'),
          el('div.q-hz', {}, word.hz),
        ]),
        options: shuffle([word, ...distract]),
        label: (w) => el('span.py', { style: { fontSize: '1.15rem', fontStyle: 'normal' } }, w.py),
        speakOnReveal: true,
      };
    }
    return {
      prompt: el('div', {}, [
        el('div.lbl', {}, 'Từ này nghĩa là gì?'),
        el('div.q-hz', {}, word.hz),
        el('div.py.q-py', { style: { marginTop: '6px', opacity: .0 }, id: 'pyHint' }, word.py),
      ]),
      options: shuffle([word, ...others.slice(0, 3)]),
      label: (w) => el('span', {}, w.vi),
      speakOnReveal: true,
    };
  }

  function next() {
    if (i >= picked.length) return shell.finish();
    const word = picked[i];
    const mode = MODES[i % MODES.length];
    const q = buildQuestion(word, mode);
    locked = false;
    shell.progress(i, picked.length);

    const timerFill = el('i', { style: { width: '100%' } });
    const timerBar = el('div.bar.timer', {}, timerFill);
    const secs = el('span.pill', {}, `${CONFIG.game.quizSeconds}s`);
    let fracLeft = 1;

    const optNodes = q.options.map((w, idx) => el('button.opt', {
      onclick: () => choose(w, idx),
    }, [
      el('span.key', {}, 'ABCD'[idx]),
      q.label(w),
    ]));

    shell.setStage([
      el('div.wrap-sm', { style: { padding: 0 } }, [
        el('div.row', { style: { marginBottom: '14px' } }, [timerBar, secs]),
        el('div.qbox', {}, [
          q.prompt,
          el('div.row', { style: { justifyContent: 'center', marginTop: '14px' } },
            el('button.btn.btn-ghost.btn-sm', { onclick: () => speak(word.hz) }, '🔊 Nghe')),
        ]),
        el('div.opts', {}, optNodes),
      ]),
    ]);

    shell.countdown(CONFIG.game.quizSeconds,
      (frac, whole) => {
        fracLeft = frac;
        timerFill.style.width = frac * 100 + '%';
        secs.textContent = whole + 's';
        timerBar.classList.toggle('warn', frac < 0.3);
      },
      () => { if (!locked) choose(null, -1); }
    );

    async function choose(w, idx) {
      if (locked) return;
      locked = true;
      shell.stopTimer();

      const ok = w && w.hz === word.hz;
      const points = ok ? timeScore(fracLeft) : 0;
      shell.mark(!!ok, ok ? points : 100, word);

      optNodes.forEach((node, k) => {
        node.classList.add('locked');
        if (q.options[k].hz === word.hz) node.classList.add('correct');
        else if (k === idx) node.classList.add('wrong');
        else node.classList.add('dim');
      });

      if (q.speakOnReveal) speak(word.hz);

      // Hiện gợi ý pinyin nếu có
      const hint = document.getElementById('pyHint');
      if (hint) hint.style.opacity = '1';

      await sleep(ok ? 850 : 1700);
      i++;
      next();
    }
  }

  next();
}
