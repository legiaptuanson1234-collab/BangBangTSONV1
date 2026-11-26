#!/usr/bin/env python3
"""Pack frames/ into game-layout atlases + manifests under assets/madara/.
Mirrors original manifest formats (c/ body+cannon, e/bullet png_strip,
e/blow|use|buff|destroy swf_atlas, e/tail png_strip). Verifies outputs.
"""
import json, os, shutil
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(
    os.path.dirname(os.path.abspath(__file__)))))
# ROOT = .../bangbang-ban-drive
MAD = os.path.join(ROOT, 'assets', 'madara')
SRC = os.path.join(MAD, 'src', 'frames')
GAME = os.path.join(ROOT, 'assets')  # reference originals


def load_frames(sub, n):
    return [Image.open(os.path.join(SRC, sub, 'f%d.png' % i)) for i in range(n)]


def pack(frames, cols, out_webp, gutter=1):
    """Pack RGBA frames (square or rectangular) into an atlas; return (atlas, rects).
    Each frame is centred in its grid cell; rect is the frame's true box."""
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


def swf_manifest(rects, pivots, webp_rel, size):
    return {
        'count': len(rects),
        'format': 'swf_atlas',
        'frames': [{'page': 0, 'pivot': pivots[i], 'rect': rects[i]}
                   for i in range(len(rects))],
        'pages': [{'file': webp_rel, 'size': list(size)}],
        'stage': [1, 1],
    }


def strip_manifest(rects, webp_rel, size, pivots=None):
    return {
        'count': len(rects),
        'format': 'png_strip',
        'frames': [{'page': 0, 'pivot': (pivots[i] if pivots else [0, 0]),
                    'rect': rects[i]} for i in range(len(rects))],
        'pages': [{'file': webp_rel, 'size': list(size)}],
        'stage': [0, 0],
    }


def write_json(path, obj):
    with open(path, 'w') as f:
        json.dump(obj, f, separators=(',', ':'))


def c_manifest(rects, pivots, webp_rel, size, ref_json, timeline_clips):
    ref = json.load(open(os.path.join(GAME, ref_json)))
    return {
        'cell_size': [150, 150],
        'frames': [{'page': 0, 'pivot': pivots[i], 'rect': rects[i]}
                   for i in range(len(rects))],
        'pages': [{'file': webp_rel, 'size': list(size)}],
        'runtime': ref.get('runtime'),
        'timeline': {'clips': timeline_clips},
        'xml': ref.get('xml'),
    }


results = []

# ---- 1. BODY: 16 frames interleaved A/B per direction ----
A = load_frames('bodyA2', 8)
# B frames are the PIL tread-roll of A (frames/bodyBpil): the model's B re-render
# diverged per direction (hull morphing), the roll moves only the treads.
B = load_frames('bodyBpil', 8)
body_frames = []
for d in range(8):
    body_frames += [A[d], B[d]]
atlas, rects = pack(body_frames, 8, os.path.join(MAD, 'c', '2000001-0.webp'))
pivots = [[75, 75]] * 16
clips = [{'angle_degrees': d * 45, 'frames': [d * 2, d * 2 + 1]} for d in range(8)]
write_json(os.path.join(MAD, 'c', '2000001.json'),
           c_manifest(rects, pivots, '2000001-0.webp', atlas.size,
                      'c/5426.json', clips))
results.append(('body c/2000001', atlas.size, 16, 'interleaved A/B, pivot [75,75]'))

# ---- 2. CANNON: scale raw crop so ring width = 52px ----
raw = Image.open(os.path.join(SRC, 'cannon', 'raw.png'))
# raw bbox was (263,61,1336,1443) -> crop is 1074x1383, ring width 1074, pivot (536.5,845)
s = 52 / 1074
cw, ch = max(1, round(raw.size[0] * s)), max(1, round(raw.size[1] * s))
cannon = raw.resize((cw, ch), Image.LANCZOS)
pivot = [round(536.5 * s), round(845 * s)]
atlas, rects = pack([cannon], 1, os.path.join(MAD, 'c', '2000002-0.webp'))
write_json(os.path.join(MAD, 'c', '2000002.json'),
           c_manifest(rects, [pivot], '2000002-0.webp', atlas.size,
                      'c/5045.json', [{'angle_degrees': 0, 'frames': [0]}]))
results.append(('cannon c/2000002', atlas.size, 1,
                'frame %dx%d pivot %s (ring 52px, stub tip ~%dpx above pivot)'
                % (cw, ch, pivot, pivot[1])))

# ---- 3. BULLET ----
atlas, rects = pack(load_frames('bullet', 4), 4,
                    os.path.join(MAD, 'e', 'bullet', 'bullet_madara@4-0.webp'))
write_json(os.path.join(MAD, 'e', 'bullet', 'bullet_madara@4.json'),
           strip_manifest(rects, 'bullet/bullet_madara@4-0.webp', atlas.size))
results.append(('bullet bullet_madara@4', atlas.size, 4, 'png_strip pivot [0,0]'))

# ---- 4. BLOW ----
atlas, rects = pack(load_frames('blow', 6), 6,
                    os.path.join(MAD, 'e', 'blow', 'blow_madara-0.webp'))
write_json(os.path.join(MAD, 'e', 'blow', 'blow_madara.json'),
           swf_manifest(rects, [[48, 48]] * 6, 'blow/blow_madara-0.webp', atlas.size))
results.append(('blow blow_madara', atlas.size, 6, 'swf_atlas pivot [48,48]'))

# ---- 5-9. EFFECTS (swf_atlas, pivot = frame centre) ----
EFFECTS = [
    ('q_fire', 8, 256, 'e/use/use_madara_q.json', 'use/use_madara_q-0.webp',
     'use/use_madara_q'),
    ('e_slash', 8, 256, 'e/use/use_madara_e.json', 'use/use_madara_e-0.webp',
     'use/use_madara_e'),
    ('r_meteor', 6, 192, 'e/use/use_madara_r_meteor.json',
     'use/use_madara_r_meteor-0.webp', 'use/use_madara_r_meteor'),
    ('r_blast', 8, 256, 'e/use/use_madara_r_blast.json',
     'use/use_madara_r_blast-0.webp', 'use/use_madara_r_blast'),
    ('space_armor', 8, 256, 'e/buff/buff_madara_space.json',
     'buff/buff_madara_space-0.webp', 'buff/buff_madara_space'),
    ('death', 8, 256, 'e/destroy/destroy_madara.json',
     'destroy/destroy_madara-0.webp', 'destroy/destroy_madara'),
]
for sub, n, cell, man_rel, webp_rel, key in EFFECTS:
    frames = load_frames(sub, n)
    out_webp = os.path.join(MAD, 'e', webp_rel)
    atlas, rects = pack(frames, n, out_webp)
    write_json(os.path.join(MAD, man_rel),
               swf_manifest(rects, [[cell // 2, cell // 2]] * n, webp_rel, atlas.size))
    results.append((key, atlas.size, n, 'swf_atlas pivot [%d,%d]' % (cell // 2, cell // 2)))

# ---- 10. TAIL ----
atlas, rects = pack(load_frames('tail', 4), 4,
                    os.path.join(MAD, 'e', 'tail', 'tail_madara@4-0.webp'))
write_json(os.path.join(MAD, 'e', 'tail', 'tail_madara@4.json'),
           strip_manifest(rects, 'tail/tail_madara@4-0.webp', atlas.size))
results.append(('tail tail_madara@4', atlas.size, 4, 'png_strip pivot [0,0]'))

# ---- 11. THUMB ----
shutil.copy(os.path.join(SRC, 'thumb_10000117.png'),
            os.path.join(MAD, 'thumb', '10000117.png'))
results.append(('thumb 10000117.png', (112, 112), 1, 'RGBA PNG'))

# ---- 12. ICONS (already 200x200 webp) ----
import glob
for slot, src_pat in [('q', 'madara-icon-q-*.webp'), ('e', 'madara-icon-e-*.webp'),
                      ('r', 'madara-icon-r-*.webp'), ('space', 'madara-icon-space-*.webp')]:
    f = glob.glob(os.path.join(SRC, src_pat))[0]
    im = Image.open(f)
    assert im.size == (200, 200), (f, im.size)
    shutil.copy(f, os.path.join(MAD, 'i', 's4', 'madara_%s.webp' % slot))
    results.append(('icon madara_%s.webp' % slot, im.size, 1, 'webp 200x200'))

# ---- VERIFY ----
print('=== VERIFY ===')
ok = True
for name, size, n, note in results:
    print('%-28s size=%s frames=%d %s' % (name, size, n, note))
# every manifest parses; every rect inside its atlas; every webp loads with alpha
import glob as _g
for jf in sorted(_g.glob(os.path.join(MAD, '**', '*.json'), recursive=True)):
    d = json.load(open(jf))
    rel = os.path.relpath(jf, MAD)
    pages = d.get('pages', [])
    for p in pages:
        # pages file is relative to assets/e/ for e/ manifests ('use/x-0.webp'),
        # or bare filename for c/ manifests (same dir as the manifest)
        if '/' in p['file']:
            wp = os.path.join(MAD, 'e', p['file'])
        else:
            wp = os.path.join(os.path.dirname(jf), p['file'])
        im = Image.open(wp)
        assert list(im.size) == list(p['size']), (jf, im.size, p['size'])
        assert im.mode == 'RGBA', (jf, im.mode)
        for fr in d['frames']:
            x, y, w, h = fr['rect']
            assert 0 <= x and 0 <= y and x + w <= im.size[0] and y + h <= im.size[1], (jf, fr)
    print('OK', rel, 'frames=%d' % len(d['frames']))
print('ALL VERIFIED')
