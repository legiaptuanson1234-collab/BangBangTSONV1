#!/usr/bin/env python3
"""Compose Madara assets: slice source strips -> transparent trimmed frames.
Writes frames/<sheet>/f<i>.png + a JSON report to stdout.
Body B is generated separately; the atlas compose happens after B exists.
"""
import json, os
from PIL import Image
import numpy as np
from scipy import ndimage

SRC = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(SRC, 'frames')
os.makedirs(OUT, exist_ok=True)


def flood_alpha(rgb, thresh=235):
    """RGB -> RGBA: border-connected near-white becomes transparent; feather 2px band."""
    arr = np.array(rgb.convert('RGB')).astype(np.int16)
    near = (arr.min(axis=2) > thresh)
    lab, n = ndimage.label(near)
    border_labels = set(np.unique(np.concatenate(
        [lab[0, :], lab[-1, :], lab[:, 0], lab[:, -1]]))) - {0}
    bg = np.isin(lab, list(border_labels))
    alpha = np.full(arr.shape[:2], 255, dtype=np.float32)
    alpha[bg] = 0
    band = ndimage.binary_dilation(bg, iterations=2) & ~bg
    w = arr.min(axis=2).astype(np.float32)
    feather = np.clip((240 - w) / 60.0, 0, 1) * 255
    alpha[band] = np.minimum(alpha[band], feather[band])
    rgba = np.dstack([arr.astype(np.uint8), alpha.astype(np.uint8)])
    return Image.fromarray(rgba, 'RGBA')


def lum_alpha(rgb):
    """Dark-background fire -> RGBA via max-channel luminance."""
    arr = np.array(rgb.convert('RGB')).astype(np.float32)
    lum = arr.max(axis=2)
    alpha = np.clip((lum - 12) / 200.0, 0, 1) * 255
    rgba = np.dstack([arr.astype(np.uint8), alpha.astype(np.uint8)])
    return Image.fromarray(rgba, 'RGBA')


def despeckle(rgba, min_size=1000):
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
        return None, None
    x0, x1, y0, y1 = int(xs.min()), int(xs.max()), int(ys.min()), int(ys.max())
    crop = rgba.crop((x0, y0, x1 + 1, y1 + 1))
    w, h = crop.size
    s = min(max_content / w, max_content / h, 1.0)
    if s < 1.0:
        crop = crop.resize((max(1, round(w * s)), max(1, round(h * s))), Image.LANCZOS)
    frame = Image.new('RGBA', (cell, cell), (0, 0, 0, 0))
    frame.alpha_composite(crop, ((cell - crop.size[0]) // 2, (cell - crop.size[1]) // 2))
    return frame, (x0, y0, x1, y1)


def process_strip(src_file, n_frames, cell, max_content, mode='flood',
                  name='', thresh=235, despeckle_min=1000):
    im = Image.open(os.path.join(SRC, src_file))
    W, H = im.size
    cw = W // n_frames
    frames, report = [], []
    for i in range(n_frames):
        cell_im = im.crop((i * cw, 0, (i + 1) * cw, H))
        if mode == 'flood':
            rgba = flood_alpha(cell_im, thresh=thresh)
        else:
            rgba = lum_alpha(cell_im)
        rgba = despeckle(rgba, min_size=despeckle_min)
        frame, bbox = trim_center(rgba, cell, max_content)
        a = np.array(rgba.getchannel('A')) > 10
        touches = []
        if a[:, 0].any():
            touches.append('L')
        if a[:, -1].any():
            touches.append('R')
        if a[0, :].any():
            touches.append('T')
        if a[-1, :].any():
            touches.append('B')
        frames.append(frame)
        report.append({'frame': i, 'bbox': bbox, 'touches': touches,
                       'content_px': int(a.sum())})
    d = os.path.join(OUT, name)
    os.makedirs(d, exist_ok=True)
    for i, f in enumerate(frames):
        if f is not None:
            f.save(os.path.join(d, 'f%d.png' % i))
    return report


JOBS = [
    # (src, n, cell, max_content, mode, name, thresh, despeckle_min)
    ('madara_body_A_fixed.png', 8, 150, 140, 'flood', 'bodyA', 235, 1000),
    ('media-generation-madara-body-b-0-17a51f5f-515a-4bcd-b9e3-0f4cefe08f5e.png', 8, 150, 140, 'flood', 'bodyB', 235, 1000),
    ('media-generation-madara-bullet-0-968573a3-7ac8-4e4f-a6d2-e6f79a382d16.png',
     4, 48, 44, 'flood', 'bullet', 235, 200),
    ('media-generation-madara-blow-0-c067358f-7e33-4b37-8c03-054e061d2363.png',
     6, 96, 90, 'flood', 'blow', 235, 200),
    ('media-generation-madara-q-fire-0-97117d09-1fc0-4b96-b380-cc4057313d80.png',
     8, 256, 240, 'lum', 'q_fire', 235, 200),
    ('media-generation-madara-e-slash-0-ac84e56e-7964-4c32-b333-5a6340168856.png',
     8, 256, 240, 'flood', 'e_slash', 235, 200),
    ('media-generation-madara-r-meteor-0-999b08ae-27ad-4890-a4e1-b72375134aa4.png',
     6, 192, 180, 'flood', 'r_meteor', 235, 200),
    ('media-generation-madara-r-explosion-0-b3efa942-fa4b-4666-bcb9-710814473643.png',
     8, 256, 240, 'flood', 'r_blast', 235, 200),
    ('media-generation-madara-space-armor-0-8c5f737f-493a-4e5a-8b8f-825fa76fe16b.png',
     8, 256, 240, 'flood', 'space_armor', 235, 200),
    ('media-generation-madara-death-0-551fe80e-56db-488d-8aff-896b099842e7.png',
     8, 256, 240, 'flood', 'death', 235, 200),
    ('media-generation-madara-tail-0-3a9054e0-d752-4843-a9f2-0881a29800fe.png',
     4, 64, 60, 'flood', 'tail', 235, 100),
]

full = {}
for (src, n, cell, mc, mode, name, th, dm) in JOBS:
    full[name] = process_strip(src, n, cell, mc, mode, name, th, dm)

# cannon2: single frame, checkerboard bg (thresh 200), keep native scale for pivot calc
im = Image.open(os.path.join(SRC,
    'media-generation-madara-cannon2-0-6e1cc58c-d01f-4b78-9956-028de3fcd78a.png'))
rgba = flood_alpha(im, thresh=200)
rgba = despeckle(rgba, min_size=1000)
a = np.array(rgba.getchannel('A')) > 10
ys, xs = np.where(a)
bbox = (int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max()))
print('CANNON bbox (x0,y0,x1,y1):', bbox, 'size:', im.size)
# ring centre: ring is the widest part; pivot = (cx, bottom - width/2)
w = bbox[2] - bbox[0] + 1
h = bbox[3] - bbox[1] + 1
cx = (bbox[0] + bbox[2]) / 2
pivot_y = bbox[3] - w / 2
print('CANNON ring-width px:', w, 'height px:', h,
      'pivot approx (cx, bottom-w/2):', (round(cx, 1), round(pivot_y, 1)),
      'stub tip y:', bbox[1], 'stub length above pivot:', round(pivot_y - bbox[1], 1))
d = os.path.join(OUT, 'cannon')
os.makedirs(d, exist_ok=True)
rgba.crop((bbox[0], bbox[1], bbox[2] + 1, bbox[3] + 1)).save(os.path.join(d, 'raw.png'))

# thumb: flood + resize to 112x112
tim = Image.open(os.path.join(SRC,
    'media-generation-madara-thumb-0-92831e4d-0ae8-40af-88ee-903ce48d5837.png'))
trgba = despeckle(flood_alpha(tim), min_size=1000)
ta = np.array(trgba.getchannel('A')) > 10
tys, txs = np.where(ta)
tbox = (int(txs.min()), int(tys.min()), int(txs.max()), int(tys.max()))
print('THUMB bbox:', tbox, 'size:', tim.size)
tcrop = trgba.crop((tbox[0], tbox[1], tbox[2] + 1, tbox[3] + 1))
tw, th = tcrop.size
s = min(112 / tw, 112 / th)
tcrop = tcrop.resize((max(1, round(tw * s)), max(1, round(th * s))), Image.LANCZOS)
canvas = Image.new('RGBA', (112, 112), (0, 0, 0, 0))
canvas.alpha_composite(tcrop, ((112 - tcrop.size[0]) // 2, (112 - tcrop.size[1]) // 2))
canvas.save(os.path.join(OUT, 'thumb_10000117.png'))
print('THUMB saved 112x112')

# icons: check sizes, copy to 200x200 webp
import glob
for f in sorted(glob.glob(os.path.join(SRC, 'media-generation-madara-icon-*.webp'))):
    im2 = Image.open(f)
    print('ICON', os.path.basename(f), im2.size, im2.mode)
    if im2.size != (200, 200):
        im2 = im2.resize((200, 200), Image.LANCZOS)
    im2.save(os.path.join(OUT, os.path.basename(f).replace('media-generation-', '')))

print('REPORT:')
print(json.dumps(full, indent=1))
