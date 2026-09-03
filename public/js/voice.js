/**
 * ĐO GIỌNG THẬT — CAO ĐỘ & THANH ĐIỆU
 * ======================================================================
 * Bộ nhận diện giọng nói của trình duyệt trả về CHỮ, không trả về thanh
 * điệu. Nó đoán chữ theo ngữ cảnh, nên em đọc đúng "hǎo" mà máy vẫn có thể
 * ghi ra 号 (hào) — chấm theo chữ là oan. Với từ CHỈ CÓ 1 CHỮ thì càng dễ
 * sai vì máy không có ngữ cảnh nào để đoán.
 *
 * File này thu thẳng tiếng của em rồi ĐO CAO ĐỘ giọng (tần số cơ bản F0)
 * để biết em đọc thanh mấy:
 *
 *      Thanh 1  ˉ  cao, giữ đều          Thanh 3  ˇ  xuống rồi lên
 *      Thanh 2  ˊ  đi lên                Thanh 4  ˋ  xuống dứt khoát
 *
 * Cách làm: lấy từng khung 46ms, tính F0 bằng phép tự tương quan
 * (autocorrelation) — cùng nguyên lý với máy lên dây đàn. Sau đó cắt thành
 * các âm tiết theo chỗ ngắt hơi, đổi sang thang nửa cung rồi xem đường cong
 * đi lên hay đi xuống.
 *
 * Không dùng thư viện ngoài — chỉ Web Audio API có sẵn trong trình duyệt.
 */

const FRAME = 2048;          // số mẫu mỗi khung
const HOP = 512;             // bước nhảy giữa 2 khung
const F0_MIN = 70;           // giọng thấp nhất còn xét (Hz)
const F0_MAX = 500;          // giọng cao nhất còn xét (Hz)

/**
 * Mở micro và bắt đầu ghi cao độ.
 * @returns {Promise<{stop:Function, cancel:Function}>}
 *   stop()   → trả về { frames, sampleRate, ms }
 *   cancel() → tắt micro, bỏ dữ liệu
 */
export async function startPitch() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error('Máy này không mở được micro');
  }
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
  });

  const Ctx = window.AudioContext || window.webkitAudioContext;
  const ctx = new Ctx();
  if (ctx.state === 'suspended') { try { await ctx.resume(); } catch { /* bỏ qua */ } }

  const src = ctx.createMediaStreamSource(stream);
  const analyser = ctx.createAnalyser();
  analyser.fftSize = FRAME;
  analyser.smoothingTimeConstant = 0;
  src.connect(analyser);

  const buf = new Float32Array(FRAME);
  const frames = [];
  const startedAt = performance.now();
  let timer = null;
  let closed = false;

  const tick = () => {
    if (closed) return;
    analyser.getFloatTimeDomainData(buf);
    const rms = rmsOf(buf);
    const f0 = rms > 0.012 ? detectF0(buf, ctx.sampleRate) : 0;
    frames.push({ t: performance.now() - startedAt, f0, rms });
  };
  timer = setInterval(tick, Math.round((HOP / 48000) * 1000) || 11);

  function close() {
    if (closed) return;
    closed = true;
    clearInterval(timer);
    try { src.disconnect(); } catch { /* bỏ qua */ }
    try { stream.getTracks().forEach((t) => t.stop()); } catch { /* bỏ qua */ }
    try { ctx.close(); } catch { /* bỏ qua */ }
  }

  return {
    stop() { const ms = performance.now() - startedAt; close(); return { frames, ms }; },
    cancel() { close(); },
    /** Khung đo gần nhất — dùng để vẽ cột sóng và biết em đã đọc xong chưa */
    peek() { return frames.length ? frames[frames.length - 1] : null; },
    get live() { return !closed; },
  };
}

function rmsOf(buf) {
  let s = 0;
  for (let i = 0; i < buf.length; i++) s += buf[i] * buf[i];
  return Math.sqrt(s / buf.length);
}

/**
 * Tìm tần số cơ bản bằng tự tương quan có chuẩn hoá (NSDF rút gọn).
 * Trả về 0 nếu khung này không phải tiếng nói có cao độ.
 */
export function detectF0(buf, sampleRate) {
  const n = buf.length;
  // bỏ thành phần một chiều
  let mean = 0;
  for (let i = 0; i < n; i++) mean += buf[i];
  mean /= n;

  const x = new Float32Array(n);
  for (let i = 0; i < n; i++) x[i] = buf[i] - mean;

  const minLag = Math.floor(sampleRate / F0_MAX);
  const maxLag = Math.min(Math.floor(sampleRate / F0_MIN), Math.floor(n / 2));
  if (maxLag <= minLag) return 0;

  let bestLag = -1, bestVal = 0;
  let prev = 0, rising = false;

  for (let lag = minLag; lag <= maxLag; lag++) {
    let num = 0, d1 = 0, d2 = 0;
    for (let i = 0; i + lag < n; i++) {
      num += x[i] * x[i + lag];
      d1 += x[i] * x[i];
      d2 += x[i + lag] * x[i + lag];
    }
    const val = num / (Math.sqrt(d1 * d2) + 1e-9);
    // chỉ nhận đỉnh đầu tiên sau khi đường cong bắt đầu đi lên → tránh
    // lấy nhầm bội số (đo ra nửa tần số thật)
    if (!rising) { if (val > prev) rising = true; }
    else if (val > bestVal) { bestVal = val; bestLag = lag; }
    prev = val;
  }

  if (bestLag < 0 || bestVal < 0.62) return 0;

  // nội suy parabol quanh đỉnh cho mượt
  const f = (lag) => corrAt(x, lag, n);
  const y0 = f(bestLag - 1), y1 = bestVal, y2 = f(bestLag + 1);
  const denom = (y0 - 2 * y1 + y2);
  const shift = denom ? (0.5 * (y0 - y2)) / denom : 0;
  const lag = bestLag + Math.max(-1, Math.min(1, shift));
  const hz = sampleRate / lag;
  return hz >= F0_MIN && hz <= F0_MAX ? hz : 0;
}

function corrAt(x, lag, n) {
  if (lag < 1 || lag >= n) return 0;
  let num = 0, d1 = 0, d2 = 0;
  for (let i = 0; i + lag < n; i++) {
    num += x[i] * x[i + lag];
    d1 += x[i] * x[i];
    d2 += x[i + lag] * x[i + lag];
  }
  return num / (Math.sqrt(d1 * d2) + 1e-9);
}

/* ==================================================================== */
/*  Cắt âm tiết + đoán thanh điệu                                       */
/* ==================================================================== */

const semitone = (hz, ref) => 12 * Math.log2(hz / ref);

/**
 * Phân tích các khung đã thu.
 * @param {Array} frames  [{t, f0, rms}]
 * @param {number} want   số âm tiết mong đợi (= số chữ Hán) — 0 nếu chưa biết
 * @returns {{
 *   ok: boolean, tones: Array<{tone, conf, contour, ms}>,
 *   voicedMs: number, note: string
 * }}
 */
export function analysePitch(frames, want = 0) {
  const good = frames.filter((f) => f.f0 > 0);
  if (good.length < 6) {
    return { ok: false, tones: [], voicedMs: 0, note: 'Chưa đo được cao độ giọng' };
  }

  /* Sửa lỗi "nhầm quãng tám": thỉnh thoảng phép đo ra đúng một nửa (hoặc
   * gấp đôi) tần số thật, làm đường cao độ tụt hẳn một quãng tám rồi nhảy
   * lại — thanh 2 sẽ bị đọc nhầm thành thanh 3. So với HÀNG XÓM (không phải
   * với cả câu) rồi nhân/chia 2 để kéo điểm lạc về đúng chỗ. */
  const clean = frames.map((f) => ({ ...f }));
  fixOctaves(clean);
  medianFilter3(clean);

  // Cắt thành đoạn có tiếng (âm tiết)
  let segs = splitSegments(clean);
  const natural = segs.length;
  // Gộp thì an toàn (một âm tiết có thể bị hụt hơi ở giữa), còn CẮT ĐÔI thì
  // không: nếu em mới đọc 1 tiếng mà câu cần 2, cắt bừa sẽ ra thanh điệu bịa.
  // Trường hợp đó vẫn trả kết quả nhưng đánh dấu forced để nơi gọi bỏ qua.
  let forced = false;
  if (want && segs.length > want) segs = mergeToCount(segs, clean, want);
  if (want && segs.length < want && segs.length) {
    segs = splitToCount(segs, clean, want);
    forced = true;
  }

  const ref = median(clean.filter((f) => f.f0).map((f) => f.f0));
  const tones = segs.map((sg) => classify(clean.slice(sg.a, sg.b + 1), ref));
  const voicedMs = clean.filter((f) => f.f0).length * frameMs(clean);

  return {
    ok: tones.length > 0,
    tones,
    forced,                                  // có phải cắt ép cho đủ số âm tiết không
    natural,                                 // số âm tiết nghe thấy thật sự
    voicedMs: Math.round(voicedMs),
    note: tones.length ? '' : 'Chưa tách được âm tiết nào',
  };
}

/**
 * Kéo những điểm bị đo nhầm quãng tám về đúng chỗ.
 *
 * Giọng người biến đổi TỪ TỪ, không thể nhảy nửa quãng tám giữa 2 khung
 * cách nhau 11ms. Nên: đi dọc từng khung, khung nào lệch quá xa khung trước
 * mà nhân/chia cho 2 (hoặc 3) lại về gần thì đúng là bị nhầm bội số. Cuối
 * cùng so từng đoạn với cả câu, đoạn nào lệch nguyên một quãng tám thì kéo
 * cả đoạn về.
 */
function fixOctaves(frames) {
  const K = [2, 0.5, 3, 1 / 3, 4, 0.25];
  const runs = [];
  let cur = null;
  let factor = 1, prev = 0;

  for (let i = 0; i < frames.length; i++) {
    const raw = frames[i].f0;
    if (!raw) { cur = null; factor = 1; prev = 0; continue; }
    if (!cur) { cur = { a: i, b: i }; runs.push(cur); }
    cur.b = i;

    let hz = raw * factor;
    if (prev) {
      let bestF = factor, bd = Math.abs(semitone(hz, prev));
      for (const m of K) {
        const d = Math.abs(semitone(raw * factor * m, prev));
        if (d < bd - 0.5) { bd = d; bestF = factor * m; }
      }
      factor = bestF;
      hz = raw * factor;
      if (Math.abs(semitone(hz, prev)) > 9) { factor = 1; hz = raw; }   // đứt hẳn
    }
    frames[i].f0 = hz;
    prev = hz;
  }

  // Đoạn nào lệch nguyên quãng tám so với cả câu thì kéo cả đoạn về
  const all = frames.filter((f) => f.f0).map((f) => f.f0);
  if (all.length < 8 || runs.length < 2) return;
  const gm = median(all);
  for (const r of runs) {
    const seg = [];
    for (let i = r.a; i <= r.b; i++) if (frames[i].f0) seg.push(frames[i].f0);
    if (seg.length < 4) continue;
    const d = semitone(median(seg), gm);
    let k = 0;
    if (d > 9 && d < 15) k = 0.5;
    else if (d < -9 && d > -15) k = 2;
    if (k) for (let i = r.a; i <= r.b; i++) if (frames[i].f0) frames[i].f0 *= k;
  }
}

/** Lọc trung vị 3 điểm — xoá nốt những điểm lạc lẻ loi còn sót */
function medianFilter3(frames) {
  const src = frames.map((f) => f.f0);
  for (let i = 1; i < frames.length - 1; i++) {
    const a = src[i - 1], b = src[i], c = src[i + 1];
    if (a && b && c) frames[i].f0 = [a, b, c].sort((x, y) => x - y)[1];
  }
}

function frameMs(frames) {
  if (frames.length < 2) return 11;
  return Math.max(5, (frames[frames.length - 1].t - frames[0].t) / (frames.length - 1));
}

/** Cắt theo chỗ ngắt tiếng: ≥ 3 khung liên tiếp không có cao độ = ranh giới */
function splitSegments(frames) {
  const segs = [];
  let a = -1, gap = 0;
  for (let i = 0; i < frames.length; i++) {
    if (frames[i].f0) {
      if (a < 0) a = i;
      gap = 0;
    } else if (a >= 0) {
      gap++;
      if (gap >= 4) { segs.push({ a, b: i - gap }); a = -1; gap = 0; }
    }
  }
  if (a >= 0) segs.push({ a, b: frames.length - 1 });
  // bỏ đoạn quá ngắn (dưới ~60ms) — thường là tiếng động
  const min = Math.max(4, Math.round(60 / frameMs(frames)));
  return segs.filter((s) => s.b - s.a + 1 >= min);
}

/** Gộp các đoạn ngắn sát nhau lại cho đủ số âm tiết mong đợi */
function mergeToCount(segs, frames, want) {
  const list = segs.slice();
  while (list.length > want) {
    let bi = 0, bg = Infinity;
    for (let i = 0; i + 1 < list.length; i++) {
      const g = list[i + 1].a - list[i].b;
      if (g < bg) { bg = g; bi = i; }
    }
    list[bi] = { a: list[bi].a, b: list[bi + 1].b };
    list.splice(bi + 1, 1);
  }
  return list;
}

/** Đoạn dài quá thì cắt đôi ở chỗ yếu tiếng nhất */
function splitToCount(segs, frames, want) {
  const list = segs.slice();
  let guard = 0;
  while (list.length < want && guard++ < 12) {
    let bi = -1, bl = 0;
    list.forEach((s, i) => { const l = s.b - s.a; if (l > bl) { bl = l; bi = i; } });
    if (bi < 0 || bl < 8) break;
    const s = list[bi];
    let cut = -1, low = Infinity;
    for (let i = s.a + 4; i <= s.b - 4; i++) {
      if (frames[i].rms < low) { low = frames[i].rms; cut = i; }
    }
    if (cut < 0) break;
    list.splice(bi, 1, { a: s.a, b: cut }, { a: cut + 1, b: s.b });
  }
  return list;
}

/**
 * Nhìn đường cao độ của 1 âm tiết → đoán thanh mấy.
 * Chuẩn hoá về nửa cung so với giọng trung bình của chính em, nên giọng
 * cao hay thấp đều đo được.
 */
export function classify(seg, ref) {
  const pts = seg.filter((f) => f.f0).map((f) => semitone(f.f0, ref));
  const ms = Math.round(seg.length * (seg.length > 1 ? (seg[seg.length - 1].t - seg[0].t) / (seg.length - 1) : 11));
  if (pts.length < 4) return { tone: 0, conf: 0, contour: pts, ms };

  // bỏ 10% đầu & cuối (phần chuyển tiếp phụ âm) rồi làm mượt
  const cut = Math.floor(pts.length * 0.1);
  const core = smooth(pts.slice(cut, pts.length - cut || undefined));
  if (core.length < 4) return { tone: 0, conf: 0, contour: pts, ms };

  const n = core.length;
  const head = avg(core.slice(0, Math.max(1, Math.round(n * 0.25))));
  const tail = avg(core.slice(-Math.max(1, Math.round(n * 0.25))));
  const level = avg(core);
  const min = Math.min(...core);
  const minAt = core.indexOf(min) / (n - 1);
  const slope = tail - head;
  const range = Math.max(...core) - min;

  let tone = 0, conf = 0;

  // Thanh 3: tụt xuống đáy ở khoảng giữa rồi ngoi lên
  const dipDown = head - min, dipUp = tail - min;
  if (minAt > 0.2 && minAt < 0.85 && dipDown > 1.2 && dipUp > 1.2) {
    tone = 3; conf = Math.min(1, (dipDown + dipUp) / 6);
  } else if (slope <= -2.2) {
    tone = 4; conf = Math.min(1, -slope / 6);
  } else if (slope >= 1.8) {
    tone = 2; conf = Math.min(1, slope / 5);
  } else if (range <= 2.6) {
    // bằng phẳng: cao → thanh 1, thấp & ngắn → thanh nhẹ
    if (level < -2.2 && ms < 260) { tone = 0; conf = 0.5; }
    else { tone = 1; conf = Math.min(1, (2.6 - range) / 2.6 + 0.35); }
  } else if (slope < 0) {
    tone = 4; conf = 0.35;
  } else {
    tone = 2; conf = 0.35;
  }

  // thanh 3 đọc nhanh hay bị "nửa thanh 3" (chỉ xuống, không lên)
  if (tone === 4 && level < -1.5 && slope > -4 && minAt > 0.5) { tone = 3; conf = 0.4; }

  return { tone, conf: Math.round(conf * 100) / 100, contour: core, ms };
}

function smooth(a) {
  if (a.length < 3) return a;
  const out = [];
  for (let i = 0; i < a.length; i++) {
    const s = a.slice(Math.max(0, i - 1), Math.min(a.length, i + 2));
    out.push(s.reduce((x, y) => x + y, 0) / s.length);
  }
  return out;
}
const avg = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
function median(a) {
  if (!a.length) return 0;
  const s = a.slice().sort((x, y) => x - y);
  return s[Math.floor(s.length / 2)];
}

/** Đường cao độ mẫu của 4 thanh — để vẽ hình so sánh cho em xem */
export const TONE_SHAPE = {
  1: [0.8, 0.8, 0.8, 0.8, 0.8],
  2: [0.25, 0.35, 0.5, 0.7, 0.9],
  3: [0.5, 0.25, 0.15, 0.3, 0.6],
  4: [0.95, 0.75, 0.5, 0.25, 0.05],
  0: [0.45, 0.42, 0.4, 0.38, 0.36],
};
