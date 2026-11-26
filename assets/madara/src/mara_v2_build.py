#!/usr/bin/env python3
"""Madara REDESIGN v2 (lệnh ngài 17:24 ngày 22/11/2026) — thân/nòng mới.

Nguồn: 2 ảnh model sinh (assets/madara/src/):
  - media-generation-madara-body-v2-*.png : 8 hướng thật trên nền trắng,
    lưới 2 hàng x 4 cột (N, NE, E, SE / S, SW, W, NW), KHÔNG suy từ hướng khác.
  - media-generation-madara-turret-v2-*.png : nòng riêng, đĩa Sharingan + nòng ngắn hướng lên.
Quy trình (PIL + scipy, không xóa file nào):
  1. Gỡ nền trắng bằng flood-fill từ biên (chỉ nền chạm biên mới trong suốt;
     vùng trắng KHUẤT bên trong như nửa quạt Uchiha được giữ).
  2. Thân: connected components -> đúng 8 component, gán hướng theo lưới
     (hàng = cy, cột = cx). Mỗi khung fit vào 140x140 giữ tỉ lệ
     (khung chéo nay 140x~132 thay vì 140x83 như v1 — sửa khuyết §7.3).
  3. Khung B (xích chạy): xoay khung về hướng Bắc, roll dải xích 5px dọc
     trục xích (chỉ cột xích tối ở 2 biên), xoay lại — hull giữ nguyên
     từng pixel (sửa khuyết §7.2: B không còn là model vẽ lại).
  4. Nòng: crop bbox, scale về rộng 52px (như nòng cũ), pivot = tâm đĩa
     Sharingan đỏ (centroid mặt nạ đỏ), đầu nòng cách pivot ~41px.
  5. Thumb 112x112 từ khung N mới.
Đầu ra: ghi đè cùng tên file assets/c/2000001.* , assets/c/2000002.* ,
assets/thumb/10000117.png (ghi đè không phải xóa) + bản sao vào
assets/madara/c/ + assets/madara/thumb/ để gói đồng bộ. JSON giữ nguyên
cấu trúc cũ (cell 150, pivot thân [75,75], timeline 8 clip), chỉ đổi
pages size + rects theo atlas mới.
"""
import json, os, sys
from PIL import Image
import numpy as np
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(
    os.path.dirname(os.path.abspath(__file__)))))
SRC = os.path.join(ROOT, 'assets', 'madara', 'src')
BODY_SRC = os.path.join(SRC, 'media-generation-madara-body-v2-0-6feda767-18b2-4380-a005-b2972cbfba4c.png')
TUR_SRC = os.path.join(SRC, 'media-generation-madara-turret-v2-0-8784a98d-9b5e-474e-98e5-ababc84a274e.png')
DIRS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']


def debg(path):
    """Gỡ nền trắng chạm biên -> RGBA. Trả ảnh RGBA."""
    im = Image.open(path).convert('RGB')
    arr = np.array(im)
    near_white = (arr[:, :, 0] > 245) & (arr[:, :, 1] > 245) & (arr[:, :, 2] > 245)
    lab, _ = ndimage.label(near_white)
    border = set(np.unique(np.concatenate([lab[0, :], lab[-1, :], lab[:, 0], lab[:, -1]]))) - {0}
    bg = np.isin(lab, list(border))
    alpha = np.where(bg, 0, 255).astype(np.uint8)
    return Image.fromarray(np.dstack([arr, alpha]), 'RGBA')


def despeckle(rgba, min_size=500):
    a = np.array(rgba.getchannel('A')) > 10
    lab, n = ndimage.label(a)
    sizes = ndimage.sum_labels(a, lab, range(1, n + 1))
    keep = np.zeros_like(a)
    for i, s in enumerate(sizes, start=1):
        if s >= min_size:
            keep |= (lab == i)
    arr = np.array(rgba)
    arr[..., 3] = np.where(keep, arr[..., 3], 0)
    return Image.fromarray(arr, 'RGBA')


def extract_body():
    rgba = despeckle(debg(BODY_SRC))
    a = np.array(rgba.getchannel('A')) > 10
    lab, n = ndimage.label(a)
    sizes = ndimage.sum_labels(a, lab, range(1, n + 1))
    comps = []
    for i, s in enumerate(sizes, start=1):
        if s < 2000:
            continue
        ys, xs = np.where(lab == i)
        comps.append({'px': int(s), 'bbox': (int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())),
                      'cx': float(xs.mean()), 'cy': float(ys.mean())})
    assert len(comps) == 8, 'expected 8 body components, got %d' % len(comps)
    rows = sorted(comps, key=lambda c: c['cy'])
    top, bot = sorted(rows[:4], key=lambda c: c['cx']), sorted(rows[4:], key=lambda c: c['cx'])
    ordered = top + bot  # N,NE,E,SE,S,SW,W,NW
    frames = []
    for c, name in zip(ordered, DIRS):
        x0, y0, x1, y1 = c['bbox']
        crop = rgba.crop((x0, y0, x1 + 1, y1 + 1))
        w, h = crop.size
        s = min(140 / w, 140 / h)
        nw, nh = max(1, round(w * s)), max(1, round(h * s))
        crop = crop.resize((nw, nh), Image.LANCZOS)
        frame = Image.new('RGBA', (150, 150), (0, 0, 0, 0))
        frame.alpha_composite(crop, ((150 - nw) // 2, (150 - nh) // 2))
        frames.append(frame)
        print('  %s: src %dx%d -> %dx%d (scale %.3f)' % (name, w, h, nw, nh, s))
    return frames


def roll_treads(frame, direction_idx):
    """Khung B: xoay về Bắc, roll cột xích 5px, xoay lại. Hull không đổi."""
    ang = direction_idx * 45
    rot = frame.rotate(-ang, resample=Image.BICUBIC, expand=False)
    arr = np.array(rot)
    a = arr[:, :, 3] > 10
    ys, xs = np.where(a)
    if len(xs) == 0:
        return frame
    x0, x1, y0, y1 = int(xs.min()), int(xs.max()), int(ys.min()), int(ys.max())
    cw = x1 - x0 + 1
    dark = arr[:, :, :3].max(axis=2) < 90
    out = arr.copy()
    tread_mask = np.zeros(a.shape, dtype=bool)
    for side in ('L', 'R'):
        cols = range(x0, x0 + max(2, cw // 4)) if side == 'L' else range(x1 - max(2, cw // 4) + 1, x1 + 1)
        for x in cols:
            seg = a[y0:y1 + 1, x]
            if seg.sum() < 10:
                continue
            frac = (dark[y0:y1 + 1, x] & seg).sum() / max(1, seg.sum())
            if frac < 0.5:
                continue
            col = out[y0:y1 + 1, x, :].copy()
            out[y0:y1 + 1, x, :] = np.roll(col, 5, axis=0)
            tread_mask[y0:y1 + 1, x] = seg
    back = Image.fromarray(out, 'RGBA').rotate(ang, resample=Image.BICUBIC, expand=False)
    if ang % 90 != 0:
        # Khung chéo: xoay 2 lần làm mờ cả hull — chỉ lấy pixel trong dải xích
        # từ ảnh xoay lại, còn lại giữ nguyên từng pixel của khung A.
        mimg = Image.fromarray((tread_mask * 255).astype(np.uint8), 'L')
        mback = np.array(mimg.rotate(ang, resample=Image.NEAREST, expand=False)) > 127
        orig = np.array(frame)
        barr = np.array(back)
        back = Image.fromarray(np.where(mback[:, :, None], barr, orig), 'RGBA')
    return back


def pack(frames, cols, out_webp, gutter=1):
    cell_w = max(f.size[0] for f in frames)
    cell_h = max(f.size[1] for f in frames)
    rows = (len(frames) + cols - 1) // cols
    W = cols * cell_w + (cols + 1) * gutter
    H = rows * cell_h + (rows + 1) * gutter
    atlas = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    rects = []
    for i, f in enumerate(frames):
        r, c = divmod(i, cols)
        cx = gutter + c * (cell_w + gutter)
        cy = gutter + r * (cell_h + gutter)
        x = cx + (cell_w - f.size[0]) // 2
        y = cy + (cell_h - f.size[1]) // 2
        atlas.alpha_composite(f, (x, y))
        rects.append([x, y, f.size[0], f.size[1]])
    atlas.save(out_webp, 'WEBP', lossless=True)
    return atlas, rects


def c_manifest(ref_path, rects, pivots, webp_rel, size, clips):
    ref = json.load(open(ref_path))
    return {'cell_size': [150, 150],
            'frames': [{'page': 0, 'pivot': pivots[i], 'rect': rects[i]} for i in range(len(rects))],
            'pages': [{'file': webp_rel, 'size': list(size)}],
            'runtime': ref.get('runtime'),
            'timeline': {'clips': clips},
            'xml': ref.get('xml')}


def build_turret():
    rgba = despeckle(debg(TUR_SRC), min_size=2000)
    a = np.array(rgba.getchannel('A')) > 10
    ys, xs = np.where(a)
    x0, x1, y0, y1 = int(xs.min()), int(xs.max()), int(ys.min()), int(ys.max())
    crop = rgba.crop((x0, y0, x1 + 1, y1 + 1))
    arr = np.array(crop)
    red = (arr[:, :, 0] > 150) & (arr[:, :, 1] < 100) & (arr[:, :, 2] < 100) & (arr[:, :, 3] > 10)
    rys, rxs = np.where(red)
    dcx, dcy = float(rxs.mean()), float(rys.mean())
    s = 52 / crop.size[0]
    nw, nh = max(1, round(crop.size[0] * s)), max(1, round(crop.size[1] * s))
    small = crop.resize((nw, nh), Image.LANCZOS)
    pivot = [round(dcx * s), round(dcy * s)]
    print('  turret: crop %dx%d -> %dx%d, disc centre (%.0f,%.0f) -> pivot %s, tip %dpx above pivot'
          % (crop.size[0], crop.size[1], nw, nh, dcx, dcy, pivot, pivot[1]))
    return small, pivot


def main():
    print('== BODY v2 ==')
    A = extract_body()
    B = [roll_treads(A[d], d) for d in range(8)]
    for d in range(8):
        da = np.array(A[d]).astype(int)
        db = np.array(B[d]).astype(int)
        diff = (np.abs(da - db).max(axis=2) > 10)
        print('  B %s: diff px=%d mean_abs=%.2f' % (DIRS[d], int(diff.sum()),
              float(np.abs(da - db).mean())))
    frames = []
    for d in range(8):
        frames += [A[d], B[d]]
    clips = [{'angle_degrees': d * 45, 'frames': [d * 2, d * 2 + 1]} for d in range(8)]
    for dest in (os.path.join(ROOT, 'assets', 'c'), os.path.join(ROOT, 'assets', 'madara', 'c')):
        atlas, rects = pack(frames, 8, os.path.join(dest, '2000001-0.webp'))
        ref = os.path.join(ROOT, 'assets', 'c', '2000001.json')
        man = c_manifest(ref, rects, [[75, 75]] * 16, '2000001-0.webp', atlas.size, clips)
        with open(os.path.join(dest, '2000001.json'), 'w') as f:
            json.dump(man, f, separators=(',', ':'))
        print('  body -> %s atlas %s' % (dest, atlas.size))
    print('== TURRET v2 ==')
    tur, pivot = build_turret()
    for dest in (os.path.join(ROOT, 'assets', 'c'), os.path.join(ROOT, 'assets', 'madara', 'c')):
        atlas, rects = pack([tur], 1, os.path.join(dest, '2000002-0.webp'))
        ref = os.path.join(ROOT, 'assets', 'c', '2000002.json')
        man = c_manifest(ref, rects, [pivot], '2000002-0.webp', atlas.size,
                         [{'angle_degrees': 0, 'frames': [0]}])
        with open(os.path.join(dest, '2000002.json'), 'w') as f:
            json.dump(man, f, separators=(',', ':'))
        print('  turret -> %s atlas %s pivot %s' % (dest, atlas.size, pivot))
    print('== THUMB (from N frame) ==')
    thumb = Image.new('RGBA', (112, 112), (0, 0, 0, 0))
    a = np.array(A[0].getchannel('A')) > 10
    ys, xs = np.where(a)
    crop = A[0].crop((int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1))
    s = min(104 / crop.size[0], 104 / crop.size[1])
    crop = crop.resize((max(1, round(crop.size[0] * s)), max(1, round(crop.size[1] * s))), Image.LANCZOS)
    thumb.alpha_composite(crop, ((112 - crop.size[0]) // 2, (112 - crop.size[1]) // 2))
    for dest in (os.path.join(ROOT, 'assets', 'thumb', '10000117.png'),
                 os.path.join(ROOT, 'assets', 'madara', 'thumb', '10000117.png')):
        thumb.save(dest)
        print('  thumb -> %s' % dest)


if __name__ == '__main__':
    main()
