/**
 * GAME 5 — NGHE CHỌN TỪ (听力)
 * Máy đọc một từ tiếng Trung, học sinh chọn đúng Hán tự.
 * Nếu máy học sinh không có giọng đọc tiếng Trung, game tự chuyển sang
 * chế độ "đọc pinyin" để vẫn chơi được.
 */

import { el, sample, shuffle, sleep, speak, canSpeak } from '../core.js';
import { CONFIG } from '../config.js';
import { Shell, timeScore } from './shell.js';

export function play(game, lesson, container) {
  const hasVoice = canSpeak();
  const n = Math.min(CONFIG.game.questionsPerRound, lesson.words.length);
  const picked = sample(lesson.words, n);
  const shell = new Shell({ game, lesson, total: n });
  shell.attach(container);

  let i = 0;
  let locked = false;

  function next() {
    if (i >= picked.length) return shell.finish();
    const word = picked[i];
    const others = shuffle(lesson.words.filter((w) => w.hz !== word.hz)).slice(0, 3);
    const options = shuffle([word, ...others]);
    locked = false;
    shell.progress(i, picked.length);

    const timerFill = el('i', { style: { width: '100%' } });
    const timerBar = el('div.bar.timer', {}, timerFill);
    let fracLeft = 1;

    const optNodes = options.map((w, idx) => el('button.opt', {
      onclick: () => choose(w, idx),
      style: { justifyContent: 'center' },
    }, [
      el('span.key', {}, 'ABCD'[idx]),
      el('span.hz', { style: { fontSize: '1.9rem' } }, w.hz),
    ]));

    const playBtn = el('button.btn.btn-lg', {
      onclick: () => hasVoice ? speak(word.hz) : speak(word.py),
      style: { width: '124px', height: '124px', borderRadius: '50%', fontSize: '2.6rem', padding: 0 },
    }, '🔊');

    shell.setStage([
      el('div.wrap-sm', { style: { padding: 0 } }, [
        el('div.row', { style: { marginBottom: '14px' } }, [timerBar]),
        el('div.qbox', {}, [
          el('div.lbl', {}, hasVoice ? 'Nghe và chọn chữ Hán đúng' : 'Đọc pinyin và chọn chữ Hán đúng'),
          hasVoice
            ? el('div.center', { style: { padding: '10px 0' } }, playBtn)
            : el('div.py', { style: { fontSize: '2.2rem', fontStyle: 'normal' } }, word.py),
          hasVoice ? el('button.btn.btn-ghost.btn-sm', {
            onclick: () => speak(word.hz, { rate: 0.5 }),
          }, '🐢 Nghe chậm lại') : null,
        ]),
        el('div.opts', {}, optNodes),
      ]),
    ]);

    // Tự động phát ngay khi hiện câu hỏi
    if (hasVoice) setTimeout(() => speak(word.hz), 350);

    shell.countdown(CONFIG.game.quizSeconds, (frac) => {
      fracLeft = frac;
      timerFill.style.width = frac * 100 + '%';
      timerBar.classList.toggle('warn', frac < 0.3);
    }, () => { if (!locked) choose(null, -1); });

    async function choose(w, idx) {
      if (locked) return;
      locked = true;
      shell.stopTimer();

      const ok = w && w.hz === word.hz;
      shell.mark(!!ok, ok ? timeScore(fracLeft, 110) : 100, word);

      optNodes.forEach((node, k) => {
        node.classList.add('locked');
        if (options[k].hz === word.hz) {
          node.classList.add('correct');
          node.append(el('span.small.muted', { style: { marginLeft: 'auto' } }, `${options[k].py} · ${options[k].vi}`));
        } else if (k === idx) node.classList.add('wrong');
        else node.classList.add('dim');
      });

      await sleep(ok ? 900 : 1800);
      i++;
      next();
    }
  }

  next();
}
