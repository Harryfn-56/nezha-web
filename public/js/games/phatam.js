/**
 * GAME 10 — LUYỆN PHÁT ÂM (发音练习)
 *
 * Nghe máy đọc mẫu → bấm micro nói lại → máy chấm điểm phát âm.
 * Có cả TỪ LẺ và CÂU HOÀN CHỈNH (lấy từ phần mẫu câu của bài).
 *
 * Cách chấm: dùng bộ nhận diện giọng nói tiếng Trung có sẵn trong trình
 * duyệt (Chrome/Edge/Safari). Máy nghe được câu nào thì so với câu mẫu
 * theo từng chữ, ra tỉ lệ giống nhau:
 *      ≥ 85%  → Phát âm rất chuẩn (điểm tối đa)
 *      ≥ 60%  → Tạm được, còn vài chữ chưa rõ
 *      < 60%  → Chưa đúng, nghe lại rồi thử lần nữa
 * Mỗi câu được thử 2 lần, lấy lần cao điểm hơn.
 *
 * Máy/trình duyệt nào không hỗ trợ nhận diện giọng nói (hoặc không cho
 * dùng micro) thì tự chuyển sang CHẾ ĐỘ TỰ NGHE LẠI: thu âm giọng của em
 * rồi phát lại ngay cạnh giọng mẫu để em tự so — vẫn luyện được.
 */

import { el, sample, shuffle, sleep, speak, sfx, toast } from '../core.js';
import { CONFIG } from '../config.js';
import { Shell } from './shell.js';

const SR = window.SpeechRecognition || window.webkitSpeechRecognition || null;

/** Bỏ dấu câu, khoảng trắng — chỉ giữ chữ Hán để so sánh */
const clean = (s) => String(s || '').replace(/[^一-鿿]/g, '');

/** Khoảng cách Levenshtein giữa 2 chuỗi chữ Hán */
function distance(a, b) {
  const m = a.length, n = b.length;
  if (!m) return n;
  if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(
        prev[j] + 1,
        cur[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
    prev = cur;
  }
  return prev[n];
}

/** Tỉ lệ giống nhau 0–100 giữa câu máy nghe được và câu mẫu */
function similarity(said, target) {
  const a = clean(said), b = clean(target);
  if (!b) return 0;
  if (!a) return 0;
  return Math.max(0, Math.round((1 - distance(a, b) / Math.max(a.length, b.length)) * 100));
}

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

  const shell = new Shell({ game, lesson, total: items.length });
  shell.attach(container);

  const GOOD = CONFIG.game.speakGoodPercent || 85;
  const PASS = CONFIG.game.speakPassPercent || 60;
  const TRIES = 2;

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
    shell.progress(i, items.length);

    const status = el('div.speak-status', {}, SR
      ? 'Bấm nút micro rồi đọc to, rõ ràng nhé!'
      : 'Máy này không chấm được phát âm — em thu âm rồi tự nghe lại so với giọng mẫu.');
    const meter = el('div.bar.speak-meter', {}, el('i', { style: { width: '0%' } }));
    const heard = el('div.speak-heard', {}, '');
    const playback = el('div', {});

    const micBtn = el('button.btn.btn-lg.btn-block' + (SR ? '' : '.btn-orange'), {
      onclick: () => (SR ? listen() : record()),
    }, SR ? '🎤 Nói lại' : '🎤 Thu âm giọng của em');

    const skipBtn = el('button.btn.btn-ghost.btn-sm', {
      onclick: () => { shell.mark(false, 150, item); i++; next(); },
    }, 'Bỏ qua câu này →');

    shell.setStage([
      el('div.wrap-sm', { style: { padding: 0 } }, [
        el('div.qbox', {}, [
          el('div.lbl', {}, item.kind === 'sentence'
            ? `Câu ${i + 1}/${items.length} · đọc cả câu`
            : `Từ ${i + 1}/${items.length} · đọc rõ từng chữ`),
          el('div' + (item.kind === 'sentence' ? '.q-hz-sm' : '.q-hz'), {}, item.hz),
          el('div.py.q-py', {}, item.py),
          el('div.bold', { style: { marginTop: '6px' } }, item.vi),
        ]),

        el('div.row', { style: { justifyContent: 'center', margin: '14px 0' } }, [
          el('button.btn.btn-ghost', { onclick: () => speak(item.hz) }, '🔊 Nghe mẫu'),
          el('button.btn.btn-ghost', { onclick: () => speak(item.hz, { rate: 0.5 }) }, '🐢 Nghe chậm'),
        ]),

        micBtn,
        meter,
        status,
        heard,
        playback,

        el('div.row', { style: { justifyContent: 'center', marginTop: '10px' } }, [skipBtn]),

        el('p.hint.tcenter', { style: { marginTop: '12px' } }, SR
          ? `Mỗi câu được thử ${TRIES} lần, máy lấy lần đọc tốt nhất. Đọc ở nơi yên tĩnh sẽ chấm chính xác hơn.`
          : 'Chế độ tự nghe lại: em thu âm rồi bấm nghe lại, so với giọng mẫu xem đã giống chưa.'),
      ]),
    ]);

    /* ------------------------------------------- chấm bằng giọng nói */
    function listen() {
      if (busy) return;
      busy = true;
      micBtn.disabled = true;
      micBtn.textContent = '🎙️ Đang nghe...';
      status.textContent = 'Em đọc đi nào!';
      status.className = 'speak-status';
      heard.textContent = '';

      let done = false;
      const rec = new SR();
      rec.lang = 'zh-CN';
      rec.interimResults = false;
      rec.maxAlternatives = 3;

      rec.onresult = (e) => {
        done = true;
        const alts = Array.from(e.results[0]).map((r) => r.transcript);
        const scores = alts.map((t) => similarity(t, item.hz));
        const pct = Math.max(...scores);
        const said = alts[scores.indexOf(pct)] || alts[0];
        grade(pct, said);
      };
      rec.onerror = (e) => {
        done = true;
        finishAttempt();
        if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
          status.textContent = '🎤 Trình duyệt chưa được phép dùng micro. Em bấm "Cho phép" rồi thử lại nhé.';
          status.className = 'speak-status bad';
        } else if (e.error === 'no-speech') {
          status.textContent = 'Máy chưa nghe thấy gì cả — em đọc to hơn một chút nhé!';
          status.className = 'speak-status bad';
        } else {
          status.textContent = 'Không nghe được (' + e.error + '). Em thử lại nhé.';
          status.className = 'speak-status bad';
        }
      };
      rec.onend = () => { if (!done) { finishAttempt(); } };

      try { rec.start(); } catch { done = true; finishAttempt(); }
    }

    function finishAttempt() {
      busy = false;
      micBtn.disabled = false;
      micBtn.textContent = tries > 0 && tries < TRIES ? '🎤 Thử lại lần nữa' : '🎤 Nói lại';
    }

    async function grade(pct, said) {
      tries++;
      best = Math.max(best, pct);
      finishAttempt();

      meter.firstChild.style.width = best + '%';
      heard.textContent = said ? `Máy nghe được: “${said}”` : '';

      if (best >= GOOD) {
        status.textContent = `✔ Rất chuẩn! Giống ${best}% so với giọng mẫu`;
        status.className = 'speak-status ok';
        sfx.correct();
        await sleep(1200);
        shell.mark(true, 150, item);
        i++;
        return next();
      }

      if (tries >= TRIES) {
        const ok = best >= PASS;
        status.textContent = ok
          ? `Tạm được — giống ${best}%. Nghe lại mẫu để lần sau chuẩn hơn nhé!`
          : `Chưa đúng lắm — giống ${best}%. Em nghe kỹ mẫu rồi luyện thêm nhé!`;
        status.className = 'speak-status ' + (ok ? 'ok' : 'bad');
        ok ? sfx.correct() : sfx.wrong();
        speak(item.hz);
        await sleep(1800);
        shell.mark(ok, 150, item);
        i++;
        return next();
      }

      status.textContent = `Giống ${best}% — em thử lại lần nữa nhé!`;
      status.className = 'speak-status';
      sfx.tick();
      speak(item.hz);
    }

    /* ------------------------- chế độ tự nghe lại (máy không chấm được) */
    async function record() {
      if (busy) return;
      if (!navigator.mediaDevices || !window.MediaRecorder) {
        // Không thu âm được thì chỉ luyện nghe - nói theo
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
                onclick: () => { shell.mark(true, 100, item); i++; next(); },
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

    // Đọc mẫu ngay khi vào câu mới
    setTimeout(() => speak(item.hz), 350);
  }
}
