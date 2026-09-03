/**
 * GAME 10 — LUYỆN PHÁT ÂM (发音练习)  ·  bản 1.7
 *
 * Nghe máy đọc mẫu → bấm micro nói lại → máy chấm CHI TIẾT từng âm tiết.
 *
 * ================= CHẤM THẾ NÀO =================
 * Mỗi âm tiết được tách làm 3 phần và chấm riêng từng phần:
 *
 *      hǎo  =  h        +  ao      +  thanh 3
 *              thanh mẫu   vận mẫu    (dấu)
 *              35%         35%        30%
 *
 * • Thanh mẫu / vận mẫu: lấy từ chữ mà bộ nhận diện giọng nói nghe được,
 *   rồi đổi sang pinyin để SO ÂM chứ không so chữ. Nhờ vậy em đọc đúng
 *   "shī" mà máy ghi ra 十 / 诗 (chữ đồng âm) vẫn được tính đúng.
 * • Thanh điệu: ĐO TRỰC TIẾP cao độ giọng của em (voice.js). Bộ nhận diện
 *   chữ đoán chữ theo ngữ cảnh nên rất hay sai thanh; đo cao độ chuẩn hơn
 *   nhiều và còn vẽ được đường lên xuống cho em xem.
 *
 * ============ VÌ SAO TỪ 1 CHỮ TRƯỚC ĐÂY KHÔNG ĂN ============
 * 1. Máy tự ngắt ngay khi vừa nghe thấy im lặng. Từ 1 chữ chỉ dài ~0,3 giây
 *    nên thường bị bỏ qua ("no-speech"). → Nay bật chế độ nghe liên tục,
 *    tự dừng sau khi em đọc xong hoặc khi em bấm "Xong".
 * 2. Bản cũ coi mọi kết quả trả về sớm hơn 0,5 giây là "micro nghe nhầm
 *    tiếng loa" và vứt đi — đúng những từ ngắn nhất bị vứt oan. → Nay chặn
 *    tiếng loa bằng cách khoá nút micro trong lúc loa đang đọc và tắt hẳn
 *    loa trước khi mở micro, không cần vứt kết quả nữa.
 * 3. Máy nghe không ra chữ nhưng ĐO ĐƯỢC giọng → vẫn chấm được thanh điệu
 *    và vẫn báo cho em biết, thay vì báo "không nghe thấy gì".
 *
 * Máy/trình duyệt không hỗ trợ nhận diện giọng nói thì chuyển sang chế độ
 * TỰ NGHE LẠI (thu âm rồi phát lại cạnh giọng mẫu) — vẫn luyện được.
 */

import { el, sample, shuffle, sleep, speak, sfx, toast } from '../core.js';
import { CONFIG } from '../config.js';
import { Shell } from './shell.js';
import { scoreSpeech, learnLesson, withTone, setWeights, splitPinyin } from '../pinyin.js';
import { startPitch, analysePitch, TONE_SHAPE } from '../voice.js';

const SR = window.SpeechRecognition || window.webkitSpeechRecognition || null;
const HAN = /[一-鿿]/;

const TONE_TAG = ['nhẹ', 'thanh 1 ˉ', 'thanh 2 ˊ', 'thanh 3 ˇ', 'thanh 4 ˋ'];

/** Trộn từ lẻ và câu hoàn chỉnh thành danh sách luyện tập */
function buildItems(lesson, total) {
  const words = (lesson.words || []).map((w) => ({ ...w, kind: 'word' }));
  const sentences = (lesson.sentences || []).map((s) => ({ ...s, kind: 'sentence' }));

  const nSent = Math.min(sentences.length, Math.max(2, Math.round(total * 0.4)));
  const nWord = Math.max(0, total - nSent);

  return shuffle([
    ...sample(words, Math.min(nWord, words.length)),
    ...sample(sentences, nSent),
  ]);
}

export function play(game, lesson, container) {
  const items = buildItems(lesson, CONFIG.game.speakItems || 8);
  if (!items.length) {
    toast('Bài này chưa có nội dung để luyện phát âm', 'bad');
    return;
  }

  // Cho bộ chấm biết cách đọc của các từ trong chính bài này
  learnLesson(lesson);
  setWeights(CONFIG.game.speakWeights);

  const shell = new Shell({ game, lesson, total: items.length });
  shell.attach(container);

  const GOOD = CONFIG.game.speakGoodPercent || 85;
  const PASS = CONFIG.game.speakPassPercent || 70;
  const TRIES = Math.max(1, CONFIG.game.speakTries || 3);
  const MAX_MS = (CONFIG.game.speakMaxSeconds || 6) * 1000;
  const USE_PITCH = CONFIG.game.speakUsePitch !== false;

  let i = 0;
  let tries = 0;
  let best = 0;
  let busy = false;
  let recorder = null;
  let recordedUrl = null;

  next();

  function next() {
    if (i >= items.length) return shell.finish();
    tries = 0;
    best = 0;
    if (recordedUrl) { URL.revokeObjectURL(recordedUrl); recordedUrl = null; }
    draw();
  }

  function draw() {
    const item = items[i];
    const nSyl = Array.from(item.hz).filter((c) => HAN.test(c)).length;
    const tgtSyl = splitPinyin(item.py, nSyl);

    shell.progress(i, items.length);

    const status = el('div.speak-status', {}, SR
      ? 'Bấm 🔊 nghe mẫu trước, nghe xong mới bấm micro và đọc to nhé!'
      : 'Máy này không chấm được phát âm — em thu âm rồi tự nghe lại so với giọng mẫu.');
    const meter = el('div.bar.speak-meter', {}, el('i', { style: { width: '0%' } }));
    const level = el('div.mic-level', { style: { display: 'none' } },
      Array.from({ length: 14 }, () => el('i')));
    const report = el('div.speak-report', {});
    const playback = el('div', {});

    const micBtn = el('button.btn.btn-lg.btn-block' + (SR ? '' : '.btn-orange'), {
      onclick: () => (SR ? listen() : record()),
    }, SR ? '🎤 Nói lại' : '🎤 Thu âm giọng của em');

    const skipBtn = el('button.btn.btn-ghost.btn-sm', {
      onclick: () => { shell.mark(false, 150, item); i++; next(); },
    }, 'Bỏ qua câu này →');

    /** Khoá micro trong lúc loa đang đọc mẫu — chống micro nghe nhầm tiếng loa */
    function sayModel(rate) {
      micBtn.disabled = true;
      micBtn.textContent = '🔊 Đang đọc mẫu...';
      speak(item.hz, rate ? { rate } : undefined);
      const wait = setInterval(() => {
        let speaking = false;
        try { speaking = speechSynthesis.speaking; } catch { /* bỏ qua */ }
        if (!speaking) {
          clearInterval(wait);
          if (!busy) { micBtn.disabled = false; micBtn.textContent = micLabel(); }
        }
      }, 200);
      setTimeout(() => { clearInterval(wait); if (!busy) { micBtn.disabled = false; micBtn.textContent = micLabel(); } }, 8000);
    }

    const micLabel = () => (tries > 0 && tries < TRIES ? '🎤 Thử lại lần nữa' : '🎤 Nói lại');

    shell.setStage([
      el('div.wrap-sm', { style: { padding: 0 } }, [
        el('div.qbox', {}, [
          el('div.lbl', {}, item.kind === 'sentence'
            ? `Câu ${i + 1}/${items.length} · đọc cả câu`
            : `Từ ${i + 1}/${items.length} · đọc rõ từng chữ`),
          el('div' + (item.kind === 'sentence' ? '.q-hz-sm' : '.q-hz'), {}, item.hz),
          el('div.py.q-py', {}, item.py),
          el('div.bold', { style: { marginTop: '6px' } }, item.vi),
          tgtSyl && tgtSyl.length === nSyl && nSyl <= 8
            ? el('div.tone-hint', {}, tgtSyl.map((s, k) => el('span.tone-chip', {}, [
                el('b', {}, withTone(s.plain, s.tone)),
                el('i', {}, TONE_TAG[s.tone] || 'nhẹ'),
                toneGlyph(s.tone),
              ])))
            : null,
        ]),

        el('div.row', { style: { justifyContent: 'center', margin: '14px 0' } }, [
          el('button.btn.btn-ghost', { onclick: () => sayModel() }, '🔊 Nghe mẫu'),
          el('button.btn.btn-ghost', { onclick: () => sayModel(0.5) }, '🐢 Nghe chậm'),
        ]),

        !SR ? el('div.alert', { style: { marginBottom: '12px' } },
          '⚠️ Máy/trình duyệt này không chấm được phát âm (cần Chrome hoặc Edge). Đang chạy chế độ TỰ ĐÁNH GIÁ — điểm chỉ mang tính luyện tập.') : null,

        micBtn,
        level,
        meter,
        status,
        report,
        playback,

        el('div.row', { style: { justifyContent: 'center', marginTop: '10px' } }, [skipBtn]),

        el('p.hint.tcenter', { style: { marginTop: '12px' } }, SR
          ? `Mỗi câu được thử ${TRIES} lần, máy lấy lần đọc tốt nhất. Đọc ở nơi yên tĩnh sẽ chấm chính xác hơn.`
          : 'Chế độ tự nghe lại: em thu âm rồi bấm nghe lại, so với giọng mẫu xem đã giống chưa.'),
      ]),
    ]);

    /* =============================================================== */
    /*  Nghe + chấm                                                    */
    /* =============================================================== */
    async function listen() {
      if (busy) return;
      busy = true;
      micBtn.disabled = true;
      micBtn.textContent = '⏳ Chuẩn bị...';
      status.textContent = '';
      status.className = 'speak-status';
      report.replaceChildren();

      // Tắt hẳn loa rồi chờ một nhịp cho loa im hẳn — micro sẽ chỉ nghe
      // thấy giọng em, không nghe tiếng loa vọng vào.
      try { speechSynthesis.cancel(); } catch { /* bỏ qua */ }
      await sleep(260);

      /* --- 1. Mở micro để ĐO CAO ĐỘ (đo thanh điệu) --- */
      let pitch = null;
      if (USE_PITCH) {
        try { pitch = await startPitch(); } catch { pitch = null; }
      }

      /* --- 2. Bật bộ nhận diện chữ --- */
      let heard = '';
      let conf = 1;
      let recEnded = false;
      const rec = SR ? new SR() : null;

      if (rec) {
        rec.lang = 'zh-CN';
        // Nghe LIÊN TỤC: từ 1 chữ rất ngắn, để chế độ mặc định thì máy tự
        // ngắt trước khi kịp nghe. Ta tự quyết định lúc nào dừng.
        rec.continuous = true;
        rec.interimResults = true;
        // Chỉ lấy phương án máy nghe rõ nhất — không "chọn cái giống mẫu
        // nhất" trong nhiều phương án, vì như thế đọc sai vẫn ra đúng.
        rec.maxAlternatives = 1;

        rec.onresult = (e) => {
          let final = '', interim = '';
          for (let k = 0; k < e.results.length; k++) {
            const r = e.results[k];
            const txt = String((r[0] && r[0].transcript) || '');
            if (r.isFinal) {
              final += txt;
              if (typeof r[0].confidence === 'number' && r[0].confidence > 0) conf = r[0].confidence;
            } else interim += txt;
          }
          heard = (final + interim).trim();
        };
        rec.onerror = (e) => {
          recEnded = true;
          if (e.error === 'not-allowed' || e.error === 'service-not-allowed') micDenied();
        };
        rec.onend = () => { recEnded = true; };
        try { rec.start(); } catch { recEnded = true; }
      }

      /* --- 3. Theo dõi: hiện cột sóng, tự dừng khi em đọc xong --- */
      level.style.display = '';
      status.textContent = '🎙️ Em đọc đi nào!';
      micBtn.disabled = false;
      micBtn.textContent = '⏹️ Xong';
      let stopped = false;
      const stopNow = () => { if (!stopped) { stopped = true; done(); } };
      micBtn.onclick = stopNow;

      const startedAt = Date.now();
      let spokeAt = 0;
      let quiet = 0;

      const watch = setInterval(() => {
        // cột sóng chạy theo độ to của giọng
        let rms = 0;
        if (pitch && pitch.live) {
          // lấy nhanh mức ồn gần nhất qua khung cuối (voice.js đã ghi sẵn)
          rms = lastRms(pitch);
        }
        paintLevel(level, rms);

        if (rms > 0.02) { spokeAt = Date.now(); quiet = 0; }
        else if (spokeAt) quiet += 120;

        const elapsed = Date.now() - startedAt;
        // đọc xong (im ~0,8 giây) hoặc quá lâu thì dừng
        if ((spokeAt && quiet >= 800) || elapsed >= MAX_MS) stopNow();
        // không dùng được micro đo cao độ thì chỉ dựa vào bộ nhận diện
        if (!pitch && recEnded && elapsed > 600) stopNow();
      }, 120);

      async function done() {
        clearInterval(watch);
        level.style.display = 'none';
        micBtn.onclick = () => listen();
        micBtn.textContent = '⏳ Đang chấm...';
        micBtn.disabled = true;
        status.textContent = 'Đang chấm...';

        let frames = null;
        if (pitch) { try { frames = pitch.stop().frames; } catch { frames = null; } }
        if (rec) { try { rec.stop(); } catch { /* bỏ qua */ } }

        // đợi kết quả cuối của bộ nhận diện (tối đa 1,6 giây)
        for (let k = 0; k < 16 && !recEnded; k++) await sleep(100);

        grade(heard, conf, frames, item, nSyl);
      }

      function micDenied() {
        clearInterval(watch);
        stopped = true;
        level.style.display = 'none';
        finishAttempt();
        status.textContent = '🎤 Trình duyệt chưa được phép dùng micro. Em bấm "Cho phép" rồi thử lại nhé.';
        status.className = 'speak-status bad';
      }
    }

    function finishAttempt() {
      busy = false;
      micBtn.disabled = false;
      micBtn.onclick = () => listen();
      micBtn.textContent = micLabel();
    }

    /* ---------------------------------------------------- chấm điểm */
    async function grade(heardRaw, conf, frames, itm, nSyl) {
      const heardHz = String(heardRaw || '').replace(/[^一-鿿]/g, '');

      // Đo thanh điệu từ giọng thật
      // Chỉ tin kết quả đo khi số âm tiết nghe được khớp với câu mẫu và
      // không phải cắt ép — cắt ép sẽ ra thanh điệu bịa.
      let measured = null;
      if (frames && frames.length) {
        const a = analysePitch(frames, nSyl);
        if (a.ok && !a.forced && a.tones.length === nSyl) measured = a.tones;
      }

      let res = scoreSpeech(itm, heardHz, { tones: measured });
      let pct = res.pct;
      let onlyTone = false;

      if (!heardHz) {
        if (measured) {
          // Máy không nghe ra chữ nhưng ĐO ĐƯỢC giọng → vẫn chấm thanh điệu
          onlyTone = true;
          const tgt = splitPinyin(itm.py, nSyl) || [];
          let hit = 0;
          tgt.forEach((s, k) => {
            if (!s.tone || (measured[k] && measured[k].tone === s.tone)) hit++;
          });
          pct = Math.round((hit / Math.max(1, tgt.length)) * 60);   // tối đa 60%
          res = {
            ...res, pct,
            syllables: tgt.map((s, k) => ({
              hz: Array.from(itm.hz).filter((c) => HAN.test(c))[k],
              py: s,
              heard: measured[k] ? { plain: '', tone: measured[k].tone } : null,
              state: (!s.tone || (measured[k] && measured[k].tone === s.tone)) ? 'warn' : 'bad',
              contour: measured[k] ? measured[k].contour : null,
              toneFrom: 'pitch',
              tips: [],
            })),
            tips: ['Máy chưa nghe rõ chữ — nhưng thanh điệu thì đo được. Em đọc to và tách chữ rõ hơn nhé!'],
          };
        } else {
          // Không nghe được gì cả → KHÔNG tính là một lượt thử
          finishAttempt();
          status.textContent = 'Máy chưa nghe thấy gì cả — em bấm micro rồi đọc to hơn nhé (lần này chưa tính).';
          status.className = 'speak-status bad';
          return;
        }
      }

      // Máy nghe lí nhí thì không cho xếp "rất chuẩn"
      if (conf > 0 && conf < 0.45) pct = Math.min(pct, GOOD - 10);

      tries++;
      best = Math.max(best, pct);
      finishAttempt();
      meter.firstChild.style.width = best + '%';

      drawReport(report, itm, res, heardRaw, pct, onlyTone);

      if (best >= GOOD) {
        status.textContent = res.homophone
          ? `✔ Rất chuẩn! (máy nghe ra chữ đồng âm nhưng em đọc đúng) — ${best}%`
          : `✔ Rất chuẩn! ${best}% giống giọng mẫu`;
        status.className = 'speak-status ok';
        sfx.correct();
        await sleep(1600);
        shell.mark(true, 150, itm);
        i++;
        return next();
      }

      if (tries >= TRIES) {
        const ok = best >= PASS;
        status.textContent = ok
          ? `Tạm được — ${best}%. Xem phần gợi ý bên dưới để lần sau chuẩn hơn nhé!`
          : `Chưa đúng lắm — ${best}%. Em nghe kỹ mẫu rồi luyện thêm nhé!`;
        status.className = 'speak-status ' + (ok ? 'ok' : 'bad');
        ok ? sfx.correct() : sfx.wrong();
        await sleep(600);
        sayModel();
        await sleep(2400);
        shell.mark(ok, 150, itm);
        i++;
        return next();
      }

      status.textContent = `${pct}% — còn ${TRIES - tries} lần thử. Sửa theo gợi ý rồi đọc lại nhé!`;
      status.className = 'speak-status';
      sfx.tick();
    }

    /* ------------------------- chế độ tự nghe lại (máy không chấm được) */
    async function record() {
      if (busy) return;
      if (!navigator.mediaDevices || !window.MediaRecorder) {
        status.textContent = 'Máy này không thu âm được. Em nghe mẫu rồi đọc theo, xong bấm "Đã đọc xong" nhé.';
        status.className = 'speak-status';
        playback.replaceChildren(el('button.btn.btn-green.btn-block', {
          onclick: async () => { shell.mark(true, 100, item); i++; next(); },
        }, '✅ Em đã đọc xong'));
        return;
      }

      busy = true;
      micBtn.disabled = true;
      micBtn.textContent = '🎙️ Đang thu... (bấm Dừng khi xong)';

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const chunks = [];
        recorder = new MediaRecorder(stream);
        recorder.ondataavailable = (e) => chunks.push(e.data);
        recorder.onstop = () => {
          stream.getTracks().forEach((t) => t.stop());
          if (recordedUrl) URL.revokeObjectURL(recordedUrl);
          recordedUrl = URL.createObjectURL(new Blob(chunks, { type: 'audio/webm' }));
          busy = false;
          micBtn.disabled = false;
          micBtn.textContent = '🎤 Thu lại';
          status.textContent = 'Nghe lại giọng của em rồi so với giọng mẫu nhé:';
          status.className = 'speak-status';
          playback.replaceChildren(
            el('audio', { src: recordedUrl, controls: true, style: { width: '100%', marginTop: '10px' } }),
            el('div.row.wrapf', { style: { marginTop: '10px' } }, [
              el('button.btn.btn-ghost.grow', { onclick: () => speak(item.hz) }, '🔊 Nghe lại mẫu'),
              el('button.btn.btn-green.grow', {
                onclick: () => { shell.mark(true, 80, item); i++; next(); },
              }, '✅ Em thấy đã giống'),
              el('button.btn.btn-ghost.grow', {
                onclick: () => { shell.mark(false, 100, item); i++; next(); },
              }, '🤔 Chưa giống lắm'),
            ]),
          );
        };
        recorder.start();
        micBtn.disabled = false;
        micBtn.textContent = '⏹️ Dừng thu';
        micBtn.onclick = () => {
          if (recorder && recorder.state === 'recording') recorder.stop();
          micBtn.onclick = () => record();
        };
      } catch {
        busy = false;
        micBtn.disabled = false;
        micBtn.textContent = '🎤 Thu âm giọng của em';
        status.textContent = '🎤 Không dùng được micro. Em nghe mẫu rồi đọc theo cũng được nhé!';
        status.className = 'speak-status bad';
        playback.replaceChildren(el('button.btn.btn-green.btn-block', {
          onclick: () => { shell.mark(true, 100, item); i++; next(); },
        }, '✅ Em đã đọc xong'));
      }
    }
  }
}

/* ==================================================================== */
/*  Bảng chấm chi tiết                                                  */
/* ==================================================================== */

function drawReport(host, item, res, heardRaw, pct, onlyTone) {
  const syls = res.syllables || [];

  host.replaceChildren(
    el('div.speak-card', {}, [
      el('div.row-between.wrapf', { style: { marginBottom: '10px' } }, [
        el('div.bold', {}, onlyTone ? '📈 Máy chỉ đo được thanh điệu' : '📊 Chấm chi tiết từng chữ'),
        el('span.chip' + (pct >= 85 ? '.chip-ok' : pct >= 70 ? '' : '.chip-bad'), {}, pct + '%'),
      ]),

      syls.length ? el('div.syl-row', {}, syls.map((s) => sylCard(s, onlyTone))) : null,

      heardRaw ? el('div.small.muted', { style: { marginTop: '10px' } },
        `Máy nghe được: “${heardRaw}”${res.homophone ? ' — chữ đồng âm, em đọc đúng rồi!' : ''}`) : null,

      res.mode === 'text' ? el('div.small.muted', { style: { marginTop: '6px' } },
        'Bài này chưa đủ pinyin nên máy chỉ so được chữ, chưa tách được âm.') : null,

      syls.length && syls.some((s) => s.contour) ? el('div.hint', { style: { marginTop: '8px' } },
        '📈 Đường cong nhỏ: nét đứt là thanh điệu mẫu, nét liền là giọng em vừa đọc.') : null,

      (res.tips && res.tips.length) ? el('div.tip-list', {},
        res.tips.slice(0, 3).map((t) => el('div.tip', {}, [el('span', {}, '💡'), el('span', {}, t)]))) : null,
    ]),
  );
}

function sylCard(s, onlyTone) {
  const py = s.py ? withTone(s.py.plain, s.py.tone) : '';
  const heardTone = s.heard ? s.heard.tone : null;
  const toneOk = !s.py || !s.py.tone || heardTone === s.py.tone;
  const soundOk = s.state === 'ok' || (s.score || 0) >= 0.6;

  return el('div.syl.syl-' + (s.state || 'bad'), {}, [
    el('div.syl-hz', {}, s.hz || '?'),
    el('div.syl-py', {}, py),
    el('div.syl-marks', {}, [
      // Máy không nghe ra chữ thì để dấu "?" chứ không gạch bỏ — không phải
      // em đọc sai phụ âm/vần, mà là máy chưa nghe rõ.
      chip('声', soundOk, onlyTone, 'Thanh mẫu (phụ âm đầu)'),
      chip('韵', soundOk, onlyTone, 'Vận mẫu (vần)'),
      chip('调', toneOk, false, 'Thanh điệu'),
    ]),
    pitchPic(s),
  ]);
}

function chip(label, ok, unknown, title) {
  const cls = unknown ? '.mk-idk' : ok ? '.mk-ok' : '.mk-bad';
  return el('span.mk' + cls, { title }, unknown ? label + '?' : label);
}

/** Vẽ đường cao độ mẫu (nét mờ) và đường em đọc (nét đậm) */
function pitchPic(s) {
  const want = s.py ? (TONE_SHAPE[s.py.tone] || TONE_SHAPE[0]) : null;
  if (!want) return null;
  const W = 58, H = 26, P = 3;
  const path = (arr) => arr.map((v, k) =>
    `${k ? 'L' : 'M'}${(P + (k / (arr.length - 1)) * (W - P * 2)).toFixed(1)},${(H - P - v * (H - P * 2)).toFixed(1)}`
  ).join(' ');

  const mine = normContour(s.contour);
  return el('svg.pitch', {
    viewBox: `0 0 ${W} ${H}`, width: W, height: H,
    title: 'Nét đứt: thanh điệu mẫu · Nét liền: giọng của em',
  }, [
    // nét đứt = mẫu
    el('path', {
      d: path(want), fill: 'none', stroke: 'currentColor', 'stroke-width': '1.5',
      opacity: '.4', 'stroke-linecap': 'round', 'stroke-dasharray': '3 3',
    }),
    // nét liền = giọng em vừa đọc
    mine ? el('path', {
      d: path(mine), fill: 'none', stroke: 'currentColor', 'stroke-width': '2.2',
      'stroke-linecap': 'round', 'stroke-linejoin': 'round',
    }) : null,
  ]);
}

/** Đưa đường cao độ đo được (nửa cung) về khoảng 0–1 để vẽ */
function normContour(c) {
  if (!c || c.length < 3) return null;
  const step = Math.max(1, Math.floor(c.length / 12));
  const pts = [];
  for (let k = 0; k < c.length; k += step) pts.push(c[k]);
  if (pts.length < 3) return null;
  const lo = -8, hi = 8;
  return pts.map((v) => Math.max(0.02, Math.min(0.98, (v - lo) / (hi - lo))));
}

/** Ký hiệu nhỏ hình dáng thanh điệu cạnh pinyin mẫu */
function toneGlyph(tone) {
  const arr = TONE_SHAPE[tone] || TONE_SHAPE[0];
  const W = 26, H = 14, P = 2;
  const d = arr.map((v, k) =>
    `${k ? 'L' : 'M'}${(P + (k / (arr.length - 1)) * (W - P * 2)).toFixed(1)},${(H - P - v * (H - P * 2)).toFixed(1)}`
  ).join(' ');
  return el('svg.tone-glyph', { viewBox: `0 0 ${W} ${H}`, width: W, height: H },
    el('path', { d, fill: 'none', stroke: 'currentColor', 'stroke-width': '1.8', 'stroke-linecap': 'round' }));
}

/* ------------------------------------------------- cột sóng khi đang nghe */
function lastRms(pitch) {
  try {
    const f = pitch.peek();
    return f ? f.rms : 0;
  } catch { return 0; }
}

function paintLevel(host, rms) {
  const bars = host.children;
  const n = bars.length;
  const v = Math.min(1, rms * 14);
  for (let k = 0; k < n; k++) {
    const need = (k + 1) / n;
    bars[k].className = v >= need ? 'on' : '';
  }
}
