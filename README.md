# BangBang

## ▶️ Chơi ngay trên web (không cần tải, không cần cài gì)

**[Mở link chơi game](https://legiaptuanson1234-collab.github.io/BangBangTSONV1/)**

Hoặc copy trực tiếp: `https://legiaptuanson1234-collab.github.io/BangBangTSONV1/`

Mở bằng trình duyệt (Chrome / Edge / Firefox / Safari) trên máy nào cũng được —
lần đầu tải ~1 GB dữ liệu, các lần sau được trình duyệt nhớ (cache) nên mở nhanh.

---

Game web chạy offline hoàn toàn (không cần mạng sau khi tải xong).
Muốn bản tải về chơi nội bộ (không cần internet): xem mục "Chạy bản offline" bên dưới.

## Cấu trúc

- `index.html` — toàn bộ game (kèm hướng dẫn trong `HUONG-DAN-MO.txt`)
- `assets/` — ~5.959 file dữ liệu/ảnh của game (~1 GB)
- `MO-GAME.bat` / `MO-GAME.sh` / `MO-GAME.ps1` — script mở game (chạy server local)

## Chạy bản offline (không cần internet)

**KHÔNG** mở trực tiếp bằng cách double-click `index.html`: trình duyệt chặn
`fetch()` ở chế độ `file://` nên game sẽ báo "Không tải được dữ liệu game
(assets/data2.json)" và dừng lại.

| Hệ điều hành | Cách mở |
|---|---|
| Windows | Double-click `MO-GAME.bat` (tự dùng Python/Python Launcher nếu có, nếu không thì PowerShell có sẵn) |
| macOS / Linux | `./MO-GAME.sh` (cần Python 3) |
| Mọi máy (cách thủ công) | Mở terminal trong thư mục này: `python -m http.server 8000` rồi truy cập `http://localhost:8000/` |

Đóng server: bấm `Ctrl+C` trong cửa sổ server.

> Xem chi tiết thêm trong `HUONG-DAN-MO.txt`.

## Yêu cầu

- Trình duyệt hiện đại (Chrome / Edge / Firefox / Safari)
- Python (tùy chọn — chỉ dùng cho script server; nếu không có, dùng PowerShell trên Windows 10/11)

## Ghi chú

- Phiên bản trong repo này được cập nhật ngày 27/11/2026 (md5 index.html:
  `0dbc92878f2765470a62f8d0974b8401`).
