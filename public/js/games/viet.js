/**
 * GAME 9 — TẬP VIẾT CHỮ HÁN (写汉字)
 *
 * Bên TRÁI  : chữ mẫu — bấm vào để xem máy viết lại đúng thứ tự nét
 * Bên PHẢI  : ô để học sinh viết theo nét bằng chuột hoặc ngón tay
 *
 * Luật tính điểm: mỗi chữ phải viết ĐÚNG THỨ TỰ NÉT 2 LẦN.
 *   • Lần nào sai nét (kể cả sai rồi viết lại đúng) thì lần đó coi như chưa đạt
 *   • Cả 2 lần đều sạch lỗi mới được tính điểm
 *
 * Phần nhận diện nét dùng thư viện Hanzi Writer (mã nguồn mở, MIT) nạp từ CDN.
 * Địa chỉ CDN đặt trong config.js → CONFIG.game.hanziWriterCdn
 */

import { el, sleep, speak, sfx, toast, go } from '../core.js';
import { CONFIG } from '../config.js';
import { Shell } from './shell.js';

/** Chỉ lấy chữ Hán, bỏ dấu câu và khoảng trắng */
const isHanzi = (ch) => /[一-鿿]/.test(ch);

/** Nạp thư viện Hanzi Writer 1 lần duy nhất */
let hzPromise = null;
function loadHanziWriter() {
  if (window.HanziWriter) return Promise.resolve(window.HanziWriter);
  if (hzPromise) return hzPromise;
  hzPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = CONFIG.game.hanziWriterCdn;
    s.async = true;
    s.onload = () => (window.HanziWriter ? resolve(window.HanziWriter) : reject(new Error('lib')));
    s.onerror = () => reject(new Error('cdn'));
    document.head.appendChild(s);
  });
  return hzPromise;
}

/** Danh sách chữ để luyện: tách từng chữ trong từ vựng của bài */
function pickChars(lesson, n) {
  const seen = new Map();
  for (const w of lesson.words || []) {
    for (const ch of String(w.hz)) {
      if (!isHanzi(ch) || seen.has(ch)) continue;
      seen.set(ch, { ch, py: w.py, vi: w.vi, from: w.hz });
    }
  }
  const all = Array.from(seen.values());
  // Xáo trộn rồi lấy n chữ
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [all[i], all[j]] = [all[j], all[i]];
  }
  return all.slice(0, Math.min(n, all.length));
}

export function play(game, lesson, container) {
  const chars = pickChars(lesson, CONFIG.game.writeChars || 8);
  if (!chars.length) {
    toast('Bài này chưa có chữ Hán để tập viết', 'bad');
    return go('/hoc', true);
  }

  const shell = new Shell({ game, lesson, total: chars.length });
  shell.attach(container);

  shell.setStage([
    el('div.wrap-sm', { style: { padding: 0 } }, el('div.card.center', { style: { minHeight: '220px' } }, [
      el('div', { style: { fontSize: '2.4rem' } }, '✍️'),
      el('div.bold', {}, 'Đang tải bộ nét chữ...'),
      el('div.small.muted', {}, 'Lần đầu vào trò này cần mạng để tải dữ liệu nét viết.'),
    ])),
  ]);

  loadHanziWriter().then(start).catch(() => {
    shell.setStage([
      el('div.wrap-sm', { style: { padding: 0 } }, el('div.card.empty', {}, [
        el('div.ic', {}, '📡'),
        el('div.bold', {}, 'Không tải được bộ nét chữ'),
        el('div.small', {}, 'Trò tập viết cần kết nối mạng để tải dữ liệu thứ tự nét. Em kiểm tra lại wifi rồi thử lại nhé.'),
        el('div.row', { style: { justifyContent: 'center', marginTop: '16px' } }, [
          el('button.btn', { onclick: () => location.reload() }, '🔄 Thử lại'),
          el('a.btn.btn-ghost', { href: '/hoc', 'data-link': '' }, 'Trò chơi khác'),
        ]),
      ])),
    ]);
  });

  /* ------------------------------------------------------------------ */
  function start(HanziWriter) {
    const TRIES = 2;          // phải viết đúng mấy lần
    const MAX_RUNS = 6;       // viết quá số lần này mà vẫn chưa đạt thì sang chữ khác
    let i = 0;                // chữ thứ mấy
    let cleanRuns = 0;        // số lần viết sạch lỗi
    let runs = 0;             // tổng số lần đã viết chữ này
    let mistakes = 0;         // số lỗi của lần viết hiện tại

    function nextChar() {
      if (i >= chars.length) return shell.finish();
      cleanRuns = 0;
      runs = 0;
      draw();
    }

    /** Chữ hiếm không có dữ liệu nét → bỏ qua, không để học sinh chờ mãi */
    let skipping = false;
    function skipChar() {
      if (skipping) return;
      skipping = true;
      toast('Chữ này chưa có dữ liệu nét, chuyển sang chữ khác nhé', '');
      i++;
      setTimeout(() => { skipping = false; nextChar(); }, 600);
    }

    function draw() {
      const item = chars[i];
      mistakes = 0;

      shell.progress(i, chars.length);

      const modelBox = el('div.writer-pad');
      const quizBox = el('div.writer-pad.quiz');
      const status = el('div.write-status', {}, `Lần ${cleanRuns + 1}/${TRIES} — viết theo đúng thứ tự nét`);
      const dots = el('div.row', { style: { justifyContent: 'center', gap: '6px' } },
        Array.from({ length: TRIES }, (_, k) => el('span.try-dot' + (k < cleanRuns ? '.on' : ''))));

      shell.setStage([
        el('div.wrap-sm', { style: { padding: 0 } }, [
          el('div.qbox', { style: { padding: '14px' } }, [
            el('div.lbl', {}, `Chữ ${i + 1}/${chars.length} · trong từ “${item.from}”`),
            el('div.bold', { style: { fontSize: '1.05rem' } }, `${item.py} — ${item.vi}`),
          ]),

          el('div.write-grid', {}, [
            el('div.write-col', {}, [
              el('div.write-cap', {}, '👀 Chữ mẫu — bấm để xem thứ tự nét'),
              modelBox,
              el('button.btn.btn-ghost.btn-sm.btn-block', {
                onclick: () => modelWriter && modelWriter.animateCharacter(),
              }, '🖌️ Xem lại thứ tự nét'),
            ]),
            el('div.write-col', {}, [
              el('div.write-cap', {}, '✍️ Em viết vào đây'),
              quizBox,
              el('button.btn.btn-ghost.btn-sm.btn-block', {
                onclick: () => restartQuiz(),
              }, '🔄 Viết lại lần này'),
            ]),
          ]),

          status,
          dots,

          el('p.hint.tcenter', { style: { marginTop: '10px' } },
            'Viết đúng thứ tự nét 2 lần liên tiếp thì được tính điểm. Sai nét thì lần đó phải viết lại.'),
        ]),
      ]);

      const size = Math.min(300, Math.max(180, Math.floor(window.innerWidth / 2.6)));

      const modelWriter = HanziWriter.create(modelBox, item.ch, {
        width: size, height: size, padding: 6,
        showCharacter: true, showOutline: true,
        strokeColor: '#A81F16', outlineColor: '#E7D5C6',
        strokeAnimationSpeed: 1, delayBetweenStrokes: 220,
        onLoadCharDataError: () => skipChar(),
      });
      modelBox.onclick = () => modelWriter.animateCharacter();

      let quizWriter = null;
      function restartQuiz() {
        mistakes = 0;
        quizBox.replaceChildren();
        quizWriter = HanziWriter.create(quizBox, item.ch, {
          width: size, height: size, padding: 6,
          showCharacter: false, showOutline: true,
          strokeColor: '#0F7B3E', outlineColor: '#EADFD3',
          drawingWidth: 26, showHintAfterMisses: 3,
          onLoadCharDataError: () => skipChar(),
        });
        status.textContent = `Lần ${cleanRuns + 1}/${TRIES} — viết theo đúng thứ tự nét`;
        status.className = 'write-status';
        quizWriter.quiz({
          onMistake: () => {
            mistakes++;
            sfx.wrong();
            status.textContent = `✘ Sai thứ tự nét (${mistakes} lần) — lần này chưa được tính`;
            status.className = 'write-status bad';
          },
          onCorrectStroke: () => sfx.tick(),
          onComplete: async () => {
            runs++;
            if (mistakes === 0) {
              cleanRuns++;
              sfx.correct();
              status.textContent = cleanRuns >= TRIES
                ? '✔ Tuyệt vời! Viết đúng cả 2 lần'
                : '✔ Đúng rồi! Viết thêm 1 lần nữa cho nhớ';
              status.className = 'write-status ok';
            } else {
              status.textContent = `✘ Lần này sai ${mistakes} nét — viết lại từ đầu nhé`;
              status.className = 'write-status bad';
            }
            dots.replaceChildren(...Array.from({ length: TRIES }, (_, k) =>
              el('span.try-dot' + (k < cleanRuns ? '.on' : ''))));

            speak(item.ch);
            await sleep(1100);

            if (cleanRuns >= TRIES) {           // đạt: viết sạch lỗi đủ 2 lần
              shell.mark(true, 150, item);
              i++;
              return nextChar();
            }
            if (runs >= MAX_RUNS) {             // viết mãi vẫn chưa đạt → sang chữ khác
              shell.mark(false, 150, item);
              toast('Chữ này để cuối buổi ôn lại nhé!', '');
              i++;
              return nextChar();
            }
            restartQuiz();
          },
        });
      }
      restartQuiz();
    }

    nextChar();
  }
}
