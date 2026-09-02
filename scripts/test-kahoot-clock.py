"""
Kiểm thử phòng Kahoot khi máy học sinh BỊ LỆCH GIỜ.

Lỗi cũ: đồng hồ đếm ngược của học sinh tính bằng giờ của chính máy em đó, nên
máy nào lệch giờ 15 giây là câu 20 giây chỉ còn 5 giây.
Bản sửa: mọi mốc thời gian tính theo giờ máy chủ (đọc từ header Date).

Cần chạy trước:
    node scripts/dev-server.js        (cổng 5173)
    node scripts/fake-supabase.js     (cổng 5175)
"""
import sys, time
from playwright.sync_api import sync_playwright

BASE = "http://localhost:5173"
API = "http://localhost:5175"
SHOTS = "/home/claude/shots"
SKEW_MS = 15000          # máy học sinh chạy nhanh hơn 15 giây
errors = []

SUPA = """
window.localStorage.setItem('nz_supabase', JSON.stringify(
  { url: '%s', anonKey: 'test-anon-key' }));
""" % API

# Giả lập máy học sinh bị lệch giờ: Date.now() và new Date() đều nhanh hơn 15s
SKEW = """
(() => {
  const OFF = %d;
  const RealDate = Date;
  const realNow = RealDate.now.bind(RealDate);
  function FakeDate(...args) {
    if (args.length === 0) return new RealDate(realNow() + OFF);
    return new RealDate(...args);
  }
  FakeDate.prototype = RealDate.prototype;
  FakeDate.now = () => realNow() + OFF;
  FakeDate.parse = RealDate.parse;
  FakeDate.UTC = RealDate.UTC;
  window.Date = FakeDate;
})();
""" % SKEW_MS

with sync_playwright() as p:
    b = p.chromium.launch()

    # ---------------------------------------------------- giáo viên
    tctx = b.new_context(viewport={"width": 1280, "height": 900})
    tctx.add_init_script(SUPA)
    teacher = tctx.new_page()
    teacher.goto(BASE, wait_until="networkidle")
    time.sleep(1)
    teacher.click("button:has-text('Giáo viên')")
    time.sleep(0.4)
    teacher.fill("input[type=password]", "nezha2026")
    teacher.click("button:has-text('Vào trang quản trị')")
    teacher.wait_for_url("**/quan-tri", timeout=8000)
    time.sleep(1.2)

    teacher.goto(BASE + "/live", wait_until="networkidle")
    time.sleep(1.2)
    if "ngoại tuyến" in teacher.content():
        errors.append("không kết nối được máy chủ giả — kiểm tra fake-supabase.js")
    teacher.select_option("select.input >> nth=2", "20")      # 20 giây mỗi câu
    teacher.click("button:has-text('Tạo phòng chơi')")
    time.sleep(2)
    pin = teacher.inner_text(".pin-display").replace(" ", "")
    print(f"✅ Tạo phòng qua máy chủ: PIN {pin}")

    # ------------------------------------- học sinh có đồng hồ lệch 15 giây
    sctx = b.new_context(viewport={"width": 420, "height": 860})
    sctx.add_init_script(SUPA)
    sctx.add_init_script(SKEW)
    stu = sctx.new_page()
    stu.goto(BASE + "/vao-phong", wait_until="networkidle")
    time.sleep(1.2)
    stu.fill("input[placeholder='000000']", pin)
    stu.fill("input[placeholder*='Họ tên']", "Em Lech Gio")
    stu.click("button:has-text('Vào phòng')")
    time.sleep(2)
    if "Đã vào phòng" not in stu.content():
        errors.append("học sinh không vào được phòng qua máy chủ")
    else:
        print("✅ Học sinh (máy lệch giờ 15 giây) vào phòng OK")
    stu.screenshot(path=f"{SHOTS}/60-lobby-skew.png", full_page=True)

    # ---------------------------------------------------- vào câu hỏi
    teacher.click("button:has-text('Bắt đầu chơi')")
    stu.wait_for_selector(".k-opt", timeout=10000)
    time.sleep(1.0)

    left = int(stu.inner_text(".pill-score").strip())
    print(f"   Đồng hồ trên máy học sinh: {left} giây (thầy/cô đặt 20 giây)")
    stu.screenshot(path=f"{SHOTS}/61-question-skew.png", full_page=True)
    if left < 15:
        errors.append(f"đồng hồ học sinh bị hụt: còn {left}s trong khi phải khoảng 19s")
    else:
        print("✅ Máy lệch giờ vẫn được đủ thời gian (không còn bị hụt 15 giây)")

    # đếm ngược có chạy thật không
    time.sleep(3.2)
    left2 = int(stu.inner_text(".pill-score").strip())
    if not (left - 5 <= left2 <= left - 2):
        errors.append(f"đồng hồ không đếm ngược đúng nhịp ({left} → {left2} sau 3 giây)")
    else:
        print(f"✅ Đồng hồ đếm ngược đúng nhịp: {left}s → {left2}s")

    # ---------------------------------------------------- trả lời + công bố
    stu.query_selector_all(".k-opt")[0].click()
    time.sleep(1.2)
    if "Đã ghi nhận" not in stu.content():
        errors.append("trả lời xong không hiện màn chờ")
    for _ in range(12):
        time.sleep(1)
        if "Đáp án đúng" in stu.content():
            break
    if "Đáp án đúng" not in stu.content():
        errors.append("cả lớp trả lời xong nhưng học sinh không thấy đáp án")
    else:
        print("✅ Công bố đáp án tới máy học sinh OK")
    stu.screenshot(path=f"{SHOTS}/62-reveal-skew.png", full_page=True)

    # ---------------------------------------------------- vào lại phòng
    stu.reload(wait_until="networkidle")
    time.sleep(2.5)
    if "Đã vào lại phòng" in stu.content() or "Chờ" in stu.content() or stu.query_selector(".k-opt"):
        print("✅ Tải lại trang giữa chừng vẫn quay lại đúng phòng")
    else:
        errors.append("tải lại trang thì mất phòng, phải nhập PIN lại")

    b.close()

print("\n" + "=" * 56)
if errors:
    print("❌ LỖI:")
    for e in errors:
        print("   -", e)
    sys.exit(1)
print("🎉 PHÒNG KAHOOT CHẠY ĐÚNG KỂ CẢ KHI MÁY HỌC SINH LỆCH GIỜ")
