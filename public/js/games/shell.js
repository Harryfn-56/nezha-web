/**
 * GAME SHELL — bộ khung dùng chung cho cả 8 trò chơi.
 * Lo phần thanh tiến độ, điểm, chuỗi đúng liên tiếp, đồng hồ, màn hình kết quả.
 */

import { el, clear, append, mount, go, sfx, confetti, sound, toast } from '../core.js';
import { CONFIG } from '../config.js';
import { saveScore } from '../store.js';

export class Shell {
  /**
   * @param {{game, lesson, total, onQuit}} opt
   */
  constructor(opt) {
    this.game = opt.game;
    this.lesson = opt.lesson;
    this.total = opt.total || 0;
    this.score = 0;
    this.maxScore = 0;
    this.correct = 0;
    this.answered = 0;
    this.streak = 0;
    this.bestStreak = 0;
    this.review = [];
    this.startedAt = Date.now();
    this._timer = null;

    this.build();
  }

  build() {
    this.elScore = el('span.pill.pill-score', {}, '0 điểm');
    this.elStreak = el('span.pill.pill-streak', { style: { display: 'none' } }, '🔥 0');
    this.elBarFill = el('i', { style: { width: '0%' } });
    this.elBar = el('div.bar', {}, this.elBarFill);
    this.elCount = el('span.pill', {}, `0/${this.total}`);

    const soundBtn = el('button.btn.btn-plain.btn-sm', {
      title: 'Bật/tắt âm thanh',
      onclick: (e) => {
        const on = sound.toggle();
        e.currentTarget.textContent = on ? '🔊' : '🔇';
        toast(on ? 'Đã bật âm thanh' : 'Đã tắt âm thanh');
      },
    }, sound.on ? '🔊' : '🔇');

    this.topBar = el('div.g-top', {}, el('div.wrap', {},
      el('div.g-top-in', {}, [
        el('button.btn.btn-ghost.btn-sm', {
          onclick: () => {
            if (this.answered > 0 && !confirm('Thoát bây giờ sẽ không được tính điểm. Em chắc chứ?')) return;
            go('/hoc');
          },
        }, '← Thoát'),
        this.elBar,
        this.elCount,
        this.elStreak,
        this.elScore,
        soundBtn,
      ])
    ));

    this.body = el('div.wrap.stage');
    this.root = el('div.screen', {}, [this.topBar, this.body]);
  }

  /** Đưa khung game lên màn hình (gọi sau khi đã có nav) */
  attach(container) {
    clear(container);
    container.append(this.root);
    return this.body;
  }

  setStage(...nodes) {
    clear(this.body);
    append(this.body, nodes);
  }

  /** Cập nhật thanh tiến độ */
  progress(done, total = this.total) {
    this.total = total;
    this.elCount.textContent = `${done}/${total}`;
    this.elBarFill.style.width = (total ? (done / total) * 100 : 0) + '%';
  }

  /**
   * Ghi nhận 1 câu trả lời.
   * @param {boolean} ok  đúng hay sai
   * @param {number} points điểm cộng nếu đúng
   * @param {object} item  từ vựng để đưa vào phần ôn lại
   */
  mark(ok, points, item) {
    this.answered++;
    this.maxScore += points > 0 ? points : 100;
    if (ok) {
      this.correct++;
      this.streak++;
      this.bestStreak = Math.max(this.bestStreak, this.streak);
      // Thưởng chuỗi: đúng liên tiếp càng dài, thưởng càng nhiều (tối đa +50%)
      const bonus = Math.min(this.streak - 1, 5) * 0.1;
      this.score += Math.round(points * (1 + bonus));
      sfx.correct();
    } else {
      this.streak = 0;
      sfx.wrong();
    }
    if (item) this.review.push({ ...item, ok });

    this.elScore.textContent = `${this.score} điểm`;
    if (this.streak >= 2) {
      this.elStreak.style.display = '';
      this.elStreak.textContent = `🔥 ${this.streak}`;
    } else {
      this.elStreak.style.display = 'none';
    }
    return ok;
  }

  /** Đồng hồ đếm ngược cho 1 câu. Trả về hàm dừng. */
  countdown(seconds, onTick, onEnd) {
    this.stopTimer();
    const started = Date.now();
    const totalMs = seconds * 1000;
    let lastWhole = seconds;
    this._timer = setInterval(() => {
      const left = Math.max(0, totalMs - (Date.now() - started));
      const whole = Math.ceil(left / 1000);
      if (whole !== lastWhole) {
        lastWhole = whole;
        if (whole <= 5 && whole > 0) sfx.tick();
      }
      onTick && onTick(left / totalMs, whole);
      if (left <= 0) {
        this.stopTimer();
        onEnd && onEnd();
      }
    }, 100);
    return () => this.stopTimer();
  }

  stopTimer() {
    if (this._timer) { clearInterval(this._timer); this._timer = null; }
  }

  /** Kết thúc lượt chơi → lưu điểm và hiện màn hình kết quả */
  async finish(extra = {}) {
    this.stopTimer();
    const durationMs = Date.now() - this.startedAt;
    const result = {
      lessonId: this.lesson.id,
      gameId: this.game.id,
      score: this.score,
      maxScore: Math.max(this.maxScore, 1),
      correct: this.correct,
      total: this.answered || this.total,
      durationMs,
      ...extra,
    };
    try { await saveScore(result); } catch (e) { console.warn(e); }
    this.showResult(result);
  }

  showResult(r) {
    const pct = Math.round((r.correct / Math.max(r.total, 1)) * 100);
    const stars = pct >= 90 ? 3 : pct >= CONFIG.game.passPercent ? 2 : pct >= 40 ? 1 : 0;
    const passed = pct >= CONFIG.game.passPercent;

    if (passed) { sfx.win(); confetti(stars === 3 ? 110 : 60); }
    else sfx.lose();

    const praise = stars === 3 ? 'Tuyệt vời! 太棒了！'
      : stars === 2 ? 'Làm tốt lắm! 很好！'
      : stars === 1 ? 'Cố lên nào! 加油！'
      : 'Ôn lại chút nữa nhé! 加油！';

    const wrongs = this.review.filter((x) => !x.ok);

    this.topBar.style.display = 'none';
    this.setStage([
      el('div.result-hero', {}, [
        el('div', { style: { fontSize: '2.6rem' } }, this.game.icon),
        el('h1', {}, praise),
        el('div.big-score', {}, String(r.score)),
        el('div', { style: { opacity: .9 } }, `Đúng ${r.correct}/${r.total} câu · ${pct}% · ${Math.round(r.durationMs / 1000)} giây`),
        el('div.stars', {}, '★'.repeat(stars) + '☆'.repeat(3 - stars)),
        this.bestStreak >= 3 ? el('div', { style: { marginTop: '8px' } },
          el('span.chip', {}, `🔥 Chuỗi đúng dài nhất: ${this.bestStreak}`)) : null,
      ]),

      el('div.row.wrapf', { style: { justifyContent: 'center', marginBottom: '26px' } }, [
        el('button.btn.btn-lg', { onclick: () => location.reload() }, '🔄 Chơi lại'),
        el('a.btn.btn-lg.btn-ghost', { href: '/hoc', 'data-link': '' }, '🎮 Trò chơi khác'),
      ]),

      wrongs.length ? el('div', {}, [
        el('div.sec-title', {}, [el('h2', {}, `📌 Cần ôn lại (${wrongs.length} từ)`), el('div.ln')]),
        el('div.review-list', {}, wrongs.map((w) => el('div.review-item.bad', {}, [
          el('div.hz', { style: { fontSize: '1.8rem', minWidth: '76px' } }, w.hz || '—'),
          el('div.grow', {}, [
            el('div.py', {}, w.py || ''),
            el('div.bold', {}, w.vi || ''),
          ]),
        ]))),
      ]) : el('div.alert.alert-ok.tcenter', {}, '🎉 Em trả lời đúng hết! Không có từ nào cần ôn lại.'),
    ]);
    window.scrollTo(0, 0);
  }
}

/* ------------------------------------------------------------------ */
/*  Hàm dựng câu hỏi trắc nghiệm dùng chung                            */
/* ------------------------------------------------------------------ */

/** Tính điểm theo thời gian còn lại: trả lời nhanh được nhiều điểm hơn */
export function timeScore(fractionLeft, base = 100) {
  return Math.round(base * (0.5 + 0.5 * Math.max(0, Math.min(1, fractionLeft))));
}
