"""
Kiểm thử phần CHẤM PHÁT ÂM (bản 1.7).

Chạy trên trình duyệt thật, dùng file âm thanh giả lập giọng học sinh
(Chrome cho phép thay micro bằng file .wav) để kiểm tra 3 việc:

  1. Đo đúng thanh điệu từ cao độ giọng (4 thanh, giọng cao/thấp, ngắn/dài)
  2. Chấm theo ÂM chứ không theo chữ: chữ đồng âm vẫn được tính đúng,
     và thanh điệu lấy theo giọng ĐO ĐƯỢC chứ không theo chữ máy đoán
  3. Từ chỉ có 1 chữ vẫn chấm được, không bị "máy không nghe thấy gì"

Cần chạy trước:  node scripts/dev-server.js   (cổng 5173)
"""
import sys, os, math, wave, struct, random, json
from playwright.sync_api import sync_playwright

BASE = "http://localhost:5173"
AUD = "/tmp/nezha-aud"
SR_HZ = 48000
errors = []

# ----------------------------------------------------------------- tạo file
def curve(name, t):
    """Cao độ (nửa cung, so với giọng nền) tại thời điểm t (0..1)"""
    if name == '1': return 4.0
    if name == '2': return -2.0 + 8.0 * t
    if name == '3': return -6.0 * (t / .45) if t < .45 else -6.0 + 8.0 * ((t - .45) / .55)
    if name == '4': return 5.0 - 12.0 * t
    return 0.0

def syl(name, dur=0.45, base=180.0):
    n, out, ph = int(SR_HZ * dur), [], 0.0
    for i in range(n):
        t = i / n
        ph += 2 * math.pi * (base * 2 ** (curve(name, t) / 12)) / SR_HZ
        env = min(1.0, t / .08, (1 - t) / .12)
        out.append((math.sin(ph) + .5 * math.sin(2 * ph) + .25 * math.sin(3 * ph)) / 1.75 * env * .55)
    return out

def sil(d): return [0.0] * int(SR_HZ * d)

def write(path, s):
    with wave.open(path, 'w') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR_HZ)
        w.writeframes(b''.join(struct.pack('<h', int(max(-1, min(1, x)) * 32000)) for x in s))

def build_audio():
    os.makedirs(AUD, exist_ok=True)
    random.seed(7)
    noisy = lambda s, a=.03: [x + random.uniform(-a, a) for x in s]
    for t in '1234':
        write(f"{AUD}/t{t}.wav", sil(.35) + syl(t) + sil(.5))
        write(f"{AUD}/kid{t}.wav", sil(.3) + syl(t, .29, 260) + sil(.6))
    write(f"{AUD}/low2.wav", noisy(sil(.3) + syl('2', .4, 120) + sil(.5)))
    write(f"{AUD}/low4.wav", noisy(sil(.3) + syl('4', .4, 120) + sil(.5)))
    write(f"{AUD}/t33.wav", sil(.3) + syl('3', .4) + sil(.18) + syl('3', .45) + sil(.4))
    write(f"{AUD}/t24.wav", sil(.3) + syl('2', .4) + sil(.18) + syl('4', .45) + sil(.4))
    write(f"{AUD}/t143.wav", sil(.3) + syl('1', .35) + sil(.16) + syl('4', .35) + sil(.16) + syl('3', .4) + sil(.4))

ARGS = ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream",
        "--autoplay-policy=no-user-gesture-required"]

def page_with(p, wav):
    b = p.chromium.launch(args=ARGS + [f"--use-file-for-fake-audio-capture={AUD}/{wav}%noloop"])
    pg = b.new_context(permissions=["microphone"]).new_page()
    pg.goto(BASE, wait_until="networkidle")
    return b, pg


# ================================================================ 1. thanh điệu
def test_tones(p):
    cases = [("t1.wav", [1]), ("t2.wav", [2]), ("t3.wav", [3]), ("t4.wav", [4]),
             ("kid1.wav", [1]), ("kid2.wav", [2]), ("kid3.wav", [3]), ("kid4.wav", [4]),
             ("low2.wav", [2]), ("low4.wav", [4]),
             ("t33.wav", [3, 3]), ("t24.wav", [2, 4]), ("t143.wav", [1, 4, 3])]
    wrong = []
    for wav, want in cases:
        b, pg = page_with(p, wav)
        got = pg.evaluate("""async (n) => {
          const v = await import('/js/voice.js');
          const h = await v.startPitch();
          await new Promise(r => setTimeout(r, 2200));
          const a = v.analysePitch(h.stop().frames, n);
          return a.tones.map(t => t.tone);
        }""", len(want))
        if got != want:
            wrong.append(f"{wav}: cần {want}, đo được {got}")
        b.close()
    if wrong:
        errors.append("đo thanh điệu sai: " + " · ".join(wrong))
    else:
        print(f"✅ Đo đúng thanh điệu ở cả {len(cases)} mẫu giọng (cao/thấp, ngắn/dài, 1–3 âm tiết)")


# ======================================================= 2. chấm theo âm
def test_scoring(p):
    b, pg = page_with(p, "t3.wav")     # giọng đọc thanh 3
    r = pg.evaluate("""async () => {
      const P = await import('/js/pinyin.js');
      const V = await import('/js/voice.js');
      const { LESSONS } = await import('/js/data.js');
      LESSONS.forEach(P.learnLesson);

      const h = await V.startPitch();
      await new Promise(r => setTimeout(r, 2200));
      const a = V.analysePitch(h.stop().frames, 1);

      const hao = { hz: '好', py: 'hǎo' };
      return {
        measured:   a.tones.map(t => t.tone),
        dongAm:     P.scoreSpeech({hz:'师', py:'shī'}, '诗').pct,      // đồng âm đúng
        saiThanh:   P.scoreSpeech(hao, '号').pct,                      // máy nghe 号 (hào)
        coCaoDo:    P.scoreSpeech(hao, '号', { tones: a.tones }).pct,   // nhưng đo được thanh 3
        saiHan:     P.scoreSpeech({hz:'你好', py:'nǐ hǎo'}, '再见').pct,
        saiPhuAm:   P.scoreSpeech({hz:'四', py:'sì'}, '是').pct,
        dung:       P.scoreSpeech(hao, '好').pct,
        tips:       P.scoreSpeech(hao, '号').tips,
      };
    }""")
    b.close()

    if r["measured"] != [3]:
        errors.append(f"chấm: không đo được thanh 3 ({r['measured']})")
    if r["dung"] != 100:
        errors.append(f"chấm: đọc đúng phải 100%, được {r['dung']}%")
    if r["dongAm"] != 100:
        errors.append(f"chấm: chữ đồng âm (师/诗) phải được tính đúng, được {r['dongAm']}%")
    else:
        print("✅ Chữ đồng âm (师 ↔ 诗) được tính là đọc đúng — không còn chấm oan")
    if not (60 <= r["saiThanh"] <= 80):
        errors.append(f"chấm: sai thanh điệu phải bị trừ (~70%), được {r['saiThanh']}%")
    if r["coCaoDo"] != 100:
        errors.append(f"chấm: đo được cao độ đúng thì phải 100%, được {r['coCaoDo']}%")
    else:
        print(f"✅ Thanh điệu lấy theo giọng ĐO ĐƯỢC: máy nghe nhầm 号 vẫn cho {r['coCaoDo']}% "
              f"(không đo cao độ thì chỉ {r['saiThanh']}%)")
    if r["saiHan"] > 25:
        errors.append(f"chấm: đọc sai hẳn phải rất thấp, được {r['saiHan']}%")
    else:
        print(f"✅ Đọc sai hẳn (你好 → 再见) chỉ {r['saiHan']}% — không chấm nhầm thành đúng")
    if not (70 <= r["saiPhuAm"] <= 90):
        errors.append(f"chấm: lẫn s/sh phải trừ một phần, được {r['saiPhuAm']}%")
    if not r["tips"] or "thanh" not in " ".join(r["tips"]).lower():
        errors.append("chấm: không có lời nhắc cụ thể về thanh điệu")
    else:
        print("✅ Có lời nhắc cụ thể: " + r["tips"][0][:70])


# ============================================= 3. từ 1 chữ trên màn hình game
ROSTER = """
window.localStorage.setItem('nz_offline','1');
window.localStorage.setItem('nz_students', JSON.stringify([
  {id:'TN1101::tro noi', name:'Trò Nói', class_code:'TN1101'}]));
window.localStorage.setItem('nz_user', JSON.stringify(
  {role:'student', id:'TN1101::tro noi', name:'Trò Nói', classCode:'TN1101', className:'TN1101'}));
"""

# Bộ nhận diện giả: KHÔNG nghe ra chữ nào (đúng cảnh giáo viên phản ánh với từ 1 chữ)
DEAF = """
class DeafRec {
  constructor(){ this.lang=''; this.continuous=false; this.interimResults=false; this.maxAlternatives=1;
                 this.onresult=null; this.onerror=null; this.onend=null; }
  start(){ setTimeout(()=>{ this.onerror && this.onerror({error:'no-speech'});
                            this.onend && this.onend(); }, 1400); }
  stop(){ this.onend && this.onend(); }
  abort(){}
}
window.SpeechRecognition = DeafRec;
"""

# Bài thử chỉ gồm TỪ MỘT CHỮ, tất cả đều thanh 3 (khớp file giọng mẫu t3.wav)
ONE_CHAR = """
window.localStorage.setItem('nz_lessons', JSON.stringify([{
  id: 'test-1chu', code: 'TN1101', title: 'Thu tu 1 chu', subtitle: '', emoji: '\uD83E\uDDEA', custom: true,
  words: [
    {hz:'\u597D', py:'h\u01ceo', vi:'t\u1ed1t'}, {hz:'\u4F60', py:'n\u01d0', vi:'b\u1ea1n'},
    {hz:'\u6211', py:'w\u01d2', vi:'t\u00f4i'}, {hz:'\u4E94', py:'w\u01d4', vi:'n\u0103m'},
    {hz:'\u4E5D', py:'ji\u01d4', vi:'ch\u00edn'}, {hz:'\u5C0F', py:'xi\u01ceo', vi:'nh\u1ecf'},
    {hz:'\u8001', py:'l\u01ceo', vi:'gi\u00e0'}, {hz:'\u9A6C', py:'m\u01ce', vi:'ng\u1ef1a'}
  ],
  sentences: []
}]));
"""

def test_single_char(p):
    b = p.chromium.launch(args=ARGS + [f"--use-file-for-fake-audio-capture={AUD}/t3.wav%noloop"])
    ctx = b.new_context(permissions=["microphone"], viewport={"width": 1100, "height": 950})
    ctx.add_init_script(ROSTER)
    ctx.add_init_script(ONE_CHAR)
    ctx.add_init_script(DEAF)
    pg = ctx.new_page()
    pg.goto(f"{BASE}/choi/test-1chu/phatam", wait_until="networkidle")
    pg.wait_for_timeout(1600)

    if not pg.query_selector("button:has-text('Nói lại')"):
        errors.append("phát âm: không dựng được màn hình")
        b.close(); return

    # có bảng gợi ý thanh điệu cho từng chữ chưa?
    if not pg.query_selector(".tone-chip"):
        errors.append("phát âm: thiếu bảng gợi ý thanh điệu của câu mẫu")
    else:
        print("✅ Câu mẫu có sẵn gợi ý thanh điệu từng chữ")

    pg.click("button:has-text('Nói lại')")
    pg.wait_for_timeout(5200)
    pg.screenshot(path="/home/claude/shots/phatam-1chu.png", full_page=True)
    body = pg.content()

    if "chưa nghe thấy gì" in body:
        errors.append("phát âm: máy không nghe ra chữ là bỏ luôn, không chấm gì (lỗi cũ)")
    elif not pg.query_selector(".syl"):
        errors.append("phát âm: không hiện bảng chấm chi tiết từng chữ")
    else:
        print("✅ Máy không nghe ra chữ nhưng vẫn đo giọng và chấm được thanh điệu")

    if not pg.query_selector("svg.pitch"):
        errors.append("phát âm: không vẽ đường cao độ giọng")
    else:
        print("✅ Có vẽ đường cao độ: nét mờ là mẫu, nét đậm là giọng của em")
    b.close()


# ============================================= 4. nói đúng → qua câu (có stub)
SPEAK_OK = """
window.__said = '';
class OkRec {
  constructor(){ this.lang=''; this.continuous=false; this.interimResults=false; this.maxAlternatives=1;
                 this.onresult=null; this.onerror=null; this.onend=null; }
  start(){ setTimeout(()=>{
      const r=[{transcript: window.__said, confidence:0.92}]; r.length=1; r.isFinal=true;
      const results=[r]; results.length=1;
      this.onresult && this.onresult({results});
      this.onend && this.onend(); }, 700); }
  stop(){ this.onend && this.onend(); }
  abort(){}
}
window.SpeechRecognition = OkRec;
"""

def test_flow(p):
    # Cố tình KHÔNG cho dùng micro: kiểm tra máy không đo được cao độ thì vẫn
    # chấm bình thường bằng bộ nhận diện chữ (máy cũ, máy từ chối micro...)
    b = p.chromium.launch()
    ctx = b.new_context(viewport={"width": 1100, "height": 950})
    ctx.add_init_script(ROSTER)
    ctx.add_init_script(SPEAK_OK)
    pg = ctx.new_page()
    pg.goto(f"{BASE}/choi/tn1101-1-5/phatam", wait_until="networkidle")
    pg.wait_for_timeout(1500)

    target = pg.inner_text(".q-hz, .q-hz-sm").strip()
    pg.evaluate("t => window.__said = t", target)
    pg.click("button:has-text('Nói lại')")
    pg.wait_for_timeout(5200)
    pg.screenshot(path="/home/claude/shots/phatam-dung.png", full_page=True)
    now = pg.inner_text(".q-hz, .q-hz-sm").strip()
    if now == target and "Rất chuẩn" not in pg.content():
        errors.append("phát âm: đọc đúng y hệt mà không được tính đạt")
    else:
        print("✅ Đọc đúng → chấm đạt và sang câu tiếp theo")

    # đọc sai hẳn nhiều lần → vẫn phải chuyển câu, không kẹt
    stuck = pg.inner_text(".q-hz, .q-hz-sm").strip()
    pg.evaluate("() => window.__said = '天气很好啊'")
    for _ in range(4):
        btn = pg.query_selector("button:has-text('Nói lại'), button:has-text('Thử lại lần nữa')")
        if not btn:
            break
        btn.click()
        pg.wait_for_timeout(5200)
        if pg.inner_text(".q-hz, .q-hz-sm").strip() != stuck:
            break
    if pg.inner_text(".q-hz, .q-hz-sm").strip() == stuck:
        errors.append("phát âm: đọc sai nhiều lần vẫn kẹt lại một câu")
    else:
        print("✅ Đọc chưa đúng thì được thử lại, hết lượt là sang câu khác (không kẹt)")
    b.close()


build_audio()
with sync_playwright() as p:
    test_tones(p)
    test_scoring(p)
    test_single_char(p)
    test_flow(p)

print("\n" + "=" * 56)
if errors:
    print("❌ LỖI:")
    for e in errors:
        print("   -", e)
    sys.exit(1)
print("🎉 PHẦN CHẤM PHÁT ÂM CHẠY ĐÚNG")
