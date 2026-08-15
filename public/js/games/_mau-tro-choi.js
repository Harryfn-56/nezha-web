/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  FILE MẪU — COPY FILE NÀY ĐỂ TẠO TRÒ CHƠI MỚI                   ║
 * ╚══════════════════════════════════════════════════════════════════╝
 *
 * File này KHÔNG chạy (tên bắt đầu bằng dấu _ nên không có trò chơi nào
 * gọi tới). Nó chỉ để làm khuôn mẫu.
 *
 * ─────────────────────────  CÁCH THÊM TRÒ CHƠI MỚI  ─────────────────
 *
 *  BƯỚC 1. Copy file này thành file mới, ví dụ:
 *          public/js/games/doan-chu.js
 *
 *  BƯỚC 2. Mở public/js/data.js, thêm 1 mục vào cuối mảng GAMES:
 *
 *          {
 *            id: 'doan-chu',              ← PHẢI trùng tên file (không có .js)
 *            name: 'Đoán chữ bí ẩn',
 *            cn: '猜字',
 *            desc: 'Mô tả ngắn hiện trên thẻ trò chơi ở trang chính',
 *            icon: '🔍',                  ← 1 emoji
 *            color: 'blue',               ← red|orange|amber|green|blue|purple|teal|crimson
 *            skill: 'Suy luận',           ← nhãn kỹ năng hiện dưới thẻ
 *          },
 *
 *  BƯỚC 3. Viết phần chơi ở dưới. Xong chạy `npm run dev` để thử,
 *          rồi `npm run build` và tải lại dist/ lên Hostinger.
 *
 * ─────────────────────────  NHỮNG THỨ CÓ SẴN  ───────────────────────
 *
 *  lesson.words      = [{ hz: '你好', py: 'nǐ hǎo', vi: 'xin chào', tag: 'Chào hỏi' }, ...]
 *  lesson.sentences  = [{ hz: '你叫什么名字？', py: '...', vi: 'Bạn tên là gì?' }, ...]
 *
 *  shell.progress(đãXong, tổngSố)   cập nhật thanh tiến độ trên đầu
 *  shell.mark(đúngHaySai, điểm, từ) ghi nhận 1 câu trả lời (tự cộng điểm,
 *                                   tự tính chuỗi đúng, tự đưa từ sai vào
 *                                   danh sách "cần ôn lại")
 *  shell.setStage(...)              vẽ nội dung ra màn hình
 *  shell.countdown(giây, khiChạy, khiHết)   đồng hồ đếm ngược
 *  shell.finish()                   kết thúc → tự lưu điểm + hiện màn kết quả
 *
 *  speak('你好')                     đọc to bằng giọng tiếng Trung
 *  shuffle(mảng) / sample(mảng, n)  xáo trộn / bốc ngẫu nhiên n phần tử
 *  sleep(ms)                        chờ (dùng với await)
 *  toast('lời nhắn')                hiện thông báo nhỏ
 *  sfx.correct() / sfx.wrong()      hiệu ứng âm thanh
 *  el('div.card', { onclick: f }, 'nội dung')   tạo phần tử HTML
 */

import { el, shuffle, sample, sleep, speak, sfx, toast } from '../core.js';
import { CONFIG } from '../config.js';
import { Shell, timeScore } from './shell.js';

/**
 * Hàm bắt buộc phải tên là `play` và export ra ngoài.
 * @param {object} game       thông tin trò chơi (lấy từ mảng GAMES)
 * @param {object} lesson     bài học đang chọn (có .words và .sentences)
 * @param {HTMLElement} container  nơi để vẽ trò chơi
 */
export function play(game, lesson, container) {
  /* --- 1) Chuẩn bị câu hỏi ---------------------------------------- */
  const soCau = Math.min(CONFIG.game.questionsPerRound, lesson.words.length);
  const danhSach = sample(lesson.words, soCau);

  /* --- 2) Dựng khung game (thanh tiến độ, điểm, nút thoát) --------- */
  const shell = new Shell({ game, lesson, total: soCau });
  shell.attach(container);

  let i = 0;          // đang ở câu thứ mấy
  let daKhoa = false; // đã trả lời câu này chưa

  /* --- 3) Vẽ từng câu hỏi ------------------------------------------ */
  function cauTiepTheo() {
    // Hết câu thì kết thúc — Shell tự lưu điểm và hiện màn hình kết quả
    if (i >= danhSach.length) return shell.finish();

    const tu = danhSach[i];
    daKhoa = false;
    shell.progress(i, danhSach.length);

    // Tạo 4 lựa chọn: 1 đúng + 3 sai
    const dapAnSai = shuffle(lesson.words.filter((w) => w.hz !== tu.hz)).slice(0, 3);
    const luaChon = shuffle([tu, ...dapAnSai]);

    const nutLuaChon = luaChon.map((w, viTri) => el('button.opt', {
      onclick: () => traLoi(w, viTri),
    }, [
      el('span.key', {}, 'ABCD'[viTri]),   // ô chữ cái A/B/C/D
      el('span', {}, w.vi),                 // nội dung lựa chọn
    ]));

    // Đồng hồ đếm ngược
    const thanhThoiGian = el('i', { style: { width: '100%' } });
    let conLai = 1;

    shell.setStage([
      el('div.wrap-sm', { style: { padding: 0 } }, [

        el('div.bar.timer', { style: { marginBottom: '14px' } }, thanhThoiGian),

        // Khung câu hỏi lớn ở giữa
        el('div.qbox', {}, [
          el('div.lbl', {}, 'Câu hỏi của em là gì?'),   // dòng chữ nhỏ phía trên
          el('div.q-hz', {}, tu.hz),                     // chữ Hán cỡ lớn
          el('div.row', { style: { justifyContent: 'center', marginTop: '14px' } },
            el('button.btn.btn-ghost.btn-sm', { onclick: () => speak(tu.hz) }, '🔊 Nghe')),
        ]),

        // Lưới 4 đáp án
        el('div.opts', {}, nutLuaChon),
      ]),
    ]);

    shell.countdown(
      CONFIG.game.quizSeconds,
      (phanTramConLai) => {
        conLai = phanTramConLai;
        thanhThoiGian.style.width = phanTramConLai * 100 + '%';
      },
      () => { if (!daKhoa) traLoi(null, -1); }   // hết giờ = trả lời sai
    );

    /* --- 4) Xử lý khi học sinh bấm chọn --------------------------- */
    async function traLoi(w, viTri) {
      if (daKhoa) return;
      daKhoa = true;
      shell.stopTimer();

      const dung = w && w.hz === tu.hz;

      // Ghi nhận: trả lời càng nhanh điểm càng cao
      shell.mark(dung, dung ? timeScore(conLai) : 100, tu);

      // Tô màu đáp án: xanh = đúng, đỏ = chọn sai, mờ = còn lại
      nutLuaChon.forEach((nut, k) => {
        nut.classList.add('locked');
        if (luaChon[k].hz === tu.hz) nut.classList.add('correct');
        else if (k === viTri) nut.classList.add('wrong');
        else nut.classList.add('dim');
      });

      speak(tu.hz);

      // Cho học sinh kịp nhìn đáp án rồi sang câu sau
      await sleep(dung ? 900 : 1800);
      i++;
      cauTiepTheo();
    }
  }

  cauTiepTheo();
}

/* ─────────────────────────────────────────────────────────────────────
 * MỘT SỐ Ý TƯỞNG TRÒ CHƠI CÓ THỂ LÀM TIẾP
 * ─────────────────────────────────────────────────────────────────────
 *  • Tô nét chữ Hán  — dùng thẻ <canvas>, học sinh vẽ theo nét mờ
 *  • Đoán chữ bí ẩn  — hiện dần từng nét, đoán sớm được nhiều điểm
 *  • Nối chữ thành đôi (接龙) — chữ cuối của từ này là chữ đầu của từ kia
 *  • Đúng hay sai     — hiện 1 cặp Hán tự + nghĩa, bấm Đúng/Sai thật nhanh
 *  • Điền vào chỗ trống — 我___明明。 chọn từ đúng điền vào
 *  • Nghe viết chính tả — máy đọc, học sinh gõ pinyin cả câu
 *  • Bingo từ vựng    — lưới 5×5, thầy cô đọc, học sinh đánh dấu ô
 * ───────────────────────────────────────────────────────────────────── */
