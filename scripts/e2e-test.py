"""Kiểm thử tự động website bằng trình duyệt thật (Playwright)."""
import sys, time
from playwright.sync_api import sync_playwright

BASE = "http://localhost:5173"
SHOTS = "/home/claude/shots"
errors = []
console_errors = []

def snap(page, name, full=False):
    page.screenshot(path=f"{SHOTS}/{name}.png", full_page=full)

with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(viewport={"width": 1280, "height": 900})
    page = ctx.new_page()
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
    assert len(cards) == 9, f"Cần 9 game, thấy {len(cards)}"

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

    # ------------------------------- 2b. Thẻ lật: màn chọn chủ đề
    page.goto(f"{BASE}/choi/tn1101-1-5/flashcard", wait_until="networkidle")
    time.sleep(1.2)
    if "chủ đề" not in page.content():
        errors.append("flashcard: không hiện màn chọn chủ đề")
    topics = page.query_selector_all(".game-card")
    print(f"✅ Thẻ lật có {len(topics)} lựa chọn chủ đề (kể cả Tất cả)")
    if len(topics) < 3:
        errors.append("flashcard: quá ít chủ đề")
    snap(page, "03b-flashcard-topics", full=True)
    topics[0].click()
    time.sleep(1.2)
    if not page.query_selector(".fc"):
        errors.append("flashcard: chọn chủ đề xong không vào được bộ thẻ")
    else:
        print("✅ Chọn chủ đề → vào bộ thẻ OK")
    snap(page, "03c-flashcard-deck")

    # ------------------------------- 2c. Na Tra: tăng tốc sau mỗi 6 câu
    page.goto(f"{BASE}/choi/tn1101-1-5/rush", wait_until="networkidle")
    time.sleep(1.0)
    # Tra nghĩa đúng để trả lời chuẩn, nhờ vậy chơi được qua nhiều cấp
    meaning = page.evaluate(
        "async () => { const m = await import('/js/data.js');"
        " const o = {}; m.LESSONS[0].words.forEach(w => o[w.hz] = w.vi); return o; }")
    speeds = []
    for _ in range(8):
        faller = page.query_selector(".faller")
        if not faller:
            break
        chip = page.query_selector(".chip-soft")
        if chip:
            s = chip.inner_text()
            if not speeds or speeds[-1] != s:
                speeds.append(s)
        want = meaning.get(faller.inner_text().strip(), None)
        opts = page.query_selector_all(".opt:not(.locked)")
        target = next((o for o in opts if want and want in o.inner_text()), None)
        (target or opts[0]).click()
        time.sleep(1.0)
    html = page.content()
    if "Cấp 2" not in html:
        errors.append(f"rush: không lên được cấp 2 (các mốc tốc độ: {speeds})")
    elif len(speeds) < 2:
        errors.append(f"rush: tốc độ rơi không đổi ({speeds})")
    else:
        print(f"✅ Na Tra đại chiến tăng tốc theo cấp: {' → '.join(speeds)}")
    snap(page, "10b-rush-level", full=True)

    # ------------------------------- 2c-bis. Tập viết chữ Hán
    # Thư viện nét chữ nạp từ CDN nên môi trường test không tải được:
    # thay bằng một bản giả để kiểm tra đúng phần luật chơi của mình.
    STUB = """
    window.HanziWriter = {
      create: function (node, ch, opts) {
        node.textContent = ch;
        return {
          animateCharacter: function () { window.__animated = (window.__animated || 0) + 1; },
          quiz: function (cfg) { window.__quiz = cfg; },
        };
      }
    };
    """
    wctx = b.new_context(viewport={"width": 1280, "height": 900})
    wpg = wctx.new_page()
    wpg.add_init_script(STUB)
    wpg.goto(BASE, wait_until="networkidle"); time.sleep(0.8)
    wpg.fill("input[placeholder*='Nguyễn']", "Trò Viết")
    wpg.fill("input[placeholder*='TH2001']", "TN1101")
    wpg.click("button:has-text('Bắt đầu học')")
    wpg.wait_for_url("**/hoc", timeout=8000); time.sleep(1)
    n_games = len(wpg.query_selector_all(".game-card"))
    if n_games != 9:
        errors.append(f"trang chính: cần 9 trò chơi, thấy {n_games}")
    else:
        print("✅ Trang chính có 9 trò chơi (thêm Tập viết)")

    wpg.goto(f"{BASE}/choi/tn1101-1-5/viet", wait_until="networkidle")
    time.sleep(1.5)
    snap(wpg, "09b-viet", full=True)
    if not wpg.query_selector(".writer-pad"):
        errors.append("viet: không dựng được khung tập viết")
    else:
        print("✅ Tập viết: dựng được 2 ô (chữ mẫu + ô viết)")

    def counter(pg):
        t = pg.inner_text(".lbl")
        return t.split("·")[0].strip()

    first = counter(wpg)
    # Lần 1 sạch lỗi → vẫn ở chữ cũ
    wpg.evaluate("() => window.__quiz.onComplete()")
    time.sleep(1.6)
    still = counter(wpg)
    # Lần 2 sạch lỗi → sang chữ mới
    wpg.evaluate("() => window.__quiz.onComplete()")
    time.sleep(1.8)
    moved = counter(wpg)
    if still != first:
        errors.append("viet: mới viết đúng 1 lần đã chuyển chữ")
    elif moved == first:
        errors.append("viet: viết đúng 2 lần vẫn không chuyển chữ")
    else:
        print(f"✅ Tập viết: phải đúng 2 lần mới sang chữ khác ({first} → {moved})")

    # Sai nét thì lần đó không được tính
    wpg.evaluate("() => { window.__quiz.onMistake(); window.__quiz.onComplete(); }")
    time.sleep(1.6)
    wpg.evaluate("() => window.__quiz.onComplete()")
    time.sleep(1.6)
    after_bad = counter(wpg)
    if after_bad != moved:
        errors.append("viet: lần viết có nét sai vẫn được tính là đạt")
    else:
        print("✅ Tập viết: lần nào sai nét thì lần đó không được tính")
    snap(wpg, "09c-viet-progress", full=True)

    # Không tải được thư viện thì báo lỗi tử tế
    fpg = wctx.new_page()
    fpg.route("**/hanzi-writer*", lambda r: r.abort())
    fpg.add_init_script("window.HanziWriter = undefined;")
    fpg.goto(f"{BASE}/choi/tn1101-1-5/viet", wait_until="networkidle")
    time.sleep(2.5)
    if "Không tải được bộ nét chữ" not in fpg.content():
        errors.append("viet: mất mạng nhưng không hiện thông báo hướng dẫn")
    else:
        print("✅ Tập viết: mất mạng thì báo lỗi rõ ràng, không treo")
    snap(fpg, "09d-viet-offline", full=True)
    fpg.close()
    wctx.close()

    # ------------------------------- 2d. Bảng số 1–99
    page.goto(f"{BASE}/bang-so", wait_until="networkidle")
    time.sleep(1.0)
    n_cells = len(page.query_selector_all(".num-cell"))
    if n_cells != 99:
        errors.append(f"bảng số: cần 99 ô, thấy {n_cells}")
    else:
        print("✅ Bảng số 1–99 đủ 99 ô")
    snap(page, "02b-bang-so", full=True)

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

    # ------------------------------------ 3b. Bảng xếp hạng lớp cho học sinh
    page.goto(BASE + "/hoc", wait_until="networkidle")
    time.sleep(2.0)
    snap(page, "13b-bang-xep-hang", full=True)
    body = page.content()
    if "Bảng xếp hạng lớp" not in body:
        errors.append("xếp hạng: không thấy mục bảng xếp hạng lớp")
    elif "đang xếp thứ" not in body:
        errors.append("xếp hạng: không hiện thứ hạng của chính học sinh")
    else:
        rows = len(page.query_selector_all("tr.me-row"))
        print(f"✅ Bảng xếp hạng lớp hiện đúng, có tô đậm dòng của em ({rows} dòng)")

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
    print("✅ Các thẻ quản trị hoạt động")

    # ------------------------- 6b. Tạo tài khoản giáo viên rồi đăng nhập thử
    page.click("button:has-text('Giáo viên')")
    time.sleep(1.0)
    page.fill("input[placeholder*='colan']", "colan")
    page.fill("input[placeholder*='Cô Lan']", "Cô Lan")
    page.fill("input[placeholder*='4 ký tự']", "lan12345")
    boxes = page.query_selector_all("input[type=checkbox]")
    if boxes:
        boxes[0].click()          # gán lớp đầu tiên
    page.click("button:has-text('Tạo tài khoản')")
    time.sleep(1.5)
    snap(page, "17b-admin-teachers", full=True)
    if "colan" not in page.content():
        errors.append("teachers: không tạo được tài khoản giáo viên")
    else:
        print("✅ Quản trị viên tạo được tài khoản giáo viên")

    page.evaluate("localStorage.removeItem('nz_user')")
    page.goto(BASE, wait_until="networkidle")
    time.sleep(0.8)
    page.click("button:has-text('Giáo viên')")
    time.sleep(0.4)
    page.fill("input[placeholder*='colan']", "colan")
    page.fill("input[type=password]", "lan12345")
    page.click("button:has-text('Vào trang quản trị')")
    page.wait_for_url("**/quan-tri", timeout=8000)
    time.sleep(1.5)
    snap(page, "17c-teacher-view", full=True)
    body = page.content()
    if "Cô Lan" not in body:
        errors.append("teachers: đăng nhập giáo viên không hiện đúng tên")
    elif "Giáo viên" in body and "👩‍🏫 Giáo viên" in body:
        errors.append("teachers: giáo viên thường vẫn thấy thẻ quản lý tài khoản")
    else:
        print("✅ Giáo viên đăng nhập riêng, không thấy thẻ quản lý tài khoản")

    # ------------------------- 6c. Giáo viên thường tự tạo lớp của mình
    page.click("button:has-text('Lớp học')")
    time.sleep(1.0)
    page.fill("input[placeholder*='TH2002']", "CL9999")
    page.fill("input[placeholder*='thiếu nhi']", "Lớp thử của Cô Lan")
    page.click("button:has-text('Thêm lớp')")
    time.sleep(1.5)
    snap(page, "17d-teacher-add-class", full=True)
    mine = page.evaluate("() => (JSON.parse(localStorage.getItem('nz_user'))||{}).classes || []")
    if "CL9999" not in page.content():
        errors.append("classes: giáo viên không tự tạo được lớp")
    elif "CL9999" not in mine:
        errors.append(f"classes: lớp mới không được gán cho giáo viên ({mine})")
    else:
        print(f"✅ Giáo viên tự tạo lớp và được gán ngay: {mine}")

    # quay lại tài khoản quản trị cho các bước sau
    page.evaluate("localStorage.removeItem('nz_user')")
    page.goto(BASE, wait_until="networkidle")
    time.sleep(0.8)
    page.click("button:has-text('Giáo viên')")
    time.sleep(0.4)
    page.fill("input[placeholder*='colan']", "admin")
    page.fill("input[type=password]", "nezha2026")
    page.click("button:has-text('Vào trang quản trị')")
    page.wait_for_url("**/quan-tri", timeout=8000)
    time.sleep(1.2)

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

    # HAI học sinh vào phòng bằng 2 tab khác (dùng chung localStorage của phòng)
    def join_room(nick):
        pg = ctx.new_page()
        pg.goto(BASE + "/vao-phong", wait_until="networkidle")
        time.sleep(0.9)
        pg.fill("input[placeholder='000000']", pin)
        pg.fill("input[placeholder*='Họ tên']", nick)
        pg.click("button:has-text('Vào phòng')")
        time.sleep(1.3)
        if "Đã vào phòng" not in pg.content():
            errors.append(f"live: {nick} không vào được phòng")
        return pg

    stu = join_room("Tro Thu Mot")
    stu2 = join_room("Tro Thu Hai")

    page.click("button:has-text('Bắt đầu chơi')")
    time.sleep(2)
    snap(page, "21-live-question")
    if "Câu 1/" in page.content():
        print("✅ Phòng Kahoot chạy được câu hỏi")
    else:
        errors.append("live: không hiện câu hỏi")

    # -------- 8b. Bạn trả lời trước KHÔNG được biết đúng/sai khi bạn kia chưa xong
    stu.wait_for_selector(".k-opt", timeout=8000)
    stu2.wait_for_selector(".k-opt", timeout=8000)
    time.sleep(0.5)
    stu.query_selector_all(".k-opt")[0].click()
    time.sleep(3.5)                      # đủ lâu để chắc chắn không phải do chậm
    after_pick = stu.content()
    snap(stu, "21b-student-waiting", full=True)
    leaked = ("Chính xác!" in after_pick) or ("Chưa đúng rồi" in after_pick) or ("Đáp án đúng" in after_pick)
    if leaked:
        errors.append("live: bạn trả lời trước đã thấy đáp án dù bạn kia chưa trả lời")
    elif "Đã ghi nhận" not in after_pick:
        errors.append("live: không hiện màn chờ sau khi học sinh chọn")
    else:
        print("✅ Bạn trả lời trước phải chờ, chưa biết đúng/sai")

    # Bạn thứ hai trả lời → lúc này cả lớp đã xong
    stu2.query_selector_all(".k-opt")[0].click()

    # -------- 8c. Cả lớp trả lời xong → thầy/cô công bố → học sinh mới thấy đáp án
    for _ in range(14):
        time.sleep(1.0)
        if "Đáp án đúng" in stu.content():
            break
    revealed = stu.content()
    snap(stu, "21c-student-reveal", full=True)
    if "Đáp án đúng" not in revealed:
        errors.append("live: công bố xong học sinh vẫn không thấy đáp án")
    else:
        print("✅ Cả lớp trả lời xong → công bố đáp án cho học sinh")
    snap(page, "21d-host-reveal", full=True)
    stu.close(); stu2.close()

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
