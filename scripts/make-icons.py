"""
Tạo bộ icon cho bản app điện thoại (PWA) từ file logo.

Chạy lại khi nào đổi logo:
    python3 scripts/make-icons.py

Cần thư viện Pillow:  pip install pillow

Vì sao phải cắt logo: logo gốc có cả dòng chữ "NeZha CHINESE CENTER".
Icon trên màn hình điện thoại chỉ to khoảng 48-64px — dòng chữ đó co lại
thành một vệt mờ không đọc được. Nên icon chỉ lấy phần NHÂN VẬT + ngọn lửa,
phóng to lên cho rõ.
"""
from PIL import Image
import numpy as np, os

SRC = 'public/assets/logo.png'
OUT = 'public/assets'
BG  = (253, 242, 233)      # #FDF2E9 — nền kem giống website

im = Image.open(SRC).convert('RGB')
arr = np.array(im).astype(int)

# Tìm khung của phần nhân vật (bỏ 30% dưới là dòng chữ)
nonwhite = arr.sum(axis=2) < 720
top = nonwhite[:int(arr.shape[0] * 0.70)]
ys, xs = np.where(top)
box = (xs.min(), ys.min(), xs.max() + 1, ys.max() + 1)
art = im.crop(box)

# Nền trắng của logo phải đổi thành nền kem, nếu không icon sẽ có một ô
# vuông trắng lộ ra giữa phần viền kem. Đổi mọi điểm trắng sang màu kem —
# kem (#FDF2E9) gần như trùng trắng nên vài đốm trắng bên trong nhân vật
# có đổi theo cũng không nhìn ra.
_a = np.array(art)
_white = (_a[:, :, 0] > 244) & (_a[:, :, 1] > 244) & (_a[:, :, 2] > 244)
_a[_white] = BG
art = Image.fromarray(_a)

# Đưa về khung vuông, giữ nguyên tỉ lệ
side = max(art.size)
sq = Image.new('RGB', (side, side), BG)
sq.paste(art, ((side - art.width) // 2, (side - art.height) // 2))


def make(size, fill, name, bg=BG):
    """fill: nhân vật chiếm bao nhiêu phần của cạnh icon (0-1)"""
    canvas = Image.new('RGB', (size, size), bg)
    inner = max(1, int(size * fill))
    art2 = sq.resize((inner, inner), Image.LANCZOS)
    off = (size - inner) // 2
    canvas.paste(art2, (off, off))
    canvas.save(os.path.join(OUT, name), optimize=True)
    print('  ✔', name, f'{size}x{size}')


print('Đang tạo icon cho bản app...')
# Icon thường: nhân vật gần kín khung
make(192, 0.90, 'icon-192.png')
make(512, 0.90, 'icon-512.png')

# Icon "maskable": Android cắt thành hình tròn/vuông bo nên nhân vật phải
# nhỏ lại, chừa viền an toàn ~20% mỗi bên, nếu không sẽ bị cắt mất đầu.
make(192, 0.60, 'maskable-192.png')
make(512, 0.60, 'maskable-512.png')

# iOS không hiểu nền trong suốt và tự bo góc — icon phải đặc, chừa ít viền
make(180, 0.86, 'icon-180.png')

# Favicon cho tab trình duyệt
make(32, 1.0, 'favicon.png')
print('Xong.')
