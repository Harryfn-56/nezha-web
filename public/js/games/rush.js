/**
 * GAME 8 — NA TRA ĐẠI CHIẾN (闯关)
 * Chữ Hán rơi từ trên xuống, học sinh phải chọn nghĩa đúng trước khi
 * chữ chạm đất. Mỗi lần sai / để rơi mất 1 mạng.
 *
 * ĐỘ KHÓ TĂNG DẦN: cứ mỗi CONFIG.game.rushLevelEvery câu (mặc định 6) thì
 * lên 1 cấp, chữ rơi nhanh hơn (mặc định còn 82% thời gian của cấp trước),
 * nhanh nhất là CONFIG.game.rushMinSeconds. Muốn dễ/khó hơn chỉ cần sửa
 * mấy con số đó trong public/js/config.js.
 */

import { el, shuffle, sample, sfx, speak, sleep, toast } from '../core.js';
import { CONFIG } from '../config.js';
import { Shell } from './shell.js';

/** Thời gian rơi (ms) của một cấp độ */
function fallMsForLevel(level) {
  const g = CONFIG.game;
  const start = (g.rushStartSeconds || 4.5) * 1000;
  const min = (g.rushMinSeconds || 1.4) * 1000;
  const factor = g.rushSpeedUp || 0.82;
  return Math.max(min, Math.round(start * Math.pow(factor, Math.max(0, level - 1))));
}

export function play(game, lesson, container) {
  const shell = new Shell({ game, lesson, total: 0 });
  shell.attach(container);

  const perLevel = Math.max(1, CONFIG.game.rushLevelEvery || 6);

  let lives = CONFIG.game.rushLives;
  let round = 0;          // câu thứ mấy
  let level = 1;          // cấp độ hiện tại
  let raf = null;
  let running = false;
  let current = null;
  let fallStart = 0;
  let fallDuration = fallMsForLevel(1);

  const arena = el('div.arena');
  const ground = el('div.ground');
  const livesEl = el('span.pill.lives', {}, '❤️'.repeat(lives));
  const levelEl = el('span.chip', {}, '🔥 Cấp 1');
  const speedEl = el('span.chip.chip-soft', {}, '');
  const optsWrap = el('div.opts');

  function stop() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = null;
  }

  function spawn() {
    round++;

    // Cấp độ: 6 câu đầu cấp 1, 6 câu tiếp cấp 2...
    const newLevel = Math.floor((round - 1) / perLevel) + 1;
    const levelUp = newLevel > level;
    level = newLevel;
    fallDuration = fallMsForLevel(level);

    levelEl.textContent = `🔥 Cấp ${level}`;
    speedEl.textContent = `⏱️ ${(fallDuration / 1000).toFixed(1)}s/chữ`;
    if (levelUp) {
      toast(`⚡ Cấp ${level} — chữ rơi nhanh hơn rồi, cẩn thận!`, '');
      sfx.tick();
      arena.animate(
        [{ filter: 'brightness(1)' }, { filter: 'brightness(1.35)' }, { filter: 'brightness(1)' }],
        { duration: 500 }
      );
    }

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
    // Cấp càng cao điểm càng nhiều: cấp 1 = 130, mỗi cấp thêm 20 điểm
    shell.mark(!!ok, ok ? 130 + (level - 1) * 20 : 100, current.word);
    shell.progress(shell.correct, shell.answered);
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

    // Cấp càng cao thì nghỉ giữa câu càng ngắn để giữ nhịp nhanh
    await sleep(ok ? Math.max(350, 700 - (level - 1) * 60) : 1400);

    if (lives <= 0) {
      shell.total = shell.answered;
      return shell.finish();
    }
    spawn();
  }

  shell.setStage([
    el('div.wrap-sm', { style: { padding: 0 } }, [
      el('div.row-between', { style: { marginBottom: '12px' } }, [
        el('div.row', { style: { gap: '6px' } }, [levelEl, speedEl]),
        livesEl,
      ]),
      arena,
      el('div.lbl.tcenter', { style: { marginBottom: '10px' } },
        `Chọn nghĩa đúng trước khi chữ chạm đất! Cứ ${perLevel} câu chữ lại rơi nhanh hơn.`),
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
