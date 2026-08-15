/**
 * TRANG CHÍNH CỦA HỌC SINH — chọn bài học và trò chơi, xem tiến độ.
 */

import { el, mount, go, fmtDate } from '../core.js';
import { GAMES } from '../data.js';
import { currentUser, myScores, listLessons } from '../store.js';
import { page } from './layout.js';

const LESSON_KEY = 'nz_lesson';

export async function view() {
  const u = currentUser();
  if (!u) return go('/', true);

  const lessons = await listLessons();
  let lessonId = localStorage.getItem(LESSON_KEY);
  if (!lessons.some((l) => l.id === lessonId)) lessonId = lessons[0].id;
  const lesson = lessons.find((l) => l.id === lessonId);

  const scores = await myScores();
  const mine = scores.filter((s) => s.lesson_id === lesson.id);
  const totalPoints = scores.reduce((s, r) => s + (r.score || 0), 0);
  const totalCorrect = scores.reduce((s, r) => s + (r.correct_count || 0), 0);
  const totalQ = scores.reduce((s, r) => s + (r.total_count || 0), 0);
  const acc = totalQ ? Math.round((totalCorrect / totalQ) * 100) : 0;
  const playedGames = new Set(mine.map((s) => s.game_id));

  // Điểm cao nhất của từng game trong bài này
  const best = {};
  for (const s of mine) {
    best[s.game_id] = Math.max(best[s.game_id] || 0, s.score || 0);
  }

  /* --------------------------------------------------------- chọn bài */
  const lessonPicker = el('select.input', {
    style: { maxWidth: '330px' },
    onchange: (e) => {
      localStorage.setItem(LESSON_KEY, e.target.value);
      view();
    },
  }, lessons.map((l) => el('option', {
    value: l.id,
    selected: l.id === lesson.id ? true : null,
  }, `${l.emoji || '📘'}  ${l.title}${l.code ? ' · ' + l.code : ''}`)));

  /* --------------------------------------------------------- render */
  mount(page(el('div.wrap.stack', { style: { '--gap': '22px' } }, [

    el('section.hero', {}, [
      el('img.hero-fig', { src: '/assets/logo-trong-suot.png', alt: '' }),
      el('span.chip', {}, `👋 ${u.className || u.classCode}`),
      el('h1', { style: { marginTop: '10px' } }, `Chào ${u.name}!`),
      el('p', {}, lesson.subtitle
        ? `Hôm nay ôn: ${lesson.title} — ${lesson.subtitle}.`
        : `Hôm nay ôn: ${lesson.title}.`),
    ]),

    el('div.row.wrapf', {}, [
      el('div', {}, [
        el('div.small.bold', { style: { marginBottom: '5px' } }, '📘 Chọn bài để ôn'),
        lessonPicker,
      ]),
      el('div.grow'),
    ]),

    el('div.stat-row', {}, [
      stat('Tổng điểm', totalPoints.toLocaleString('vi-VN')),
      stat('Độ chính xác', acc + '%'),
      stat('Lượt chơi', String(scores.length)),
      stat('Trò đã thử', `${playedGames.size}`, `/${GAMES.length}`),
      stat('Từ trong bài', String(lesson.words.length)),
    ]),

    el('div', {}, [
      el('div.sec-title', {}, [el('h2', {}, '🎮 Chọn trò chơi'), el('div.ln')]),
      el('div.game-grid', {}, GAMES.map((g) => el('button.game-card.c-' + g.color, {
        onclick: () => go(`/choi/${lesson.id}/${g.id}`),
      }, [
        el('div.ic', {}, g.icon),
        el('h3', {}, g.name),
        el('div.cn', {}, g.cn),
        el('p', {}, g.desc),
        el('div.meta', {}, [
          el('span.chip.chip-soft', {}, g.skill),
          best[g.id]
            ? el('span.chip', {}, `🏆 ${best[g.id]}`)
            : el('span.tiny.muted', {}, 'Chưa chơi'),
        ]),
      ]))),
    ]),

    el('div', {}, [
      el('div.sec-title', {}, [el('h2', {}, '📜 Lịch sử gần đây'), el('div.ln')]),
      scores.length
        ? el('div.tbl-wrap', {}, el('table.tbl', {}, [
            el('thead', {}, el('tr', {}, [
              el('th', {}, 'Thời gian'), el('th', {}, 'Trò chơi'),
              el('th', {}, 'Đúng'), el('th', {}, 'Điểm'),
            ])),
            el('tbody', {}, scores.slice(0, 12).map((s) => {
              const g = GAMES.find((x) => x.id === s.game_id);
              return el('tr', {}, [
                el('td.small.muted', {}, fmtDate(s.played_at)),
                el('td', {}, `${g ? g.icon + ' ' + g.name : s.game_id}`),
                el('td', {}, `${s.correct_count}/${s.total_count}`),
                el('td.bold', { style: { color: 'var(--red-700)' } }, String(s.score)),
              ]);
            })),
          ]))
        : el('div.card.empty', {}, [
            el('div.ic', {}, '🎯'),
            el('div.bold', {}, 'Em chưa chơi trò nào cả'),
            el('div.small', {}, 'Chọn một trò chơi phía trên để bắt đầu nhé!'),
          ]),
    ]),
  ])));
}

function stat(k, v, sub = '') {
  return el('div.stat', {}, [
    el('div.k', {}, k),
    el('div.v', {}, [v, sub ? el('small', {}, sub) : null]),
  ]);
}
