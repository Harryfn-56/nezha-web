/**
 * TRANG QUẢN TRỊ CỦA GIÁO VIÊN
 * 4 thẻ: Bảng điểm · Lớp học · Bài học (tải file Word/PDF) · Kết nối
 */

import { el, mount, go, toast, fmtDate, clear } from '../core.js';
import { GAMES } from '../data.js';
import {
  currentUser, allScores, summarise, listClasses, addClass, removeClass,
  listLessons, saveLesson, deleteLesson, pingCloud, CLOUD,
  listTeachers, saveTeacher, removeTeacher, canSeeClass, assignClassToSelf,
} from '../store.js';
import { extractText, parseVocab, buildLesson } from '../importer.js';
import { page } from './layout.js';

export async function view() {
  const u = currentUser();
  if (!u || u.role !== 'teacher') return go('/', true);

  const isAdmin = !!u.isAdmin;
  const panel = el('div');

  const tabs = [
    ['scores', '📊 Bảng điểm'],
    ['classes', '🏫 Lớp học'],
    ['lessons', '📚 Bài học'],
    ...(isAdmin ? [['teachers', '👩‍🏫 Giáo viên'], ['cloud', '☁️ Kết nối']] : []),
  ];

  let tab = sessionStorage.getItem('nz_admin_tab') || 'scores';
  if (!tabs.some(([id]) => id === tab)) tab = 'scores';

  const tabBar = el('div.seg', { style: { maxWidth: '560px' } },
    tabs.map(([id, label]) => el('button' + (tab === id ? '.on' : ''), {
      onclick: () => {
        tab = id;
        sessionStorage.setItem('nz_admin_tab', id);
        Array.from(tabBar.children).forEach((b, i) => b.classList.toggle('on', tabs[i][0] === id));
        draw();
      },
    }, label))
  );

  function draw() {
    clear(panel);
    if (tab === 'scores') renderScores(panel, u);
    else if (tab === 'classes') renderClasses(panel, u);
    else if (tab === 'lessons') renderLessons(panel);
    else if (tab === 'teachers') renderTeachers(panel);
    else renderCloud(panel);
  }

  mount(page(el('div.wrap.stack', { style: { '--gap': '20px' } }, [
    el('div.row-between.wrapf', {}, [
      el('div', {}, [
        el('h1', { style: { marginBottom: '2px' } }, 'Trang quản trị'),
        el('p.muted.mb-0', {}, isAdmin
          ? 'Quản trị viên — xem được tất cả các lớp và cấp tài khoản cho giáo viên'
          : `Xin chào ${u.name} — thầy/cô đang xem ${(u.classes || []).length
              ? 'lớp: ' + (u.classes || []).join(', ') : 'lớp được phân công'}`),
      ]),
      el('a.btn.btn-orange', { href: '/live', 'data-link': '' }, '⚡ Mở phòng Kahoot'),
    ]),
    tabBar,
    panel,
  ])));

  draw();
}

/* ==================================================================== */
/*  Thẻ 1 — Bảng điểm                                                   */
/* ==================================================================== */

async function renderScores(host, user) {
  host.append(el('div.card.center', { style: { minHeight: '120px' } }, 'Đang tải dữ liệu...'));

  const [allClasses, allRows] = await Promise.all([listClasses(), allScores()]);

  // Giáo viên thường chỉ thấy lớp mình phụ trách
  const classes = allClasses.filter((c) => canSeeClass(user, c.code));
  const rows = allRows.filter((r) => canSeeClass(user, r.class_code));

  if (!user.isAdmin && !classes.length) {
    clear(host);
    host.append(el('div.card.empty', {}, [
      el('div.ic', {}, '🔒'),
      el('div.bold', {}, 'Thầy/cô chưa có lớp nào'),
      el('div.small', {}, 'Sang thẻ "🏫 Lớp học" để tự tạo lớp của mình, hoặc nhờ quản trị viên gán lớp cho tài khoản này.'),
    ]));
    return;
  }

  let filterClass = '';
  let filterGame = '';

  const body = el('div');

  function refresh() {
    let data = rows;
    if (filterClass) data = data.filter((r) => r.class_code === filterClass);
    if (filterGame) data = data.filter((r) => r.game_id === filterGame);

    const board = summarise(data);
    const totalPlays = data.length;
    const avgAcc = board.length
      ? Math.round(board.reduce((s, x) => s + x.accuracy, 0) / board.length) : 0;

    clear(body);
    body.append(
      el('div.stat-row', { style: { marginBottom: '18px' } }, [
        el('div.stat', {}, [el('div.k', {}, 'Học sinh'), el('div.v', {}, String(board.length))]),
        el('div.stat', {}, [el('div.k', {}, 'Lượt chơi'), el('div.v', {}, String(totalPlays))]),
        el('div.stat', {}, [el('div.k', {}, 'Chính xác TB'), el('div.v', {}, avgAcc + '%')]),
        el('div.stat', {}, [el('div.k', {}, 'Điểm cao nhất'), el('div.v', {}, String(board[0] ? board[0].totalScore : 0))]),
      ]),

      board.length ? el('div.tbl-wrap', {}, el('table.tbl', {}, [
        el('thead', {}, el('tr', {}, [
          el('th', {}, '#'), el('th', {}, 'Học sinh'), el('th', {}, 'Lớp'),
          el('th', {}, 'Lượt chơi'), el('th', {}, 'Trò đã thử'),
          el('th', {}, 'Câu đúng'), el('th', {}, 'Chính xác'),
          el('th', {}, 'Tổng điểm'), el('th', {}, 'Lần gần nhất'),
        ])),
        el('tbody', {}, board.map((s, i) => el('tr', {}, [
          el('td.rank', {}, i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : String(i + 1)),
          el('td.bold', {}, s.name),
          el('td', {}, el('span.chip.chip-soft', {}, s.classCode || '—')),
          el('td', {}, String(s.plays)),
          el('td', {}, `${s.games}/${GAMES.length}`),
          el('td', {}, `${s.correct}/${s.total}`),
          el('td', {}, el('span', {
            style: { color: s.accuracy >= 80 ? 'var(--ok)' : s.accuracy >= 60 ? 'var(--orange-600)' : 'var(--bad)', fontWeight: 700 },
          }, s.accuracy + '%')),
          el('td.bold', { style: { color: 'var(--red-700)' } }, s.totalScore.toLocaleString('vi-VN')),
          el('td.small.muted', {}, s.last ? fmtDate(s.last) : '—'),
        ]))),
      ])) : el('div.card.empty', {}, [
        el('div.ic', {}, '📭'),
        el('div.bold', {}, 'Chưa có dữ liệu'),
        el('div.small', {},
          CLOUD ? 'Học sinh chơi xong sẽ hiện ở đây.'
                : 'Đang ở chế độ ngoại tuyến — chỉ thấy dữ liệu trên chính máy này. Bật Supabase ở thẻ "Kết nối" để xem điểm của cả lớp.'),
      ]),

      el('div.row.wrapf', { style: { marginTop: '14px' } }, [
        el('button.btn.btn-ghost.btn-sm', { onclick: () => exportCsv(data) }, '⬇️ Tải file Excel (CSV)'),
        el('button.btn.btn-ghost.btn-sm', { onclick: () => window.print() }, '🖨️ In bảng điểm'),
      ]),

      el('div.sec-title', {}, [el('h2', {}, 'Chi tiết từng lượt chơi'), el('div.ln')]),
      el('div.tbl-wrap', {}, el('table.tbl', {}, [
        el('thead', {}, el('tr', {}, [
          el('th', {}, 'Thời gian'), el('th', {}, 'Học sinh'), el('th', {}, 'Lớp'),
          el('th', {}, 'Trò chơi'), el('th', {}, 'Đúng'), el('th', {}, 'Điểm'),
        ])),
        el('tbody', {}, data.slice(0, 100).map((r) => {
          const g = GAMES.find((x) => x.id === r.game_id);
          return el('tr', {}, [
            el('td.small.muted', {}, fmtDate(r.played_at)),
            el('td', {}, r.student_name),
            el('td.small', {}, r.class_code),
            el('td', {}, g ? `${g.icon} ${g.name}` : r.game_id),
            el('td', {}, `${r.correct_count}/${r.total_count}`),
            el('td.bold', {}, String(r.score)),
          ]);
        })),
      ])),
    );
  }

  clear(host);
  host.append(
    el('div.row.wrapf', { style: { marginBottom: '16px' } }, [
      el('select.input', {
        style: { maxWidth: '220px' },
        onchange: (e) => { filterClass = e.target.value; refresh(); },
      }, [el('option', { value: '' }, '🏫 Tất cả lớp'),
          ...classes.map((c) => el('option', { value: c.code }, `${c.code} — ${c.name}`))]),
      el('select.input', {
        style: { maxWidth: '240px' },
        onchange: (e) => { filterGame = e.target.value; refresh(); },
      }, [el('option', { value: '' }, '🎮 Tất cả trò chơi'),
          ...GAMES.map((g) => el('option', { value: g.id }, `${g.icon} ${g.name}`))]),
    ]),
    body,
  );
  refresh();
}

function exportCsv(rows) {
  const head = ['Thời gian', 'Học sinh', 'Lớp', 'Bài', 'Trò chơi', 'Câu đúng', 'Tổng câu', 'Điểm', 'Giây'];
  const lines = [head.join(',')];
  for (const r of rows) {
    const g = GAMES.find((x) => x.id === r.game_id);
    lines.push([
      `"${fmtDate(r.played_at)}"`, `"${r.student_name}"`, r.class_code, r.lesson_id,
      `"${g ? g.name : r.game_id}"`, r.correct_count, r.total_count, r.score,
      Math.round((r.duration_ms || 0) / 1000),
    ].join(','));
  }
  // BOM để Excel mở đúng tiếng Việt
  const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
  const a = el('a', { href: URL.createObjectURL(blob), download: `diem-nezha-${Date.now()}.csv` });
  a.click();
  toast('Đã tải file CSV', 'ok');
}

/* ==================================================================== */
/*  Thẻ 2 — Lớp học                                                     */
/* ==================================================================== */

async function renderClasses(host, user) {
  const isAdmin = !!user.isAdmin;
  const all = await listClasses();
  const classes = isAdmin ? all : all.filter((c) => canSeeClass(user, c.code));

  const code = el('input.input', { placeholder: 'VD: TH2002', style: { textTransform: 'uppercase' } });
  const name = el('input.input', { placeholder: 'VD: Lớp thiếu nhi thứ 3-5' });

  clear(host);
  host.append(
    el('div.alert.alert-info', { style: { marginBottom: '16px' } },
      'Mã lớp chính là mật khẩu của học sinh. Học sinh gõ họ tên + mã lớp để vào học.'),

    el('div.card', { style: { marginBottom: '18px' } }, [
      el('h3', {}, '➕ Thêm lớp mới'),
      el('div.row.wrapf', { style: { alignItems: 'flex-end' } }, [
        el('label.field.grow', { style: { marginBottom: 0, minWidth: '150px' } }, [el('span', {}, 'Mã lớp'), code]),
        el('label.field.grow', { style: { marginBottom: 0, minWidth: '200px' } }, [el('span', {}, 'Tên lớp'), name]),
        el('button.btn', {
          onclick: async () => {
            try {
              const added = await addClass(code.value, name.value);
              // Giáo viên tự tạo lớp thì lớp đó thuộc về chính thầy/cô
              if (!isAdmin) await assignClassToSelf(added.code);
              toast('Đã thêm lớp ' + added.code, 'ok');
              renderClasses(host, currentUser());
            } catch (e) { toast(e.message, 'bad'); }
          },
        }, 'Thêm lớp'),
      ]),
      el('div.hint', { style: { marginTop: '8px' } }, isAdmin
        ? 'Quản trị viên nhìn thấy và quản lý toàn bộ các lớp.'
        : 'Lớp thầy/cô tự tạo sẽ được gán ngay cho tài khoản của thầy/cô. Muốn xoá lớp thì nhờ quản trị viên.'),
    ]),

    classes.length ? el('div.tbl-wrap', {}, el('table.tbl', {}, [
      el('thead', {}, el('tr', {}, [el('th', {}, 'Mã lớp'), el('th', {}, 'Tên lớp'), el('th', {}, '')])),
      el('tbody', {}, classes.map((c) => el('tr', {}, [
        el('td', {}, el('span.chip', {}, c.code)),
        el('td', {}, c.name),
        el('td', {}, isAdmin ? el('button.btn.btn-plain.btn-sm', {
          onclick: async () => {
            if (!confirm(`Xoá lớp ${c.code}? Học sinh lớp này sẽ không đăng nhập được nữa.`)) return;
            await removeClass(c.code);
            toast('Đã xoá lớp ' + c.code);
            renderClasses(host, user);
          },
        }, '🗑️ Xoá') : ''),
      ]))),
    ])) : el('div.card.empty', {}, [
      el('div.ic', {}, '🏫'),
      el('div.bold', {}, 'Chưa có lớp nào được gán cho thầy/cô'),
    ]),
  );
}

/* ==================================================================== */
/*  Thẻ — Tài khoản giáo viên (chỉ quản trị viên thấy)                  */
/* ==================================================================== */

async function renderTeachers(host) {
  const [teachers, classes] = await Promise.all([listTeachers(), listClasses()]);

  const username = el('input.input', {
    placeholder: 'VD: colan', style: { textTransform: 'lowercase' },
  });
  const name = el('input.input', { placeholder: 'VD: Cô Lan' });
  const password = el('input.input', { placeholder: 'Ít nhất 4 ký tự' });

  // Ô tick chọn lớp cho giáo viên mới
  const picked = new Set();
  const classPicker = el('div.row.wrapf', { style: { gap: '8px' } },
    classes.map((c) => {
      const box = el('input', { type: 'checkbox' });
      box.onchange = () => { box.checked ? picked.add(c.code) : picked.delete(c.code); };
      return el('label.chip.chip-soft', {
        style: { cursor: 'pointer', display: 'inline-flex', gap: '6px', alignItems: 'center' },
        title: c.name,
      }, [box, c.code]);
    }));

  async function submit() {
    try {
      await saveTeacher({
        username: username.value,
        name: name.value,
        password: password.value,
        classes: Array.from(picked),
      });
      toast('Đã tạo tài khoản cho ' + (name.value || username.value), 'ok');
      renderTeachers(host);
    } catch (e) { toast(e.message, 'bad'); }
  }

  clear(host);
  host.append(
    el('div.alert.alert-info', { style: { marginBottom: '16px' } },
      'Mỗi giáo viên có tài khoản riêng và chỉ xem được điểm của những lớp được gán. Quản trị viên xem được tất cả.'),

    el('div.card', { style: { marginBottom: '18px' } }, [
      el('h3', {}, '➕ Thêm giáo viên'),
      el('div.row.wrapf', {}, [
        el('label.field.grow', { style: { minWidth: '160px' } }, [
          el('span', {}, 'Tài khoản đăng nhập'), username,
          el('div.hint', {}, 'Không dấu, không khoảng trắng'),
        ]),
        el('label.field.grow', { style: { minWidth: '160px' } }, [el('span', {}, 'Tên hiển thị'), name]),
        el('label.field.grow', { style: { minWidth: '150px' } }, [el('span', {}, 'Mật khẩu'), password]),
      ]),
      el('div.field', {}, [
        el('span', {}, 'Lớp phụ trách'),
        classes.length ? classPicker
          : el('div.hint', {}, 'Chưa có lớp nào — thêm lớp ở thẻ "Lớp học" trước.'),
      ]),
      el('button.btn', { onclick: submit }, '💾 Tạo tài khoản'),
    ]),

    el('div.sec-title', {}, [el('h2', {}, `👩‍🏫 Danh sách giáo viên (${teachers.length})`), el('div.ln')]),

    teachers.length ? el('div.tbl-wrap', {}, el('table.tbl', {}, [
      el('thead', {}, el('tr', {}, [
        el('th', {}, 'Tài khoản'), el('th', {}, 'Tên hiển thị'),
        el('th', {}, 'Mật khẩu'), el('th', {}, 'Lớp phụ trách'), el('th', {}, ''),
      ])),
      el('tbody', {}, teachers.map((t) => el('tr', {}, [
        el('td', {}, el('span.chip', {}, t.username)),
        el('td.bold', {}, t.name),
        el('td', {}, el('span.small.muted', {}, '•'.repeat(Math.min(10, t.password.length)))),
        el('td', {}, el('div.row.wrapf', { style: { gap: '5px' } },
          (t.classes.length ? t.classes : ['—']).map((c) => el('span.chip.chip-soft', {}, c)))),
        el('td', {}, el('div.row', { style: { gap: '6px' } }, [
          el('button.btn.btn-ghost.btn-sm', {
            onclick: async () => {
              const pw = prompt(`Mật khẩu mới cho ${t.name}:`, '');
              if (pw === null) return;
              try {
                await saveTeacher({ ...t, password: pw });
                toast('Đã đổi mật khẩu', 'ok');
                renderTeachers(host);
              } catch (e) { toast(e.message, 'bad'); }
            },
          }, '🔑 Đổi mật khẩu'),
          el('button.btn.btn-ghost.btn-sm', {
            onclick: async () => {
              const cur = t.classes.join(', ');
              const s = prompt(
                `Lớp mà ${t.name} phụ trách (các mã lớp cách nhau bởi dấu phẩy).\nCác lớp đang có: ${classes.map((c) => c.code).join(', ') || 'chưa có lớp nào'}`,
                cur);
              if (s === null) return;
              const list = s.split(',').map((x) => x.trim().toUpperCase()).filter(Boolean);
              try {
                await saveTeacher({ ...t, classes: list });
                toast('Đã cập nhật lớp phụ trách', 'ok');
                renderTeachers(host);
              } catch (e) { toast(e.message, 'bad'); }
            },
          }, '🏫 Gán lớp'),
          el('button.btn.btn-plain.btn-sm', {
            onclick: async () => {
              if (!confirm(`Xoá tài khoản ${t.username}?`)) return;
              await removeTeacher(t.username);
              toast('Đã xoá tài khoản ' + t.username);
              renderTeachers(host);
            },
          }, '🗑️'),
        ])),
      ]))),
    ])) : el('div.card.empty', {}, [
      el('div.ic', {}, '👩‍🏫'),
      el('div.bold', {}, 'Chưa có giáo viên nào'),
      el('div.small', {}, 'Điền form phía trên để tạo tài khoản đầu tiên.'),
    ]),

    el('div.alert', { style: { marginTop: '16px' } }, CLOUD
      ? '☁️ Tài khoản giáo viên được lưu trên máy chủ nên đăng nhập được từ mọi máy.'
      : '⚠️ Đang ở chế độ ngoại tuyến: tài khoản giáo viên chỉ lưu trên chính máy này. Bật Supabase ở thẻ "Kết nối" để giáo viên đăng nhập được từ máy khác.'),
  );
}

/* ==================================================================== */
/*  Thẻ 3 — Bài học (tải file Word/PDF)                                 */
/* ==================================================================== */

async function renderLessons(host) {
  const lessons = await listLessons();
  const preview = el('div');

  const title = el('input.input', { placeholder: 'VD: Ôn tập bài 6–10' });
  const code = el('input.input', { placeholder: 'VD: TN1101', style: { textTransform: 'uppercase' } });
  const subtitle = el('input.input', { placeholder: 'VD: Gia đình · Số đếm · Màu sắc' });
  const textarea = el('textarea.input', {
    rows: 7,
    placeholder: 'Hoặc dán trực tiếp nội dung vào đây.\n\nMỗi dòng 1 từ, có thể viết:\n你好 | nǐ hǎo | xin chào\nhoặc chỉ cần: 你好, 再见, 老师\n(hệ thống sẽ tự tra pinyin và nghĩa cho từ thông dụng)',
  });
  const fileInput = el('input', {
    type: 'file',
    accept: '.docx,.pdf,.txt,.md,.csv',
    style: { display: 'none' },
  });

  let parsed = null;

  async function handleText(text) {
    const res = parseVocab(text);
    if (!res.words.length && !res.sentences.length) {
      toast('Không tìm thấy chữ Hán nào trong nội dung này', 'bad');
      return;
    }
    parsed = res;
    drawPreview();
  }

  function drawPreview() {
    const missing = parsed.words.filter((w) => !w.vi).length;
    clear(preview);
    preview.append(
      el('div.sec-title', {}, [el('h2', {}, `👀 Xem lại trước khi lưu (${parsed.words.length} từ, ${parsed.sentences.length} câu)`), el('div.ln')]),
      missing
        ? el('div.alert', { style: { marginBottom: '12px' } },
            `⚠️ Có ${missing} từ chưa có nghĩa — thầy/cô điền giúp vào ô "Nghĩa tiếng Việt" bên dưới. Từ để trống sẽ không được đưa vào game.`)
        : el('div.alert.alert-ok', { style: { marginBottom: '12px' } },
            '✅ Tất cả các từ đã có pinyin và nghĩa. Thầy/cô kiểm tra lại rồi bấm Lưu.'),

      el('div.tbl-wrap', { style: { maxHeight: '460px', overflowY: 'auto' } },
        el('table.tbl', {}, [
          el('thead', {}, el('tr', {}, [
            el('th', {}, 'Hán tự'), el('th', {}, 'Pinyin'), el('th', {}, 'Nghĩa tiếng Việt'),
            el('th', {}, 'Nhóm'), el('th', {}, ''),
          ])),
          el('tbody', {}, parsed.words.map((w, i) => el('tr', {}, [
            el('td', {}, el('span.hz', { style: { fontSize: '1.4rem' } }, w.hz)),
            el('td', {}, el('input.input', {
              value: w.py, style: { padding: '7px 10px', minWidth: '110px' },
              oninput: (e) => { parsed.words[i].py = e.target.value; },
            })),
            el('td', {}, el('input.input', {
              value: w.vi, placeholder: 'nhập nghĩa...',
              style: { padding: '7px 10px', minWidth: '180px', borderColor: w.vi ? '' : 'var(--red-500)' },
              oninput: (e) => { parsed.words[i].vi = e.target.value; },
            })),
            el('td', {}, el('input.input', {
              value: w.tag || '', style: { padding: '7px 10px', minWidth: '110px' },
              oninput: (e) => { parsed.words[i].tag = e.target.value; },
            })),
            el('td', {}, el('button.btn.btn-plain.btn-sm', {
              onclick: (e) => { parsed.words.splice(i, 1); drawPreview(); },
            }, '🗑️')),
          ]))),
        ])),

      parsed.sentences.length ? el('div', { style: { marginTop: '16px' } }, [
        el('h3', {}, 'Mẫu câu (dùng cho game Sắp xếp câu)'),
        el('div.review-list', {}, parsed.sentences.map((s, i) => el('div.review-item', {}, [
          el('div.hz', { style: { fontSize: '1.25rem', minWidth: '150px' } }, s.hz),
          el('input.input.grow', {
            value: s.vi, placeholder: 'Nghĩa tiếng Việt của câu...',
            style: { padding: '7px 10px' },
            oninput: (e) => { parsed.sentences[i].vi = e.target.value; },
          }),
          el('button.btn.btn-plain.btn-sm', {
            onclick: () => { parsed.sentences.splice(i, 1); drawPreview(); },
          }, '🗑️'),
        ]))),
      ]) : null,

      el('div.row', { style: { marginTop: '18px' } }, [
        el('button.btn.btn-lg', {
          onclick: async () => {
            const good = parsed.words.filter((w) => w.hz && w.vi);
            if (!good.length) return toast('Cần ít nhất 1 từ có nghĩa tiếng Việt', 'bad');
            if (good.length < 4) return toast('Cần ít nhất 4 từ để tạo được câu hỏi trắc nghiệm', 'bad');
            const lesson = buildLesson({
              title: title.value || 'Bài học mới',
              code: code.value.toUpperCase(),
              subtitle: subtitle.value,
              words: good,
              sentences: parsed.sentences.filter((s) => s.hz && s.vi),
            });
            await saveLesson(lesson);
            toast(`Đã lưu "${lesson.title}" với ${good.length} từ`, 'ok');
            parsed = null;
            renderLessons(host);
          },
        }, '💾 Lưu bài học'),
        el('button.btn.btn-ghost', {
          onclick: () => { parsed = null; clear(preview); },
        }, 'Huỷ'),
      ]),
    );
    preview.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  fileInput.onchange = async () => {
    const f = fileInput.files[0];
    if (!f) return;
    toast('Đang đọc file...');
    try {
      const text = await extractText(f);
      textarea.value = text;
      if (!title.value) title.value = f.name.replace(/\.[^.]+$/, '');
      await handleText(text);
    } catch (e) {
      toast(e.message, 'bad');
      console.error(e);
    }
    fileInput.value = '';
  };

  const dropZone = el('div.card', {
    style: {
      border: '2.5px dashed var(--line)', textAlign: 'center', cursor: 'pointer',
      background: 'rgba(255,255,255,.6)',
    },
    onclick: () => fileInput.click(),
    ondragover: (e) => { e.preventDefault(); dropZone.style.borderColor = 'var(--orange-500)'; },
    ondragleave: () => { dropZone.style.borderColor = ''; },
    ondrop: async (e) => {
      e.preventDefault();
      dropZone.style.borderColor = '';
      const f = e.dataTransfer.files[0];
      if (!f) return;
      fileInput.files = e.dataTransfer.files;
      fileInput.onchange();
    },
  }, [
    el('div', { style: { fontSize: '2.6rem' } }, '📄'),
    el('div.bold', {}, 'Kéo thả file vào đây hoặc bấm để chọn'),
    el('div.small.muted', {}, 'Hỗ trợ .docx (Word), .pdf, .txt, .csv'),
  ]);

  clear(host);
  host.append(
    el('div.card', { style: { marginBottom: '18px' } }, [
      el('h3', {}, '➕ Thêm bài học mới'),
      el('div.row.wrapf', {}, [
        el('label.field.grow', { style: { minWidth: '200px' } }, [el('span', {}, 'Tên bài'), title]),
        el('label.field', { style: { minWidth: '140px' } }, [el('span', {}, 'Mã lớp/giáo trình'), code]),
      ]),
      el('label.field', {}, [el('span', {}, 'Mô tả ngắn'), subtitle]),
      dropZone,
      fileInput,
      el('div.row', { style: { margin: '16px 0 8px' } }, [
        el('div.ln', { style: { flex: 1, height: '1px', background: 'var(--line)' } }),
        el('span.small.muted', {}, 'hoặc'),
        el('div.ln', { style: { flex: 1, height: '1px', background: 'var(--line)' } }),
      ]),
      el('label.field', {}, [el('span', {}, 'Dán văn bản'), textarea]),
      el('button.btn.btn-block', {
        onclick: () => {
          if (!textarea.value.trim()) return toast('Chưa có nội dung', 'bad');
          handleText(textarea.value);
        },
      }, '🔍 Phân tích nội dung'),
    ]),

    preview,

    el('div.sec-title', {}, [el('h2', {}, '📚 Các bài hiện có'), el('div.ln')]),
    el('div.game-grid', {}, lessons.map((l) => el('div.card', {}, [
      el('div.row-between', {}, [
        el('div', {}, [
          el('h3', { style: { marginBottom: '2px' } }, `${l.emoji || '📘'} ${l.title}`),
          el('div.small.muted', {}, l.subtitle || ''),
        ]),
        l.custom ? el('button.btn.btn-plain.btn-sm', {
          onclick: async () => {
            if (!confirm(`Xoá bài "${l.title}"?`)) return;
            await deleteLesson(l.id);
            toast('Đã xoá');
            renderLessons(host);
          },
        }, '🗑️') : el('span.chip.chip-soft', {}, 'Mặc định'),
      ]),
      el('div.row.wrapf', { style: { marginTop: '10px' } }, [
        el('span.chip.chip-soft', {}, `${l.words.length} từ`),
        el('span.chip.chip-soft', {}, `${(l.sentences || []).length} câu`),
        l.code ? el('span.chip', {}, l.code) : null,
      ]),
    ]))),
  );
}

/* ==================================================================== */
/*  Thẻ 4 — Kết nối Supabase                                            */
/* ==================================================================== */

async function renderCloud(host) {
  clear(host);
  const status = el('div.card.center', {}, 'Đang kiểm tra kết nối...');
  host.append(status);

  const r = await pingCloud();
  clear(status);
  status.classList.remove('center');
  status.append(
    el('div.row', {}, [
      el('div', { style: { fontSize: '2.2rem' } }, r.ok ? '✅' : '⚠️'),
      el('div', {}, [
        el('h3', { style: { marginBottom: '2px' } }, r.ok ? 'Đã kết nối máy chủ' : 'Chưa kết nối máy chủ'),
        el('div.small.muted', {}, r.msg),
      ]),
    ])
  );

  host.append(
    el('div.card', { style: { marginTop: '16px' } }, [
      el('h3', {}, r.ok ? '🎉 Mọi thứ đã sẵn sàng' : '🔧 Cách bật lưu điểm tập trung (miễn phí, ~5 phút)'),
      r.ok
        ? el('p', {}, 'Điểm của học sinh ở mọi thiết bị đều được lưu về đây, và phòng Kahoot chơi được nhiều máy cùng lúc.')
        : el('div', {}, [
            el('p', {}, 'Hiện tại website vẫn chơi được đủ 8 trò chơi, nhưng điểm chỉ lưu trên máy của từng học sinh và phòng Kahoot chỉ chạy trên 1 máy. Để xem điểm cả lớp và chơi Kahoot nhiều máy:'),
            el('ol', {}, [
              el('li', {}, 'Vào supabase.com → đăng ký miễn phí → tạo project mới'),
              el('li', {}, 'Mở SQL Editor → dán toàn bộ nội dung file supabase/schema.sql → bấm Run'),
              el('li', {}, 'Vào Project Settings → API, chép "Project URL" và "anon public key"'),
              el('li', {}, 'Dán 2 giá trị đó vào file public/js/config.js'),
              el('li', {}, 'Chạy npm run build rồi tải lại thư mục dist/ lên Hostinger'),
            ]),
          ]),
      el('div.alert.alert-info', { style: { marginTop: '12px' } },
        '💡 Đừng quên đổi mật khẩu giáo viên trong config.js trước khi đưa website cho học sinh dùng.'),
    ])
  );
}
