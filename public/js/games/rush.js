/**
 * GAME 8 — NA TRA ĐẠI CHIẾN (闯关)
 * Chữ Hán rơi từ trên xuống, học sinh phải chọn nghĩa đúng trước khi
 * chữ chạm đất. Mỗi lần sai / để rơi mất 1 mạng. Tốc độ tăng dần.
 * Rèn phản xạ nhận mặt chữ — rất hợp làm trò khởi động cuối buổi.
 */

import { el, shuffle, sample, sfx, speak, sleep } from '../core.js';
import { CONFIG } from '../config.js';
import { Shell } from './shell.js';

export function play(game, lesson, container) {
  const shell = new Shell({ game, lesson, total: 0 });
  shell.attach(container);

  let lives = CONFIG.game.rushLives;
  let round = 0;
  let raf = null;
  let running = false;
  let current = null;
  let fallStart = 0;
  let fallDuration = 7000;

  const arena = el('div.arena');
  const ground = el('div.ground');
  const livesEl = el('span.pill.lives', {}, '❤️'.repeat(lives));
  const optsWrap = el('div.opts');

  function stop() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = null;
  }

  function spawn() {
    round++;
    // Mỗi vòng rơi nhanh hơn một chút, nhanh nhất là 2.6 giây
    fallDuration = Math.max(2600, 7000 - round * 260);

    const word = sample(lesson.words, 1)[0];
    const distract = shuffle(lesson.words.filter((w) => w.hz !== word.hz)).slice(0, 3);
    const options = shuffle([word, ...distract]);
    current = { word, options, done: false };

    const faller = el('div.faller', {}, word.hz);
    faller.style.top = '-10px';
    arena.replaceChildren(ground, faller);

    optsWrap.replaceChildren(...options.map((w, idx) => el('button.opt', {
      onclick: () => answer(w, idx),
    }, [el('span.key', {}, 'ABCD'[idx]), el('span', {}, w.vi)])));

    fallStart = performance.now();
    running = true;

    const step = (t) => {
      if (!running || current.done) return;
      const p = (t - fallStart) / fallDuration;
      const maxTop = arena.clientHeight - 52 - faller.offsetHeight;
      faller.style.top = Math.min(p, 1) * maxTop + 'px';
      if (p >= 1) { answer(null, -1); return; }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  }

  async function answer(w, idx) {
    if (!current || current.done) return;
    current.done = true;
    stop();

    const ok = w && w.hz === current.word.hz;
    shell.mark(!!ok, ok ? 130 : 100, current.word);
    shell.progress(shell.correct, shell.correct + (CONFIG.game.rushLives - lives) + (ok ? 0 : 1));
    speak(current.word.hz);

    Array.from(optsWrap.children).forEach((node, k) => {
      node.classList.add('locked');
      if (current.options[k].hz === current.word.hz) node.classList.add('correct');
      else if (k === idx) node.classList.add('wrong');
      else node.classList.add('dim');
    });

    if (!ok) {
      lives--;
      livesEl.textContent = '❤️'.repeat(Math.max(0, lives)) + '🖤'.repeat(CONFIG.game.rushLives - Math.max(0, lives));
      arena.animate(
        [{ transform: 'translateX(0)' }, { transform: 'translateX(-10px)' }, { transform: 'translateX(10px)' }, { transform: 'translateX(0)' }],
        { duration: 320 }
      );
    }

    await sleep(ok ? 700 : 1500);

    if (lives <= 0) {
      shell.total = shell.answered;
      return shell.finish();
    }
    spawn();
  }

  shell.setStage([
    el('div.wrap-sm', { style: { padding: 0 } }, [
      el('div.row-between', { style: { marginBottom: '12px' } }, [
        el('span.chip', {}, `🔥 Vòng ${round + 1}`),
        livesEl,
      ]),
      arena,
      el('div.lbl.tcenter', { style: { marginBottom: '10px' } }, 'Chọn nghĩa đúng trước khi chữ chạm đất!'),
      optsWrap,
    ]),
  ]);

  // Bảng điều khiển bằng phím A/B/C/D cho học sinh dùng máy tính
  const keyHandler = (e) => {
    const k = 'abcd'.indexOf(e.key.toLowerCase());
    if (k >= 0 && current && !current.done) answer(current.options[k], k);
  };
  document.addEventListener('keydown', keyHandler);
  window.addEventListener('popstate', () => {
    stop();
    document.removeEventListener('keydown', keyHandler);
  }, { once: true });

  spawn();
}
