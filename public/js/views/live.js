/**
 * CHẾ ĐỘ KAHOOT — ôn bài đầu giờ cả lớp cùng chơi.
 *
 * Giáo viên: /live        → chọn bài, tạo phòng, chiếu mã PIN lên máy chiếu
 * Học sinh:  /vao-phong   → nhập mã PIN, trả lời trên điện thoại
 *
 * Đồng bộ bằng cách hỏi máy chủ mỗi ~1 giây (bền hơn websocket trên wifi lớp học).
 */

import { el, mount, go, clear, shuffle, sample, sleep, speak, sfx, confetti, toast } from '../core.js';
import { CONFIG } from '../config.js';
import {
  currentUser, listLessons, makePin, createRoom, getRoom, updateRoom, closeRoom,
  joinRoom, listPlayers, submitAnswer, watchRoom, CLOUD,
} from '../store.js';
import { page } from './layout.js';

const SYMS = ['▲', '◆', '●', '■'];

/** Tạo bộ câu hỏi trắc nghiệm từ bài học */
function makeQuestions(lesson, count) {
  const picked = sample(lesson.words, Math.min(count, lesson.words.length));
  return picked.map((w, i) => {
    const others = shuffle(lesson.words.filter((x) => x.hz !== w.hz)).slice(0, 3);
    const opts = shuffle([w, ...others]);
    // Xen kẽ hỏi nghĩa và hỏi Hán tự cho đỡ nhàm
    const askMeaning = i % 2 === 0;
    return {
      hz: w.hz,
      py: w.py,
      vi: w.vi,
      ask: askMeaning ? 'hz2vi' : 'vi2hz',
      prompt: askMeaning ? w.hz : w.vi,
      options: opts.map((o) => (askMeaning ? o.vi : o.hz)),
      answer: opts.findIndex((o) => o.hz === w.hz),
    };
  });
}

/* ==================================================================== */
/*  MÀN HÌNH GIÁO VIÊN                                                  */
/* ==================================================================== */

export async function host() {
  const u = currentUser();
  if (!u || u.role !== 'teacher') return go('/', true);

  const lessons = await listLessons();
  const root = el('div.wrap');
  mount(page(root));

  let stopWatch = null;
  let pin = null;
  let questions = [];

  /* ------------------------------------------------- màn hình cài đặt */
  function setupScreen() {
    const lessonSel = el('select.input', {}, lessons.map((l) =>
      el('option', { value: l.id }, `${l.emoji || '📘'} ${l.title}`)));
    const countSel = el('select.input', {},
      [5, 8, 10, 12, 15, 20].map((n) => el('option', { value: n, selected: n === 10 ? true : null }, `${n} câu`)));
    const secSel = el('select.input', {},
      [10, 15, 20, 25, 30].map((n) => el('option', { value: n, selected: n === CONFIG.game.liveSeconds ? true : null }, `${n} giây/câu`)));

    clear(root);
    root.append(el('div.wrap-sm', { style: { padding: 0 } }, [
      el('div.hero', { style: { marginBottom: '22px' } }, [
        el('span.chip', {}, '⚡ Chế độ thi đấu'),
        el('h1', { style: { marginTop: '10px' } }, 'Ôn bài đầu giờ'),
        el('p', {}, 'Tạo phòng, chiếu mã PIN lên máy chiếu. Học sinh vào bằng điện thoại và cùng thi đua.'),
      ]),

      !CLOUD ? el('div.alert', { style: { marginBottom: '18px' } },
        '⚠️ Chưa bật Supabase nên phòng chỉ chạy trên chính máy này (dùng cho chế độ chiếu, cả lớp trả lời miệng). Bật Supabase ở Quản trị → Kết nối để học sinh vào bằng điện thoại.') : null,

      el('div.card', {}, [
        el('label.field', {}, [el('span', {}, 'Chọn bài ôn tập'), lessonSel]),
        el('div.row.wrapf', {}, [
          el('label.field.grow', {}, [el('span', {}, 'Số câu hỏi'), countSel]),
          el('label.field.grow', {}, [el('span', {}, 'Thời gian mỗi câu'), secSel]),
        ]),
        el('button.btn.btn-lg.btn-block', {
          onclick: async () => {
            const lesson = lessons.find((l) => l.id === lessonSel.value);
            questions = makeQuestions(lesson, Number(countSel.value));
            if (questions.length < 4) return toast('Bài này quá ít từ để chơi', 'bad');
            // Gắn thời gian vào từng câu để máy học sinh chạy đúng đồng hồ
            questions.forEach((q) => { q.secs = Number(secSel.value); });
            pin = makePin();
            try {
              await createRoom(pin, lesson.id, questions);
              sessionStorage.setItem('nz_live_secs', secSel.value);
              lobbyScreen();
            } catch (e) { toast('Không tạo được phòng: ' + e.message, 'bad'); }
          },
        }, '🚀 Tạo phòng chơi'),
      ]),
    ]));
  }

  /* ------------------------------------------------------ phòng chờ */
  function lobbyScreen() {
    const playersBox = el('div.lobby-players');
    const countTag = el('span.chip', {}, '0 học sinh');
    const startBtn = el('button.btn.btn-lg', {
      onclick: () => { if (stopWatch) stopWatch(); runQuestion(0); },
    }, '▶️ Bắt đầu chơi');

    clear(root);
    root.append(el('div.tcenter', {}, [
      el('p.muted', { style: { marginBottom: '4px' } }, 'Học sinh vào web rồi bấm "Vào phòng" và nhập mã:'),
      el('div.pin-display', {}, pin.replace(/(\d{3})(\d{3})/, '$1 $2')),
      el('p.muted', {}, `Hoặc mở thẳng: ${location.origin}/vao-phong`),
      el('div.row', { style: { justifyContent: 'center', margin: '20px 0' } }, [countTag]),
      playersBox,
      el('div.row', { style: { justifyContent: 'center', marginTop: '28px' } }, [
        startBtn,
        el('button.btn.btn-ghost', {
          onclick: async () => { if (stopWatch) stopWatch(); await closeRoom(pin); setupScreen(); },
        }, 'Huỷ phòng'),
      ]),
      el('p.hint', { style: { marginTop: '18px' } }, `${questions.length} câu hỏi đã sẵn sàng`),
    ]));

    let known = 0;
    stopWatch = watchRoom(pin, (room, players) => {
      countTag.textContent = `${players.length} học sinh`;
      if (players.length !== known) {
        if (players.length > known) sfx.join();
        known = players.length;
        playersBox.replaceChildren(...players.map((p) => el('div.player-tag', {}, p.name)));
      }
      startBtn.disabled = players.length === 0 && CLOUD;
    });
  }

  /* ------------------------------------------------- chạy từng câu */
  async function runQuestion(idx) {
    if (idx >= questions.length) return endScreen();

    const q = questions[idx];
    const secs = Number(q.secs) || Number(sessionStorage.getItem('nz_live_secs')) || CONFIG.game.liveSeconds;
    await updateRoom(pin, { phase: 'question', q_index: idx, question_started_at: new Date().toISOString() });

    const clock = el('div.countdown', {}, String(secs));
    const answeredTag = el('span.chip', {}, '0 đã trả lời');
    const barFill = el('i', { style: { width: '100%' } });

    clear(root);
    root.append(el('div', {}, [
      el('div.row-between', { style: { marginBottom: '14px' } }, [
        el('span.chip', {}, `Câu ${idx + 1}/${questions.length}`),
        answeredTag,
        clock,
      ]),
      el('div.bar.timer', { style: { marginBottom: '20px' } }, barFill),
      el('div.qbox', {}, [
        el('div.lbl', {}, q.ask === 'hz2vi' ? 'Từ này nghĩa là gì?' : 'Từ nào có nghĩa là'),
        q.ask === 'hz2vi'
          ? el('div.q-hz', {}, q.prompt)
          : el('div.q-vi', {}, `“${q.prompt}”`),
      ]),
      el('div.k-opts', {}, q.options.map((o, i) => el('div.k-opt.k-' + i, {}, [
        el('span.sym', {}, SYMS[i]),
        el('span', { class: q.ask === 'vi2hz' ? 'hz' : '' }, o),
      ]))),

      // Học sinh chỉ thấy đáp án khi thầy/cô công bố. Bình thường website tự
      // công bố khi cả lớp trả lời xong hoặc hết giờ; nút này để công bố sớm
      // (ví dụ có bạn vắng, máy hỏng, không bấm được).
      el('div.row', { style: { justifyContent: 'center', marginTop: '18px' } },
        el('button.btn.btn-ghost', { onclick: () => finish() }, '👁️ Công bố đáp án ngay')),
    ]));

    if (q.ask === 'hz2vi') speak(q.hz);

    const t0 = Date.now();
    let stopPoll = watchRoom(pin, (room, players) => {
      const n = players.filter((p) => p.answered_index === idx).length;
      answeredTag.textContent = `${n}/${players.length} đã trả lời`;
      // CẢ LỚP trả lời xong mới công bố đáp án (nếu chưa hết giờ)
      if (players.length && n >= players.length) {
        answeredTag.textContent = `✅ Cả lớp đã trả lời (${n}/${players.length})`;
        setTimeout(finish, 700);
      }
    }, 900);

    let ended = false;
    const iv = setInterval(() => {
      const left = Math.max(0, secs * 1000 - (Date.now() - t0));
      clock.textContent = String(Math.ceil(left / 1000));
      barFill.style.width = (left / (secs * 1000)) * 100 + '%';
      if (left <= 5000) sfx.tick();
      if (left <= 0) finish();
    }, 250);

    async function finish() {
      if (ended) return;
      ended = true;
      clearInterval(iv);
      if (stopPoll) stopPoll();
      await revealScreen(idx, q);
    }
  }

  /* ------------------------------------------------ công bố đáp án */
  async function revealScreen(idx, q) {
    await updateRoom(pin, { phase: 'reveal', q_index: idx });
    speak(q.hz);
    sfx.win();

    const players = await listPlayers(pin);
    const top = players.slice(0, 5);

    clear(root);
    root.append(el('div', {}, [
      el('div.qbox', {}, [
        el('div.lbl', {}, 'Đáp án đúng'),
        el('div.q-hz', {}, q.hz),
        el('div.py.q-py', {}, q.py),
        el('div.bold', { style: { fontSize: '1.25rem' } }, q.vi),
      ]),
      el('div.k-opts', {}, q.options.map((o, i) => el('div.k-opt.k-' + i + (i === q.answer ? '' : '.faded'), {}, [
        el('span.sym', {}, i === q.answer ? '✔' : SYMS[i]),
        el('span', { class: q.ask === 'vi2hz' ? 'hz' : '' }, o),
      ]))),

      top.length ? el('div', { style: { marginTop: '24px' } }, [
        el('div.sec-title', {}, [el('h2', {}, '🏆 Bảng xếp hạng'), el('div.ln')]),
        el('div.tbl-wrap', {}, el('table.tbl', {}, [
          el('tbody', {}, top.map((p, i) => el('tr', {}, [
            el('td.rank', { style: { width: '52px' } }, i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : String(i + 1)),
            el('td.bold', {}, p.name),
            el('td', { style: { textAlign: 'right', fontWeight: 800, color: 'var(--red-700)' } }, String(p.score)),
          ]))),
        ])),
      ]) : null,

      el('div.row', { style: { justifyContent: 'center', marginTop: '24px' } }, [
        el('button.btn.btn-lg', {
          onclick: () => runQuestion(idx + 1),
        }, idx + 1 >= questions.length ? '🏁 Xem kết quả' : 'Câu tiếp theo →'),
      ]),
    ]));
  }

  /* --------------------------------------------------- kết thúc */
  async function endScreen() {
    await updateRoom(pin, { phase: 'end' });
    const players = await listPlayers(pin);
    const [p1, p2, p3] = players;
    confetti(140);
    sfx.win();

    clear(root);
    root.append(el('div.tcenter', {}, [
      el('h1', {}, '🎊 Kết thúc! 太棒了！'),
      el('div.podium', {}, [
        p2 ? el('div.col.p2', {}, [el('div.nm', {}, p2.name), el('div.bl', {}, '2'), el('div.sc', {}, p2.score + 'đ')]) : null,
        p1 ? el('div.col.p1', {}, [el('div.nm', {}, p1.name), el('div.bl', {}, '1'), el('div.sc', {}, p1.score + 'đ')]) : null,
        p3 ? el('div.col.p3', {}, [el('div.nm', {}, p3.name), el('div.bl', {}, '3'), el('div.sc', {}, p3.score + 'đ')]) : null,
      ]),
      players.length ? el('div.tbl-wrap', { style: { maxWidth: '560px', margin: '0 auto' } },
        el('table.tbl', {}, [
          el('thead', {}, el('tr', {}, [el('th', {}, '#'), el('th', {}, 'Học sinh'), el('th', {}, 'Đúng'), el('th', {}, 'Điểm')])),
          el('tbody', {}, players.map((p, i) => el('tr', {}, [
            el('td.rank', {}, String(i + 1)),
            el('td.bold', {}, p.name),
            el('td', {}, `${p.correct_count}/${questions.length}`),
            el('td.bold', {}, String(p.score)),
          ]))),
        ])) : el('p.muted', {}, 'Không có học sinh nào tham gia.'),
      el('div.row', { style: { justifyContent: 'center', marginTop: '26px' } }, [
        el('button.btn.btn-lg', { onclick: async () => { await closeRoom(pin); setupScreen(); } }, '🔄 Tạo phòng mới'),
        el('a.btn.btn-ghost', { href: '/quan-tri', 'data-link': '' }, 'Về trang quản trị'),
      ]),
    ]));
  }

  window.addEventListener('popstate', () => { if (stopWatch) stopWatch(); }, { once: true });
  setupScreen();
}

/* ==================================================================== */
/*  MÀN HÌNH HỌC SINH                                                   */
/* ==================================================================== */

export function join() {
  const u = currentUser();
  const root = el('div.wrap');
  mount(page(root));

  let stopWatch = null;
  let player = null;
  let pin = null;
  let lastPhase = null;
  let lastIndex = -1;
  let myScore = 0;
  /**
   * Câu trả lời đang chờ công bố.
   * Học sinh chọn xong CHƯA biết đúng/sai — phải đợi cả lớp trả lời hoặc hết
   * giờ, khi thầy/cô công bố (phase = 'reveal') mới hiện kết quả.
   */
  let pending = null;

  function joinScreen() {
    const pinInput = el('input.input.input-lg', {
      inputmode: 'numeric',
      placeholder: '000000',
      maxlength: '6',
      style: { textAlign: 'center', letterSpacing: '.28em', fontSize: '1.7rem', fontWeight: '800' },
    });
    const nameInput = el('input.input.input-lg', {
      placeholder: 'Họ tên của em',
      value: u ? u.name : (localStorage.getItem('nz_lastname') || ''),
    });

    clear(root);
    root.append(el('div.wrap-sm', { style: { padding: 0 } }, [
      el('div.tcenter', { style: { marginBottom: '22px' } }, [
        el('div', { style: { fontSize: '3rem' } }, '⚡'),
        el('h1', {}, 'Vào phòng thi đấu'),
        el('p.muted', {}, 'Nhập mã PIN thầy/cô chiếu trên màn hình'),
      ]),
      el('div.card', {}, [
        el('label.field', {}, [el('span', {}, 'Mã PIN'), pinInput]),
        el('label.field', {}, [el('span', {}, 'Tên của em'), nameInput]),
        el('button.btn.btn-lg.btn-block', {
          onclick: async () => {
            const p = pinInput.value.trim();
            const n = nameInput.value.trim();
            if (p.length !== 6) return toast('Mã PIN gồm 6 chữ số', 'bad');
            if (n.length < 2) return toast('Em nhập tên nhé', 'bad');
            try {
              pin = p;
              player = await joinRoom(p, n, u ? u.classCode : '');
              sfx.join();
              waitScreen();
            } catch (e) { toast(e.message, 'bad'); }
          },
        }, '🎮 Vào phòng'),
      ]),
      el('p.hint.tcenter', { style: { marginTop: '16px' } },
        u ? '' : 'Chưa đăng nhập? Vẫn chơi được, nhưng điểm sẽ không lưu vào hồ sơ của em.'),
    ]));
    setTimeout(() => pinInput.focus(), 80);
  }

  function waitScreen() {
    clear(root);
    root.append(el('div.tcenter', { style: { paddingTop: '40px' } }, [
      el('div', { style: { fontSize: '3.4rem' } }, '⏳'),
      el('h1', {}, 'Đã vào phòng!'),
      el('p.muted', {}, 'Chờ thầy/cô bắt đầu nhé...'),
      el('div.player-tag', { style: { display: 'inline-block', marginTop: '10px' } }, player.name),
      el('div', { style: { marginTop: '24px' } },
        el('span.chip.chip-soft', {}, `Mã phòng: ${pin}`)),
    ]));
    startWatching();
  }

  function startWatching() {
    if (stopWatch) stopWatch();
    stopWatch = watchRoom(pin, (room) => {
      if (!room) { toast('Phòng đã đóng'); if (stopWatch) stopWatch(); joinScreen(); return; }
      if (room.phase === lastPhase && room.q_index === lastIndex) return;
      lastPhase = room.phase;
      lastIndex = room.q_index;

      if (room.phase === 'question') answerScreen(room);
      else if (room.phase === 'reveal') resultScreen(room);
      else if (room.phase === 'end') finalScreen();
    }, 1000);
  }

  function answerScreen(room) {
    const q = room.questions[room.q_index];
    if (!q) return;
    const secs = Number(q.secs) || CONFIG.game.liveSeconds;
    const started = new Date(room.question_started_at).getTime();
    let answered = false;

    const status = el('div.tcenter', { style: { marginBottom: '14px' } },
      el('span.chip', {}, `Câu ${room.q_index + 1}`));
    const barFill = el('i', { style: { width: '100%' } });

    const opts = q.options.map((o, i) => el('button.k-opt.k-' + i, {
      onclick: () => pick(i),
    }, [
      el('span.sym', {}, SYMS[i]),
      el('span', { class: q.ask === 'vi2hz' ? 'hz' : '' }, o),
    ]));

    clear(root);
    root.append(el('div.wrap-sm', { style: { padding: 0 } }, [
      status,
      el('div.bar.timer', { style: { marginBottom: '16px' } }, barFill),
      el('div.qbox', { style: { padding: '20px' } }, [
        el('div.lbl', {}, q.ask === 'hz2vi' ? 'Từ này nghĩa là gì?' : 'Từ nào có nghĩa là'),
        q.ask === 'hz2vi'
          ? el('div.hz', { style: { fontSize: 'clamp(2.4rem,12vw,3.6rem)' } }, q.prompt)
          : el('div.q-vi', {}, `“${q.prompt}”`),
      ]),
      el('div.k-opts', {}, opts),
    ]));

    const iv = setInterval(() => {
      const left = Math.max(0, secs * 1000 - (Date.now() - started));
      barFill.style.width = (left / (secs * 1000)) * 100 + '%';
      if (left <= 0) { clearInterval(iv); if (!answered) lockOut(); }
    }, 200);

    async function pick(i) {
      if (answered) return;
      answered = true;
      clearInterval(iv);

      const left = Math.max(0, secs * 1000 - (Date.now() - started));
      const ok = i === q.answer;
      // Điểm theo tốc độ: trả lời càng nhanh càng nhiều (tối đa 1000 như Kahoot)
      const gained = ok ? Math.round(500 + 500 * (left / (secs * 1000))) : 0;

      // Ghi nhớ để công bố sau — CHƯA cộng điểm, CHƯA nói đúng/sai
      pending = { index: room.q_index, choice: i, ok, gained, q };
      sfx.flip();

      // Gửi lên máy chủ ngay để thầy/cô đếm được "bao nhiêu bạn đã trả lời"
      try { await submitAnswer(pin, player.id, room.q_index, gained, ok); } catch (e) { console.warn(e); }

      clear(root);
      root.append(el('div.tcenter', { style: { paddingTop: '40px' } }, [
        el('div', { style: { fontSize: '3.6rem' } }, '📨'),
        el('h1', {}, 'Đã ghi nhận!'),
        el('p.muted', {}, 'Em đã chọn:'),
        el('div.k-opts', { style: { maxWidth: '340px', margin: '10px auto 0' } },
          el('div.k-opt.k-' + i, {}, [
            el('span.sym', {}, SYMS[i]),
            el('span', { class: q.ask === 'vi2hz' ? 'hz' : '' }, q.options[i]),
          ])),
        el('p.hint', { style: { marginTop: '20px' } },
          '⏳ Chờ các bạn trả lời xong, thầy/cô sẽ công bố đáp án.'),
        el('div', { style: { marginTop: '16px' } },
          el('span.chip.chip-soft', {}, `Tổng điểm hiện tại: ${myScore}`)),
      ]));
    }

    function lockOut() {
      if (answered) return;
      answered = true;
      pending = { index: room.q_index, choice: -1, ok: false, gained: 0, q };
      clear(root);
      root.append(el('div.tcenter', { style: { paddingTop: '46px' } }, [
        el('div', { style: { fontSize: '4rem' } }, '⏰'),
        el('h1', {}, 'Hết giờ!'),
        el('p.muted', {}, 'Em chưa kịp chọn đáp án.'),
        el('p.hint', {}, 'Chờ thầy/cô công bố đáp án nhé...'),
      ]));
    }
  }

  /** Thầy/cô bấm công bố (phase = reveal) → lúc này học sinh mới biết đúng/sai */
  function resultScreen(room) {
    const q = (pending && pending.q) || (room.questions || [])[room.q_index];
    if (!q) return;

    const answeredThis = pending && pending.index === room.q_index;
    const ok = !!(answeredThis && pending.ok);
    const gained = answeredThis ? pending.gained : 0;
    const choice = answeredThis ? pending.choice : -1;

    if (answeredThis) myScore += gained;
    pending = null;

    ok ? sfx.correct() : sfx.wrong();

    clear(root);
    root.append(el('div.wrap-sm', { style: { padding: 0 } }, [
      el('div.tcenter', { style: { paddingTop: '26px' } }, [
        el('div', { style: { fontSize: '4rem' } }, ok ? '🎉' : choice < 0 ? '⏰' : '💪'),
        el('h1', {}, ok ? 'Chính xác!' : choice < 0 ? 'Không kịp trả lời' : 'Chưa đúng rồi'),
        ok ? el('div.big-score', { style: { color: 'var(--red-600)' } }, '+' + gained) : null,
      ]),
      el('div.qbox', { style: { marginTop: '10px' } }, [
        el('div.lbl', {}, 'Đáp án đúng'),
        el('div.q-hz', {}, q.hz),
        el('div.py.q-py', {}, q.py),
        el('div.bold', { style: { fontSize: '1.15rem' } }, q.vi),
      ]),
      el('div.k-opts', {}, q.options.map((o, i) => el('div.k-opt.k-' + i + (i === q.answer ? '' : '.faded'), {}, [
        el('span.sym', {}, i === q.answer ? '✔' : i === choice ? '✘' : SYMS[i]),
        el('span', { class: q.ask === 'vi2hz' ? 'hz' : '' }, o),
      ]))),
      el('p.muted.tcenter', { style: { marginTop: '16px' } }, `Tổng điểm của em: ${myScore}`),
      el('p.hint.tcenter', {}, 'Chờ câu tiếp theo...'),
    ]));
  }

  async function finalScreen() {
    if (stopWatch) stopWatch();
    const players = await listPlayers(pin);
    const rank = players.findIndex((p) => p.id === player.id) + 1;
    if (rank <= 3) confetti(120);
    sfx.win();

    clear(root);
    root.append(el('div.tcenter', { style: { paddingTop: '30px' } }, [
      el('div', { style: { fontSize: '3.6rem' } }, rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '🎯'),
      el('h1', {}, rank ? `Em xếp thứ ${rank}/${players.length}` : 'Kết thúc!'),
      el('div.big-score', { style: { color: 'var(--red-600)' } }, String(myScore)),
      el('div.tbl-wrap', { style: { maxWidth: '460px', margin: '22px auto' } },
        el('table.tbl', {}, el('tbody', {}, players.slice(0, 10).map((p, i) => el('tr', {
          style: p.id === player.id ? { background: 'var(--gold-100)' } : {},
        }, [
          el('td.rank', { style: { width: '46px' } }, String(i + 1)),
          el('td.bold', {}, p.name),
          el('td', { style: { textAlign: 'right', fontWeight: 800 } }, String(p.score)),
        ]))))),
      el('a.btn.btn-lg', { href: u ? '/hoc' : '/', 'data-link': '' }, 'Về trang chính'),
    ]));
  }

  window.addEventListener('popstate', () => { if (stopWatch) stopWatch(); }, { once: true });
  joinScreen();
}
