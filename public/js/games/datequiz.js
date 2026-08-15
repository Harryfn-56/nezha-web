/**
 * GAME 7 — NGÀY THÁNG NEZHA (日期)
 * Bám sát phần cuối bài 1–5: năm / tháng / ngày / tuổi / sinh nhật.
 * 4 kiểu câu hỏi xoay vòng để không nhàm.
 */

import { el, shuffle, randInt, sleep, speak } from '../core.js';
import { CONFIG } from '../config.js';
import { numToHanzi, yearToHanzi, dateToChinese } from '../data.js';
import { Shell, timeScore } from './shell.js';

const MONTH_HZ = (m) => numToHanzi(m) + '月';

/** Sinh 1 câu hỏi ngẫu nhiên thuộc 1 trong 4 dạng */
function makeQuestion(kind) {
  if (kind === 0) {
    // Đổi ngày dạng số sang tiếng Trung
    const y = randInt(2010, 2026), m = randInt(1, 12), d = randInt(1, 28);
    const right = dateToChinese(y, m, d).mix;
    const wrongs = new Set();
    while (wrongs.size < 3) {
      const w = dateToChinese(
        y, randInt(1, 12), randInt(1, 28)
      ).mix;
      if (w !== right) wrongs.add(w);
    }
    return {
      lbl: 'Viết ngày này bằng tiếng Trung',
      big: `${d}/${m}/${y}`,
      bigClass: 'q-vi',
      right,
      options: shuffle([right, ...wrongs]),
      render: (t) => el('span.hz', { style: { fontSize: '1.3rem' } }, t),
      review: { hz: right, py: '', vi: `Ngày ${d} tháng ${m} năm ${y}` },
    };
  }

  if (kind === 1) {
    // Đọc tháng bằng chữ Hán
    const m = randInt(1, 12);
    const right = MONTH_HZ(m);
    const wrongs = shuffle([...Array(12).keys()].map((k) => k + 1).filter((x) => x !== m))
      .slice(0, 3).map(MONTH_HZ);
    return {
      lbl: 'Tháng này viết bằng chữ Hán là',
      big: `Tháng ${m}`,
      bigClass: 'q-vi',
      right,
      options: shuffle([right, ...wrongs]),
      render: (t) => el('span.hz', { style: { fontSize: '1.6rem' } }, t),
      review: { hz: right, py: '', vi: `tháng ${m}` },
    };
  }

  if (kind === 2) {
    // Năm sinh → đọc theo kiểu tiếng Trung (đọc từng chữ số)
    const y = randInt(2008, 2020);
    const right = yearToHanzi(y) + '年';
    const wrongs = new Set();
    while (wrongs.size < 3) {
      const w = yearToHanzi(randInt(2008, 2026)) + '年';
      if (w !== right) wrongs.add(w);
    }
    return {
      lbl: 'Năm sinh này đọc bằng chữ Hán là',
      big: `${y} 年`,
      bigClass: 'q-vi',
      right,
      options: shuffle([right, ...wrongs]),
      render: (t) => el('span.hz', { style: { fontSize: '1.4rem' } }, t),
      review: { hz: right, py: '', vi: `năm ${y}` },
    };
  }

  // kind === 3: Tính tuổi từ năm sinh (năm nay 2026)
  const thisYear = new Date().getFullYear();
  const born = randInt(thisYear - 16, thisYear - 6);
  const age = thisYear - born;
  const right = numToHanzi(age) + '岁';
  const wrongs = new Set();
  while (wrongs.size < 3) {
    const w = numToHanzi(randInt(5, 20)) + '岁';
    if (w !== right) wrongs.add(w);
  }
  return {
    lbl: `Bạn ấy sinh năm ${born}. Năm nay ${thisYear}, bạn ấy bao nhiêu tuổi?`,
    big: `我${yearToHanzi(born)}年出生。我今年 ? 岁。`,
    bigClass: 'hz',
    bigStyle: { fontSize: 'clamp(1.2rem, 4.5vw, 1.9rem)' },
    right,
    options: shuffle([right, ...wrongs]),
    render: (t) => el('span.hz', { style: { fontSize: '1.6rem' } }, t),
    review: { hz: right, py: '', vi: `${age} tuổi (sinh năm ${born})` },
  };
}

export function play(game, lesson, container) {
  const n = CONFIG.game.questionsPerRound;
  const shell = new Shell({ game, lesson, total: n });
  shell.attach(container);

  let i = 0;
  let locked = false;

  function next() {
    if (i >= n) return shell.finish();
    const q = makeQuestion(i % 4);
    locked = false;
    shell.progress(i, n);

    const timerFill = el('i', { style: { width: '100%' } });
    const timerBar = el('div.bar.timer', {}, timerFill);
    let fracLeft = 1;

    const optNodes = q.options.map((t, idx) => el('button.opt', {
      onclick: () => choose(t, idx),
    }, [el('span.key', {}, 'ABCD'[idx]), q.render(t)]));

    shell.setStage([
      el('div.wrap-sm', { style: { padding: 0 } }, [
        el('div.row', { style: { marginBottom: '14px' } }, [timerBar]),
        el('div.qbox', {}, [
          el('div.lbl', {}, q.lbl),
          el('div.' + q.bigClass, { style: q.bigStyle || {} }, q.big),
        ]),
        el('div.opts', {}, optNodes),
      ]),
    ]);

    shell.countdown(CONFIG.game.quizSeconds, (frac) => {
      fracLeft = frac;
      timerFill.style.width = frac * 100 + '%';
      timerBar.classList.toggle('warn', frac < 0.3);
    }, () => { if (!locked) choose(null, -1); });

    async function choose(t, idx) {
      if (locked) return;
      locked = true;
      shell.stopTimer();

      const ok = t === q.right;
      shell.mark(ok, ok ? timeScore(fracLeft, 120) : 100, q.review);
      speak(q.right);

      optNodes.forEach((node, k) => {
        node.classList.add('locked');
        if (q.options[k] === q.right) node.classList.add('correct');
        else if (k === idx) node.classList.add('wrong');
        else node.classList.add('dim');
      });

      await sleep(ok ? 900 : 1800);
      i++;
      next();
    }
  }

  next();
}
