#!/usr/bin/env python3
"""Re-extract body frames as whole-sheet connected components.
The model drew tanks straddling the 560px panel grid, so fixed-boundary
slicing cut them. Here each tank is one connected component; W/NW are
horizontal flips of the E/NE components (the tank is left-right symmetric
in design). Only panels 1-6 (x < 3360) are used; the edit-mangled panels
7-8 are discarded.
"""
import os
from PIL import Image
import numpy as np
from scipy import ndimage

SRC = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(SRC, 'frames')


def extract_tanks(sheet_path, tag):
    im = Image.open(sheet_path).convert('RGB')
    W, H = im.size
    print(tag, 'sheet size:', im.size)
    gray = np.array(im.convert('L'))
    mask = gray < 240
    lab, n = ndimage.label(mask)
    sizes = ndimage.sum_labels(mask, lab, range(1, n + 1))
    comps = []
    for i, s in enumerate(sizes, start=1):
        if s < 5000:
            continue
        ys, xs = np.where(lab == i)
        cx = xs.mean()
        if cx >= W * 0.75:  # panels 7-8 region: mangled / derived, skip
            continue
        comps.append((cx, i, int(s), (xs.min(), ys.min(), xs.max(), ys.max())))
    comps.sort(key=lambda t: t[0])
    print(tag, 'big components in panels 1-6:', len(comps))
    for cx, i, s, bb in comps:
        print('  cx=%.0f px=%d bbox=%s' % (cx, s, bb))
    assert 4 <= len(comps) <= 5, 'expected 4-5 tanks, got %d' % len(comps)
    names = ['N', 'NE', 'E', 'SE', 'S'][:len(comps)]
    arr = np.array(im)
    frames = {}
    for (cx, i, s, (x0, y0, x1, y1)), name in zip(comps, names):
        comp = (lab[y0:y1 + 1, x0:x1 + 1] == i)
        filled = ndimage.binary_fill_holes(comp)
        # alpha: filled component = opaque; feather 2px at the boundary
        alpha = np.where(filled, 255, 0).astype(np.float32)
        band = ndimage.binary_dilation(filled, iterations=2) & ~filled
        # soft edge: pixels just outside the mask that are dark-ish get partial alpha
        edge_dark = np.clip((240 - gray[y0:y1 + 1, x0:x1 + 1].astype(np.float32)) / 60, 0, 1) * 255
        alpha[band] = np.maximum(alpha[band], edge_dark[band] * 0.5)
        rgba = np.dstack([arr[y0:y1 + 1, x0:x1 + 1], alpha.astype(np.uint8)])
        frames[name] = Image.fromarray(rgba, 'RGBA')
    # Derive the missing directions from the clean ones (top-down sprite:
    # opposite directions are 180-degree rotations; side views mirror).
    # SW = NE rotated 180 (nose down-left), W = E flipped (nose left, tracks stay
    # down), NW = NE flipped (nose up-left). S is real when present, else N rotated.
    if 'S' not in frames:
        frames['S'] = frames['N'].transpose(Image.ROTATE_180)
    frames['SW'] = frames['NE'].transpose(Image.ROTATE_180)
    frames['W'] = frames['E'].transpose(Image.FLIP_LEFT_RIGHT)
    frames['NW'] = frames['NE'].transpose(Image.FLIP_LEFT_RIGHT)
    order = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
    d = os.path.join(OUT, 'body%s' % tag)
    os.makedirs(d, exist_ok=True)
    for k, name in enumerate(order):
        f = frames[name]
        # trim + centre into a 150x150 cell, content max 140
        a = np.array(f.getchannel('A')) > 10
        ys, xs = np.where(a)
        crop = f.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))
        w, h = crop.size
        s = min(140 / w, 140 / h, 1.0)
        if s < 1.0:
            crop = crop.resize((max(1, round(w * s)), max(1, round(h * s))), Image.LANCZOS)
        cell = Image.new('RGBA', (150, 150), (0, 0, 0, 0))
        cell.alpha_composite(crop, ((150 - crop.size[0]) // 2, (150 - crop.size[1]) // 2))
        cell.save(os.path.join(d, 'f%d.png' % k))
        print('  %s -> f%d.png content %dx%d (orig %dx%d)' % (name, k, crop.size[0], crop.size[1], w, h))
    return frames


A3 = 'media-generation-madara-body-a3-0-ba210f85-1352-424a-9aa4-66467dbded15.png'
B = 'media-generation-madara-body-b-0-17a51f5f-515a-4bcd-b9e3-0f4cefe08f5e.png'
extract_tanks(os.path.join(SRC, A3), 'A2')
extract_tanks(os.path.join(SRC, B), 'B2')
print('done')
