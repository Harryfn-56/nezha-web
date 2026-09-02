/**
 * GAME 11 — PHI THUYỀN BẮN THIÊN THẠCH (打字飞船)
 *
 * Các "thiên thạch" là chữ Hán trong bài, rơi từ trên xuống — nhiều viên
 * cùng lúc. Học sinh GÕ PINYIN của chữ để bắn hạ (không cần gõ dấu thanh).
 *
 * Độ khó tăng dần giống Na Tra đại chiến: cứ mỗi shipLevelEvery viên bắn
 * trúng thì lên 1 cấp — thiên thạch rơi nhanh hơn, rơi nhiều viên hơn và
 * xuất hiện dày hơn. Tất cả thông số nằm trong config.js.
 */

import { el, shuffle, sample, sfx, speak, sleep, stripTone, toast } from '../core.js';
import { CONFIG } from '../config.js';
import { Shell } from './shell.js';

/** "nǐ hǎo" → "nihao" — bỏ dấu thanh, bỏ khoảng trắng để dễ gõ */
const key = (py) => stripTone(String(py || ''));

/** Học sinh gõ "lu" thay cho "lü/lv" vẫn được tính là đúng */
const soft = (x) => key(x).replace(/v/g, 'u');
const same = (a, b) => key(a) === key(b) || soft(a) === soft(b);

/**
 * Gõ đúng được bao nhiêu chữ cái đầu của pinyin viên này?
 * "nihao" mà gõ "ni"  → 2 (đúng hết)
 * "nihao" mà gõ "nin" → 2 (đúng "ni", sai từ chữ thứ 3)
 */
function matchLen(typed, target) {
  const t = soft(typed);
  const k = soft(target);
  let n = 0;
  while (n < t.length && n < k.length && t[n] === k[n]) n++;
  return n;
}

export function play(game, lesson, container) {
  const g = CONFIG.game;
  const perLevel = Math.max(1, g.shipLevelEvery || 6);

  // Chỉ lấy những từ gõ được pinyin
  const pool = (lesson.words || []).filter((w) => key(w.py).length >= 1);
  if (pool.length < 4) {
    toast('Bài này chưa đủ từ có pinyin để chơi', 'bad');
    return;
  }

  const shell = new Shell({ game, lesson, total: 0 });
  shell.attach(container);

  let lives = g.shipLives || 3;
  let level = 1;
  let destroyed = 0;
  let running = true;
  let raf = null;
  let lastSpawn = 0;
  const meteors = [];          // { w, node, bornAt, dur, x }

  /* ------------------------------------------------ thông số theo cấp */
  const fallMs = () => Math.max(
    (g.shipMinSeconds || 3) * 1000,
    Math.round((g.shipStartSeconds || 9) * 1000 * Math.pow(g.shipSpeedUp || 0.86, level - 1))
  );
  const maxOnScreen = () => Math.min(g.shipMaxMeteors || 5, 1 + Math.floor((level - 1) / 2) + 1);
  const spawnGap = () => Math.max(900, fallMs() / (maxOnScreen() + 0.4));

  /* ------------------------------------------------------- giao diện */
  const arena = el('div.space-arena');
  const ground = el('div.space-ground');
  const ship = el('div.ship', {}, ['🚀', el('span.flame')]);

  // Hành tinh xa + rắc sao lên nền cho giống ngoài vũ trụ
  arena.append(el('div.planet', {
    style: { right: '7%', top: '9%', width: '72px', height: '72px' },
  }));

  for (let k = 0; k < 95; k++) {
    const size = Math.random() < 0.15 ? 3 : Math.random() < 0.5 ? 2 : 1.4;
    arena.append(el('div.star', {
      style: {
        left: (Math.random() * 100).toFixed(2) + '%',
        top: (Math.random() * 92).toFixed(2) + '%',
        width: size + 'px',
        height: size + 'px',
        '--tw': (1.6 + Math.random() * 3).toFixed(2) + 's',
        animationDelay: (Math.random() * 3).toFixed(2) + 's',
      },
    }));
  }
  arena.append(ground, ship);

  /** Thỉnh thoảng cho một ngôi sao băng vụt qua */
  function shootingStar() {
    if (!running) return;
    const st = el('div.shooting-star', {
      style: { left: (Math.random() * 50).toFixed(1) + '%', top: (Math.random() * 40).toFixed(1) + '%' },
    });
    arena.append(st);
    setTimeout(() => st.remove(), 1200);
    setTimeout(shootingStar, 3500 + Math.random() * 5000);
  }
  setTimeout(shootingStar, 1200);

  const livesEl = el('span.pill.lives', {}, '❤️'.repeat(lives));
  const levelEl = el('span.chip', {}, '🛰️ Cấp 1');
  const infoEl = el('span.chip.chip-soft', {}, '');

  const input = el('input.input.type-bar', {
    placeholder: 'Gõ pinyin rồi bấm Enter (vd: nihao)',
    autocomplete: 'off', autocapitalize: 'none', autocorrect: 'off', spellcheck: 'false',
  });

  function refreshChips() {
    levelEl.textContent = `🛰️ Cấp ${level}`;
    infoEl.textContent = `⏱️ ${(fallMs() / 1000).toFixed(1)}s · tối đa ${maxOnScreen()} viên`;
  }
  refreshChips();

  shell.setStage([
    el('div.wrap', { style: { padding: 0, maxWidth: '900px' } }, [
      el('div.row-between', { style: { marginBottom: '10px' } }, [
        el('div.row', { style: { gap: '6px' } }, [levelEl, infoEl]),
        livesEl,
      ]),
      arena,
      el('div.lbl.tcenter', { style: { margin: '10px 0 6px' } },
        'Gõ pinyin của chữ để bắn hạ thiên thạch — không cần gõ dấu thanh'),
      input,
      el('p.hint.tcenter', { style: { marginTop: '10px' } },
        `Cứ ${perLevel} viên bắn trúng thì lên 1 cấp: thiên thạch rơi nhanh hơn và nhiều hơn.`),
    ]),
  ]);

  setTimeout(() => input.focus(), 60);

  /* ---------------------------------------------------------- vòng lặp */
  function spawn(now) {
    // Không cho 2 viên trùng chữ HOẶC trùng pinyin trên màn hình
    // (他 và 她 cùng gõ "ta" — nếu rơi cùng lúc học sinh không biết bắn viên nào)
    const onScreen = new Set(meteors.map((m) => key(m.w.py)));
    const choices = pool.filter((w) => !onScreen.has(key(w.py)));
    if (!choices.length) return;

    const w = sample(choices, 1)[0];
    const node = el('div.meteor', {}, [
      el('span.mhz', {}, w.hz),
      el('span.mpy', {}, ''),
    ]);
    const lanes = Math.max(1, maxOnScreen());
    const lane = Math.floor(Math.random() * lanes);
    const x = 6 + (lane + Math.random() * 0.5) * (88 / lanes);
    node.style.left = x + '%';
    node.style.top = '-8%';
    arena.append(node);

    meteors.push({ w, node, bornAt: now, dur: fallMs() });
    lastSpawn = now;
  }

  function loop(now) {
    if (!running) return;

    if (now - lastSpawn >= spawnGap() && meteors.length < maxOnScreen()) spawn(now);

    const h = arena.clientHeight;
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i];
      const p = (now - m.bornAt) / m.dur;
      m.node.style.top = Math.min(p, 1) * (h - 62) + 'px';
      if (p >= 1) crash(i);
    }

    raf = requestAnimationFrame(loop);
  }

  /* ------------------------------------------- thiên thạch chạm mặt đất */
  async function crash(index) {
    const m = meteors[index];
    if (!m) return;
    meteors.splice(index, 1);
    m.node.remove();

    lives--;
    sfx.wrong();
    shell.mark(false, 120, m.w);
    livesEl.textContent = '❤️'.repeat(Math.max(0, lives))
      + '🖤'.repeat((g.shipLives || 3) - Math.max(0, lives));
    arena.animate(
      [{ transform: 'translateX(0)' }, { transform: 'translateX(-8px)' },
       { transform: 'translateX(8px)' }, { transform: 'translateX(0)' }],
      { duration: 300 }
    );
    toast(`💥 ${m.w.hz} (${m.w.py}) rơi mất rồi!`, 'bad');

    if (lives <= 0) gameOver();
  }

  /* ------------------------------------------------------------ bắn */
  function shoot() {
    const typed = key(input.value);
    if (!typed) return;

    const idx = meteors.findIndex((m) => same(m.w.py, input.value));
    if (idx < 0) {
      // Gõ sai: rung ô nhập, không trừ mạng
      input.classList.add('shake');
      sfx.tick();
      setTimeout(() => input.classList.remove('shake'), 320);
      return;
    }

    const m = meteors[idx];
    meteors.splice(idx, 1);
    input.value = '';

    // Bắn tia laser từ phi thuyền lên đúng vị trí viên thiên thạch
    aimAt(m);
    const beam = el('div.laser', {
      style: {
        left: m.node.style.left,
        height: Math.max(20, arena.clientHeight - 30 - m.node.offsetTop - m.node.offsetHeight / 2) + 'px',
      },
    });
    arena.append(beam);
    setTimeout(() => beam.remove(), 300);

    m.node.classList.add('boom');
    m.node.textContent = '💥';
    setTimeout(() => m.node.remove(), 360);
    setTimeout(() => aimAt(null), 260);

    destroyed++;
    sfx.correct();
    speak(m.w.hz);
    shell.mark(true, 120 + (level - 1) * 20, m.w);
    shell.progress(shell.correct, shell.answered);

    const newLevel = Math.floor(destroyed / perLevel) + 1;
    if (newLevel > level) {
      level = newLevel;
      refreshChips();
      toast(`🛰️ Cấp ${level} — thiên thạch rơi nhanh và nhiều hơn!`, '');
      arena.animate(
        [{ filter: 'brightness(1)' }, { filter: 'brightness(1.4)' }, { filter: 'brightness(1)' }],
        { duration: 480 }
      );
    }
    refreshChips();
  }

  /** Phi thuyền trượt tới ngay dưới viên đang ngắm */
  function aimAt(m) {
    ship.style.left = m ? m.node.style.left : '50%';
  }

  /* --------------------------------------------------- gợi ý khi gõ
   * Trên mỗi viên thiên thạch CHỈ hiện đúng phần học sinh đã gõ, không
   * hiện trước cả pinyin (hiện trước thì thành ra bày sẵn đáp án):
   *    gõ "ni"  cho 你好 → hiện "ni"  màu xanh
   *    gõ "nih"            → hiện "nih" màu xanh
   *    gõ "nin"            → hiện "ni" xanh + "n" đỏ (chữ thứ 3 sai)
   */
  input.addEventListener('input', () => {
    const typedRaw = key(input.value);
    let target = null;
    let bestLen = 0;

    meteors.forEach((m) => {
      const py = m.node.querySelector('.mpy');
      const ok = matchLen(typedRaw, m.w.py);          // số chữ cái gõ đúng
      const wrong = typedRaw.slice(ok);               // phần gõ sai (nếu có)
      const onTrack = ok > 0 && !wrong.length;        // đang gõ đúng hướng

      m.node.classList.toggle('locked-on', onTrack);
      m.node.classList.toggle('miss-on', ok > 0 && wrong.length > 0);

      if (py) {
        py.replaceChildren();
        if (ok > 0) {
          py.append(el('span.ok', {}, typedRaw.slice(0, ok)));
          if (wrong) py.append(el('span.bad', {}, wrong));
        }
      }

      // Phi thuyền ngắm viên đang gõ đúng nhiều chữ nhất
      if (onTrack && ok > bestLen) { bestLen = ok; target = m; }
    });

    aimAt(target);
    if (typedRaw && meteors.some((m) => same(m.w.py, input.value))) shoot();
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); shoot(); }
  });

  /* -------------------------------------------------------- kết thúc */
  async function gameOver() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    meteors.forEach((m) => m.node.remove());
    meteors.length = 0;
    await sleep(700);
    shell.total = shell.answered;
    shell.finish();
  }

  function stop() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
  }
  window.addEventListener('popstate', stop, { once: true });

  lastSpawn = performance.now() - spawnGap();   // sinh viên đầu tiên ngay lập tức
  raf = requestAnimationFrame(loop);
}
