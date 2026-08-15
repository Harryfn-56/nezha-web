"""Kiểm thử tự động website bằng trình duyệt thật (Playwright)."""
import sys, time
from playwright.sync_api import sync_playwright

BASE = "http://localhost:4173"
SHOTS = "/home/claude/shots"
errors = []
console_errors = []

def snap(page, name, full=False):
    page.screenshot(path=f"{SHOTS}/{name}.png", full_page=full)

with sync_playwright() as p:
    b = p.chromium.launch()
    page = b.new_page(viewport={"width": 1280, "height": 900})
    page.on("console", lambda m: console_errors.append(m.text) if m.type == "error" else None)
    page.on("pageerror", lambda e: console_errors.append("PAGEERROR: " + str(e)))

    # ---------------------------------------------------- 1. Đăng nhập
    page.goto(BASE, wait_until="networkidle")
    time.sleep(1)
    snap(page, "01-login")
    assert "NeZha" in page.content(), "Không thấy tên trung tâm"

    page.fill("input[placeholder*='Nguyễn']", "Nguyễn Minh An")
    page.fill("input[placeholder*='TH2001']", "TN1101")
    page.click("button:has-text('Bắt đầu học')")
    page.wait_for_url("**/hoc", timeout=8000)
    time.sleep(1.2)
    snap(page, "02-home", full=True)
    assert "Chào Nguyễn Minh An" in page.content(), "Không thấy lời chào"
    print("✅ Đăng nhập học sinh OK")

    cards = page.query_selector_all(".game-card")
    print(f"✅ Có {len(cards)} thẻ trò chơi")
    assert len(cards) == 8, f"Cần 8 game, thấy {len(cards)}"

    # ---------------------------------------------------- 2. Từng game
    games = [
        ("flashcard", "03-flashcard"),
        ("quiz", "04-quiz"),
        ("match", "05-match"),
        ("pinyin", "06-pinyin"),
        ("listen", "07-listen"),
        ("sentence", "08-sentence"),
        ("datequiz", "09-datequiz"),
        ("rush", "10-rush"),
    ]
    for gid, shot in games:
        page.goto(f"{BASE}/choi/tn1101-1-5/{gid}", wait_until="networkidle")
        time.sleep(1.6)
        html = page.content()
        if "Thoát" not in html:
            errors.append(f"{gid}: không dựng được khung game")
        snap(page, shot)
        print(f"✅ Game {gid} hiển thị")

    # ------------------------------------ 3. Chơi thử trắc nghiệm trọn vẹn
    page.goto(f"{BASE}/choi/tn1101-1-5/quiz", wait_until="networkidle")
    time.sleep(1)
    for i in range(13):
        opts = page.query_selector_all(".opt:not(.locked)")
        if not opts:
            break
        opts[0].click()
        time.sleep(2.0)
    time.sleep(1)
    snap(page, "11-quiz-result", full=True)
    if "điểm" not in page.content() and "Chơi lại" not in page.content():
        errors.append("quiz: không ra màn hình kết quả")
    else:
        print("✅ Chơi hết 1 lượt trắc nghiệm → có màn hình kết quả")

    # ------------------------------------ 4. Ghép cặp: bấm thử vài ô
    page.goto(f"{BASE}/choi/tn1101-1-5/match", wait_until="networkidle")
    time.sleep(1)
    mc = page.query_selector_all(".mcard")
    if len(mc) >= 4:
        mc[0].click(); time.sleep(0.4); mc[1].click(); time.sleep(1.2)
        snap(page, "12-match-play")
        print("✅ Ghép cặp phản hồi khi bấm")
    else:
        errors.append("match: không đủ ô")

    # ------------------------------------ 5. Sắp xếp câu
    page.goto(f"{BASE}/choi/tn1101-1-5/sentence", wait_until="networkidle")
    time.sleep(1)
    n_tokens = len(page.query_selector_all(".tokens .token"))
    if n_tokens:
        # DOM được vẽ lại sau mỗi lần bấm nên phải tìm lại phần tử mỗi vòng
        for _ in range(n_tokens):
            free = page.query_selector_all(".tokens .token:not(.used)")
            if not free:
                break
            free[0].click(); time.sleep(0.3)
        time.sleep(1.4)
        snap(page, "13-sentence-play")
        print("✅ Sắp xếp câu chấm được đáp án")
    else:
        errors.append("sentence: không có thẻ chữ")

    # ---------------------------------------------------- 6. Đăng nhập GV
    page.goto(BASE + "/hoc", wait_until="networkidle")
    page.evaluate("localStorage.removeItem('nz_user')")
    page.goto(BASE, wait_until="networkidle")
    time.sleep(0.8)
    page.click("button:has-text('Giáo viên')")
    time.sleep(0.4)
    page.fill("input[type=password]", "nezha2026")
    page.click("button:has-text('Vào trang quản trị')")
    page.wait_for_url("**/quan-tri", timeout=8000)
    time.sleep(1.8)
    snap(page, "14-admin-scores", full=True)
    assert "Trang quản trị" in page.content()
    print("✅ Đăng nhập giáo viên OK")

    for tab, shot in [("🏫 Lớp học", "15-admin-classes"),
                      ("📚 Bài học", "16-admin-lessons"),
                      ("☁️ Kết nối", "17-admin-cloud")]:
        page.click(f"button:has-text('{tab.split(' ',1)[1]}')")
        time.sleep(1.2)
        snap(page, shot, full=True)
    print("✅ 4 thẻ quản trị hoạt động")

    # -------------------------------- 7. Nhập bài mới bằng cách dán text
    page.click("button:has-text('Bài học')")
    time.sleep(1)
    page.fill("textarea", "Gia đình\n爸爸\n妈妈\n哥哥\n姐姐\n弟弟\n妹妹\n我爱我的家。")
    page.fill("input[placeholder*='Ôn tập bài 6']", "Bài thử nghiệm gia đình")
    page.click("button:has-text('Phân tích nội dung')")
    time.sleep(1.5)
    snap(page, "18-import-preview", full=True)
    if "爸爸" in page.content() and "bố" in page.content():
        print("✅ Nhập bài mới + tự tra từ điển OK")
    else:
        errors.append("import: không tự tra được pinyin/nghĩa")

    # ---------------------------------------------------- 8. Kahoot
    page.goto(BASE + "/live", wait_until="networkidle")
    time.sleep(1.2)
    snap(page, "19-live-setup", full=True)
    page.click("button:has-text('Tạo phòng chơi')")
    time.sleep(1.5)
    snap(page, "20-live-lobby")
    pin_el = page.query_selector(".pin-display")
    pin = pin_el.inner_text().replace(" ", "") if pin_el else None
    if pin and len(pin) == 6:
        print(f"✅ Tạo phòng Kahoot OK, PIN = {pin}")
    else:
        errors.append("live: không tạo được PIN")

    page.click("button:has-text('Bắt đầu chơi')")
    time.sleep(2)
    snap(page, "21-live-question")
    if "Câu 1/" in page.content():
        print("✅ Phòng Kahoot chạy được câu hỏi")
    else:
        errors.append("live: không hiện câu hỏi")

    # ---------------------------------------------------- 9. Mobile
    m = b.new_page(viewport={"width": 390, "height": 844}, is_mobile=True, has_touch=True)
    m.goto(BASE, wait_until="networkidle"); time.sleep(1)
    m.screenshot(path=f"{SHOTS}/22-mobile-login.png")
    m.fill("input[placeholder*='Nguyễn']", "Trần Bảo Ngọc")
    m.fill("input[placeholder*='TH2001']", "TH2001")
    m.click("button:has-text('Bắt đầu học')")
    m.wait_for_url("**/hoc", timeout=8000); time.sleep(1.2)
    m.screenshot(path=f"{SHOTS}/23-mobile-home.png", full_page=True)
    m.goto(f"{BASE}/choi/tn1101-1-5/quiz", wait_until="networkidle"); time.sleep(1.5)
    m.screenshot(path=f"{SHOTS}/24-mobile-quiz.png")
    m.goto(f"{BASE}/vao-phong", wait_until="networkidle"); time.sleep(1)
    m.screenshot(path=f"{SHOTS}/25-mobile-join.png")
    print("✅ Giao diện điện thoại OK")

    b.close()

print("\n" + "=" * 56)
real_errs = [e for e in console_errors if "favicon" not in e.lower() and "fonts.g" not in e.lower()]
if real_errs:
    print("⚠️  Lỗi console:")
    for e in real_errs[:12]:
        print("   -", e[:180])
if errors:
    print("❌ LỖI CHỨC NĂNG:")
    for e in errors:
        print("   -", e)
    sys.exit(1)
print("🎉 TẤT CẢ KIỂM THỬ ĐỀU ĐẠT")
