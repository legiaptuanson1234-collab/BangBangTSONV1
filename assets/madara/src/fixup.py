#!/usr/bin/env python3
"""Fix-ups: re-process dark-background strips with luminance alpha,
and analyse where bodyA vs bodyB differ (tracks vs whole hull)."""
import os
from PIL import Image
import numpy as np
from scipy import ndimage

SRC = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(SRC, 'frames')


def lum_alpha(rgb, floor=20, span=200):
    arr = np.array(rgb.convert('RGB')).astype(np.float32)
    lum = arr.max(axis=2)
    alpha = np.clip((lum - floor) / span, 0, 1) * 255
    rgba = np.dstack([arr.astype(np.uint8), alpha.astype(np.uint8)])
    return Image.fromarray(rgba, 'RGBA')


def despeckle(rgba, min_size=200):
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


def trim_center(rgba, cell, max_content):
    a = np.array(rgba.getchannel('A')) > 10
    ys, xs = np.where(a)
    if len(xs) == 0:
        return None
    x0, x1, y0, y1 = int(xs.min()), int(xs.max()), int(ys.min()), int(ys.max())
    crop = rgba.crop((x0, y0, x1 + 1, y1 + 1))
    w, h = crop.size
    s = min(max_content / w, max_content / h, 1.0)
    if s < 1.0:
        crop = crop.resize((max(1, round(w * s)), max(1, round(h * s))), Image.LANCZOS)
    frame = Image.new('RGBA', (cell, cell), (0, 0, 0, 0))
    frame.alpha_composite(crop, ((cell - crop.size[0]) // 2, (cell - crop.size[1]) // 2))
    return frame


def reprocess(src_file, n_frames, cell, max_content, name, floor, span=200):
    im = Image.open(os.path.join(SRC, src_file))
    W, H = im.size
    cw = W // n_frames
    d = os.path.join(OUT, name)
    os.makedirs(d, exist_ok=True)
    for i in range(n_frames):
        rgba = despeckle(lum_alpha(im.crop((i * cw, 0, (i + 1) * cw, H)), floor, span))
        frame = trim_center(rgba, cell, max_content)
        a = np.array(rgba.getchannel('A')) > 10
        print(f'{name} f{i}: content_px={int(a.sum())} of {a.size}')
        if frame is not None:
            frame.save(os.path.join(d, 'f%d.png' % i))


# Q fire: raise floor so the dark ground veil disappears
reprocess('media-generation-madara-q-fire-0-97117d09-1fc0-4b96-b380-cc4057313d80.png',
          8, 256, 240, 'q_fire', floor=45, span=180)
# Space armor + tail: black background -> luminance alpha
reprocess('media-generation-madara-space-armor-0-8c5f737f-493a-4e5a-8b8f-825fa76fe16b.png',
          8, 256, 240, 'space_armor', floor=20, span=200)
reprocess('media-generation-madara-tail-0-3a9054e0-d752-4843-a9f2-0881a29800fe.png',
          4, 64, 60, 'tail', floor=20, span=200)

# --- bodyA vs bodyB diff distribution (left/center/right thirds) ---
print('--- bodyA vs bodyB diff by region ---')
for i in range(8):
    a = np.array(Image.open(os.path.join(OUT, 'bodyA', 'f%d.png' % i)).convert('RGB')).astype(int)
    b = np.array(Image.open(os.path.join(OUT, 'bodyB', 'f%d.png' % i)).convert('RGB')).astype(int)
    d = np.abs(a - b).max(axis=2) > 40
    h, w = d.shape
    L, C, R = d[:, :w // 3].sum(), d[:, w // 3:2 * w // 3].sum(), d[:, 2 * w // 3:].sum()
    print(f'frame {i}: changed>40 px L={L} C={C} R={R} total={d.sum()}')
