/**
 * GAME 3 — GHÉP CẶP TRÍ NHỚ (配对)
 * Lật 2 ô để tìm cặp Hán tự ↔ nghĩa tiếng Việt.
 * Càng ít lượt lật sai thì điểm càng cao.
 */

import { el, sample, shuffle, sleep, speak, sfx } from '../core.js';
import { CONFIG } from '../config.js';
import { Shell } from './shell.js';

export function play(game, lesson, container) {
  const pairs = sample(lesson.words, Math.min(CONFIG.game.matchPairs, lesson.words.length));
  const shell = new Shell({ game, lesson, total: pairs.length });
  shell.attach(container);

  // Mỗi từ tạo 2 ô: 1 ô Hán tự, 1 ô nghĩa
  const cards = shuffle(pairs.flatMap((w, k) => ([
    { key: k, face: 'hz', text: w.hz, word: w },
    { key: k, face: 'vi', text: w.vi, word: w },
  ])));

  let open = [];      // các ô đang lật
  let matched = 0;
  let attempts = 0;
  let busy = false;

  const nodes = cards.map((c, idx) => el(
    'button.mcard' + (c.face === 'hz' ? '.hzface' : ''),
    { onclick: () => flip(idx) },
    el('span.t', {}, c.text)
  ));

  const info = el('p.hint.tcenter');

  function refreshInfo() {
    info.textContent = `Đã ghép ${matched}/${pairs.length} cặp · Số lượt lật: ${attempts}`;
  }

  async function flip(idx) {
    if (busy) return;
    const node = nodes[idx];
    if (node.classList.contains('done') || node.classList.contains('open')) return;

    node.classList.add('open');
    sfx.flip();
    if (cards[idx].face === 'hz') speak(cards[idx].text);
    open.push(idx);

    if (open.length < 2) return;

    busy = true;
    attempts++;
    const [a, b] = open;
    const isPair = cards[a].key === cards[b].key;

    if (isPair) {
      matched++;
      shell.mark(true, 120, cards[a].word);
      shell.progress(matched, pairs.length);
      nodes[a].classList.add('done');
      nodes[b].classList.add('done');
      nodes[a].classList.remove('open');
      nodes[b].classList.remove('open');
      speak(cards[a].word.hz);
      open = [];
      busy = false;
      refreshInfo();
      if (matched === pairs.length) {
        await sleep(600);
        shell.finish();
      }
      return;
    }

    // Sai cặp
    sfx.wrong();
    nodes[a].classList.add('miss');
    nodes[b].classList.add('miss');
    await sleep(720);
    nodes[a].classList.remove('open', 'miss');
    nodes[b].classList.remove('open', 'miss');
    open = [];
    busy = false;
    refreshInfo();
  }

  shell.progress(0, pairs.length);
  refreshInfo();
  shell.setStage([
    el('div.wrap-sm', { style: { padding: 0 } }, [
      el('div.qbox', { style: { padding: '18px' } }, [
        el('div.lbl', {}, 'Lật 2 ô để tìm cặp Hán tự ↔ nghĩa'),
        el('div.hz', { style: { fontSize: '1.5rem', color: 'var(--red-700)' } }, '找一找 · Tìm cặp giống nhau'),
      ]),
      el('div.mgrid', {}, nodes),
      info,
    ]),
  ]);
}
