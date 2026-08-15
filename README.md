# 🔥 NeZha Chinese Center — Website game ôn tập tiếng Trung

Website cho học sinh chơi game ôn lại bài sau mỗi buổi học, kèm chế độ thi đấu
kiểu Kahoot để giáo viên cho cả lớp ôn bài đầu giờ.

Xây bằng **Node.js**, không dùng thư viện ngoài, build ra **website tĩnh** nên
chạy được trên **mọi gói hosting của Hostinger** (kể cả gói rẻ nhất).

---

## 📑 Mục lục

1. [Chạy thử trên máy](#1-chạy-thử-trên-máy)
2. [Đưa lên GitHub](#2-đưa-lên-github)
3. [Deploy lên Hostinger](#3-deploy-lên-hostinger)
4. [Bật lưu điểm tập trung + Kahoot nhiều máy (Supabase)](#4-bật-lưu-điểm-tập-trung--kahoot-nhiều-máy-supabase)
5. [Hướng dẫn dùng hằng ngày](#5-hướng-dẫn-dùng-hằng-ngày)
6. [Thêm bài học mới](#6-thêm-bài-học-mới)
7. [Cấu trúc thư mục](#7-cấu-trúc-thư-mục)

---

## 1. Chạy thử trên máy

Cần cài [Node.js](https://nodejs.org) phiên bản 18 trở lên.

```bash
npm run dev
# Mở trình duyệt: http://localhost:5173
```

Build bản chính thức:

```bash
npm run build      # tạo thư mục dist/
npm run preview    # xem thử bản đã build tại http://localhost:4173
```

**Tài khoản mặc định để thử:**

| Vai trò | Đăng nhập |
|---|---|
| Học sinh | Tên bất kỳ + mã lớp `TN1101` hoặc `TH2001` |
| Giáo viên | Tab "Giáo viên" → mật khẩu `nezha2026` |

> ⚠️ **Đổi mật khẩu giáo viên** trong `public/js/config.js` trước khi đưa website
> cho học sinh dùng.

---

## 2. Đưa lên GitHub

Mã nguồn đã được `git init` và commit sẵn. Chỉ cần:

**Bước 1 — Tạo repo rỗng trên GitHub**

Vào https://github.com/new → đặt tên (ví dụ `nezha-game`) → **KHÔNG** tích
"Add a README file" → bấm **Create repository**.

**Bước 2 — Đẩy code lên**

```bash
git remote add origin https://github.com/TEN-CUA-BAN/nezha-game.git
git branch -M main
git push -u origin main
```

GitHub sẽ hỏi tài khoản. Nếu bị từ chối mật khẩu, dùng **Personal Access Token**:
GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
→ Generate new token → tích quyền `repo` → dùng token đó thay cho mật khẩu.

---

## 3. Deploy lên Hostinger

### Cách A — Kéo thả (đơn giản nhất, 5 phút)

1. Chạy `npm run build` → được thư mục `dist/`
2. Đăng nhập **hPanel** của Hostinger → **Files** → **File Manager**
3. Mở thư mục `public_html`, xoá file `default.php` / `index.html` mẫu nếu có
4. Nén thư mục `dist` thành `dist.zip`, tải lên `public_html`, bấm **Extract**
5. **Quan trọng:** đưa toàn bộ file *bên trong* `dist` ra thẳng `public_html`
   (tức là `public_html/index.html`, chứ không phải `public_html/dist/index.html`)
6. Mở tên miền → website chạy 🎉

> File `.htaccess` đã được tạo sẵn trong `dist/`. File này giúp các đường dẫn như
> `/hoc`, `/quan-tri` hoạt động đúng. Nhớ bật **"Show hidden files"** trong File
> Manager để thấy và tải nó lên.

### Cách B — Tự động qua GitHub Actions (khuyên dùng lâu dài)

Mỗi lần bạn sửa code và `git push`, website tự cập nhật.

1. Trong hPanel → **Files** → **FTP Accounts**, ghi lại: FTP hostname, username, password
2. Vào repo GitHub → **Settings** → **Secrets and variables** → **Actions**
3. Bấm **New repository secret** và tạo đủ 3 mục:

   | Tên secret | Giá trị |
   |---|---|
   | `FTP_SERVER` | ví dụ `ftp.tenmiencuaban.com` |
   | `FTP_USERNAME` | tên đăng nhập FTP |
   | `FTP_PASSWORD` | mật khẩu FTP |

4. `git push` → vào tab **Actions** của repo xem tiến trình chạy

### Bật HTTPS

hPanel → **Security** → **SSL** → cài SSL miễn phí cho tên miền.
Sau đó mở file `dist/.htaccess`, **bỏ dấu `#`** ở 3 dòng cuối để ép dùng HTTPS.

---

## 4. Bật lưu điểm tập trung + Kahoot nhiều máy (Supabase)

**Không bắt buộc.** Nếu bỏ qua bước này, website vẫn chạy đủ 8 trò chơi, nhưng:

| | Không có Supabase | Có Supabase |
|---|---|---|
| 8 trò chơi ôn tập | ✅ | ✅ |
| Học sinh xem điểm của mình | ✅ (trên máy đó) | ✅ (mọi thiết bị) |
| Giáo viên xem điểm cả lớp | ❌ | ✅ |
| Kahoot nhiều điện thoại cùng chơi | ❌ | ✅ |

**Cách bật (miễn phí, khoảng 5 phút):**

1. Vào https://supabase.com → **Start your project** → đăng ký miễn phí
2. **New project** → đặt tên, chọn region **Southeast Asia (Singapore)** cho nhanh
3. Mở **SQL Editor** → **New query** → dán **toàn bộ** nội dung file
   `supabase/schema.sql` → bấm **Run**
4. Vào **Project Settings** → **API**, chép 2 giá trị:
   - `Project URL`
   - `anon` `public` key
5. Mở file `public/js/config.js`, dán vào:

```js
supabase: {
  url: 'https://xxxxxxxx.supabase.co',
  anonKey: 'eyJhbGciOi...',
},
```

6. `npm run build` → tải lại `dist/` lên Hostinger

Kiểm tra: đăng nhập giáo viên → **Quản trị** → thẻ **☁️ Kết nối** → phải thấy
"Đã kết nối máy chủ".

---

## 5. Hướng dẫn dùng hằng ngày

### Học sinh

1. Vào website → nhập **họ tên** + **mã lớp** (mã lớp chính là mật khẩu)
2. Chọn bài cần ôn → chọn 1 trong 8 trò chơi
3. Chơi xong xem điểm, sao và **danh sách từ cần ôn lại**

### Giáo viên — ôn bài đầu giờ kiểu Kahoot

1. Đăng nhập tab **Giáo viên**
2. Bấm **⚡ Phòng Kahoot** → chọn bài, số câu, thời gian → **Tạo phòng chơi**
3. **Chiếu mã PIN 6 số** lên máy chiếu
4. Học sinh mở website → **Vào phòng** → nhập PIN + tên
5. Thấy đủ học sinh thì bấm **Bắt đầu chơi**
6. Sau mỗi câu có bảng xếp hạng; hết bài có bục trao giải 🥇🥈🥉

### Giáo viên — theo dõi học sinh

**Quản trị** → **📊 Bảng điểm**: lọc theo lớp / trò chơi, xem tổng điểm, độ chính
xác của từng em, tải file **CSV mở bằng Excel** hoặc **in bảng điểm**.

---

## 6. Thêm bài học mới

**Cách 1 — Tải file lên (nhanh nhất)**

Quản trị → **📚 Bài học** → kéo thả file **Word (.docx)** hoặc **PDF/TXT/CSV**
→ hệ thống tự tách từ vựng, tự tra pinyin + nghĩa cho các từ thông dụng
→ bạn kiểm tra/sửa lại trong bảng → **💾 Lưu bài học**.

Cách trình bày file Word cho kết quả tốt nhất:

```
Chào hỏi
你好 | nǐ hǎo | xin chào
再见 | zàijiàn | tạm biệt

Số đếm
一 | yī | một
二 | èr | hai
```

Nhưng chỉ liệt kê chữ Hán trơn cũng được — hệ thống sẽ tự tra từ điển có sẵn
(khoảng 200 từ HSK1) và để trống những từ chưa biết để bạn điền.

**Cách 2 — Sửa trực tiếp trong code** (bài luôn có sẵn cho mọi thiết bị)

Mở `public/js/data.js`, thêm một object mới vào mảng `LESSONS`, rồi
`npm run build` và tải lại `dist/`.

**Thêm lớp mới:** Quản trị → **🏫 Lớp học** → nhập mã lớp + tên → **Thêm lớp**.

---

## 7. Cấu trúc thư mục

```
nezha-game/
├─ public/                    ← mã nguồn website
│  ├─ index.html
│  ├─ css/style.css           ← toàn bộ giao diện (màu lấy từ logo NeZha)
│  ├─ assets/                 ← logo, favicon
│  └─ js/
│     ├─ config.js            ← ⚙️ CHỈNH Ở ĐÂY: mật khẩu GV, mã lớp, Supabase
│     ├─ data.js              ← 📘 từ vựng bài 1–5 + danh mục 8 trò chơi
│     ├─ dict.js              ← từ điển HSK1 để tự tra khi nhập bài mới
│     ├─ importer.js          ← đọc file Word/PDF không cần thư viện ngoài
│     ├─ store.js             ← đăng nhập, lưu điểm, phòng Kahoot
│     ├─ core.js              ← tiện ích chung: DOM, phát âm, hiệu ứng, router
│     ├─ games/               ← 8 trò chơi, mỗi trò 1 file
│     └─ views/               ← các trang: đăng nhập, trang chính, quản trị, Kahoot
├─ scripts/
│  ├─ dev-server.js           ← máy chủ chạy thử
│  ├─ build.js                ← build ra dist/ + tạo .htaccess cho Hostinger
│  └─ e2e-test.py             ← kiểm thử tự động bằng trình duyệt thật
├─ supabase/schema.sql        ← SQL tạo bảng, dán vào Supabase
├─ .github/workflows/deploy.yml ← tự động deploy khi push
└─ dist/                      ← 📦 kết quả build — tải thư mục này lên Hostinger
```

### 8 trò chơi

| Trò chơi | Rèn kỹ năng |
|---|---|
| 🃏 Thẻ lật ghi nhớ | Ghi nhớ mặt chữ, nghe phát âm chuẩn |
| 🎯 Trắc nghiệm 4 đáp án | Nhận biết nghĩa, pinyin — tính điểm theo tốc độ |
| 🀄 Ghép cặp trí nhớ | Trí nhớ hình ảnh chữ Hán |
| ⌨️ Gõ pinyin | Chính tả pinyin, có bảng chèn dấu thanh |
| 🎧 Nghe chọn từ | Nghe hiểu (dùng giọng đọc của trình duyệt) |
| 🧩 Sắp xếp câu | Trật tự từ trong câu |
| 📅 Ngày tháng NeZha | Năm / tháng / ngày / tuổi bằng chữ Hán |
| 🔥 Na Tra đại chiến | Phản xạ nhận mặt chữ (chữ rơi, có mạng) |

---

## Câu hỏi thường gặp

**Học sinh không nghe được phát âm?**
Trình duyệt cần có giọng tiếng Trung. Chrome trên Android/Windows và Safari trên
iPhone thường có sẵn. Nếu không có, game "Nghe chọn từ" tự chuyển sang hiển thị
pinyin để vẫn chơi được.

**Vào `/hoc` báo lỗi 404 trên Hostinger?**
File `.htaccess` chưa được tải lên. Bật "Show hidden files" trong File Manager
rồi tải file `.htaccess` trong `dist/` lên `public_html`.

**Muốn đổi tên trung tâm / khẩu hiệu?**
Sửa `siteName` và `siteTagline` trong `public/js/config.js`.

**Chạy kiểm thử tự động:**
```bash
npm run preview          # ở một cửa sổ terminal
python3 scripts/e2e-test.py   # ở cửa sổ khác
```

---

Made with 🔥 for **NeZha Chinese Center**
