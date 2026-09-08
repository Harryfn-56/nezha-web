"""
Kiểm thử BẢN APP TRÊN ĐIỆN THOẠI (PWA).

Kiểm tra 5 việc:
  1. manifest khai báo đủ và đúng (tên, icon 192/512, icon maskable...)
  2. service worker cài được và chiếm quyền điều khiển trang
  3. Tải sẵn đủ file về máy
  4. NGẮT MẠNG rồi mở lại → app vẫn vào được và chơi được
  5. Không lưu đệm nhầm các lệnh gọi Supabase (phòng Kahoot phải là dữ
     liệu thật ngay lúc đó)

Phải chạy trên BẢN ĐÃ BUILD, không phải bản dev:
    npm run build
    node scripts/dev-server.js dist 4173
    python3 scripts/test-pwa.py
"""
import sys, json, time
from playwright.sync_api import sync_playwright

BASE = "http://localhost:4173"      # localhost được coi là nơi an toàn, sw chạy được
errors = []

SEED = """
localStorage.setItem('nz_offline','1');
localStorage.setItem('nz_students', JSON.stringify([
  {id:'TN1101::tro noi', name:'Trò Nói', class_code:'TN1101'}]));
localStorage.setItem('nz_user', JSON.stringify({role:'student',
  id:'TN1101::tro noi', name:'Trò Nói', classCode:'TN1101', className:'TN1101'}));
"""

with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(viewport={"width": 390, "height": 844}, is_mobile=True, has_touch=True)
    ctx.add_init_script(SEED)
    pg = ctx.new_page()

    # ---------------------------------------------------- 1. manifest
    pg.goto(BASE, wait_until="networkidle")
    man = pg.evaluate("""async () => {
      const r = await fetch('/manifest.webmanifest');
      return { status: r.status, body: await r.json() };
    }""")
    if man["status"] != 200:
        errors.append("manifest: không tải được")
    else:
        m = man["body"]
        icons = m.get("icons", [])
        sizes = {i.get("sizes") for i in icons}
        purposes = " ".join(i.get("purpose", "") for i in icons)
        if m.get("display") != "standalone":
            errors.append("manifest: thiếu display=standalone (mở sẽ không toàn màn hình)")
        if "192x192" not in sizes or "512x512" not in sizes:
            errors.append(f"manifest: thiếu icon 192 hoặc 512 ({sizes})")
        if "maskable" not in purposes:
            errors.append("manifest: thiếu icon maskable (Android sẽ cắt mất đầu nhân vật)")
        if not m.get("name") or not m.get("short_name"):
            errors.append("manifest: thiếu tên app")
        if not errors:
            print(f"✅ Manifest đủ: {m['short_name']} · {len(icons)} icon · "
                  f"{len(m.get('shortcuts', []))} lối tắt")

    # icon phải tải được thật
    for src in ["/assets/icon-192.png", "/assets/icon-512.png",
                "/assets/maskable-192.png", "/assets/icon-180.png"]:
        st = pg.evaluate("async (u) => (await fetch(u)).status", src)
        if st != 200:
            errors.append(f"icon: {src} không tải được ({st})")
    print("✅ Bộ icon app tải được đầy đủ")

    # ------------------------------------------ 2. service worker
    ok = pg.evaluate("""async () => {
      const reg = await navigator.serviceWorker.ready;
      return Boolean(reg && reg.active);
    }""")
    if not ok:
        errors.append("service worker: không cài được")
    else:
        print("✅ Service worker cài xong và đang chạy")

    pg.reload(wait_until="networkidle")
    time.sleep(1.0)
    controlled = pg.evaluate("() => Boolean(navigator.serviceWorker.controller)")
    if not controlled:
        errors.append("service worker: tải lại trang mà chưa chiếm quyền điều khiển")
    else:
        print("✅ Tải lại trang → service worker điều khiển việc lấy file")

    # -------------------------------------------- 3. tải sẵn bao nhiêu file
    n = pg.evaluate("""async () => {
      const names = await caches.keys();
      const mine = names.filter(n => n.startsWith('nezha-'));
      if (!mine.length) return 0;
      const c = await caches.open(mine[0]);
      return (await c.keys()).length;
    }""")
    if n < 25:
        errors.append(f"service worker: tải sẵn quá ít file ({n})")
    else:
        print(f"✅ Đã tải sẵn {n} file về máy để dùng khi mất mạng")

    # --------------------------------------------------- 4. NGẮT MẠNG
    ctx.set_offline(True)
    pg.goto(BASE + "/hoc", wait_until="domcontentloaded")
    time.sleep(2.5)
    body = pg.content()
    if "Chưa có mạng" in body:
        errors.append("offline: mở app khi mất mạng chỉ ra trang báo lỗi")
    elif "Chọn trò chơi" not in body:
        errors.append("offline: mất mạng thì không vào được trang chính")
    else:
        print("✅ Mất mạng vẫn mở được app và thấy đủ trò chơi")

    cards = len(pg.query_selector_all(".game-card"))
    if cards != 11:
        errors.append(f"offline: thiếu thẻ trò chơi khi mất mạng ({cards}/11)")

    # chơi thử một trò khi đang mất mạng
    pg.goto(BASE + "/choi/tn1101-1-5/quiz", wait_until="domcontentloaded")
    time.sleep(2.0)
    pg.screenshot(path="/home/claude/shots/pwa-offline.png")
    if not pg.query_selector(".opt"):
        errors.append("offline: mất mạng thì không chơi được trắc nghiệm")
    else:
        print("✅ Mất mạng vẫn chơi được trò chơi (bài học nằm sẵn trong app)")
    ctx.set_offline(False)

    # ------------------------------- 5. không lưu đệm lệnh gọi máy chủ
    sw = open("dist/sw.js", encoding="utf-8").read()
    if "url.origin !== self.location.origin" not in sw:
        errors.append("service worker: chưa loại trừ các lệnh gọi khác tên miền "
                      "(Supabase, phòng Kahoot có thể bị lưu đệm sai)")
    else:
        print("✅ Lệnh gọi máy chủ Supabase không bị lưu đệm (phòng Kahoot an toàn)")

    if "navigate" not in sw or "networkFirstPage" not in sw:
        errors.append("service worker: trang HTML phải lấy từ mạng trước, "
                      "nếu không học sinh sẽ kẹt ở bản cũ")
    else:
        print("✅ Trang HTML luôn lấy bản mới từ mạng trước (không kẹt bản cũ)")

    b.close()

print("\n" + "=" * 56)
if errors:
    print("❌ LỖI:")
    for e in errors:
        print("   -", e)
    sys.exit(1)
print("🎉 BẢN APP TRÊN ĐIỆN THOẠI CHẠY ĐÚNG")
