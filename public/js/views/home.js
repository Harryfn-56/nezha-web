/**
 * TRANG CHÍNH CỦA HỌC SINH — chọn bài học và trò chơi, xem tiến độ.
 */

import { el, mount, go, fmtDate } from '../core.js';
import { GAMES } from '../data.js';
import { currentUser, myScores, listLessons, classLeaderboard, CLOUD } from '../store.js';
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
    style: { maxWidth: '440px', minWidth: '260px' },
    onchange: (e) => {
      localStorage.setItem(LESSON_KEY, e.target.value);
      view();
    },
  }, lessons.map((l) => el('option', {
    value: l.id,
    selected: l.id === lesson.id ? true : null,
  }, `${l.emoji || '📘'}  ${l.title}${l.code ? ' · ' + l.code : ''}`)));

  // Gợi ý trò tiếp theo: trò trong bài này em chưa chơi lần nào
  const notYet = GAMES.find((g) => !playedGames.has(g.id));
  const nextGame = (notYet || GAMES[0]).id;
  const nextLabel = notYet ? `Chơi thử ${notYet.name}` : 'Chơi tiếp';

  /* ------------------------------------------- bảng xếp hạng của lớp */
  const rankBody = el('div.card.center', { style: { minHeight: '90px' } }, 'Đang xem bảng xếp hạng lớp...');
  const rankSection = el('div', {}, [
    el('div.sec-title', { 'data-reveal': '0' }, [
      el('span.eyebrow.eyebrow-dark', {}, 'Thi đua'),
      el('h2', {}, `🏆 Bảng xếp hạng lớp ${u.classCode || ''}`),
      el('div.ln'),
    ]),
    rankBody,
  ]);

  classLeaderboard(u.classCode, 5).then(({ board, me, myRank, totalStudents }) => {
    rankBody.classList.remove('center');
    if (!board.length) {
      rankBody.replaceChildren(
        el('div.empty', {}, [
          el('div.ic', {}, '🏅'),
          el('div.bold', {}, 'Lớp mình chưa ai chơi cả'),
          el('div.small', {}, 'Em chơi một lượt là có tên trên bảng ngay!'),
        ]));
      return;
    }

    const inTop = board.some((s) => me && s.id === me.id);

    rankBody.replaceChildren(
      el('div.tbl-wrap', {}, el('table.tbl', {}, [
        el('thead', {}, el('tr', {}, [
          el('th', { style: { width: '52px' } }, '#'),
          el('th', {}, 'Bạn'),
          el('th', {}, 'Lượt chơi'),
          el('th', { style: { textAlign: 'right' } }, 'Tổng điểm'),
        ])),
        el('tbody', {}, [
          ...board.map((s, i) => el('tr' + (me && s.id === me.id ? '.me-row' : ''), {}, [
            el('td.rank', {}, i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : String(i + 1)),
            el('td.bold', {}, s.name + (me && s.id === me.id ? ' (em)' : '')),
            el('td', {}, String(s.plays)),
            el('td.bold', { style: { textAlign: 'right', color: 'var(--red-700)' } },
              s.totalScore.toLocaleString('vi-VN')),
          ])),
          // Nếu em chưa lọt top 5 thì vẫn hiện riêng 1 dòng cho em
          !inTop && me ? el('tr.me-row', {}, [
            el('td.rank', {}, String(myRank)),
            el('td.bold', {}, me.name + ' (em)'),
            el('td', {}, String(me.plays)),
            el('td.bold', { style: { textAlign: 'right', color: 'var(--red-700)' } },
              me.totalScore.toLocaleString('vi-VN')),
          ]) : null,
        ]),
      ])),

      el('div.row.wrapf', { style: { marginTop: '12px', justifyContent: 'center' } }, [
        myRank
          ? el('span.chip', {}, `Em đang xếp thứ ${myRank}/${totalStudents} trong lớp`)
          : el('span.chip.chip-soft', {}, 'Em chơi một lượt để có tên trên bảng nhé!'),
        myRank > 1 && board[myRank - 2]
          ? el('span.chip.chip-soft', {},
              `Còn ${(board[myRank - 2].totalScore - (me ? me.totalScore : 0)).toLocaleString('vi-VN')} điểm nữa là vượt bạn phía trên`)
          : null,
      ]),

      !CLOUD ? el('p.hint.tcenter', { style: { marginTop: '10px' } },
        '💾 Website đang chạy ngoại tuyến nên bảng này chỉ có dữ liệu trên máy này.') : null,
    );
  }).catch(() => {
    rankBody.replaceChildren(el('div.small.muted', {}, 'Chưa tải được bảng xếp hạng.'));
  });

  /* --------------------------------------------------------- render */
  mount(page(el('div.wrap.stack', { style: { '--gap': '22px' } }, [

    el('section.hero', { 'data-reveal': '0' }, [
      el('img.hero-fig', { src: '/assets/logo-trong-suot.png', alt: '' }),
      el('span.eyebrow', {}, `${u.className || u.classCode}`),
      el('h1', {}, `Chào ${u.name}!`),
      el('p', {}, lesson.subtitle
        ? `Hôm nay ôn: ${lesson.title} — ${lesson.subtitle}.`
        : `Hôm nay ôn: ${lesson.title}.`),
      el('div.hero-cta', {}, [
        el('button.btn.btn-gold.btn-lg.btn-pill', {
          onclick: () => go(`/choi/${lesson.id}/${nextGame}`),
        }, [nextLabel, el('span.knob', {}, '→')]),
        el('a.btn.btn-ghost.btn-lg.btn-pill', { href: '/bang-so', 'data-link': '' },
          ['Bảng số 1–99', el('span.knob', {}, '🔢')]),
      ]),
    ]),

    el('div.row.wrapf', { 'data-reveal': '60' }, [
      el('div', {}, [
        el('div.small.bold', { style: { marginBottom: '5px' } }, '📘 Chọn bài để ôn'),
        lessonPicker,
      ]),
      el('div.grow'),
    ]),

    el('div.stat-row', { 'data-reveal': '90' }, [
      ringDefs(),
      stat('Tổng điểm', totalPoints.toLocaleString('vi-VN'), '', '🏅'),
      stat('Độ chính xác', acc + '%', '', null, acc),
      stat('Lượt chơi', String(scores.length), '', '🎮'),
      stat('Trò đã thử', `${playedGames.size}`, `/${GAMES.length}`, null,
        Math.round((playedGames.size / GAMES.length) * 100)),
      stat('Từ trong bài', String(lesson.words.length), '', '📘'),
    ]),

    el('div', {}, [
      el('div.sec-title', { 'data-reveal': '0' }, [
        el('span.eyebrow.eyebrow-dark', {}, `${GAMES.length} trò`),
        el('h2', {}, 'Chọn trò chơi'), el('div.ln'),
      ]),
      el('div.game-grid', {}, GAMES.map((g) => el('button.game-card.c-' + g.color, {
        onclick: () => go(`/choi/${lesson.id}/${g.id}`),
      }, el('span.gc-in', {}, [
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
      ])))),
    ]),

    rankSection,

    el('div', {}, [
      el('div.sec-title', { 'data-reveal': '0' }, [
        el('span.eyebrow.eyebrow-dark', {}, 'Nhật ký'),
        el('h2', {}, 'Lịch sử gần đây'), el('div.ln'),
      ]),
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

/** Một ô thống kê: có thể kèm biểu tượng hoặc vòng tròn tiến độ */
function stat(k, v, sub = '', icon = null, pct = null) {
  const side = pct !== null ? ring(pct) : icon ? el('div.ic-badge', {}, icon) : null;
  return el('div.stat', {}, el('div.stat-in', {}, [
    side,
    el('div.grow', {}, [
      el('div.k', {}, k),
      el('div.v', {}, [v, sub ? el('small', {}, sub) : null]),
    ]),
  ]));
}

/** Vòng tròn tiến độ nhỏ (SVG thuần, không cần thư viện) */
function ring(pct) {
  const p = Math.max(0, Math.min(100, Number(pct) || 0));
  const R = 16;
  const C = 2 * Math.PI * R;
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'ring');
  svg.setAttribute('viewBox', '0 0 40 40');
  svg.innerHTML =
    `<circle class="bg" cx="20" cy="20" r="${R}"></circle>` +
    `<circle class="fg" cx="20" cy="20" r="${R}" transform="rotate(-90 20 20)"` +
    ` stroke-dasharray="${C}" stroke-dashoffset="${C}"></circle>`;
  setTimeout(() => {
    const fg = svg.querySelector('.fg');
    if (fg) fg.setAttribute('stroke-dashoffset', String(C * (1 - p / 100)));
  }, 120);
  return svg;
}

/** Khai báo dải màu dùng chung cho các vòng tròn tiến độ */
function ringDefs() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '0');
  svg.setAttribute('height', '0');
  svg.style.position = 'absolute';
  svg.innerHTML =
    '<defs><linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">' +
    '<stop offset="0%" stop-color="#FFC02E"/><stop offset="100%" stop-color="#C42A1E"/>' +
    '</linearGradient></defs>';
  return svg;
}
